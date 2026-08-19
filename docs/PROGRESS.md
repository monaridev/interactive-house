# A Casa — Diário de Progresso

> Reanexe este arquivo no início de qualquer chat novo sobre o projeto.
> Ele é a fonte da verdade do que já foi feito e do que falta.

## Visão do projeto

Experiência narrativa de exploração (não é um jogo). O cenário conta a
história; a curiosidade é a mecânica principal. Ambientes pequenos e
ricos em detalhes que reagem às escolhas do jogador.

## Prazo

17 dias a partir de 03/08/2026.

## Plano de evolução (7 fases)

1. **Protótipo HTML/CSS/JS** — salas e objetos interativos, caminhos
   diferentes, relatório final, áudio ambiente
2. **Mundo 3D (Three.js)** — movimento em primeira pessoa, portas reais,
   iluminação, som espacial
3. **Interações naturais** — jogador escolhe livremente o que observar
4. **Narrativa reativa** — depende de objetos vistos, ordem das escolhas,
   salas visitadas, tempo de exploração
5. **Expansão** — mais ambientes (corredor, sala, quarto, banheiro,
   escritório, porão, sótão)
6. **Atmosfera** — iluminação, sons, objetos recorrentes, pequenos eventos
7. **Rejogabilidade** — caminhos alternativos, eventos raros, registros
   ocultos, finais diferentes

## Estado atual (03/08/2026)

**Fase 1 concluída e ultrapassando o escopo original** — o protótipo
`notebook-a` (HTML/CSS/JS puro, sem build step) já implementa:

- Motor sala-a-sala orientado a grafo (`window.DATA.salas`), sem índice
  de catálogo — navegação em primeira pessoa "textual"
- Objetos "falantes" (mostram texto + voz sintetizada via Web Speech API)
  e "portas" (navegam, podem decidir destino dinamicamente com base nos
  objetos já clicados na sala)
- Áudio 100% sintetizado via Web Audio API (zumbido de fundo, clique,
  som de porta) — sem arquivos externos
- 4 desfechos possíveis a partir da cozinha, dependendo de quais 3
  objetos foram manuseados antes de abrir a porta
- Relatório final por rota, com texto que referencia o que **não** foi
  visto em outras rotas (semente de rejogabilidade / Fase 7)
- Descrições de sala e falas de objeto que mudam conforme o histórico
  de cliques (semente de Fase 4 — narrativa reativa)

**Decisão tomada:** abandonar o `notebook-b` (era um segundo terminal
com o mesmo DATA, sem divergência real implementada). Seguir só com o
`notebook-a` daqui pra frente.

## Pré-requisitos antes de iniciar a Fase 2 (Three.js)

- [ ] Desenhar blueprint 2D top-down das salas: dimensões, posição das
      portas, para onde cada porta leva (hoje só existe como grafo de
      texto, sem geometria real)
- [ ] Extrair a lógica de estado (`clicadosPorSala`, `visitasPorSala`,
      árvore de decisão da porta) para um módulo separado da
      renderização, antes de trocar a camada visual
- [ ] Decidir setup técnico: Three.js via `<script type="importmap">` +
      CDN (sem bundler), pra manter a simplicidade de "abrir o HTML no
      navegador"
- [ ] Cortar escopo pelo prazo: migrar só a **cozinha** pra 3D primeiro
      (prova de conceito — movimento em 1ª pessoa, 5 objetos clicáveis,
      porta com a lógica condicional já existente). As demais salas
      viram repetição do mesmo padrão.

## Estado atual (08/08/2026)

Tudo da Cozinha confirmado funcionando no navegador: mesa retangular,
reorganização dos objetos por estação, correção de colisão na quina
(bug de navegação resolvido) e o contorno via `OutlinePass`. Próximos
passos em aberto: som espacial, e as 4 salas finais (A-D) + relatório
— ainda só existem no 2D.

## Log de sessões

### 03/08/2026 — Sessão 1
- Análise do protótipo atual (v1 com catálogo/índice vs v2 sala-a-sala)
- Decisão: seguir só com notebook-a, abandonar notebook-b
- Definido prazo de 17 dias
- Levantados os 4 pré-requisitos acima antes de iniciar a Fase 2
- Criado este arquivo de acompanhamento

### 03/08/2026 — Sessão 2
- Rascunho inicial da planta física (top-down) da Cozinha: 4,0 m × 3,2 m,
  porta centralizada na parede norte, bancada na parede leste, ponto de
  início do jogador na parede sul olhando pro norte — pendente de
  confirmar posição da panela, do objeto de ambientação e do pé-direito
- Definido o "final apressado": quem passa de porta em porta sem clicar
  em nenhum objeto (usando o `visitasPorSala` que já existe) é forçado a
  sair do loop cozinha↔corredor após ~2 idas e voltas, e cai num
  relatório específico que registra a ausência de qualquer interação
- Fechado o escopo de conteúdo para os 17 dias:
  - ~16 objetos interativos concentrados na sala hub (Cozinha)
  - Objetos agrupados em 3-4 clusters temáticos; a porta decide o
    destino pelo cluster dominante, não pela combinação exata (evita
    explosão combinatória de salas)
  - As 4 salas de desfecho (salaA/B/C/D) continuam enxutas
  - Total de ~7 salas nessa entrega
  - Fase 5 (quarto, banheiro, escritório, porão, sótão) fica de bônus,
    só se sobrar tempo

**Próxima sessão:** definir os 4 clusters temáticos e distribuir os
16 objetos da Cozinha entre eles — isso trava a lógica da porta antes
de fechar a planta física completa. Depois disso: extrair a lógica de
estado do DOM, decidir o setup do Three.js, e começar a prova de
conceito 3D só da Cozinha.

### 03/08/2026 — Sessão 3
- Decisão de escopo pra apresentação de amanhã: manter a interface atual
  (HTML/CSS/JS, sem 3D ainda) e focar em conteúdo + acabamento visual —
  o salto pro Three.js fica pra depois, com mais tempo de respiro
- Implementados os 16 objetos da Cozinha em 4 clusters (corte, doméstico,
  vazio, registro), com ícones SVG próprios pra cada um
- Porta da Cozinha agora decide o destino pelo **cluster dominante**
  (mais cliques), não pela combinação exata — evita explosão de salas
- Ambiente D redesenhado: era "a mesma cozinha de novo", virou o
  desfecho do cluster registro/vigilância (sala de arquivo)
- Implementado o "final apressado": quem passa de porta em porta sem
  clicar em nada (cozinha → corredor → cozinha) é forçado a sair do
  loop após a 3ª entrada no corredor, e cai num relatório específico
- Polimento "nível de museu": números de acervo por objeto (ex.
  `COZ-04`) e títulos de seção agrupando os cartões por cluster,
  dentro da mesma identidade visual (papel, tinta, carimbo) já existente
- Empacotado `a-casa-16-objetos.zip` pra teste antes da apresentação

**Próxima sessão:** testar o fluxo completo (os 4 clusters + o final
apressado) e ajustar textos/timing conforme o teste. Depois: extrair a
lógica de estado do DOM, decidir o setup do Three.js, e começar a
prova de conceito 3D só da Cozinha — já com os pré-requisitos do
blueprint 2D e da extração de estado como próximos passos.

### 03/08/2026 — Sessão 4
- Corrigido o efeito de digitação: só roda na primeira visita de cada
  sala; revisitas mostram o texto instantâneo (evita a sensação de
  "quebrado" ao voltar pra cozinha repetidamente)
- Ambientes A/B/C/D expandidos de 1 pra 4 objetos clicáveis cada,
  temáticos ao cluster que leva até eles (corte, mesa, vazio, registro)
- Cada Ambiente ganhou prefixo próprio de acervo (AMB-A, AMB-B, AMB-C,
  AMB-D) e a categoria do cluster aparece no cabeçalho da sala

### 03/08/2026 — Sessão 5
- Feedback: design "fraco", sem especificar em quê — decisão de design
  autoral: cor por categoria (como cor de lombada em fichário de arquivo)
- Adicionadas 4 cores institucionais discretas, uma por cluster (corte,
  doméstico, vazio, registro), aplicadas só como traço fino no topo dos
  cartões de objeto e um selo/chip de categoria ao lado do título da sala
- O vermelho do carimbo continua exclusivo da Porta — não disputa
  atenção com as cores de categoria
- Título da sala ganhou hierarquia maior (tamanho, tracking) com o chip
  de categoria ao lado

### 04/08/2026 — Sessão 6 (véspera da apresentação, 23h)
- Corrigido o desempate de clusters: em caso de empate na contagem de
  cliques, quem decide agora é o cluster do **último objeto clicado**
  (antes, favorecia sempre "corte" por acaso de ordem na lista)
- Adicionada uma linha no boot do sistema confirmando que a saída está
  disponível a qualquer momento — sem instruir a clicar em objetos,
  mantendo a voz do sistema (não do narrador)
