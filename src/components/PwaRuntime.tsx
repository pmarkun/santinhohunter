import { useEffect } from 'react';
import { Platform } from 'react-native';

export function PwaRuntime() {
  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator)
    ) {
      return;
    }

    function registerServiceWorker() {
      navigator.serviceWorker.register('/service-worker.js').catch(() => undefined);
    }

    if (document.readyState === 'complete') {
      registerServiceWorker();
      return;
    }

    window.addEventListener('load', registerServiceWorker, { once: true });
    return () => window.removeEventListener('load', registerServiceWorker);
  }, []);

  return null;
}
