// O Corredor: espaço de transição entre a Cozinha e ela mesma. No 2D é
// o loop cozinha -> corredor -> cozinha, e é onde mora o "final
// apressado" (quem só vai de porta em porta sem clicar em nada). Não
// tem os 16 objetos da Cozinha — window.DATA.salas.corredor só define
// a porta de saída — então a decisão aqui é só arquitetura e atmosfera,
// não posicionamento de conteúdo.
//
// Mesma assinatura de construirCozinha: construirCorredor(scene, ctx)
// devolve { obstaculos, interativos, spawn, ... }. main.js troca de
// sala chamando essa função de novo sem saber o que tem dentro dela.

import * as THREE from "three"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"
import { caixa, segmento } from "./colisao.js"

// ---------- dimensões ----------
// Bem mais estreito e mais baixo que a Cozinha (2,70m) — de propósito:
// a Cozinha é pra olhar em volta, o Corredor é pra passar por ele. O
// teto baixo (2,35m) aperta sem precisar dizer que aperta.
const LARGURA = 1.15
const PE_DIREITO = 2.35
const ESPESSURA_PAREDE = 0.12
const LARGURA_PORTA = 0.9
const ALTURA_PORTA = 2.0

// ---------- traçado: levemente torto ----------
// Dois trechos retos com uma quebra pequena no meio, em vez de reto
// (sem nada de especial) ou de esquina de 90° (fácil de memorizar e
// apontar exatamente onde vira). ~14° é o meio-termo: dá pra sentir
// que o corredor não é uma linha reta, mas não dá pra fixar UM ponto
// como "a curva" — o efeito é justamente não conseguir confirmar se é
// sempre o mesmo traçado.
const ANGULO_QUEBRA = -0.24 // rad, ~14°, sempre pro mesmo lado (oeste)
const COMPRIMENTO_1 = 2.6 // da porta da Cozinha até a quebra
const COMPRIMENTO_2 = 2.2 // da quebra até a porta de saída

const P0 = { x: 0, z: 0 } // entrada — onde a porta da Cozinha fica atrás do jogador
const ANGULO_1 = 0 // primeiro trecho segue reto em +Z
const DIR_1 = { x: Math.sin(ANGULO_1), z: Math.cos(ANGULO_1) }
const P1 = { x: P0.x + DIR_1.x * COMPRIMENTO_1, z: P0.z + DIR_1.z * COMPRIMENTO_1 } // a quebra
const ANGULO_2 = ANGULO_1 + ANGULO_QUEBRA
const DIR_2 = { x: Math.sin(ANGULO_2), z: Math.cos(ANGULO_2) }
const P2 = { x: P1.x + DIR_2.x * COMPRIMENTO_2, z: P1.z + DIR_2.z * COMPRIMENTO_2 } // a porta de saída

// Overlap pequeno nas juntas: sem isso, dois trechos com ângulos
// diferentes deixam uma fresta visível bem no ponto da quebra.
const SOBREPOR = 0.1

// hash determinístico simples (não é PRNG de sequência, é "mesma
// entrada -> mesma saída"). Sem seed fixa por sessão de propósito: a
// entrada é o número de visitas, então o mesmo visita=2 sempre produz
// o mesmo jitter, mas visita=2 e visita=3 produzem jitters diferentes.
function hash(seed) {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return s - Math.floor(s) // 0..1
}
function jitter(seed, amplitude) {
  return (hash(seed) - 0.5) * 2 * amplitude
}

