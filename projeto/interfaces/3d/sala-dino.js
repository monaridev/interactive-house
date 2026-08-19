import * as THREE from "three"
import { caixa, cilindro } from "./colisao.js"
import { criarPorta } from "./modelos.js"
import { TEX } from "./texturas.js"

// Área bônus autocontida: não consulta Vestígios, não decide rota e não
// alimenta o dossiê. Usa somente o contrato comum de uma sala 3D.
const LARGURA = 6.4
const COMPRIMENTO = 6.2
const PE_DIREITO = 2.9
const ESPESSURA = 0.16

function mesh(geometria, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const objeto = new THREE.Mesh(geometria, material)
  objeto.position.set(x, y, z)
  objeto.rotation.set(rx, ry, rz)
  objeto.castShadow = true
  objeto.receiveShadow = true
  return objeto
}

function texturaAviso() {
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 320
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#151c1c"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#26302e"
  ctx.fillRect(18, 18, canvas.width - 36, canvas.height - 36)
  ctx.strokeStyle = "#6b7f78"
  ctx.lineWidth = 5
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60)
  ctx.fillStyle = "#d7d4b7"
  ctx.font = "bold 62px Courier New, monospace"
  ctx.fillText("DINO TECH", 74, 112)
  ctx.fillStyle = "#89aaa0"
  ctx.font = "27px Courier New, monospace"
  ctx.fillText("HABITAT DE COMPATIBILIDADE  /  DT-H03", 74, 174)
  ctx.fillStyle = "#a4aaa3"
  ctx.font = "23px Courier New, monospace"
  ctx.fillText("SETOR NÃO CATALOGADO  ·  ACESSO PRESERVADO", 74, 224)
  ctx.fillStyle = "#c9895c"
  ctx.fillRect(74, 260, 224, 12)
  ctx.fillStyle = "#607b72"
  ctx.fillRect(314, 260, 548, 12)
  const textura = new THREE.CanvasTexture(canvas)
  textura.colorSpace = THREE.SRGBColorSpace
  textura.anisotropy = 4
  return textura
}

function texturaPele() {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#847858"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  let estado = 918273
  const aleatorio = () => {
    estado = (estado * 1664525 + 1013904223) >>> 0
    return estado / 4294967296
  }
  for (let i = 0; i < 260; i++) {
    const x = aleatorio() * canvas.width
    const y = aleatorio() * canvas.height
    const r = 1.5 + aleatorio() * 5
    ctx.fillStyle = i % 3 === 0 ? "rgba(40,55,43,.12)" : "rgba(214,190,132,.07)"
    ctx.beginPath()
    ctx.ellipse(x, y, r * 1.8, r, aleatorio() * Math.PI, 0, Math.PI * 2)
    ctx.fill()
  }
  for (let i = 0; i < 7; i++) {
    const x = 54 + i * 58
    const gradiente = ctx.createLinearGradient(x - 18, 0, x + 25, 0)
    gradiente.addColorStop(0, "rgba(37,53,43,0)")
    gradiente.addColorStop(0.5, "rgba(37,53,43,.16)")
    gradiente.addColorStop(1, "rgba(37,53,43,0)")
    ctx.fillStyle = gradiente
    ctx.fillRect(x - 18, 0, 43, 150)
  }
  ctx.strokeStyle = "rgba(229,211,165,.07)"
  ctx.lineWidth = 1
  for (let i = 0; i < 44; i++) {
    const y = 10 + i * 5.4
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.bezierCurveTo(150, y + 3, 340, y - 3, canvas.width, y + 1)
    ctx.stroke()
  }
  const textura = new THREE.CanvasTexture(canvas)
  textura.colorSpace = THREE.SRGBColorSpace
  textura.wrapS = THREE.RepeatWrapping
  textura.wrapT = THREE.RepeatWrapping
  textura.anisotropy = 4
  return textura
}

