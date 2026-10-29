import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  PICKABLE_COLORS,
  ROUTINE_COLORS,
  ROUTINE_COLOR_LABELS,
  type RoutineColorKey,
} from '../../constants/colors';
import { haptics } from '../../services/haptics';

interface ColorPickerProps {
  value: RoutineColorKey;
  onChange: (color: RoutineColorKey) => void;
}

/**
 * Row of colour swatches, like the colour picker in Reminders: the selected
 * swatch is marked by a ring in its own colour, not by an extra symbol.
 */
export function ColorPicker({ value, onChange }: ColorPickerProps): React.ReactElement {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {PICKABLE_COLORS.map((colorKey) => {
        const isSelected = colorKey === value;
        const hex = ROUTINE_COLORS[colorKey];
        return (
          <Pressable
            key={colorKey}
            onPress={() => {
              void haptics.selection();
              onChange(colorKey);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Farbe ${ROUTINE_COLOR_LABELS[colorKey]}`}
            style={({ pressed }) => [
              styles.ring,
              { borderColor: isSelected ? hex : 'transparent', opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.swatch, { backgroundColor: hex }]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ring: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});
