// A Cozinha: arquitetura, mobiliário, iluminação e posicionamento dos 16 objetos.
//
// Separado de main.js de propósito. main.js virou só o motor (câmera,
// movimento, raycast, HUD, loop) e não sabe nada sobre cozinha. Quando o
// Corredor entrar, ele é outro arquivo com esta mesma assinatura —
// construir(scene) devolvendo { obstaculos, interativos, spawn, ... } —
// e main.js não muda uma linha. Era exatamente isso que travava a
// transição de salas antes: tudo estava fundido num arquivo só.

import * as THREE from "three"
import { TEX } from "./texturas.js"
import { criarModelo, criarPorta, DECALQUES } from "./modelos.js"
import { caixa, segmento } from "./colisao.js"

// ---------- dimensões ----------
// Planta real de referência que o Diogo trouxe: 4,28m x 3,28m.
const LARGURA = 4.28 // eixo X
const PROFUNDIDADE = 3.28 // eixo Z
// Pé-direito: 2,70m. Antes era 2,60 marcado como "chute". 2,70 é a altura
// livre residencial mais comum no Brasil (a NBR 15575 exige no mínimo
// 2,50 em área de permanência prolongada, e 2,70 é o que se constrói).
// Com câmera a 1,65 isso deixa ~1,05m de parede acima da cabeça, que é o
// que faz um cômodo pequeno parecer apertado sem parecer errado.
const PE_DIREITO = 2.7

const META_X = LARGURA / 2
const META_Z = PROFUNDIDADE / 2
const ESPESSURA_PAREDE = 0.12

const LARGURA_PORTA = 0.9
const ALTURA_PORTA = 2.05
const PORTA_OFFSET_X = -0.9 // fora do centro da parede norte

// bancada
const BANCADA_PROF = 0.6
const BANCADA_ALTURA = 0.86
const TAMPO_ESP = 0.04
const ALTURA_TAMPO = BANCADA_ALTURA + TAMPO_ESP // 0.90 — onde os objetos apoiam

// estante
const ALTURA_PRATELEIRA = 1.5
const PRATELEIRA_ESP = 0.04
const ALTURA_APOIO_PRATELEIRA = ALTURA_PRATELEIRA + PRATELEIRA_ESP

// mesa retangular (planta do Diogo). Posição validada por simulação
// (BFS numa grade de 5cm, reaproveitando resolverMovimento/colide de
// colisao.js): com estas medidas a área livre da sala continua sendo
// uma região só, sem bolsão isolado, com ~1m de corredor livre pro
// lado leste e ~0,7m pros lados norte/sul — folga de verdade, não só
// o suficiente pra não colidir.
const MESA_X = -0.25
const MESA_Z = 0
const MESA_LARGURA = 1.0 // eixo X
const MESA_PROFUNDIDADE = 0.65 // eixo Z
const MESA_ALTURA = 0.76 // tampo — mesa de jantar, mais baixa que a bancada (0,90)
const MESA_TAMPO_ESP = 0.04

// ---------- caminho da bancada ----------
// A bancada é uma POLILINHA, não uma lista de móveis. Ela contorna três
// paredes (norte à direita da porta, leste inteira, sul parcial) e os
// objetos são distribuídos ao longo dela. Mudar o formato do balcão =
// mudar estes 4 pontos, e os 10 objetos se redistribuem sozinhos.
const CAMINHO_BANCADA = [
  { x: PORTA_OFFSET_X + LARGURA_PORTA / 2 + 0.28, z: -META_Z + BANCADA_PROF / 2 },
  { x: META_X - BANCADA_PROF / 2, z: -META_Z + BANCADA_PROF / 2 },
  { x: META_X - BANCADA_PROF / 2, z: META_Z - BANCADA_PROF / 2 },
  { x: 0.1, z: META_Z - BANCADA_PROF / 2 },
]

