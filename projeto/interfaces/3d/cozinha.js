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
import { caixa, cilindro } from "./colisao.js"

function mesh(geometria, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const objeto = new THREE.Mesh(geometria, material)
  objeto.position.set(x, y, z)
  objeto.rotation.set(rx, ry, rz)
  objeto.castShadow = true
  objeto.receiveShadow = true
  return objeto
}

// Pequena estatueta de resina. Corpo, cauda e cabeça são superfícies contínuas
// construídas por perfis, em vez de primitivas encostadas. Continua barata de
// renderizar, mas a silhueta lê como um brinquedo esculpido quando é encontrada.
function criarMiniDino() {
  const grupo = new THREE.Group()
  const resina = new THREE.MeshPhysicalMaterial({
    color: 0x6d7352,
    roughness: 0.42,
    metalness: 0.04,
    clearcoat: 0.34,
    clearcoatRoughness: 0.52,
  })
  const ventre = new THREE.MeshStandardMaterial({ color: 0x9a8a65, roughness: 0.57 })
  const escuro = new THREE.MeshStandardMaterial({ color: 0x121713, roughness: 0.3 })

  function perfilX(secoes, segmentos = 10) {
    const posicoes = []
    const uvs = []
    const indices = []
    for (let i = 0; i < secoes.length; i++) {
      const s = secoes[i]
      for (let j = 0; j < segmentos; j++) {
        const a = j / segmentos * Math.PI * 2
        posicoes.push(s.x, s.y + Math.cos(a) * s.ry, Math.sin(a) * s.rz)
        uvs.push(i / (secoes.length - 1), j / segmentos)
      }
    }
    for (let i = 0; i < secoes.length - 1; i++) {
      for (let j = 0; j < segmentos; j++) {
        const n = (j + 1) % segmentos
        const a = i * segmentos + j
        const b = i * segmentos + n
        const c = (i + 1) * segmentos + j
        const d = (i + 1) * segmentos + n
        indices.push(a, c, b, b, c, d)
      }
    }
    const geometria = new THREE.BufferGeometry()
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3))
    geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
    geometria.setIndex(indices)
    geometria.computeVertexNormals()
    return geometria
  }

  function perfilVertical(secoes, segmentos = 8) {
    const posicoes = []
    const indices = []
    for (const s of secoes) {
      for (let j = 0; j < segmentos; j++) {
        const a = j / segmentos * Math.PI * 2
        posicoes.push(s.x + Math.cos(a) * s.rx, s.y, s.z + Math.sin(a) * s.rz)
      }
    }
    for (let i = 0; i < secoes.length - 1; i++) {
      for (let j = 0; j < segmentos; j++) {
        const n = (j + 1) % segmentos
        const a = i * segmentos + j
        const b = i * segmentos + n
        const c = (i + 1) * segmentos + j
        const d = (i + 1) * segmentos + n
        indices.push(a, c, b, b, c, d)
      }
    }
    const geometria = new THREE.BufferGeometry()
    geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3))
    geometria.setIndex(indices)
    geometria.computeVertexNormals()
    return geometria
  }

  const troncoECauda = new THREE.Mesh(perfilX([
    { x: -0.215, y: 0.104, ry: 0.006, rz: 0.006 },
    { x: -0.17, y: 0.108, ry: 0.018, rz: 0.017 },
    { x: -0.105, y: 0.111, ry: 0.041, rz: 0.038 },
    { x: -0.042, y: 0.116, ry: 0.066, rz: 0.057 },
    { x: 0.022, y: 0.122, ry: 0.072, rz: 0.062 },
    { x: 0.072, y: 0.136, ry: 0.052, rz: 0.049 },
  ], 12), resina)
  troncoECauda.castShadow = true
  grupo.add(troncoECauda)

  const pescocoECabeca = new THREE.Mesh(perfilX([
    { x: 0.052, y: 0.135, ry: 0.042, rz: 0.041 },
    { x: 0.08, y: 0.166, ry: 0.034, rz: 0.034 },
    { x: 0.102, y: 0.197, ry: 0.038, rz: 0.038 },
    { x: 0.135, y: 0.214, ry: 0.048, rz: 0.045 },
    { x: 0.174, y: 0.211, ry: 0.039, rz: 0.041 },
    { x: 0.205, y: 0.205, ry: 0.022, rz: 0.033 },
  ], 12), resina)
  pescocoECabeca.castShadow = true
  grupo.add(pescocoECabeca)

  const mandibula = new THREE.Mesh(perfilX([
    { x: 0.133, y: 0.193, ry: 0.015, rz: 0.035 },
    { x: 0.176, y: 0.191, ry: 0.014, rz: 0.034 },
    { x: 0.207, y: 0.195, ry: 0.008, rz: 0.028 },
  ], 10), ventre)
  grupo.add(mandibula)

  for (const lado of [-1, 1]) {
    grupo.add(mesh(new THREE.SphereGeometry(0.006, 8, 6), escuro, 0.153, 0.226, lado * 0.039))
    const perna = new THREE.Mesh(perfilVertical([
      { x: -0.015, y: 0.126, z: lado * 0.047, rx: 0.031, rz: 0.027 },
      { x: -0.004, y: 0.083, z: lado * 0.052, rx: 0.027, rz: 0.023 },
      { x: 0.024, y: 0.047, z: lado * 0.053, rx: 0.016, rz: 0.015 },
      { x: 0.038, y: 0.018, z: lado * 0.054, rx: 0.011, rz: 0.011 },
    ]), resina)
    perna.castShadow = true
    grupo.add(perna)
    grupo.add(mesh(new THREE.BoxGeometry(0.055, 0.013, 0.027), ventre, 0.058, 0.012, lado * 0.054, 0, -0.08, 0))

    const braco = new THREE.Mesh(perfilVertical([
      { x: 0.076, y: 0.15, z: lado * 0.041, rx: 0.01, rz: 0.008 },
      { x: 0.097, y: 0.12, z: lado * 0.044, rx: 0.008, rz: 0.007 },
      { x: 0.121, y: 0.106, z: lado * 0.043, rx: 0.004, rz: 0.004 },
    ], 7), resina)
    grupo.add(braco)
  }

  grupo.add(mesh(new THREE.SphereGeometry(0.0038, 7, 5), escuro, 0.197, 0.216, 0.022))

  // O volume acompanha de perto a peça visível: mirar na estatueta funciona,
  // mas mirar no espaço em volta dela não entrega o segredo por acidente.
  const hitbox = mesh(
    new THREE.BoxGeometry(0.405, 0.225, 0.13),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, colorWrite: false, depthWrite: false }),
    -0.005, 0.112, 0,
  )
  hitbox.castShadow = false
  hitbox.receiveShadow = false
  grupo.add(hitbox)
  return { grupo, material: resina }
}

