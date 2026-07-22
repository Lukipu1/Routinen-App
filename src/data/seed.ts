import type { Routine } from '../types/routine';
import { findTemplate, templateToRoutine } from './templates';

/**
 * Sample routines inserted on first launch (only when there is no user data).
 * They are flagged `isSample` so the UI can label them and the user can reset
 * or delete them freely.
 */
export function buildSampleRoutines(now: Date = new Date()): Routine[] {
  const templateKeys = ['morning', 'learning', 'evening'];
  const routines: Routine[] = [];

  templateKeys.forEach((key, index) => {
    const template = findTemplate(key);
    if (!template) return;
    const created = new Date(now.getTime() + index * 1000).toISOString();
    const routine = templateToRoutine(template, now);
    routines.push({
      ...routine,
      isSample: true,
      createdAt: created,
      updatedAt: created,
    });
  });

  return routines;
}
