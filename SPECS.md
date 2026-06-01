# Santinho Hunter - SPECS

## 1. Visao Geral

Santinho Hunter e um app mobile first, tambem publicavel como PWA, para registrar santinhos eleitorais encontrados em ruas, calcadas, pracas e outros espacos publicos durante o periodo eleitoral.

A pessoa usuaria fotografa o santinho jogado no chao, o app registra data, hora e localizacao, tenta identificar automaticamente o candidato a partir da imagem e contabiliza aquele registro como um item de lixo eleitoral encontrado. O resultado alimenta rankings regionais por UF e cargo.

O tom do app deve ser escrachado, direto e popular: mais denuncia bem-humorada do que painel corporativo. A interface deve parecer uma ferramenta de rua, de caca e coleta, com energia de mutirao civico, sem tons pasteis, sem estetica SaaS limpinha, sem cara de relatorio institucional.

## 2. Objetivos

- Permitir que qualquer pessoa registre santinhos encontrados na rua com poucos toques.
- Capturar evidencias com foto, data, hora e geolocalizacao.
- Identificar candidatos automaticamente por deteccao facial e comparacao vetorial.
- Permitir busca manual por numero quando a deteccao nao funcionar ou estiver errada.
- Organizar a experiencia por UF da pessoa usuaria.
- Exibir rankings por estado e cargo com o total de lixo eleitoral encontrado.
- Funcionar muito bem no celular, com experiencia instalavel como PWA.
- Manter uma experiencia visual forte, provocativa e memoravel.

## 3. Nao Objetivos Iniciais

- Nao substituir denuncia formal em orgaos eleitorais.
- Nao prometer identificacao perfeita de candidatos.
- Nao publicar localizacao exata de pessoas usuarias em tela publica.
- Nao permitir ataques, ameacas ou assedio contra candidatos.
- Nao criar rede social completa na primeira versao.
- Nao depender de conectividade constante para tirar foto e salvar captura local.

## 4. Plataformas

### 4.1 App Mobile

- React Native com Expo.
- TypeScript em modo strict.
- Expo Router para navegacao baseada em arquivos.
- Componentes funcionais com hooks.
- Animacoes com react-native-reanimated.
- Persistencia local com AsyncStorage.
- Testes com Jest.
- Build Android via EAS Build.
- Ambiente de desenvolvimento preparado por Nix.

### 4.2 PWA

O app deve ser mobile first e publicavel como PWA para uso direto no navegador do celular.

Requisitos:

- Layout responsivo priorizando telas pequenas.
- Instalavel na tela inicial quando servido como web app.
- Manifest com nome, icones, tema e orientacao adequados.
- Service worker ou estrategia equivalente de cache quando suportada pelo stack Expo Web.
- Fluxo funcional em browsers moveis modernos.
- Degradacao bem explicada quando camera, geolocalizacao ou armazenamento local nao estiverem disponiveis.

## 5. Publico-Alvo

- Pessoas interessadas em fiscalizacao eleitoral cidadã.
- Ativistas, jornalistas, pesquisadores e observatorios eleitorais.
- Eleitores incomodados com sujeira eleitoral nas ruas.
- Grupos locais que querem mapear impacto de campanhas em bairros e cidades.

## 6. Tom De Voz

A comunicacao deve ser brasileira, urbana, espirituosa e indignada na medida certa.

Diretrizes:

- Usar frases curtas e com personalidade.
- Evitar juridiquês, burocratês e tom de startup.
- Tratar santinho descartado como "lixo eleitoral".
- Transformar a captura em uma "caca" ou "flagra".
- Usar humor sem difamar pessoas.
- Ser firme em relacao a sujeira nas ruas.

Exemplos de microcopy:

- "Cacar santinho"
- "Flagrar lixo eleitoral"
- "Mais um pra pilha"
- "Esse aqui tava dando sopa"
- "Candidato encontrado"
- "Nao bateu? Busca pelo numero"
- "Ranking da sujeira"
- "Mapa da bagunca"
- "Sem localizacao, sem flagrante completo"
- "Camera travou? Respira e tenta de novo"

