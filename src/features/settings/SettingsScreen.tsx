import Constants from 'expo-constants';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { AppSwitch } from '../../components/common/AppSwitch';
import { AppText } from '../../components/common/AppText';
import { BottomSheet } from '../../components/common/BottomSheet';
import { Card } from '../../components/common/Card';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { SectionHeader } from '../../components/common/SectionHeader';
import { SettingRow } from '../../components/common/SettingRow';
import { useToast } from '../../components/common/Toast';
import { PHOTO_CREDITS } from '../../constants/photos';
import { haptics } from '../../services/haptics';
import { usePreferences, useUpdatePreferences } from '../../hooks/usePreferences';
import { exportBackupFile, pickBackupFile, restoreBackup, type Backup } from '../../services/backup';
import {
  cancelAllReminders,
  getNotificationPermission,
  requestNotificationPermission,
} from '../../services/notifications';
import type { ThemePreference } from '../../theme/types';
import type { WeekStart } from '../../types/common';
import { requestReminderSync, useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';

interface SegmentOption<T> {
  label: string;
  value: T;
}

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}): React.ReactElement {
  const theme = useTheme();
  // The selected segment is a raised white (or lighter grey) pill, like UISegmentedControl.
  const selectedStyle =
    theme.scheme === 'dark'
      ? { backgroundColor: theme.colors.fillStrong }
      : {
          backgroundColor: theme.colors.secondaryBackground,
          shadowColor: '#000000',
          shadowOpacity: 0.12,
          shadowRadius: 3,
          shadowOffset: { width: 0, height: 1 },
          elevation: 1,
        };
  return (
    <View
      style={[styles.segmented, { backgroundColor: theme.colors.fill, borderRadius: theme.radii.sm }]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            onPress={() => {
              void haptics.selection();
              onChange(option.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.segment,
              { borderRadius: theme.radii.sm - 2 },
              selected ? selectedStyle : null,
              pressed && !selected ? { opacity: 0.6 } : null,
            ]}
          >
            <AppText variant="callout" weight={selected ? '600' : '400'} maxFontSizeMultiplier={1.4}>
              {option.label}
            </AppText>
          </Pressable>
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
  const resetSampleData = useAppStore((s) => s.resetSampleData);
  const clearAllData = useAppStore((s) => s.clearAllData);
  const refresh = useAppStore((s) => s.refresh);
  const [pendingImport, setPendingImport] = useState<Backup | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [askNotifications, setAskNotifications] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const version = Constants.expoConfig?.version ?? '1.0.0';

  // The switch must tell the truth: if the OS permission was revoked in the
  // meantime, turn the preference off instead of pretending reminders work.
  useFocusEffect(
    useCallback(() => {
      if (!preferences.notificationsEnabled) return;
      let active = true;
      void getNotificationPermission().then((granted) => {
        if (active && !granted) {
          update({ notificationsEnabled: false });
          toast('Benachrichtigungen sind im System deaktiviert', 'default');
        }
      });
      return () => {
        active = false;
      };
    }, [preferences.notificationsEnabled, update, toast]),
  );

  const enableNotifications = async (): Promise<void> => {
    setAskNotifications(false);
    const granted = await requestNotificationPermission();
    if (!granted) {
      toast('Benachrichtigungen nicht erlaubt', 'error');
      update({ notificationsEnabled: false });
      return;
    }
    update({ notificationsEnabled: true });
    requestReminderSync();
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

  const runGuarded = async (action: () => Promise<void>, success: string | null): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      if (success) toast(success, 'success');
    } catch (error) {
      toast(error instanceof Error && error.message ? error.message : 'Das hat leider nicht geklappt', 'error');
    } finally {
      setBusy(false);
    }
  };

  const chooseImport = (): void =>
    void runGuarded(async () => {
      const backup = await pickBackupFile();
      if (backup) setPendingImport(backup);
    }, null);

  const applyImport = (): void => {
    const backup = pendingImport;
    setPendingImport(null);
    if (!backup) return;
    void runGuarded(async () => {
      const summary = await restoreBackup(backup);
      await refresh();
      toast(
        `${summary.routines} ${summary.routines === 1 ? 'Routine' : 'Routinen'} wiederhergestellt`,
        'success',
      );
    }, null);
  };

  return (
    <ScreenContainer scroll>
      <AppHeader title="Einstellungen" />

      <SectionHeader title="Darstellung" />
      <Card style={styles.appearance}>
        <View style={styles.stack}>
          <AppText variant="body">Design</AppText>
          <Segmented<ThemePreference>
            accessibilityLabel="Design"
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
            accessibilityLabel="Wochenbeginn"
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
          description="Erinnerungen vor dem Start und am Ende eines Timers"
          icon="bell"
          right={
            <AppSwitch
              value={preferences.notificationsEnabled}
              onValueChange={onToggleNotifications}
              accessibilityLabel="Benachrichtigungen"
            />
          }
        />
        <SettingRow
          label="Haptik"
          description="Kurze Vibration beim Tippen und Erledigen"
          icon="sparkles"
          right={
            <AppSwitch
              value={preferences.hapticsEnabled}
              onValueChange={(hapticsEnabled) => update({ hapticsEnabled })}
              accessibilityLabel="Haptik"
            />
          }
        />
        <SettingRow
          label="Reduzierte Bewegungen"
          description="Animationen abschalten"
          icon="activity"
          right={
            <AppSwitch
              value={preferences.reducedMotion}
              onValueChange={(reducedMotion) => update({ reducedMotion })}
              accessibilityLabel="Reduzierte Bewegungen"
            />
          }
          last
        />
      </Card>

      <SectionHeader title="Daten" />
      <Card style={styles.group}>
        <SettingRow
          label="Sicherung exportieren"
          description="Alle Routinen und Verläufe als JSON-Datei teilen"
          icon="copy"
          onPress={() => void runGuarded(() => exportBackupFile(), null)}
        />
        <SettingRow
          label="Sicherung importieren"
          description="Ersetzt die aktuellen Daten durch eine Sicherungsdatei"
          icon="checklist"
          onPress={chooseImport}
          last
        />
      </Card>
      <Card style={styles.group}>
        <SettingRow
          label="Beispieldaten wiederherstellen"
          description="Ersetzt alle Routinen und Verläufe durch die Beispiele"
          icon="copy"
          destructive
          onPress={() => setConfirmReset(true)}
        />
        <SettingRow
          label="Alle Daten löschen"
          description="Routinen, Planungen und Verläufe dauerhaft entfernen"
          icon="trash"
          destructive
          onPress={() => setConfirmClear(true)}
          last
        />
      </Card>

      <SectionHeader title="Info" />
      <Card style={styles.group}>
        <SettingRow label="Datenschutz" icon="checklist" onPress={() => setPrivacyOpen(true)} />
        <SettingRow label="Bildnachweise" icon="sun" onPress={() => setCreditsOpen(true)} />
        <SettingRow
          label="Version"
          icon="sparkles"
          right={
            <AppText variant="body" color="secondaryText">
              {version}
            </AppText>
          }
          last
        />
      </Card>

      <ConfirmationDialog
        visible={confirmReset}
        title="Beispieldaten wiederherstellen?"
        message="Alle deine Routinen, Planungen und Verläufe werden gelöscht und durch die drei Beispielroutinen ersetzt. Das lässt sich nicht rückgängig machen."
        confirmLabel="Alles ersetzen"
        destructive
        onConfirm={() => {
          setConfirmReset(false);
          void runGuarded(resetSampleData, 'Beispieldaten wiederhergestellt');
        }}
        onCancel={() => setConfirmReset(false)}
      />
      <ConfirmationDialog
        visible={confirmClear}
        title="Alle Daten löschen?"
        message="Alle Routinen, Planungen und Verläufe werden dauerhaft entfernt."
        confirmLabel="Alles löschen"
        destructive
        onConfirm={() => {
          setConfirmClear(false);
          void runGuarded(clearAllData, 'Alle Daten gelöscht');
        }}
        onCancel={() => setConfirmClear(false)}
      />
      <ConfirmationDialog
        visible={pendingImport !== null}
        title="Sicherung einspielen?"
        message={
          pendingImport
            ? `Die Datei enthält ${pendingImport.routines.length} Routinen und ${pendingImport.completions.length} Abschlüsse. Deine aktuellen Daten werden dabei ersetzt.`
            : undefined
        }
        confirmLabel="Daten ersetzen"
        destructive
        onConfirm={applyImport}
        onCancel={() => setPendingImport(null)}
      />
      <ConfirmationDialog
        visible={askNotifications}
        title="Erinnerungen aktivieren?"
        message="Routinen erinnern dich kurz vor dem Start, und ein Timer meldet sich, wenn er abläuft – ganz ohne Konto und nur lokal auf diesem Gerät."
        confirmLabel="Erlauben"
        cancelLabel="Später"
        onConfirm={enableNotifications}
        onCancel={() => setAskNotifications(false)}
      />

      <BottomSheet visible={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Datenschutz">
        <AppText variant="body" color="secondaryText" style={{ marginBottom: 16 }}>
          Alle deine Routinen, Planungen und Fortschrittsdaten werden ausschließlich lokal auf
          diesem Gerät gespeichert. Es gibt kein Konto, keine Anmeldung und keine Übertragung an
          externe Server. Benachrichtigungen werden vom Gerät selbst geplant.
        </AppText>
      </BottomSheet>
      <BottomSheet visible={creditsOpen} onClose={() => setCreditsOpen(false)} title="Bildnachweise">
        <AppText variant="body" color="secondaryText" style={{ marginBottom: 16 }}>
          {PHOTO_CREDITS}
        </AppText>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  group: {
    marginBottom: 20,
  },
  appearance: {
    marginBottom: 20,
  },
  stack: { gap: 10 },
  segmented: {
    flexDirection: 'row',
    padding: 2,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
});
