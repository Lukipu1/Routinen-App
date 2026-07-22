import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { TimeString } from '../../types/common';
import { timeToMinutes } from '../../utils/datetime';
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
    testLabel: string,
  ): React.ReactElement => (
    <ScrollView
      style={styles.column}
      showsVerticalScrollIndicator={false}
      accessibilityLabel={testLabel}
    >
      {items.map((item) => {
        const isSelected = item === selected;
        return (
          <PressableScale
            key={item}
            onPress={() => onSelect(item)}
            haptic="selection"
            scaleTo={0.95}
            style={[
              styles.option,
              isSelected ? { backgroundColor: accent, borderRadius: theme.radii.sm } : null,
            ]}
          >
            <AppText
              variant="title"
              style={{ color: isSelected ? theme.colors.onAccent : theme.colors.primaryText }}
            >
              {pad(item)}
            </AppText>
          </PressableScale>
        );
      })}
    </ScrollView>
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
          {renderColumn(HOURS, hour, setHour, 'Stunden')}
          <AppText variant="display">:</AppText>
          {renderColumn(MINUTES, minute, setMinute, 'Minuten')}
        </View>
        <PrimaryButton title="Fertig" onPress={confirm} accentColor={accent} />
      </BottomSheet>
    </>
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
    paddingVertical: 8,
    marginVertical: 2,
  },
});