Evitar:

- "Otimize sua experiencia"
- "Dashboard de performance"
- "Engajamento civico gamificado"
- "Sua jornada de fiscalizacao"
- "Insights eleitorais"

## 7. Identidade Visual

### 7.1 Personalidade

Visual forte, popular, contrastado e meio cartaz de rua. Deve lembrar lambe-lambe, pixacao editorial, alerta urbano, placa de perigo, jornal de bairro e panfleto amassado.

### 7.2 Paleta

Evitar tons pasteis e aparencia corporativa. Usar alto contraste.

Sugestao inicial:

- Preto asfalto: `#111111`
- Branco papel: `#F7F2E8`
- Amarelo alerta: `#FFD400`
- Vermelho denuncia: `#FF2A2A`
- Verde urna: `#00C853`
- Azul tinta: `#005BFF`

Uso:

- Preto e branco como base.
- Amarelo e vermelho para acao, alerta e contadores.
- Verde para confirmacao.
- Azul apenas como acento secundario.

### 7.3 Tipografia

- Titulo com peso alto, condensado ou grotesco, se disponivel.
- Texto funcional legivel e direto.
- Numeros grandes nos rankings.
- Botoes com verbos fortes.

### 7.4 Elementos Visuais

- Texturas leves de papel, xerox ou asfalto podem ser usadas com parcimonia.
- Molduras duras, bordas grossas, selos e etiquetas.
- Iconografia simples e agressiva: camera, mira, saco de lixo, ranking, mapa, lupa, urna.
- Cantos pouco arredondados.
- Nada de gradientes suaves decorativos.
- Nada de cards fofinhos em tons claros e sombras corporativas.

## 8. Conceitos Principais

### 8.1 Santinho Encontrado

Registro criado quando uma pessoa fotografa um material eleitoral descartado.

Campos:

- `id`
- `photoUri`
- `createdAt`
- `capturedAt`
- `latitude`
- `longitude`
- `accuracy`
- `uf`
- `city`
- `source`
- `candidateMatches`
- `selectedCandidateId`
- `manualCandidateNumber`
- `office`
- `status`
- `syncStatus`

### 8.2 Candidato

Registro importado de uma base oficial ou curada de candidaturas que vao para a urna.

Campos:

- `id`
- `electionYear`
- `uf`
- `office`
- `number`
- `ballotName`
- `fullName`
- `party`
- `coalition`
- `photoUrl`
- `faceEmbedding`
- `source`
- `updatedAt`

### 8.3 Match De Candidato

Resultado da comparacao entre a imagem capturada e a base vetorial.

Campos:

- `candidateId`
- `confidence`
- `matchType`
- `faceBoundingBox`
- `rank`

`matchType`:

- `face_vector`
- `number_search`
- `manual_selection`
- `ocr_number`

### 8.4 Ranking

Agregado de lixo eleitoral encontrado por UF, cargo e candidato.

Campos:

- `uf`
- `office`
- `candidateId`
- `count`
- `lastCaptureAt`

## 9. Cargos E Rankings

O app deve exibir rankings por UF para:

- Deputado Federal
- Deputado Estadual ou Deputado Distrital, quando aplicavel
- Governador
- Senador
- Presidente

Observacoes:

- Presidente e um cargo nacional, mas deve aparecer filtrado por UF para mostrar onde os santinhos daquele cargo foram encontrados.
- Senador, Governador, Deputado Federal e Deputado Estadual/Distrital dependem do UF.
- Para o Distrito Federal, usar Deputado Distrital no lugar de Deputado Estadual.

Ranking principal:

- Total de lixo encontrado por candidato.
- Separado por cargo.
- Filtrado pelo UF ativo.

Ranking secundario:

- Total geral por cargo no UF.
- Total geral do UF.
- Candidatos mais encontrados nas ultimas 24h, se houver dados suficientes.

## 10. UF E Regionalizacao

### 10.1 Definicao De UF

O app deve funcionar regionalmente a partir do UF da pessoa.

Possiveis fontes:

