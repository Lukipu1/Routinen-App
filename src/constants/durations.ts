/** Quick-pick step durations, in seconds. */
export interface DurationPreset {
  label: string;
  seconds: number;
}

export const DURATION_PRESETS: readonly DurationPreset[] = [
  { label: '1 Min', seconds: 60 },
  { label: '2 Min', seconds: 120 },
  { label: '5 Min', seconds: 300 },
  { label: '10 Min', seconds: 600 },
  { label: '15 Min', seconds: 900 },
];

/** Reminder lead-time options, in minutes before start. */
export const REMINDER_LEAD_OPTIONS: readonly number[] = [0, 5, 10, 15, 30, 60];
