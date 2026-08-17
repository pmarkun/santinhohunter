import { isPwaStandalone, promptPwaInstall, type PwaInstallPrompt } from '@/services/pwaInstall';

describe('PWA installation', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('prompts once and reports an accepted installation', async () => {
    const prompt = jest.fn(async () => undefined);
    const event = {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
    } as unknown as PwaInstallPrompt;

    await expect(promptPwaInstall(event)).resolves.toBe(true);
    expect(prompt).toHaveBeenCalledTimes(1);
  });

  it('reports a dismissed installation', async () => {
    const event = {
      prompt: jest.fn(async () => undefined),
      userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
    } as unknown as PwaInstallPrompt;

    await expect(promptPwaInstall(event)).resolves.toBe(false);
  });

  it('detects standalone display mode', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: jest.fn(() => ({ matches: true })),
    });

    expect(isPwaStandalone()).toBe(true);
  });
});
