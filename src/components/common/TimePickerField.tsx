import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { haptics } from '../../services/haptics';
import type { TimeString } from '../../types/common';
import { timeToMinutes } from '../../utils/datetime';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './Buttons';
import { Icon } from './Icon';

interface TimePickerFieldProps {
  value: TimeString;
  onChange: (value: TimeString) => void;
  label?: string;
  /**
   * `standalone` draws its own rounded field (for sheets and forms);
   * `grouped` renders as a plain row inside a grouped card, with a hairline
   * unless it is the last row.
   */
  appearance?: 'standalone' | 'grouped';
  last?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);
/** Height of one picker row; used to scroll the selected value into view. */
const OPTION_HEIGHT = 48;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Label + value row that opens a bottom-sheet hour/minute picker. */
export function TimePickerField({
  value,
  onChange,
  label,
  appearance = 'standalone',
  last = false,
}: TimePickerFieldProps): React.ReactElement {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState(Math.floor(timeToMinutes(value) / 60));
  const [minute, setMinute] = useState(Math.round((timeToMinutes(value) % 60) / 5) * 5);
  const grouped = appearance === 'grouped';

  const openSheet = (): void => {
    const minutes = timeToMinutes(value);
    setHour(Math.floor(minutes / 60));
    setMinute(Math.round((minutes % 60) / 5) * 5);
    setOpen(true);
  };

  const confirm = (): void => {
    onChange(`${pad(hour)}:${pad(minute)}`);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={openSheet}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? 'Uhrzeit'}: ${value}`}
        accessibilityHint="Öffnet die Uhrzeitauswahl"
        style={({ pressed }) => [
          styles.field,
          grouped
            ? { backgroundColor: pressed ? theme.colors.fill : 'transparent' }
            : { backgroundColor: theme.colors.fill, borderRadius: theme.radii.md, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <View
          style={[
            styles.inner,
            grouped
              ? { borderBottomColor: theme.colors.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth }
              : null,
          ]}
        >
          <AppText variant="body">{label ?? 'Uhrzeit'}</AppText>
          <View style={styles.fieldValue}>
            <AppText variant="body" color="secondaryText">
              {value}
            </AppText>
            <Icon name="chevronRight" size={18} color={theme.colors.tertiaryText} strokeWidth={2.5} />
          </View>
        </View>
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Uhrzeit wählen">
        <View style={styles.pickerRow}>
          <PickerColumn items={HOURS} selected={hour} onSelect={setHour} columnLabel="Stunden" unit="Uhr" open={open} />
          <AppText variant="display">:</AppText>
          <PickerColumn items={MINUTES} selected={minute} onSelect={setMinute} columnLabel="Minuten" unit="Minuten" open={open} />
        </View>
        <PrimaryButton title="Fertig" onPress={confirm} />
      </BottomSheet>
    </>
  );
}

function PickerColumn({
  items,
  selected,
  onSelect,
  columnLabel,
  unit,
  open,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  columnLabel: string;
  unit: string;
  open: boolean;
}): React.ReactElement {
  const theme = useTheme();
  const ref = useRef<ScrollView>(null);
  // Jump to the current value when the sheet opens so the user is not left
  // staring at 00 and scrolling from the top every time.
  useEffect(() => {
    if (!open) return;
    const index = Math.max(0, items.indexOf(selected));
    const timer = setTimeout(() => {
      ref.current?.scrollTo({ y: Math.max(0, (index - 1) * OPTION_HEIGHT), animated: false });
    }, 0);
    return () => clearTimeout(timer);
    // Only on open: scrolling on every selection would fight the user's finger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <ScrollView
      ref={ref}
      style={styles.column}
      showsVerticalScrollIndicator={false}
      accessibilityLabel={columnLabel}
      accessibilityRole="radiogroup"
    >
      {items.map((item) => {
        const isSelected = item === selected;
        return (
          <Pressable
            key={item}
            onPress={() => {
              void haptics.selection();
              onSelect(item);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${pad(item)} ${unit}`}
            style={({ pressed }) => [
              styles.option,
              isSelected ? { backgroundColor: theme.colors.fill, borderRadius: theme.radii.sm } : null,
              pressed ? { opacity: 0.6 } : null,
            ]}
          >
            <AppText variant="title" weight={isSelected ? '600' : '400'} color={isSelected ? 'primaryText' : 'secondaryText'}>
              {pad(item)}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  field: {
    paddingLeft: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingRight: 16,
    minHeight: 48,
  },
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 220,
    marginBottom: 16,
  },
  column: { width: 96 },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    height: OPTION_HEIGHT - 4,
    marginVertical: 2,
  },
});