// Distribui pesos uniformemente ao longo da polilinha, devolvendo
// também o ÂNGULO do trecho. O ângulo é novo e importa: sem ele, todo
// objeto ficava apontando pro mesmo lado, e uma faca atravessada na
// bancada leste denunciava na hora que a cena era gerada por script.
//
// "Pesos" em vez de "n objetos": um peso de valor 1 é um objeto, um
// peso maior que 1 é um respiro sem objeto nenhum. É o que faz
// GRUPOS_BANCADA virar de verdade "grupos com espaço entre eles" em
// vez de só mudar a ORDEM — sem isso, reordenar o array não muda a
// distância entre os objetos, porque a distribuição já era uniforme.
function distribuirPesos(pontos, pesos) {
  const trechos = []
  let total = 0
  for (let i = 0; i < pontos.length - 1; i++) {
    const a = pontos[i]
    const b = pontos[i + 1]
    const comprimento = Math.hypot(b.x - a.x, b.z - a.z)
    trechos.push({ a, b, comprimento, angulo: Math.atan2(b.x - a.x, b.z - a.z) })
    total += comprimento
  }
  const somaPesos = pesos.reduce((s, p) => s + p, 0)
  const resultado = []
  let acumulado = 0
  for (const peso of pesos) {
    const centro = acumulado + peso / 2 // centraliza cada item no meio do seu próprio peso
    acumulado += peso
    let alvo = total * (centro / somaPesos)
    for (const t of trechos) {
      if (alvo <= t.comprimento || t === trechos[trechos.length - 1]) {
        const f = t.comprimento === 0 ? 0 : alvo / t.comprimento
        resultado.push({ x: t.a.x + (t.b.x - t.a.x) * f, z: t.a.z + (t.b.z - t.a.z) * f, angulo: t.angulo })
        break
      }
      alvo -= t.comprimento
    }
  }
  return resultado
}

// Distribui objetos AGRUPADOS ao longo do caminho, com um respiro sem
// objeto entre um grupo e o próximo. `gap` é o peso desse respiro, em
// unidades de "um objeto" — 1.4 dá uma pausa perceptível sem esvaziar
// demais um balcão de 4,3m.
function distribuirGrupos(pontos, grupos, gap = 1.4) {
  const pesos = []
  const ids = []
  grupos.forEach((grupo, i) => {
    if (i > 0) pesos.push(gap)
    for (const id of grupo) {
      pesos.push(1)
      ids.push(id)
    }
  })
  const posicoes = distribuirPesos(pontos, pesos)
  // posicoes tem uma entrada a mais que ids pra cada respiro — filtra
  // pegando só as que correspondem a peso 1 (objeto), na mesma ordem
  const resultado = {}
  let cursorId = 0
  pesos.forEach((peso, i) => {
    if (peso !== 1) return
    resultado[ids[cursorId]] = posicoes[i]
    cursorId++
  })
  return resultado
}

// Objetos da bancada agrupados por ESTAÇÃO real de cozinha, não pelo
// cluster narrativo (corte/domestico/vazio — esses continuam decidindo
// o final em dados.js, sem mudar nada). Um cluster pode aparecer
// espalhado entre duas estações, e uma estação pode misturar clusters
// — é assim que uma bancada de verdade se organiza: por USO, não pela
// categoria que o roteiro usa por trás.
const GRUPOS_BANCADA = [
  ["faca", "tabua", "tesoura", "amolador", "espeto"], // estação de corte
  ["panela", "garfo", "toalha", "copo"], // mesa posta / serviço
  ["gelo"], // sozinho, de propósito — a fala dele já diz que é uma
  // anomalia ("um ponto está mais frio, sem explicação"); ficar
  // isolado no fim do balcão, sem vizinho, reforça isso em vez de
  // escondê-lo no meio de uma estação que faz sentido
]
const OBJETOS_PRATELEIRA = ["caderno", "etiqueta", "relogio", "camera"]

