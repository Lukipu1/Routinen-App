import React from 'react';
import { StyleSheet, View } from 'react-native';

import { PICKABLE_ICONS, type IconKey } from '../../constants/icons';
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
    <View style={styles.grid}>
      {PICKABLE_ICONS.map((iconKey) => {
        const isSelected = iconKey === value;
        return (
          <PressableScale
            key={iconKey}
            onPress={() => onChange(iconKey)}
            haptic="selection"
            scaleTo={0.9}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Symbol ${iconKey}`}
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
              color={isSelected ? theme.colors.onAccent : theme.colors.primaryText}
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
