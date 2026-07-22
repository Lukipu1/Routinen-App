import { Tabs } from 'expo-router';
import React from 'react';

import { Icon } from '../../src/components/common/Icon';
import { useTheme } from '../../src/theme/ThemeProvider';

const TAB_ICON: Record<string, string> = {
  index: 'calendar',
  routines: 'checklist',
  progress: 'trending',
  settings: 'settings',
};

export default function TabsLayout(): React.ReactElement {
  const theme = useTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.secondaryText,
        tabBarStyle: {
          backgroundColor: theme.colors.elevatedBackground,
          borderTopColor: theme.colors.separator,
        },
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ color, size }) => (
          <Icon name={TAB_ICON[route.name] ?? 'checklist'} size={size} color={color as string} />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Heute' }} />
      <Tabs.Screen name="routines" options={{ title: 'Routinen' }} />
      <Tabs.Screen name="progress" options={{ title: 'Fortschritt' }} />
      <Tabs.Screen name="settings" options={{ title: 'Einstellungen' }} />
    </Tabs>
  );
}
