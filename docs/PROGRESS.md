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


