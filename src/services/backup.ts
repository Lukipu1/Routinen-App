import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { z } from 'zod';

import * as db from '../database';
import { completionSchema, planOverrideSchema, routineSchema } from '../data/schemas';
import { withWriteTransaction } from '../database/client';
import type { PlanOverride } from '../types/planning';
import type { RoutineCompletion } from '../types/completion';
import type { Routine } from '../types/routine';
import { createLogger } from '../utils/logger';

/**
 * JSON export/import of everything the app stores. Without it a device change
 * or reinstall silently loses all routines and history — the app has no
 * account and no cloud. The file is validated with the same schemas the app
 * uses, so a hand-edited or foreign file cannot corrupt the database.
 */

const log = createLogger('backup');

export const BACKUP_FORMAT = 'routinen-backup';
export const BACKUP_VERSION = 1;

const backupSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  routines: z.array(routineSchema),
  completions: z.array(completionSchema),
  overrides: z.array(planOverrideSchema),
  dayPlans: z.record(z.string(), z.array(z.string())).default({}),
});

export type Backup = z.infer<typeof backupSchema>;

export async function buildBackup(now: Date = new Date()): Promise<Backup> {
  const [routines, completions, overrides, dayPlans] = await Promise.all([
    db.getAllRoutines(),
    db.getAllCompletions(),
    db.getAllOverrides(),
    db.getAllDayPlans(),
  ]);
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    routines,
    completions,
    overrides,
    dayPlans,
  };
}

/** Parses and validates a backup file's text. Throws a German message on failure. */
export function parseBackup(text: string): Backup {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Die Datei ist kein gültiges JSON.');
  }
  const result = backupSchema.safeParse(json);
  if (!result.success) {
    log.warn('backup rejected', result.error.issues.slice(0, 3));
    throw new Error('Die Datei ist keine gültige Routinen-Sicherung.');
  }
  return result.data;
}

/**
 * Replaces all data with the backup's contents in one transaction, so a
 * failure halfway leaves the previous data untouched. Records that point at
 * routines missing from the file are dropped rather than failing the import.
 */
export async function restoreBackup(backup: Backup): Promise<{
  routines: number;
  completions: number;
  overrides: number;
}> {
  const routineIds = new Set(backup.routines.map((r) => r.id));
  const completions = backup.completions.filter((c) => routineIds.has(c.routineId));
  const overrides = backup.overrides.filter((o) => routineIds.has(o.routineId));

  const database = await db.getDatabase();
  await withWriteTransaction(database, async (txn) => {
    await txn.execAsync(
      `DELETE FROM day_plans;
       DELETE FROM plan_overrides;
       DELETE FROM completions;
       DELETE FROM executions;
       DELETE FROM routine_steps;
       DELETE FROM routines;`,
    );
  });
  for (const routine of backup.routines as Routine[]) await db.saveRoutine(routine);
  for (const completion of completions as RoutineCompletion[]) await db.saveCompletion(completion);
  for (const override of overrides as PlanOverride[]) await db.saveOverride(override);
  for (const [date, ids] of Object.entries(backup.dayPlans)) {
    await db.replaceDayPlan(date, ids.filter((id) => routineIds.has(id)));
  }
  await db.setMeta(db.META_KEYS.sampleDataSeeded, '1');
  return { routines: backup.routines.length, completions: completions.length, overrides: overrides.length };
}

function backupFileName(now: Date): string {
  const stamp = now.toISOString().slice(0, 10);
  return `routinen-sicherung-${stamp}.json`;
}

/** Writes the backup to a file and opens the system share sheet for it. */
export async function exportBackupFile(now: Date = new Date()): Promise<void> {
  const backup = await buildBackup(now);
  const file = new File(Paths.cache, backupFileName(now));
  if (file.exists) file.delete();
  file.create();
  file.write(JSON.stringify(backup, null, 2));
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Teilen ist auf diesem Gerät nicht verfügbar.');
  }
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Sicherung speichern',
    UTI: 'public.json',
  });
}

/** Lets the user pick a backup file; resolves to `null` when they cancel. */
export async function pickBackupFile(): Promise<Backup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  const text = await new File(asset.uri).text();
  return parseBackup(text);
}
