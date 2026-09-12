import { DarkTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { getDb } from '@/src/db/database';
import { gym } from '@/src/theme/gym';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const GymDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: gym.accent,
    background: gym.bg,
    card: gym.card,
    text: gym.text,
    border: gym.border,
    notification: gym.accent,
  },
};

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await getDb();
      } finally {
        setReady(true);
        SplashScreen.hideAsync();
      }
    })();
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider value={GymDarkTheme}>
      <StatusBar style="light" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
