import { makeRoutine, makeStep } from '../../../testing/factories';
import {
  abandonExecution,
  addStepTime,
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
    // untimed step -> no running timer
    expect(exec.stepStartedAt).toBeNull();

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
    exec = addStepTime(exec, 60, at(20));
    // elapsed 20 - 60 -> clamped to 0
    expect(stepElapsedSeconds(exec, at(20))).toBe(0);
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
});
