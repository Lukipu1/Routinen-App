import type { RoutineColorKey } from '../constants/colors';
import type { IconKey } from '../constants/icons';
import type { RoutineCategory } from '../types/category';
import type { TimeString, Weekday } from '../types/common';
import type { Routine } from '../types/routine';
import {
  DEFAULT_REMINDER,
  createEmptyDraft,
  routineFromDraft,
  type RoutineDraft,
  type RoutineStepDraft,
} from '../features/routines/draft';
import { todayISO } from '../utils/datetime';
import { generateId } from '../utils/id';

interface TemplateStep {
  title: string;
  durationInSeconds: number | null;
  icon?: IconKey;
}

export interface RoutineTemplate {
  key: string;
  title: string;
  subtitle: string;
  icon: IconKey;
  color: RoutineColorKey;
  category: RoutineCategory;
  startTime: TimeString | null;
  flexible: boolean;
  weekdays: Weekday[];
  steps: TemplateStep[];
}

const DAILY: Weekday[] = [0, 1, 2, 3, 4, 5, 6];
const WEEKDAYS_MON_FRI: Weekday[] = [1, 2, 3, 4, 5];

export const ROUTINE_TEMPLATES: readonly RoutineTemplate[] = [
  {
    key: 'morning',
    title: 'Morgenroutine',
    subtitle: 'Gut in den Tag starten',
    icon: 'sunrise',
    color: 'orange',
    category: 'morning',
    startTime: '07:00',
    flexible: false,
    weekdays: DAILY,
    steps: [
      { title: 'Aufstehen', durationInSeconds: null, icon: 'sunrise' },
      { title: 'Wasser trinken', durationInSeconds: 60, icon: 'water' },
      { title: 'Bett machen', durationInSeconds: 120, icon: 'bed' },
      { title: 'Zähne putzen', durationInSeconds: 180, icon: 'brush' },
      { title: 'Tagesziele ansehen', durationInSeconds: 300, icon: 'target' },
    ],
  },
  {
    key: 'evening',
    title: 'Abendroutine',
    subtitle: 'Ruhig zur Ruhe kommen',
    icon: 'moon',
    color: 'indigo',
    category: 'evening',
    startTime: '21:30',
    flexible: false,
    weekdays: DAILY,
    steps: [
      { title: 'Geräte weglegen', durationInSeconds: null, icon: 'phone' },
      { title: 'Sachen für morgen vorbereiten', durationInSeconds: 300, icon: 'shirt' },
      { title: 'Zähne putzen', durationInSeconds: 180, icon: 'brush' },
      { title: 'Tagesrückblick', durationInSeconds: 300, icon: 'notebook' },
      { title: 'Schlafen gehen', durationInSeconds: null, icon: 'bed' },
    ],
  },
  {
    key: 'learning',
    title: 'Lernroutine',
    subtitle: 'Fokussiert lernen',
    icon: 'book',
    color: 'blue',
    category: 'learning',
    startTime: '16:00',
    flexible: false,
    weekdays: WEEKDAYS_MON_FRI,
    steps: [
      { title: 'Arbeitsplatz vorbereiten', durationInSeconds: 300, icon: 'work' },
      { title: 'Lernziel festlegen', durationInSeconds: 120, icon: 'target' },
      { title: 'Fokusphase', durationInSeconds: 1500, icon: 'brain' },
      { title: 'Kurze Pause', durationInSeconds: 300, icon: 'coffee' },
      { title: 'Zusammenfassung', durationInSeconds: 600, icon: 'notebook' },
    ],
  },
  {
    key: 'workout',
    title: 'Trainingsvorbereitung',
    subtitle: 'Bereit fürs Training',
    icon: 'dumbbell',
    color: 'green',
    category: 'sport',
    startTime: null,
    flexible: true,
    weekdays: [1, 3, 5],
    steps: [
      { title: 'Wasser vorbereiten', durationInSeconds: 60, icon: 'water' },
      { title: 'Sportkleidung anziehen', durationInSeconds: 300, icon: 'shirt' },
      { title: 'Aufwärmen', durationInSeconds: 600, icon: 'activity' },
      { title: 'Training starten', durationInSeconds: null, icon: 'dumbbell' },
    ],
  },
];

function templateSteps(template: RoutineTemplate): RoutineStepDraft[] {
  return template.steps.map((step) => ({
    id: generateId(),
    title: step.title,
    note: '',
    durationInSeconds: step.durationInSeconds,
    icon: step.icon,
    canSkip: true,
  }));
}

export interface TemplateOptions {
  /** Overrides the template's fixed start time (e.g. the user's day start). */
  startTime?: TimeString;
  /** Turns the reminder on (e.g. when notifications were just allowed). */
  reminderEnabled?: boolean;
}

/** Builds an editable draft from a template so the user can tweak it. */
export function templateToDraft(
  template: RoutineTemplate,
  options: TemplateOptions = {},
): RoutineDraft {
  const base = createEmptyDraft();
  const startTime = template.flexible ? null : (options.startTime ?? template.startTime);
  return {
    ...base,
    title: template.title,
    icon: template.icon,
    color: template.color,
    category: template.category,
    steps: templateSteps(template),
    schedule: {
      enabled: true,
      weekdays: template.weekdays,
      startTime,
      flexible: template.flexible,
      timeWindow: null,
      startDate: todayISO(),
      endDate: null,
    },
    reminder: { ...DEFAULT_REMINDER, enabled: options.reminderEnabled ?? DEFAULT_REMINDER.enabled },
    isActive: true,
  };
}

/** Builds a full routine from a template. */
export function templateToRoutine(
  template: RoutineTemplate,
  now: Date = new Date(),
  options: TemplateOptions = {},
): Routine {
  return routineFromDraft(templateToDraft(template, options), now);
}

export function findTemplate(key: string): RoutineTemplate | undefined {
  return ROUTINE_TEMPLATES.find((t) => t.key === key);
}
