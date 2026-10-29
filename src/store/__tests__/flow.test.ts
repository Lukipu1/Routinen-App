import * as db from '../../database';
import { makeRoutine, makeStep } from '../../testing/factories';
import type { Routine } from '../../types/routine';
import { useAppStore } from '../appStore';
import { useExecutionStore } from '../executionStore';

const DATE = '2026-07-22';

async function resetStores(): Promise<void> {
  (jest.requireMock('expo-sqlite') as { reset: () => void }).reset();
  db.resetDatabaseHandle();
  useAppStore.setState({
    initialized: true,
    loading: false,
    error: null,
    today: DATE,
    routines: [],
    overrides: [],
    completions: [],
    todayExecutions: [],
    dayPlans: {},
  });
  useExecutionStore.getState().clear();
}

/** Puts a routine both in the database (for foreign keys) and in the store. */
async function addRoutine(routine: Routine): Promise<void> {
  await db.saveRoutine(routine);
  useAppStore.setState({ routines: [...useAppStore.getState().routines, routine] });
}

describe('run flow (store integration)', () => {
  beforeEach(resetStores);

  it('starts, advances and finishes a routine, recording a completion', async () => {
    const routine = makeRoutine({
      id: 'r1',
      steps: [
        makeStep({ id: 's0', order: 0, durationInSeconds: 60 }),
        makeStep({ id: 's1', order: 1, durationInSeconds: null }),
      ],
    });
    await addRoutine(routine);

    await useExecutionStore.getState().start(routine, DATE);
    expect(useExecutionStore.getState().execution?.status).toBe('active');
    expect(useAppStore.getState().todayExecutions).toHaveLength(1);

    await useExecutionStore.getState().completeStep();
    expect(useExecutionStore.getState().execution?.currentStepIndex).toBe(1);
    expect(useExecutionStore.getState().finished).toBeNull();

    await useExecutionStore.getState().completeStep();
    const finished = useExecutionStore.getState().finished;
    expect(finished?.completed).toBe(true);
    expect(useAppStore.getState().completions).toHaveLength(1);
    expect(useAppStore.getState().completions[0]?.routineId).toBe('r1');
  });

  it('pauses and resumes, keeping a single execution record', async () => {
    const routine = makeRoutine({ id: 'r2' });
    await addRoutine(routine);

    await useExecutionStore.getState().start(routine, DATE);
    await useExecutionStore.getState().pause();
    expect(useExecutionStore.getState().execution?.status).toBe('paused');

    await useExecutionStore.getState().resume();
    expect(useExecutionStore.getState().execution?.status).toBe('active');
    expect(useAppStore.getState().todayExecutions).toHaveLength(1);
  });

  it('records only one completion per routine per day', async () => {
    const routine = makeRoutine({ id: 'r3', steps: [makeStep({ id: 'only', order: 0 })] });
    await addRoutine(routine);

    await useExecutionStore.getState().start(routine, DATE);
    await useExecutionStore.getState().completeStep();
    await useExecutionStore.getState().start(routine, DATE);
    await useExecutionStore.getState().completeStep();

    expect(useAppStore.getState().completions).toHaveLength(1);
    expect(await db.getAllCompletions()).toHaveLength(1);
  });

  it('keeps history when the routine is edited afterwards', async () => {
    const routine = makeRoutine({ id: 'r4', steps: [makeStep({ id: 'only', order: 0 })] });
    await addRoutine(routine);
    await useExecutionStore.getState().start(routine, DATE);
    await useExecutionStore.getState().completeStep();

    await useAppStore.getState().saveRoutine({ ...routine, title: 'Neu' });
    await useAppStore.getState().toggleRoutineActive('r4');

    expect(await db.getAllCompletions()).toHaveLength(1);
    expect(await db.getExecutionsForDate(DATE)).toHaveLength(1);
  });

  it('serialises concurrent actions so a quick "Erledigt" then "Pause" cannot un-finish a run', async () => {
    const routine = makeRoutine({ id: 'r5', steps: [makeStep({ id: 'only', order: 0 })] });
    await addRoutine(routine);
    await useExecutionStore.getState().start(routine, DATE);

    await Promise.all([
      useExecutionStore.getState().completeStep(),
      useExecutionStore.getState().pause(),
    ]);

    expect(useExecutionStore.getState().execution?.status).toBe('completed');
    expect((await db.getExecutionsForDate(DATE))[0]?.status).toBe('completed');
  });

  it('handles a double tap on "Erledigt" as two steps, not one', async () => {
    const routine = makeRoutine({
      id: 'r6',
      steps: [makeStep({ id: 'a', order: 0 }), makeStep({ id: 'b', order: 1 }), makeStep({ id: 'c', order: 2 })],
    });
    await addRoutine(routine);
    await useExecutionStore.getState().start(routine, DATE);

    await Promise.all([
      useExecutionStore.getState().completeStep(),
      useExecutionStore.getState().completeStep(),
    ]);

    expect(useExecutionStore.getState().execution?.currentStepIndex).toBe(2);
  });

  it('continues an edited routine at the first unhandled step when re-attached', async () => {
    const routine = makeRoutine({
      id: 'r7',
      steps: [makeStep({ id: 'a', order: 0 }), makeStep({ id: 'b', order: 1 }), makeStep({ id: 'c', order: 2 })],
    });
    await addRoutine(routine);
    await useExecutionStore.getState().start(routine, DATE);
    await useExecutionStore.getState().completeStep();
    await useExecutionStore.getState().pause();
    const paused = useExecutionStore.getState().execution!;

    // Steps "a" and "b" removed while paused; stored index 1 would now be off.
    const edited: Routine = { ...routine, steps: [makeStep({ id: 'c', order: 0 })] };
    await useAppStore.getState().saveRoutine(edited);
    await useExecutionStore.getState().attach(edited, paused);

    const execution = useExecutionStore.getState().execution!;
    expect(execution.currentStepIndex).toBe(0);
    expect(execution.completedStepIds).toEqual([]);
    await useExecutionStore.getState().resume();
    await useExecutionStore.getState().completeStep();
    expect(useExecutionStore.getState().finished?.completed).toBe(true);
  });
});