// ---------- dimensões ----------
// Evolução moderada da planta anterior (4,28 x 3,28m). A sala ganha ar para
// circulação ao redor da ilha sem deixar de parecer uma cozinha doméstica.
const LARGURA = 5.4 // eixo X
const PROFUNDIDADE = 4.2 // eixo Z
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
const PORTA_OFFSET_X = -1.7 // fora do centro da parede norte

// bancada
const BANCADA_PROF = 0.6
const BANCADA_ALTURA = 0.86
const TAMPO_ESP = 0.04
const ALTURA_TAMPO = BANCADA_ALTURA + TAMPO_ESP // 0.90 — onde os objetos apoiam

// A bancada principal é uma composição interrompida: pia, vazio do fogão,
// apoio e módulo alto. As medidas explícitas fazem geometria, colisão e
// narrativa compartilharem a mesma planta.
const BANCADA_PIA = { x: -0.48, z: -META_Z + BANCADA_PROF / 2, largura: 1.28, profundidade: BANCADA_PROF }
const VAO_FOGAO = { x: 0.54, z: -META_Z + BANCADA_PROF / 2, largura: 0.76, profundidade: BANCADA_PROF }
const BANCADA_APOIO = { x: 1.34, z: -META_Z + BANCADA_PROF / 2, largura: 0.84, profundidade: BANCADA_PROF }
const MODULO_ALTO = { x: 2.23, z: -META_Z + 0.34, largura: 0.78, profundidade: 0.68, altura: 2.24 }
const BANCADA_FRIA = { x: META_X - BANCADA_PROF / 2, z: 0.82, largura: BANCADA_PROF, profundidade: 1.22 }

