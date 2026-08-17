export type AnalysisMode = 'matching' | 'saving';

export function getAnalysisStatus(
  mode: AnalysisMode,
  elapsedMs: number,
  uf: string,
): string {
  if (mode === 'saving') {
    return elapsedMs < 2000 ? 'Guardando a evidência...' : 'Enviando o flagrante...';
  }
  if (elapsedMs < 1500) return 'Preparando a foto...';
  if (elapsedMs < 4500) return 'Varrendo os rostos...';
  if (elapsedMs < 8500) return `Comparando com candidatos de ${uf}...`;
  return 'A análise está levando um pouco mais de tempo...';
}
