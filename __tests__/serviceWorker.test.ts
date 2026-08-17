import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('service worker privacy contract', () => {
  const source = readFileSync(resolve('public/service-worker.js'), 'utf8');

  it('does not intercept non-GET requests', () => {
    expect(source).toContain("request.method !== 'GET'");
  });

  it.each(['/candidate-photos/', '/captures', '/matches', '/rankings'])(
    'excludes %s from caching',
    (path) => {
      expect(source).toContain(`'${path}'`);
    },
  );

  it('limits static cache to same-origin app assets', () => {
    expect(source).toContain('url.origin !== self.location.origin');
    expect(source).toContain("pathname.startsWith('/_expo/')");
    expect(source).toContain("pathname.startsWith('/assets/')");
  });
});