export function construirCozinha(scene) {
  const obstaculos = []
  const interativos = []

  const salaData = window.DATA.salas.cozinha
  const objetos = salaData.objetos.filter((o) => !o.ehSaida)
  const porta = salaData.objetos.find((o) => o.ehSaida)

  // ---------- materiais de arquitetura ----------
  const matParede = new THREE.MeshStandardMaterial({
    map: TEX.parede(2, 1),
    roughness: 0.95,
    metalness: 0,
  })
  const matPiso = new THREE.MeshStandardMaterial({
    map: TEX.piso(3, 2.4),
    roughness: 0.72,
    metalness: 0.02,
  })
  const matTeto = new THREE.MeshStandardMaterial({ color: 0x191713, roughness: 1, metalness: 0 })
  // Azulejo menos polido do que estava (0.22). Com roughness tão baixa,
  // qualquer luz próxima virava uma bolha especular grande e nítida na
  // parede — na inspeção parecia que havia lâmpadas coladas no azulejo.
  const matAzulejo = new THREE.MeshStandardMaterial({
    map: TEX.azulejo(4, 1),
    roughness: 0.42,
    metalness: 0.03,
  })
  const matRodape = new THREE.MeshStandardMaterial({ color: 0x1b1815, roughness: 0.85 })
  const matArmario = new THREE.MeshStandardMaterial({
    map: TEX.madeiraEscura(2, 1),
    color: 0x6e6252,
    roughness: 0.8,
    metalness: 0,
  })
  // Tampo em granito. A cor 0x26241f de antes era quase preta: os dez
  // objetos da bancada desapareciam nela. Isto ainda é escuro para o
  // clima da sala, mas agora existe um valor de cinza atrás da faca.
  const matTampo = new THREE.MeshStandardMaterial({
    map: TEX.pedra(1.5, 1.5),
    color: 0x8d8880,
    roughness: 0.38,
    metalness: 0.06,
  })
  const matMetalFosco = new THREE.MeshStandardMaterial({ color: 0x74787c, roughness: 0.45, metalness: 0.7 })

  // ---------- piso e teto ----------
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(LARGURA, PROFUNDIDADE), matPiso)
  piso.rotation.x = -Math.PI / 2
  piso.receiveShadow = true
  scene.add(piso)

  const teto = new THREE.Mesh(new THREE.PlaneGeometry(LARGURA, PROFUNDIDADE), matTeto)
  teto.rotation.x = Math.PI / 2
  teto.position.y = PE_DIREITO
  scene.add(teto)

  // ---------- paredes ----------
  // Caixas, não planos. Plano tem espessura zero: visto de raspão a
  // parede desaparecia, e o vão da porta não tinha profundidade nenhuma.
  function parede(larguraX, larguraZ, x, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(larguraX, PE_DIREITO, larguraZ), matParede)
    m.position.set(x, PE_DIREITO / 2, z)
    m.receiveShadow = true
    scene.add(m)
    obstaculos.push(caixa(x, z, larguraX, larguraZ))
    return m
  }

  const e = ESPESSURA_PAREDE
  parede(e, PROFUNDIDADE + e * 2, -META_X - e / 2, 0) // oeste
  parede(e, PROFUNDIDADE + e * 2, META_X + e / 2, 0) // leste
  parede(LARGURA + e * 2, e, 0, META_Z + e / 2) // sul

  // parede norte partida pelo vão da porta
  const bordaEsqPorta = PORTA_OFFSET_X - LARGURA_PORTA / 2
  const bordaDirPorta = PORTA_OFFSET_X + LARGURA_PORTA / 2
  const largEsq = bordaEsqPorta - -META_X
  const largDir = META_X - bordaDirPorta
  parede(largEsq + e, e, -META_X + largEsq / 2 - e / 2, -META_Z - e / 2)
  parede(largDir + e, e, META_X - largDir / 2 + e / 2, -META_Z - e / 2)

  // verga sobre a porta (não é obstáculo: está acima da cabeça)
  const verga = new THREE.Mesh(
    new THREE.BoxGeometry(LARGURA_PORTA, PE_DIREITO - ALTURA_PORTA, e),
    matParede,
  )
  verga.position.set(PORTA_OFFSET_X, ALTURA_PORTA + (PE_DIREITO - ALTURA_PORTA) / 2, -META_Z - e / 2)
  scene.add(verga)

  // marco do vão — dá espessura visível à passagem
  const matMarco = new THREE.MeshStandardMaterial({ color: 0x231f1a, roughness: 0.8 })
  const batenteGeom = new THREE.BoxGeometry(0.05, ALTURA_PORTA, e + 0.02)
  for (const lado of [-1, 1]) {
    const b = new THREE.Mesh(batenteGeom, matMarco)
    b.position.set(PORTA_OFFSET_X + lado * (LARGURA_PORTA / 2 - 0.02), ALTURA_PORTA / 2, -META_Z - e / 2)
    scene.add(b)
  }
  const travessa = new THREE.Mesh(new THREE.BoxGeometry(LARGURA_PORTA, 0.05, e + 0.02), matMarco)
  travessa.position.set(PORTA_OFFSET_X, ALTURA_PORTA - 0.025, -META_Z - e / 2)
  scene.add(travessa)

  // ---------- rodapé ----------
  const rodapeGeom = (comp) => new THREE.BoxGeometry(comp, 0.09, 0.02)
  function rodape(comp, x, z, ry = 0) {
    const m = new THREE.Mesh(rodapeGeom(comp), matRodape)
    m.position.set(x, 0.045, z)
    m.rotation.y = ry
    scene.add(m)
  }
  rodape(PROFUNDIDADE, -META_X + 0.01, 0, Math.PI / 2)
  rodape(largEsq, -META_X + largEsq / 2, -META_Z + 0.01)

  // ---------- azulejo atrás da bancada ----------
  // Só onde há bancada. Azulejo em parede sem pia não faria sentido
  // construtivo, e o cômodo tem que parecer construído por alguém.
  // A tela de azulejo desenha uma grade 4x4, então um repeat de comp/0.4
  // dava peças de 10cm — na inspeção o fundo virou uma malha fina, mais
  // parecida com pastilha de piscina do que com azulejo de cozinha.
  // 15cm por peça é a medida comum, logo cada repetição cobre 0,60m.
  const LADO_AZULEJO = 0.15
  const VOLTA_AZULEJO = LADO_AZULEJO * 4
  function painelAzulejo(comp, x, z, ry) {
    const alturaPainel = 1.6 - ALTURA_TAMPO
    const m = new THREE.Mesh(new THREE.PlaneGeometry(comp, alturaPainel), matAzulejo.clone())
    // sem arredondar: peça cortada na borda é o que acontece numa parede
    // de verdade, e arredondar deformaria o azulejo pra ele fechar exato
    m.material.map = TEX.azulejo(comp / VOLTA_AZULEJO, alturaPainel / VOLTA_AZULEJO)
    m.position.set(x, ALTURA_TAMPO + alturaPainel / 2, z)
    m.rotation.y = ry
    scene.add(m)
  }
  const compNorte = META_X - bordaDirPorta
  painelAzulejo(compNorte, bordaDirPorta + compNorte / 2, -META_Z + 0.005, 0)
  painelAzulejo(PROFUNDIDADE, META_X - 0.005, 0, -Math.PI / 2)
  const compSul = META_X - -0.2
  painelAzulejo(compSul, -0.2 + compSul / 2, META_Z - 0.005, Math.PI)

  // ---------- bancada ----------
  function segmentoBancada(a, b) {
    const comprimento = Math.hypot(b.x - a.x, b.z - a.z)
    const angulo = Math.atan2(b.x - a.x, b.z - a.z)
    const cxm = (a.x + b.x) / 2
    const czm = (a.z + b.z) / 2

    // corpo de armário, recuado do chão (pé de armário de verdade)
    const corpo = new THREE.Mesh(
      new THREE.BoxGeometry(BANCADA_PROF - 0.04, BANCADA_ALTURA - 0.09, comprimento + BANCADA_PROF - 0.02),
      matArmario,
    )
    corpo.position.set(cxm, 0.09 + (BANCADA_ALTURA - 0.09) / 2, czm)
    corpo.rotation.y = angulo
    corpo.castShadow = true
    corpo.receiveShadow = true
    scene.add(corpo)

    // tampo em pedra, com beiral saliente
    const tampo = new THREE.Mesh(
      new THREE.BoxGeometry(BANCADA_PROF, TAMPO_ESP, comprimento + BANCADA_PROF),
      matTampo,
    )
    tampo.position.set(cxm, BANCADA_ALTURA + TAMPO_ESP / 2, czm)
    tampo.rotation.y = angulo
    tampo.castShadow = true
    tampo.receiveShadow = true
    scene.add(tampo)

    // puxadores ao longo do segmento
    const nPortas = Math.max(1, Math.round(comprimento / 0.5))
    for (let i = 0; i < nPortas; i++) {
      const f = (i + 0.5) / nPortas
      const px = a.x + (b.x - a.x) * f
      const pz = a.z + (b.z - a.z) * f
      const puxador = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.11), matMetalFosco)
      // deslocado pra face que olha pro centro do cômodo
      const normal = new THREE.Vector3(Math.cos(angulo), 0, -Math.sin(angulo))
      const paraCentro = new THREE.Vector3(-px, 0, -pz).normalize()
      const sinal = normal.dot(paraCentro) >= 0 ? 1 : -1
      puxador.position.set(
        px + normal.x * sinal * (BANCADA_PROF / 2 - 0.01),
        BANCADA_ALTURA - 0.16,
        pz + normal.z * sinal * (BANCADA_PROF / 2 - 0.01),
      )
      puxador.rotation.y = angulo
      scene.add(puxador)
    }

    obstaculos.push(segmento(a, b, BANCADA_PROF))
  }
  for (let i = 0; i < CAMINHO_BANCADA.length - 1; i++) {
    segmentoBancada(CAMINHO_BANCADA[i], CAMINHO_BANCADA[i + 1])
  }

  // ---------- estante (parede oeste) ----------
  const zPrat0 = -META_Z + 0.55
  const zPrat1 = META_Z - 0.55
  const compPrateleira = zPrat1 - zPrat0 + 0.5
  const matPrateleira = new THREE.MeshStandardMaterial({
    map: TEX.madeiraEscura(1, 3),
    color: 0x6a5e4d,
    roughness: 0.82,
  })
  const prateleira = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, PRATELEIRA_ESP, compPrateleira),
    matPrateleira,
  )
  prateleira.position.set(-META_X + 0.14, ALTURA_PRATELEIRA + PRATELEIRA_ESP / 2, (zPrat0 + zPrat1) / 2)
  prateleira.castShadow = true
  scene.add(prateleira)
  // mãos-francesas
  for (const z of [zPrat0 - 0.1, (zPrat0 + zPrat1) / 2, zPrat1 + 0.1]) {
    const sup = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.02, 0.02), matMetalFosco)
    sup.position.set(-META_X + 0.11, ALTURA_PRATELEIRA - 0.02, z)
    sup.rotation.z = -0.5
    scene.add(sup)
  }
  // prateleira a 1,5m não é obstáculo pro corpo: o jogador passa por baixo

  // ---------- mesa retangular ----------
  // Planta do Diogo: mesa retangular no centro, não mais a ilha
  // redonda. Pernas nos quatro cantos (recuadas 8cm da borda, como
  // mesa de verdade) em vez de um pedestal só — o pedestal central
  // fazia sentido pra ilha de bancada, não pra uma mesa de jantar.
  const PERNA_ESP = 0.06
  const PERNA_INSET = 0.08
  const pernaAltura = MESA_ALTURA - MESA_TAMPO_ESP
  const pernaGeom = new THREE.BoxGeometry(PERNA_ESP, pernaAltura, PERNA_ESP)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const perna = new THREE.Mesh(pernaGeom, matArmario)
      perna.position.set(
        MESA_X + sx * (MESA_LARGURA / 2 - PERNA_INSET),
        pernaAltura / 2,
        MESA_Z + sz * (MESA_PROFUNDIDADE / 2 - PERNA_INSET),
      )
      perna.castShadow = true
      scene.add(perna)
    }
  }
  const mesaTampo = new THREE.Mesh(
    new THREE.BoxGeometry(MESA_LARGURA, MESA_TAMPO_ESP, MESA_PROFUNDIDADE),
    matTampo,
  )
  mesaTampo.position.set(MESA_X, MESA_ALTURA - MESA_TAMPO_ESP / 2, MESA_Z)
  mesaTampo.castShadow = true
  mesaTampo.receiveShadow = true
  scene.add(mesaTampo)
  // caixa, não cilindro — a colisão acompanha a forma real da mesa
  // agora. Validado por simulação: ver comentário nas dimensões acima.
  obstaculos.push(caixa(MESA_X, MESA_Z, MESA_LARGURA, MESA_PROFUNDIDADE))

  // ---------- luminária pendente sobre a mesa ----------
  const matCupula = new THREE.MeshStandardMaterial({
    color: 0x2c2822,
    roughness: 0.6,
    metalness: 0.3,
    side: THREE.DoubleSide,
  })
  const cupula = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.16, 24, 1, true), matCupula)
  cupula.position.set(MESA_X, PE_DIREITO - 0.42, MESA_Z)
  cupula.rotation.x = Math.PI
  scene.add(cupula)
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.36, 6), matCupula)
  haste.position.set(MESA_X, PE_DIREITO - 0.18, MESA_Z)
  scene.add(haste)
  const lampada = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffc477, emissiveIntensity: 2.4 }),
  )
  lampada.position.set(MESA_X, PE_DIREITO - 0.47, MESA_Z)
  scene.add(lampada)

  // ---------- iluminação ----------
  // Baixada pro clima final. Antes estava clara de propósito, só pra dar
  // pra avaliar layout — o layout está fechado, então agora vale a
  // atmosfera: "mobiliado à meia-luz", como diz a descrição em dados.js.
  //
  // Uma fonte dominante (o pendente sobre a ilha) + apoios fracos. É o
  // contraste que faz a bancada ter canto escuro, e é o canto escuro que
  // faz o jogador chegar perto pra olhar.
  scene.add(new THREE.AmbientLight(0x3a3a40, 0.5))
  // hemisférica fraca: céu frio, chão morno — desencosta os objetos do
  // fundo sem levantar o preto geral
  scene.add(new THREE.HemisphereLight(0x5b6472, 0x201a12, 0.35))

  const pendente = new THREE.PointLight(0xffc98a, 9, 7.5, 2)
  pendente.position.set(MESA_X, PE_DIREITO - 0.5, MESA_Z)
  pendente.castShadow = true
  pendente.shadow.mapSize.set(1024, 1024)
  pendente.shadow.bias = -0.004
  pendente.shadow.camera.near = 0.05
  pendente.shadow.camera.far = 8
  scene.add(pendente)

  // Luzes de bancada: SpotLight apontando pra BAIXO, não PointLight.
  //
  // Antes eram três PointLights soltas a 1,45m de altura. Uma point light
  // irradia pra todo lado, então quem recebia a luz era o azulejo logo
  // atrás dela — três bolhas brilhantes na parede, e o tampo continuava
  // escuro. O oposto do que a luminária de armário faz.
  //
  // Spot com penumbra alta e target no próprio tampo resolve os dois
  // problemas: a parede recebe só o rebote, e os objetos ficam dentro do
  // cone. Sem castShadow — a sombra que importa é a do pendente, e três
  // shadow maps extras num cômodo deste tamanho não pagam o custo.
  const apoios = [
    { pos: [META_X - 0.42, 1.52, -META_Z + 0.95], alvo: [META_X - 0.32, ALTURA_TAMPO, -META_Z + 0.95], i: 4.2 },
    { pos: [META_X - 0.42, 1.52, META_Z - 0.95], alvo: [META_X - 0.32, ALTURA_TAMPO, META_Z - 0.95], i: 3.6 },
    { pos: [0.55, 1.52, -META_Z + 0.42], alvo: [0.55, ALTURA_TAMPO, -META_Z + 0.32], i: 3.0 },
    { pos: [0.0, 1.52, META_Z - 0.42], alvo: [0.0, ALTURA_TAMPO, META_Z - 0.32], i: 2.6 },
  ]
  for (const { pos, alvo, i } of apoios) {
    const l = new THREE.SpotLight(0xffdcae, i, 2.6, Math.PI / 2.6, 0.95, 2)
    l.position.set(pos[0], pos[1], pos[2])
    l.target.position.set(alvo[0], alvo[1], alvo[2])
    scene.add(l)
    scene.add(l.target) // sem isso o target fica na origem e o cone aponta pro chão do centro
  }

  // luz vazando do vão da porta: fria, de outra fonte, mais alta.
  // É a única pista de que existe algo além da Cozinha, e ela não
  // comenta nada — só é fria de um jeito que o resto do cômodo não é.
  const luzVao = new THREE.PointLight(0x8fa6c4, 1.7, 3.4, 2)
  luzVao.position.set(PORTA_OFFSET_X, 1.85, -META_Z + 0.35)
  scene.add(luzVao)

  // luz de apoio junto à estante, pra ela não virar um bloco preto
  const luzEstante = new THREE.PointLight(0xffd7a4, 0.9, 2.8, 2)
  luzEstante.position.set(-META_X + 0.55, 1.35, 0)
  scene.add(luzEstante)

  // ---------- porta ----------
  const portaGrupo = criarPorta(LARGURA_PORTA - 0.06, ALTURA_PORTA - 0.04)
  // dobradiça na borda esquerda do vão, não no centro — porta gira em
  // torno do batente, como porta de verdade
  portaGrupo.position.set(bordaEsqPorta + 0.03, 0, -META_Z - e / 2)
  portaGrupo.rotation.y = 0.42 // entreaberta, como no texto da versão 2D
  portaGrupo.userData = { tipo: "porta", ref: porta }
  scene.add(portaGrupo)
  interativos.push(portaGrupo)

  // Enquanto o Corredor não existe, o vão é intransponível. Este é o
  // único obstáculo que sai daqui quando a transição entrar — deixado
  // isolado e nomeado justamente pra ser fácil de achar depois.
  const bloqueioProvisorioDoVao = caixa(PORTA_OFFSET_X, -META_Z, LARGURA_PORTA, e)
  obstaculos.push(bloqueioProvisorioDoVao)

  // ---------- posições dos objetos ----------
  const posBancada = distribuirGrupos(CAMINHO_BANCADA, GRUPOS_BANCADA)
  const POSICOES = {}
  for (const id in posBancada) {
    POSICOES[id] = { x: posBancada[id].x, y: ALTURA_TAMPO, z: posBancada[id].z, rotY: posBancada[id].angulo }
  }

  // estante: objetos de registro, virados pra dentro do cômodo
  OBJETOS_PRATELEIRA.forEach((id, i) => {
    const z = zPrat0 + ((zPrat1 - zPrat0) * i) / (OBJETOS_PRATELEIRA.length - 1)
    POSICOES[id] = { x: -META_X + 0.15, y: ALTURA_APOIO_PRATELEIRA, z, rotY: Math.PI / 2 }
  })

  // ilha: o prato vazio, isolado no meio, "esperando algo que não veio"
  POSICOES.pratovazio = { x: MESA_X, y: MESA_ALTURA, z: MESA_Z, rotY: 0 }

  // chão: único objeto que a fala não amarra a nenhuma superfície
  POSICOES.mancha = { x: -1.15, y: 0.002, z: 0.55, rotY: 0.3 }

  objetos.forEach((o) => {
    const p = POSICOES[o.id]
    if (!p) {
      console.warn(`[3d] objeto "${o.id}" existe em dados.js mas não tem posição na Cozinha`)
      return
    }
    const modelo = criarModelo(o.id)
    modelo.position.set(p.x, p.y, p.z)
    modelo.rotation.y = p.rotY || 0
    modelo.userData = { tipo: "objeto", ref: o, decalque: DECALQUES.has(o.id) }
    scene.add(modelo)
    interativos.push(modelo)
  })

  return {
    id: "cozinha",
    data: salaData,
    porta,
    obstaculos,
    interativos,
    // spawn: canto sudoeste, longe da porta e da bancada, de frente pro cômodo
    spawn: { x: -META_X + 0.75, y: 1.65, z: META_Z - 0.75, olharY: -0.75 },
    limites: { peDireito: PE_DIREITO },
  }
}
