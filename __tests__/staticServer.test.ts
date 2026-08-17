import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const {
  cacheControl,
  canonicalLocation,
  resolveFile,
} = require('../scripts/serve-static.js') as {
  cacheControl: (file: string) => string;
  canonicalLocation: (request: { headers: { host?: string }; url?: string }) => string | null;
  resolveFile: (url: string, accept?: string) => string | null;
};

describe('static web server', () => {
  it('serves navigation routes through the app shell', () => {
    const file = resolveFile('/ranking', 'text/html');
    expect(file).not.toBeNull();
    expect(existsSync(file as string)).toBe(true);
    expect(file).toMatch(/ranking\.html$/);
  });

  it('does not hide missing static files behind the app shell', () => {
    expect(resolveFile('/missing-script.js', '*/*')).toBeNull();
    expect(resolveFile('/missing-image.png', 'image/png')).toBeNull();
  });

  it('keeps service worker and HTML revalidated', () => {
    expect(cacheControl(resolve('dist/service-worker.js'))).toBe('no-cache');
    expect(cacheControl(resolveFile('/') as string)).toBe('no-cache');
  });

  it('redirects www to the canonical apex host', () => {
    expect(
      canonicalLocation({
        headers: { host: 'www.santinhohunter.com.br' },
        url: '/hunt?uf=SP',
      }),
    ).toBe('https://santinhohunter.com.br/hunt?uf=SP');
    expect(
      canonicalLocation({ headers: { host: 'santinhohunter.com.br' }, url: '/' }),
    ).toBeNull();
  });
});
