import type { RoutineCategory } from '../types/category';
import type { RoutineColorKey } from './colors';
import type { IconKey } from './icons';

interface CategoryMeta {
  label: string;
  icon: IconKey;
  color: RoutineColorKey;
}

/** German display metadata for each category (labels, default icon & colour). */
export const CATEGORY_META: Record<RoutineCategory, CategoryMeta> = {
  morning: { label: 'Morgen', icon: 'sunrise', color: 'orange' },
  evening: { label: 'Abend', icon: 'moon', color: 'indigo' },
  health: { label: 'Gesundheit', icon: 'heart', color: 'pink' },
  sport: { label: 'Sport', icon: 'dumbbell', color: 'green' },
  learning: { label: 'Lernen', icon: 'book', color: 'blue' },
  work: { label: 'Arbeit', icon: 'work', color: 'teal' },
  household: { label: 'Haushalt', icon: 'home', color: 'brown' },
  personal: { label: 'Persönlich', icon: 'sparkles', color: 'purple' },
};

export function categoryLabel(category: RoutineCategory): string {
  return CATEGORY_META[category].label;
}
