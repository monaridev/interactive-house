// Colisão do jogador contra a geometria da sala.
//
// O que existia antes: um clamp da posição da câmera dentro do retângulo
// da sala. Isso resolvia "não atravessar a parede" e ignorava todo o
// resto — dava pra andar por dentro da bancada, da ilha e da estante,
// o que arruína a escala. A sala inteira parecia vazia porque nada opunha
// resistência.
//
// Por que não engine de física (Rapier, Cannon): o jogador não pula, não
// cai, não empurra nada. Não existe gravidade nem corpo dinâmico. O
// problema real é 2D — um círculo deslizando entre retângulos vistos de
// cima. Trazer um solver de física pra isso seria exatamente o que
// ENGINE.md proíbe: tecnologia que não reforça a ilusão.
//
// Modelo: o jogador é um CÍRCULO no plano XZ (raio ~ ombro). Os obstáculos
// são retângulos alinhados aos eixos ou círculos. A resolução é feita
// eixo por eixo, o que produz "deslizar pela parede" de graça: se o
// movimento em X for bloqueado, o de Z ainda acontece.

export const RAIO_JOGADOR = 0.28 // metros — meia largura de ombros

// ---------- construtores de obstáculo ----------

// Retângulo definido pelo centro e pelas metades — o formato natural pra
// quem já criou um THREE.BoxGeometry.
export function caixa(x, z, larguraX, larguraZ) {
  return {
    tipo: "caixa",
    minX: x - larguraX / 2,
    maxX: x + larguraX / 2,
    minZ: z - larguraZ / 2,
    maxZ: z + larguraZ / 2,
  }
}

// Retângulo definido por dois pontos e uma espessura — o formato natural
// pra segmentos de bancada, que nascem de uma polilinha. Só funciona pra
// segmentos alinhados aos eixos; o CAMINHO_BANCADA é todo em L, então
// serve. Um segmento diagonal cairia aqui como a caixa que o envolve,
// o que é conservador (bloqueia um pouco mais do que deveria) e nunca
// permissivo (nunca deixa atravessar).
export function segmento(a, b, espessura) {
  const folga = espessura / 2
  return {
    tipo: "caixa",
    minX: Math.min(a.x, b.x) - folga,
    maxX: Math.max(a.x, b.x) + folga,
    minZ: Math.min(a.z, b.z) - folga,
    maxZ: Math.max(a.z, b.z) + folga,
  }
}

export function cilindro(x, z, raio) {
  return { tipo: "cilindro", x, z, raio }
}

// ---------- resolução ----------

function dentroDaCaixa(o, x, z, raio) {
  return x > o.minX - raio && x < o.maxX + raio && z > o.minZ - raio && z < o.maxZ + raio
}

function dentroDoCilindro(o, x, z, raio) {
  const dx = x - o.x
  const dz = z - o.z
  const alcance = o.raio + raio
  return dx * dx + dz * dz < alcance * alcance
}

function colide(o, x, z, raio) {
  return o.tipo === "cilindro" ? dentroDoCilindro(o, x, z, raio) : dentroDaCaixa(o, x, z, raio)
}

/**
 * Aplica um deslocamento respeitando os obstáculos.
 *
 * Testa X e Z separadamente e só aceita cada eixo se ele não terminar
 * dentro de nada. É por isso que o jogador desliza ao raspar num móvel
 * em diagonal em vez de travar — o eixo livre continua valendo.
 *
 * @param {{x:number,z:number}} atual posição atual no plano
 * @param {{x:number,z:number}} passo deslocamento desejado
 * @param {Array} obstaculos lista construída por caixa/segmento/cilindro
 * @param {number} raio raio do jogador
 * @returns {{x:number,z:number}} posição já resolvida
 */
export function resolverMovimento(atual, passo, obstaculos, raio = RAIO_JOGADOR) {
  let x = atual.x
  let z = atual.z

  const tentativaX = x + passo.x
  const xLivre = !obstaculos.some((o) => colide(o, tentativaX, z, raio))
  if (xLivre) x = tentativaX

  const tentativaZ = z + passo.z
  const zLivre = !obstaculos.some((o) => colide(o, x, tentativaZ, raio))
  if (zLivre) z = tentativaZ

  // Se os dois eixos travaram separadamente — mas o ponto diagonal (os
  // dois deslocamentos juntos, a partir da posição ORIGINAL) está
  // livre — o jogador ficaria parado numa quina mesmo tendo pra onde
  // ir. Testar X e depois Z em sequência é sensível à ORDEM perto de
  // cantos apertados (a quina do balcão em L é o caso real). Isso só
  // entra em ação nesse caso raro; não muda nada do deslizar normal.
  if (!xLivre && !zLivre) {
    const diagX = atual.x + passo.x
    const diagZ = atual.z + passo.z
    if (!obstaculos.some((o) => colide(o, diagX, diagZ, raio))) {
      x = diagX
      z = diagZ
    }
  }

  return { x, z }
}

/**
 * Empurra o jogador pra fora, caso ele já tenha começado dentro de algo.
 *
 * Isso não deveria acontecer em jogo normal, mas acontece o tempo todo
 * durante o AJUSTE de layout: mover a bancada 20cm faz o ponto de spawn
 * cair dentro dela, e sem isso o jogador nasce preso, sem nenhuma pista
 * do motivo. Chamar uma vez no início do carregamento resolve.
 */
export function desencaixar(pos, obstaculos, raio = RAIO_JOGADOR) {
  let { x, z } = pos
  for (const o of obstaculos) {
    if (!colide(o, x, z, raio)) continue

    if (o.tipo === "cilindro") {
      const dx = x - o.x
      const dz = z - o.z
      const dist = Math.hypot(dx, dz) || 0.001
      const alvo = o.raio + raio + 0.01
      x = o.x + (dx / dist) * alvo
      z = o.z + (dz / dist) * alvo
      continue
    }

    // caixa: sai pela face mais próxima
    const saidas = [
      { eixo: "x", valor: o.minX - raio - 0.01, custo: Math.abs(x - (o.minX - raio)) },
      { eixo: "x", valor: o.maxX + raio + 0.01, custo: Math.abs(x - (o.maxX + raio)) },
      { eixo: "z", valor: o.minZ - raio - 0.01, custo: Math.abs(z - (o.minZ - raio)) },
      { eixo: "z", valor: o.maxZ + raio + 0.01, custo: Math.abs(z - (o.maxZ + raio)) },
    ].sort((a, b) => a.custo - b.custo)

    if (saidas[0].eixo === "x") x = saidas[0].valor
    else z = saidas[0].valor
  }
  return { x, z }
}
