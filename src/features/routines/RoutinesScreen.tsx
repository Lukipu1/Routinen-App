import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppHeader } from '../../components/common/AppHeader';
import { AppText } from '../../components/common/AppText';
import { Card } from '../../components/common/Card';
import { Chip } from '../../components/common/Chip';
import { IconButton } from '../../components/common/Buttons';
import { EmptyState } from '../../components/common/EmptyState';
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
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
      accessibilityRole="radiogroup"
      accessibilityLabel="Nach Kategorie filtern"
    >
      <Chip label="Alle" selected={value === null} onPress={() => onChange(null)} />
      {ROUTINE_CATEGORIES.map((category) => (
        <Chip
          key={category}
          label={CATEGORY_META[category].label}
          selected={value === category}
          onPress={() => onChange(category)}
        />
      ))}
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
    <ScreenContainer scroll>
      <AppHeader
        title="Routinen"
        trailing={
          <IconButton iconName="plus" tone="tinted" accessibilityLabel="Neue Routine" onPress={() => router.push('/editor')} />
        }
      />

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
            placeholder="Suchen"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            accessibilityLabel="Routinen suchen"
          />
          <View style={{ marginTop: theme.spacing.md, marginBottom: theme.spacing.base }}>
            <CategoryFilter value={category} onChange={setCategory} />
          </View>

          {items.length === 0 ? (
            <AppText variant="body" color="secondaryText" center style={{ marginTop: 40 }}>
              Keine passenden Routinen gefunden.
            </AppText>
          ) : (
            <Card padded={false}>
              {items.map(({ routine, nextOccurrence }, index) => (
                <RoutineCard
                  key={routine.id}
                  routine={routine}
                  nextOccurrence={nextOccurrence}
                  weekStartsOn={preferences.weekStartsOn}
                  last={index === items.length - 1}
                  onPress={() => router.push({ pathname: '/routine/[id]', params: { id: routine.id } })}
                />
              ))}
            </Card>
          )}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterRow: { gap: 8, paddingRight: 16 },
});