- Decidido não adicionar contador de progresso (contra a regra de o
  sistema não dar feedback) nem tooltip de categoria no hover (deixaria
  explícita a lógica da porta e mudaria o jogo de curiosidade pra
  otimização de final)
- Apresentação marcada para 05/08 às 8h

### 04/08/2026 — Sessão 7
- Adicionado grid de pontos bem sutil ao fundo (papel de formulário) e
  marcas de registro nos 4 cantos da tela (crosshairs, como em
  documentos escaneados) — mudança só de CSS, zero risco pra lógica
- Fundo antes era quase liso; agora tem mais textura sem competir com
  a ficha central

### 04/08/2026 — Sessão 8
- Ideia do usuário: faltava um "e o que isso significou?" — a experiência
  fechava o trajeto, mas nunca a sessão inteira
- Implementado um segundo terminal ("Catalogação finalizada"), depois
  do relatório de sala, via botão "Consultar catalogação final"
- Mostra: objetos analisados (contagem real de cliques na Cozinha, não
  o total de 16) + cluster predominante + um texto de "comportamento
  observado" por cluster, que interpreta sem confirmar nem negar nada
  — mesmo recurso retórico dos relatórios de sala, aplicado à pessoa
- Caso do final apressado tem sua própria variante: "Amostra
  insuficiente. Nenhum padrão pôde ser extraído."
- Estrutura final por sessão: sala de desfecho → relatório da sala
  (poético, sobre o trajeto) → terminal de catalogação (clínico, sobre
  o padrão da sessão inteira) → fim

### 04/08/2026 — Sessão 9
- Fundo trocado: saiu o grid de pontos, entraram linhas de papel
  pautado (horizontal), uma linha de margem vertical vermelha bem
  fraca (referência a ledger/ficha de arquivo) e uma marca d'água
  grande "ARQUIVO" rotacionada, centralizada atrás da ficha
- Tudo aplicado só via `background-image`, sem `z-index` — evita
  qualquer risco de sobrepor conteúdo

