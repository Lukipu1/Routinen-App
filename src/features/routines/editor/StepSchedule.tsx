import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppSwitch } from '../../../components/common/AppSwitch';
import { AppText } from '../../../components/common/AppText';
import { Chip } from '../../../components/common/Chip';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { TimePickerField } from '../../../components/common/TimePickerField';
import { WeekDaySelector } from '../../../components/common/WeekDaySelector';
import { REMINDER_LEAD_OPTIONS } from '../../../constants/durations';
import { resolveRoutineTextColor } from '../../../constants/colors';
import type { WeekStart } from '../../../types/common';
import { formatDuration } from '../../../utils/format';
import { useTheme } from '../../../theme/ThemeProvider';
import type { RoutineDraft } from '../draft';

interface Props {
  draft: RoutineDraft;
  patch: (partial: Partial<RoutineDraft>) => void;
  accent: string;
  totalDuration: number;
  weekStartsOn: WeekStart;
  /** Whether the app-wide notification switch is on. */
  notificationsEnabled: boolean;
  scheduleError?: string;
}

export function reminderLeadLabel(minutes: number): string {
  return minutes === 0 ? 'Zum Start' : `${minutes} Min vorher`;
}

/** Page 3: weekdays, start time and reminder. */
export function StepSchedule({
  draft,
  patch,
  accent,
  totalDuration,
  weekStartsOn,
  notificationsEnabled,
  scheduleError,
}: Props): React.ReactElement {
  const theme = useTheme();
  const { schedule, reminder } = draft;
  const setFlexible = (flexible: boolean): void =>
    patch({
      schedule: {
        ...schedule,
        flexible,
        startTime: flexible ? null : (schedule.startTime ?? '07:00'),
      },
      // Reminders need a fixed time; don't leave a switch on that can't work.
      reminder: flexible ? { ...reminder, enabled: false } : reminder,
    });

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View>
        <SectionHeader title="Wochentage" />
        <WeekDaySelector
          selected={schedule.weekdays}
          onChange={(weekdays) => patch({ schedule: { ...schedule, weekdays } })}
          weekStartsOn={weekStartsOn}
          accentColor={accent}
        />
        {schedule.weekdays.length === 0 ? (
          <AppText variant="caption" color="secondaryText" style={{ marginTop: 8 }}>
            Ohne Wochentage erscheint die Routine nur, wenn du sie einzeln für einen Tag einplanst.
          </AppText>
        ) : null}
      </View>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <AppText variant="body">Flexible Uhrzeit</AppText>
          <AppText variant="caption" color="secondaryText">
            Ohne feste Startzeit, irgendwann am Tag
          </AppText>
        </View>
        <AppSwitch
          value={schedule.flexible}
          onValueChange={setFlexible}
          accessibilityLabel="Flexible Uhrzeit"
          accentColor={accent}
        />
      </View>

      {!schedule.flexible ? (
        <TimePickerField
          label="Startzeit"
          value={schedule.startTime ?? '07:00'}
          onChange={(startTime) => patch({ schedule: { ...schedule, startTime } })}
          accentColor={accent}
        />
      ) : null}
      {scheduleError ? (
        <AppText variant="caption" style={{ color: theme.colors.error }}>
          {scheduleError}
        </AppText>
      ) : null}

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <AppText variant="body">Erinnerung</AppText>
          <AppText variant="caption" color="secondaryText">
            {schedule.flexible
              ? 'Braucht eine feste Startzeit'
              : notificationsEnabled
                ? 'Benachrichtigung vor dem Start'
                : 'Benachrichtigungen sind in den Einstellungen aus'}
          </AppText>
        </View>
        <AppSwitch
          value={reminder.enabled}
          onValueChange={(enabled) => patch({ reminder: { ...reminder, enabled } })}
          accessibilityLabel="Erinnerung"
          accentColor={accent}
          disabled={schedule.flexible}
        />
      </View>

      {reminder.enabled && !schedule.flexible ? (
        <View>
          <AppText variant="caption" color="secondaryText" style={{ marginBottom: 6 }}>
            Wann erinnern?
          </AppText>
          <View style={styles.chipWrap} accessibilityRole="radiogroup">
            {REMINDER_LEAD_OPTIONS.map((minutes) => (
              <Chip
                key={minutes}
                label={minutes === 0 ? 'Zum Start' : `${minutes} Min`}
                accessibilityLabel={reminderLeadLabel(minutes)}
                selected={reminder.minutesBefore === minutes}
                onPress={() => patch({ reminder: { ...reminder, minutesBefore: minutes } })}
                accentColor={accent}
              />
            ))}
          </View>
        </View>
      ) : null}

      <View style={[styles.totalBox, { backgroundColor: theme.colors.fill, borderRadius: theme.radii.md }]}>
        <AppText variant="callout" color="secondaryText">
          Geschätzte Gesamtdauer
        </AppText>
        <AppText variant="title" style={{ color: resolveRoutineTextColor(draft.color, theme.scheme) }}>
          {totalDuration > 0 ? formatDuration(totalDuration) : 'Ohne Zeitvorgabe'}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchText: { flex: 1, gap: 2 },
  totalBox: {
    padding: 16,
    alignItems: 'flex-start',
    gap: 4,
  },
});
