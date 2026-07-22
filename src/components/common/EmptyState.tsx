import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PrimaryButton } from './Buttons';

interface EmptyStateProps {
  icon: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  accentColor?: string;
}

/** Friendly empty placeholder built from a simple icon + shape, not artwork. */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
  accentColor,
}: EmptyStateProps): React.ReactElement {
  const theme = useTheme();
  const accent = accentColor ?? theme.colors.accent;

  return (
    <View style={[styles.container, { padding: theme.spacing.xl }]}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: theme.colors.accentMuted, marginBottom: theme.spacing.lg },
        ]}
      >
        <Icon name={icon} size={40} color={accent} />
      </View>
      <AppText variant="title" center>
        {title}
      </AppText>
      {message ? (
        <AppText
          variant="body"
          color="secondaryText"
          center
          style={{ marginTop: theme.spacing.sm }}
        >
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.xl, alignSelf: 'stretch' }}>
          <PrimaryButton title={actionLabel} onPress={onAction} accentColor={accent} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
