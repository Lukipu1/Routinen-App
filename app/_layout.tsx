// Side-effect import must run first so gesture-handler initialises before the
// navigator; it is intentionally separate from the named import below.
// eslint-disable-next-line import/no-duplicates
import 'react-native-gesture-handler';

import { Stack, useRouter, useSegments, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, Text, View, useColorScheme } from 'react-native';
// eslint-disable-next-line import/no-duplicates
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppText } from '../src/components/common/AppText';
import { ErrorState } from '../src/components/common/StateViews';
import { ToastHost } from '../src/components/common/Toast';
import { useAppBootstrap } from '../src/hooks/useAppBootstrap';
import { useDayRollover } from '../src/hooks/useDayRollover';
import { darkColors, lightColors } from '../src/theme/colors';
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

function BootErrorScreen({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): React.ReactElement {
  const theme = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ErrorState
        title="Die App konnte nicht starten"
        message={`Deine Daten konnten nicht geladen werden.\n${message}`}
        onRetry={onRetry}
      />
    </View>
  );
}

/**
 * Last line of defence for errors thrown while rendering. It deliberately
 * avoids the theme context (which may be what failed) and styles itself from
 * the raw colour tokens.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps): React.ReactElement {
  const colors = useColorScheme() === 'dark' ? darkColors : lightColors;
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 12,
        backgroundColor: colors.background,
      }}
    >
      <Text style={{ fontSize: 22, fontWeight: '600', color: colors.primaryText, textAlign: 'center' }}>
        Etwas ist schiefgelaufen
      </Text>
      <Text style={{ fontSize: 15, color: colors.secondaryText, textAlign: 'center' }}>
        {error.message}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void retry()}
        style={{
          marginTop: 12,
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 14,
          backgroundColor: colors.accent,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: '600', color: colors.onAccent }}>
          Erneut versuchen
        </Text>
      </Pressable>
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
  const { ready, error, retry } = useAppBootstrap();
  const theme = useTheme();
  const scheme = useColorSchemeValue();
  useOnboardingRedirect(ready);
  useDayRollover(ready);

  useEffect(() => {
    // Hide the native splash as soon as there is something to show — a screen
    // or an error. Holding it on failure would look like a frozen app.
    if (ready || error) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready, error]);

  if (error) return <BootErrorScreen message={error} onRetry={retry} />;
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