export function construirCorredor(scene, ctx = {}) {
  const visita = ctx.visita || 0 // quantas vezes o corredor já foi visitado ANTES desta
  const obstaculos = []
  const interativos = []

  const salaData = window.DATA.salas.corredor
  const porta = salaData.objetos.find((o) => o.ehSaida)

  // ---------- materiais ----------
  // Metal, não madeira/pedra da Cozinha — o Corredor não pertence ao
  // mesmo léxico construtivo dela. É passagem institucional, não cômodo.
  const matParede = new THREE.MeshStandardMaterial({ map: TEX.metal(1, 1.6), roughness: 0.55, metalness: 0.55 })
  const matPiso = new THREE.MeshStandardMaterial({ map: TEX.piso(1, 3), roughness: 0.8, metalness: 0.05 })
  const matTeto = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 1 })
  const matMarco = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7, metalness: 0.4 })

  // ---------- um trecho reto (chão, teto, duas paredes) ----------
  function trecho(a, b) {
    const comprimento = Math.hypot(b.x - a.x, b.z - a.z)
    const angulo = Math.atan2(b.x - a.x, b.z - a.z)
    const cxm = (a.x + b.x) / 2
    const czm = (a.z + b.z) / 2
    const compEstendido = comprimento + SOBREPOR * 2

    const piso = new THREE.Mesh(new THREE.BoxGeometry(LARGURA, 0.04, compEstendido), matPiso)
    piso.position.set(cxm, -0.02, czm)
    piso.rotation.y = angulo
    piso.receiveShadow = true
    scene.add(piso)

    const teto = new THREE.Mesh(new THREE.BoxGeometry(LARGURA, 0.04, compEstendido), matTeto)
    teto.position.set(cxm, PE_DIREITO + 0.02, czm)
    teto.rotation.y = angulo
    scene.add(teto)

    // normal: perpendicular ao trecho, aponta pra "direita" de quem
    // caminha de a pra b — mesma convenção usada em cozinha.js
    const normal = { x: Math.cos(angulo), z: -Math.sin(angulo) }
    for (const sinal of [-1, 1]) {
      const parede = new THREE.Mesh(new THREE.BoxGeometry(ESPESSURA_PAREDE, PE_DIREITO, compEstendido), matParede)
      parede.position.set(
        cxm + normal.x * sinal * (LARGURA / 2),
        PE_DIREITO / 2,
        czm + normal.z * sinal * (LARGURA / 2),
      )
      parede.rotation.y = angulo
      parede.receiveShadow = true
      scene.add(parede)
      const wa = { x: a.x + normal.x * sinal * (LARGURA / 2), z: a.z + normal.z * sinal * (LARGURA / 2) }
      const wb = { x: b.x + normal.x * sinal * (LARGURA / 2), z: b.z + normal.z * sinal * (LARGURA / 2) }
      obstaculos.push(segmento(wa, wb, ESPESSURA_PAREDE))
    }
  }

  trecho(P0, P1)
  trecho(P1, P2)

  // AABB do vão da porta, mesmo com o trecho torto. `caixa`/`segmento`
  // em colisao.js só sabem desenhar retângulo alinhado aos eixos — pra
  // um vão num trecho em ângulo, a caixa de colisão é a ENVOLTÓRIA do
  // retângulo real girado, não o retângulo em si. É por isso que não
  // dá pra só testar "dir.x existe" como no trecho reto: essa conta só
  // funciona quando o ângulo é 0 ou 90°, e a quebra do Corredor não é
  // nenhum dos dois. Conservador (bloqueia um pouco mais do que a
  // porta em si), nunca permissivo — mesma regra do resto do arquivo.
  function bloqueioVao(ponto, angulo) {
    const dir = { x: Math.sin(angulo), z: Math.cos(angulo) }
    const perp = { x: Math.cos(angulo), z: -Math.sin(angulo) }
    const meiaLargura = LARGURA_PORTA / 2
    const meiaProfundidade = 0.28 // cobre o vão + a folha entreaberta
    const meioX = Math.abs(perp.x) * meiaLargura + Math.abs(dir.x) * meiaProfundidade
    const meioZ = Math.abs(perp.z) * meiaLargura + Math.abs(dir.z) * meiaProfundidade
    return caixa(ponto.x, ponto.z, meioX * 2, meioZ * 2)
  }

  // ---------- tampa de ponta, com vão de porta ----------
  // Mesmo padrão da parede norte da Cozinha: dois segmentos + verga,
  // com o vão sempre bloqueado pra caminhar (a travessia é por clique
  // na porta, nunca andando através dela — mesma regra da Cozinha).
  function tampaComVao(ponto, angulo) {
    const perp = { x: Math.cos(angulo), z: -Math.sin(angulo) }
    const largSobra = (LARGURA - LARGURA_PORTA) / 2
    for (const lado of [-1, 1]) {
      const centroLado = {
        x: ponto.x + perp.x * lado * (LARGURA_PORTA / 2 + largSobra / 2),
        z: ponto.z + perp.z * lado * (LARGURA_PORTA / 2 + largSobra / 2),
      }
      const painel = new THREE.Mesh(new THREE.BoxGeometry(largSobra, PE_DIREITO, ESPESSURA_PAREDE), matParede)
      painel.position.set(centroLado.x, PE_DIREITO / 2, centroLado.z)
      painel.rotation.y = angulo
      scene.add(painel)
    }
    const verga = new THREE.Mesh(new THREE.BoxGeometry(LARGURA_PORTA, PE_DIREITO - ALTURA_PORTA, ESPESSURA_PAREDE), matParede)
    verga.position.set(ponto.x, ALTURA_PORTA + (PE_DIREITO - ALTURA_PORTA) / 2, ponto.z)
    verga.rotation.y = angulo
    scene.add(verga)
    const marco = new THREE.BoxGeometry(0.04, ALTURA_PORTA, ESPESSURA_PAREDE + 0.02)
    for (const lado of [-1, 1]) {
      const b = new THREE.Mesh(marco, matMarco)
      b.position.set(
        ponto.x + perp.x * lado * (LARGURA_PORTA / 2 - 0.02),
        ALTURA_PORTA / 2,
        ponto.z + perp.z * lado * (LARGURA_PORTA / 2 - 0.02),
      )
      b.rotation.y = angulo
      scene.add(b)
    }

    // vão sempre bloqueado pra caminhar — a passagem é só por clique
    obstaculos.push(bloqueioVao(ponto, angulo))

    return { perp }
  }

  tampaComVao(P0, ANGULO_1)
  const { perp: perpSaida } = tampaComVao(P2, ANGULO_2)

  // ---------- porta de entrada (retorno à Cozinha) ----------
  // A porta da Cozinha, vista de trás — "atrás de você", como diz a
  // descrição em dados.js. Ela também é interativa para que o jogador
  // possa desfazer o trajeto e retornar à Cozinha.
  const portaEntrada = criarPorta(LARGURA_PORTA - 0.06, ALTURA_PORTA - 0.04)
  portaEntrada.position.set(P0.x, 0, P0.z)
  portaEntrada.rotation.y = ANGULO_1 + Math.PI // de costas pro corredor
  portaEntrada.userData = {
    tipo: "porta",
    ref: { id: "porta-retorno-cozinha", nome: "Porta para a Cozinha", proxima: "cozinha" },
  }
  scene.add(portaEntrada)
  interativos.push(portaEntrada)

  // ---------- porta de saída (interativa, sutilmente diferente a cada volta) ----------
  // "Sutilmente diferente": nada que mude a leitura da cena (não é uma
  // porta de cor diferente), só um resto entreaberto e uma posição de
  // batente que nunca são EXATAMENTE os mesmos dois visitas seguidas.
  // O seed é o número de visitas — determinístico (F5 no meio não
  // muda nada), mas cada volta ao corredor é um seed novo.
  const portaSaida = criarPorta(LARGURA_PORTA - 0.06, ALTURA_PORTA - 0.04)
  const anguloBase = 0.14
  const anguloJitter = jitter(visita * 7.31 + 1, 0.06) // ±0,06 rad ≈ ±3,4°
  const desloceJitter = jitter(visita * 3.53 + 5, 0.012) // ±12mm ao longo do batente
  portaSaida.position.set(
    P2.x + perpSaida.x * desloceJitter,
    0,
    P2.z + perpSaida.z * desloceJitter,
  )
  portaSaida.rotation.y = ANGULO_2 + anguloBase + anguloJitter
  portaSaida.userData = { tipo: "porta", ref: porta }
  scene.add(portaSaida)
  interativos.push(portaSaida)

  // ---------- luz ----------
  // Uma lâmpada nua na quebra, mais nada — o resto do trecho fica na
  // penumbra de propósito. Não tem fonte perto de nenhuma das duas
  // pontas: as portas (entrada e saída) ficam sempre um pouco mal
  // iluminadas, o oposto da Cozinha, onde a luz busca os objetos.
  scene.add(new THREE.AmbientLight(0x2a2c30, 0.35))
  const lampada = new THREE.PointLight(0xdfe6ec, 3.4, 4.6, 2)
  lampada.position.set(P1.x, PE_DIREITO - 0.15, P1.z)
  lampada.castShadow = true
  lampada.shadow.mapSize.set(512, 512)
  scene.add(lampada)
  const bulbo = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 10, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcfd8e0, emissiveIntensity: 1.8 }),
  )
  bulbo.position.copy(lampada.position)
  scene.add(bulbo)

  return {
    id: "corredor",
    data: salaData,
    porta,
    obstaculos,
    interativos,
    // spawn: logo depois da porta de entrada, já de frente pro corredor.
    // 0,8m de P0 — com o bloqueio do vão indo até 0,28m + raio do
    // jogador (0,28m), sobra margem de verdade, não só o suficiente pra
    // não colidir no frame de spawn.
    spawn: { x: P0.x, y: 1.65, z: P0.z + DIR_1.z * 0.8, olharY: ANGULO_1 },
    // No corredor a mesma frequência migra para trás da parede na quebra,
    // sugerindo continuidade física sem revelar a origem ao jogador.
    fonteSom: { x: P1.x - 0.72, y: 1.05, z: P1.z + 0.18 },
    limites: { peDireito: PE_DIREITO },
  }
}
