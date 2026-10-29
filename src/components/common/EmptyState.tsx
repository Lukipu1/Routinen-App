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
}

/** Quiet empty placeholder: a symbol, a title, one sentence, one action. */
export function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.container, { paddingVertical: theme.spacing.xxxl, paddingHorizontal: theme.spacing.xl }]}>
      <Icon name={icon} size={44} color={theme.colors.tertiaryText} strokeWidth={1.5} />
      <AppText variant="title" center style={{ marginTop: theme.spacing.base }}>
        {title}
      </AppText>
      {message ? (
        <AppText variant="callout" color="secondaryText" center style={{ marginTop: theme.spacing.sm, maxWidth: 320 }}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ marginTop: theme.spacing.xl }}>
          <PrimaryButton title={actionLabel} onPress={onAction} fullWidth={false} />
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
});
