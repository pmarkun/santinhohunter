import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/theme/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.alert,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.asphalt,
          borderTopColor: colors.line,
          borderTopWidth: 2,
        },
        tabBarLabelStyle: {
          fontWeight: '900',
          textTransform: 'uppercase',
        },
      }}
    >
      <Tabs.Screen
        name="hunt"
        options={{
          title: 'Caçar',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={String(color)} name="camera-iris" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={String(color)} name="podium" size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historico',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              color={String(color)}
              name="clipboard-text-clock"
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons color={String(color)} name="cog" size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
