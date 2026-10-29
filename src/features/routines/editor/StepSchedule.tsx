import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppSwitch } from '../../../components/common/AppSwitch';
import { AppText } from '../../../components/common/AppText';
import { Card } from '../../../components/common/Card';
import { Chip } from '../../../components/common/Chip';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { SettingRow } from '../../../components/common/SettingRow';
import { TimePickerField } from '../../../components/common/TimePickerField';
import { WeekDaySelector } from '../../../components/common/WeekDaySelector';
import { REMINDER_LEAD_OPTIONS } from '../../../constants/durations';
import type { WeekStart } from '../../../types/common';
import { formatDuration } from '../../../utils/format';
import { useTheme } from '../../../theme/ThemeProvider';
import type { RoutineDraft } from '../draft';

interface Props {
  draft: RoutineDraft;
  patch: (partial: Partial<RoutineDraft>) => void;
  totalDuration: number;
  weekStartsOn: WeekStart;
  /** Whether the app-wide notification switch is on. */
  notificationsEnabled: boolean;
  scheduleError?: string;
}

export function reminderLeadLabel(minutes: number): string {
  return minutes === 0 ? 'Zum Start' : `${minutes} Min vorher`;
}

/** Page 3: weekdays, start time and reminder as grouped settings. */
export function StepSchedule({
  draft,
  patch,
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
        />
        {schedule.weekdays.length === 0 ? (
          <AppText variant="caption" color="secondaryText" style={styles.footnote}>
            Ohne Wochentage erscheint die Routine nur, wenn du sie einzeln für einen Tag einplanst.
          </AppText>
        ) : null}
      </View>

      <View>
        <SectionHeader title="Uhrzeit" />
        <Card padded={false}>
          <SettingRow
            label="Flexible Uhrzeit"
            description="Ohne feste Startzeit, irgendwann am Tag"
            right={
              <AppSwitch value={schedule.flexible} onValueChange={setFlexible} accessibilityLabel="Flexible Uhrzeit" />
            }
            last={schedule.flexible}
          />
          {!schedule.flexible ? (
            <TimePickerField
              label="Startzeit"
              value={schedule.startTime ?? '07:00'}
              onChange={(startTime) => patch({ schedule: { ...schedule, startTime } })}
              appearance="grouped"
              last
            />
          ) : null}
        </Card>
        {scheduleError ? (
          <AppText variant="caption" style={[styles.footnote, { color: theme.colors.error }]}>
            {scheduleError}
          </AppText>
        ) : null}
      </View>

      <View>
        <SectionHeader title="Erinnerung" />
        <Card padded={false}>
          <SettingRow
            label="Vor dem Start erinnern"
            description={
              schedule.flexible
                ? 'Braucht eine feste Startzeit'
                : notificationsEnabled
                  ? 'Benachrichtigung vor dem Start'
                  : 'Benachrichtigungen sind in den Einstellungen aus'
            }
            right={
              <AppSwitch
                value={reminder.enabled}
                onValueChange={(enabled) => patch({ reminder: { ...reminder, enabled } })}
                accessibilityLabel="Vor dem Start erinnern"
                disabled={schedule.flexible}
              />
            }
            last={!(reminder.enabled && !schedule.flexible)}
          />
          {reminder.enabled && !schedule.flexible ? (
            <View style={styles.leadBlock}>
              <AppText variant="caption" color="secondaryText">
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
                  />
                ))}
              </View>
            </View>
          ) : null}
        </Card>
      </View>

      <Card padded={false}>
        <View style={styles.totalRow}>
          <AppText variant="body">Geschätzte Gesamtdauer</AppText>
          <AppText variant="body" color="secondaryText">
            {totalDuration > 0 ? formatDuration(totalDuration) : 'Ohne Zeitvorgabe'}
          </AppText>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footnote: { marginTop: 8, paddingHorizontal: 4 },
  leadBlock: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, gap: 8 },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
});
