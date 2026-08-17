export type LandingCtaAction = 'open_app' | 'open_play_store' | 'install_pwa';

export type LandingCta = {
  action: LandingCtaAction;
  label: string;
};

export function getLandingCtas(params: {
  canInstall: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  playStoreEnabled: boolean;
}): { primary: LandingCta; secondary: LandingCta[] } {
  if (params.isAndroid && params.playStoreEnabled) {
    return {
      primary: { action: 'open_play_store', label: 'Baixar no Google Play' },
      secondary: [
        { action: 'open_app', label: 'Usar no navegador' },
        ...(params.canInstall
          ? [{ action: 'install_pwa' as const, label: 'Instalar versão web' }]
          : []),
      ],
    };
  }

  return {
    primary: {
      action: 'open_app',
      label: params.isDesktop ? 'Abrir versão web' : 'Abrir o app',
    },
    secondary: params.canInstall
      ? [{ action: 'install_pwa', label: 'Instalar app' }]
      : [],
  };
}
