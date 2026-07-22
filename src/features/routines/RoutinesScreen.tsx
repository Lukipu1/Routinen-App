import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { AppText } from '../../components/common/AppText';
import { FloatingActionButton } from '../../components/common/Buttons';
import { EmptyState } from '../../components/common/EmptyState';
import { PressableScale } from '../../components/common/PressableScale';
import { ScreenContainer } from '../../components/common/ScreenContainer';
import { TextField } from '../../components/common/TextField';
import { RoutineCard } from '../../components/routine/RoutineCard';
import { CATEGORY_META } from '../../constants/categories';
import { ROUTINE_CATEGORIES, type RoutineCategory } from '../../types/category';
import { useRoutineList } from '../../hooks/useRoutineList';
import { usePreferences } from '../../hooks/usePreferences';
import { useAppStore } from '../../store/appStore';
import { useTheme } from '../../theme/ThemeProvider';

function CategoryFilter({
  value,
  onChange,
}: {
  value: RoutineCategory | null;
  onChange: (category: RoutineCategory | null) => void;
}): React.ReactElement {
  const theme = useTheme();
  const chip = (label: string, selected: boolean, onPress: () => void, key: string) => (
    <PressableScale
      key={key}
      onPress={onPress}
      haptic="selection"
      scaleTo={0.95}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.colors.accent : theme.colors.fill,
          borderRadius: theme.radii.pill,
        },
      ]}
    >
      <AppText
        variant="callout"
        weight="600"
        style={{ color: selected ? theme.colors.onAccent : theme.colors.primaryText }}
      >
        {label}
      </AppText>
    </PressableScale>
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {chip('Alle', value === null, () => onChange(null), 'all')}
      {ROUTINE_CATEGORIES.map((category) =>
        chip(
          CATEGORY_META[category].label,
          value === category,
          () => onChange(category),
          category,
        ),
      )}
    </ScrollView>
  );
}

export function RoutinesScreen(): React.ReactElement {
  const router = useRouter();
  const theme = useTheme();
  const preferences = usePreferences();
  const totalRoutines = useAppStore((s) => s.routines.length);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RoutineCategory | null>(null);
  const items = useRoutineList(search, category);

  return (
    <View style={styles.flex}>
      <ScreenContainer scroll>
        <AppHeader title="Routinen" />

        {totalRoutines === 0 ? (
          <EmptyState
            icon="checklist"
            title="Noch keine Routinen"
            message="Erstelle deine erste Routine mit ein paar einfachen Schritten."
            actionLabel="Routine erstellen"
            onAction={() => router.push('/editor')}
          />
        ) : (
          <>
            <TextField
              placeholder="Routinen suchen"
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
            />
            <View style={{ marginTop: theme.spacing.sm, marginBottom: theme.spacing.base }}>
              <CategoryFilter value={category} onChange={setCategory} />
            </View>

            {items.length === 0 ? (
              <AppText variant="body" color="secondaryText" center style={{ marginTop: 40 }}>
                Keine passenden Routinen gefunden.
              </AppText>
            ) : (
              <View style={{ gap: theme.spacing.md }}>
                {items.map(({ routine, nextOccurrence }) => (
                  <RoutineCard
                    key={routine.id}
                    routine={routine}
                    nextOccurrence={nextOccurrence}
                    weekStartsOn={preferences.weekStartsOn}
                    onPress={() =>
                      router.push({ pathname: '/routine/[id]', params: { id: routine.id } })
                    }
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScreenContainer>

      <View style={styles.fab}>
        <FloatingActionButton
          accessibilityLabel="Neue Routine"
          onPress={() => router.push('/editor')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  filterRow: { gap: 8, paddingRight: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
  },
});
