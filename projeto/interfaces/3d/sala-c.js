import * as THREE from "three"
import { caixa } from "./colisao.js"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"

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

export function construirSalaC(scene) {
  const data = DATA.salas.salaC
  const refs = Object.fromEntries(data.objetos.map((objeto) => [objeto.id, objeto]))
  const obstaculos = []
  const interativos = []
  const mx = LARGURA / 2
  const mz = COMPRIMENTO / 2

  const concreto = new THREE.MeshStandardMaterial({ map: TEX.parede(2, 3), color: 0x78868a, roughness: 0.94 })
  const concretoEscuro = new THREE.MeshStandardMaterial({ map: TEX.parede(2, 2), color: 0x4b565a, roughness: 1 })
  const piso = new THREE.MeshStandardMaterial({ map: TEX.piso(3, 4), color: 0x687579, roughness: 0.96 })
  const mancha = new THREE.MeshStandardMaterial({ color: 0x101516, roughness: 1, transparent: true, opacity: 0.82 })
  const umidade = new THREE.MeshStandardMaterial({ color: 0xaebfc2, roughness: 0.18, transparent: true, opacity: 0.38 })
  const poeira = new THREE.MeshStandardMaterial({ color: 0xc1cccd, emissive: 0x566366, emissiveIntensity: 0.35, transparent: true, opacity: 0.46 })

  // Chão em quatro placas com inclinações mínimas. A colisão permanece 2D,
  // então o desnível é visual e não interfere no movimento FPS.
  const placas = [
    [-1.12, 1.55, 0.018, -0.015], [1.12, 1.55, -0.014, 0.012],
    [-1.12, -1.55, -0.01, -0.012], [1.12, -1.55, 0.015, 0.016],
  ]
  for (const [x, z, rx, rz] of placas) scene.add(mesh(new THREE.PlaneGeometry(LARGURA / 2 + 0.04, COMPRIMENTO / 2 + 0.04), piso, x, 0, z, -Math.PI / 2 + rx, 0, rz))

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

  // Mancha da parede, mais larga na base, construída por discos que se
  // sobrepõem. O grupo inteiro é um único alvo de interação/OutlinePass.
  const paredeAlvo = new THREE.Group()
  for (let i = 0; i < 7; i++) {
    const raio = 0.42 - i * 0.045
    paredeAlvo.add(mesh(new THREE.CircleGeometry(raio, 24), mancha, 0.001, 0.3 + i * 0.31, (i % 2 ? 0.06 : -0.04), 0, Math.PI / 2))
  }
  paredeAlvo.position.set(-mx + 0.087, 0, -0.72)
  tornarAlvo(scene, refs.parede, paredeAlvo)
  interativos.push(paredeAlvo)

  // "Ar" vira partículas suspensas numa faixa densa. São poucas e usam a
  // mesma geometria/material para manter o custo baixo.
  const arAlvo = new THREE.Group()
  const particulaGeom = new THREE.SphereGeometry(0.018, 6, 5)
  for (let i = 0; i < 18; i++) {
    const p = mesh(particulaGeom, poeira, Math.sin(i * 2.1) * 0.62, 0.72 + (i % 6) * 0.17, -0.08 + Math.cos(i * 1.7) * 0.42)
    p.castShadow = false
    arAlvo.add(p)
  }
  tornarAlvo(scene, refs.ar, arAlvo)
  interativos.push(arAlvo)

  // Condensação: gotas sob uma placa de teto levemente inclinada.
  const tetoAlvo = new THREE.Group()
  tetoAlvo.add(mesh(new THREE.PlaneGeometry(1.55, 1.3), concretoEscuro, 0, PE_DIREITO - 0.02, -1.3, Math.PI / 2 + 0.03))
  for (let i = 0; i < 12; i++) {
    const gota = mesh(new THREE.SphereGeometry(0.022 + (i % 3) * 0.006, 7, 6), umidade, -0.62 + (i % 4) * 0.4, PE_DIREITO - 0.08 - (i % 2) * 0.025, -1.65 + Math.floor(i / 4) * 0.36)
    gota.scale.y = 1.65
    tetoAlvo.add(gota)
  }
  tornarAlvo(scene, refs.teto, tetoAlvo)
  interativos.push(tetoAlvo)

  // O chão interativo é uma área esbranquiçada próxima ao centro, não um
  // objeto acrescentado ao vazio.
  const chaoAlvo = new THREE.Group()
  const frio = mesh(new THREE.CircleGeometry(0.72, 32), umidade, 0, 0.012, 0.72, -Math.PI / 2)
  frio.scale.set(1.4, 0.72, 1)
  chaoAlvo.add(frio)
  tornarAlvo(scene, refs.chao, chaoAlvo)
  interativos.push(chaoAlvo)

  const porta = criarPorta(portaL - 0.06, portaA - 0.04)
  porta.position.set(0, 0, -mz + 0.09)
  porta.userData = { tipo: "porta", ref: refs.porta }
  scene.add(porta)
  interativos.push(porta)

  scene.add(new THREE.HemisphereLight(0xb8cdd2, 0x303b3f, 1.04))
  scene.add(new THREE.AmbientLight(0x46565b, 0.72))
  const luzFria = new THREE.PointLight(0xc4dce0, 5.9, 6.2, 2)
  luzFria.position.set(-0.65, 2.32, -1.22)
  luzFria.castShadow = true
  luzFria.shadow.mapSize.set(512, 512)
  scene.add(luzFria)
  const luzEntrada = new THREE.PointLight(0x93aeb5, 2.75, 4.6, 2)
  luzEntrada.position.set(0.7, 1.45, 2.45)
  scene.add(luzEntrada)
  const preenchimento = new THREE.PointLight(0x78959d, 3, 5.2, 2)
  preenchimento.position.set(1.2, 0.85, 0.1)
  scene.add(preenchimento)

  return {
    id: "salaC",
    data,
    porta: refs.porta,
    obstaculos,
    interativos,
    spawn: { x: 0.9, y: 1.65, z: 2.35, olharY: -0.25 },
    fonteSom: { x: -mx - 0.28, y: 1.15, z: -0.72 },
    limites: { peDireito: PE_DIREITO },
  }
}
