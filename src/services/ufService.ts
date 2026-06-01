import type { Uf } from '@/types/domain';

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
