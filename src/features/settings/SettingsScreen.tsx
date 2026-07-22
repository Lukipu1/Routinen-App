import Constants from 'expo-constants';
import React, { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { AppText } from '../../components/common/AppText';
import { BottomSheet } from '../../components/common/BottomSheet';
import { Card } from '../../components/common/Card';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { PressableScale } from '../../components/common/PressableScale';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SectionHeader } from '../../components/common/SectionHeader';
import { SettingRow } from '../../components/common/SettingRow';
import { useToast } from '../../components/common/Toast';
import { usePreferences, useUpdatePreferences } from '../../hooks/usePreferences';
import {
  cancelAllReminders,
  requestNotificationPermission,
  rescheduleAllReminders,
} from '../../services/notifications';
import type { ThemePreference } from '../../theme/types';
import type { WeekStart } from '../../types/common';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';

interface SegmentOption<T> {
  label: string;
  value: T;
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
}): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: theme.colors.fill, borderRadius: theme.radii.sm }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            haptic="selection"
            scaleTo={0.97}
            style={[
              styles.segment,
              selected
                ? [{ backgroundColor: theme.colors.elevatedBackground, borderRadius: theme.radii.sm }, theme.shadows.card]
                : null,
            ]}
          >
            <AppText variant="callout" weight={selected ? '600' : '400'}>
              {option.label}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function SettingsScreen(): React.ReactElement {
  const theme = useTheme();
  const toast = useToast();
  const preferences = usePreferences();
  const update = useUpdatePreferences();
  const routines = useAppStore((s) => s.routines);
  const resetSampleData = useAppStore((s) => s.resetSampleData);
  const clearAllData = useAppStore((s) => s.clearAllData);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [askNotifications, setAskNotifications] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  const switchColors = { true: theme.colors.accent, false: theme.colors.fill };

  const enableNotifications = async (): Promise<void> => {
    setAskNotifications(false);
    const granted = await requestNotificationPermission();
    if (!granted) {
      toast('Benachrichtigungen nicht erlaubt', 'error');
      update({ notificationsEnabled: false });
      return;
    }
    update({ notificationsEnabled: true });
    await rescheduleAllReminders(routines);
    toast('Benachrichtigungen aktiv', 'success');
  };

  const onToggleNotifications = async (value: boolean): Promise<void> => {
    if (value) {
      setAskNotifications(true);
    } else {
      update({ notificationsEnabled: false });
      await cancelAllReminders();
    }
  };

  return (
    <ScreenContainer scroll>
      <AppHeader title="Einstellungen" />

      <SectionHeader title="Darstellung" />
      <Card style={styles.group}>
        <View style={styles.stack}>
          <AppText variant="body">Design</AppText>
          <Segmented<ThemePreference>
            options={[
              { label: 'Hell', value: 'light' },
              { label: 'Dunkel', value: 'dark' },
              { label: 'System', value: 'system' },
            ]}
            value={preferences.theme}
            onChange={(value) => update({ theme: value })}
          />
        </View>
        <View style={[styles.stack, { marginTop: theme.spacing.base }]}>
          <AppText variant="body">Wochenbeginn</AppText>
          <Segmented<WeekStart>
            options={[
              { label: 'Montag', value: 1 },
              { label: 'Sonntag', value: 0 },
            ]}
            value={preferences.weekStartsOn}
            onChange={(value) => update({ weekStartsOn: value })}
          />
        </View>
      </Card>

      <SectionHeader title="Benachrichtigungen & Feedback" />
      <Card style={styles.group}>
        <SettingRow
          label="Benachrichtigungen"
          description="Erinnerungen vor dem Start"
          icon="bell"
          right={
            <Switch
              value={preferences.notificationsEnabled}
              onValueChange={onToggleNotifications}
              trackColor={switchColors}
            />
          }
        />
        <SettingRow
          label="Haptik"
          icon="sparkles"
          right={
            <Switch
              value={preferences.hapticsEnabled}
              onValueChange={(hapticsEnabled) => update({ hapticsEnabled })}
              trackColor={switchColors}
            />
          }
        />
        <SettingRow
          label="Töne"
          icon="bell"
          right={
            <Switch
              value={preferences.soundsEnabled}
              onValueChange={(soundsEnabled) => update({ soundsEnabled })}
              trackColor={switchColors}
            />
          }
        />
        <SettingRow
          label="Reduzierte Bewegungen"
          icon="activity"
          right={
            <Switch
              value={preferences.reducedMotion}
              onValueChange={(reducedMotion) => update({ reducedMotion })}
              trackColor={switchColors}
            />
          }
        />
      </Card>

      <SectionHeader title="Daten" />
      <Card style={styles.group}>
        <SettingRow
          label="Beispieldaten zurücksetzen"
          icon="copy"
          onPress={() => setConfirmReset(true)}
          right={<View />}
        />
        <SettingRow
          label="Alle Daten löschen"
          icon="trash"
          destructive
          onPress={() => setConfirmClear(true)}
          right={<View />}
        />
      </Card>

      <SectionHeader title="Info" />
      <Card style={styles.group}>
        <SettingRow label="Datenschutz" icon="checklist" onPress={() => setPrivacyOpen(true)} right={<View />} />
        <SettingRow label="Version" icon="sparkles" right={<AppText variant="body" color="secondaryText">{version}</AppText>} />
      </Card>

      <ConfirmationDialog
        visible={confirmReset}
        title="Beispieldaten zurücksetzen?"
        message="Alle aktuellen Routinen und Verläufe werden durch die Beispieldaten ersetzt."
        confirmLabel="Zurücksetzen"
        destructive
        onConfirm={async () => {
          setConfirmReset(false);
          await resetSampleData();
          toast('Beispieldaten wiederhergestellt', 'success');
        }}
        onCancel={() => setConfirmReset(false)}
      />

      <ConfirmationDialog
        visible={confirmClear}
        title="Alle Daten löschen?"
        message="Alle Routinen, Planungen und Verläufe werden dauerhaft entfernt."
        confirmLabel="Alles löschen"
        destructive
        onConfirm={async () => {
          setConfirmClear(false);
          await clearAllData();
          await cancelAllReminders();
          toast('Alle Daten gelöscht');
        }}
        onCancel={() => setConfirmClear(false)}
      />

      <ConfirmationDialog
        visible={askNotifications}
        title="Erinnerungen aktivieren?"
        message="Routinen erinnern dich kurz vor dem Start – ganz ohne Konto und nur lokal auf diesem Gerät."
        confirmLabel="Erlauben"
        cancelLabel="Später"
        onConfirm={enableNotifications}
        onCancel={() => setAskNotifications(false)}
      />

      <BottomSheet visible={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Datenschutz">
        <AppText variant="body" color="secondaryText" style={{ marginBottom: 16 }}>
          Alle deine Routinen, Planungen und Fortschrittsdaten werden ausschließlich lokal auf
          diesem Gerät gespeichert. Es gibt kein Konto, keine Anmeldung und keine Übertragung an
          externe Server.
        </AppText>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 8,
    paddingVertical: 4,
  },
  stack: { gap: 10 },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});
