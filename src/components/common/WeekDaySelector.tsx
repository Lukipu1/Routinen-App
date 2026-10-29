import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { WEEKDAY_LONG, WEEKDAY_SHORT, orderedWeekdays } from '../../constants/weekdays';
import { haptics } from '../../services/haptics';
import type { Weekday, WeekStart } from '../../types/common';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';

interface WeekDaySelectorProps {
  selected: Weekday[];
  onChange: (weekdays: Weekday[]) => void;
  weekStartsOn?: WeekStart;
}

/** Row of seven toggleable day circles for choosing a weekly schedule. */
export function WeekDaySelector({
  selected,
  onChange,
  weekStartsOn = 1,
}: WeekDaySelectorProps): React.ReactElement {
  const theme = useTheme();
  const days = orderedWeekdays(weekStartsOn);
  const selectedSet = new Set(selected);

  const toggle = (day: Weekday): void => {
    void haptics.selection();
    const next = new Set(selectedSet);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    onChange(Array.from(next).sort((a, b) => a - b));
  };

  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Wochentage">
      {days.map((day) => {
        const isSelected = selectedSet.has(day);
        return (
          <Pressable
            key={day}
            onPress={() => toggle(day)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={WEEKDAY_LONG[day]}
            hitSlop={4}
            style={({ pressed }) => [
              styles.day,
              {
                backgroundColor: isSelected ? theme.colors.accent : theme.colors.fill,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <AppText
              variant="callout"
              weight="600"
              maxFontSizeMultiplier={1.3}
              style={{ color: isSelected ? theme.colors.onAccent : theme.colors.primaryText }}
            >
              {WEEKDAY_SHORT[day]}
            </AppText>
          </Pressable>
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
