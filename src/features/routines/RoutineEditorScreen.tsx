import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/common/AppText';
import { PrimaryButton, SecondaryButton, IconButton } from '../../components/common/Buttons';
import { Icon } from '../../components/common/Icon';
import { PressableScale } from '../../components/common/PressableScale';
import { SectionHeader } from '../../components/common/SectionHeader';
import { TextField } from '../../components/common/TextField';
import { TimePickerField } from '../../components/common/TimePickerField';
import { useToast } from '../../components/common/Toast';
import { WeekDaySelector } from '../../components/common/WeekDaySelector';
import { ColorPicker } from '../../components/routine/ColorPicker';
import { IconPicker } from '../../components/routine/IconPicker';
import { RoutineStepEditor } from '../../components/routine/RoutineStepEditor';
import { StepListItem } from '../../components/routine/StepListItem';
import { resolveRoutineColor } from '../../constants/colors';
import { REMINDER_LEAD_OPTIONS } from '../../constants/durations';
import { CATEGORY_META } from '../../constants/categories';
import { summariseWeekdays } from '../../constants/weekdays';
import { ROUTINE_CATEGORIES } from '../../types/category';
import {
  addStep,
  createEmptyStepDraft,
  draftFromRoutine,
  duplicateStep,
  estimateDuration,
  moveStep,
  removeStep,
  routineFromDraft,
  updateStep,
  type RoutineDraft,
} from './draft';
import { validateRoutineDraft } from './validation';
import { findTemplate, templateToDraft } from '../../data/templates';
import { usePreferences } from '../../hooks/usePreferences';
import { formatDuration } from '../../utils/format';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';

const TOTAL_STEPS = 4;
const STEP_TITLES = ['Grunddaten', 'Schritte', 'Zeitplan', 'Übersicht'];

