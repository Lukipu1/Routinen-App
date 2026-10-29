import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { AppText } from '../../../components/common/AppText';
import { Card } from '../../../components/common/Card';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { StepListItem } from '../../../components/routine/StepListItem';
import { CATEGORY_META } from '../../../constants/categories';
import { photoForCategory } from '../../../constants/photos';
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

/** Page 4: read-only overview before saving, laid out like the detail screen. */
export function StepSummary({ draft, accent, totalDuration, weekStartsOn }: Props): React.ReactElement {
  const theme = useTheme();
  const stepCount = draft.steps.length;
  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View style={styles.summaryHeader}>
        <Image source={photoForCategory(draft.category)} style={styles.thumb} accessibilityIgnoresInvertColors />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title" numberOfLines={2}>
            {draft.title || 'Ohne Namen'}
          </AppText>
          <AppText variant="callout" color="secondaryText">
            {totalDuration > 0 ? `${formatDuration(totalDuration)} · ` : ''}
            {stepCount} {pluralize(stepCount, 'Schritt', 'Schritte')} · {CATEGORY_META[draft.category].label}
          </AppText>
        </View>
      </View>

      <Card padded={false}>
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
      </Card>

      <View>
        <SectionHeader title="Schritte" />
        <Card padded={false}>
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
              last={index === draft.steps.length - 1}
            />
          ))}
        </Card>
      </View>
    </View>
  );
}

function SummaryRow({ label, value, last }: { label: string; value: string; last?: boolean }): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={styles.rowOuter}>
      <View
        style={[
          styles.row,
          { borderBottomColor: theme.colors.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
        ]}
      >
        <AppText variant="body">{label}</AppText>
        <AppText variant="body" color="secondaryText" style={styles.value} numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 4 },
  thumb: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#D1D1D6' },
  rowOuter: { paddingLeft: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingRight: 16,
    minHeight: 48,
  },
  value: { flexShrink: 1, textAlign: 'right' },
});
