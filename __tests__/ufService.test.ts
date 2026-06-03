import AsyncStorage from '@react-native-async-storage/async-storage';

import { getDefaultUf, getStoredUf, normalizeUf, saveStoredUf } from '@/services/ufService';

describe('ufService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

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

  it('persists the selected UF', async () => {
    await saveStoredUf('RJ');

    await expect(getStoredUf()).resolves.toBe('RJ');
  });
});
