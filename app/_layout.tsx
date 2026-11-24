import { Bitter_700Bold, Bitter_800ExtraBold, useFonts } from '@expo-google-fonts/bitter';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from '@/lib/store';
import { palette } from '@/lib/theme';
import { BottomTabs, type TabKey } from '@/components/BottomTabs';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

/** Which tab the current route belongs to, or null for full-screen routes. */
function tabKeyFor(segments: string[]): TabKey | null {
  if (segments.length === 0) return 'scan';
  if (segments[0] === 'guide') return 'guide';
  if (segments[0] === 'impact') return 'impact';
  if (segments[0] === 'settings') return 'settings';
  return null;
}

/**
 * Sign-in gate: a signed-out user who hasn't chosen guest mode lands on
 * the Welcome screen first, and a fresh sign-in (or guest choice) routes
 * straight back into the tabs. The gate waits for authReady — Firebase
 * restoring a saved session — so a signed-in user never flashes Welcome.
 *
 * Navigation is one Stack (welcome, the four tab screens, help, and the
 * result takeover) with the flat white BottomTabs bar rendered by the
 * layout itself on tab routes only — so every tab screen gets the same
 * bar without each screen having to render it, and the Welcome, Help
 * and result takeovers stay full-screen.
 */
function Gate() {
  const { user, authReady, guest } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    const onWelcome = segments[0] === 'welcome';
    if (!user && !guest && !onWelcome) {
      router.replace('/welcome');
    } else if ((user || guest) && onWelcome) {
      router.replace('/');
    }
  }, [user, guest, authReady, segments, router]);

  if (!authReady) {
    // Brief hold while Firebase restores any existing session.
    return <View style={{ flex: 1, backgroundColor: palette.ground }} />;
  }

  const tabKey = tabKeyFor(segments);

  return (
    <View style={{ flex: 1, backgroundColor: palette.ground }}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="welcome" />
        <Stack.Screen name="index" />
        <Stack.Screen name="guide" />
        <Stack.Screen name="impact" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="help" />
        <Stack.Screen name="result/[id]" />
      </Stack>
      {tabKey ? <BottomTabs current={tabKey} /> : null}
    </View>
  );
}

export default function RootLayout() {
  // Bitter is the display face for headlines, titles and big numbers —
  // hold on the kraft-paper splash color until it is ready so no headline
  // ever flashes in the system font.
  const [fontsLoaded] = useFonts({ Bitter_700Bold, Bitter_800ExtraBold });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: palette.ground }} />;
  }
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <StatusBar style="dark" />
          <Gate />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
