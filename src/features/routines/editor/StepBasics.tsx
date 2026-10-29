import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip } from '../../../components/common/Chip';
import { SectionHeader } from '../../../components/common/SectionHeader';
import { TextField } from '../../../components/common/TextField';
import { ColorPicker } from '../../../components/routine/ColorPicker';
import { IconPicker } from '../../../components/routine/IconPicker';
import { CATEGORY_META } from '../../../constants/categories';
import { ROUTINE_CATEGORIES } from '../../../types/category';
import { useTheme } from '../../../theme/ThemeProvider';
import type { RoutineDraft } from '../draft';

interface Props {
  draft: RoutineDraft;
  patch: (partial: Partial<RoutineDraft>) => void;
  accent: string;
  /** Shown inline once the user tried to continue without a name. */
  titleError?: string;
}

/** Page 1: name, symbol, colour and category. */
export function StepBasics({ draft, patch, accent, titleError }: Props): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.lg }}>
      <TextField
        label="Name"
        placeholder="z. B. Morgenroutine"
        value={draft.title}
        onChangeText={(title) => patch({ title })}
        error={titleError}
        returnKeyType="done"
        accessibilityLabel="Name der Routine"
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
        <View style={styles.chipWrap} accessibilityRole="radiogroup">
          {ROUTINE_CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={CATEGORY_META[category].label}
              selected={draft.category === category}
              onPress={() => patch({ category })}
              accentColor={accent}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