// Superfície contínua por perfis. Raios independentes permitem esculpir as
// massas anatômicas com poucas centenas de vértices e normais suaves.
function perfilX(secoes, segmentos = 14) {
  const posicoes = []
  const uvs = []
  const indices = []
  for (let i = 0; i < secoes.length; i++) {
    const s = secoes[i]
    for (let j = 0; j < segmentos; j++) {
      const a = j / segmentos * Math.PI * 2
      posicoes.push(s.x, s.y + Math.cos(a) * s.ry, s.z + Math.sin(a) * s.rz)
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
  // As extremidades fechadas são essenciais nos volumes que podem ser
  // observados de frente. Sem estas tampas, focinho, cauda e pés viravam
  // anéis vazios quando a câmera se alinhava ao eixo da malha.
  const centroInicial = posicoes.length / 3
  const primeira = secoes[0]
  posicoes.push(primeira.x, primeira.y, primeira.z)
  uvs.push(0, 0.5)
  const centroFinal = posicoes.length / 3
  const ultima = secoes[secoes.length - 1]
  posicoes.push(ultima.x, ultima.y, ultima.z)
  uvs.push(1, 0.5)
  const anelFinal = (secoes.length - 1) * segmentos
  for (let j = 0; j < segmentos; j++) {
    const n = (j + 1) % segmentos
    indices.push(centroInicial, j, n)
    indices.push(centroFinal, anelFinal + n, anelFinal + j)
  }
  const geometria = new THREE.BufferGeometry()
  geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3))
  geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometria.setIndex(indices)
  geometria.computeVertexNormals()
  return geometria
}

// Contorno facetado e assimétrico no eixo vertical: testa larga, laterais
// temporais marcadas e região inferior mais estreita. Mantém a malha leve,
// mas elimina a seção circular que fazia a cabeça parecer um brinquedo.
const CONTORNO_CRANIO = [
  { z: 0, y: 1 }, { z: 0.58, y: 0.94 }, { z: 0.92, y: 0.58 },
  { z: 1, y: 0.08 }, { z: 0.82, y: -0.58 }, { z: 0.45, y: -0.92 },
  { z: 0, y: -1 }, { z: -0.45, y: -0.92 }, { z: -0.82, y: -0.58 },
  { z: -1, y: 0.08 }, { z: -0.92, y: 0.58 }, { z: -0.58, y: 0.94 },
]

function perfilAnatomicoX(secoes, contorno = CONTORNO_CRANIO) {
  const posicoes = []
  const uvs = []
  const indices = []
  const segmentos = contorno.length
  for (let i = 0; i < secoes.length; i++) {
    const s = secoes[i]
    for (let j = 0; j < segmentos; j++) {
      const p = contorno[j]
      posicoes.push(s.x, s.y + p.y * s.h, s.z + p.z * s.w)
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
      indices.push(a, b, c, b, d, c)
    }
  }
  const centroFinal = posicoes.length / 3
  const ultima = secoes[secoes.length - 1]
  posicoes.push(ultima.x, ultima.y, ultima.z)
  uvs.push(1, 0.5)
  const anelFinal = (secoes.length - 1) * segmentos
  for (let j = 0; j < segmentos; j++) {
    const n = (j + 1) % segmentos
    indices.push(centroFinal, anelFinal + n, anelFinal + j)
    indices.push(centroFinal, anelFinal + j, anelFinal + n)
  }
  const geometria = new THREE.BufferGeometry()
  geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3))
  geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometria.setIndex(indices)
  geometria.computeVertexNormals()
  return geometria
}

