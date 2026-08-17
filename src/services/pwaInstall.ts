import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type PwaInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

export function isPwaStandalone(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true
  );
}

export async function promptPwaInstall(event: PwaInstallPrompt): Promise<boolean> {
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome === 'accepted';
}

export function usePwaInstall(): {
  canInstall: boolean;
  install: () => Promise<boolean>;
} {
  const [promptEvent, setPromptEvent] = useState<PwaInstallPrompt | null>(null);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    setStandalone(isPwaStandalone());

    function capturePrompt(event: Event) {
      event.preventDefault();
      setPromptEvent(event as PwaInstallPrompt);
    }

    function markInstalled() {
      setPromptEvent(null);
      setStandalone(true);
    }

    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', markInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', markInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) {
      return false;
    }

    const accepted = await promptPwaInstall(promptEvent);
    setPromptEvent(null);
    return accepted;
  }, [promptEvent]);

  return {
    canInstall: Boolean(promptEvent) && !standalone,
    install,
  };
}
