/** Routine categories used for grouping, filtering and default colours. */
export type RoutineCategory =
  | 'morning'
  | 'evening'
  | 'health'
  | 'sport'
  | 'learning'
  | 'work'
  | 'household'
  | 'personal';

export const ROUTINE_CATEGORIES: readonly RoutineCategory[] = [
  'morning',
  'evening',
  'health',
  'sport',
  'learning',
  'work',
  'household',
  'personal',
];
