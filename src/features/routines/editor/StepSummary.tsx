import React from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/common/AppText';
import { Icon } from '../../../components/common/Icon';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { StepListItem } from '../../../components/routine/StepListItem';
import { resolveOnRoutineColor } from '../../../constants/colors';
import { summariseWeekdays } from '../../../constants/weekdays';
import type { WeekStart } from '../../../types/common';
import { formatDuration, pluralize } from '../../../utils/format';
import { useTheme } from '../../../theme/ThemeProvider';
import type { RoutineDraft } from '../draft';
import { reminderLeadLabel } from './StepSchedule';

interface Props {
  draft: RoutineDraft;
  accent: string;
  totalDuration: number;
  weekStartsOn: WeekStart;
}

/** Page 4: read-only overview before saving. */
export function StepSummary({ draft, accent, totalDuration, weekStartsOn }: Props): React.ReactElement {
  const theme = useTheme();
  const stepCount = draft.steps.length;
  return (
    <View style={{ gap: theme.spacing.base }}>
      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIcon, { backgroundColor: accent }]}>
          <Icon name={draft.icon} size={28} color={resolveOnRoutineColor(draft.color)} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="title">{draft.title || 'Ohne Namen'}</AppText>
          <AppText variant="callout" color="secondaryText">
            {totalDuration > 0 ? `${formatDuration(totalDuration)} · ` : ''}
            {stepCount} {pluralize(stepCount, 'Schritt', 'Schritte')}
          </AppText>
        </View>
      </View>

      <View style={[styles.summaryBox, { backgroundColor: theme.colors.secondaryBackground, borderRadius: theme.radii.md }]}>
        <SummaryRow label="Wochentage" value={summariseWeekdays(draft.schedule.weekdays, weekStartsOn)} />
        <SummaryRow
          label="Startzeit"
          value={draft.schedule.flexible ? 'Flexibel' : (draft.schedule.startTime ?? '—')}
        />
        <SummaryRow
          label="Erinnerung"
          value={draft.reminder.enabled ? reminderLeadLabel(draft.reminder.minutesBefore) : 'Aus'}
          last
        />
      </View>

      <View>
        <SectionHeader title="Schritte" />
        <View style={[styles.summaryBox, { backgroundColor: theme.colors.secondaryBackground, borderRadius: theme.radii.md }]}>
          {draft.steps.map((s, index) => (
            <StepListItem
              key={s.id}
              step={{
                id: s.id,
                title: s.title || `Schritt ${index + 1}`,
                durationInSeconds: s.durationInSeconds,
                order: index,
                canSkip: s.canSkip,
                icon: s.icon,
              }}
              index={index}
              accentColor={accent}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.summaryRow,
        { borderBottomColor: theme.colors.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
      ]}
    >
      <AppText variant="body" color="secondaryText">
        {label}
      </AppText>
      <AppText variant="body" weight="600">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBox: { paddingHorizontal: 16, paddingVertical: 4 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
  },
});
