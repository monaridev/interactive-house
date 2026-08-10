import * as THREE from "three"
import { caixa } from "./colisao.js"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"

// Ambiente A: corredor metálico estreito. O espaço é deliberadamente
// simples; a irregularidade está nas marcas repetidas, não na arquitetura.
const LARGURA = 2.45
const COMPRIMENTO = 8.2
const PE_DIREITO = 2.45
const ESPESSURA = 0.16

function materialMetal(cor, roughness = 0.62) {
  return new THREE.MeshStandardMaterial({
    map: TEX.metal(2, 3),
    color: cor,
    roughness,
    metalness: 0.72,
  })
}

function mesh(geometria, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const objeto = new THREE.Mesh(geometria, material)
  objeto.position.set(x, y, z)
  objeto.rotation.set(rx, ry, rz)
  objeto.castShadow = true
  objeto.receiveShadow = true
  return objeto
}

function interativo(scene, ref, partes) {
  const grupo = new THREE.Group()
  grupo.userData = { tipo: ref.ehSaida ? "porta" : "objeto", ref }
  for (const parte of partes) grupo.add(parte)
  scene.add(grupo)
  return grupo
}

function riscosParede(materialCorte) {
  const grupo = new THREE.Group()
  // Todos começam e terminam exatamente nas mesmas alturas. A precisão é
  // mais desconfortável que uma distribuição aleatória de arranhões.
  for (let i = 0; i < 11; i++) {
    const z = -2.65 + i * 0.47
    grupo.add(mesh(new THREE.BoxGeometry(0.012, 0.018, 0.32), materialCorte, 0, 1.18, z, 0, 0.04))
    grupo.add(mesh(new THREE.BoxGeometry(0.013, 0.012, 0.21), materialCorte, 0.002, 1.38, z + 0.035, 0, -0.025))
  }
  return grupo
}

function riscosPlaca(materialCorte) {
  const grupo = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    grupo.add(
      mesh(
        new THREE.BoxGeometry(0.22, 0.012, 0.012),
        materialCorte,
        -0.25 + i * 0.125,
        0.03,
        0.018,
        0,
        0,
        0.08,
      ),
    )
  }
  return grupo
}

function criarFerramenta(materialAco, materialEscuro) {
  const grupo = new THREE.Group()
  // Só a lâmina e o espigão: o cabo realmente não está lá.
  grupo.add(mesh(new THREE.BoxGeometry(0.075, 0.018, 0.43), materialAco, 0, 0.02, -0.04, 0, 0, -0.08))
  grupo.add(mesh(new THREE.BoxGeometry(0.035, 0.016, 0.17), materialEscuro, 0, 0.019, 0.25, 0, 0, -0.08))
  const ponta = mesh(new THREE.ConeGeometry(0.038, 0.11, 4), materialAco, 0, 0.02, -0.305, Math.PI / 2, 0, Math.PI / 4)
  grupo.add(ponta)
  return grupo
}

function criarTrilha(materialCorte) {
  const grupo = new THREE.Group()
  // A sequência converge para a porta e termina antes da soleira.
  for (let i = 0; i < 13; i++) {
    const z = 2.25 - i * 0.43
    const x = Math.sin(i * 1.7) * 0.08
    grupo.add(mesh(new THREE.BoxGeometry(0.33, 0.006, 0.014), materialCorte, x, 0.004, z, 0, 0.12 * Math.sin(i)))
  }
  return grupo
}

