import * as THREE from "three"
import { caixa } from "./colisao.js"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"
import { combinacoesRaras, intensidade } from "./vestigios.js"

// Ambiente D — arquivo/catalogação. A repetição é institucional, não uma
// pilha de detalhes caros: geometrias e materiais são compartilhados e os
// quatro alvos narrativos continuam distintos.
const LARGURA = 3.05
const COMPRIMENTO = 7.4
const PE_DIREITO = 2.55
const ESPESSURA = 0.14
const PROF_PRATELEIRA = 0.38

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

export function construirSalaD(scene, ctx = {}) {
  const data = DATA.salas.salaD
  const vestigios = ctx.vestigios
  const combinacoes = combinacoesRaras(vestigios, "salaD")
  const refs = Object.fromEntries(data.objetos.map((objeto) => [objeto.id, objeto]))
  const obstaculos = []
  const interativos = []
  const mx = LARGURA / 2
  const mz = COMPRIMENTO / 2

  const parede = new THREE.MeshStandardMaterial({ map: TEX.parede(2, 3), color: 0x77776f, roughness: 0.94 })
  const piso = new THREE.MeshStandardMaterial({ map: TEX.piso(2, 5), color: 0x555750, roughness: 0.92 })
  const metal = new THREE.MeshStandardMaterial({ map: TEX.metal(1, 3), color: 0x535b5c, roughness: 0.62, metalness: 0.68 })
  const corPapel = intensidade(vestigios, "frio") >= 2 ? 0xb4bab0 : 0xbdb59f
  const papel = new THREE.MeshStandardMaterial({ map: TEX.papel(), color: corPapel, roughness: 0.92 })
  const pasta = new THREE.MeshStandardMaterial({ color: 0x6f6654, roughness: 0.9 })
  const tinta = new THREE.MeshStandardMaterial({ color: 0x2b2925, roughness: 0.9 })
  const carimbo = new THREE.MeshStandardMaterial({ color: 0x713b36, roughness: 0.82 })

  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), piso, 0, 0, 0, -Math.PI / 2))
  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), parede, 0, PE_DIREITO, 0, Math.PI / 2))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), parede, -mx, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), parede, mx, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(LARGURA, PE_DIREITO, ESPESSURA), parede, 0, PE_DIREITO / 2, mz))

  const portaL = 0.86
  const portaA = 2.02
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

  // Duas estantes contínuas deixam um corredor central estreito. A da
  // direita é o alvo "prateleira"; a da esquerda contém o alvo "arquivo".
  function estruturaEstante(x) {
    const partes = []
    partes.push(mesh(new THREE.BoxGeometry(0.055, 2.2, COMPRIMENTO - 0.8), metal, 0, 1.1, 0))
    for (const y of [0.18, 0.65, 1.12, 1.59, 2.06]) {
      partes.push(mesh(new THREE.BoxGeometry(PROF_PRATELEIRA, 0.035, COMPRIMENTO - 0.8), metal, x < 0 ? PROF_PRATELEIRA / 2 : -PROF_PRATELEIRA / 2, y, 0))
    }
    return partes
  }
  const estanteEsq = alvo(scene, refs.arquivo, estruturaEstante(-mx), -mx + 0.035, 0, 0)
  const estanteDir = alvo(scene, refs.prateleira, estruturaEstante(mx), mx - 0.035, 0, 0)

  const pastaGeom = new THREE.BoxGeometry(0.25, 0.34, 0.055)
  const etiquetaGeom = new THREE.BoxGeometry(0.13, 0.055, 0.006)
  const slotAusente = intensidade(vestigios, "ausencia") >= 3 ? 12 : -1
  for (let i = 0; i < 26; i++) {
    if (i === slotAusente) continue
    const ladoEsq = i % 2 === 0
    const grupo = ladoEsq ? estanteEsq : estanteDir
    const linha = Math.floor(i / 8) % 4
    const z = -2.75 + (i % 8) * 0.78 + (linha % 2) * 0.06
    const xLocal = ladoEsq ? PROF_PRATELEIRA * 0.55 : -PROF_PRATELEIRA * 0.55
    const folha = mesh(pastaGeom, pasta, xLocal, 0.27 + linha * 0.47, z, 0, ladoEsq ? Math.PI / 2 : -Math.PI / 2, (i % 3 - 1) * 0.02)
    grupo.add(folha)
    const etiqueta = mesh(etiquetaGeom, papel, xLocal + (ladoEsq ? 0.13 : -0.13), 0.29 + linha * 0.47, z, 0, ladoEsq ? Math.PI / 2 : -Math.PI / 2)
    grupo.add(etiqueta)
  }
  if (intensidade(vestigios, "domestico") >= 3) {
    const tecido = new THREE.MeshStandardMaterial({ map: TEX.tecido(), color: 0x746b5b, roughness: 0.98 })
    const dobra = mesh(new THREE.BoxGeometry(0.2, 0.018, 0.16), tecido, PROF_PRATELEIRA * 0.55, 1.15, 1.34, 0.08, Math.PI / 2, 0.12)
    estanteEsq.add(dobra)
  }
  interativos.push(estanteEsq, estanteDir)
  obstaculos.push(
    caixa(-mx + PROF_PRATELEIRA / 2, 0, PROF_PRATELEIRA, COMPRIMENTO - 0.65),
    caixa(mx - PROF_PRATELEIRA / 2, 0, PROF_PRATELEIRA, COMPRIMENTO - 0.65),
  )

  // Ficha em uma pequena bandeja central, perto o suficiente para leitura.
  const bandeja = mesh(new THREE.BoxGeometry(0.62, 0.06, 0.42), metal, 0, 0.82, 0)
  const haste = mesh(new THREE.BoxGeometry(0.07, 0.82, 0.07), metal, 0, 0.41, 0)
  const ficha = mesh(new THREE.BoxGeometry(0.5, 0.012, 0.31), papel, 0, 0.86, 0, -0.05)
  for (let i = 0; i < 4; i++) ficha.add(mesh(new THREE.BoxGeometry(0.32 - i * 0.04, 0.004, 0.008), tinta, 0, 0.01, -0.1 + i * 0.06))
  if (intensidade(vestigios, "corte") >= 2) {
    const risco = new THREE.MeshStandardMaterial({ color: 0x684640, roughness: 0.94 })
    ficha.add(mesh(new THREE.BoxGeometry(0.38, 0.004, 0.009), risco, 0.01, 0.013, 0.065, 0, 0.04, -0.035))
  }
  if (combinacoes.fichaApagada) {
    const apagado = new THREE.MeshStandardMaterial({ color: 0x756f62, roughness: 1, transparent: true, opacity: 0.34 })
    const marca = mesh(new THREE.RingGeometry(0.055, 0.079, 24), apagado, -0.11, 0.015, -0.045, -Math.PI / 2)
    marca.scale.x = 1.7
    ficha.add(marca)
  }
  const fichaAlvo = alvo(scene, refs.ficha, [bandeja, haste, ficha], 0, 0, 0.62)
  if (intensidade(vestigios, "frio") >= 2) {
    const gota = new THREE.MeshStandardMaterial({ color: 0xb4ced1, roughness: 0.12, transparent: true, opacity: 0.42 })
    fichaAlvo.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), gota, 0.23, 0.865, -0.12))
  }
  interativos.push(fichaAlvo)
  obstaculos.push(caixa(0, 0.62, 0.68, 0.48))

  // Selo fora da ficha, sobre uma gaveta baixa à esquerda.
  const seloPartes = [
    mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.12, 16), carimbo, 0, 0.77, 0),
    mesh(new THREE.SphereGeometry(0.055, 12, 8), tinta, 0, 0.87, 0),
    mesh(new THREE.BoxGeometry(0.32, 0.6, 0.44), metal, 0, 0.3, 0),
  ]
  interativos.push(alvo(scene, refs.selo, seloPartes, -0.77, 0, -1.28))
  obstaculos.push(caixa(-0.77, -1.28, 0.36, 0.48))

  const porta = criarPorta(portaL - 0.06, portaA - 0.04)
  porta.position.set(0, 0, -mz + 0.08)
  porta.userData = { tipo: "porta", ref: refs.porta }
  scene.add(porta)
  interativos.push(porta)

  scene.add(new THREE.AmbientLight(0x303334, 0.42))
  scene.add(new THREE.HemisphereLight(0x879092, 0x181a19, 0.34))
  const emissivo = new THREE.MeshStandardMaterial({ color: 0xb7bdb8, emissive: 0x929b98, emissiveIntensity: 1.8, roughness: 0.28 })
  for (const z of [2.35, 0.05, -2.25]) {
    scene.add(mesh(new THREE.BoxGeometry(0.78, 0.035, 0.1), emissivo, 0, 2.43, z))
    const luz = new THREE.PointLight(0xcbd2ce, 3.6, 3.8, 1.8)
    luz.position.set(0, 2.31, z)
    scene.add(luz)
  }

  return {
    id: "salaD",
    data,
    porta: refs.porta,
    obstaculos,
    interativos,
    spawn: { x: 0, y: 1.65, z: 3.0, olharY: 0 },
    fonteSom: { x: mx + 0.35, y: 1.05, z: -1.35 },
    limites: { peDireito: PE_DIREITO },
  }
}
