import { LegalPage } from '@/components/LegalPage';

export default function AboutProjectScreen() {
  return (
    <LegalPage
      kicker="Sobre"
      sections={[
        {
          title: 'O projeto',
          body:
            'Santinho Hunter é uma ferramenta cidadã para registrar santinhos eleitorais descartados em vias públicas. A pessoa fotografa o material, confirma o candidato quando possível e ajuda a montar rankings agregados de lixo eleitoral por UF e cargo.',
        },
        {
          title: 'Como funciona',
          body:
            'O app registra data, horário e localização aproximada da captura. A imagem pode ser enviada ao backend para comparação com fotos oficiais de candidatos. O ranking público soma apenas capturas confirmadas.',
        },
        {
          title: 'Fontes de dados',
          body:
            'A base de candidatos deve vir dos Dados Abertos do TSE e do DivulgaCandContas. Enquanto a importação completa da Eleição Geral de 2026 não estiver validada, o app informa quando estiver usando base parcial de teste.',
        },
        {
          title: 'Independência',
          body:
            'O Santinho Hunter não representa governo, Justiça Eleitoral, partido político, candidatura, coligação ou federação. É um projeto independente de fiscalização cidadã e denúncia pública de sujeira eleitoral.',
        },
      ]}
      title="Caçadores de Santinhos"
      updatedAt="16/08/2026"
    />
  );
}