describe('app store lifecycle', () => {
  beforeEach(resetStores);

  it('closes a live run left over from an earlier day when the day rolls over', async () => {
    const routine = makeRoutine({ id: 'r8' });
    await addRoutine(routine);
    await db.saveExecution({
      id: 'old',
      routineId: 'r8',
      scheduledDate: '2026-07-20',
      startedAt: '2026-07-20T07:00:00.000Z',
      completedAt: null,
      currentStepIndex: 0,
      completedStepIds: [],
      skippedStepIds: [],
      status: 'paused',
      stepStartedAt: null,
      accumulatedStepSeconds: 30,
      activeSeconds: 0,
    });
    useAppStore.setState({ today: '2000-01-01' }); // force a rollover

    await useAppStore.getState().ensureToday();

    expect(await db.getLiveExecutions()).toHaveLength(0);
    const completions = await db.getAllCompletions();
    expect(completions).toHaveLength(1);
    expect(completions[0]).toMatchObject({ routineId: 'r8', date: '2026-07-20', completed: false });
    expect(await useExecutionStore.getState().restore()).toBe(false);
  });

  it('does not bring sample data back after "Alle Daten löschen"', async () => {
    await useAppStore.getState().seedSampleData();
    expect(useAppStore.getState().routines).toHaveLength(3);

    await useAppStore.getState().clearAllData();
    expect(useAppStore.getState().routines).toHaveLength(0);

    await useAppStore.getState().seedSampleData();
    expect(useAppStore.getState().routines).toHaveLength(0);
    useAppStore.setState({ initialized: false });
    await useAppStore.getState().initialize();
    expect(useAppStore.getState().routines).toHaveLength(0);
  });

  it('seeds samples without the template the user already chose', async () => {
    await useAppStore.getState().seedSampleData(['morning']);
    const titles = useAppStore.getState().routines.map((r) => r.title).sort();
    expect(titles).toEqual(['Abendroutine', 'Lernroutine']);
  });

  it('surfaces a startup failure instead of hanging', async () => {
    const sqlite = jest.requireMock('expo-sqlite') as { failNextOpen: (error: Error) => void };
    sqlite.failNextOpen(new Error('Platte voll'));
    useAppStore.setState({ initialized: false });

    await useAppStore.getState().initialize();
    expect(useAppStore.getState().error).toBe('Platte voll');
    expect(useAppStore.getState().initialized).toBe(false);

    // A retry gets a fresh attempt (the failed open was not cached).
    await useAppStore.getState().initialize();
    expect(useAppStore.getState().error).toBeNull();
    expect(useAppStore.getState().initialized).toBe(true);
  });
});
