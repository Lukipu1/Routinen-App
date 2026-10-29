import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/common/AppText';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { Icon } from '../../components/common/Icon';
import { PressableScale } from '../../components/common/PressableScale';
import { useToast } from '../../components/common/Toast';
import { ROUTINE_COLORS, resolveRoutineColor } from '../../constants/colors';
import { ROUTINE_TEMPLATES, findTemplate, templateToRoutine } from '../../data/templates';
import { requestNotificationPermission } from '../../services/notifications';
import { useUpdatePreferences } from '../../hooks/usePreferences';
import { formatDuration } from '../../utils/format';
import { estimateDuration } from '../routines/draft';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';

const DAY_START_OPTIONS = [6, 7, 8, 9];

function OnboardingArt({ icon, color }: { icon: string; color: string }): React.ReactElement {
  return (
    <View style={styles.art}>
      <View style={[styles.blob, { backgroundColor: ROUTINE_COLORS.teal, top: 10, left: 30, opacity: 0.25 }]} />
      <View style={[styles.blob, { backgroundColor: ROUTINE_COLORS.orange, bottom: 0, right: 20, opacity: 0.25 }]} />
      <View style={[styles.artCircle, { backgroundColor: color }]}>
        <Icon name={icon} size={64} color="#FFFFFF" />
      </View>
    </View>
  );
}

export function OnboardingScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const update = useUpdatePreferences();
  const saveRoutine = useAppStore((s) => s.saveRoutine);
  const seedSampleData = useAppStore((s) => s.seedSampleData);
  const [page, setPage] = useState(1);
  const [dayStartHour, setDayStartHour] = useState(7);
  const [templateKey, setTemplateKey] = useState('morning');
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const finish = async (createRoutine: boolean): Promise<void> => {
    if (finishing) return;
    setFinishing(true);
    try {
      const template = createRoutine ? findTemplate(templateKey) : undefined;
      if (template) await saveRoutine(templateToRoutine(template));
      // The samples are seeded here (not at launch) so the template the user
      // just picked is left out instead of showing up twice.
      await seedSampleData(template ? [template.key] : []);
      update({ onboardingCompleted: true, dayStartHour });
      router.replace('/');
    } finally {
      setFinishing(false);
    }
  };

  const allowNotifications = async (): Promise<void> => {
    const granted = await requestNotificationPermission();
    setNotificationsAllowed(granted);
    // Record the choice right away so it survives "Überspringen".
    update({ notificationsEnabled: granted });
    toast(granted ? 'Benachrichtigungen erlaubt' : 'Ohne Benachrichtigungen', granted ? 'success' : 'default');
  };

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <View style={styles.skipRow}>
        {page < 3 ? (
          <PressableScale onPress={() => void finish(false)} accessibilityRole="button">
            <AppText variant="callout" color="secondaryText">
              Überspringen
            </AppText>
          </PressableScale>
        ) : (
          <View />
        )}
      </View>

      <View style={styles.content}>
        {page === 1 ? (
          <View style={styles.page}>
            <OnboardingArt icon="sparkles" color={theme.colors.accent} />
            <AppText variant="largeTitle" center>
              Routinen, die sich in deinen Tag einfügen
            </AppText>
            <AppText variant="body" color="secondaryText" center>
              Plane feste Abläufe und führe sie Schritt für Schritt durch – ruhig und ohne Ablenkung.
            </AppText>
          </View>
        ) : page === 2 ? (
          <View style={styles.page}>
            <OnboardingArt icon="sunrise" color={ROUTINE_COLORS.orange} />
            <AppText variant="largeTitle" center>
              Wann beginnt dein Tag?
            </AppText>
            <View style={styles.chipRow}>
              {DAY_START_OPTIONS.map((hour) => {
                const selected = dayStartHour === hour;
                return (
                  <PressableScale
                    key={hour}
                    onPress={() => setDayStartHour(hour)}
                    haptic="selection"
                    scaleTo={0.94}
                    style={[
                      styles.chip,
                      { backgroundColor: selected ? theme.colors.accent : theme.colors.fill, borderRadius: theme.radii.pill },
                    ]}
                  >
                    <AppText
                      variant="headline"
                      style={{ color: selected ? theme.colors.onAccent : theme.colors.primaryText }}
                    >
                      {`${String(hour).padStart(2, '0')}:00`}
                    </AppText>
                  </PressableScale>
                );
              })}
            </View>
            <SecondaryButton
              title={notificationsAllowed ? 'Benachrichtigungen erlaubt' : 'Benachrichtigungen erlauben'}
              iconName="bell"
              onPress={allowNotifications}
            />
          </View>
        ) : (
          <View style={styles.page}>
            <AppText variant="largeTitle" center>
              Wähle eine erste Routine
            </AppText>
            <View style={styles.templateList}>
              {ROUTINE_TEMPLATES.map((template) => {
                const selected = templateKey === template.key;
                const color = resolveRoutineColor(template.color);
                return (
                  <PressableScale
                    key={template.key}
                    onPress={() => setTemplateKey(template.key)}
                    scaleTo={0.98}
                    style={[
                      styles.templateCard,
                      {
                        backgroundColor: theme.colors.secondaryBackground,
                        borderRadius: theme.radii.md,
                        borderWidth: 2,
                        borderColor: selected ? color : 'transparent',
                      },
                    ]}
                  >
                    <View style={[styles.templateIcon, { backgroundColor: color }]}>
                      <Icon name={template.icon} size={22} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText variant="headline">{template.title}</AppText>
                      <AppText variant="caption" color="secondaryText">
                        {template.steps.length} Schritte ·{' '}
                        {formatDuration(estimateDuration(template.steps.map((s) => ({ durationInSeconds: s.durationInSeconds }))))}
                      </AppText>
                    </View>
                    {selected ? <Icon name="check" size={22} color={color} /> : null}
                  </PressableScale>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {page > 1 ? (
          <SecondaryButton title="Zurück" onPress={() => setPage((p) => p - 1)} fullWidth={false} />
        ) : (
          <View />
        )}
        {page < 3 ? (
          <PrimaryButton title="Weiter" onPress={() => setPage((p) => p + 1)} fullWidth={false} style={styles.grow} />
        ) : (
          <PrimaryButton
            title="Routine erstellen"
            onPress={() => void finish(true)}
            loading={finishing}
            fullWidth={false}
            style={styles.grow}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 20, paddingVertical: 8, minHeight: 32 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  page: { alignItems: 'center', gap: 18 },
  art: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  artCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: { position: 'absolute', width: 90, height: 90, borderRadius: 45 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: { paddingHorizontal: 20, paddingVertical: 12 },
  templateList: { alignSelf: 'stretch', gap: 10, marginTop: 8 },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  grow: { flex: 1 },
});
