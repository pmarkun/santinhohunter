import { LegalPage } from '@/components/LegalPage';

export default function TermsOfUseScreen() {
  return (
    <LegalPage
      kicker="Termos"
      sections={[
        {
          title: 'Uso permitido',
          body:
            'Use o Santinho Hunter para registrar material eleitoral descartado em espaço público. Fotografe com segurança, sem se colocar em risco, sem invadir propriedade privada e sem atrapalhar vias, serviços ou outras pessoas.',
        },
        {
          title: 'Integridade dos registros',
          body:
            'Não fabrique flagrantes, não mova lixo eleitoral para inflar rankings e não envie capturas repetidas de forma coordenada. Registros suspeitos podem ser ignorados, agregados ou removidos.',
        },
        {
          title: 'Reconhecimento de candidatos',
          body:
            'O reconhecimento compara o material fotografado com uma base de fotos oficiais de candidatos. O resultado é uma sugestão técnica e deve ser confirmado pela pessoa usuária antes de entrar no ranking.',
        },
        {
          title: 'Rankings',
          body:
            'Rankings são indicadores agregados de lixo eleitoral encontrado. Eles não provam autoria do descarte e não devem ser tratados como decisão oficial, acusação jurídica ou dado eleitoral do TSE.',
        },
      ]}
      title="Termos de Uso"
      updatedAt="16/08/2026"
    />
  );
}