function perfilVertical(secoes, segmentos = 12) {
  const posicoes = []
  const uvs = []
  const indices = []
  for (let i = 0; i < secoes.length; i++) {
    const s = secoes[i]
    for (let j = 0; j < segmentos; j++) {
      const a = j / segmentos * Math.PI * 2
      posicoes.push(s.x + Math.cos(a) * s.rx, s.y, s.z + Math.sin(a) * s.rz)
      uvs.push(j / segmentos, i / (secoes.length - 1))
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
  const centroInicial = posicoes.length / 3
  const primeira = secoes[0]
  posicoes.push(primeira.x, primeira.y, primeira.z)
  uvs.push(0.5, 0)
  const centroFinal = posicoes.length / 3
  const ultima = secoes[secoes.length - 1]
  posicoes.push(ultima.x, ultima.y, ultima.z)
  uvs.push(0.5, 1)
  const anelFinal = (secoes.length - 1) * segmentos
  for (let j = 0; j < segmentos; j++) {
    const n = (j + 1) % segmentos
    indices.push(centroInicial, j, n)
    indices.push(centroFinal, anelFinal + n, anelFinal + j)
  }
  const geometria = new THREE.BufferGeometry()
  geometria.setAttribute("position", new THREE.Float32BufferAttribute(posicoes, 3))
  geometria.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2))
  geometria.setIndex(indices)
  geometria.computeVertexNormals()
  return geometria
}

function criarPlanta(materialFolha, materialCaule, escala = 1, inclinacao = 0) {
  const grupo = new THREE.Group()
  const formaFolha = new THREE.Shape()
  formaFolha.moveTo(0, -0.2)
  formaFolha.bezierCurveTo(-0.17, -0.08, -0.17, 0.16, 0, 0.28)
  formaFolha.bezierCurveTo(0.17, 0.16, 0.17, -0.08, 0, -0.2)
  const geometriaFolha = new THREE.ShapeGeometry(formaFolha, 5)
  const alturas = [0.48, 0.68, 0.84]
  for (let i = 0; i < 3; i++) {
    grupo.add(mesh(new THREE.CylinderGeometry(0.012, 0.024, alturas[i], 7), materialCaule, (i - 1) * 0.055, alturas[i] / 2, i % 2 ? 0.025 : -0.025, 0, 0, inclinacao + (i - 1) * 0.08))
    for (let j = 0; j < 3; j++) {
      const angulo = i * 1.7 + j * 2.05
      const folha = mesh(geometriaFolha, materialFolha, Math.cos(angulo) * 0.13 + (i - 1) * 0.055, alturas[i] * (0.62 + j * 0.12), Math.sin(angulo) * 0.13, 0.12, -angulo, Math.cos(angulo) * 0.28)
      folha.scale.set(0.72, 0.72 + j * 0.08, 1)
      grupo.add(folha)
    }
  }
  grupo.scale.setScalar(escala)
  return grupo
}

