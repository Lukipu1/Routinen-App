import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  /** Optional element rendered on the trailing side (e.g. a settings button). */
  trailing?: React.ReactNode;
}

/** Large screen title with optional subtitle and a trailing action. */
export function AppHeader({ title, subtitle, trailing }: AppHeaderProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.container, { marginBottom: theme.spacing.md }]}>
      <View style={styles.textColumn}>
        {subtitle ? (
          <AppText variant="callout" color="secondaryText">
            {subtitle}
          </AppText>
        ) : null}
        <AppText variant="largeTitle" accessibilityRole="header">
          {title}
        </AppText>
      </View>
      {trailing ? <View>{trailing}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  textColumn: { flexShrink: 1 },
});
