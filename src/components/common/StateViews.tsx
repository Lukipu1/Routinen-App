import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { Icon } from './Icon';
import { PrimaryButton } from './Buttons';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/** Centered error message with an optional retry action. */
export function ErrorState({
  title = 'Etwas ist schiefgelaufen',
  message,
  onRetry,
}: ErrorStateProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.centered, { padding: theme.spacing.xl }]}>
      <Icon name="close" size={40} color={theme.colors.error} />
      <AppText variant="title" center style={{ marginTop: theme.spacing.md }}>
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
      {onRetry ? (
        <View style={{ marginTop: theme.spacing.lg, alignSelf: 'stretch' }}>
          <PrimaryButton title="Erneut versuchen" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
