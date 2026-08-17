import { getLandingCtas } from '@/services/landingCta';

describe('landing CTAs', () => {
  it('opens the Play Store first on Android when the listing is enabled', () => {
    expect(
      getLandingCtas({
        canInstall: true,
        isAndroid: true,
        isDesktop: false,
        playStoreEnabled: true,
      }),
    ).toEqual({
      primary: { action: 'open_play_store', label: 'Baixar no Google Play' },
      secondary: [
        { action: 'open_app', label: 'Usar no navegador' },
        { action: 'install_pwa', label: 'Instalar versão web' },
      ],
    });
  });

  it('opens the web app when the Play Store listing is disabled', () => {
    expect(
      getLandingCtas({
        canInstall: false,
        isAndroid: true,
        isDesktop: false,
        playStoreEnabled: false,
      }).primary,
    ).toEqual({ action: 'open_app', label: 'Abrir o app' });
  });

  it('offers a desktop web action and hides unavailable installation', () => {
    expect(
      getLandingCtas({
        canInstall: false,
        isAndroid: false,
        isDesktop: true,
        playStoreEnabled: false,
      }),
    ).toEqual({
      primary: { action: 'open_app', label: 'Abrir versão web' },
      secondary: [],
    });
  });
});
