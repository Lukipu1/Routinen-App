import { useCallback, useMemo, useState } from 'react';

import { findTemplate, templateToDraft } from '../../../data/templates';
import type { Weekday } from '../../../types/common';
import type { Routine } from '../../../types/routine';
import { todayISO, weekdayOf } from '../../../utils/datetime';
import { createEmptyDraft, draftFromRoutine, type RoutineDraft } from '../draft';

export interface UseRoutineDraftParams {
  /** Existing routine being edited, if any. */
  routine: Routine | undefined;
  templateKey: string | undefined;
  /** Opened from "Heute": a new routine should land on today's plan. */
  forToday: boolean;
}

/** Wizard state for the editor: the draft, patch helpers and a dirty flag. */
export function useRoutineDraft({ routine, templateKey, forToday }: UseRoutineDraftParams): {
  draft: RoutineDraft;
  setDraft: React.Dispatch<React.SetStateAction<RoutineDraft>>;
  patch: (partial: Partial<RoutineDraft>) => void;
  isEditing: boolean;
  /** True once the user changed anything compared to the opening state. */
  dirty: boolean;
} {
  // The opening state is captured once; comparing against it yields `dirty`.
  const [initial] = useState<RoutineDraft>(() =>
    buildInitialDraft({ routine, templateKey, forToday }),
  );
  const [draft, setDraft] = useState<RoutineDraft>(initial);

  const patch = useCallback(
    (partial: Partial<RoutineDraft>) => setDraft((current) => ({ ...current, ...partial })),
    [],
  );
  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(initial),
    [draft, initial],
  );

  return { draft, setDraft, patch, isEditing: draft.id !== null, dirty };
}

function buildInitialDraft({ routine, templateKey, forToday }: UseRoutineDraftParams): RoutineDraft {
  if (routine) return draftFromRoutine(routine);
  const template = templateKey ? findTemplate(templateKey) : undefined;
  const draft = template ? templateToDraft(template) : createEmptyDraft();
  if (!forToday) return draft;
  // Default schedules are Mon–Fri; a routine created from "Heute" on a
  // weekend would otherwise never show up there.
  const today: Weekday = weekdayOf(todayISO());
  if (draft.schedule.weekdays.includes(today)) return draft;
  return {
    ...draft,
    schedule: {
      ...draft.schedule,
      weekdays: [...draft.schedule.weekdays, today].sort((a, b) => a - b),
    },
  };
}
