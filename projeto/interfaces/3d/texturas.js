// Texturas procedurais, desenhadas em <canvas> em tempo de carregamento.
//
// Por que procedural em vez de baixar arquivos de imagem:
// o projeto inteiro roda sem bundler e sem pipeline de build (ver ENGINE.md
// e a decisão da Sessão 11 no PROGRESS). Adicionar uma pasta de /texturas
// significaria adicionar assets binários ao repositório, resolver caminhos
// relativos, tratar carregamento assíncrono e lidar com CORS. Tudo isso
// só pra conseguir "concreto sujo" e "azulejo velho", que são padrões
// simples o bastante pra desenhar à mão.
//
// Efeito colateral bom: as texturas são determinísticas (PRNG com seed
// fixa), então a Cozinha é sempre exatamente a mesma. Isso importa —
// WORLD_DESIGN.md diz que quando algo muda, é porque o sistema mudou,
// nunca porque o renderizador sorteou diferente.

import * as THREE from "three"

// PRNG com seed (mulberry32). Math.random() não serve: a mesma parede
// nasceria diferente a cada F5.
function prng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function novaTela(tamanho) {
  const c = document.createElement("canvas")
  c.width = tamanho
  c.height = tamanho
  return { c, ctx: c.getContext("2d") }
}

// Grão fino por cima de tudo. Sem isso, MeshStandardMaterial com cor
// lisa lê como plástico, não como superfície envelhecida.
function grao(ctx, tamanho, intensidade, seed) {
  const rnd = prng(seed)
  const img = ctx.getImageData(0, 0, tamanho, tamanho)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    const v = (rnd() - 0.5) * intensidade
    d[i] = Math.max(0, Math.min(255, d[i] + v))
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + v))
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + v))
  }
  ctx.putImageData(img, 0, 0)
}

// Manchas irregulares — o que separa "parede pintada" de "parede que
// está ali há tempo suficiente pra ninguém saber quando foi pintada".
function manchas(ctx, tamanho, quantidade, cor, alphaMax, seed) {
  const rnd = prng(seed)
  for (let i = 0; i < quantidade; i++) {
    const x = rnd() * tamanho
    const y = rnd() * tamanho
    const r = (0.04 + rnd() * 0.16) * tamanho
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, `rgba(${cor}, ${(0.3 + rnd() * 0.7) * alphaMax})`)
    g.addColorStop(1, `rgba(${cor}, 0)`)
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function finalizar(c, repeatX = 1, repeatY = 1) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = THREE.RepeatWrapping
  t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeatX, repeatY)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

// Cache: a mesma tela pode servir várias superfícies. Clonamos a textura
// (barato, compartilha o bitmap) só pra poder dar repeat diferente.
const telas = new Map()
function tela(chave, desenhar) {
  if (!telas.has(chave)) telas.set(chave, desenhar())
  return telas.get(chave)
}

// ---------- parede: reboco pintado, envelhecido ----------
function telaParede() {
  const { c, ctx } = novaTela(512)
  ctx.fillStyle = "#332f28"
  ctx.fillRect(0, 0, 512, 512)
  manchas(ctx, 512, 40, "24,20,16", 0.5, 7)
  manchas(ctx, 512, 14, "70,64,54", 0.28, 19)
  // escorridos verticais leves, como umidade antiga
  const rnd = prng(31)
  for (let i = 0; i < 26; i++) {
    const x = rnd() * 512
    ctx.fillStyle = `rgba(20,17,14,${0.05 + rnd() * 0.12})`
    ctx.fillRect(x, rnd() * 200, 1 + rnd() * 3, 200 + rnd() * 300)
  }
  grao(ctx, 512, 26, 101)
  return c
}

