import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

interface SettingRowProps {
  label: string;
  description?: string;
  icon?: string;
  iconColor?: string;
  /** Trailing accessory: a Switch, value text, chevron, etc. */
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

/** A single row in a settings group. Tappable when `onPress` is given. */
export function SettingRow({
  label,
  description,
  icon,
  iconColor,
  right,
  onPress,
  destructive = false,
}: SettingRowProps): React.ReactElement {
  const theme = useTheme();
  const labelColor = destructive ? theme.colors.error : theme.colors.primaryText;

  const content = (
    <View style={[styles.row, { paddingVertical: theme.spacing.md }]}>
      {icon ? (
        <View
          style={[
            styles.iconBox,
            { backgroundColor: theme.colors.fill, borderRadius: theme.radii.sm },
          ]}
        >
          <Icon name={icon} size={18} color={iconColor ?? labelColor} />
        </View>
      ) : null}
      <View style={styles.textColumn}>
        <AppText variant="body" style={{ color: labelColor }}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="caption" color="secondaryText">
            {description}
          </AppText>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );

  if (onPress) {
    return (
      <PressableScale onPress={onPress} scaleTo={0.99} accessibilityRole="button">
        {content}
      </PressableScale>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: { flex: 1 },
  right: { marginLeft: 'auto' },
});
