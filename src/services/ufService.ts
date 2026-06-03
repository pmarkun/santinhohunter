import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Uf } from '@/types/domain';

const USER_UF_KEY = 'santinhohunter:userUf';

export const ufs: Uf[] = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
];

export function normalizeUf(value: string | null | undefined): Uf | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toUpperCase();
  return ufs.includes(normalized as Uf) ? (normalized as Uf) : null;
}

export function getDefaultUf(): Uf {
  return 'SP';
}

export async function getStoredUf(): Promise<Uf> {
  const stored = normalizeUf(await AsyncStorage.getItem(USER_UF_KEY));
  return stored ?? getDefaultUf();
}

export async function saveStoredUf(uf: Uf): Promise<void> {
  await AsyncStorage.setItem(USER_UF_KEY, uf);
}
