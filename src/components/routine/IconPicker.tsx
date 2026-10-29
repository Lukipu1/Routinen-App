import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PICKABLE_ICONS, iconLabel, type IconKey } from '../../constants/icons';
import { onColorForHex } from '../../constants/colors';
import { useTheme } from '../../theme/ThemeProvider';
import { Icon } from '../common/Icon';
import { PressableScale } from '../common/PressableScale';

interface IconPickerProps {
  value: IconKey;
  onChange: (icon: IconKey) => void;
  accentColor?: string;
}

/** Grid of selectable routine icons. */
export function IconPicker({ value, onChange, accentColor }: IconPickerProps): React.ReactElement {
  const theme = useTheme();
  const accent = accentColor ?? theme.colors.accent;
  return (
    <View style={styles.grid} accessibilityRole="radiogroup">
      {PICKABLE_ICONS.map((iconKey) => {
        const isSelected = iconKey === value;
        return (
          <PressableScale
            key={iconKey}
            onPress={() => onChange(iconKey)}
            haptic="selection"
            scaleTo={0.9}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Symbol ${iconLabel(iconKey)}`}
            style={[
              styles.cell,
              {
                backgroundColor: isSelected ? accent : theme.colors.fill,
                borderRadius: theme.radii.md,
              },
            ]}
          >
            <Icon
              name={iconKey}
              size={24}
              color={isSelected ? onColorForHex(accent) : theme.colors.primaryText}
            />
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
    gap: 10,
  },
  cell: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