// ---------- azulejo: parede atrás da bancada ----------
function telaAzulejo() {
  const { c, ctx } = novaTela(512)
  const N = 4
  const lado = 512 / N
  const rejunte = 7
  ctx.fillStyle = "#17150f" // rejunte escurecido
  ctx.fillRect(0, 0, 512, 512)
  const rnd = prng(53)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      // cada azulejo com tom levemente próprio — lote antigo, sem uniformidade
      const desvio = Math.floor(rnd() * 16) - 8
      const base = 92 + desvio
      ctx.fillStyle = `rgb(${base},${base - 4},${base - 14})`
      ctx.fillRect(x * lado + rejunte / 2, y * lado + rejunte / 2, lado - rejunte, lado - rejunte)
      // brilho de esmalte no topo do azulejo
      const g = ctx.createLinearGradient(0, y * lado, 0, y * lado + lado)
      g.addColorStop(0, "rgba(255,250,235,0.09)")
      g.addColorStop(0.5, "rgba(255,250,235,0)")
      ctx.fillStyle = g
      ctx.fillRect(x * lado + rejunte / 2, y * lado + rejunte / 2, lado - rejunte, lado - rejunte)
    }
  }
  manchas(ctx, 512, 18, "30,26,20", 0.3, 71)
  grao(ctx, 512, 14, 211)
  return c
}

// ---------- piso: cerâmica grande, encardida ----------
function telaPiso() {
  const { c, ctx } = novaTela(512)
  ctx.fillStyle = "#141210"
  ctx.fillRect(0, 0, 512, 512)
  const N = 2
  const lado = 512 / N
  const rejunte = 9
  const rnd = prng(97)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const desvio = Math.floor(rnd() * 10) - 5
      const base = 52 + desvio
      ctx.fillStyle = `rgb(${base},${base - 2},${base - 7})`
      ctx.fillRect(x * lado + rejunte / 2, y * lado + rejunte / 2, lado - rejunte, lado - rejunte)
    }
  }
  // pontinhos tipo granilite
  for (let i = 0; i < 2600; i++) {
    const v = 30 + Math.floor(rnd() * 90)
    ctx.fillStyle = `rgba(${v},${v - 4},${v - 10},0.5)`
    ctx.fillRect(rnd() * 512, rnd() * 512, 1.6, 1.6)
  }
  manchas(ctx, 512, 22, "10,9,8", 0.45, 131)
  grao(ctx, 512, 16, 307)
  return c
}

// ---------- pedra do tampo: granito claro, polido ----------
// O tampo era uma cor lisa quase preta (0x26241f). Resultado: os 10
// objetos da bancada ficavam pretos sobre preto — na inspeção, a faca e a
// tesoura simplesmente não existiam. Um granito claro é o que uma cozinha
// real tem e, de quebra, é o fundo contra o qual uma lâmina fina lê.
function telaPedra() {
  const { c, ctx } = novaTela(512)
  // Cinza neutro, levemente frio. Já foi #6d685e (quente) e sob a luz
  // âmbar do pendente o tampo lia como madeira ou cortiça, não pedra —
  // a luz da sala é morna, então a pedra tem que ser fria pra compensar.
  ctx.fillStyle = "#63646a"
  ctx.fillRect(0, 0, 512, 512)
  const rnd = prng(1301)
  // grãos de quartzo/feldspato/mica: três tamanhos, três tons
  const graos = [
    { n: 1800, r: 3.2, cor: [128, 130, 138], a: 0.5 },
    { n: 1100, r: 2.1, cor: [36, 37, 41], a: 0.55 },
    { n: 420, r: 4.6, cor: [172, 174, 180], a: 0.32 },
  ]
  for (const gr of graos) {
    for (let i = 0; i < gr.n; i++) {
      ctx.fillStyle = `rgba(${gr.cor[0]},${gr.cor[1]},${gr.cor[2]},${gr.a * (0.4 + rnd() * 0.6)})`
      ctx.beginPath()
      ctx.ellipse(
        rnd() * 512,
        rnd() * 512,
        gr.r * (0.5 + rnd()),
        gr.r * (0.5 + rnd()),
        rnd() * Math.PI,
        0,
        Math.PI * 2,
      )
      ctx.fill()
    }
  }
  manchas(ctx, 512, 10, "50,46,40", 0.22, 1307)
  grao(ctx, 512, 12, 1311)
  return c
}

