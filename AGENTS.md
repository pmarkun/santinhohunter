# AGENTS.md

## Norte Do Projeto

Santinho Hunter e um app mobile first/PWA para registrar santinhos eleitorais jogados na rua durante a Eleicao Geral de 2026. A fonte de verdade do produto e a `SPECS.md`; consulte-a antes de mudar fluxos, dados ou escopo.

## Stack

- React Native + Expo.
- TypeScript strict.
- Expo Router com navegacao por arquivos.
- Componentes funcionais com hooks.
- Animacoes com `react-native-reanimated`.
- Persistencia local com AsyncStorage.
- Testes com Jest.
- Backend Python/FastAPI para sync e match facial.
- Match facial com DeepFace no backend; CPU deve funcionar no deploy, usando GPU automaticamente quando TensorFlow enxergar uma.
- Android via EAS Build.
- Ambiente via Nix.

## Desenvolvimento

- Prefira mudancas atômicas, claras e alinhadas aos padroes existentes.
- Nao refatore fora do escopo da tarefa.
- Modele dados com tipos TypeScript explicitos.
- Isole acesso a camera, localizacao, storage, candidatos, ranking e sync em servicos/hooks reutilizaveis.
- Nao rode reconhecimento facial pesado no frontend; o app captura/envia e o backend retorna candidatos provaveis.
- Trate permissoes negadas, offline, erro de sync e dados vazios como estados normais do produto.
- Preserve acessibilidade: contraste, alvo de toque, labels e feedback textual.

## Testes

- Adicione ou atualize testes Jest para regras novas e bugs corrigidos.
- Use pytest para backend Python.
- Priorize testes de normalizacao de UF, busca por numero, ordenacao de ranking, fila de sync, persistencia e estados de captura.
- Mocke AsyncStorage, camera, localizacao e rede.
- Antes de finalizar uma tarefa, rode os testes relevantes. Se nao rodar, explique o motivo.

## Commits

- Faça commits atomicos: uma mudanca conceitual por commit.
- Use mensagens curtas e imperativas, por exemplo: `Add manual candidate search`.
- Nao misture formatacao, refactor e feature no mesmo commit quando puder separar.
- Antes de commitar, confira `git status` e inclua somente arquivos relacionados.
- Nunca reverta alteracoes do usuario sem pedido explicito.

## Privacidade E Seguranca

- Nao exponha coordenadas exatas publicamente.
- Nao publique fotos brutas em galerias abertas no MVP.
- Nao registre imagens, embeddings ou coordenadas precisas em analytics.
