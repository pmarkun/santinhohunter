import { LegalPage } from '@/components/LegalPage';

export default function DataDeletionScreen() {
  return (
    <LegalPage
      kicker="Dados"
      sections={[
        {
          title: 'Como pedir remoção',
          body:
            'Envie um email para pedro@markun.com.br com o assunto “Exclusão de dados - Santinho Hunter”. Informe UF, cidade aproximada, data aproximada, candidato associado e o identificador local da captura quando houver.',
        },
        {
          title: 'O que pode ser removido',
          body:
            'Podemos remover a foto privada ou desassociar metadados de captura, candidato confirmado e registros de match vinculados ao pedido. As fotos não são publicadas em galerias abertas.',
        },
        {
          title: 'Prazo operacional',
          body:
            'Pedidos serão avaliados conforme identificação possível do registro e risco de fraude. Quando o registro for localizado, a remoção será priorizada antes do fim da eleição.',
        },
      ]}
      title="Exclusão de Dados"
      updatedAt="17/08/2026"
    />
  );
}
