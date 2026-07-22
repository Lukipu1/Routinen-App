import {
  Activity,
  Award,
  Bed,
  Bell,
  BellOff,
  BookOpen,
  Brain,
  Briefcase,
  Brush,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Clock,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  GlassWater,
  Heart,
  House,
  ListChecks,
  Moon,
  MoonStar,
  NotebookPen,
  Pause,
  Play,
  Settings,
  Shirt,
  Smartphone,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Target,
  Timer,
  TrendingUp,
  Waves,
  Wind,
  type LucideIcon,
} from 'lucide-react-native';

/**
 * Central registry mapping stable string keys to Lucide icon components. Data
 * models store the key (a plain string), the UI resolves it here — so icons
 * survive persistence and stay consistent everywhere.
 */
export const ICON_REGISTRY = {
  sunrise: Sunrise,
  sunset: Sunset,
  sun: Sun,
  moon: Moon,
  moonStar: MoonStar,
  coffee: Coffee,
  bed: Bed,
  water: GlassWater,
  droplets: Droplets,
  brush: Brush,
  target: Target,
  checklist: ListChecks,
  book: BookOpen,
  brain: Brain,
  notebook: NotebookPen,
  work: Briefcase,
  home: House,
  heart: Heart,
  dumbbell: Dumbbell,
  activity: Activity,
  footprints: Footprints,
  waves: Waves,
  wind: Wind,
  shirt: Shirt,
  phone: Smartphone,
  clock: Clock,
  timer: Timer,
  bell: Bell,
  flame: Flame,
  award: Award,
  trending: TrendingUp,
  sparkles: Sparkles,
} as const satisfies Record<string, LucideIcon>;

export type IconKey = keyof typeof ICON_REGISTRY;

/** Icon keys offered in the icon picker, in display order. */
export const PICKABLE_ICONS: readonly IconKey[] = [
  'sunrise',
  'sunset',
  'moon',
  'coffee',
  'water',
  'brush',
  'target',
  'checklist',
  'book',
  'brain',
  'work',
  'home',
  'heart',
  'dumbbell',
  'activity',
  'footprints',
  'shirt',
  'phone',
  'sparkles',
  'flame',
];

const FALLBACK_ICON: LucideIcon = ListChecks;

/** Resolves an icon key to its component, falling back to a safe default. */
export function resolveIcon(key: string | undefined): LucideIcon {
  if (key && key in ICON_REGISTRY) {
    return ICON_REGISTRY[key as IconKey];
  }
  return FALLBACK_ICON;
}

// Re-export commonly used control icons so screens import from one place.
export {
  Check,
  CheckCheck,
  ChevronRight,
  Play,
  Pause,
  Bell,
  BellOff,
  Settings,
  CalendarDays,
  Clock,
  Timer,
  Flame,
  Award,
  TrendingUp,
  Sparkles,
};
