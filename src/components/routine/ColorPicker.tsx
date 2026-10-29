import React from 'react';
import { StyleSheet, View } from 'react-native';

import {
  PICKABLE_COLORS,
  ROUTINE_COLORS,
  ROUTINE_COLOR_LABELS,
  resolveOnRoutineColor,
  type RoutineColorKey,
} from '../../constants/colors';
import { Icon } from '../common/Icon';
import { PressableScale } from '../common/PressableScale';

interface ColorPickerProps {
  value: RoutineColorKey;
  onChange: (color: RoutineColorKey) => void;
}

/** Row of selectable accent-colour swatches. */
export function ColorPicker({ value, onChange }: ColorPickerProps): React.ReactElement {
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {PICKABLE_COLORS.map((colorKey) => {
        const isSelected = colorKey === value;
        const hex = ROUTINE_COLORS[colorKey];
        return (
          <PressableScale
            key={colorKey}
            onPress={() => onChange(colorKey)}
            haptic="selection"
            scaleTo={0.9}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Farbe ${ROUTINE_COLOR_LABELS[colorKey]}`}
            style={[styles.swatch, { backgroundColor: hex }]}
          >
            {isSelected ? <Icon name="check" size={20} color={resolveOnRoutineColor(colorKey)} /> : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
