import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/common/AppText';
import { PrimaryButton, SecondaryButton } from '../../components/common/Buttons';
import { Card } from '../../components/common/Card';
import { Chip } from '../../components/common/Chip';
import { Icon } from '../../components/common/Icon';
import { useToast } from '../../components/common/Toast';
import { ONBOARDING_PHOTOS, photoForCategory } from '../../constants/photos';
import { ROUTINE_TEMPLATES, findTemplate, templateToRoutine } from '../../data/templates';
import { requestNotificationPermission } from '../../services/notifications';
import { haptics } from '../../services/haptics';
import { useUpdatePreferences } from '../../hooks/usePreferences';
import { formatDuration, pluralize } from '../../utils/format';
import { estimateDuration } from '../routines/draft';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';

const DAY_START_OPTIONS = [6, 7, 8, 9];

/** Calm 3:2 photograph above the page title; decorative, so hidden from screen readers. */
function OnboardingPhoto({ source }: { source: React.ComponentProps<typeof Image>['source'] }): React.ReactElement {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  // Explicit size: `aspectRatio` alone is not honoured consistently on web.
  const photoWidth = Math.min(width - 40, 420);
  return (
    <Image
      source={source}
      style={[styles.photo, { width: photoWidth, height: Math.round((photoWidth * 2) / 3), borderRadius: theme.radii.lg }]}
      resizeMode="cover"
      accessible={false}
      accessibilityIgnoresInvertColors
    />
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
      if (template) {
        // The chosen day start becomes the morning routine's start time, and a
        // freshly granted notification permission turns its reminder on.
        await saveRoutine(
          templateToRoutine(template, new Date(), {
            startTime:
              template.category === 'morning' ? `${String(dayStartHour).padStart(2, '0')}:00` : undefined,
            reminderEnabled: notificationsAllowed,
          }),
        );
      }
      // The samples are seeded here (not at launch) so the template the user
      // just picked is left out instead of showing up twice.
      await seedSampleData(template ? [template.key] : []);
      update({ onboardingCompleted: true, dayStartHour });
      router.replace('/');
    } catch {
      toast('Das hat leider nicht geklappt', 'error');
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
          <Pressable
            onPress={() => void finish(false)}
            accessibilityRole="button"
            accessibilityLabel="Einführung überspringen"
            hitSlop={8}
            style={({ pressed }) => [styles.skip, { opacity: pressed ? 0.5 : 1 }]}
          >
            <AppText variant="body" style={{ color: theme.colors.accent }}>
              Überspringen
            </AppText>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {page === 1 ? (
          <View style={styles.page}>
            <OnboardingPhoto source={ONBOARDING_PHOTOS.welcome} />
            <AppText variant="largeTitle" center accessibilityRole="header">
              Routinen, die sich in deinen Tag einfügen
            </AppText>
            <AppText variant="body" color="secondaryText" center>
              Plane feste Abläufe und führe sie Schritt für Schritt durch – ruhig und ohne Ablenkung.
            </AppText>
          </View>
        ) : page === 2 ? (
          <View style={styles.page}>
            <OnboardingPhoto source={ONBOARDING_PHOTOS.dayStart} />
            <AppText variant="largeTitle" center accessibilityRole="header">
              Wann beginnt dein Tag?
            </AppText>
            <AppText variant="body" color="secondaryText" center>
              Deine Morgenroutine startet dann um diese Zeit. Du kannst das jederzeit ändern.
            </AppText>
            <View style={styles.chipRow} accessibilityRole="radiogroup">
              {DAY_START_OPTIONS.map((hour) => (
                <Chip
                  key={hour}
                  label={`${String(hour).padStart(2, '0')}:00`}
                  accessibilityLabel={`${hour} Uhr`}
                  selected={dayStartHour === hour}
                  onPress={() => setDayStartHour(hour)}
                />
              ))}
            </View>
            <SecondaryButton
              title={notificationsAllowed ? 'Benachrichtigungen erlaubt' : 'Benachrichtigungen erlauben'}
              iconName="bell"
              onPress={allowNotifications}
              disabled={notificationsAllowed}
            />
          </View>
        ) : (
          <View style={styles.page}>
            <AppText variant="largeTitle" center accessibilityRole="header">
              Wähle eine erste Routine
            </AppText>
            <AppText variant="body" color="secondaryText" center>
              Du kannst sie danach beliebig anpassen.
            </AppText>
            <Card padded={false} style={styles.templateList}>
              <View accessibilityRole="radiogroup">
                {ROUTINE_TEMPLATES.map((template, index) => {
                  const selected = templateKey === template.key;
                  const last = index === ROUTINE_TEMPLATES.length - 1;
                  const stepCount = template.steps.length;
                  const duration = formatDuration(
                    estimateDuration(template.steps.map((s) => ({ durationInSeconds: s.durationInSeconds }))),
                  );
                  return (
                    <Pressable
                      key={template.key}
                      onPress={() => {
                        void haptics.selection();
                        setTemplateKey(template.key);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      accessibilityLabel={`${template.title}, ${stepCount} ${pluralize(stepCount, 'Schritt', 'Schritte')}, ${duration}`}
                      style={({ pressed }) => [styles.templateRow, pressed ? { backgroundColor: theme.colors.fill } : null]}
                    >
                      <Image
                        source={photoForCategory(template.category)}
                        style={styles.templateThumb}
                        accessibilityIgnoresInvertColors
                      />
                      <View
                        style={[
                          styles.templateBody,
                          {
                            borderBottomColor: theme.colors.separator,
                            borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth,
                          },
                        ]}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <AppText variant="headline">{template.title}</AppText>
                          <AppText variant="caption" color="secondaryText">
                            {stepCount} {pluralize(stepCount, 'Schritt', 'Schritte')} · {duration}
                          </AppText>
                        </View>
                        <View style={styles.checkSlot}>
                          {selected ? <Icon name="check" size={22} color={theme.colors.accent} strokeWidth={2.75} /> : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          </View>
        )}
      </ScrollView>

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
  skipRow: { alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 6, minHeight: 44 },
  skip: { paddingHorizontal: 8, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingBottom: 16 },
  page: { alignItems: 'center', gap: 14 },
  photo: {
    marginBottom: 10,
    backgroundColor: '#D1D1D6',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginTop: 4, marginBottom: 4 },
  templateList: { alignSelf: 'stretch', marginTop: 8 },
  templateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
  },
  templateThumb: { width: 56, height: 56, borderRadius: 12, marginRight: 14, backgroundColor: '#D1D1D6' },
  templateBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingRight: 16,
    minHeight: 76,
  },
  checkSlot: { width: 24, alignItems: 'flex-end' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
  },
  grow: { flex: 1 },
});
