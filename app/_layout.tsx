import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.asphalt },
            headerStyle: { backgroundColor: colors.asphalt },
            headerTintColor: colors.paper,
            headerTitleStyle: { fontWeight: '900' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="capture/camera" options={{ title: 'Caçar santinho' }} />
          <Stack.Screen name="capture/review" options={{ title: 'Conferir flagra' }} />
          <Stack.Screen name="capture/manual-search" options={{ title: 'Buscar por numero' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
