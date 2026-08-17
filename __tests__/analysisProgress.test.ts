import { getAnalysisStatus } from '@/services/analysisStatus';

describe('AnalysisProgress', () => {
  it('describes the actual matching stages without inventing a percentage', () => {
    expect(getAnalysisStatus('matching', 0, 'SP')).toBe('Preparando a foto...');
    expect(getAnalysisStatus('matching', 2000, 'SP')).toBe('Varrendo os rostos...');
    expect(getAnalysisStatus('matching', 5000, 'SP')).toBe(
      'Comparando com candidatos de SP...',
    );
    expect(getAnalysisStatus('matching', 9000, 'SP')).toContain('mais de tempo');
  });

  it('uses separate copy while saving evidence', () => {
    expect(getAnalysisStatus('saving', 0, 'SP')).toBe('Guardando a evidência...');
    expect(getAnalysisStatus('saving', 2500, 'SP')).toBe('Enviando o flagrante...');
  });
});
