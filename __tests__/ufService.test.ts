import { getDefaultUf, normalizeUf } from '@/services/ufService';

describe('ufService', () => {
  it('normalizes valid UF values', () => {
    expect(normalizeUf(' sp ')).toBe('SP');
    expect(normalizeUf('rj')).toBe('RJ');
  });

  it('rejects invalid UF values', () => {
    expect(normalizeUf('XX')).toBeNull();
    expect(normalizeUf(undefined)).toBeNull();
  });

  it('uses SP as the MVP default UF', () => {
    expect(getDefaultUf()).toBe('SP');
  });
});
