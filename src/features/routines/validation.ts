import type { RoutineDraft } from './draft';

export interface RoutineValidationResult {
  valid: boolean;
  /** Field-level, human-readable German error messages. */
  errors: {
    title?: string;
    steps?: string;
    schedule?: string;
    stepTitles?: Record<string, string>;
  };
}

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validates a routine draft before saving. Enforces the product rules: a
 * routine needs a name, at least one named step, valid step durations, and a
 * valid start time when a fixed time is used.
 */
export function validateRoutineDraft(draft: RoutineDraft): RoutineValidationResult {
  const errors: RoutineValidationResult['errors'] = {};

  if (draft.title.trim().length === 0) {
    errors.title = 'Bitte gib der Routine einen Namen.';
  }

  const namedSteps = draft.steps.filter((step) => step.title.trim().length > 0);
  if (namedSteps.length === 0) {
    errors.steps = 'Füge mindestens einen Schritt hinzu.';
  }

  const stepTitles: Record<string, string> = {};
  for (const step of draft.steps) {
    if (step.title.trim().length === 0) {
      stepTitles[step.id] = 'Schrittname fehlt';
    } else if (step.durationInSeconds !== null && step.durationInSeconds <= 0) {
      stepTitles[step.id] = 'Dauer ungültig';
    }
  }
  if (Object.keys(stepTitles).length > 0) {
    errors.stepTitles = stepTitles;
  }

  const { schedule } = draft;
  if (schedule.enabled && !schedule.flexible && schedule.startTime !== null) {
    if (!TIME_PATTERN.test(schedule.startTime)) {
      errors.schedule = 'Ungültige Startzeit.';
    }
  }
  if (
    schedule.enabled &&
    schedule.endDate !== null &&
    schedule.endDate < schedule.startDate
  ) {
    errors.schedule = 'Enddatum liegt vor dem Startdatum.';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export type EditorPage = 1 | 2 | 3 | 4;

/** Errors relevant to one wizard page, so "Weiter" and "Speichern" agree. */
export function validateEditorPage(draft: RoutineDraft, page: EditorPage): string | null {
  const { errors } = validateRoutineDraft(draft);
  if (page === 1) return errors.title ?? null;
  if (page === 2) {
    if (errors.steps) return errors.steps;
    if (errors.stepTitles) return 'Bitte gib jedem Schritt einen Namen.';
    return null;
  }
  if (page === 3) return errors.schedule ?? null;
  return null;
}