// Ilha compacta, deslocada para preservar um eixo livre entre spawn e porta.
const ILHA = { x: -0.22, z: 0.05, largura: 1.62, profundidade: 0.78, altura: 0.88 }
const BANCOS = [
  { x: -0.72, z: 0.72 },
  { x: -0.18, z: 0.72 },
]
const LUGAR_AUSENTE = { x: 0.36, z: 0.72 }

// Estante aberta e rasa: bloqueia o corpo, mas não toma o corredor oeste.
const ESTANTE = { x: -META_X + 0.18, z: 0.12, largura: 0.36, profundidade: 1.82, altura: 1.9 }

export function construirCozinha(scene) {
  const obstaculos = []
  const interativos = []

  const salaData = window.DATA.salas.cozinha
  const objetos = salaData.objetos.filter((o) => !o.ehSaida)
  const porta = salaData.objetos.find((o) => o.ehSaida)
  const refDino = { id: "dino", nome: "Miniatura", fala: "Uma identificação técnica quase apagada: DINO." }
  const refPortaDino = { id: "porta-dino", nome: "Acesso não catalogado", ehSaida: true, proxima: "salaDino" }

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
  const inicioPainelNorte = BANCADA_PIA.x - BANCADA_PIA.largura / 2
  const fimPainelNorte = BANCADA_APOIO.x + BANCADA_APOIO.largura / 2
  painelAzulejo(fimPainelNorte - inicioPainelNorte, (inicioPainelNorte + fimPainelNorte) / 2, -META_Z + 0.005, 0)
  painelAzulejo(BANCADA_FRIA.profundidade, META_X - 0.005, BANCADA_FRIA.z, -Math.PI / 2)

  // ---------- bancada interrompida ----------
  function criarBancada({ x, z, largura, profundidade }, frente) {
    const corpo = new THREE.Mesh(
      new THREE.BoxGeometry(largura - 0.04, BANCADA_ALTURA - 0.09, profundidade - 0.04),
      matArmario,
    )
    corpo.position.set(x, 0.09 + (BANCADA_ALTURA - 0.09) / 2, z)
    corpo.castShadow = true
    corpo.receiveShadow = true
    scene.add(corpo)

    const tampo = new THREE.Mesh(new THREE.BoxGeometry(largura, TAMPO_ESP, profundidade), matTampo)
    tampo.position.set(x, BANCADA_ALTURA + TAMPO_ESP / 2, z)
    tampo.castShadow = true
    tampo.receiveShadow = true
    scene.add(tampo)

    const aoLongoDeX = frente === "sul"
    const quantidade = Math.max(1, Math.round((aoLongoDeX ? largura : profundidade) / 0.48))
    for (let i = 0; i < quantidade; i++) {
      const f = (i + 0.5) / quantidade - 0.5
      const puxador = new THREE.Mesh(
        new THREE.BoxGeometry(aoLongoDeX ? 0.12 : 0.012, 0.012, aoLongoDeX ? 0.012 : 0.12),
        matMetalFosco,
      )
      puxador.position.set(
        x + (aoLongoDeX ? f * largura : -largura / 2 + 0.01),
        BANCADA_ALTURA - 0.16,
        z + (aoLongoDeX ? profundidade / 2 - 0.01 : f * profundidade),
      )
      scene.add(puxador)
    }
    obstaculos.push(caixa(x, z, largura, profundidade))
  }
  criarBancada(BANCADA_PIA, "sul")
  criarBancada(BANCADA_APOIO, "sul")
  criarBancada(BANCADA_FRIA, "oeste")

  // Pia simples: uma cuba escura e uma torneira arqueada são suficientes
  // para a parede principal ser lida como cozinha, sem aumentar o nível de detalhe.
  const matCuba = new THREE.MeshStandardMaterial({ color: 0x555b5d, roughness: 0.3, metalness: 0.72 })
  const cuba = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.025, 0.34), matCuba)
  cuba.position.set(BANCADA_PIA.x - 0.4, ALTURA_TAMPO + 0.009, BANCADA_PIA.z)
  scene.add(cuba)
  const fundoCuba = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.012, 0.27), new THREE.MeshStandardMaterial({ color: 0x303537, roughness: 0.42, metalness: 0.55 }))
  fundoCuba.position.set(BANCADA_PIA.x - 0.4, ALTURA_TAMPO + 0.023, BANCADA_PIA.z)
  scene.add(fundoCuba)
  const baseTorneira = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.021, 0.18, 12), matMetalFosco)
  baseTorneira.position.set(BANCADA_PIA.x - 0.4, ALTURA_TAMPO + 0.09, BANCADA_PIA.z - 0.2)
  scene.add(baseTorneira)
  const arcoTorneira = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.009, 8, 18, Math.PI), matMetalFosco)
  arcoTorneira.position.set(BANCADA_PIA.x - 0.4, ALTURA_TAMPO + 0.17, BANCADA_PIA.z - 0.13)
  arcoTorneira.rotation.y = Math.PI / 2
  scene.add(arcoTorneira)

  // Vão do fogão ausente. Nada bloqueia esse espaço: a diferença de parede,
  // a marca retangular no piso e dois pontos de instalação fazem o vazio
  // parecer funcional, não um trecho que o código esqueceu de modelar.
  const matAusencia = new THREE.MeshStandardMaterial({ color: 0x68655d, roughness: 1, transparent: true, opacity: 0.24 })
  const sombraParede = new THREE.Mesh(new THREE.PlaneGeometry(VAO_FOGAO.largura - 0.05, 1.18), matAusencia)
  sombraParede.position.set(VAO_FOGAO.x, 0.63, -META_Z + 0.008)
  scene.add(sombraParede)
  const marcaPiso = new THREE.Mesh(new THREE.PlaneGeometry(VAO_FOGAO.largura - 0.06, VAO_FOGAO.profundidade - 0.05), matAusencia.clone())
  marcaPiso.material.opacity = 0.32
  marcaPiso.rotation.x = -Math.PI / 2
  marcaPiso.position.set(VAO_FOGAO.x, 0.003, VAO_FOGAO.z)
  scene.add(marcaPiso)
  for (const x of [VAO_FOGAO.x - 0.12, VAO_FOGAO.x + 0.12]) {
    const ponto = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.025, 10), matMetalFosco)
    ponto.position.set(x, 0.32, -META_Z + 0.02)
    ponto.rotation.x = Math.PI / 2
    scene.add(ponto)
  }

  // Módulo alto / geladeira no fim da composição.
  const modulo = new THREE.Mesh(new THREE.BoxGeometry(MODULO_ALTO.largura, MODULO_ALTO.altura, MODULO_ALTO.profundidade), matArmario)
  modulo.position.set(MODULO_ALTO.x, MODULO_ALTO.altura / 2, MODULO_ALTO.z)
  modulo.castShadow = true
  modulo.receiveShadow = true
  scene.add(modulo)
  const juntaModulo = new THREE.Mesh(new THREE.BoxGeometry(MODULO_ALTO.largura - 0.08, 0.018, 0.012), matRodape)
  juntaModulo.position.set(MODULO_ALTO.x, 0.78, MODULO_ALTO.z + MODULO_ALTO.profundidade / 2 + 0.007)
  scene.add(juntaModulo)
  for (const y of [0.58, 1.36]) {
    const puxador = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.38, 0.018), matMetalFosco)
    puxador.position.set(MODULO_ALTO.x - 0.22, y, MODULO_ALTO.z + MODULO_ALTO.profundidade / 2 + 0.016)
    scene.add(puxador)
  }
  obstaculos.push(caixa(MODULO_ALTO.x, MODULO_ALTO.z, MODULO_ALTO.largura, MODULO_ALTO.profundidade))

  // Primeiro sinal familiar: uma folha presa ao módulo, com marcas sem texto
  // legível. Pode ser lista ou desenho; a cena não decide pelo visitante.
  const matPapelFamilia = new THREE.MeshStandardMaterial({ map: TEX.papel(), color: 0xc8bda3, roughness: 0.96 })
  const papelFamilia = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.28), matPapelFamilia)
  papelFamilia.position.set(MODULO_ALTO.x + 0.13, 1.48, MODULO_ALTO.z + MODULO_ALTO.profundidade / 2 + 0.022)
  papelFamilia.rotation.z = -0.055
  scene.add(papelFamilia)
  const matRiscoFamilia = new THREE.MeshStandardMaterial({ color: 0x6f746e, roughness: 1 })
  for (let i = 0; i < 3; i++) {
    const risco = new THREE.Mesh(new THREE.BoxGeometry(0.11 - i * 0.018, 0.006, 0.004), matRiscoFamilia)
    risco.position.set(MODULO_ALTO.x + 0.13, 1.53 - i * 0.055, MODULO_ALTO.z + MODULO_ALTO.profundidade / 2 + 0.026)
    risco.rotation.z = -0.055 + (i - 1) * 0.08
    scene.add(risco)
  }

  // ---------- estante doméstica ----------
  const matPrateleira = new THREE.MeshStandardMaterial({ map: TEX.madeiraEscura(1, 3), color: 0x6a5e4d, roughness: 0.84 })
  const estanteMovel = new THREE.Group()
  estanteMovel.position.set(ESTANTE.x, 0, ESTANTE.z)
  const fundoEstante = new THREE.Mesh(new THREE.BoxGeometry(0.025, ESTANTE.altura, ESTANTE.profundidade), matPrateleira)
  fundoEstante.position.set(-META_X + 0.025 - ESTANTE.x, ESTANTE.altura / 2, 0)
  estanteMovel.add(fundoEstante)
  for (const z of [-ESTANTE.profundidade / 2, ESTANTE.profundidade / 2]) {
    const lateral = new THREE.Mesh(new THREE.BoxGeometry(ESTANTE.largura, ESTANTE.altura, 0.045), matPrateleira)
    lateral.position.set(0, ESTANTE.altura / 2, z)
    lateral.castShadow = true
    estanteMovel.add(lateral)
  }
  const alturasEstante = [0.36, 0.76, 1.16, 1.56, 1.88]
  for (const y of alturasEstante) {
    const prateleira = new THREE.Mesh(new THREE.BoxGeometry(ESTANTE.largura, 0.04, ESTANTE.profundidade), matPrateleira)
    prateleira.position.set(0, y, 0)
    prateleira.castShadow = true
    estanteMovel.add(prateleira)
  }
  scene.add(estanteMovel)
  const colisorEstante = caixa(ESTANTE.x, ESTANTE.z, ESTANTE.largura, ESTANTE.profundidade)
  obstaculos.push(colisorEstante)

  // Poucas louças, repetidas. Dois espaços permanecem vazios e recebem só
  // uma silhueta de poeira — o segundo sinal familiar da sala.
  const matLouca = new THREE.MeshStandardMaterial({ color: 0xb7b1a3, roughness: 0.38 })
  const matVidro = new THREE.MeshStandardMaterial({ color: 0xaebfc0, roughness: 0.2, transparent: true, opacity: 0.38 })
  const adicionarRecipiente = (y, z, vidro = false) => {
    const recipiente = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.052, 0.11, 16, 1, true), vidro ? matVidro : matLouca)
    recipiente.position.set(-META_X + 0.21 - ESTANTE.x, y, z - ESTANTE.z)
    estanteMovel.add(recipiente)
  }
  adicionarRecipiente(0.435, 0.53)
  adicionarRecipiente(0.435, 0.73)
  adicionarRecipiente(0.845, -0.12, true)
  adicionarRecipiente(1.245, -0.42, true)
  const matPoeira = new THREE.MeshStandardMaterial({ color: 0x968d79, roughness: 1, transparent: true, opacity: 0.24 })
  for (const [y, z] of [[0.382, -0.48], [1.182, 0.55]]) {
    const vazio = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.13), matPoeira)
    vazio.rotation.x = -Math.PI / 2
    vazio.position.set(-META_X + 0.22 - ESTANTE.x, y, z - ESTANTE.z)
    estanteMovel.add(vazio)
  }

  // Acesso oculto atrás do móvel existente. Moldura, trilho no rodapé e
  // pequena diferença de material fazem a estante parecer parte planejada da
  // cozinha; antes de ela correr, nada denuncia uma porta interativa.
  const matRecesso = new THREE.MeshStandardMaterial({ color: 0x111715, roughness: 0.92 })
  const matTrilho = new THREE.MeshStandardMaterial({ color: 0x3f4541, roughness: 0.42, metalness: 0.68 })
  const passagem = new THREE.Group()
  passagem.position.set(-META_X + 0.012, 0, ESTANTE.z)
  passagem.rotation.y = Math.PI / 2
  passagem.add(mesh(new THREE.PlaneGeometry(0.86, 2.02), matRecesso, 0, 1.01, -0.008))
  for (const x of [-0.45, 0.45]) passagem.add(mesh(new THREE.BoxGeometry(0.055, 2.08, 0.065), matTrilho, x, 1.04, 0))
  passagem.add(mesh(new THREE.BoxGeometry(0.96, 0.055, 0.065), matTrilho, 0, 2.055, 0))
  scene.add(passagem)

  const portaSecreta = criarPorta(0.8, 1.96)
  portaSecreta.position.set(-META_X + 0.04, 0, ESTANTE.z)
  portaSecreta.rotation.y = Math.PI / 2
  portaSecreta.userData = { tipo: "porta", ref: refPortaDino }
  scene.add(portaSecreta)
  const luzSecreta = new THREE.PointLight(0x72a488, 0, 2.45, 2)
  luzSecreta.position.set(-META_X + 0.48, 1.02, ESTANTE.z)
  scene.add(luzSecreta)

  const trilhoBaixo = mesh(new THREE.BoxGeometry(0.035, 0.018, ESTANTE.profundidade + 1.16), matTrilho, -META_X + 0.19, 0.012, ESTANTE.z - 0.54)
  trilhoBaixo.visible = false
  scene.add(trilhoBaixo)

  // ---------- ilha e lugares à mesa ----------
  const corpoIlha = new THREE.Mesh(new THREE.BoxGeometry(ILHA.largura - 0.12, ILHA.altura - 0.08, ILHA.profundidade - 0.1), matArmario)
  corpoIlha.position.set(ILHA.x, (ILHA.altura - 0.08) / 2 + 0.08, ILHA.z)
  corpoIlha.castShadow = true
  corpoIlha.receiveShadow = true
  scene.add(corpoIlha)
  const tampoIlha = new THREE.Mesh(new THREE.BoxGeometry(ILHA.largura, TAMPO_ESP, ILHA.profundidade), matTampo)
  tampoIlha.position.set(ILHA.x, ILHA.altura + TAMPO_ESP / 2, ILHA.z)
  tampoIlha.castShadow = true
  tampoIlha.receiveShadow = true
  scene.add(tampoIlha)
  obstaculos.push(caixa(ILHA.x, ILHA.z, ILHA.largura, ILHA.profundidade))

  const matBanco = new THREE.MeshStandardMaterial({ map: TEX.madeiraEscura(), color: 0x5d5245, roughness: 0.86 })
  for (const bancoPos of BANCOS) {
    const assento = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.045, 18), matBanco)
    assento.position.set(bancoPos.x, 0.62, bancoPos.z)
    assento.castShadow = true
    scene.add(assento)
    for (const [dx, dz] of [[-0.11, -0.08], [0.11, -0.08], [-0.11, 0.08], [0.11, 0.08]]) {
      const perna = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.59, 8), matMetalFosco)
      perna.position.set(bancoPos.x + dx, 0.305, bancoPos.z + dz)
      scene.add(perna)
    }
    obstaculos.push(cilindro(bancoPos.x, bancoPos.z, 0.19))
  }

  // Easter egg quase sob o banco leste, no estreito intervalo entre assento e
  // ilha. O banco e o corpo da ilha o ocluem do spawn; ele só aparece quando
  // alguém contorna o móvel e deliberadamente olha para o chão entre as pernas.
  const { grupo: miniDino, material: materialMiniDino } = criarMiniDino()
  miniDino.position.set(-0.12, 0.012, 0.585)
  miniDino.rotation.y = -0.24
  miniDino.userData = { tipo: "dino", ref: refDino }
  scene.add(miniDino)
  interativos.push(miniDino)

  // Terceiro sinal familiar: o terceiro lugar existe apenas como marca de uso.
  const marcaLugar = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.012, 7, 28), matPoeira)
  marcaLugar.rotation.x = Math.PI / 2
  marcaLugar.position.set(LUGAR_AUSENTE.x, 0.008, LUGAR_AUSENTE.z)
  marcaLugar.scale.y = 0.78
  scene.add(marcaLugar)

  // ---------- luminária pendente sobre a ilha ----------
  const matCupula = new THREE.MeshStandardMaterial({
    color: 0x2c2822,
    roughness: 0.6,
    metalness: 0.3,
    side: THREE.DoubleSide,
  })
  const cupula = new THREE.Mesh(new THREE.ConeGeometry(0.19, 0.16, 24, 1, true), matCupula)
  cupula.position.set(ILHA.x, PE_DIREITO - 0.42, ILHA.z)
  cupula.rotation.x = Math.PI
  scene.add(cupula)
  const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.36, 6), matCupula)
  haste.position.set(ILHA.x, PE_DIREITO - 0.18, ILHA.z)
  scene.add(haste)
  const lampada = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 12, 10),
    new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffc477, emissiveIntensity: 2.4 }),
  )
  lampada.position.set(ILHA.x, PE_DIREITO - 0.47, ILHA.z)
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

  const pendente = new THREE.PointLight(0xffc98a, 9, 8.6, 2)
  pendente.position.set(ILHA.x, PE_DIREITO - 0.5, ILHA.z)
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
    { pos: [BANCADA_PIA.x, 1.54, -META_Z + 0.28], alvo: [BANCADA_PIA.x, ALTURA_TAMPO, BANCADA_PIA.z], i: 3.8 },
    { pos: [BANCADA_APOIO.x, 1.54, -META_Z + 0.28], alvo: [BANCADA_APOIO.x, ALTURA_TAMPO, BANCADA_APOIO.z], i: 3.2 },
    { pos: [META_X - 0.38, 1.54, BANCADA_FRIA.z], alvo: [BANCADA_FRIA.x, ALTURA_TAMPO, BANCADA_FRIA.z], i: 3.0 },
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
  luzVao.position.set(PORTA_OFFSET_X, 1.85, -META_Z + 0.38)
  scene.add(luzVao)

  // luz de apoio junto à estante, pra ela não virar um bloco preto
  const luzEstante = new THREE.PointLight(0xffd7a4, 0.9, 2.8, 2)
  luzEstante.position.set(-META_X + 0.62, 1.38, ESTANTE.z)
  scene.add(luzEstante)

  // ---------- porta ----------
  const larguraFolha = LARGURA_PORTA - 0.06
  const portaFolha = criarPorta(larguraFolha, ALTURA_PORTA - 0.04)
  const portaGrupo = new THREE.Group()
  // criarPorta nasce centralizada; deslocar a folha deixa a origem do grupo
  // exatamente na dobradiça. A abertura negativa traz a porta para dentro da
  // Cozinha e o pequeno recuo elimina o contato com a espessura da parede.
  portaFolha.position.x = larguraFolha / 2
  portaGrupo.add(portaFolha)
  portaGrupo.position.set(bordaEsqPorta + 0.03, 0, -META_Z + 0.025)
  portaGrupo.rotation.y = -0.34
  portaGrupo.userData = { tipo: "porta", ref: porta }
  scene.add(portaGrupo)
  interativos.push(portaGrupo)

  // A troca de sala acontece pelo clique e pelo fade, não atravessando
  // fisicamente a folha. O bloqueio fino impede o jogador de passar pelo
  // vão enquanto mira a porta, sem ocupar a área de entrada da Cozinha.
  const bloqueioProvisorioDoVao = caixa(PORTA_OFFSET_X, -META_Z, LARGURA_PORTA, e)
  obstaculos.push(bloqueioProvisorioDoVao)

  // ---------- posições dos objetos ----------
  // Posições explícitas aqui são deliberadas: cada objeto pertence a uma
  // função espacial concreta, e mudar a arquitetura não deve redistribuí-los
  // automaticamente para um trecho narrativamente incoerente.
  const POSICOES = {
    // preparo junto à pia
    faca: { x: -0.58, y: ALTURA_TAMPO, z: BANCADA_PIA.z + 0.02, rotY: 0 },
    tabua: { x: -0.3, y: ALTURA_TAMPO, z: BANCADA_PIA.z, rotY: 0 },
    tesoura: { x: 0.01, y: ALTURA_TAMPO, z: BANCADA_PIA.z + 0.01, rotY: 0.12 },

    // utensílios associados ao fogão que não está mais ali
    amolador: { x: 1.02, y: ALTURA_TAMPO, z: BANCADA_APOIO.z, rotY: 0 },
    espeto: { x: 1.34, y: ALTURA_TAMPO, z: BANCADA_APOIO.z, rotY: 0 },
    panela: { x: 1.58, y: ALTURA_TAMPO, z: BANCADA_APOIO.z, rotY: 0 },
    mancha: { x: VAO_FOGAO.x, y: 0.004, z: VAO_FOGAO.z + 0.01, rotY: 0.04 },

    // ponto frio isolado no retorno lateral
    gelo: { x: BANCADA_FRIA.x, y: ALTURA_TAMPO, z: BANCADA_FRIA.z, rotY: Math.PI / 2 },

    // cotidiano interrompido sobre a ilha
    garfo: { x: -0.73, y: ILHA.altura + TAMPO_ESP, z: -0.01, rotY: 0 },
    pratovazio: { x: -0.35, y: ILHA.altura + TAMPO_ESP, z: -0.01, rotY: 0 },
    toalha: { x: 0.08, y: ILHA.altura + TAMPO_ESP, z: 0.23, rotY: -0.08 },
    copo: { x: 0.38, y: ILHA.altura + TAMPO_ESP, z: -0.11, rotY: 0 },

    // registro doméstico guardado como se ainda tivesse uso
    caderno: { x: -META_X + 0.23, y: 0.78, z: -0.52, rotY: Math.PI / 2 },
    etiqueta: { x: -META_X + 0.23, y: 1.18, z: 0.08, rotY: Math.PI / 2 },
    relogio: { x: -META_X + 0.23, y: 1.58, z: 0.5, rotY: Math.PI / 2 },
    camera: { x: -META_X + 0.23, y: 1.58, z: -0.5, rotY: Math.PI / 2 },
  }

  objetos.forEach((o) => {
    const p = POSICOES[o.id]
    if (!p) {
      console.warn(`[3d] objeto "${o.id}" existe em dados.js mas não tem posição na Cozinha`)
      return
    }
    const modelo = criarModelo(o.id)
    const pertenceAEstante = ["caderno", "etiqueta", "relogio", "camera"].includes(o.id)
    modelo.position.set(
      p.x - (pertenceAEstante ? ESTANTE.x : 0),
      p.y,
      p.z - (pertenceAEstante ? ESTANTE.z : 0),
    )
    modelo.rotation.y = p.rotY || 0
    modelo.userData = { tipo: "objeto", ref: o, decalque: DECALQUES.has(o.id) }
    if (pertenceAEstante) estanteMovel.add(modelo)
    else scene.add(modelo)
    interativos.push(modelo)
  })

  let dinoAcionado = false
  let deslocamentoEstante = 0
  let portaDinoLiberada = false
  let tempoDino = 0
  const deslocamentoMaximo = 1.12

  function ativarDino() {
    if (dinoAcionado) return false
    dinoAcionado = true
    trilhoBaixo.visible = true
    materialMiniDino.emissive.set(0x263629)
    materialMiniDino.emissiveIntensity = 0.28
    miniDino.rotation.z = -0.075
    return true
  }

  return {
    id: "cozinha",
    data: salaData,
    porta,
    obstaculos,
    interativos,
    // spawn: setor sudoeste, com visão diagonal da ilha e da parede principal
    spawn: { x: -1.85, y: 1.65, z: 1.38, olharY: -0.7 },
    // O zumbido parece vir de dentro da parede leste, perto do trecho
    // anormalmente frio da bancada. A fonte fica além da face visível.
    fonteSom: { x: META_X + 0.18, y: 0.48, z: BANCADA_FRIA.z },
    limites: { peDireito: PE_DIREITO },
    ativarDino,
    atualizar(delta) {
      if (!dinoAcionado) return
      tempoDino += delta
      deslocamentoEstante = Math.min(deslocamentoMaximo, deslocamentoEstante + delta * 0.34)
      const progresso = deslocamentoEstante / deslocamentoMaximo
      const deslocamento = deslocamentoMaximo * (1 - Math.pow(1 - progresso, 3))
      estanteMovel.position.z = ESTANTE.z - deslocamento
      colisorEstante.minZ = ESTANTE.z - deslocamento - ESTANTE.profundidade / 2
      colisorEstante.maxZ = ESTANTE.z - deslocamento + ESTANTE.profundidade / 2
      luzSecreta.intensity = Math.max(0, (deslocamento - 0.28) * 2.1)
      materialMiniDino.emissiveIntensity = 0.18 + (Math.sin(tempoDino * 3.8) + 1) * 0.055
      if (deslocamentoEstante >= 1.02 && !portaDinoLiberada) {
        portaDinoLiberada = true
        interativos.push(portaSecreta)
      }
    },
  }
}
