import { Redirect } from 'expo-router';
import { Platform } from 'react-native';

import { LandingPage } from '@/components/LandingPage';
import { shouldRenderLanding } from '@/services/landingCta';

export default function IndexRoute() {
  if (shouldRenderLanding(Platform.OS)) {
    return <LandingPage />;
  }

  return <Redirect href="/(tabs)/hunt" />;
}
