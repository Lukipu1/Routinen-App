import { makeRoutine, makeStep } from '../../../testing/factories';
import {
  abandonExecution,
  addStepTime,
  executionProgress,
  goBackStep,
  isResumableRun,
  isStepTimerFinished,
  reconcileExecution,
  remainingTotalSeconds,
  reopenLastStep,
  buildCompletion,
  completeStep,
  pauseExecution,
  resumeExecution,
  skipStep,
  startExecution,
  stepElapsedSeconds,
  stepRemainingSeconds,
} from '../executionLogic';

const T0 = new Date('2026-07-22T07:00:00.000Z');
const at = (seconds: number): Date => new Date(T0.getTime() + seconds * 1000);

function routine3() {
  return makeRoutine({
    id: 'r1',
    steps: [
      makeStep({ id: 's0', order: 0, durationInSeconds: 60 }),
      makeStep({ id: 's1', order: 1, durationInSeconds: null }),
      makeStep({ id: 's2', order: 2, durationInSeconds: 30 }),
    ],
  });
}

describe('executionLogic', () => {
  it('starts at the first step with the timer running', () => {
    const routine = routine3();
    const exec = startExecution(routine, '2026-07-22', T0);
    expect(exec.currentStepIndex).toBe(0);
    expect(exec.status).toBe('active');
    expect(exec.stepStartedAt).toBe(T0.toISOString());
  });

  it('completes and skips steps, finishing after the last', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    exec = completeStep(routine, exec, at(10));
    expect(exec.completedStepIds).toEqual(['s0']);
    expect(exec.currentStepIndex).toBe(1);
    // untimed steps still track time for the recorded duration
    expect(exec.stepStartedAt).toBe(at(10).toISOString());
    expect(exec.activeSeconds).toBe(10);

    exec = skipStep(routine, exec, at(15));
    expect(exec.skippedStepIds).toEqual(['s1']);
    expect(exec.currentStepIndex).toBe(2);

    exec = completeStep(routine, exec, at(20));
    expect(exec.status).toBe('completed');
    expect(exec.completedAt).toBe(at(20).toISOString());
    expect(exec.completedStepIds).toEqual(['s0', 's2']);
  });

  it('tracks elapsed time and freezes it while paused', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    expect(stepElapsedSeconds(exec, at(10))).toBe(10);

    exec = pauseExecution(exec, at(10));
    expect(exec.status).toBe('paused');
    expect(exec.stepStartedAt).toBeNull();
    // Frozen regardless of wall clock.
    expect(stepElapsedSeconds(exec, at(999))).toBe(10);

    exec = resumeExecution(routine, exec, at(30));
    expect(exec.status).toBe('active');
    expect(stepElapsedSeconds(exec, at(40))).toBe(20);
    expect(stepRemainingSeconds(routine, exec, at(40))).toBe(40);
  });

  it('adds extra time by rewinding the elapsed timer', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    exec = addStepTime(routine, exec, 60, at(20));
    // elapsed 20 - 60 -> clamped to 0
    expect(stepElapsedSeconds(exec, at(20))).toBe(0);
  });

  it('grants a full extra minute even after the step has overrun', () => {
    const routine = routine3(); // first step: 60 s
    let exec = startExecution(routine, '2026-07-22', T0);
    // 3 minutes in: overrun by 120 s.
    exec = addStepTime(routine, exec, 60, at(180));
    expect(stepRemainingSeconds(routine, exec, at(180))).toBe(60);
    // The overrun is still counted towards the routine's active time.
    expect(exec.activeSeconds).toBe(120);
  });

  it('excludes paused time from the recorded duration', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    exec = pauseExecution(exec, at(10));
    exec = resumeExecution(routine, exec, at(1000)); // long pause
    exec = completeStep(routine, exec, at(1010));
    exec = completeStep(routine, exec, at(1020));
    exec = completeStep(routine, exec, at(1030));
    expect(buildCompletion(routine, exec, at(1030)).durationInSeconds).toBe(40);
  });

  it('does not start a clock when a step is completed while paused', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    exec = pauseExecution(exec, at(10));
    exec = completeStep(routine, exec, at(20));
    expect(exec.status).toBe('paused');
    expect(exec.stepStartedAt).toBeNull();
    expect(stepElapsedSeconds(exec, at(999))).toBe(0);
  });

  it('steps back and un-marks the previous step', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    exec = completeStep(routine, exec, at(10));
    exec = skipStep(routine, exec, at(20));
    exec = goBackStep(routine, exec, at(25));
    expect(exec.currentStepIndex).toBe(1);
    expect(exec.skippedStepIds).toEqual([]);
    expect(exec.completedStepIds).toEqual(['s0']);
    expect(exec.activeSeconds).toBe(25);
    // Cannot go back from the first step.
    exec = goBackStep(routine, goBackStep(routine, exec, at(30)), at(30));
    expect(exec.currentStepIndex).toBe(0);
  });

  it('reopens a finished run on its last step', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    exec = completeStep(routine, exec, at(10));
    exec = completeStep(routine, exec, at(20));
    exec = completeStep(routine, exec, at(30));
    expect(exec.status).toBe('completed');
    exec = reopenLastStep(routine, exec, at(40));
    expect(exec.status).toBe('active');
    expect(exec.currentStepIndex).toBe(2);
    expect(exec.completedStepIds).toEqual(['s0', 's1']);
    expect(exec.completedAt).toBeNull();
  });

  it('does not count a run as completed when every step was skipped', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    exec = skipStep(routine, exec, at(1));
    exec = skipStep(routine, exec, at(2));
    exec = skipStep(routine, exec, at(3));
    expect(exec.status).toBe('completed');
    expect(buildCompletion(routine, exec, at(3)).completed).toBe(false);
  });

  it('reconstructs elapsed time from stored timestamps (restart safe)', () => {
    const routine = routine3();
    const exec = startExecution(routine, '2026-07-22', T0);
    // Simulate app restart: only the stored object survives.
    const restored = { ...exec };
    expect(stepElapsedSeconds(restored, at(25))).toBe(25);
  });

  it('builds a completion for a finished run', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    exec = completeStep(routine, exec, at(10));
    exec = completeStep(routine, exec, at(20));
    exec = completeStep(routine, exec, at(30));
    const completion = buildCompletion(routine, exec, at(30));
    expect(completion.completed).toBe(true);
    expect(completion.completedSteps).toBe(3);
    expect(completion.totalSteps).toBe(3);
    expect(completion.durationInSeconds).toBe(30);
  });

  it('records an abandoned run as not completed', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    exec = completeStep(routine, exec, at(10));
    exec = abandonExecution(exec, at(15));
    const completion = buildCompletion(routine, exec, at(15));
    expect(exec.status).toBe('abandoned');
    expect(completion.completed).toBe(false);
    expect(completion.completedSteps).toBe(1);
  });

  it('reports timer end, progress and remaining total time', () => {
    const routine = routine3(); // 60 s, untimed, 30 s
    let exec = startExecution(routine, '2026-07-22', T0);
    expect(isStepTimerFinished(routine, exec, at(30))).toBe(false);
    expect(isStepTimerFinished(routine, exec, at(60))).toBe(true);
    expect(remainingTotalSeconds(routine, exec, at(30))).toBe(30 + 30);
    expect(executionProgress(routine, exec)).toBe(0);
    exec = completeStep(routine, exec, at(60));
    expect(isStepTimerFinished(routine, exec, at(999))).toBe(false); // untimed step
    expect(remainingTotalSeconds(routine, exec, at(70))).toBe(30);
    expect(executionProgress(routine, exec)).toBeCloseTo(1 / 3);
    exec = skipStep(routine, exec, at(80));
    expect(executionProgress(routine, exec)).toBeCloseTo(2 / 3);
  });

  it('treats only recent or same-day live runs as resumable', () => {
    const routine = routine3();
    const today = '2026-07-22';
    const live = startExecution(routine, today, T0);
    expect(isResumableRun(live, today, at(10))).toBe(true);
    const yesterdayRecent = { ...live, scheduledDate: '2026-07-21' };
    expect(isResumableRun(yesterdayRecent, today, at(60 * 60))).toBe(true); // 1 h ago
    expect(isResumableRun(yesterdayRecent, today, at(5 * 60 * 60))).toBe(false); // 5 h ago
    const done = completeStep(routine, completeStep(routine, completeStep(routine, live, at(1)), at(2)), at(3));
    expect(isResumableRun(done, today, at(4))).toBe(false);
  });

  it('reconciles a paused run with an edited routine', () => {
    const routine = routine3();
    let exec = startExecution(routine, '2026-07-22', T0);
    exec = completeStep(routine, exec, at(10));
    exec = pauseExecution(exec, at(20));
    // Unchanged routine: nothing to do (same object back).
    expect(reconcileExecution(routine, exec, at(30))).toBe(exec);
    // First step removed: index shifts to the first unhandled step.
    const edited = { ...routine, steps: routine.steps.slice(1) };
    const aligned = reconcileExecution(edited, exec, at(30));
    expect(aligned.currentStepIndex).toBe(0);
    expect(aligned.completedStepIds).toEqual([]);
    expect(aligned.stepStartedAt).toBeNull(); // still paused
    // Every remaining step already handled: the run finishes.
    const onlyDone = { ...routine, steps: routine.steps.slice(0, 1) };
    expect(reconcileExecution(onlyDone, exec, at(30)).status).toBe('completed');
    // Finished runs are left alone.
    const abandoned = abandonExecution(exec, at(40));
    expect(reconcileExecution(edited, abandoned, at(50))).toBe(abandoned);
  });
});
