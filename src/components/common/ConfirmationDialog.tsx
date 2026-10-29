import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';

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

/**
 * System-style alert: a compact centered card with the title in headline
 * weight, a short message, and the actions as text buttons separated by
 * hairlines. Cancel is emphasised, a destructive action is red and never the
 * bold default (HIG › Alerts).
 */
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
  const { colors } = theme;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.overlay }]} onPress={onCancel}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.elevatedBackground }]}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
        >
          <View style={styles.body}>
            <AppText variant="headline" center accessibilityRole="header">
              {title}
            </AppText>
            {message ? (
              <AppText variant="caption" center style={{ marginTop: 6, color: colors.primaryText }}>
                {message}
              </AppText>
            ) : null}
          </View>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <Pressable
            onPress={onConfirm}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed ? { backgroundColor: colors.fill } : null]}
          >
            <AppText variant="body" center style={{ color: destructive ? colors.error : colors.accent }}>
              {confirmLabel}
            </AppText>
          </Pressable>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            style={({ pressed }) => [styles.action, pressed ? { backgroundColor: colors.fill } : null]}
          >
            <AppText variant="body" weight="600" center style={{ color: colors.accent }}>
              {cancelLabel}
            </AppText>
          </Pressable>
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
    width: 280,
    maxWidth: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  body: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 },
  divider: { height: StyleSheet.hairlineWidth, width: '100%' },
  action: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 12 },
});