export function construirSalaA(scene) {
  const data = DATA.salas.salaA
  const refs = Object.fromEntries(data.objetos.map((objeto) => [objeto.id, objeto]))
  const interativos = []
  const obstaculos = []

  const metalParede = materialMetal(0x4b5357, 0.67)
  const metalPiso = materialMetal(0x343a3d, 0.78)
  const metalPlaca = materialMetal(0x697277, 0.48)
  const metalAco = materialMetal(0x90999c, 0.34)
  const corte = new THREE.MeshStandardMaterial({ color: 0x111416, roughness: 0.94, metalness: 0.15 })
  const escuro = new THREE.MeshStandardMaterial({ color: 0x25292b, roughness: 0.58, metalness: 0.74 })

  // Casca arquitetônica.
  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), metalPiso, 0, 0, 0, -Math.PI / 2))
  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), metalParede, 0, PE_DIREITO, 0, Math.PI / 2))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), metalParede, -LARGURA / 2, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), metalParede, LARGURA / 2, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(LARGURA, PE_DIREITO, ESPESSURA), metalParede, 0, PE_DIREITO / 2, COMPRIMENTO / 2))

  // Parede final em torno da porta.
  const PORTA_L = 0.84
  const PORTA_A = 2.08
  const zPorta = -COMPRIMENTO / 2 + 0.09
  const lateral = (LARGURA - PORTA_L) / 2
  scene.add(mesh(new THREE.BoxGeometry(lateral, PE_DIREITO, ESPESSURA), metalParede, -(PORTA_L + lateral) / 2, PE_DIREITO / 2, -COMPRIMENTO / 2))
  scene.add(mesh(new THREE.BoxGeometry(lateral, PE_DIREITO, ESPESSURA), metalParede, (PORTA_L + lateral) / 2, PE_DIREITO / 2, -COMPRIMENTO / 2))
  scene.add(mesh(new THREE.BoxGeometry(PORTA_L, PE_DIREITO - PORTA_A, ESPESSURA), metalParede, 0, PORTA_A + (PE_DIREITO - PORTA_A) / 2, -COMPRIMENTO / 2))

  // Colisão: paredes laterais, fundo de entrada e parede final. A porta é
  // interação, não passagem física, portanto o bloqueio final é contínuo.
  obstaculos.push(
    caixa(-LARGURA / 2, 0, ESPESSURA, COMPRIMENTO + ESPESSURA),
    caixa(LARGURA / 2, 0, ESPESSURA, COMPRIMENTO + ESPESSURA),
    caixa(0, COMPRIMENTO / 2, LARGURA, ESPESSURA),
    caixa(0, -COMPRIMENTO / 2, LARGURA, ESPESSURA),
  )

  // Parede cortada: os riscos ficam poucos milímetros à frente da face,
  // unidos num único alvo para o OutlinePass e para o raycast.
  const alvoParede = new THREE.Group()
  alvoParede.position.x = -LARGURA / 2 + 0.086
  alvoParede.add(riscosParede(corte))
  alvoParede.userData = { tipo: "objeto", ref: refs.parede }
  scene.add(alvoParede)
  interativos.push(alvoParede)

  // Placa amassada e levemente inclinada na parede oposta.
  const placaBase = mesh(new THREE.BoxGeometry(0.72, 0.58, 0.035), metalPlaca, 0, 0, 0)
  const placa = interativo(scene, refs.placa, [placaBase, riscosPlaca(corte)])
  placa.position.set(LARGURA / 2 - 0.105, 1.28, 0.72)
  placa.rotation.set(0, -Math.PI / 2, -0.045)
  placa.scale.set(1, 0.94, 1)
  interativos.push(placa)

  const ferramenta = criarFerramenta(metalAco, escuro)
  ferramenta.position.set(0.48, 0.015, 1.85)
  ferramenta.rotation.y = -0.42
  ferramenta.userData = { tipo: "objeto", ref: refs.ferramenta }
  scene.add(ferramenta)
  interativos.push(ferramenta)

  const trilha = criarTrilha(corte)
  trilha.userData = { tipo: "objeto", ref: refs.trilha }
  scene.add(trilha)
  interativos.push(trilha)

  const porta = criarPorta(PORTA_L, PORTA_A)
  porta.position.set(0, 0, zPorta)
  porta.userData = { tipo: "porta", ref: refs.porta }
  scene.add(porta)
  interativos.push(porta)

  // Luz industrial fria, com intervalos escuros entre luminárias. Como
  // metal sem environment map absorve boa parte da leitura indireta, há
  // luz de preenchimento suficiente para revelar o corredor sem neutralizar
  // as três poças duras sob as calhas.
  scene.add(new THREE.HemisphereLight(0xb8c4c7, 0x171b1d, 1.05))
  const emissivo = new THREE.MeshStandardMaterial({
    color: 0xc8d2d2,
    emissive: 0xaebbbb,
    emissiveIntensity: 2.2,
    roughness: 0.22,
  })
  for (const z of [2.55, 0.15, -2.25]) {
    const luz = new THREE.PointLight(0xc7d4d5, 7.5, 4.5, 1.65)
    luz.position.set(0, 2.2, z)
    luz.castShadow = true
    luz.shadow.mapSize.set(512, 512)
    scene.add(luz)
    scene.add(mesh(new THREE.BoxGeometry(0.65, 0.035, 0.12), emissivo, 0, 2.39, z))
  }

  return {
    id: "salaA",
    data,
    porta: refs.porta,
    obstaculos,
    interativos,
    spawn: { x: 0, y: 1.65, z: 3.35, olharY: 0 },
    // Atrás da placa metálica: som e padrão de cortes ocupam o mesmo ponto,
    // mas o jogo nunca afirma que uma coisa causa a outra.
    fonteSom: { x: LARGURA / 2 + 0.22, y: 1.18, z: 0.72 },
    limites: { peDireito: PE_DIREITO },
  }
}