export function RoutineEditorScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const preferences = usePreferences();
  const params = useLocalSearchParams<{ id?: string; templateKey?: string }>();
  const routines = useAppStore((s) => s.routines);
  const saveRoutine = useAppStore((s) => s.saveRoutine);

  const [draft, setDraft] = useState<RoutineDraft>(() => {
    if (params.id) {
      const existing = routines.find((r) => r.id === params.id);
      if (existing) return draftFromRoutine(existing);
    }
    if (params.templateKey) {
      const template = findTemplate(params.templateKey);
      if (template) return templateToDraft(template);
    }
    return {
      id: null,
      title: '',
      description: '',
      icon: 'sunrise',
      color: 'blue',
      category: 'personal',
      steps: [createEmptyStepDraft()],
      schedule: {
        enabled: true,
        weekdays: [1, 2, 3, 4, 5],
        startTime: '07:00',
        flexible: false,
        timeWindow: null,
        startDate: new Date().toISOString().slice(0, 10),
        endDate: null,
      },
      reminder: { enabled: false, minutesBefore: 10, secondReminderMinutes: null },
      isActive: true,
    };
  });
  const [step, setStep] = useState(1);
  const validation = useMemo(() => validateRoutineDraft(draft), [draft]);
  const accent = resolveRoutineColor(draft.color);
  const totalDuration = estimateDuration(draft.steps);

  const isEditing = draft.id !== null;

  const goNext = (): void => {
    if (step === 1 && draft.title.trim().length === 0) {
      toast('Bitte gib einen Namen ein', 'error');
      return;
    }
    if (step === 2 && draft.steps.filter((s) => s.title.trim().length > 0).length === 0) {
      toast('Füge mindestens einen Schritt hinzu', 'error');
      return;
    }
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
  };

  const goBack = (): void => setStep((current) => Math.max(1, current - 1));

  const save = async (): Promise<void> => {
    if (!validation.valid) {
      toast('Bitte prüfe deine Eingaben', 'error');
      if (validation.errors.title) setStep(1);
      else if (validation.errors.steps || validation.errors.stepTitles) setStep(2);
      else setStep(3);
      return;
    }
    await saveRoutine(routineFromDraft(draft));
    toast(isEditing ? 'Routine aktualisiert' : 'Routine gespeichert', 'success');
    router.back();
  };

  const patch = (partial: Partial<RoutineDraft>): void =>
    setDraft((current) => ({ ...current, ...partial }));

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.flex, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.header, { paddingHorizontal: theme.spacing.base }]}>
        <IconButton iconName="close" accessibilityLabel="Schließen" onPress={() => router.back()} />
        <View style={styles.headerCenter}>
          <AppText variant="headline">{isEditing ? 'Routine bearbeiten' : 'Neue Routine'}</AppText>
          <AppText variant="caption" color="secondaryText">
            {`Schritt ${step} von ${TOTAL_STEPS} · ${STEP_TITLES[step - 1]}`}
          </AppText>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.progressTrack, { backgroundColor: theme.colors.fill }]}>
        <View
          style={{
            width: `${(step / TOTAL_STEPS) * 100}%`,
            height: '100%',
            backgroundColor: accent,
          }}
        />
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
          {step === 1 ? (
            <StepBasics draft={draft} patch={patch} accent={accent} />
          ) : step === 2 ? (
            <StepSteps draft={draft} setDraft={setDraft} accent={accent} errors={validation.errors.stepTitles} />
          ) : step === 3 ? (
            <StepSchedule
              draft={draft}
              patch={patch}
              accent={accent}
              totalDuration={totalDuration}
              weekStartsOn={preferences.weekStartsOn}
            />
          ) : (
            <StepSummary draft={draft} accent={accent} totalDuration={totalDuration} weekStartsOn={preferences.weekStartsOn} />
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: theme.colors.separator }]}>
          {step > 1 ? <SecondaryButton title="Zurück" onPress={goBack} fullWidth={false} /> : <View />}
          {step < TOTAL_STEPS ? (
            <PrimaryButton title="Weiter" onPress={goNext} accentColor={accent} fullWidth={false} style={styles.grow} />
          ) : (
            <PrimaryButton title="Routine speichern" onPress={save} accentColor={accent} fullWidth={false} style={styles.grow} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepBasics({
  draft,
  patch,
  accent,
}: {
  draft: RoutineDraft;
  patch: (partial: Partial<RoutineDraft>) => void;
  accent: string;
}): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.lg }}>
      <TextField
        label="Name"
        placeholder="z. B. Morgenroutine"
        value={draft.title}
        onChangeText={(title) => patch({ title })}
      />
      <View>
        <SectionHeader title="Symbol" />
        <IconPicker value={draft.icon} onChange={(icon) => patch({ icon })} accentColor={accent} />
      </View>
      <View>
        <SectionHeader title="Farbe" />
        <ColorPicker value={draft.color} onChange={(color) => patch({ color })} />
      </View>
      <View>
        <SectionHeader title="Kategorie" />
        <View style={styles.chipWrap}>
          {ROUTINE_CATEGORIES.map((category) => {
            const selected = draft.category === category;
            return (
              <PressableScale
                key={category}
                onPress={() => patch({ category })}
                haptic="selection"
                scaleTo={0.95}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selected ? accent : theme.colors.fill,
                    borderRadius: theme.radii.pill,
                  },
                ]}
              >
                <AppText
                  variant="callout"
                  weight="600"
                  style={{ color: selected ? theme.colors.onAccent : theme.colors.primaryText }}
                >
                  {CATEGORY_META[category].label}
                </AppText>
              </PressableScale>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function StepSteps({
  draft,
  setDraft,
  accent,
  errors,
}: {
  draft: RoutineDraft;
  setDraft: React.Dispatch<React.SetStateAction<RoutineDraft>>;
  accent: string;
  errors?: Record<string, string>;
}): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      {draft.steps.map((stepDraft, index) => (
        <RoutineStepEditor
          key={stepDraft.id}
          step={stepDraft}
          index={index}
          total={draft.steps.length}
          accentColor={accent}
          error={errors?.[stepDraft.id]}
          onChange={(p) => setDraft((current) => updateStep(current, stepDraft.id, p))}
          onRemove={() => setDraft((current) => removeStep(current, stepDraft.id))}
          onDuplicate={() => setDraft((current) => duplicateStep(current, stepDraft.id))}
          onMoveUp={() => setDraft((current) => moveStep(current, index, index - 1))}
          onMoveDown={() => setDraft((current) => moveStep(current, index, index + 1))}
        />
      ))}
      <SecondaryButton
        title="Schritt hinzufügen"
        iconName="plus"
        onPress={() => setDraft((current) => addStep(current))}
      />
    </View>
  );
}

