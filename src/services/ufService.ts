import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Uf } from '@/types/domain';

const USER_UF_KEY = 'santinhohunter:userUf';

const ufByStateName: Record<string, Uf> = {
  ACRE: 'AC',
  ALAGOAS: 'AL',
  AMAPA: 'AP',
  AMAZONAS: 'AM',
  BAHIA: 'BA',
  CEARA: 'CE',
  'DISTRITO FEDERAL': 'DF',
  'ESPIRITO SANTO': 'ES',
  GOIAS: 'GO',
  MARANHAO: 'MA',
  'MATO GROSSO': 'MT',
  'MATO GROSSO DO SUL': 'MS',
  'MINAS GERAIS': 'MG',
  PARA: 'PA',
  PARAIBA: 'PB',
  PARANA: 'PR',
  PERNAMBUCO: 'PE',
  PIAUI: 'PI',
  'RIO DE JANEIRO': 'RJ',
  'RIO GRANDE DO NORTE': 'RN',
  'RIO GRANDE DO SUL': 'RS',
  RONDONIA: 'RO',
  RORAIMA: 'RR',
  'SANTA CATARINA': 'SC',
  'SAO PAULO': 'SP',
  SERGIPE: 'SE',
  TOCANTINS: 'TO',
};

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

  const normalized = value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
  return ufs.includes(normalized as Uf)
    ? (normalized as Uf)
    : (ufByStateName[normalized] ?? null);
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
