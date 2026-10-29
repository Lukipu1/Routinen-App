import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { TimeString } from '../../types/common';
import { timeToMinutes } from '../../utils/datetime';
import { onColorForHex } from '../../constants/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './Buttons';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface TimePickerFieldProps {
  value: TimeString;
  onChange: (value: TimeString) => void;
  label?: string;
  accentColor?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/** Field that opens a bottom-sheet hour/minute picker. */
export function TimePickerField({
  value,
  onChange,
  label,
  accentColor,
}: TimePickerFieldProps): React.ReactElement {
  const theme = useTheme();
  const accent = accentColor ?? theme.colors.accent;
  const [open, setOpen] = useState(false);
  const initial = useMemo(() => timeToMinutes(value), [value]);
  const [hour, setHour] = useState(Math.floor(initial / 60));
  const [minute, setMinute] = useState(Math.round((initial % 60) / 5) * 5);

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

  const renderColumn = (
    items: number[],
    selected: number,
    onSelect: (v: number) => void,
    columnLabel: string,
    unit: string,
  ): React.ReactElement => (
    <PickerColumn
      items={items}
      selected={selected}
      onSelect={onSelect}
      columnLabel={columnLabel}
      unit={unit}
      accent={accent}
      open={open}
    />
  );

  return (
    <>
      <PressableScale
        onPress={openSheet}
        scaleTo={0.99}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? 'Uhrzeit'}: ${value}`}
        style={[
          styles.field,
          { backgroundColor: theme.colors.fill, borderRadius: theme.radii.md },
        ]}
      >
        {label ? <AppText variant="body">{label}</AppText> : <View />}
        <View style={styles.fieldValue}>
          <Icon name="clock" size={18} color={theme.colors.secondaryText} />
          <AppText variant="body" weight="600">
            {value}
          </AppText>
        </View>
      </PressableScale>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Uhrzeit wählen">
        <View style={styles.pickerRow}>
          {renderColumn(HOURS, hour, setHour, 'Stunden', 'Uhr')}
          <AppText variant="display">:</AppText>
          {renderColumn(MINUTES, minute, setMinute, 'Minuten', 'Minuten')}
        </View>
        <PrimaryButton title="Fertig" onPress={confirm} accentColor={accent} />
      </BottomSheet>
    </>
  );
}

/** Height of one picker row; used to scroll the selected value into view. */
const OPTION_HEIGHT = 48;

function PickerColumn({
  items,
  selected,
  onSelect,
  columnLabel,
  unit,
  accent,
  open,
}: {
  items: number[];
  selected: number;
  onSelect: (v: number) => void;
  columnLabel: string;
  unit: string;
  accent: string;
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
          <PressableScale
            key={item}
            onPress={() => onSelect(item)}
            haptic="selection"
            scaleTo={0.95}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`${pad(item)} ${unit}`}
            style={[
              styles.option,
              isSelected ? { backgroundColor: accent, borderRadius: theme.radii.sm } : null,
            ]}
          >
            <AppText
              variant="title"
              style={{ color: isSelected ? onColorForHex(accent) : theme.colors.primaryText }}
            >
              {pad(item)}
            </AppText>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 220,
    marginBottom: 16,
  },
  column: {
    width: 80,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    height: OPTION_HEIGHT - 4,
    marginVertical: 2,
  },
});
