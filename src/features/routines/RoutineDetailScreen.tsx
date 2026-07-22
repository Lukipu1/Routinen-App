import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/common/AppText';
import { PrimaryButton, SecondaryButton, IconButton } from '../../components/common/Buttons';
import { Button } from '../../components/common/Button';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { EmptyState } from '../../components/common/EmptyState';
import { Icon } from '../../components/common/Icon';
import { SectionHeader } from '../../components/common/SectionHeader';
import { useToast } from '../../components/common/Toast';
import { StepListItem } from '../../components/routine/StepListItem';
import { resolveRoutineColor } from '../../constants/colors';
import { CATEGORY_META } from '../../constants/categories';
import { summariseWeekdays } from '../../constants/weekdays';
import { usePreferences } from '../../hooks/usePreferences';
import { formatDuration } from '../../utils/format';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';

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
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const handleDelete = async (): Promise<void> => {
    setConfirmDelete(false);
    await deleteRoutine(routine.id);
    toast('Routine gelöscht');
    router.back();
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { paddingHorizontal: theme.spacing.base }]}>
        <IconButton iconName="close" accessibilityLabel="Schließen" onPress={() => router.back()} />
        <IconButton
          iconName="edit"
          accessibilityLabel="Bearbeiten"
          onPress={() => router.push({ pathname: '/editor', params: { id: routine.id } })}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: theme.spacing.base, paddingBottom: 40, gap: theme.spacing.lg }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={[styles.icon, { backgroundColor: accent }]}>
            <Icon name={routine.icon} size={32} color={theme.colors.onAccent} />
          </View>
          <AppText variant="largeTitle" center>
            {routine.title}
          </AppText>
          <AppText variant="callout" color="secondaryText" center>
            {formatDuration(routine.estimatedDuration)} · {routine.steps.length} Schritte ·{' '}
            {CATEGORY_META[routine.category].label}
          </AppText>
          {!routine.isActive ? (
            <AppText variant="caption" style={{ color: theme.colors.warning }} weight="600">
              Pausiert
            </AppText>
          ) : null}
        </View>

        <View style={[styles.box, { backgroundColor: theme.colors.secondaryBackground, borderRadius: theme.radii.md }]}>
          <Row label="Wochentage" value={summariseWeekdays(routine.schedule.weekdays, preferences.weekStartsOn)} />
          <Row
            label="Startzeit"
            value={routine.schedule.flexible ? 'Flexibel' : (routine.schedule.startTime ?? '—')}
            last
          />
        </View>

        <View>
          <SectionHeader title="Schritte" />
          <View style={[styles.box, { backgroundColor: theme.colors.secondaryBackground, borderRadius: theme.radii.md }]}>
            {routine.steps.map((step, index) => (
              <StepListItem key={step.id} step={step} index={index} accentColor={accent} />
            ))}
          </View>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <PrimaryButton
            title="Für heute einplanen"
            iconName="calendar"
            accentColor={accent}
            onPress={async () => {
              await addForToday(routine.id);
              toast('Für heute eingeplant', 'success');
            }}
          />
          <SecondaryButton
            title="Duplizieren"
            iconName="copy"
            onPress={async () => {
              await duplicateRoutine(routine.id);
              toast('Routine dupliziert', 'success');
            }}
          />
          <SecondaryButton
            title={routine.isActive ? 'Pausieren' : 'Aktivieren'}
            iconName={routine.isActive ? 'pause' : 'play'}
            onPress={async () => {
              await toggleActive(routine.id);
              toast(routine.isActive ? 'Pausiert' : 'Aktiviert');
            }}
          />
          <Button
            variant="destructive"
            title="Löschen"
            iconName="trash"
            onPress={() => setConfirmDelete(true)}
          />
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={confirmDelete}
        title="Routine löschen?"
        message="Die Routine und ihre Verläufe werden dauerhaft entfernt."
        confirmLabel="Löschen"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </SafeAreaView>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: theme.colors.separator, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth },
      ]}
    >
      <AppText variant="body" color="secondaryText">
        {label}
      </AppText>
      <AppText variant="body" weight="600">
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  hero: { alignItems: 'center', gap: 8 },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  box: { paddingHorizontal: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
});