// ---------- madeira ----------
function telaMadeira(claro) {
  const { c, ctx } = novaTela(512)
  const base = claro ? [104, 82, 56] : [58, 44, 31]
  ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`
  ctx.fillRect(0, 0, 512, 512)
  const rnd = prng(claro ? 401 : 409)
  // veio: linhas horizontais onduladas de espessura variável
  for (let i = 0; i < 130; i++) {
    const y0 = rnd() * 512
    const amp = 2 + rnd() * 9
    const esc = 0.1 + rnd() * 0.35
    ctx.strokeStyle = `rgba(${base[0] * 0.45},${base[1] * 0.42},${base[2] * 0.38},${esc})`
    ctx.lineWidth = 0.6 + rnd() * 2.6
    ctx.beginPath()
    for (let x = 0; x <= 512; x += 8) {
      const y = y0 + Math.sin((x / 512) * Math.PI * (1 + rnd() * 0.02) * 4 + i) * amp
      x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  grao(ctx, 512, 18, claro ? 503 : 509)
  return c
}

// ---------- metal escovado ----------
function telaMetal() {
  const { c, ctx } = novaTela(256)
  ctx.fillStyle = "#8b8d90"
  ctx.fillRect(0, 0, 256, 256)
  const rnd = prng(601)
  for (let i = 0; i < 1500; i++) {
    const y = rnd() * 256
    const v = rnd() > 0.5 ? 255 : 0
    ctx.strokeStyle = `rgba(${v},${v},${v},${0.02 + rnd() * 0.07})`
    ctx.lineWidth = 0.6
    ctx.beginPath()
    ctx.moveTo(rnd() * 256 - 60, y)
    ctx.lineTo(rnd() * 256 + 60, y + (rnd() - 0.5) * 1.2)
    ctx.stroke()
  }
  grao(ctx, 256, 10, 701)
  return c
}

// ---------- papel ----------
function telaPapel() {
  const { c, ctx } = novaTela(256)
  ctx.fillStyle = "#cfc7b2"
  ctx.fillRect(0, 0, 256, 256)
  manchas(ctx, 256, 12, "150,132,96", 0.3, 811) // amarelado de idade
  grao(ctx, 256, 20, 821)
  return c
}

// ---------- tecido ----------
function telaTecido() {
  const { c, ctx } = novaTela(256)
  ctx.fillStyle = "#8d8674"
  ctx.fillRect(0, 0, 256, 256)
  // trama: cruzado fino
  for (let i = 0; i < 256; i += 3) {
    ctx.fillStyle = "rgba(0,0,0,0.10)"
    ctx.fillRect(i, 0, 1.4, 256)
    ctx.fillRect(0, i, 256, 1.4)
  }
  manchas(ctx, 256, 8, "60,56,46", 0.22, 907)
  grao(ctx, 256, 14, 911)
  return c
}

// ---------- API ----------
// Cada função devolve uma textura nova (clone) — o chamador ajusta repeat
// sem afetar as outras superfícies que usam o mesmo desenho.
export const TEX = {
  parede: (rx = 1, ry = 1) => finalizar(tela("parede", telaParede), rx, ry),
  azulejo: (rx = 1, ry = 1) => finalizar(tela("azulejo", telaAzulejo), rx, ry),
  piso: (rx = 1, ry = 1) => finalizar(tela("piso", telaPiso), rx, ry),
  pedra: (rx = 1, ry = 1) => finalizar(tela("pedra", telaPedra), rx, ry),
  madeiraClara: (rx = 1, ry = 1) => finalizar(tela("madClara", () => telaMadeira(true)), rx, ry),
  madeiraEscura: (rx = 1, ry = 1) => finalizar(tela("madEscura", () => telaMadeira(false)), rx, ry),
  metal: (rx = 1, ry = 1) => finalizar(tela("metal", telaMetal), rx, ry),
  papel: (rx = 1, ry = 1) => finalizar(tela("papel", telaPapel), rx, ry),
  tecido: (rx = 1, ry = 1) => finalizar(tela("tecido", telaTecido), rx, ry),
}
