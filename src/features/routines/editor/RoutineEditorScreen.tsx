import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../../components/common/AppText';
import { PrimaryButton, SecondaryButton, IconButton } from '../../../components/common/Buttons';
import { ConfirmationDialog } from '../../../components/common/ConfirmationDialog';
import { useToast } from '../../../components/common/Toast';
import { resolveRoutineColor } from '../../../constants/colors';
import { usePreferences } from '../../../hooks/usePreferences';
import { useAppStore } from '../../../store/appStore';
import { useTheme } from '../../../theme/ThemeProvider';
import { estimateDuration, pruneEmptySteps, routineFromDraft } from '../draft';
import { validateEditorPage, validateRoutineDraft, type EditorPage } from '../validation';
import { StepBasics } from './StepBasics';
import { StepSchedule } from './StepSchedule';
import { StepSteps } from './StepSteps';
import { StepSummary } from './StepSummary';
import { useRoutineDraft } from './useRoutineDraft';

const TOTAL_PAGES = 4;
const PAGE_TITLES = ['Grunddaten', 'Schritte', 'Zeitplan', 'Übersicht'];

/**
 * Four-page wizard to create or edit a routine. Validation runs per page with
 * inline messages (not just a toast), unsaved changes are protected by a
 * confirmation before the modal closes, and saving is guarded against a
 * double tap.
 */
export function RoutineEditorScreen(): React.ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const toast = useToast();
  const preferences = usePreferences();
  const params = useLocalSearchParams<{ id?: string; templateKey?: string; forToday?: string }>();
  const routines = useAppStore((s) => s.routines);
  const saveRoutine = useAppStore((s) => s.saveRoutine);
  const addRoutineForToday = useAppStore((s) => s.addRoutineForToday);

  const { draft, setDraft, patch, isEditing, dirty } = useRoutineDraft({
    routine: params.id ? routines.find((r) => r.id === params.id) : undefined,
    templateKey: params.templateKey,
    forToday: params.forToday === '1',
  });
  const [page, setPage] = useState<EditorPage>(1);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discardAction, setDiscardAction] = useState<(() => void) | null>(null);
  const allowLeave = useRef(false);

  const validation = useMemo(() => validateRoutineDraft(draft), [draft]);
  const pageError = attempted ? validateEditorPage(draft, page) : null;
  const accent = resolveRoutineColor(draft.color);
  const totalDuration = estimateDuration(draft.steps);

  // Closing the modal (X, swipe down, Android back) with unsaved changes
  // asks first instead of silently throwing the input away.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (allowLeave.current || !dirty) return;
      event.preventDefault();
      setDiscardAction(() => () => {
        allowLeave.current = true;
        navigation.dispatch(event.data.action);
      });
    });
    return unsubscribe;
  }, [navigation, dirty]);

  const goNext = (): void => {
    const pruned = page === 2 ? pruneEmptySteps(draft) : draft;
    if (pruned !== draft) setDraft(pruned);
    const error = validateEditorPage(pruned, page);
    if (error) {
      setAttempted(true);
      toast(error, 'error');
      return;
    }
    setAttempted(false);
    setPage((current) => Math.min(TOTAL_PAGES, current + 1) as EditorPage);
  };

  const goBack = (): void => {
    setAttempted(false);
    setPage((current) => Math.max(1, current - 1) as EditorPage);
  };

  const save = async (): Promise<void> => {
    if (saving) return;
    if (!validation.valid) {
      setAttempted(true);
      toast('Bitte prüfe deine Eingaben', 'error');
      if (validation.errors.title) setPage(1);
      else if (validation.errors.steps || validation.errors.stepTitles) setPage(2);
      else setPage(3);
      return;
    }
    // Guard against a double tap creating two routines (each call would
    // otherwise mint a fresh id).
    setSaving(true);
    try {
      const routine = routineFromDraft(draft);
      await saveRoutine(routine);
      if (!isEditing && params.forToday === '1') await addRoutineForToday(routine.id);
      toast(isEditing ? 'Routine aktualisiert' : 'Routine gespeichert', 'success');
      allowLeave.current = true;
      router.back();
    } catch {
      toast('Speichern fehlgeschlagen', 'error');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { paddingHorizontal: theme.spacing.base }]}>
        <IconButton iconName="close" accessibilityLabel="Schließen" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <AppText variant="headline" accessibilityRole="header">
            {isEditing ? 'Routine bearbeiten' : 'Neue Routine'}
          </AppText>
          <AppText variant="caption" color="secondaryText">
            {`Seite ${page} von ${TOTAL_PAGES} · ${PAGE_TITLES[page - 1]}`}
          </AppText>
        </View>
        <View style={{ width: 40 }} />
      </View>
      <View
        style={[styles.progressTrack, { backgroundColor: theme.colors.fill }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: TOTAL_PAGES, now: page }}
      >
        <View style={{ width: `${(page / TOTAL_PAGES) * 100}%`, height: '100%', backgroundColor: theme.colors.accent }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ padding: theme.spacing.base, paddingBottom: 40, gap: theme.spacing.lg }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {page === 1 ? (
            <StepBasics draft={draft} patch={patch} titleError={pageError ?? undefined} />
          ) : page === 2 ? (
            <StepSteps
              draft={draft}
              setDraft={setDraft}
              errors={attempted ? validation.errors.stepTitles : undefined}
            />
          ) : page === 3 ? (
            <StepSchedule
              draft={draft}
              patch={patch}
              totalDuration={totalDuration}
              weekStartsOn={preferences.weekStartsOn}
              notificationsEnabled={preferences.notificationsEnabled}
              scheduleError={pageError ?? undefined}
            />
          ) : (
            <StepSummary
              draft={draft}
              accent={accent}
              totalDuration={totalDuration}
              weekStartsOn={preferences.weekStartsOn}
            />
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.colors.separator }]}>
          {page > 1 ? <SecondaryButton title="Zurück" onPress={goBack} fullWidth={false} /> : <View />}
          {page < TOTAL_PAGES ? (
            <PrimaryButton title="Weiter" onPress={goNext} fullWidth={false} style={styles.grow} />
          ) : (
            <PrimaryButton
              title="Routine speichern"
              onPress={save}
              loading={saving}
             
              fullWidth={false}
              style={styles.grow}
            />
          )}
        </View>
      </KeyboardAvoidingView>

      <ConfirmationDialog
        visible={discardAction !== null}
        title="Änderungen verwerfen?"
        message="Deine Eingaben in dieser Routine gehen verloren."
        confirmLabel="Verwerfen"
        cancelLabel="Weiter bearbeiten"
        destructive
        onConfirm={() => {
          const action = discardAction;
          setDiscardAction(null);
          action?.();
        }}
        onCancel={() => setDiscardAction(null)}
      />
    </SafeAreaView>
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
  headerCenter: { alignItems: 'center', flex: 1 },
  progressTrack: { height: 4, width: '100%' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  grow: { flex: 1 },
});
