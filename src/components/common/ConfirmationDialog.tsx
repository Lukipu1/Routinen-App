import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { Button } from './Button';

interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centered confirmation dialog for irreversible or important actions. */
export function ConfirmationDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Abbrechen',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps): React.ReactElement {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
        onPress={onCancel}
      >
        <Pressable
          style={[
            styles.card,
            { backgroundColor: theme.colors.elevatedBackground, borderRadius: theme.radii.lg },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
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
          <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
            {destructive ? (
              <Button variant="destructive" title={confirmLabel} onPress={onConfirm} />
            ) : (
              <PrimaryButton title={confirmLabel} onPress={onConfirm} />
            )}
            <SecondaryButton title={cancelLabel} onPress={onCancel} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
  },
});
