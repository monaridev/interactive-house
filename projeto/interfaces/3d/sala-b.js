import * as THREE from "three"
import { caixa } from "./colisao.js"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"

// Ambiente B — o doméstico preservado com cuidado excessivo. A sala não
// replica a Cozinha: é uma sala de jantar montada para um acontecimento
// ausente, com uma única cadeira voltada para longe da entrada.
const LARGURA = 4.8
const COMPRIMENTO = 5.4
const PE_DIREITO = 2.62
const ESPESSURA = 0.14

function mesh(geometria, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const objeto = new THREE.Mesh(geometria, material)
  objeto.position.set(x, y, z)
  objeto.rotation.set(rx, ry, rz)
  objeto.castShadow = true
  objeto.receiveShadow = true
  return objeto
}

function alvo(scene, ref, partes, x = 0, y = 0, z = 0, ry = 0) {
  const grupo = new THREE.Group()
  for (const parte of partes) grupo.add(parte)
  grupo.position.set(x, y, z)
  grupo.rotation.y = ry
  grupo.userData = { tipo: ref.ehSaida ? "porta" : "objeto", ref }
  scene.add(grupo)
  return grupo
}

export function construirSalaB(scene) {
  const data = DATA.salas.salaB
  const refs = Object.fromEntries(data.objetos.map((objeto) => [objeto.id, objeto]))
  const obstaculos = []
  const interativos = []

  const parede = new THREE.MeshStandardMaterial({ map: TEX.parede(2, 2), color: 0x8b806f, roughness: 0.94 })
  const piso = new THREE.MeshStandardMaterial({ map: TEX.madeiraEscura(3, 4), color: 0x665845, roughness: 0.86 })
  const madeira = new THREE.MeshStandardMaterial({ map: TEX.madeiraEscura(1, 2), color: 0x4a3c2d, roughness: 0.82 })
  const tecido = new THREE.MeshStandardMaterial({ map: TEX.tecido(2, 2), color: 0x8b8373, roughness: 0.98 })
  const metal = new THREE.MeshStandardMaterial({ map: TEX.metal(), color: 0x8a8a84, roughness: 0.42, metalness: 0.78 })
  const louca = new THREE.MeshStandardMaterial({ color: 0xd1cbbc, roughness: 0.25 })
  const vidro = new THREE.MeshStandardMaterial({ color: 0xb8c5c3, roughness: 0.08, transparent: true, opacity: 0.32 })

  const mx = LARGURA / 2
  const mz = COMPRIMENTO / 2
  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), piso, 0, 0, 0, -Math.PI / 2))
  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), parede, 0, PE_DIREITO, 0, Math.PI / 2))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), parede, -mx, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), parede, mx, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(LARGURA, PE_DIREITO, ESPESSURA), parede, 0, PE_DIREITO / 2, mz))

  const portaL = 0.9
  const portaA = 2.05
  const sobra = (LARGURA - portaL) / 2
  scene.add(mesh(new THREE.BoxGeometry(sobra, PE_DIREITO, ESPESSURA), parede, -(portaL + sobra) / 2, PE_DIREITO / 2, -mz))
  scene.add(mesh(new THREE.BoxGeometry(sobra, PE_DIREITO, ESPESSURA), parede, (portaL + sobra) / 2, PE_DIREITO / 2, -mz))
  scene.add(mesh(new THREE.BoxGeometry(portaL, PE_DIREITO - portaA, ESPESSURA), parede, 0, portaA + (PE_DIREITO - portaA) / 2, -mz))
  obstaculos.push(
    caixa(-mx, 0, ESPESSURA, COMPRIMENTO + ESPESSURA),
    caixa(mx, 0, ESPESSURA, COMPRIMENTO + ESPESSURA),
    caixa(0, mz, LARGURA, ESPESSURA),
    caixa(0, -mz, LARGURA, ESPESSURA),
  )

  // Mesa posta: a toalha é um alvo próprio e cobre só o tampo; a mesa
  // mantém pés e talheres no mesmo grupo para o contorno ler o conjunto.
  const mesaPartes = [mesh(new THREE.BoxGeometry(1.58, 0.09, 2.15), madeira, 0, 0.77, 0)]
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    mesaPartes.push(mesh(new THREE.BoxGeometry(0.075, 0.74, 0.075), madeira, sx * 0.66, 0.37, sz * 0.94))
  }
  for (const z of [-0.58, 0.58]) {
    mesaPartes.push(mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.025, 24), louca, 0, 0.835, z))
    for (const x of [-0.22, 0.22]) mesaPartes.push(mesh(new THREE.BoxGeometry(0.018, 0.012, 0.28), metal, x, 0.85, z))
  }
  interativos.push(alvo(scene, refs.mesa, mesaPartes, -0.18, 0, -0.05))
  obstaculos.push(caixa(-0.18, -0.05, 1.58, 2.15))

  const toalha = alvo(scene, refs.toalha, [mesh(new THREE.BoxGeometry(1.48, 0.018, 2.03), tecido, 0, 0.826, 0)])
  toalha.position.set(-0.18, 0, -0.05)
  interativos.push(toalha)

  // Cadeira isolada no lado norte, virada de costas para a entrada.
  const cadeiraPartes = [
    mesh(new THREE.BoxGeometry(0.52, 0.08, 0.48), madeira, 0, 0.47, 0),
    mesh(new THREE.BoxGeometry(0.52, 0.62, 0.065), madeira, 0, 0.79, -0.21),
  ]
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cadeiraPartes.push(mesh(new THREE.BoxGeometry(0.055, 0.46, 0.055), madeira, sx * 0.21, 0.23, sz * 0.18))
  }
  interativos.push(alvo(scene, refs.cadeira, cadeiraPartes, -0.18, 0, -1.56, Math.PI))
  obstaculos.push(caixa(-0.18, -1.56, 0.58, 0.58))

  // Copo de boca para baixo no lugar oposto ao da cadeira.
  const copoPartes = [
    mesh(new THREE.CylinderGeometry(0.052, 0.038, 0.14, 20, 1, true), vidro, 0, 0.9, 0),
    mesh(new THREE.RingGeometry(0.041, 0.052, 20), vidro, 0, 0.973, 0, -Math.PI / 2),
  ]
  interativos.push(alvo(scene, refs.copo, copoPartes, 0.34, 0, 0.62))

  const porta = criarPorta(portaL - 0.06, portaA - 0.04)
  porta.position.set(0, 0, -mz + 0.08)
  porta.userData = { tipo: "porta", ref: refs.porta }
  scene.add(porta)
  interativos.push(porta)

  scene.add(new THREE.AmbientLight(0x514a40, 0.66))
  scene.add(new THREE.HemisphereLight(0xa39780, 0x2c231b, 0.54))
  const pendente = new THREE.PointLight(0xffcf91, 8.1, 6.4, 2)
  pendente.position.set(-0.18, 2.18, -0.05)
  pendente.castShadow = true
  pendente.shadow.mapSize.set(512, 512)
  scene.add(pendente)
  scene.add(mesh(new THREE.ConeGeometry(0.24, 0.18, 20, 1, true), madeira, -0.18, 2.34, -0.05, Math.PI))
  const luzPorta = new THREE.PointLight(0xaab9c4, 1.65, 3.4, 2)
  luzPorta.position.set(0, 1.75, -mz + 0.35)
  scene.add(luzPorta)

  return {
    id: "salaB",
    data,
    porta: refs.porta,
    obstaculos,
    interativos,
    spawn: { x: 1.45, y: 1.65, z: 2.02, olharY: -0.35 },
    fonteSom: { x: -mx - 0.2, y: 0.8, z: -0.9 },
    limites: { peDireito: PE_DIREITO },
  }
}
