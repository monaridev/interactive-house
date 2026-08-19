import * as THREE from "three"
import { caixa } from "./colisao.js"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"
import { combinacoesRaras, intensidade } from "./vestigios.js"

// Ambiente C — vazio/ausência. A arquitetura continua navegável, mas as
// superfícies são compostas por planos desalinhados, sem virar um cenário
// fantástico: é um cômodo institucional que parece ter assentado errado.
const LARGURA = 4.45
const COMPRIMENTO = 6.2
const PE_DIREITO = 2.75
const ESPESSURA = 0.16

function mesh(geometria, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const objeto = new THREE.Mesh(geometria, material)
  objeto.position.set(x, y, z)
  objeto.rotation.set(rx, ry, rz)
  objeto.castShadow = true
  objeto.receiveShadow = true
  return objeto
}

function tornarAlvo(scene, ref, grupo) {
  grupo.userData = { tipo: ref.ehSaida ? "porta" : "objeto", ref }
  scene.add(grupo)
  return grupo
}

export function construirSalaC(scene, ctx = {}) {
  const data = DATA.salas.salaC
  const vestigios = ctx.vestigios
  const combinacoes = combinacoesRaras(vestigios, "salaC")
  const refs = Object.fromEntries(data.objetos.map((objeto) => [objeto.id, objeto]))
  const obstaculos = []
  const interativos = []
  const manifestacoes = []
  const mx = LARGURA / 2
  const mz = COMPRIMENTO / 2
  const intensidadeFrio = Math.min(intensidade(vestigios, "frio"), 5)

  const concreto = new THREE.MeshStandardMaterial({ map: TEX.parede(2, 3), color: 0xa0adb0, roughness: 0.94 })
  const concretoEscuro = new THREE.MeshStandardMaterial({ map: TEX.parede(2, 2), color: 0x667276, roughness: 1 })
  const piso = new THREE.MeshStandardMaterial({ map: TEX.piso(3, 4), color: 0x849194, roughness: 0.96 })
  const mancha = new THREE.MeshStandardMaterial({ color: 0x101516, roughness: 1, transparent: true, opacity: 0.82 })
  const umidade = new THREE.MeshStandardMaterial({ color: 0xaebfc2, roughness: 0.18, transparent: true, opacity: 0.38 })
  const poeira = new THREE.MeshStandardMaterial({ color: 0xc1cccd, emissive: 0x566366, emissiveIntensity: 0.35, transparent: true, opacity: 0.46 })
  const junta = new THREE.MeshStandardMaterial({ color: 0x394448, roughness: 0.96 })
  const marcaRemovida = new THREE.MeshStandardMaterial({ color: 0x9aa5a5, roughness: 1, transparent: true, opacity: 0.16 })

  // Chão em quatro placas com inclinações mínimas. A colisão permanece 2D,
  // então o desnível é visual e não interfere no movimento FPS.
  const placas = [
    [-1.12, 1.55, 0.018, -0.015], [1.12, 1.55, -0.014, 0.012],
    [-1.12, -1.55, -0.01, -0.012], [1.12, -1.55, 0.015, 0.016],
  ]
  for (const [x, z, rx, rz] of placas) scene.add(mesh(new THREE.PlaneGeometry(LARGURA / 2 + 0.04, COMPRIMENTO / 2 + 0.04), piso, x, 0, z, -Math.PI / 2 + rx, 0, rz))

  // O teto existe quase inteiro; a única interrupção é o módulo retirado
  // que forma o alvo de condensação mais abaixo.
  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), concretoEscuro, 0, PE_DIREITO, 0, Math.PI / 2))

  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), concreto, -mx, PE_DIREITO / 2, 0, 0, 0, -0.025))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), concreto, mx, PE_DIREITO / 2, 0, 0, 0, 0.018))
  scene.add(mesh(new THREE.BoxGeometry(LARGURA, PE_DIREITO, ESPESSURA), concreto, 0, PE_DIREITO / 2, mz))

  const portaL = 0.88
  const portaA = 2.04
  const sobra = (LARGURA - portaL) / 2
  scene.add(mesh(new THREE.BoxGeometry(sobra, PE_DIREITO, ESPESSURA), concreto, -(portaL + sobra) / 2, PE_DIREITO / 2, -mz))
  scene.add(mesh(new THREE.BoxGeometry(sobra, PE_DIREITO, ESPESSURA), concreto, (portaL + sobra) / 2, PE_DIREITO / 2, -mz))
  scene.add(mesh(new THREE.BoxGeometry(portaL, PE_DIREITO - portaA, ESPESSURA), concreto, 0, portaA + (PE_DIREITO - portaA) / 2, -mz))
  obstaculos.push(
    caixa(-mx, 0, ESPESSURA, COMPRIMENTO + ESPESSURA),
    caixa(mx, 0, ESPESSURA, COMPRIMENTO + ESPESSURA),
    caixa(0, mz, LARGURA, ESPESSURA),
    caixa(0, -mz, LARGURA, ESPESSURA),
  )

  // Rodapé interrompido e juntas largas tornam as superfícies intencionais
  // sem ocupar o vazio com novos móveis.
  for (const x of [-mx + 0.09, mx - 0.09]) {
    scene.add(mesh(new THREE.BoxGeometry(0.035, 0.12, COMPRIMENTO - 0.34), junta, x, 0.06, 0))
  }
  for (const z of [-1.55, 0, 1.55]) {
    scene.add(mesh(new THREE.BoxGeometry(LARGURA - 0.24, 0.012, 0.025), junta, 0, 0.015, z))
  }

  // Mancha e silhueta de algo alto removido. O contorno limpo e os pontos de
  // fixação têm tanto peso quanto a área escura: havia função antes do vazio.
  const paredeAlvo = new THREE.Group()
  paredeAlvo.add(mesh(new THREE.PlaneGeometry(0.82, 1.92), mancha, 0.002, 1.02, 0, 0, Math.PI / 2))
  paredeAlvo.add(mesh(new THREE.PlaneGeometry(0.58, 1.58), marcaRemovida, 0.006, 1.08, -0.02, 0, Math.PI / 2))
  for (const [y, z] of [[0.35, -0.27], [0.35, 0.27], [1.79, -0.27], [1.79, 0.27]]) {
    paredeAlvo.add(mesh(new THREE.CircleGeometry(0.027, 12), junta, 0.012, y, z, 0, Math.PI / 2))
  }
  for (let i = 0; i < 4; i++) {
    paredeAlvo.add(mesh(new THREE.BoxGeometry(0.012, 0.018, 0.68 - i * 0.07), mancha, 0.01, 0.14 + i * 0.08, 0.04, 0, 0.02))
  }
  paredeAlvo.position.set(-mx + 0.087, 0, -0.72)
  if (intensidade(vestigios, "corte") >= 2) {
    const linha = new THREE.MeshStandardMaterial({ color: 0x20282a, roughness: 0.96 })
    paredeAlvo.add(mesh(new THREE.BoxGeometry(0.012, 0.014, 0.86), linha, 0.01, 1.08, 0.02, 0.03, 0.02, 0.02))
  }
  if (intensidade(vestigios, "registro") >= 2) {
    const etiqueta = new THREE.MeshStandardMaterial({ color: 0x9ca6a2, roughness: 0.92 })
    paredeAlvo.add(mesh(new THREE.BoxGeometry(0.012, 0.18, 0.31), etiqueta, 0.012, 0.58, -0.18, 0, 0.04, -0.08))
  }
  tornarAlvo(scene, refs.parede, paredeAlvo)
  interativos.push(paredeAlvo)

  // As partículas ocupam apenas as arestas de um volume que não existe.
  // No centro não há nada para contornar; a ausência é a própria silhueta.
  const arAlvo = new THREE.Group()
  const particulaGeom = new THREE.SphereGeometry(0.018, 6, 5)
  for (let i = 0; i < 14; i++) {
    const lado = i % 2 === 0 ? -1 : 1
    const p = mesh(particulaGeom, poeira, 0.86 + lado * 0.32, 0.48 + (i % 7) * 0.2, 0.32 + ((i * 3) % 5 - 2) * 0.13)
    p.castShadow = false
    arAlvo.add(p)
  }
  tornarAlvo(scene, refs.ar, arAlvo)
  interativos.push(arAlvo)

  // Condensação sob a moldura vazia de uma luminária retirada.
  const tetoAlvo = new THREE.Group()
  tetoAlvo.add(mesh(new THREE.BoxGeometry(1.62, 0.07, 1.34), junta, 0, PE_DIREITO - 0.045, -1.3, 0, 0, 0.015))
  tetoAlvo.add(mesh(new THREE.PlaneGeometry(1.38, 1.08), marcaRemovida, 0, PE_DIREITO - 0.087, -1.3, Math.PI / 2 + 0.02))
  for (const x of [-0.63, 0.63]) for (const z of [-1.72, -0.88]) {
    tetoAlvo.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.055, 8), junta, x, PE_DIREITO - 0.13, z))
  }
  for (let i = 0; i < 12 + intensidadeFrio * 2; i++) {
    const camada = Math.floor(i / 12)
    const gota = mesh(new THREE.SphereGeometry(0.022 + (i % 3) * 0.006, 7, 6), umidade, -0.62 + (i % 4) * 0.4 + camada * 0.035, PE_DIREITO - 0.08 - (i % 2) * 0.025, -1.65 + (Math.floor(i / 4) % 3) * 0.36 + camada * 0.025)
    gota.scale.y = 1.65
    tetoAlvo.add(gota)
  }
  tornarAlvo(scene, refs.teto, tetoAlvo)
  interativos.push(tetoAlvo)

  // O chão interativo é uma área esbranquiçada próxima ao centro, não um
  // objeto acrescentado ao vazio.
  const chaoAlvo = new THREE.Group()
  const frio = mesh(new THREE.PlaneGeometry(1.35, 0.82), umidade, 0.78, 0.012, 0.62, -Math.PI / 2, 0, -0.025)
  chaoAlvo.add(frio)
  for (const x of [0.22, 1.34]) for (const z of [0.31, 0.93]) {
    chaoAlvo.add(mesh(new THREE.RingGeometry(0.025, 0.04, 12), junta, x, 0.016, z, -Math.PI / 2))
  }
  tornarAlvo(scene, refs.chao, chaoAlvo)
  interativos.push(chaoAlvo)

  // Uma área seca com proporções domésticas, mas sem móvel correspondente.
  if (intensidade(vestigios, "domestico") >= 3) {
    const seco = new THREE.MeshStandardMaterial({ color: 0x788183, roughness: 1, transparent: true, opacity: 0.36 })
    scene.add(mesh(new THREE.PlaneGeometry(0.92, 0.54), seco, 1.05, 0.014, -0.18, -Math.PI / 2, 0, 0.02))
    manifestacoes.push("piso:area-seca")
  }

  if (combinacoes.horaCondensada) {
    const gotaCircular = new THREE.MeshStandardMaterial({ color: 0xb7cccf, roughness: 0.16, transparent: true, opacity: 0.42 })
    for (let i = 0; i < 12; i++) {
      const angulo = (i / 12) * Math.PI * 2
      const gota = mesh(
        new THREE.SphereGeometry(0.017, 7, 6),
        gotaCircular,
        mx - 0.092,
        1.38 + Math.sin(angulo) * 0.29,
        -1.02 + Math.cos(angulo) * 0.29,
      )
      gota.scale.x = 0.45
      scene.add(gota)
    }
    manifestacoes.push("rara:horaCondensada")
  }

  const porta = criarPorta(portaL - 0.06, portaA - 0.04)
  porta.position.set(0, 0, -mz + 0.09)
  porta.userData = { tipo: "porta", ref: refs.porta }
  scene.add(porta)
  interativos.push(porta)

  scene.add(new THREE.HemisphereLight(0xb8cdd2, 0x303b3f, 0.88))
  scene.add(new THREE.AmbientLight(0x46565b, 0.62))
  const luzFria = new THREE.SpotLight(0xc4dce0, 6.2 + intensidadeFrio * 0.13, 6.5, Math.PI / 4.2, 0.68, 1.8)
  luzFria.position.set(-1.35, 2.35, -0.95)
  luzFria.target.position.set(0.78, 0, 0.62)
  luzFria.castShadow = true
  luzFria.shadow.mapSize.set(512, 512)
  scene.add(luzFria, luzFria.target)
  const luzEntrada = new THREE.PointLight(0x93aeb5, 3.6, 4.8, 2)
  luzEntrada.position.set(0.7, 1.45, 2.45)
  scene.add(luzEntrada)
  const preenchimento = new THREE.PointLight(0x78959d, 2.7, 5.2, 2)
  preenchimento.position.set(1.2, 0.85, 0.1)
  scene.add(preenchimento)
  const leitura = new THREE.PointLight(0x9fb9bf, 3.6, 5.6, 2)
  leitura.position.set(-0.25, 1.9, 1.55)
  scene.add(leitura)
  const recorte = new THREE.DirectionalLight(0xa9c1c6, 2.05)
  recorte.position.set(1.45, 2.35, 2.4)
  recorte.target.position.set(-0.25, 0.8, -0.45)
  scene.add(recorte, recorte.target)
  if (intensidadeFrio >= 2) manifestacoes.push("teto:condensacao-intensa")
  if (intensidade(vestigios, "corte") >= 2) manifestacoes.push("parede:linha")
  if (intensidade(vestigios, "registro") >= 2) manifestacoes.push("parede:etiqueta")

  return {
    id: "salaC",
    data,
    porta: refs.porta,
    obstaculos,
    interativos,
    spawn: { x: 0.9, y: 1.65, z: 2.35, olharY: 0.34 },
    fonteSom: { x: -mx - 0.28, y: 1.15, z: -0.72 },
    limites: { peDireito: PE_DIREITO },
    manifestacoes,
  }
}