1. Geolocalizacao atual.
2. Selecao manual na primeira abertura.
3. Ajuste posterior nas configuracoes.

Regra recomendada:

- Na primeira abertura, pedir permissao de localizacao.
- Se concedida, inferir UF por reverse geocoding ou servico proprio.
- Se negada, pedir selecao manual de UF.
- Sempre permitir trocar UF manualmente.

### 10.2 Persistencia

Salvar UF escolhido em AsyncStorage.

Chave sugerida:

- `santinhohunter:userUf`

## 11. Fluxos Principais

### 11.1 Onboarding

Objetivo: explicar rapidamente a proposta e obter permissoes essenciais.

Telas:

1. Chamada: "Cace santinhos jogados na rua."
2. Permissao de camera.
3. Permissao de localizacao.
4. Confirmacao ou escolha de UF.

Requisitos:

- Nao ser longo.
- Permitir pular explicacao, mas nao esconder consequencias de negar permissao.
- Salvar estado de onboarding em AsyncStorage.

### 11.2 Captura De Santinho

Fluxo:

1. Pessoa toca em "Cacar santinho".
2. App abre camera.
3. Pessoa fotografa o santinho.
4. App captura localizacao e timestamp.
5. App mostra pre-visualizacao.
6. App roda identificacao.
7. App exibe candidatos encontrados, se houver.
8. Pessoa confirma candidato ou busca manualmente.
9. App salva registro local e tenta sincronizar.
10. App mostra confirmacao e opcao de ver ranking.

Estados:

- Camera pronta.
- Permissao pendente.
- Permissao negada.
- Capturando foto.
- Buscando localizacao.
- Processando imagem.
- Match encontrado.
- Match incerto.
- Nenhum match.
- Salvando.
- Salvo localmente.
- Sincronizado.
- Falha de rede com pendencia local.

### 11.3 Identificacao Automatica

Fluxo tecnico:

1. Detectar faces na foto capturada.
2. Gerar embedding facial para cada face encontrada.
3. Comparar embeddings com base vetorial de candidatos do UF e cargos aplicaveis.
4. Retornar candidatos provaveis ordenados por confianca.
5. Quando houver multiplos rostos, exibir multiplas possibilidades.

Regras de UX:

- Nunca afirmar 100% de certeza.
- Mostrar "parece ser" ou "melhor palpite".
- Se confianca baixa, pedir confirmacao mais explicita.
- Permitir "nao e esse" e busca manual.

### 11.4 Busca Por Numero

Quando a deteccao automatica falhar ou retornar candidato errado, a pessoa deve poder procurar por numero.

Requisitos:

- Campo numerico grande.
- Filtrar candidatos do UF ativo.
- Permitir selecionar cargo quando houver ambiguidade.
- Exibir foto, nome de urna, partido, numero e cargo.
- Permitir confirmacao manual.

Possivel evolucao:

- OCR do santinho para detectar numero automaticamente.

### 11.5 Rankings

Fluxo:

1. Pessoa abre aba "Ranking".
2. App usa UF ativo.
3. Pessoa alterna cargo por tabs ou seletor.
4. Lista mostra candidatos ordenados por quantidade de lixo encontrado.
5. Cada item mostra posicao, nome, numero, partido, cargo e contagem.

Requisitos:

- Atualizar apos novo registro.
- Mostrar estado vazio com personalidade.
- Mostrar ultima atualizacao.
- Tratar dados offline com cache local.
- Ser publico desde o inicio do MVP.
- Usar dados sincronizados reais assim que houver backend disponivel, sem depender de login.

### 11.6 Historico Local

Pessoa pode ver seus proprios flagrantes.

Campos visiveis:

- Foto.
- Data e hora.
- Bairro/cidade quando disponivel.
- Candidato identificado.
- Status de sincronizacao.

Acao:

- Corrigir candidato.
- Remover registro local, se ainda nao sincronizado.
- Reportar erro, se sincronizado.

## 12. Navegacao

Usar Expo Router com navegacao por arquivos.

Estrutura sugerida:

