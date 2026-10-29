import type { Routine } from '../types/routine';
import { findTemplate, templateToRoutine } from './templates';

/**
 * Sample routines inserted on first launch (only when there is no user data).
 * They are flagged `isSample` so the UI can label them and the user can reset
 * or delete them freely.
 */
export const SAMPLE_TEMPLATE_KEYS = ['morning', 'learning', 'evening'] as const;

export function buildSampleRoutines(
  now: Date = new Date(),
  excludeTemplateKeys: readonly string[] = [],
): Routine[] {
  const templateKeys = SAMPLE_TEMPLATE_KEYS.filter((key) => !excludeTemplateKeys.includes(key));
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
