import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import { LandingPage } from '@/components/LandingPage';

export default function IndexRoute() {
  if (Platform.OS === 'web') {
    return <LandingPage />;
  }

  return <Redirect href="/(tabs)/hunt" />;
}
