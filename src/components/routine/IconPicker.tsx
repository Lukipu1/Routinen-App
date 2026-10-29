import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PICKABLE_ICONS, iconLabel, type IconKey } from '../../constants/icons';
import { haptics } from '../../services/haptics';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from '../common/Icon';

interface IconPickerProps {
  value: IconKey;
  onChange: (icon: IconKey) => void;
}

/**
 * Grid of selectable routine symbols. The chosen cell takes the tint colour
 * (selection is an interactive state); the rest sit in the neutral fill.
 */
export function IconPicker({ value, onChange }: IconPickerProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {PICKABLE_ICONS.map((iconKey) => {
        const isSelected = iconKey === value;
        return (
          <Pressable
            key={iconKey}
            onPress={() => {
              void haptics.selection();
              onChange(iconKey);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Symbol ${iconLabel(iconKey)}`}
            style={({ pressed }) => [
              styles.cell,
              {
                backgroundColor: isSelected ? theme.colors.accent : theme.colors.fill,
                borderRadius: theme.radii.md,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Icon
              name={iconKey}
              size={22}
              color={isSelected ? theme.colors.onAccent : theme.colors.primaryText}
            />
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
    gap: 10,
  },
  cell: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
