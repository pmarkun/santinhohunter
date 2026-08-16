import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            contentStyle: { backgroundColor: colors.newsprint },
            headerStyle: { backgroundColor: colors.newsprint },
            headerTintColor: colors.asphalt,
            headerTitleStyle: { fontWeight: '900' },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="capture/camera" options={{ headerShown: false }} />
          <Stack.Screen name="capture/review" options={{ headerShown: false }} />
          <Stack.Screen name="capture/manual-search" options={{ headerShown: false }} />
          <Stack.Screen name="capture/success" options={{ headerShown: false }} />
          <Stack.Screen name="sobre" options={{ title: 'Sobre o projeto' }} />
          <Stack.Screen
            name="politica-de-privacidade"
            options={{ title: 'Política de privacidade' }}
          />
          <Stack.Screen name="termos-de-uso" options={{ title: 'Termos de uso' }} />
          <Stack.Screen name="exclusao-de-dados" options={{ title: 'Exclusão de dados' }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