```text
app/
  _layout.tsx
  index.tsx
  onboarding/
    index.tsx
    permissions.tsx
    uf.tsx
  (tabs)/
    _layout.tsx
    hunt.tsx
    ranking.tsx
    history.tsx
    settings.tsx
  capture/
    camera.tsx
    review.tsx
    match.tsx
    manual-search.tsx
    success.tsx
  candidate/
    [id].tsx
```

Tabs principais:

- Cacar
- Ranking
- Historico
- Ajustes

## 13. Telas

### 13.1 Home / Cacar

Primeira tela funcional do app.

Elementos:

- Botao principal grande: "Cacar santinho"
- UF atual com acao de troca.
- Contador local ou estadual: "X lixos encontrados no seu estado"
- Atalho para ranking.
- Ultimo flagrante, se existir.

### 13.2 Camera

Elementos:

- Preview da camera em tela cheia.
- Botao de disparo grande.
- Botao de fechar.
- Indicador de localizacao.
- Overlay simples de enquadramento.

Requisitos:

- Abrir rapido.
- Evitar UI poluida.
- Lidar com permissao negada.
- Confirmar foto antes de processar.

### 13.3 Review Da Foto

Elementos:

- Foto capturada.
- Data/hora.
- Local aproximado.
- Botao "Usar esse flagra".
- Botao "Tirar outra".

### 13.4 Resultado De Match

Elementos:

- Lista de candidatos encontrados.
- Confiança visual sem excesso tecnico.
- Foto oficial do candidato.
- Nome de urna, numero, partido e cargo.
- Botao "E esse".
- Botao "Nao achei, buscar por numero".

### 13.5 Busca Manual

Elementos:

- Input numerico.
- Filtro por cargo.
- Resultados.
- Estado vazio.

### 13.6 Ranking

Elementos:

- UF ativo.
- Tabs por cargo.
- Lista ranqueada.
- Contador total.
- Ultima atualizacao.

### 13.7 Historico

Elementos:

- Grade ou lista de flagrantes.
- Status de sync.
- Filtros simples por candidato/cargo.

### 13.8 Ajustes

Elementos:

- UF.
- Permissoes.
- Politica de privacidade.
- Sobre os dados.
- Apagar dados locais.

## 14. Estados Offline E Sincronizacao

O app deve conseguir registrar captura mesmo sem internet, desde que camera e armazenamento local estejam disponiveis.

Comportamento:

- Salvar foto localmente.
- Salvar metadata localmente.
- Marcar como `pending_sync`.
- Tentar sincronizar quando voltar conexao.
- Exibir status no historico.

AsyncStorage pode guardar metadados leves. Fotos devem usar filesystem local do Expo quando necessario.

Chaves sugeridas:

- `santinhohunter:onboardingCompleted`
- `santinhohunter:userUf`
- `santinhohunter:captures`
- `santinhohunter:rankingsCache`
- `santinhohunter:candidatesCache:{uf}:{year}`

## 15. Permissoes

### 15.1 Camera

Essencial para o produto.

Quando negada:

- Explicar que sem camera nao ha caca.
- Oferecer botao para abrir configuracoes.
- Permitir navegar em ranking mesmo sem camera.

### 15.2 Localizacao

Essencial para evidenciar UF, cidade e contexto do descarte.

Quando negada:

- Permitir selecionar UF manualmente.
- Registro ainda pode existir, mas marcado como sem localizacao precisa.
- Explicar que rankings e mapas ficam menos confiaveis.

### 15.3 Armazenamento

Necessario para cache, fila offline e historico local.

## 16. Deteccao Facial E Base Vetorial

### 16.1 Pipeline

Pipeline inicial recomendado:

1. Base oficial/curada de candidatos com fotos.
2. Pre-processamento das fotos oficiais.
3. Deteccao de face em cada foto oficial.
4. Geracao de embeddings faciais.
5. Indexacao vetorial por UF, ano e cargo.
6. No app ou backend, comparar imagem capturada contra indice.

### 16.2 Onde Rodar

Opcoes:

#### Backend