// Terópode semi-realista: as primitivas ficam restritas a olhos, dentes e
// garras; torso, cauda, pescoço, cabeça e membros são superfícies integradas.
function criarDinossauro(materiais) {
  const { pele, ventre, peleEscura, olho, garra, boca } = materiais
  const grupo = new THREE.Group()
  const corpo = new THREE.Mesh(perfilX([
    { x: -1.82, y: 1.08, z: 0, ry: 0.018, rz: 0.018 },
    { x: -1.58, y: 1.1, z: 0, ry: 0.075, rz: 0.07 },
    { x: -1.3, y: 1.14, z: 0, ry: 0.17, rz: 0.15 },
    { x: -0.94, y: 1.19, z: 0, ry: 0.31, rz: 0.27 },
    { x: -0.58, y: 1.22, z: 0, ry: 0.46, rz: 0.38 },
    { x: -0.18, y: 1.2, z: 0, ry: 0.5, rz: 0.41 },
    { x: 0.22, y: 1.22, z: 0, ry: 0.43, rz: 0.36 },
    { x: 0.52, y: 1.3, z: 0, ry: 0.31, rz: 0.28 },
    { x: 0.68, y: 1.38, z: 0, ry: 0.23, rz: 0.22 },
  ], 16), pele)
  corpo.castShadow = true
  corpo.receiveShadow = true
  grupo.add(corpo)

  const pescoco = new THREE.Mesh(perfilX([
    { x: 0.5, y: 1.31, z: 0, ry: 0.3, rz: 0.27 },
    { x: 0.68, y: 1.48, z: 0, ry: 0.23, rz: 0.22 },
    { x: 0.82, y: 1.63, z: 0, ry: 0.2, rz: 0.2 },
    { x: 0.96, y: 1.71, z: 0, ry: 0.21, rz: 0.23 },
  ], 16), pele)
  pescoco.castShadow = true
  grupo.add(pescoco)

  const materialCranio = pele.clone()
  const cranio = new THREE.Mesh(perfilAnatomicoX([
    { x: 0.9, y: 1.72, z: 0, h: 0.17, w: 0.23 },
    { x: 1.07, y: 1.77, z: 0, h: 0.18, w: 0.27 },
    { x: 1.24, y: 1.78, z: 0, h: 0.195, w: 0.32 },
    { x: 1.4, y: 1.74, z: 0, h: 0.15, w: 0.26 },
    { x: 1.57, y: 1.69, z: 0, h: 0.13, w: 0.185 },
    { x: 1.7, y: 1.65, z: 0, h: 0.082, w: 0.135 },
  ]), materialCranio)
  cranio.castShadow = true
  grupo.add(cranio)

  const contornoMandibula = [
    { z: 0, y: 1 }, { z: 0.78, y: 0.82 }, { z: 1, y: 0.22 },
    { z: 0.9, y: -0.72 }, { z: 0.5, y: -1 }, { z: 0, y: -1 },
    { z: -0.5, y: -1 }, { z: -0.9, y: -0.72 }, { z: -1, y: 0.22 },
    { z: -0.78, y: 0.82 },
  ]
  const materialMandibula = ventre.clone()
  const mandibula = new THREE.Mesh(perfilAnatomicoX([
    { x: 0.99, y: 1.55, z: 0, h: 0.105, w: 0.245 },
    { x: 1.28, y: 1.545, z: 0, h: 0.09, w: 0.23 },
    { x: 1.55, y: 1.55, z: 0, h: 0.06, w: 0.175 },
    { x: 1.69, y: 1.57, z: 0, h: 0.035, w: 0.125 },
  ], contornoMandibula), materialMandibula)
  mandibula.castShadow = true
  grupo.add(mandibula)

  for (const lado of [-1, 1]) {
    const perna = new THREE.Mesh(perfilVertical([
      { x: -0.42, y: 1.22, z: lado * 0.31, rx: 0.27, rz: 0.24 },
      { x: -0.2, y: 0.95, z: lado * 0.33, rx: 0.25, rz: 0.22 },
      { x: 0.02, y: 0.72, z: lado * 0.31, rx: 0.17, rz: 0.15 },
      { x: -0.06, y: 0.46, z: lado * 0.3, rx: 0.115, rz: 0.105 },
      { x: 0.06, y: 0.23, z: lado * 0.29, rx: 0.075, rz: 0.07 },
      { x: 0.2, y: 0.1, z: lado * 0.285, rx: 0.055, rz: 0.052 },
    ], 13), pele)
    perna.castShadow = true
    grupo.add(perna)
    const pe = new THREE.Mesh(perfilX([
      { x: 0.12, y: 0.105, z: lado * 0.285, ry: 0.065, rz: 0.105 },
      { x: 0.36, y: 0.09, z: lado * 0.285, ry: 0.055, rz: 0.12 },
      { x: 0.57, y: 0.072, z: lado * 0.285, ry: 0.022, rz: 0.1 },
    ], 11), pele)
    pe.castShadow = true
    grupo.add(pe)
    for (let i = -1; i <= 1; i++) grupo.add(mesh(new THREE.ConeGeometry(0.027, 0.17, 7), garra, 0.63, 0.075, lado * 0.285 + i * 0.073, 0, 0, -Math.PI / 2))

    const braco = new THREE.Mesh(perfilVertical([
      { x: 0.55, y: 1.4, z: lado * 0.22, rx: 0.065, rz: 0.055 },
      { x: 0.68, y: 1.21, z: lado * 0.235, rx: 0.048, rz: 0.043 },
      { x: 0.86, y: 1.12, z: lado * 0.245, rx: 0.03, rz: 0.028 },
      { x: 1.0, y: 1.1, z: lado * 0.245, rx: 0.014, rz: 0.014 },
    ], 10), pele)
    braco.castShadow = true
    grupo.add(braco)
    for (const deslocamento of [-0.026, 0.026]) grupo.add(mesh(new THREE.ConeGeometry(0.012, 0.1, 6), garra, 1.055, 1.09, lado * 0.245 + deslocamento, 0, 0, -Math.PI / 2))

    const formaOrbita = new THREE.Shape()
    formaOrbita.moveTo(-0.058, 0.022)
    formaOrbita.lineTo(0.052, 0.016)
    formaOrbita.lineTo(0.045, -0.026)
    formaOrbita.lineTo(-0.042, -0.032)
    formaOrbita.closePath()
    const rotacaoOrbita = lado > 0 ? 1.24 : Math.PI - 1.24
    const cavidade = mesh(new THREE.ShapeGeometry(formaOrbita), peleEscura, 1.66, 1.76, lado * 0.11, 0, rotacaoOrbita)
    cavidade.rotation.z = -lado * 0.12
    grupo.add(cavidade)

    const formaOlho = new THREE.Shape()
    formaOlho.moveTo(-0.017, 0)
    formaOlho.lineTo(0, 0.007)
    formaOlho.lineTo(0.019, 0)
    formaOlho.lineTo(0, -0.007)
    formaOlho.closePath()
    const iris = mesh(new THREE.ShapeGeometry(formaOlho), olho, 1.66, 1.758, lado * 0.11, 0, rotacaoOrbita)
    iris.rotation.z = -lado * 0.12
    const normalOrbita = new THREE.Vector3(Math.sin(rotacaoOrbita), 0, Math.cos(rotacaoOrbita))
    iris.position.addScaledVector(normalOrbita, 0.006)
    grupo.add(iris)

    // A órbita continua pelas laterais do crânio. O segundo plano é quase
    // invisível de frente, mas preserva a leitura do olho quando o visitante
    // contorna o animal e observa o perfil.
    const formaOrbitaLateral = new THREE.Shape()
    formaOrbitaLateral.moveTo(-0.06, 0.018)
    formaOrbitaLateral.lineTo(0.05, 0.012)
    formaOrbitaLateral.lineTo(0.042, -0.026)
    formaOrbitaLateral.lineTo(-0.046, -0.03)
    formaOrbitaLateral.closePath()
    const rotacaoLateral = lado > 0 ? 0 : Math.PI
    grupo.add(mesh(new THREE.ShapeGeometry(formaOrbitaLateral), peleEscura, 1.4, 1.79, lado * 0.258, 0, rotacaoLateral))
    const olhoLateral = mesh(new THREE.ShapeGeometry(formaOlho), olho, 1.415, 1.788, lado * 0.26, 0, rotacaoLateral)
    grupo.add(olhoLateral)

    const linhaBoca = new THREE.CatmullRomCurve3([
      new THREE.Vector3(1.08, 1.63, lado * 0.235),
      new THREE.Vector3(1.34, 1.625, lado * 0.218),
      new THREE.Vector3(1.66, 1.625, lado * 0.135),
    ])
    grupo.add(new THREE.Mesh(new THREE.TubeGeometry(linhaBoca, 12, 0.009, 5, false), boca))
    for (let i = 0; i < 4; i++) {
      const dente = mesh(new THREE.ConeGeometry(0.012, 0.052, 7), garra, 1.15 + i * 0.108, 1.615, lado * 0.205)
      dente.rotation.z = Math.PI
      grupo.add(dente)
    }
  }

  // Narinas angulares reforçam o eixo do focinho sem devolver ao rosto a
  // linguagem de esferas e círculos.
  for (const lado of [-1, 1]) {
    const formaNarina = new THREE.Shape()
    formaNarina.moveTo(-0.018, 0)
    formaNarina.lineTo(0.006, 0.012)
    formaNarina.lineTo(0.021, -0.003)
    formaNarina.lineTo(-0.004, -0.011)
    formaNarina.closePath()
    const rotacao = lado > 0 ? 1.15 : Math.PI - 1.15
    grupo.add(mesh(new THREE.ShapeGeometry(formaNarina), boca, 1.69, 1.69, lado * 0.105, 0, rotacao))
  }
  grupo.add(mesh(new THREE.BoxGeometry(0.01, 0.006, 0.17), boca, 1.706, 1.615, 0))
  for (const z of [-0.068, 0.068]) {
    const denteFrontal = mesh(new THREE.ConeGeometry(0.011, 0.048, 7), garra, 1.702, 1.585, z)
    denteFrontal.rotation.z = Math.PI
    grupo.add(denteFrontal)
  }
  const linhaDorsal = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.22, 1.31, 0),
    new THREE.Vector3(-0.7, 1.58, 0),
    new THREE.Vector3(-0.08, 1.7, 0),
    new THREE.Vector3(0.5, 1.55, 0),
  ])
  grupo.add(new THREE.Mesh(new THREE.TubeGeometry(linhaDorsal, 28, 0.022, 6, false), peleEscura))
  return grupo
}

