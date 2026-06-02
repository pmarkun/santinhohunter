import type { Office } from '@/types/domain';

export const officeLabels: Record<Office, string> = {
  president: 'Presidente',
  governor: 'Governador',
  senator: 'Senador',
  federal_deputy: 'Dep. Federal',
  state_deputy: 'Dep. Estadual',
  district_deputy: 'Dep. Distrital',
  mayor: 'Prefeito',
  vice_mayor: 'Vice-prefeito',
  councilor: 'Vereador',
};

export const rankingOffices: Office[] = [
  'president',
  'governor',
  'senator',
  'federal_deputy',
  'state_deputy',
];
