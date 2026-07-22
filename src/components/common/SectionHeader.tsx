import React from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';

interface SectionHeaderProps {
  title: string;
  trailing?: React.ReactNode;
}

export function SectionHeader({ title, trailing }: SectionHeaderProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.row, { marginBottom: theme.spacing.sm }]}>
      <AppText variant="headline">{title}</AppText>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