export function construirSalaDino(scene) {
  const data = DATA.salas.salaDino
  const refPorta = data.objetos.find((objeto) => objeto.ehSaida)
  const obstaculos = []
  const interativos = []
  const mx = LARGURA / 2
  const mz = COMPRIMENTO / 2

  const parede = new THREE.MeshStandardMaterial({ map: TEX.parede(2, 2), color: 0x48504e, roughness: 0.96 })
  const piso = new THREE.MeshStandardMaterial({ map: TEX.pedra(3, 3), color: 0x555551, roughness: 0.8 })
  const metal = new THREE.MeshStandardMaterial({ map: TEX.metal(), color: 0x43514f, roughness: 0.5, metalness: 0.62 })
  const metalEscuro = new THREE.MeshStandardMaterial({ color: 0x171f20, roughness: 0.62, metalness: 0.58 })
  const solo = new THREE.MeshStandardMaterial({ color: 0x31281f, roughness: 1 })
  const rocha = new THREE.MeshStandardMaterial({ color: 0x625d50, roughness: 0.94 })
  const folha = new THREE.MeshStandardMaterial({ color: 0x58705c, roughness: 0.84, side: THREE.DoubleSide })
  const folhaEscura = new THREE.MeshStandardMaterial({ color: 0x35493f, roughness: 0.92, side: THREE.DoubleSide })
  const folhaOcre = new THREE.MeshStandardMaterial({ color: 0x76684b, roughness: 0.9, side: THREE.DoubleSide })
  const caule = new THREE.MeshStandardMaterial({ color: 0x5d573e, roughness: 0.96 })
  const pele = new THREE.MeshStandardMaterial({ map: texturaPele(), color: 0xd8cfb4, roughness: 0.69, metalness: 0.01 })
  const ventre = new THREE.MeshStandardMaterial({ color: 0xb4a77b, roughness: 0.72 })
  const peleEscura = new THREE.MeshStandardMaterial({ color: 0x34493e, roughness: 0.72 })
  const olho = new THREE.MeshStandardMaterial({ color: 0x171713, emissive: 0xd38b3c, emissiveIntensity: 0.5, roughness: 0.18 })
  const garra = new THREE.MeshStandardMaterial({ color: 0x8d856f, roughness: 0.52 })
  const boca = new THREE.MeshStandardMaterial({ color: 0x281916, roughness: 0.72 })

  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), piso, 0, 0, 0, -Math.PI / 2))
  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), metalEscuro, 0, PE_DIREITO, 0, Math.PI / 2))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), parede, -mx, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), parede, mx, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(LARGURA, PE_DIREITO, ESPESSURA), parede, 0, PE_DIREITO / 2, mz))
  scene.add(mesh(new THREE.BoxGeometry(LARGURA, PE_DIREITO, ESPESSURA), parede, 0, PE_DIREITO / 2, -mz))
  obstaculos.push(caixa(-mx, 0, ESPESSURA, COMPRIMENTO + ESPESSURA), caixa(mx, 0, ESPESSURA, COMPRIMENTO + ESPESSURA), caixa(0, mz, LARGURA, ESPESSURA), caixa(0, -mz, LARGURA, ESPESSURA))

  // Pórtico e vidro deixam claro que a natureza foi instalada dentro de uma
  // infraestrutura, não que a sala virou uma floresta genérica.
  const vidro = new THREE.MeshPhysicalMaterial({ color: 0x789c91, roughness: 0.16, metalness: 0.08, transparent: true, opacity: 0.12, transmission: 0.18, depthWrite: false })
  for (const x of [-2.45, 2.45]) {
    scene.add(mesh(new THREE.BoxGeometry(0.11, 2.45, 0.14), metal, x, 1.23, -mz + 0.16))
    scene.add(mesh(new THREE.BoxGeometry(0.08, 0.09, COMPRIMENTO - 0.52), metalEscuro, x, PE_DIREITO - 0.16, 0))
  }
  scene.add(mesh(new THREE.BoxGeometry(5.02, 0.12, 0.16), metal, 0, 2.45, -mz + 0.16))
  scene.add(mesh(new THREE.PlaneGeometry(4.68, 1.92), vidro, 0, 1.25, -mz + 0.24))

  const canteiro = mesh(new THREE.CircleGeometry(1.78, 56), solo, -0.06, 0.014, -0.5, -Math.PI / 2)
  canteiro.scale.set(1.34, 0.92, 1)
  scene.add(canteiro)
  const aroMaterial = new THREE.MeshStandardMaterial({ color: 0x81634c, emissive: 0x7d452c, emissiveIntensity: 0.42, roughness: 0.52, metalness: 0.3, side: THREE.DoubleSide })
  const aro = mesh(new THREE.RingGeometry(1.745, 1.81, 56), aroMaterial, -0.06, 0.025, -0.5, -Math.PI / 2)
  aro.scale.set(1.34, 0.92, 1)
  scene.add(aro)
  scene.add(mesh(new THREE.BoxGeometry(1.18, 0.035, 1.02), metalEscuro, 0, 0.02, 2.32))
  for (const x of [-0.48, 0.48]) scene.add(mesh(new THREE.BoxGeometry(0.055, 0.025, 1.7), aroMaterial, x, 0.046, 1.92))

  const pedras = [[-2.58, 1.72, 0.19], [-2.3, 1.52, 0.11], [2.56, 1.62, 0.21], [2.28, 1.8, 0.1], [-2.52, -1.3, 0.14], [2.58, -1.16, 0.16], [-2.22, -2.28, 0.13], [2.3, -2.18, 0.14], [0.25, -2.55, 0.1]]
  for (const [x, z, r] of pedras) {
    const pedra = mesh(new THREE.DodecahedronGeometry(r, 1), rocha, x, r * 0.42, z)
    pedra.scale.set(1.35, 0.55, 0.9)
    pedra.rotation.y = x * 0.8 + z
    scene.add(pedra)
  }

  const clusters = [
    { x: -2.62, z: 1.62, s: 0.9, m: folhaEscura },
    { x: 2.62, z: 1.54, s: 0.96, m: folhaOcre },
    { x: -2.42, z: -2.12, s: 1.1, m: folha },
    { x: 2.44, z: -2.04, s: 1.02, m: folhaEscura },
    { x: 0.18, z: -2.63, s: 0.68, m: folhaOcre },
  ]
  for (const [i, p] of clusters.entries()) {
    const planta = criarPlanta(p.m, caule, p.s, (i - 2) * 0.035)
    planta.position.set(p.x, 0, p.z)
    planta.rotation.y = i * 0.92
    scene.add(planta)
    obstaculos.push(cilindro(p.x, p.z, 0.15 * p.s))
  }

  const dino = criarDinossauro({ pele, ventre, peleEscura, olho, garra, boca })
  dino.position.set(-0.04, 0.015, -0.56)
  dino.rotation.y = -0.1
  dino.scale.setScalar(0.81)
  scene.add(dino)
  // Quatro volumes acompanham as massas reais do animal. O jogador não
  // atravessa torso/cabeça, mas a cauda afilada não cria uma parede invisível
  // que roubaria as duas faixas de circulação laterais.
  obstaculos.push(
    cilindro(-0.28, -0.59, 0.43),
    cilindro(0.28, -0.54, 0.38),
    cilindro(0.75, -0.49, 0.28),
    cilindro(-0.7, -0.63, 0.3),
  )

  scene.add(mesh(new THREE.BoxGeometry(2.62, 0.78, 0.09), metalEscuro, -0.36, 2.08, -mz + 0.225))
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(2.46, 0.62), new THREE.MeshBasicMaterial({ map: texturaAviso() }))
  placa.position.set(-0.36, 2.08, -mz + 0.278)
  scene.add(placa)

  const porta = criarPorta(0.84, 2.02)
  porta.position.set(0, 0, mz - 0.09)
  porta.rotation.y = Math.PI
  porta.userData = { tipo: "porta", ref: refPorta }
  scene.add(porta)
  interativos.push(porta)

  // Ambiente frio, chave quente no herói, recorte ciano e âmbar baixo.
  scene.add(new THREE.AmbientLight(0x3e4b49, 0.86))
  scene.add(new THREE.HemisphereLight(0x8daaa3, 0x33271e, 1.08))
  const luzTeto = new THREE.PointLight(0x8aa8a1, 3.5, 8.2, 2)
  luzTeto.position.set(0, 2.7, 0.3)
  scene.add(luzTeto)
  const materialCalha = new THREE.MeshStandardMaterial({ color: 0xc0c1b4, emissive: 0x9baaa4, emissiveIntensity: 1.5, roughness: 0.34 })
  scene.add(mesh(new THREE.BoxGeometry(2.05, 0.045, 0.14), materialCalha, -0.22, 2.76, 0.28))

  const chave = new THREE.SpotLight(0xf3c985, 18.2, 7.4, Math.PI / 4.25, 0.72, 1.55)
  chave.position.set(-1.5, 2.72, 1.32)
  chave.target.position.set(0.08, 1.0, -0.48)
  chave.castShadow = true
  chave.shadow.mapSize.set(768, 768)
  chave.shadow.bias = -0.002
  scene.add(chave)
  scene.add(chave.target)
  const recorte = new THREE.PointLight(0x54bdb5, 8.3, 6.0, 2)
  recorte.position.set(2.05, 1.72, -2.18)
  scene.add(recorte)
  const preenchimento = new THREE.PointLight(0x99af9e, 4.4, 5.4, 2)
  preenchimento.position.set(-2.18, 1.18, -0.72)
  scene.add(preenchimento)
  const frente = new THREE.SpotLight(0xd8c7a2, 6.2, 5.2, Math.PI / 5.2, 0.76, 1.6)
  frente.position.set(2.66, 2.08, 0.55)
  frente.target.position.set(0.98, 1.48, -0.5)
  scene.add(frente)
  scene.add(frente.target)
  const retorno = new THREE.PointLight(0xd58a56, 4.7, 4.8, 2)
  retorno.position.set(0, 0.36, 2.18)
  scene.add(retorno)
  for (const x of [-2.18, 2.18]) scene.add(mesh(new THREE.BoxGeometry(0.52, 0.035, 0.055), aroMaterial, x, 0.12, -2.82))

  let tempo = 0
  return {
    id: "salaDino",
    data,
    porta: refPorta,
    obstaculos,
    interativos,
    spawn: { x: 0, y: 1.65, z: 2.58, olharY: 0 },
    fonteSom: { x: 2.12, y: 0.68, z: -2.2 },
    limites: { peDireito: PE_DIREITO },
    ambiente: { fundo: 0x111918, nevoa: { cor: 0x1c2926, densidade: 0.035 } },
    atualizar(delta) {
      tempo += delta
      dino.rotation.y = -0.1 + Math.sin(tempo * 0.32) * 0.009
      olho.emissiveIntensity = 0.44 + (Math.sin(tempo * 0.62) + 1) * 0.045
      recorte.intensity = 7.8 + (Math.sin(tempo * 0.42) + 1) * 0.22
      aroMaterial.emissiveIntensity = 0.38 + (Math.sin(tempo * 0.36) + 1) * 0.04
    },
  }
}
