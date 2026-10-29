import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface SettingRowProps {
  label: string;
  description?: string;
  icon?: string;
  /** Trailing accessory: a Switch, value text, etc. Rows with `onPress` get a chevron by default. */
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  /** Hides the hairline below the row (last row of a group). */
  last?: boolean;
  /** Spoken name when the visible label alone is ambiguous. */
  accessibilityLabel?: string;
}

/**
 * A row in a grouped (inset) list, like iOS Settings: leading symbol tile,
 * primary label with optional footnote, trailing accessory, hairline
 * separator that starts at the text (not the edge).
 */
export function SettingRow({
  label,
  description,
  icon,
  right,
  onPress,
  destructive = false,
  last = false,
  accessibilityLabel,
}: SettingRowProps): React.ReactElement {
  const theme = useTheme();
  const labelColor = destructive ? theme.colors.error : theme.colors.primaryText;
  const accessory = right ?? (onPress ? <Icon name="chevronRight" size={18} color={theme.colors.tertiaryText} strokeWidth={2.5} /> : null);

  const content = (
    <View style={styles.row}>
      {icon ? (
        <View style={[styles.iconTile, { backgroundColor: destructive ? theme.colors.errorMuted : theme.colors.fill }]}>
          <Icon name={icon} size={17} color={destructive ? theme.colors.error : theme.colors.secondaryText} strokeWidth={2.25} />
        </View>
      ) : null}
      <View
        style={[
          styles.main,
          { borderBottomColor: theme.colors.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
        ]}
      >
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
        {accessory ? <View style={styles.right}>{accessory}</View> : null}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (description ? `${label}. ${description}` : label)}
        style={({ pressed }) => (pressed ? { backgroundColor: theme.colors.fill } : null)}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    minHeight: 48,
  },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingRight: 16,
    minHeight: 48,
  },
  textColumn: { flex: 1, gap: 1 },
  right: { marginLeft: 'auto', alignItems: 'flex-end' },
});
