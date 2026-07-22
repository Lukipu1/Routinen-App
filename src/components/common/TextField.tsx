import React from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
}

/** Themed single/multi-line text input with label and error state. */
export function TextField({
  label,
  error,
  multiline,
  ...rest
}: TextFieldProps): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="caption" color="secondaryText" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.tertiaryText}
        multiline={multiline}
        style={[
          styles.input,
          theme.typography.body,
          {
            color: theme.colors.primaryText,
            backgroundColor: theme.colors.fill,
            borderRadius: theme.radii.md,
            borderWidth: error ? 1 : 0,
            borderColor: error ? theme.colors.error : 'transparent',
            minHeight: multiline ? 72 : 48,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
        {...rest}
      />
      {error ? (
        <AppText variant="caption" style={{ color: theme.colors.error, marginTop: 4 }}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { marginLeft: 4 },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
