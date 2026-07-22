import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../theme/ThemeProvider';
import { AppText } from './AppText';
import { IconButton } from './Buttons';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

/**
 * Modal bottom sheet for short actions. Built on the platform Modal (slide
 * animation, backdrop-tap and back-button to dismiss) for reliable behaviour on
 * both platforms.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: BottomSheetProps): React.ReactElement {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.fill}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: theme.colors.overlay }]}
          onPress={onClose}
          accessibilityLabel="Schließen"
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.elevatedBackground,
              borderTopLeftRadius: theme.radii.lg,
              borderTopRightRadius: theme.radii.lg,
              paddingBottom: insets.bottom + theme.spacing.base,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.separator }]} />
          <View style={[styles.header, { paddingHorizontal: theme.spacing.base }]}>
            <AppText variant="headline">{title ?? ''}</AppText>
            <IconButton iconName="close" accessibilityLabel="Schließen" onPress={onClose} size={32} />
          </View>
          <View style={{ paddingHorizontal: theme.spacing.base }}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  sheet: {
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
});
