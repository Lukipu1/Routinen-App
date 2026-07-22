import { createEmptyDraft } from '../draft';
import { validateRoutineDraft } from '../validation';

function validDraft() {
  const draft = createEmptyDraft();
  draft.title = 'Morgenroutine';
  draft.steps = [
    { id: 's1', title: 'Aufstehen', note: '', durationInSeconds: null, canSkip: true },
  ];
  return draft;
}

describe('validateRoutineDraft', () => {
  it('accepts a well-formed draft', () => {
    expect(validateRoutineDraft(validDraft()).valid).toBe(true);
  });

  it('rejects an empty title', () => {
    const draft = validDraft();
    draft.title = '   ';
    const result = validateRoutineDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeDefined();
  });

  it('requires at least one named step', () => {
    const draft = validDraft();
    draft.steps = [{ id: 's1', title: '', note: '', durationInSeconds: null, canSkip: true }];
    const result = validateRoutineDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.steps).toBeDefined();
  });

  it('rejects a non-positive duration', () => {
    const draft = validDraft();
    draft.steps = [{ id: 's1', title: 'Test', note: '', durationInSeconds: 0, canSkip: true }];
    const result = validateRoutineDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.stepTitles?.s1).toBeDefined();
  });

  it('rejects an invalid start time', () => {
    const draft = validDraft();
    draft.schedule = { ...draft.schedule, flexible: false, startTime: '25:00' };
    const result = validateRoutineDraft(draft);
    expect(result.valid).toBe(false);
    expect(result.errors.schedule).toBeDefined();
  });
});
