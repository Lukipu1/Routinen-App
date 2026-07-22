import React from 'react';
import { StyleSheet, View } from 'react-native';

import { WEEKDAY_LONG, WEEKDAY_SHORT, orderedWeekdays } from '../../constants/weekdays';
import type { Weekday, WeekStart } from '../../types/common';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

interface WeekDaySelectorProps {
  selected: Weekday[];
  onChange: (weekdays: Weekday[]) => void;
  weekStartsOn?: WeekStart;
  accentColor?: string;
}

/** Row of seven toggleable day chips for choosing a weekly schedule. */
export function WeekDaySelector({
  selected,
  onChange,
  weekStartsOn = 1,
  accentColor,
}: WeekDaySelectorProps): React.ReactElement {
  const theme = useTheme();
  const accent = accentColor ?? theme.colors.accent;
  const days = orderedWeekdays(weekStartsOn);
  const selectedSet = new Set(selected);

  const toggle = (day: Weekday): void => {
    const next = new Set(selectedSet);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange(Array.from(next).sort((a, b) => a - b));
  };

  return (
    <View style={styles.row}>
      {days.map((day) => {
        const isSelected = selectedSet.has(day);
        return (
          <PressableScale
            key={day}
            onPress={() => toggle(day)}
            haptic="selection"
            scaleTo={0.9}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={WEEKDAY_LONG[day]}
            style={[
              styles.day,
              {
                backgroundColor: isSelected ? accent : theme.colors.fill,
              },
            ]}
          >
            <AppText
              variant="callout"
              weight="600"
              style={{ color: isSelected ? theme.colors.onAccent : theme.colors.primaryText }}
            >
              {WEEKDAY_SHORT[day]}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  day: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 48,
  },
});