Vantagens:

- Modelo mais pesado e preciso.
- Base vetorial atualizada centralmente.
- Menos carga no aparelho.

Desvantagens:

- Depende de internet.
- Exige cuidado maior com privacidade e envio de imagens.

#### On-device

Vantagens:

- Melhor privacidade.
- Funciona offline.

Desvantagens:

- Mais complexo em React Native/Expo.
- Modelo e base podem ficar pesados.
- Performance varia muito por aparelho.

Decisao recomendada para MVP:

- Fazer identificacao automatica via backend.
- Manter captura offline.
- Quando offline, salvar registro e processar depois.
- Planejar evolucao para OCR local de numero antes de reconhecimento facial local completo.

### 16.3 Retorno Do Servico De Match

Endpoint conceitual:

```http
POST /matches
```

Payload:

```json
{
  "captureId": "cap_123",
  "uf": "SP",
  "electionYear": 2026,
  "image": "multipart-or-signed-upload-reference"
}
```

Resposta:

```json
{
  "matches": [
    {
      "candidateId": "cand_123",
      "confidence": 0.87,
      "matchType": "face_vector",
      "faceBoundingBox": {
        "x": 120,
        "y": 80,
        "width": 160,
        "height": 160
      }
    }
  ]
}
```

### 16.4 Thresholds

Definir faixas:

- Alta confianca: pode sugerir como principal.
- Media confianca: mostrar como possibilidade.
- Baixa confianca: nao sugerir diretamente; convidar busca manual.

Nunca salvar match automatico sem confirmacao da pessoa usuaria no MVP.

## 17. Dados Eleitorais

### 17.1 Fonte

Usar dados oficiais disponiveis publicamente do TSE como fonte principal.

Alvo inicial:

- Eleicao Geral de 2026.

Base de desenvolvimento e testes:

- Criar script de importacao do TSE.
- Enquanto os dados finais de 2026 nao estiverem completos, usar a base da eleicao geral anterior como fixture realista de desenvolvimento.
- A base anterior deve ser marcada claramente como massa de teste, nunca como dado oficial da eleicao corrente.

Campos:

- Ano da eleicao.
- UF.
- Cargo.
- Numero.
- Nome de urna.
- Nome completo.
- Partido.
- Foto oficial.

### 17.2 Importacao

Criar processo de importacao separado do app:

1. Baixar dados oficiais do TSE.
2. Normalizar cargos e UFs.
3. Validar fotos.
4. Gerar embeddings.
5. Publicar pacote/indice por UF.
6. Versionar a importacao por ano eleitoral, data de geracao e origem.

### 17.3 Atualizacao

- Atualizar base conforme calendario eleitoral.
- Registrar versao da base.
- Exibir versao dos dados em "Sobre os dados".

## 18. Modelo De Dados Local

Tipos TypeScript conceituais:

```ts
export type Office =
  | 'president'
  | 'governor'
  | 'senator'
  | 'federal_deputy'
  | 'state_deputy'
  | 'district_deputy';

export type CaptureStatus =
  | 'draft'
  | 'processing'
  | 'needs_manual_match'
  | 'confirmed'
  | 'rejected';

export type SyncStatus =
  | 'local_only'
  | 'pending_sync'
  | 'syncing'
  | 'synced'
  | 'sync_failed';

export type Candidate = {
  id: string;
  electionYear: number;
  uf: string;
  office: Office;
  number: string;
  ballotName: string;
  fullName: string;
  party: string;
  photoUrl: string;
};

export type CandidateMatch = {
  candidateId: string;
  confidence: number;
  matchType: 'face_vector' | 'number_search' | 'manual_selection' | 'ocr_number';
  rank: number;
};

export type SantinhoCapture = {
  id: string;
  photoUri: string;
  createdAt: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  uf: string;
  city?: string;
  candidateMatches: CandidateMatch[];
  selectedCandidateId?: string;
  manualCandidateNumber?: string;
  office?: Office;
  status: CaptureStatus;
  syncStatus: SyncStatus;
};
```

## 19. Backend Conceitual