### 04/08/2026 — Sessão 10
- Feedback: a ficha ocupa quase a tela inteira, então a textura de
  fundo (linhas, marca d'água) quase não aparecia na prática
- Movida a estética de "arquivo" pra cima do que é sempre visível:
  - Moldura tipo passe-partout ao redor da própria ficha (via
    box-shadow, não ocupa espaço de layout, sempre aparece mesmo com
    a ficha larga)
  - Régua de medição na barra superior do sistema (full-width, nunca
    coberta pela ficha, reforça "mesa de scanner")

### 04/08/2026 — Sessão 11
- Feedback: o problema era a **forma**, não a textura — um retângulo
  com retangulinhos dentro sempre vai parecer grade de app, não arquivo
- Trocada a silhueta da ficha: o topo reto virou o contorno de uma
  **aba de pasta suspensa** (hanging folder), via `clip-path`
- O "TERMINAL A" que já existia (`.protocolo`) virou a etiqueta escrita
  na própria aba, em vez de um cabeçalho solto — reaproveita o que já
  tinha, não é elemento novo
- Removida a moldura passe-partout (box-shadow) e os furos de fichário
  do topo — misturavam metáfora com a aba nova; só uma forma forte por
  vez, não várias competindo

### 05/08/2026 — Sessão 12
- Apresentação de 05/08 às 8h acabou não sendo necessária; retomada a
  transição pra Fase 2 (Three.js) direto
- Concluído o 1º pré-requisito da Fase 2: extraída a lógica de estado
  (`clicadosPorSala`, `visitasPorSala`, `jaDigitadoPorSala`, decisão de
  destino da porta) do `app.js` pra um módulo novo, `estado.js`
  (`window.Estado`), sem nenhuma dependência de DOM/áudio/texto
- `app.js` agora só consome `Estado.*`; as funções `proxima(clicados,
  global)` de `notebook-a.html` não precisaram mudar — a forma do
  snapshot (`clicadosPorSala`/`visitasPorSala`) ficou idêntica
- Comportamento validado como equivalente ao original (refactor puro,
  zero mudança de regra)

**Pendentes antes de começar o 3D em si (restam do plano original):**
- [ ] Confirmar/fechar a planta física (top-down) da Cozinha: já existe
  rascunho (4,0 m × 3,2 m, porta na parede norte, bancada na parede
  leste, jogador começa na parede sul olhando pro norte) — falta
  posição da panela, do objeto de ambientação e o pé-direito
- [ ] Decidir o setup técnico do Three.js (proposta: `<script
  type="importmap">` + CDN, sem bundler, pra manter "abrir o HTML no
  navegador") — **DECIDIDO: importmap + CDN, sem bundler**
- [x] Escopo da prova de conceito: só a Cozinha em 3D primeiro — feito
  (movimento em 1ª pessoa, colisão simples com as paredes, porta
  reaproveitando `obj.proxima()` sem alteração nenhuma)

### 05/08/2026 — Sessão 12 (continuação)
- Extraído `window.DATA`/`window.CLUSTERS` de dentro do
  `notebook-a.html` pro arquivo `dados.js`, pelo mesmo motivo da
  extração do estado: reuso entre a versão 2D e a 3D sem duplicar
  conteúdo (falas, clusters, lógica da porta)
- `notebook-a.html` agora carrega `dados.js` → `estado.js` → `app.js`,
  nessa ordem; comportamento 2D validado como idêntico
- Criada `/3d/index.html` + `/3d/main.js`: sala da Cozinha modelada com
  as dimensões do rascunho (4,0m × 3,2m × 2,6m — pé-direito ainda não
  confirmado, usando 2,6m como padrão), porta com vão real na parede
  norte, movimento WASD + mouse-look (PointerLockControls), colisão
  simples por clamp nos limites da sala (ainda não colide com a
  bancada)
- Os 16 objetos + porta usam `window.DATA.salas.cozinha` e
  `window.Estado` de verdade — clicar num objeto roda a mesma `fala()`
  da versão 2D; clicar na porta roda a mesma `proxima()` e mostra o
  destino calculado (a transição em si ainda não existe — só a
  Cozinha tem geometria 3D por enquanto)
- Posições dos 16 objetos são **placeholder**: duas prateleiras na
  parede leste (bancada embaixo, prateleira em cima), coloridas por
  cluster — layout físico real da bancada é decisão de design, não
  travada no código (função `calcularPosicoes()` isolada em
  `main.js`, fácil de trocar sem mexer no resto)

**Pendentes pra próxima sessão:**
- [ ] Testar a prova de conceito num navegador de verdade (rodar
  `python3 -m http.server` dentro de `projeto/` e abrir
  `3d/index.html` — não pode ser `file://` direto por causa do
  `type="module"`)
- [ ] Confirmar pé-direito real da Cozinha e ajustar `PE_DIREITO` em
  `main.js`
- [ ] ~~Desenhar o layout real da bancada/prateleiras~~ — feito e
  substituído pelo layout v2 (ver Sessão 12, continuação, abaixo)
- [ ] Iluminação: primeira versão ("meia-luz" literal) estava escura
  demais pra dar pra avaliar o layout — ambient e as 3 luzes pontuais
  aumentadas bem acima do clima final pretendido; **ajustar o clima
  pra baixo de novo só depois que o layout estiver 100% fechado**, pra
  não misturar as duas decisões
- [ ] Som espacial (a versão 2D já tem funções de áudio — avaliar
  reaproveitar ou refazer com `THREE.PositionalAudio`)
- [ ] Decidir como fica a transição entre salas em 3D (a porta já
  calcula o destino certo — falta desenhar a sala seguinte e trocar
  de cena)

<!-- Próxima sessão: adicionar entrada aqui com o que foi feito -->

### 05/08/2026 — Sessão 12 (continuação — layout v2, a partir de um sketch)
- Diogo mandou um desenho top-down (bancada e estante nos DOIS CANTOS
  perto da porta, não espalhadas pela parede inteira; alguns itens
  soltos no chão) — refeito o `POSICOES` em cima disso
- Restrição descoberta durante o reposicionamento: o **gelo** não pode
  ir pro chão porque a própria fala dele diz "um ponto DA BANCADA está
  mais frio" — mover contradiria o texto. Só a **mancha** ficou no
  grupo "chão"; os outros 15 objetos têm texto amarrado a bancada ou
  estante. Se quiser mais itens no chão, é decisão de conteúdo (mudar
  a fala), não só de posição — pendente de decisão do Diogo
- Removida a "mesa central" (não existe mais no layout novo — o prato
  vazio foi pra bancada, junto com o resto, como no desenho)
- Bancada: canto nordeste perto da porta, 2 níveis (11 objetos:
  corte + domestico + pratovazio + copo + gelo)
- Estante: canto noroeste perto da porta, 2 níveis (4 objetos de
  registro/vigilância — câmera olhando pra bancada)
- Confirmado 16/16 objetos posicionados, sem sobra, via checagem
  automática (script Node comparando POSICOES com window.DATA)

### 05/08/2026 — Sessão 12 (continuação — layout v3, sala maior + bancada em L)
- Diogo achou o cômodo pequeno demais pra "parecer cozinha" e trouxe
  duas referências: uma planta de cozinha real (4,28m × 3,28m, com
  pia/torre/geladeira ao longo das paredes e uma ilha central) e um
  segundo sketch top-down próprio
- Dimensões da sala aumentadas pra bater com a planta de referência:
  4,28m × 3,28m (era 4,0 × 3,2)
- **Bancada virou um balcão em L de verdade**, contornando 3 paredes
  (parte da norte à direita da porta → parede leste inteira → parte
  da sul), em vez de ficar concentrada num canto só
- Refatoração de engenharia junto com o layout: em vez de continuar
  hardcodando x/z de cada objeto da bancada à mão (não escala — cada
  mudança de formato = reescrever tudo de novo, que já aconteceu 2x),
  a bancada agora é descrita como um **caminho** (`CAMINHO_BANCADA`,
  uma polilinha) e uma função (`distribuirNoCaminho`) espalha os 10
  objetos uniformemente ao longo dele. Trocar o formato do balcão de
  novo = só mudar os pontos do caminho, nada mais no arquivo
- Estante: agora ocupa a parede oeste inteira (cabia pouco no canto
  antes; com a sala maior, uma fileira só já dá espaço de sobra pros
  4 objetos de registro/vigilância)
- **Ilha central voltou** (tinha sido removida na v2): o prato vazio
  está isolado nela de novo — cabia mal no cômodo pequeno, mas com o
  aumento faz sentido de novo, e bate com a "ilha" da planta de
  referência
- Porta saiu do centro da parede norte (estava simétrica) pra ficar
  deslocada, como no sketch novo — paredes norte recalculadas pra
  vão assimétrico
- Ponto de spawn do jogador movido pro canto sudoeste (perto da
  estante, longe da porta e da bancada), como indicado no sketch
  ("losango" = spawn)
- Validado por script: 16/16 objetos cobertos entre bancada+estante+
  extras, sem sobra; pontos do caminho da bancada conferidos como
  todos dentro dos limites da sala

### 06/08/2026 — Sessão 13 (v0 — acabamento da Cozinha 3D)

Continuação feita no v0 (sem tokens sobrando no Claude no momento),
depois reintegrada na estrutura do repo (`projeto/interfaces/3d/`),
substituindo o casco de Next.js/iframe que o v0 usa só pra preview.
`core/` e `interfaces/terminal/` não mudaram nada nesta sessão.

`main.js` deixou de ter geometria própria: agora é só o motor (câmera,
movimento, raycast, HUD, loop) e recebe um descritor de sala de
`cozinha.js` (`construirCozinha(scene)` → `{ obstaculos, interativos,
spawn }`). Quando o Corredor existir, é outro arquivo com a mesma
assinatura — a troca de sala acontece num lugar só.

- **Texturas procedurais** (`texturas.js`, novo) — parede, azulejo,
  piso, madeira, pedra, geradas via canvas, sem depender de imagem
  externa (mantém a regra de "abrir o HTML direto, sem build step")
- **Modelos 3D reais** (`modelos.js`, novo) — os 16 objetos da Cozinha
  deixaram de ser cubos coloridos por cluster; cada um tem construtor
  próprio (ex. faca = lâmina + cabo + rebite, tesoura = duas lâminas
  quase paralelas + argolas). Fallback deliberado pra objeto sem
  modelo: bloco neutro cinza + aviso no console, pra um objeto
  esquecido aparecer errado em vez de sumir da sala
- **Colisão** (`colisao.js`, novo) — jogador como círculo no plano XZ
  contra obstáculos (caixa/segmento/cilindro), resolvida eixo por
  eixo (desliza ao raspar num móvel em diagonal, não trava). Bancada,
  ilha e estante agora bloqueiam o jogador — antes só a parede
  bloqueava. `desencaixar()` cobre o caso do spawn cair dentro de um
  móvel depois de um ajuste de layout
- **Iluminação final** (`cozinha.js`) — a versão "clara demais de
  propósito" da Sessão 12 foi baixada pro clima final: uma fonte
  dominante (luminária pendente sobre a ilha, com sombra) + spots de
  apoio na bancada apontando pra baixo (não mais point lights soltas,
  que estouravam o azulejo atrás em vez de iluminar o tampo) + luz
  fria vazando do vão da porta, como única pista de que existe algo
  além da Cozinha
- **Objetos alinhados à bancada** — `distribuirNoCaminho()` agora
  também devolve o ângulo de cada trecho do caminho, e cada objeto
  usa esse ângulo (`rotY`) em vez de ficar todo apontando pro mesmo
  lado — sem isso, uma faca atravessada na bancada leste denunciava
  a cena como gerada por script
- **Pé-direito confirmado**: 2,70 m (era 2,60 "chute" desde a Sessão
  12) — referência da NBR 15575 pra altura livre residencial comum
- Removido o contador `X/16` e o `emissive` marcando objeto já
  examinado — o sistema 3D estava violando a regra 1 de
  `World_Design.md` ("nunca confirmar"), que a prova de conceito
  anterior não respeitava
- Adicionado modo `?inspecao=1` (liga câmera livre + expõe `scene`/
  `camera` no console) — ferramenta de desenvolvimento, desligada por
  padrão, pra conferir modelo/luz sem depender de pointer lock

**Pendentes pra próxima sessão:**
- [ ] Testar no navegador de verdade (`python3 -m http.server` dentro
  de `projeto/` e abrir `interfaces/3d/index.html` via `localhost`,
  não `file://`) — ainda não foi verificado visualmente depois desta
  sessão
- [ ] Som espacial (a versão 2D já tem as funções de áudio — avaliar
  reaproveitar ou refazer com `THREE.PositionalAudio`)
- [ ] Decidir como fica a transição entre salas em 3D — a porta já
  calcula o destino certo (mesma função do 2D), mas o vão continua
  bloqueado como obstáculo provisório (`bloqueioProvisorioDoVao` em
  `cozinha.js`, isolado e nomeado de propósito) até o Corredor existir
- [ ] Corredor como segunda sala 3D, seguindo a mesma assinatura de
  `construirCozinha()` — primeiro caso real de troca de cena

### 06/08/2026 — Sessão 14 (Claude — Corredor + troca de sala real)

`main.js` deixou de ser "uma sala fixa" e virou um orquestrador: existe
agora um registro `SALAS_3D = { cozinha, corredor }` e uma função
`entrarEm(id)` que descarta tudo que a sala anterior pôs na cena
(geometria + material + textura, via `traverse` + `dispose`, pra não
vazar memória de GPU a cada ida e volta), constrói a próxima sala,
reposiciona a câmera no `spawn` dela e zera a inclinação de cabeça
herdada. Clicar na porta agora chama `entrarEm(destino)` de verdade
quando o destino calculado está no registro; quando não está (salaA-D,
relatorio, relatorioApressado — ainda só existem no 2D), continua
mostrando só o texto de sempre, sem vazar o destino calculado pro
jogador (isso só vai pro console, pra depuração).

- **`corredor.js` (novo)** — segunda sala 3D, mesma assinatura de
  `construirCozinha(scene, ctx)`. Não tem os 16 objetos da Cozinha —
  `window.DATA.salas.corredor` só define a porta de saída — então a
  decisão aqui foi só arquitetura/atmosfera:
  - **Traçado levemente torto**: dois trechos retos com ~14° de quebra
    no meio, não reto (sem graça) nem 90° (esquina óbvia, fácil de
    memorizar). A ideia é dar pra sentir que virou sem conseguir
    apontar exatamente onde, reforçando "será que é o mesmo corredor?"
  - **Mais estreito e mais baixo que a Cozinha** (1,15m de largura,
    2,35m de pé-direito contra 2,70m) — aperta sem precisar dizer que
    aperta
  - **Metal, não madeira/pedra** — léxico construtivo diferente da
    Cozinha de propósito, pra marcar que é passagem institucional, não
    cômodo
  - **Porta de saída com detalhe que muda a cada visita**: ângulo de
    entreaberta e deslocamento no batente variam por um hash
    determinístico com seed = número de visitas anteriores ao Corredor
    (mesma visita sempre dá o mesmo resultado, visitas diferentes dão
    resultados diferentes) — a variação é pequena o bastante pra não
    virar mecânica, só atmosfera
  - **Porta de entrada decorativa** — a porta da Cozinha vista de trás
    ("atrás de você", como diz `dados.js`), fechada e sem
    `userData.tipo`, então o raycast nunca acha ela
  - Correção no meio do caminho: o primeiro cálculo do bloqueio de
    colisão do vão assumia parede alinhada ao eixo (copiado direto do
    padrão da Cozinha) — quebrava pro segundo trecho, que está em
    ângulo. Trocado por uma fórmula de AABB de retângulo rotacionado de
    verdade (`bloqueioVao`)
- **Spawn ajustado** depois de notar que a distância original (0,55m
  da porta de entrada) deixava o raio de colisão do jogador quase
  encostando no bloqueio do vão — foi pra 0,8m, com folga de verdade

**Pendentes pra próxima sessão:**
- [ ] Testar no navegador (Cozinha, Corredor, e a transição entre as
  duas nos dois sentidos) — nada disso foi verificado visualmente
- [ ] Som espacial
- [ ] As 4 salas finais (salaA-D) e o relatório — ainda só existem no
  2D; a porta da Cozinha já sabe calcular o destino certo, só falta a
  geometria

### 07/08/2026 — Sessão 15 (Claude — primeiro teste real + 5 ajustes)

Diogo testou a Cozinha no navegador pela primeira vez (Chrome, arquivo
local) — funcionou. A partir do feedback desse teste, e de uma planta
que ele desenhou à mão, cinco mudanças:

- **Mesa retangular no lugar da ilha redonda** (`cozinha.js`) —
  posição validada por simulação antes de escrever qualquer geometria:
  um flood-fill numa grade de 5cm, reaproveitando as funções reais de
  `colisao.js` (não uma reimplementação separada), confirmou que a
  área livre da sala continua sendo uma região só, com a mesa em
  `(-0,25; 0)`, 1,0×0,65m, ~1m de corredor livre pro lado leste e
  ~0,7m pros lados norte/sul. Pernas nos quatro cantos (recuadas 8cm),
  não mais um pedestal central — pedestal fazia sentido pra ilha,
  não pra mesa de jantar. Caixa no lugar de cilindro na colisão.
- **Bug relatado — "entra por um lado, não sai pelo outro"**:
  investigado por simulação antes de mexer em qualquer número. Rodei
  o mesmo flood-fill na ilha redonda ANTIGA e na mesa retangular NOVA:
  nos dois casos a sala é uma região só, sem bolsão isolado — não é um
  buraco de colisão. A hipótese mais provável é `resolverMovimento`
  testando os eixos X e Z em sequência (ótimo pra deslizar pela
  parede, mas sensível à ORDEM perto de uma quina apertada — os dois
  eixos podem falhar separadamente mesmo com o ponto diagonal livre).
  Corrigido em `colisao.js`: quando os dois eixos travam sozinhos, um
  fallback testa o movimento diagonal direto contra a posição
  original. Mudança pequena e sem risco pro resto (só entra em ação
  nesse caso específico). **Não foi possível confirmar no navegador**
  — fica pra validar na próxima sessão de teste.
- **Objetos da bancada reorganizados por estação real**
  (`GRUPOS_BANCADA`), não mais pela ordem do cluster narrativo (que
  segue decidindo o final em `dados.js`, sem mudar nada): estação de
  corte (faca, tábua, tesoura, amolador, espeto) → mesa posta/serviço
  (panela, garfo, toalha, copo) → o ponto frio sozinho no fim do
  balcão (gelo, isolado de propósito — a fala dele já é sobre ser uma
  anomalia sem explicação). `distribuirNoCaminho` virou
  `distribuirGrupos`: agora existe um respiro (peso 1,4× um objeto)
  entre grupos, não só a ordem mudando — sem isso, reagrupar no array
  não alteraria a distância visual entre nada.
- **Aura no hover** substituindo o antigo feedback (mira com blur/
  escala no CSS): uma `THREE.PointLight` quente, reposicionada no
  objeto mirado a cada frame, com intensidade suavizada (nunca em
  degrau) em vez de ligar/desligar. Vive fora do Group da sala —
  sobrevive à troca de cena, senão `limparSala()` apagaria ela.
- **Transição fade + passo** entre portas, no lugar do corte seco:
  a câmera avança 0,35m na direção que já olhava enquanto a tela
  escurece (220ms), troca a sala no ponto mais escuro, clareia do
  outro lado. Rodando dentro do loop de render (não `setTimeout`) pra
  nunca dessincronizar do pointer lock. Clique duplo durante a
  transição é ignorado.
- **Refatoração de suporte**: `entrarEm()` agora dá a cada sala um
  `THREE.Group` próprio (em vez de escrever direto na `scene`) —
  necessário pra `limparSala()` não apagar a luz da aura, que precisa
  sobreviver à troca. `cozinha.js`/`corredor.js` não mudaram nada por
  causa disso (o parâmetro ainda se chama `scene` neles; só quem
  chama passou a mandar um Group em vez da cena inteira).

**Pendentes pra próxima sessão:**
- [ ] Testar tudo no navegador — mesa, reorganização dos objetos,
  aura, transição, e principalmente confirmar se o fallback diagonal
  resolveu o bug relatado de navegação
- [ ] Som espacial
- [ ] As 4 salas finais (salaA-D) e o relatório

### 08/08/2026 — Sessão 16 (Claude — contorno de verdade no hover)

Diogo testou no navegador: a transição fade+passo entre Cozinha e
Corredor já ficou melhor. Mas a "aura" da Sessão 15 (uma
`PointLight` posicionada no objeto) não era o que ele queria — ele
mostrou print comparando o que saiu com o que esperava: não uma luz
iluminando a superfície ao redor de forma desigual, e sim um contorno
desenhado ao redor da silhueta do próprio objeto. Antes de mexer em
qualquer código, ele pediu sugestões — então foram levantadas duas
abordagens (`OutlinePass` via pós-processamento vs. casca invertida
sem tocar no pipeline de render) com os trade-offs de cada uma; ele
escolheu `OutlinePass`.

Trocado o feedback de hover inteiro:
- `renderer.render(scene, camera)` virou `composer.render()` — agora
  existe um `EffectComposer` com `RenderPass` → `OutlinePass` →
  `OutputPass`. O render target do composer usa `samples: 4`
  (multisample manual), porque sem isso o `antialias: true` do
  renderer não chega no resultado final — o composer desenha pra um
  buffer próprio, e as quinas de TUDO (não só do contorno) voltariam a
  serrilhar.
- `OutlinePass` configurado pra afordância, não alerta: sem pulso
  (`pulsePeriod = 0`), contorno branco (`visibleEdgeColor`), um pouco
  de `edgeGlow` (0,25) pra não ficar com cara de linha de UI dura.
- A luz da aura (`PointLight`) e sua suavização por frame saíram
  inteiras; `atualizarContorno()` só troca
  `outlinePass.selectedObjects` entre `[alvo]` e `[]` — mais simples
  que antes, porque o próprio `OutlinePass` já cuida do glow da borda.
- `OutputPass` no fim da cadeia é obrigatório aqui: sem ele o tone
  mapping (ACESFilmic) e a conversão de espaço de cor do renderer não
  se aplicam ao resultado do composer.
- `__inspecao.olhar()` e o resize handler atualizados pra usar o
  composer também (`composer.setSize` + `outlinePass.resolution.set`).

**Pendentes pra próxima sessão:**
- [x] Testar no navegador — contorno e reorganização dos objetos
  confirmados funcionando
- [x] Mesa retangular confirmada — posicionamento melhorou
- [x] Bug de navegação confirmado corrigido — o fallback diagonal em
  `resolverMovimento` resolveu
- [ ] Som espacial
- [ ] As 4 salas finais (salaA-D) e o relatório

### 10/08/2026 — Sessão 17 (v0 — som espacial + HUD temporário)

O zumbido recorrente deixou de funcionar como áudio ambiente sem direção e
passou a existir fisicamente dentro do espaço. A intenção narrativa foi
preservada: a origem não é explicada, mas agora pode ser procurada pelo
jogador como mais uma pista ambiental.

- **Som espacial sintetizado** (`main.js`) — criada uma fonte contínua via
  Web Audio API, sem arquivo externo: dois osciladores senoidais próximos
  (57 Hz e 61,5 Hz) produzem uma pulsação elétrica discreta, filtrada por
  `BiquadFilterNode` e posicionada por `PannerNode` com modelo HRTF.
- **Ouvinte sincronizado à câmera** — posição, direção frontal e vetor
  vertical do `AudioListener` nativo são atualizados a cada frame a partir
  da câmera Three.js. Assim, girar a cabeça e caminhar altera de verdade a
  direção e a intensidade percebidas do zumbido.
- **Origem por sala** — o descritor retornado por `cozinha.js` e
  `corredor.js` ganhou `fonteSom`. Na Cozinha, o ruído parece vir de dentro
  da parede leste, próximo ao ponto frio da bancada; no Corredor, migra para
  trás da parede na quebra do trajeto. A troca de sala reposiciona a mesma
  fonte, sugerindo continuidade sem revelar a causa.
- **Inicialização após interação** — o contexto de áudio só começa no clique
  da tela de entrada, respeitando a política de autoplay dos navegadores.
- **HUD convertido em notificação temporária** (`index.html` + `main.js`) —
  a descrição fixa no canto inferior esquerdo foi substituída por um painel
  discreto inspirado no modelo enviado: rótulo de sistema, título do objeto
  ou sala e texto descritivo, com fundo escuro translúcido e borda fina.
- **Mesmo comportamento para objetos e salas** — tanto a fala de um objeto
  clicado quanto a descrição exibida ao entrar em uma sala aparecem por 5
  segundos e depois somem. Uma nova mensagem cancela o temporizador anterior,
  substitui o conteúdo e reinicia os 5 segundos.
- **Acessibilidade e movimento** — o painel usa `role="status"`,
  `aria-live="polite"` e `aria-atomic="true"`; a transição respeita
  `prefers-reduced-motion` e o tamanho se adapta a telas estreitas.
- **Validação** — `pnpm build` concluído sem erros; Cozinha, carregamento do
  HUD, desaparecimento após 5 segundos e execução sem erros de console foram
  verificados no navegador com WebGL habilitado.

**Estado ao fim da sessão:**
- [x] Som espacial com origem investigável na Cozinha e no Corredor
- [x] Notificações de objetos com duração de 5 segundos
- [x] Notificações de entrada em sala com duração de 5 segundos
- [x] Reinício correto do temporizador ao receber uma nova descrição
- [ ] As 4 salas finais (salaA-D) e o relatório — ainda só existem no 2D

**Próxima sessão sugerida:** iniciar a geometria das quatro salas de desfecho
seguindo o contrato atual de descritor de sala (`obstaculos`, `interativos`,
`spawn`, `fonteSom`) e conectar os destinos que a porta da Cozinha já calcula.

### 10/08/2026 — Sessão 18 (v0 — Ambiente A em 3D)

A construção das salas alternativas começou de forma incremental, uma por
sessão, para permitir testes isolados antes de avançar. O primeiro destino
implementado foi o Ambiente A: um corredor metálico estreito, industrial e
frio, preservando o conteúdo narrativo já definido em `dados.js`.

- **Novo módulo de sala** (`sala-a.js`) — criado um construtor independente
  seguindo o mesmo contrato usado pela Cozinha e pelo Corredor: `obstaculos`,
  `interativos`, `porta`, `spawn`, `limites`, `fonteSom` e `data`.
- **Arquitetura industrial** — modelado um corredor metálico estreito com
  piso em placas, paredes segmentadas, teto baixo, calhas de iluminação e
  uma porta de saída ao fundo. A composição mantém uma faixa central livre
  para navegação e concentra as pistas nas laterais.
- **Quatro pistas interativas** — marcas de corte na parede, ralo no piso,
  ferramenta caída e vestígios antigos foram representados fisicamente e
  conectados aos quatro objetos narrativos do Ambiente A. Cada pista recebe
  o `userData.ref` correto, funciona com raycasting e participa do contorno
  de seleção já existente.
- **Colisões dedicadas** — paredes laterais, limites frontal e traseiro e
  porta foram registrados como obstáculos, reutilizando integralmente
  `resolverMovimento` e `desencaixar`, sem criar lógica paralela.
- **Integração ao roteamento** (`main.js`) — `construirSalaA` foi importado e
  registrado em `SALAS_3D`. Quando os quatro instrumentos da Cozinha foram
  examinados, a porta agora conduz de fato para `salaA`, com nova geometria,
  câmera reposicionada e descrição temporária da sala.
- **Porta final preservada** — a saída do Ambiente A continua apontando para
  `relatorio`, ainda não implementado em 3D. Até essa etapa existir, o motor
  mantém o comportamento seguro de apresentar a descrição da porta sem
  trocar para uma sala inexistente.
- **Som espacial** — o Ambiente A ganhou uma origem própria para o zumbido,
  posicionada atrás da parede lateral próxima ao ralo. O áudio continua
  sendo a mesma presença recorrente, mas pode ser localizado dentro da nova
  geometria.
- **Iluminação calibrada** — combinada luz hemisférica fria com três pontos
  industriais e luminárias emissivas. A primeira versão ficou escura demais
  por causa da resposta dos materiais metálicos; intensidades e preenchimento
  foram ajustados após inspeção visual, preservando intervalos de sombra.
- **Orientação corrigida** — o ângulo inicial da câmera foi ajustado para que
  o jogador entre olhando ao longo do corredor, em direção à porta final.
- **Validação** — `pnpm build` concluído sem erros; carregamento direto da
  sala, quantidade e IDs dos quatro interativos, colisores, destino da porta,
  fonte sonora, HUD de entrada, iluminação e ausência de erros no console
  foram verificados no navegador com WebGL habilitado.

**Estado ao fim da sessão:**
- [x] Ambiente A disponível em 3D
- [x] Rota Cozinha → Ambiente A funcional após examinar os quatro instrumentos
- [x] Quatro pistas narrativas interativas com OutlinePass e HUD de 5 segundos
- [x] Colisões, iluminação e som espacial próprios
- [x] Porta de saída preparada para o futuro relatório
- [ ] Ambiente B em 3D
- [ ] Ambiente C em 3D
- [ ] Ambiente D em 3D
- [ ] Relatório e encerramento em 3D

**Próxima sessão sugerida:** construir apenas o Ambiente B, mantendo o mesmo
processo incremental: geometria isolada, pistas narrativas, colisões, som,
integração da rota correspondente e validação completa antes do Ambiente C.

### 12/08/2026 — Sessão 19 (relatório/encerramento em 3D)

Até esta sessão, sair pela porta do Ambiente A levava a um beco sem saída:
como `relatorio` não existia em `SALAS_3D`, o motor só repetia "Está
entreaberta. Não cede." — nenhuma sessão 3D conseguia, de fato, terminar.
Isso valia tanto pro final normal (Ambiente A → relatório) quanto pro final
apressado (loop cozinha↔corredor sem clicar em nada).

- **Reaproveitamento total do conteúdo 2D** — `DATA.relatorios` e
  `DATA.comportamentos` (`core/dados.js`) já eram dado puro, sem DOM,
  extraídos assim de propósito na Fase 2. Nenhuma linha desses dados foi
  alterada; só ganharam um novo consumidor.
- **Overlay de papel sobre o canvas 3D** (`index.html` + `main.js`) — novo
  `#relatorio-overlay`, estilizado no mesmo registro visual do terminal 2D
  (ficha institucional, aba de protocolo, carimbo "encerrado"), mas com
  variáveis de cor soltas no próprio seletor — não em `:root` — pra nunca
  vazar pro resto da UI escura do jogo.
- **Duas telas, mesma sequência do 2D** — `mostrarRelatorio()` (texto do
  trajeto + botão "Consultar catalogação final") e depois
  `mostrarCatalogacaoFinal()` (objetos analisados, cluster predominante,
  texto interpretativo que nunca confirma nem nega). `digitarTexto()` é o
  mesmo efeito de digitação do 2D, portado sem alteração de lógica.
- **Gancho no clique da porta** (`main.js`) — o handler agora checa
  `destino === "relatorio"` e `destino === "relatorioApressado"` ANTES de
  checar `SALAS_3D[destino]`, na mesma ordem que `app.js` já usava.
  `"relatorio"` usa `sala.id` (a sala de onde a porta foi clicada) como
  chave — hoje só `salaA`, mas já pronto pra B/C/D quando existirem.
- **Encerramento real** — `encerrarExperiencia()` chama `controls.unlock()`
  (libera o ponteiro), zera o `outlinePass` e esconde o HUD; o overlay cobre
  a tela inteira, então não há como o clique voltar a alcançar o canvas por
  baixo. Não existe "voltar pro jogo" — mesmo comportamento terminal do 2D.
- **Rótulo "UNIDADE 04"** — a versão 2D rotula cada ficha por
  `TERMINAL A`/`TERMINAL B` (dois notebooks). Como a 3D abandonou esse
  conceito (só existe uma sessão por vez), troquei o rótulo do protocolo
  pra "UNIDADE 04", reaproveitando a frase que já existe na tela de
  entrada ("Levantamento predial — unidade 04"). É só uma constante de
  texto — fácil de renomear se não fizer sentido.

**Estado ao fim da sessão:**
- [x] Relatório (Ambiente A) funcional em 3D — loop completo agora existe:
  Cozinha → Corredor → Ambiente A → Relatório → Catalogação finalizada
- [x] Final apressado (loop sem clicar em nada) também encerra corretamente
- [ ] Não testado no navegador ainda (implementado sem servidor local
  disponível neste ambiente — three.js vem de CDN externo) — pendente de
  validação por Diogo antes de seguir
- [ ] Ambiente B em 3D
- [ ] Ambiente C em 3D
- [ ] Ambiente D em 3D

**Próxima sessão sugerida:** Diogo testa o relatório no navegador
(especialmente o `unlock()` do ponteiro e a transição do overlay). Se
aprovado, seguir para o Ambiente B — com a permissão dele, combinada nesta
sessão.

### 16/08/2026 — Sessão 20 (Ambientes B, C e D + integração completa)

As três rotas que ainda terminavam numa porta bloqueada foram implementadas
em Three.js, reutilizando integralmente os textos e a lógica de
`core/dados.js`.

- **Ambiente B — Doméstico** (`sala-b.js`, novo): sala de jantar própria,
  com mesa posta, toalha excessivamente esticada, cadeira virada de costas e
  copo invertido. Os quatro elementos são interativos e usam as falas já
  existentes. Inclui colisões da mesa/cadeira, iluminação quente concentrada,
  porta final e fonte de áudio espacial.
- **Ambiente C — Vazio** (`sala-c.js`, novo): cômodo frio com placas de piso
  discretamente desalinhadas, mancha vertical, partículas que materializam o
  alvo narrativo “Ar”, condensação no teto e área fria no chão. Mantém o
  corredor de navegação livre, iluminação fria, porta final e fonte sonora.
- **Ambiente D — Registro** (`sala-d.js`, novo): corredor de arquivo com
  estantes nas duas paredes, pastas e etiquetas sem correspondência, ficha em
  bandeja e selo sobre gaveta. Usa geometrias/materiais compartilhados dentro
  do módulo para evitar custo desnecessário. Inclui colisões, luzes de arquivo,
  porta final e fonte sonora.
- **Integração** (`main.js`): importados e registrados `salaB`, `salaC` e
  `salaD` em `SALAS_3D`. Todas as portas finais continuam apontando para o
  relatório já existente, que usa `sala.id` para selecionar o texto e o
  cluster corretos na catalogação.
- **Correção localizada no Corredor** (`main.js`): o clique em porta agora
  calcula o destino a partir do `ref` da porta efetivamente atingida pelo
  raycast. Antes, as duas portas do Corredor usavam sempre `sala.porta`, então
  a porta visual de retorno não respeitava seu `proxima: "cozinha"`.

**Validação realizada:**
- `node --check` em todos os arquivos JavaScript de `core`, terminal e 3D;
- `git diff --check` sem problemas de whitespace;
- servidor estático respondeu HTTP 200 para o HTML, motor, dados e os seis
  módulos de ambiente;
- verificação de todos os imports locais;
- simulação da decisão de rota confirmou corte → `salaA`, doméstico →
  `salaB`, vazio → `salaC` e registro → `salaD`;
- conferidos relatório e comportamento específicos para os quatro clusters;
- final apressado confirmado após a terceira visita ao Corredor sem cliques.

**Limitação restante:** não houve validação visual/WebGL nesta sessão porque o
ambiente disponível não possui binário de navegador instalado. O servidor
estático foi iniciado, mas a inspeção final de enquadramento, iluminação,
alcance dos quatro objetos e conforto de navegação em B/C/D deve ser feita no
navegador da apresentação.

### 16/08/2026 — Sessão 21 (Sala Final 3D + dossiê imersivo)

O encerramento principal deixou de trocar imediatamente o canvas por uma tela
2D opaca. As quatro rotas agora entram numa única Sala Final 3D e o relatório é
consultado fisicamente num dossiê sobre a mesa.

- **Sala Final** (`sala-final.js`, novo): ambiente institucional pequeno com
  mesa central, cadeira, armário/estante compacta, porta fechada, quadro de
  protocolo e iluminação envelhecida. O dossiê é o único objeto interativo e
  usa o raycast e o `OutlinePass` já existentes. A sala possui colisores,
  `spawn`, fonte de som e o mesmo contrato dos outros ambientes.
- **Dados** (`core/dados.js`): incluído apenas o descritor da `salaFinal` e do
  objeto `dossie`. Os relatórios e comportamentos existentes não foram
  reescritos.
- **Fluxo A/B/C/D** (`main.js`): ao receber o destino compartilhado
  `relatorio`, o motor guarda a sala de origem e transita para `salaFinal`.
  `dados.js` continua usando `relatorio` nas portas para preservar a versão
  terminal/2D; a transformação para Sala Final existe somente no motor 3D.
- **Dossiê de duas páginas** (`main.js` + `index.html`): Página 1 apresenta
  número do registro, cluster, quantidade de objetos analisados e o texto de
  `DATA.relatorios`; Página 2 mostra classificação, interpretação e observação
  final derivadas de `DATA.comportamentos`. Há controles diretos para próxima
  página, voltar, fechar o arquivo e encerrar o levantamento.
- **Pointer Lock/HUD**: abrir o dossiê limpa teclas pressionadas, remove o
  contorno, esconde o HUD, libera o mouse e mantém a capa inicial oculta para o
  cenário continuar visível. Fechar tenta retomar o Pointer Lock e reapresenta
  a capa como recuperação caso o navegador negue a retomada.
- **Encerramento**: o documento desaparece, o fundo faz fade para preto e usa
  as mensagens existentes “Catalogação finalizada” e “Registro encerrado”.
- **Fallback preservado**: `mostrarRelatorio`, `mostrarCatalogacaoFinal` e
  `encerrarExperiencia` continuam no código. O final apressado permanece usando
  esse caminho e não depende da Sala Final.
- **Iluminação**: Sala B recebeu pequeno aumento de ambiente, hemisférica,
  pendente e luz da porta. Sala C recebeu materiais mais legíveis, ambiente
  frio reforçado e um segundo preenchimento lateral, mantendo a paleta azulada.

**Validação realizada:**
- `node --check` em todos os JavaScripts de `core`, terminal e 3D;
- `git diff --check` e parsing do HTML sem erros;
- imports locais e registro de `salaFinal` conferidos;
- simulação de dados confirmou conteúdo distinto para A/corte, B/doméstico,
  C/vazio e D/registro;
- referências e listeners de próxima página, voltar, fechar e encerrar
  conferidos;
- preservação do final apressado confirmada;
- servidor estático respondeu HTTP 200 para HTML, motor, dados e módulos das
  salas alteradas.

**Limitação restante:** não foi realizado teste visual/WebGL ou de Pointer
Lock real porque o ambiente não possui navegador executável. Iluminação,
enquadramento do spawn, alcance do dossiê, colisões e legibilidade responsiva
das páginas ainda precisam de validação manual no navegador da apresentação.

### 16/08/2026 — Sessão 22 (polimento visual final)

- **Sala C:** materiais de piso e paredes ficaram moderadamente mais claros;
  luz ambiente/hemisférica e os três pontos existentes foram reajustados. O
  preenchimento lateral foi rebaixado para revelar melhor chão, limites e
  profundidade sem adicionar novas luzes ou sombras.
- **Sala Final:** paredes, piso e mobiliário receberam pequeno ganho de
  legibilidade. O contraste da luminária principal foi reduzido e uma única
  luz de preenchimento sem sombras revela o armário e o fundo, preservando o
  foco já existente sobre o dossiê.
- **Dossiê:** a folha passou a usar dimensões responsivas menores, mantendo
  rolagem e conteúdo intactos para mostrar mais do cenário 3D ao redor.

**Validação realizada:** sintaxe dos JavaScripts, imports locais, parsing do
HTML, `git diff --check`, referências estáticas e respostas do servidor local.

**Teste manual restante:** confirmar iluminação e navegação reais da Sala C,
composição da Sala Final e legibilidade das duas páginas nas resoluções usadas
na apresentação. Não houve teste visual/WebGL nesta sessão.

### 16/08/2026 — Sessão 23 (objetos da Cozinha + reações)

- **Polimento dos 16 objetos** (`modelos.js`): faca, tesoura, amolador,
  espeto, garfo, panela, tábua, toalha, gelo, prato, copo, mancha, caderno,
  etiqueta, relógio e câmera foram reconstruídos com silhuetas maiores,
  proporções revisadas, materiais coerentes e partes funcionais separadas.
  Permanecem procedurais e leves, sem modelos ou texturas externas.
- **Reações especiais** (`reacoes.js`, novo): módulo pequeno de animações e
  sons sintetizados para os 16 objetos. Reutiliza o clique existente e executa
  cada reação uma vez por instância da Cozinha. Alterações como trincas,
  expansão, abertura, queda e deslocamento permanecem visíveis na sala.
- **Integração** (`main.js` + `index.html`): o registro no `Estado` continua
  ocorrendo antes da reação. Foram adicionados apenas a atualização das
  animações e um overlay compartilhado para sangue discreto, frio e flash. As
  rotas, clusters, HUD, colisões, relatório e encerramento não foram alterados.

**Validação realizada:** `node --check` em todos os JavaScripts, cobertura dos
16 modelos e 16 reações, imports locais, parsing e IDs do HTML,
`git diff --check` e HTTP 200 para motor, modelos, reações, cozinha, dados e
estado no servidor estático.

**Teste manual restante:** avaliar reconhecimento/escala dos 16 objetos na luz
real da Cozinha, alcance do raycast, volume dos sons, intensidade dos efeitos
de tela e execução completa de cada reação. Não houve teste visual WebGL ou de
áudio real nesta sessão.

### 17/08/2026 — Sessão 24 (modo de apresentação/debug)

- **Ativação isolada** (`main.js`): `?apresentacao=1` instala o modo; sem esse
  valor exato, nenhum atalho, indicador ou objeto global adicional é criado.
- **Acesso rápido:** teclas `1`–`7` levam diretamente à Cozinha, Corredor,
  Ambientes A–D e Sala Final reutilizando `entrarEm()`. A troca limpa teclas e
  contorno, mas não altera Pointer Lock, HUD, raycast, rotas ou módulos de sala.
- **Sala Final segura:** a última sala de desfecho selecionada alimenta o
  dossiê; quando a Sala Final é aberta sem rota anterior, Ambiente A fornece um
  conteúdo válido e previsível apenas no modo de apresentação.
- **Reset:** `R` recarrega a mesma URL e zera o estado em memória da rodada,
  conforme o comportamento já definido por `core/estado.js`.
- **Interface e debug:** um indicador discreto com os atalhos é criado por
  JavaScript somente nesse modo. `window.__apresentacao.ir()` e
  `window.__apresentacao.resetar()` também só existem com o parâmetro ativo.
- **Documentação:** o uso e os atalhos foram registrados no `README.md`.

**Validação realizada:** `node --check` em todos os JavaScripts, resolução de
imports locais, parsing do HTML e `git diff --check`; servidor local respondeu
corretamente; no navegador, `1`–`7` abriram as sete salas esperadas, `R`
reiniciou na Cozinha preservando o parâmetro, e a URL normal ignorou `2`, não
mostrou indicador e não registrou erros de console durante esse fluxo.

**Teste manual restante:** confirmar no navegador da apresentação o Pointer
Lock real durante os saltos, teclado numérico, movimento WASD, raycast/HUD após
várias trocas e os fluxos completos de porta → Sala Final → dossiê e final
apressado. O navegador automatizado preservou o Pointer Lock no salto testado,
mas emitiu avisos internos inconsistentes da API do Chromium, então essa parte
não foi considerada validação manual definitiva.

### 17/08/2026 — Sessão 25 (Cozinha — memória doméstica e ausência)

A Cozinha foi ampliada e reorganizada sem alterar seu contrato com o motor,
os 16 objetos, clusters, reações ou Vestígios Narrativos. A direção deixou de
ser uma bancada contínua com mesa central e passou a sugerir uma casa cuja vida
cotidiana foi desaparecendo aos poucos.

- **Nova planta** (`cozinha.js`): o cômodo cresceu de 4,28 × 3,28 m para
  aproximadamente 5,4 × 4,2 m, preservando o pé-direito de 2,70 m. Porta e
  spawn continuam no setor oeste, com visão diagonal da ilha e um percurso
  inicial livre.
- **Parede principal interrompida:** pia e bancada de preparo são seguidas por
  um vão de fogão ausente, um segundo apoio e um módulo alto semelhante a
  geladeira/torre. O vazio possui diferença discreta de parede, marca no piso,
  pontos de instalação e a mancha interativa, sem texto que explique a remoção.
- **Ilha e lateral doméstica:** a ilha voltou a ter altura de bancada e recebeu
  prato, garfo, toalha e copo. Dois bancos ocupam um lado; uma marca de uso
  sugere um terceiro lugar ausente. A parede oeste ganhou estante aberta com
  poucas louças, espaços vazios e os objetos de registro/observação.
- **Sinais familiares:** uma folha sem texto legível presa ao módulo alto,
  dois nichos marcados apenas por poeira e o lugar ausente na ilha. Nenhum
  desses elementos é coletável ou explica a narrativa.
- **Redistribuição dos 16 objetos:** faca, tábua e tesoura ficam junto à pia;
  amolador, espeto e panela cercam o vão; a mancha ocupa o piso do fogão
  ausente; o gelo permanece isolado numa bancada lateral; quatro objetos
  domésticos ficam na ilha; caderno, etiqueta, relógio e câmera ocupam a
  estante, com a câmera voltada para o interior da sala.
- **Colisões mais fiéis:** cada trecho de bancada possui sua própria caixa,
  deixando o vão realmente livre. Ilha, módulo alto e estante usam a projeção
  de seus móveis, enquanto os bancos usam colisores cilíndricos pequenos. Não
  foi criada física nova nem alterado o resolvedor compartilhado.
- **Navegação:** uma simulação em grade de 5 cm com `resolverMovimento()`
  confirmou uma única região navegável, incluindo porta, vão do fogão, quatro
  lados da ilha, bancada fria e estante.

**Validação realizada:** `node --check` em todos os JavaScripts; imports locais,
HTML e `git diff --check`; cobertura dos 16 IDs em dados, posições, modelos,
reações e Vestígios; raycast real em Three.js para os 16 alvos; rotas A–D e
final apressado; carregamento WebGL normal; alternância repetida entre Cozinha,
Corredor, Ambientes A–D e Sala Final pelo modo apresentação; URL normal sem
atalhos extras; console sem erros ou avisos durante esses fluxos.

**Teste manual restante:** percorrer a planta com Pointer Lock real, confirmar
o conforto atrás dos bancos e junto ao vão, avaliar alcance/contorno dos 16
objetos durante movimento livre e calibrar visualmente a leitura da mancha,
dos nichos vazios e da estante nas resoluções usadas na apresentação. O
navegador automatizado não concedeu Pointer Lock nesta sessão.

### 17/08/2026 — Sessão 26 (Diário de Bordo na Sala Final)

A Sala Final recebeu uma descoberta documental opcional sem alterar o fluxo
principal do dossiê. O arquivo sobre a mesa continua registrando o visitante;
o novo Diário de Bordo, encontrado numa estante secundária, registra a história
de desenvolvimento de A Casa.

- **Estante e livro físico** (`sala-final.js`): a estante compacta do fundo
  esquerdo foi aberta visualmente e recebeu quatro volumes neutros e um Diário
  procedural com capa, páginas, lombada e título gerado por canvas. O livro fica
  levemente inclinado e avançado. O colisor existente permanece fiel ao volume
  completo do móvel e não invade o percurso até a mesa.
- **Indicação discreta:** o Diário participa do mesmo raycast e `OutlinePass`
  usados pelos outros interativos quando está sob a mira. Fora do hover, somente
  a capa recebe uma oscilação emissiva lenta e muito fraca, sem marcador,
  tooltip permanente ou contorno concorrente com o dossiê.
- **Leitor isolado** (`diario.js` + `index.html`): a leitura usa um overlay
  próprio em forma de livro aberto, com duas páginas lado a lado, quatro
  aberturas, controles de voltar/folhear/fechar e fechamento por `Escape`. O
  módulo instala os listeners uma única vez no carregamento e não depende de
  `Estado`, rotas, clusters ou Vestígios Narrativos.
- **Cronologia registrada:** abril começa pelo sistema de agendamento de salas
  e segue para o chatbot; maio introduz A Casa; junho registra o primeiro
  protótipo; julho apresenta O Museu como experimento paralelo já
  descontinuado; agosto reúne a evolução tridimensional, as rotas, a narrativa
  reativa, os Vestígios e a nova Cozinha. A última entrada mantém isolada a
  frase de 17/08/2026 sobre as ausências.
- **Integração com o motor** (`main.js`): o novo tipo `diario` pausa movimento,
  limpa HUD/contorno, libera Pointer Lock e tenta retomá-lo ao fechar, com a capa
  de entrada disponível como recuperação. O dossiê conserva seu overlay,
  conteúdo, estado e encerramento próprios. O modo apresentação continua
  chegando à Sala Final pela tecla `7`, sem novo atalho obrigatório.

**Validação realizada:** `node --check` em todos os JavaScripts; imports locais,
HTML, cronologia obrigatória e `git diff --check`; carregamento WebGL da Sala
Final; estante e livro renderizados; raycast atingindo o grupo `diario`; quatro
aberturas, navegação anterior/próxima, botão fechar e `Escape`; dossiê aberto
antes e depois do Diário; snapshot de estado idêntico antes/depois da leitura;
trocas repetidas entre as sete salas pelo modo apresentação; URL normal sem
atalhos/indicador e console limpo nesses fluxos. O harness temporário usado para
os testes foi removido.

**Validação manual restante:** conferir no navegador da apresentação o alcance
do hover em movimento livre, a calibração final do brilho e da tipografia nas
resoluções reais, a colisão ao se aproximar da estante e a sequência completa
de liberar/retomar Pointer Lock. O navegador automatizado não concedeu Pointer
Lock real; a capa de recuperação foi mantida para esse caso.

### 17/08/2026 — Sessão 27 (reforma geral dos ambientes 3D)

Corredor, Ambientes A–D e Sala Final receberam uma segunda geração de
arquitetura, iluminação, objetos e narrativa ambiental. A Cozinha permaneceu
intacta e serviu como referência de acabamento, não como modelo de layout. Os
contratos das salas, IDs, rotas, clusters, Vestígios, reações e fluxos de
encerramento foram preservados.

- **Corredor** (`corredor.js`): o traçado baixo, estreito e levemente torto foi
  mantido. Pórticos técnicos, painéis de manutenção, placas sem legenda útil e
  um trilho contínuo no teto passaram a medir o percurso e concentrar a imagem
  memorável na quebra. A iluminação fria ganhou profundidade sem adicionar
  outra sombra. O spawn agora olha para o trajeto; a parede diagonal foi
  aproximada por pequenos colisores para não fechar artificialmente a curva.
- **Ambiente A** (`sala-a.js`): o antigo corredor de metal virou uma baia de
  processamento interrompido, com painéis removíveis, trilho superior, bancada
  de calibração, batentes, canal de coleta e iluminação de inspeção. A placa
  recebeu suporte funcional; a ferramenta ganhou lâmina, guarda e espigão sem
  cabo; a trilha foi integrada ao canal. Apenas uma luz mantém sombras.
- **Ambiente B** (`sala-b.js`): a sala de jantar passou a parecer uma memória
  doméstica reconstruída. Mesa com estrutura completa, tecido levemente
  deformado, pratos em camadas, talheres reconhecíveis, cadeira com encosto
  vazado e copo com base substituem os volumes simples. Molduras excessivamente
  regulares e um aparador com nicho vazio reforçam a dúvida entre casa e
  montagem. O spawn e a luz pendente enquadram a mesa sem copiar a Cozinha.
- **Ambiente C** (`sala-c.js`): a composição permaneceu minimalista. Uma
  silhueta alta removida da parede, quatro fixações, juntas interrompidas, um
  volume sugerido apenas por poeira, marca de piso e moldura vazia no teto
  concentram a ausência em poucos elementos. Luz direcional e materiais frios
  revelam superfícies sem preencher o cômodo com props.
- **Ambiente D** (`sala-d.js`): as duas estantes genéricas foram diferenciadas
  em módulos fechados de arquivo e estrutura aberta de consulta. Gavetas,
  etiquetas, pastas, mesa inclinada de catalogação, ficha presa, gaveteiro,
  carimbo com empunhadura e câmera de observação criam um arquivo institucional
  que prepara a Sala Final. A circulação central continua livre.
- **Sala Final** (`sala-final.js`): recebeu apenas alinhamento visual: rodapés,
  grelha de teto, estrutura completa da mesa, cadeira vazada, gavetas e
  puxadores no armário. Dossiê, Diário físico, leitor, posições narrativas e
  encerramento não foram alterados.
- **Vestígios Narrativos:** todas as condições existentes e as quatro
  combinações raras continuam nas mesmas salas. Os efeitos foram mantidos nos
  grupos interativos remodelados; não houve alteração de taxonomia ou estado.
- **Colisões e circulação:** o mobiliário novo de A, B e D possui projeções
  próprias. Uma simulação em grade confirmou spawn livre, região navegável e
  alcance de todos os interativos nas seis salas. A curva do Corredor recebeu
  colisores segmentados locais sem mudar `colisao.js`.
- **Performance:** geometrias continuam procedurais, materiais são
  compartilhados dentro de cada sala e apenas uma luz por ambiente gera mapa
  de sombra. Não foram adicionados assets externos nem sistemas persistentes.

**Validação realizada:** `node --check` nos módulos alterados e nos módulos
centrais relacionados; `git diff --check`; carregamento WebGL individual das
seis salas com e sem Vestígios; presença e alcance de todos os IDs interativos;
spawns e regiões navegáveis; combinações raras A–D; URLs normal e
`?apresentacao=1`; atalhos `2`–`7`; 24 trocas repetidas de ambiente com descarte
central ativo; console limpo em todos esses fluxos. O harness temporário de
render, colisão e alcance foi removido ao final. `main.js`, `dados.js`, estado,
reação, Diário e Cozinha não receberam alterações, preservando rotas, final
apressado e as integrações existentes.

**Validação manual restante:** percorrer todas as salas com Pointer Lock real,
confirmar colisão por contato nos cantos e móveis, alcance/hover em movimento,
volume e direção do som espacial, leitura das luzes nas resoluções da
apresentação e os fluxos completos de porta, final apressado, dossiê e Diário.
O navegador automatizado não concedeu Pointer Lock, por isso áudio posicional
e sensação de circulação ainda dependem dessa passagem manual.

### 19/08/2026 — Sessão 28 (memória, reconstrução e observabilidade)

A última evolução sistêmica antes da apresentação foi integrada sem substituir
os fluxos existentes. O estado continua volátil e as salas continuam módulos
independentes; a nova camada apenas registra e interpreta fatos semânticos da
sessão.

- **Log de sessão** (`core/estado.js`): entradas, primeiras e repetidas
  interações, tempo relativo, objeto, Vestígios produzidos, transições, rota e
  manifestações ambientais passam a compor uma linha do tempo clonável. Não
  há captura de frames, câmera ou mouse, nem `localStorage`. A interface 2D
  também registra rotas e transições sem mudar sua apresentação.
- **Memória ambiental ampliada:** Corredor e Ambientes A–D ganharam novas
  variações de alinhamento, luz, posição, condensação, marcas, fichas e som,
  sempre derivadas dos Vestígios reais. Cada sala declara chaves internas das
  manifestações aplicadas para o log e para observabilidade, sem expô-las ao
  visitante.
- **Sala Final convergente** (`sala-final.js`): rota, vestígio predominante,
  densidade das interações e combinações incomuns alteram barra de inspeção,
  temperatura da luz, documento, quadro, mobiliário e detalhes discretos antes
  da consulta do dossiê.
- **Reconstrução** (`reconstrucao.js`): um dispositivo físico na Sala Final
  recupera o levantamento como mapa abstrato tridimensional. Nós, pulsos,
  cores e marcadores são gerados deterministicamente a partir do event log até
  a primeira chegada à Sala Final; interações repetidas aparecem como pulsos
  menores, enquanto movimento contínuo e o desvio Dino não entram na
  reconstrução. O dossiê permanece independente.
- **Combinações incomuns:** as quatro combinações de rota existentes foram
  preservadas. `mesaObservada`, `protocoloFrio` e `ordemInterrompida` acrescentam
  detalhes na Sala Final e uma assinatura na reconstrução sem anúncio,
  porcentagem ou conquista.
- **Modo técnico** (`modo-tecnico.js`): somente em `?apresentacao=1`, `T`
  abre/fecha uma ferramenta interna com o fluxo interação → estado → Vestígios
  → decisão/cluster → rota → mundo → dossiê/reconstrução e dados reais da
  sessão. O painel pausa a navegação e tenta retomar Pointer Lock ao fechar.
- **Dino Tech:** uma miniatura discreta na estante da Sala Final aciona uma
  reação curta e o deslocamento suave do móvel. O colisor acompanha a animação;
  somente quando o acesso está livre a porta secreta entra no raycast.
- **Sala Dino** (`sala-dino.js`): ambiente bônus independente, com vegetação
  procedural, névoa, iluminação viva, identidade Dino Tech, aviso institucional
  e porta segura de retorno. Não altera a rota nem o dossiê.
- **Apresentação:** `8` abre a Sala Dino para QA, `L` inicia a reconstrução e
  `T` alterna o modo técnico. Atalhos `1`–`7` e `R` foram preservados; no modo
  normal nenhuma ferramenta nova é criada.

**Validação realizada:** checkout local confirmado no mesmo commit da `main`
remota antes das mudanças; sintaxe ES de todos os JavaScripts; imports locais;
`git diff --check`; testes determinísticos do log, snapshots e combinações;
carregamento WebGL; passagem pelos oito ambientes; Sala Final, reconstrução,
Sala Dino e modo técnico renderizados; URL normal sem indicador, atalhos ou
painel técnico. Nenhum commit ou push foi criado.

**Validação manual restante:** Pointer Lock e áudio espacial em navegador real;
alcance do dinossauro, do dispositivo e da porta revelada em movimento livre;
colisão durante toda a abertura da estante; leitura das novas luzes nas telas
da apresentação; sequência narrativa completa com diferentes ordens reais de
interação; dossiê, Diário, final apressado e retorno da Sala Dino após uma
sessão completa.