function StepSchedule({
  draft,
  patch,
  accent,
  totalDuration,
  weekStartsOn,
}: {
  draft: RoutineDraft;
  patch: (partial: Partial<RoutineDraft>) => void;
  accent: string;
  totalDuration: number;
  weekStartsOn: 0 | 1;
}): React.ReactElement {
  const theme = useTheme();
  const { schedule, reminder } = draft;

  const setFlexible = (flexible: boolean): void =>
    patch({
      schedule: {
        ...schedule,
        flexible,
        startTime: flexible ? null : (schedule.startTime ?? '07:00'),
      },
    });

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View>
        <SectionHeader title="Wochentage" />
        <WeekDaySelector
          selected={schedule.weekdays}
          onChange={(weekdays) => patch({ schedule: { ...schedule, weekdays } })}
          weekStartsOn={weekStartsOn}
          accentColor={accent}
        />
      </View>

      <View style={styles.switchRow}>
        <AppText variant="body">Flexible Uhrzeit</AppText>
        <Switch
          value={schedule.flexible}
          onValueChange={setFlexible}
          trackColor={{ true: accent, false: theme.colors.fill }}
        />
      </View>

      {!schedule.flexible ? (
        <TimePickerField
          label="Startzeit"
          value={schedule.startTime ?? '07:00'}
          onChange={(startTime) => patch({ schedule: { ...schedule, startTime } })}
          accentColor={accent}
        />
      ) : null}

      <View style={styles.switchRow}>
        <AppText variant="body">Erinnerung</AppText>
        <Switch
          value={reminder.enabled}
          onValueChange={(enabled) => patch({ reminder: { ...reminder, enabled } })}
          trackColor={{ true: accent, false: theme.colors.fill }}
        />
      </View>

      {reminder.enabled && !schedule.flexible ? (
        <View>
          <AppText variant="caption" color="secondaryText" style={{ marginBottom: 6 }}>
            Minuten vor Beginn
          </AppText>
          <View style={styles.chipWrap}>
            {REMINDER_LEAD_OPTIONS.map((minutes) => {
              const selected = reminder.minutesBefore === minutes;
              return (
                <PressableScale
                  key={minutes}
                  onPress={() => patch({ reminder: { ...reminder, minutesBefore: minutes } })}
                  haptic="selection"
                  scaleTo={0.94}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: selected ? accent : theme.colors.fill, borderRadius: theme.radii.pill },
                  ]}
                >
                  <AppText
                    variant="callout"
                    weight="600"
                    style={{ color: selected ? theme.colors.onAccent : theme.colors.primaryText }}
                  >
                    {minutes === 0 ? 'Zum Start' : `${minutes} Min`}
                  </AppText>
                </PressableScale>
              );
            })}
          </View>
        </View>
      ) : null}

      <View style={[styles.totalBox, { backgroundColor: theme.colors.fill, borderRadius: theme.radii.md }]}>
        <AppText variant="callout" color="secondaryText">
          Geschätzte Gesamtdauer
        </AppText>
        <AppText variant="title" style={{ color: accent }}>
          {formatDuration(totalDuration)}
        </AppText>
      </View>
    </View>
  );
}

function StepSummary({
  draft,
  accent,
  totalDuration,
  weekStartsOn,
}: {
  draft: RoutineDraft;
  accent: string;
  totalDuration: number;
  weekStartsOn: 0 | 1;
}): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.base }}>
      <View style={styles.summaryHeader}>
        <View style={[styles.summaryIcon, { backgroundColor: accent }]}>
          <Icon name={draft.icon} size={28} color={theme.colors.onAccent} />
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="title">{draft.title || 'Ohne Namen'}</AppText>
          <AppText variant="callout" color="secondaryText">
            {formatDuration(totalDuration)} · {draft.steps.length} Schritte
          </AppText>
        </View>
      </View>

      <View style={[styles.summaryBox, { backgroundColor: theme.colors.secondaryBackground, borderRadius: theme.radii.md }]}>
        <SummaryRow label="Wochentage" value={summariseWeekdays(draft.schedule.weekdays, weekStartsOn)} />
        <SummaryRow
          label="Startzeit"
          value={draft.schedule.flexible ? 'Flexibel' : (draft.schedule.startTime ?? '—')}
        />
        <SummaryRow label="Erinnerung" value={draft.reminder.enabled ? `${draft.reminder.minutesBefore} Min vorher` : 'Aus'} />
      </View>

      <View>
        <SectionHeader title="Schritte" />
        <View style={[styles.summaryBox, { backgroundColor: theme.colors.secondaryBackground, borderRadius: theme.radii.md }]}>
          {draft.steps.map((s, index) => (
            <StepListItem
              key={s.id}
              step={{
                id: s.id,
                title: s.title || `Schritt ${index + 1}`,
                durationInSeconds: s.durationInSeconds,
                order: index,
                canSkip: s.canSkip,
                icon: s.icon,
              }}
              index={index}
              accentColor={accent}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={[styles.summaryRow, { borderBottomColor: theme.colors.separator }]}>
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
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalBox: {
    padding: 16,
    alignItems: 'flex-start',
    gap: 4,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBox: { paddingHorizontal: 16, paddingVertical: 4 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
