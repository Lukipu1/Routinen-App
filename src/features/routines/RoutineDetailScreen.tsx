import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ImageBackground, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/common/AppText';
import { PrimaryButton, IconButton } from '../../components/common/Buttons';
import { Card } from '../../components/common/Card';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { CONTENT_MAX_WIDTH } from '../../components/common/ScreenContainer';
import { SectionHeader } from '../../components/common/SectionHeader';
import { SettingRow } from '../../components/common/SettingRow';
import { useToast } from '../../components/common/Toast';
import { StepListItem } from '../../components/routine/StepListItem';
import { resolveRoutineColor } from '../../constants/colors';
import { CATEGORY_META } from '../../constants/categories';
import { photoForCategory } from '../../constants/photos';
import { summariseWeekdays } from '../../constants/weekdays';
import { usePreferences } from '../../hooks/usePreferences';
import { useToday } from '../../hooks/useToday';
import { formatDuration, pluralize } from '../../utils/format';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';

const WHITE = '#FFFFFF';
const WHITE_MUTED = 'rgba(255,255,255,0.9)';
const BAR_BUTTON_BG = 'rgba(0,0,0,0.45)';

/**
 * Routine details in the style of an App Store or Fitness detail page: the
 * category photograph as the header with the title set on a dark gradient,
 * then grouped cells for schedule, steps and actions.
 */
