import 'react-native-gesture-handler';

import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppText } from '../src/components/common/AppText';
import { ToastHost } from '../src/components/common/Toast';
import { useAppBootstrap } from '../src/hooks/useAppBootstrap';
import { ThemeProvider, useColorSchemeValue, useTheme } from '../src/theme/ThemeProvider';
import { usePreferencesStore } from '../src/store/preferencesStore';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

function BootScreen(): React.ReactElement {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.background,
        gap: 16,
      }}
    >
      <AppText variant="largeTitle">Routinen</AppText>
      <ActivityIndicator color={theme.colors.accent} />
    </View>
  );
}

/** Redirects to onboarding until it is completed. */
function useOnboardingRedirect(ready: boolean): void {
  const onboardingCompleted = usePreferencesStore((s) => s.preferences.onboardingCompleted);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboardingCompleted && !inOnboarding) {
      router.replace('/onboarding');
    } else if (onboardingCompleted && inOnboarding) {
      router.replace('/');
    }
  }, [ready, onboardingCompleted, segments, router]);
}

function RootNavigator(): React.ReactElement {
  const ready = useAppBootstrap();
  const theme = useTheme();
  const scheme = useColorSchemeValue();
  useOnboardingRedirect(ready);

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  if (!ready) return <BootScreen />;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="editor" options={{ presentation: 'modal' }} />
        <Stack.Screen name="routine/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen
          name="run"
          options={{ presentation: 'fullScreenModal', gestureEnabled: false }}
        />
      </Stack>
      <ToastHost />
    </>
  );
}

function ThemedApp(): React.ReactElement {
  const preference = usePreferencesStore((s) => s.preferences.theme);
  return (
    <ThemeProvider preference={preference}>
      <RootNavigator />
    </ThemeProvider>
  );
}

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemedApp />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
