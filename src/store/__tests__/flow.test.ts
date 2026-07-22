import { makeRoutine, makeStep } from '../../testing/factories';
import { useAppStore } from '../appStore';
import { useExecutionStore } from '../executionStore';

const DATE = '2026-07-22';

function resetStores(): void {
  useAppStore.setState({
    initialized: true,
    loading: false,
    error: null,
    today: DATE,
    routines: [],
    overrides: [],
    completions: [],
    todayExecutions: [],
  });
  useExecutionStore.getState().clear();
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
    useAppStore.setState({ routines: [routine] });

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
    useAppStore.setState({ routines: [routine] });

    await useExecutionStore.getState().start(routine, DATE);
    await useExecutionStore.getState().pause();
    expect(useExecutionStore.getState().execution?.status).toBe('paused');

    await useExecutionStore.getState().resume();
    expect(useExecutionStore.getState().execution?.status).toBe('active');
    expect(useAppStore.getState().todayExecutions).toHaveLength(1);
  });

  it('records only one completion per routine per day', async () => {
    const routine = makeRoutine({ id: 'r3', steps: [makeStep({ id: 'only', order: 0 })] });
    useAppStore.setState({ routines: [routine] });

    await useExecutionStore.getState().start(routine, DATE);
    await useExecutionStore.getState().completeStep();
    await useExecutionStore.getState().start(routine, DATE);
    await useExecutionStore.getState().completeStep();

    expect(useAppStore.getState().completions).toHaveLength(1);
  });
});