Mesmo que o primeiro foco seja app, a especificacao precisa prever servicos.

### 19.1 Endpoints

```http
GET /candidates?uf=SP&electionYear=2026
GET /candidates/search?uf=SP&number=1313
POST /captures
POST /matches
GET /rankings?uf=SP&office=federal_deputy
GET /rankings/summary?uf=SP
```

### 19.2 Regras

- Validar UF.
- Validar cargo.
- Nao aceitar ranking publico com localizacao individual precisa.
- Publicar pontos com localizacao aproximada o suficiente para mostrar concentracao regional sem expor coordenadas exatas.
- Deduplicar capturas suspeitas.
- Guardar auditoria de alteracao manual de candidato.
- Limitar abuso por usuario/dispositivo/IP quando aplicavel.
- Nao exigir login no MVP.

## 20. Privacidade, Seguranca E Etica

### 20.1 Localizacao

- Nao mostrar coordenadas exatas publicamente como foram capturadas.
- Exibir publicamente uma localizacao aproximada do ponto, com deslocamento/quantizacao suficiente para preservar a pessoa usuaria e ainda revelar a mancha de lixo eleitoral.
- Agregar localizacao para rankings.
- Se houver mapa futuro, usar precisao reduzida, deslocamento controlado ou celulas agregadas.
- Explicar por que a localizacao e coletada.

### 20.2 Imagens

- A foto pode conter pessoas, placas, casas ou informacoes sensiveis.
- Considerar blur automatico de rostos nao relacionados em versoes futuras.
- Evitar publicar fotos brutas sem moderacao.
- Usar fotos principalmente como evidencia e entrada de processamento.
- Fotos brutas enviadas ao backend podem ser armazenadas ate o fim da eleicao.
- Depois do fim da eleicao, definir rotina de remocao, arquivamento anonimizado ou retencao minima apenas quando houver justificativa publica clara.

### 20.3 Reconhecimento Facial

O reconhecimento deve ser limitado a comparar material eleitoral fotografado contra fotos oficiais de candidatos, com objetivo de identificar propaganda descartada.

Regras:

- Nao identificar cidadaos comuns.
- Nao criar busca geral de pessoas.
- Nao expor embeddings publicamente.
- Nao vender ou compartilhar embeddings.
- Informar que a identificacao e probabilistica.

### 20.4 Moderacao

No MVP, nao havera moderacao operacional completa das capturas sincronizadas.

Ainda assim, a arquitetura deve prever mecanismos futuros contra:

- Fotos falsas.
- Capturas duplicadas.
- Ataques coordenados.
- Uso para assedio.
- Conteudo ofensivo.

Enquanto nao houver moderacao, o produto deve evitar superficies publicas arriscadas:

- Nao exibir fotos brutas em galerias publicas abertas.
- Nao permitir comentarios publicos.
- Nao ter perfil publico de pessoa usuaria.
- Priorizar rankings agregados e pontos aproximados.

### 20.5 Politica De Uso

O app deve ter uma politica de uso legivel, ativista e direta, disponivel para leitura sem bloquear o uso.

Regras:

- Nao exigir aceite formal no MVP.
- Nao esconder a politica atras de linguagem juridica.
- Explicar camera, localizacao, fotos, reconhecimento de candidatos e rankings.
- Deixar claro que o reconhecimento compara santinhos com fotos oficiais de candidatos, nao pessoas aleatorias.
- Reforcar que o app e para registrar lixo eleitoral em espaco publico, sem perseguicao, ameaca ou assedio.

## 21. Gamificacao Sem Virar Bagunca

Possiveis elementos:

- Contador pessoal de santinhos cacados.
- Badges por volume.
- Ranking por UF.
- Mutiroes locais.
- "Combo de sujeira" quando varios registros sao feitos em sequencia.

Cuidados:

- Nao incentivar risco fisico.
- Nao incentivar confronto politico.
- Nao incentivar manipular lixo para inflar ranking.
- Nao expor ranking individual publico no MVP.

## 22. Animacoes E Interacoes

