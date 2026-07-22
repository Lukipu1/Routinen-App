import {
  addStep,
  createEmptyDraft,
  duplicateStep,
  estimateDuration,
  moveStep,
  removeStep,
  routineFromDraft,
} from '../draft';

describe('routine draft helpers', () => {
  it('estimates duration from timed steps only', () => {
    expect(
      estimateDuration([
        { durationInSeconds: 60 },
        { durationInSeconds: null },
        { durationInSeconds: 300 },
      ]),
    ).toBe(360);
  });

  it('adds, removes and duplicates steps immutably', () => {
    let draft = createEmptyDraft();
    const firstId = draft.steps[0]!.id;
    draft = addStep(draft);
    expect(draft.steps).toHaveLength(2);

    draft = duplicateStep(draft, firstId);
    expect(draft.steps).toHaveLength(3);
    // Duplicated step gets a fresh id.
    expect(draft.steps[1]!.id).not.toBe(firstId);

    draft = removeStep(draft, firstId);
    expect(draft.steps.find((s) => s.id === firstId)).toBeUndefined();
  });

  it('reorders steps', () => {
    let draft = createEmptyDraft();
    draft.steps = [
      { id: 'a', title: 'A', note: '', durationInSeconds: null, canSkip: true },
      { id: 'b', title: 'B', note: '', durationInSeconds: null, canSkip: true },
      { id: 'c', title: 'C', note: '', durationInSeconds: null, canSkip: true },
    ];
    draft = moveStep(draft, 0, 2);
    expect(draft.steps.map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('converts a draft into a routine with ordered steps and totals', () => {
    const draft = createEmptyDraft();
    draft.title = '  Morgen  ';
    draft.steps = [
      { id: 'a', title: 'Wach werden', note: '', durationInSeconds: 60, canSkip: true },
      { id: 'b', title: 'Wasser', note: 'Ein Glas', durationInSeconds: null, canSkip: true },
    ];
    const routine = routineFromDraft(draft, new Date('2026-07-22T07:00:00.000Z'));
    expect(routine.title).toBe('Morgen');
    expect(routine.estimatedDuration).toBe(60);
    expect(routine.steps.map((s) => s.order)).toEqual([0, 1]);
    expect(routine.steps[0]!.completionType).toBe('timed');
    expect(routine.steps[1]!.completionType).toBe('manual');
    expect(routine.steps[1]!.note).toBe('Ein Glas');
  });
});
