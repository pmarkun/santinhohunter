import { LegalPage } from '@/components/LegalPage';

export default function PrivacyPolicyScreen() {
  return (
    <LegalPage
      kicker="Privacidade"
      sections={[
        {
          title: 'Dados coletados',
          body:
            'Coletamos a foto feita pela câmera, data e horário da captura, UF, cidade quando disponível, localização aproximada, precisão informada pelo aparelho, candidato confirmado e candidatos sugeridos pelo reconhecimento.',
        },
        {
          title: 'Uso da câmera e da foto',
          body:
            'A câmera é usada para fotografar material eleitoral descartado. A foto pode ser processada para comparar o rosto impresso no santinho com fotos oficiais de candidatos. O app não tenta identificar pessoas comuns, transeuntes ou usuários.',
        },
        {
          title: 'Localização',
          body:
            'A localização serve para indicar onde o santinho foi encontrado e para organizar rankings por UF. O backend aproxima coordenadas antes de qualquer uso público. Coordenadas precisas não são exibidas em rankings.',
        },
        {
          title: 'Compartilhamento e retenção',
          body:
            'Os dados são enviados por HTTPS para o backend do projeto e usados para sincronização, busca de candidatos, match facial e rankings agregados. Não vendemos dados. No MVP, fotos brutas não são publicadas em galerias abertas. Metadados de capturas podem ser mantidos até o fim da eleição ou removidos mediante pedido aplicável.',
        },
        {
          title: 'Exclusão e contato',
          body:
            'Pedidos de remoção ou dúvidas sobre dados podem ser enviados para pedro@markun.com.br. Inclua data aproximada, UF, candidato e, se disponível, o identificador local da captura.',
        },
      ]}
      title="Política de Privacidade"
      updatedAt="16/08/2026"
    />
  );
}