Usar react-native-reanimated para transicoes simples e suaves.

Exemplos:

- Entrada do botao principal.
- Feedback apos captura.
- Cartao de candidato deslizando.
- Mudanca de cargo no ranking.
- Contador subindo apos confirmacao.

Diretrizes:

- Animacoes curtas.
- Sem excesso decorativo.
- Respeitar reducao de movimento quando disponivel.
- Priorizar sensacao de rapidez.

## 23. Componentes

Componentes sugeridos:

- `PrimaryActionButton`
- `CameraCaptureView`
- `PermissionGate`
- `UfSelector`
- `CandidateCard`
- `CandidateMatchList`
- `RankingTabs`
- `RankingRow`
- `CaptureHistoryItem`
- `SyncStatusBadge`
- `TrashCounter`
- `EmptyState`
- `ErrorState`

## 24. Servicos No App

Servicos sugeridos:

- `storageService`
- `locationService`
- `cameraService`
- `candidateService`
- `matchService`
- `captureService`
- `rankingService`
- `syncQueueService`

## 25. Testes

### 25.1 Jest

Cobrir:

- Normalizacao de UF.
- Formatacao de data/hora.
- Busca e filtro de candidatos por numero.
- Ordenacao de rankings.
- Estados de captura.
- Reducers/hooks de fila de sincronizacao, se existirem.
- Persistencia com AsyncStorage mockado.

### 25.2 Testes De Componentes

Cobrir:

- Estado vazio de ranking.
- Lista de candidatos encontrados.
- Busca manual sem resultados.
- Permissao negada.
- Historico com sync pendente.

### 25.3 Testes Manuais Obrigatorios

- Camera em Android real.
- Camera em browser mobile.
- Permissao negada de camera.
- Permissao negada de localizacao.
- Captura offline.
- Sincronizacao apos voltar internet.
- Troca de UF.
- Busca por numero com candidatos ambiguos.

## 26. Acessibilidade

- Contraste alto.
- Botoes grandes.
- Labels acessiveis em botoes de icone.
- Feedback textual alem de cor.
- Campos numericos com teclado adequado.
- Alvos de toque confortaveis.
- Nao depender so de animacao para comunicar estado.

## 27. Performance

Metas:

- Abrir tela inicial rapidamente.
- Abrir camera com o minimo de espera possivel.
- Evitar processamento pesado na thread de UI.
- Cachear candidatos por UF.
- Paginacao ou virtualizacao em rankings longos.
- Reduzir tamanho de fotos antes de upload, mantendo qualidade suficiente.

## 28. Observabilidade

Eventos uteis:

- `onboarding_completed`
- `camera_permission_granted`
- `location_permission_granted`
- `capture_taken`
- `match_requested`
- `match_succeeded`
- `match_failed`
- `manual_search_used`
- `capture_confirmed`
- `capture_sync_failed`
- `ranking_viewed`

Nao registrar:

- Coordenadas precisas em ferramenta de analytics sem necessidade.
- Imagens brutas.
- Embeddings.

## 29. MVP

### 29.1 MVP Funcional

O primeiro MVP deve entregar:

- Foco na Eleicao Geral de 2026.
- Onboarding curto.
- Escolha/deteccao de UF.
- Camera integrada.
- Captura com data, hora e localizacao.
- Pre-visualizacao da foto.
- Busca manual por numero.
- Confirmacao de candidato.
- Historico local.
- Ranking publico por UF e cargo desde o inicio.
- Importacao de candidatos por script do TSE, usando base da eleicao geral anterior como teste enquanto a base final de 2026 nao estiver pronta.
- Persistencia local com AsyncStorage.
- Estados offline basicos.
- Identidade visual escrachada.
- Sem login obrigatorio.
- Sem moderacao operacional completa.
- Politica de uso ativista disponivel para leitura, sem aceite bloqueante.

### 29.2 MVP Com Inteligencia

Adicionar:

- Upload de foto para backend.
- Deteccao facial.
- Comparacao vetorial com candidatos.
- Retorno de candidatos provaveis.
- Confirmacao manual antes de salvar match.

