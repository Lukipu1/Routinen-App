import { z } from 'zod';

import { ROUTINE_CATEGORIES } from '../types/category';

/**
 * Runtime validation schemas for the core data structures. Used to guard data
 * coming from persistence, seeds or (future) imports so a single malformed
 * record can be rejected instead of crashing the app.
 */

const timeStringSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Ungültige Uhrzeit');

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ungültiges Datum');

const weekdaySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const routineStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, 'Schrittname fehlt'),
  note: z.string().optional(),
  durationInSeconds: z.number().int().positive().nullable(),
  order: z.number().int().min(0),
  icon: z.string().optional(),
  canSkip: z.boolean(),
  completionType: z.enum(['manual', 'timed']).optional(),
});

export const reminderSettingsSchema = z.object({
  enabled: z.boolean(),
  minutesBefore: z.number().int().min(0).max(24 * 60),
  secondReminderMinutes: z.number().int().min(1).max(24 * 60).nullable(),
});

export const routineScheduleSchema = z.object({
  enabled: z.boolean(),
  weekdays: z.array(weekdaySchema),
  startTime: timeStringSchema.nullable(),
  flexible: z.boolean(),
  timeWindow: z
    .object({ start: timeStringSchema, end: timeStringSchema })
    .nullable(),
  startDate: isoDateSchema,
  endDate: isoDateSchema.nullable(),
});

export const routineSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1, 'Name der Routine fehlt'),
  description: z.string().optional(),
  icon: z.string().min(1),
  color: z.string().min(1),
  category: z.enum(ROUTINE_CATEGORIES),
  estimatedDuration: z.number().int().min(0),
  steps: z.array(routineStepSchema).min(1, 'Mindestens ein Schritt nötig'),
  schedule: routineScheduleSchema,
  reminder: reminderSettingsSchema,
  isActive: z.boolean(),
  isSample: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const executionSchema = z.object({
  id: z.string().min(1),
  routineId: z.string().min(1),
  scheduledDate: isoDateSchema,
  startedAt: z.string(),
  completedAt: z.string().nullable(),
  currentStepIndex: z.number().int().min(0),
  completedStepIds: z.array(z.string()),
  skippedStepIds: z.array(z.string()),
  status: z.enum(['active', 'paused', 'completed', 'abandoned']),
  stepStartedAt: z.string().nullable(),
  accumulatedStepSeconds: z.number().min(0),
  activeSeconds: z.number().min(0).default(0),
});

export const completionSchema = z.object({
  id: z.string().min(1),
  routineId: z.string().min(1),
  date: isoDateSchema,
  completed: z.boolean(),
  completedSteps: z.number().int().min(0),
  totalSteps: z.number().int().min(0),
  durationInSeconds: z.number().int().min(0),
  startedAt: z.string(),
  completedAt: z.string(),
});

export const planOverrideSchema = z.object({
  id: z.string().min(1),
  routineId: z.string().min(1),
  date: isoDateSchema,
  added: z.boolean(),
  skipped: z.boolean(),
  paused: z.boolean(),
  startTimeOverride: timeStringSchema.nullable(),
});