export function RoutineDetailScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const preferences = usePreferences();
  const params = useLocalSearchParams<{ id: string }>();
  const routine = useAppStore((s) => s.routines.find((r) => r.id === params.id));
  const duplicateRoutine = useAppStore((s) => s.duplicateRoutine);
  const toggleActive = useAppStore((s) => s.toggleRoutineActive);
  const deleteRoutine = useAppStore((s) => s.deleteRoutine);
  const addForToday = useAppStore((s) => s.addRoutineForToday);
  const { planned } = useToday();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!routine) {
    return (
      <SafeAreaView style={[styles.flex, { backgroundColor: theme.colors.background }]}>
        <EmptyState
          icon="checklist"
          title="Routine nicht gefunden"
          actionLabel="Zurück"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const accent = resolveRoutineColor(routine.color);
  const todayEntry = planned.find((p) => p.routine.id === routine.id);
  const plannedToday = todayEntry !== undefined && todayEntry.status !== 'skipped';
  const stepCount = routine.steps.length;
  const meta = [
    routine.estimatedDuration > 0 ? formatDuration(routine.estimatedDuration) : null,
    `${stepCount} ${pluralize(stepCount, 'Schritt', 'Schritte')}`,
  ]
    .filter(Boolean)
    .join(' · ');

  const run = async (action: () => Promise<void>, success: string): Promise<void> => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
      toast(success, 'success');
    } catch {
      toast('Das hat leider nicht geklappt', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setConfirmDelete(false);
    await run(() => deleteRoutine(routine.id), 'Routine gelöscht');
    router.back();
  };

  return (
    <View style={[styles.flex, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ImageBackground
          source={photoForCategory(routine.category)}
          style={styles.hero}
          imageStyle={styles.heroImage}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
            locations={[0, 0.3, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroText}>
            <AppText variant="caption" weight="600" style={{ color: WHITE_MUTED }}>
              {CATEGORY_META[routine.category].label}
            </AppText>
            <AppText variant="largeTitle" style={{ color: WHITE }} accessibilityRole="header" numberOfLines={3}>
              {routine.title}
            </AppText>
            <AppText variant="callout" style={{ color: WHITE }}>
              {meta}
            </AppText>
          </View>
        </ImageBackground>

        <View style={[styles.content, { padding: theme.spacing.base, gap: theme.spacing.lg }]}>
          {!routine.isActive ? (
            <AppText variant="callout" style={{ color: theme.colors.warningText, paddingHorizontal: 4 }} weight="600">
              Inaktiv – erscheint nicht im Tagesplan
            </AppText>
          ) : null}
          {routine.description ? (
            <AppText variant="body" color="secondaryText" style={{ paddingHorizontal: 4 }}>
              {routine.description}
            </AppText>
          ) : null}

          <PrimaryButton
            title={plannedToday ? 'Heute bereits geplant' : 'Für heute einplanen'}
            iconName={plannedToday ? 'check' : 'calendar'}
            disabled={plannedToday}
            onPress={() => run(() => addForToday(routine.id), 'Für heute eingeplant')}
          />

          <View>
            <SectionHeader title="Zeitplan" />
            <Card padded={false}>
              <Row label="Wochentage" value={summariseWeekdays(routine.schedule.weekdays, preferences.weekStartsOn)} />
              <Row
                label="Startzeit"
                value={routine.schedule.flexible ? 'Flexibel' : (routine.schedule.startTime ?? '—')}
              />
              <Row
                label="Erinnerung"
                value={
                  routine.reminder.enabled
                    ? routine.reminder.minutesBefore === 0
                      ? 'Zum Start'
                      : `${routine.reminder.minutesBefore} Min vorher`
                    : 'Aus'
                }
                last
              />
            </Card>
          </View>

          <View>
            <SectionHeader title="Schritte" />
            <Card padded={false}>
              {routine.steps.map((step, index) => (
                <StepListItem
                  key={step.id}
                  step={step}
                  index={index}
                  accentColor={accent}
                  last={index === routine.steps.length - 1}
                />
              ))}
            </Card>
          </View>

          <View>
            <Card padded={false}>
              <SettingRow
                label="Bearbeiten"
                icon="edit"
                onPress={() => router.push({ pathname: '/editor', params: { id: routine.id } })}
                accessibilityLabel="Routine bearbeiten"
              />
              <SettingRow
                label="Duplizieren"
                icon="copy"
                onPress={() => void run(() => duplicateRoutine(routine.id), 'Kopie erstellt')}
              />
              <SettingRow
                label={routine.isActive ? 'Deaktivieren' : 'Aktivieren'}
                icon={routine.isActive ? 'bellOff' : 'play'}
                onPress={() =>
                  void run(
                    () => toggleActive(routine.id),
                    routine.isActive ? 'Routine deaktiviert' : 'Routine aktiviert',
                  )
                }
              />
              <SettingRow label="Löschen" icon="trash" destructive onPress={() => setConfirmDelete(true)} last />
            </Card>
            <AppText variant="caption" color="secondaryText" style={styles.footnote}>
              Deaktivieren nimmt die Routine aus dem Plan, ohne sie oder ihren Verlauf zu löschen.
            </AppText>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['top']} style={styles.bar} pointerEvents="box-none">
        <View style={styles.barRow} pointerEvents="box-none">
          <IconButton
            iconName="close"
            accessibilityLabel="Schließen"
            onPress={() => router.back()}
            backgroundColor={BAR_BUTTON_BG}
            color={WHITE}
          />
        </View>
      </SafeAreaView>

      <ConfirmationDialog
        visible={confirmDelete}
        title="Routine löschen?"
        message="Die Routine und ihre Verläufe werden dauerhaft entfernt."
        confirmLabel="Löschen"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </View>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={styles.rowOuter}>
      <View
        style={[
          styles.row,
          { borderBottomColor: theme.colors.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
        ]}
      >
        <AppText variant="body">{label}</AppText>
        <AppText variant="body" color="secondaryText" style={styles.value} numberOfLines={1}>
          {value}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 48 },
  hero: { height: 320, justifyContent: 'flex-end' },
  // Explicit size: on web the image would otherwise take its natural dimensions.
  heroImage: { width: '100%', height: '100%' },
  heroText: { padding: 20, paddingBottom: 22, gap: 4, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  content: { width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
  bar: { position: 'absolute', top: 0, left: 0, right: 0 },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footnote: { marginTop: 8, paddingHorizontal: 4 },
  rowOuter: { paddingLeft: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 12,
    paddingRight: 16,
    minHeight: 48,
  },
  value: { flexShrink: 1, textAlign: 'right' },
});