### 29.3 Fora Do MVP

- Mapa publico detalhado.
- Perfil publico de usuarios.
- Moderacao completa.
- Login obrigatorio.
- OCR robusto.
- Reconhecimento facial on-device.
- Denuncia formal integrada a orgaos oficiais.

## 30. Roadmap

### Fase 1 - Fundacao

- Configurar Expo Router.
- Criar tema visual.
- Criar navegacao principal.
- Implementar AsyncStorage.
- Implementar UF.
- Criar telas base.

### Fase 2 - Captura

- Integrar camera.
- Integrar localizacao.
- Criar fluxo de review.
- Salvar captura local.
- Criar historico.

### Fase 3 - Candidatos E Busca

- Modelar candidatos.
- Criar script de importacao do TSE.
- Usar base da eleicao geral anterior como massa de teste.
- Busca por numero.
- Confirmacao manual.
- Ranking publico inicial por UF e cargo.

### Fase 4 - Backend E Sync

- Criar endpoints.
- Criar fila de sync.
- Sincronizar capturas.
- Atualizar rankings reais.
- Armazenar fotos brutas ate o fim da eleicao.
- Publicar pontos apenas com localizacao aproximada.

### Fase 5 - Match Visual

- Preparar base vetorial.
- Criar endpoint de match.
- Integrar fluxo de processamento.
- Ajustar thresholds.

### Fase 6 - PWA Polido

- Manifest.
- Icones.
- Cache.
- Testes em browser mobile.
- Ajustes de permissoes web.

## 31. Criterios De Aceite

Uma versao inicial pode ser considerada pronta quando:

- A pessoa consegue abrir o app no celular.
- A pessoa consegue escolher ou detectar UF.
- A pessoa consegue abrir a camera e tirar foto.
- O app salva foto, data, hora e localizacao quando permitida.
- O app permite buscar candidato por numero.
- O app permite confirmar candidato.
- O registro aparece no historico.
- O ranking publico do UF e cargo e atualizado de forma consistente.
- O app funciona sem internet para criar registro local.
- O app comunica claramente quando algo esta pendente de sincronizacao.
- A interface tem personalidade forte e nao parece corporativa.
- O app nao exige login.
- A politica de uso esta disponivel sem bloquear o fluxo.

## 32. Riscos

- Qualidade ruim de foto de santinho no chao pode prejudicar match facial.
- Santinhos podem ter fotos pequenas, distorcidas ou cobertas.
- Varios candidatos podem aparecer no mesmo material.
- Dados oficiais podem mudar ou ter inconsistencias.
- Reconhecimento facial exige cuidado juridico, etico e tecnico.
- Camera e geolocalizacao em PWA variam por navegador.
- Rankings podem ser manipulados sem deduplicacao e moderacao.
- Upload de imagens pode ter custo significativo.

## 33. Decisoes Fechadas

- A eleicao alvo inicial e a Eleicao Geral de 2026.
- A base de candidatos sera importada diretamente do TSE por script proprio.
- A base da eleicao geral anterior pode ser usada como massa de teste enquanto os dados de 2026 nao estiverem completos.
- O ranking sera publico desde o inicio do MVP.
- O MVP nao exigira login.
- O MVP nao tera moderacao operacional completa de capturas sincronizadas.
- A localizacao exibida publicamente pode aproximar bem o ponto, mas nao deve revelar a coordenada bruta exata.
- Fotos brutas podem ser armazenadas no backend ate o fim da eleicao.
- O app tera uma politica de uso ativista, legivel e direta, disponivel para leitura sem exigir aceite bloqueante.

## 34. Principios De Produto

- Capturar tem que ser mais facil que desistir.
- Toda identificacao automatica precisa permitir correcao humana.
- Ranking bom e ranking agregado, nao exposicao de pessoa usuaria.
- O app deve ser engracado, mas a evidencia deve ser seria.
- Offline nao pode quebrar a caca.
- A camera e o coracao do produto.
- O visual deve ter cheiro de rua, nao de sala de reuniao.
