import * as THREE from "three"
import { caixa } from "./colisao.js"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"
import { combinacoesRaras, intensidade } from "./vestigios.js"

// Ambiente A: uma baia estreita de processamento. Continua longitudinal,
// mas agora a arquitetura revela uma função interrompida em vez de servir
// apenas como suporte para marcas de corte.
const LARGURA = 3.2
const COMPRIMENTO = 7.4
const PE_DIREITO = 2.55
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
    const z = -2.35 + i * 0.43
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
  // Lâmina industrial curta, com guarda e espigão exposto. O cabo ausente
  // é legível pela silhueta, não depende apenas do texto da interação.
  grupo.add(mesh(new THREE.BoxGeometry(0.12, 0.025, 0.4), materialAco, 0, 0.027, -0.03, 0, 0, -0.05))
  grupo.add(mesh(new THREE.BoxGeometry(0.045, 0.02, 0.19), materialEscuro, 0, 0.027, 0.26, 0, 0, -0.05))
  grupo.add(mesh(new THREE.BoxGeometry(0.22, 0.035, 0.045), materialEscuro, 0, 0.03, 0.14, 0, 0, -0.05))
  const ponta = mesh(new THREE.ConeGeometry(0.06, 0.14, 4), materialAco, 0, 0.027, -0.3, Math.PI / 2, 0, Math.PI / 4)
  ponta.scale.x = 1.45
  grupo.add(ponta)
  for (const z of [0.21, 0.28]) grupo.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.028, 8), materialAco, 0, 0.045, z))
  return grupo
}

function criarTrilha(materialCorte) {
  const grupo = new THREE.Group()
  // A sequência converge para a porta e termina antes da soleira.
  for (let i = 0; i < 12; i++) {
    const z = 2.4 - i * 0.44
    const x = -0.42 + Math.sin(i * 1.7) * 0.04
    grupo.add(mesh(new THREE.BoxGeometry(0.28, 0.006, 0.012), materialCorte, x, 0.009, z, 0, 0.05 * Math.sin(i)))
  }
  return grupo
}

export function construirSalaA(scene, ctx = {}) {
  const data = DATA.salas.salaA
  const vestigios = ctx.vestigios
  const combinacoes = combinacoesRaras(vestigios, "salaA")
  const refs = Object.fromEntries(data.objetos.map((objeto) => [objeto.id, objeto]))
  const interativos = []
  const obstaculos = []
  const manifestacoes = []

  const metalParede = materialMetal(0x606b6f, 0.67)
  const metalPiso = materialMetal(0x424a4d, 0.78)
  const metalPlaca = materialMetal(0x697277, 0.48)
  const metalAco = materialMetal(0x90999c, 0.34)
  const corte = new THREE.MeshStandardMaterial({ color: 0x1b2022, roughness: 0.94, metalness: 0.15 })
  const escuro = new THREE.MeshStandardMaterial({ color: 0x343a3d, roughness: 0.58, metalness: 0.74 })
  const borracha = new THREE.MeshStandardMaterial({ color: 0x292f30, roughness: 0.88, metalness: 0.08 })
  const sinal = new THREE.MeshStandardMaterial({ color: 0xc4b886, roughness: 0.86 })

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

  // A parede técnica é dividida em painéis removíveis. Um trilho superior
  // e uma bancada de calibração sugerem que peças eram trazidas, presas,
  // processadas e conduzidas até a porta — mas nenhuma peça permanece.
  for (const lado of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      const z = -2.8 + i * 1.08
      scene.add(mesh(new THREE.BoxGeometry(0.018, 0.82, 0.92), metalPlaca, lado * (LARGURA / 2 - 0.09), 0.51, z))
      const junta = mesh(new THREE.BoxGeometry(0.022, 0.025, 0.68), escuro, lado * (LARGURA / 2 - 0.075), 0.86, z)
      scene.add(junta)
    }
  }
  const trilhoSuperior = mesh(new THREE.BoxGeometry(0.16, 0.11, COMPRIMENTO - 0.62), escuro, 0.52, PE_DIREITO - 0.13, 0.08)
  scene.add(trilhoSuperior)
  for (const z of [-2.45, -0.8, 0.85, 2.5]) {
    scene.add(mesh(new THREE.BoxGeometry(LARGURA - 0.22, 0.055, 0.09), escuro, 0, PE_DIREITO - 0.055, z))
  }

  const bancadaX = LARGURA / 2 - 0.38
  const bancadaZ = 0.45
  const bancadaP = 2.7
  scene.add(mesh(new THREE.BoxGeometry(0.64, 0.065, bancadaP), metalAco, bancadaX, 0.91, bancadaZ))
  for (const z of [bancadaZ - 1.12, bancadaZ + 1.12]) {
    scene.add(mesh(new THREE.BoxGeometry(0.075, 0.88, 0.075), escuro, bancadaX + 0.22, 0.44, z))
    scene.add(mesh(new THREE.BoxGeometry(0.075, 0.88, 0.075), escuro, bancadaX - 0.22, 0.44, z))
  }
  scene.add(mesh(new THREE.BoxGeometry(0.48, 0.12, 0.7), borracha, bancadaX, 0.99, 0.38))
  for (const z of [0.1, 0.66]) {
    const batente = mesh(new THREE.BoxGeometry(0.52, 0.15, 0.055), metalPlaca, bancadaX, 1.09, z)
    scene.add(batente)
  }
  for (const z of [-0.72, -0.28, 0.16, 0.6, 1.04]) {
    scene.add(mesh(new THREE.BoxGeometry(0.18, 0.015, 0.012), sinal, bancadaX, 0.955, z))
  }
  obstaculos.push(caixa(bancadaX, bancadaZ, 0.68, bancadaP))

  // Canal de coleta, paralelo à bancada. A trilha interativa passa por cima
  // dele, conectando visualmente as marcas ao processo sem confirmar função.
  scene.add(mesh(new THREE.BoxGeometry(0.28, 0.018, 5.55), borracha, -0.42, 0.006, -0.05))
  for (let i = 0; i < 10; i++) {
    scene.add(mesh(new THREE.BoxGeometry(0.24, 0.012, 0.025), metalPlaca, -0.42, 0.017, -2.42 + i * 0.54))
  }

  // Parede cortada: os riscos ficam poucos milímetros à frente da face,
  // unidos num único alvo para o OutlinePass e para o raycast.
  const alvoParede = new THREE.Group()
  alvoParede.position.x = -LARGURA / 2 + 0.086
  alvoParede.add(riscosParede(corte))
  alvoParede.userData = { tipo: "objeto", ref: refs.parede }
  if (combinacoes.reflexoCortado) {
    const reflexo = new THREE.MeshStandardMaterial({
      color: 0x84969b,
      emissive: 0x728a91,
      emissiveIntensity: 0.75,
      roughness: 0.28,
      metalness: 0.72,
    })
    alvoParede.add(mesh(new THREE.BoxGeometry(0.014, 0.012, 0.34), reflexo, 0.008, 1.38, -0.77, 0, -0.02))
  }
  scene.add(alvoParede)
  interativos.push(alvoParede)

  // Placa amassada e levemente inclinada na parede oposta.
  const placaBase = mesh(new THREE.BoxGeometry(0.72, 0.58, 0.035), metalPlaca, 0, 0, 0)
  const placa = interativo(scene, refs.placa, [placaBase, riscosPlaca(corte)])
  placa.position.set(bancadaX - 0.34, 1.48, 0.38)
  placa.rotation.set(0, -Math.PI / 2, -0.045)
  placa.scale.set(1, 0.94, 1)
  if (intensidade(vestigios, "frio") >= 2) {
    const condensacao = new THREE.MeshStandardMaterial({
      color: 0xb8d0d3,
      roughness: 0.12,
      transparent: true,
      opacity: 0.3,
    })
    for (let i = 0; i < 4; i++) {
      placa.add(mesh(new THREE.CircleGeometry(0.018 + i * 0.003, 12), condensacao, -0.22 + i * 0.14, 0.12 - (i % 2) * 0.13, 0.038))
    }
  }
  if (intensidade(vestigios, "observacao") >= 2) {
    const fixacao = new THREE.MeshStandardMaterial({ color: 0x15191a, roughness: 0.22, metalness: 0.65 })
    placa.add(mesh(new THREE.CircleGeometry(0.024, 16), fixacao, 0.23, 0.18, 0.04))
  }
  interativos.push(placa)

  const ferramenta = criarFerramenta(metalAco, escuro)
  ferramenta.position.set(0.18, 0.02, 1.92)
  ferramenta.rotation.y = intensidade(vestigios, "ordem") >= 3 ? -0.14 : -0.42
  if (intensidade(vestigios, "ordem") >= 3) manifestacoes.push("ferramenta:alinhada")
  ferramenta.userData = { tipo: "objeto", ref: refs.ferramenta }
  scene.add(ferramenta)
  interativos.push(ferramenta)

  const trilha = criarTrilha(corte)
  if (intensidade(vestigios, "ausencia") >= 3 && trilha.children[6]) {
    trilha.children[6].visible = false
    manifestacoes.push("trilha:interrompida")
  }
  trilha.userData = { tipo: "objeto", ref: refs.trilha }
  scene.add(trilha)
  interativos.push(trilha)

  const porta = criarPorta(PORTA_L, PORTA_A)
  porta.position.set(0, 0, zPorta)
  porta.userData = { tipo: "porta", ref: refs.porta }
  scene.add(porta)
  interativos.push(porta)

  // Uma luz de inspeção com sombra domina a bancada. As demais calhas são
  // apoios baratos e deixam intervalos escuros entre etapas do processo.
  scene.add(new THREE.AmbientLight(0x3b4548, 0.7))
  scene.add(new THREE.HemisphereLight(0xbdcdd0, 0x1e2426, 1.16))
  const emissivo = new THREE.MeshStandardMaterial({
    color: 0xc8d2d2,
    emissive: 0xaebbbb,
    emissiveIntensity: 2.2,
    roughness: 0.22,
  })
  for (const [i, z] of [2.4, 0.25, -2.55].entries()) {
    const potencia = i === 1 ? 7.8 : i === 2 ? 6.3 : 4.7
    const alcance = i === 2 ? 5.2 : 4.8
    const luz = new THREE.PointLight(i === 1 ? 0xd5e2df : 0xb5c5c8, potencia, alcance, 1.8)
    luz.position.set(i === 1 ? 0.72 : 0, 2.22, z)
    luz.castShadow = i === 1
    if (luz.castShadow) luz.shadow.mapSize.set(512, 512)
    scene.add(luz)
    scene.add(mesh(new THREE.BoxGeometry(0.72, 0.035, 0.12), emissivo, i === 1 ? 0.55 : 0, 2.46, z))
  }
  if (intensidade(vestigios, "domestico") >= 3) {
    const residuo = new THREE.PointLight(0xd4a36f, 0.42, 1.35, 2)
    residuo.position.set(bancadaX, 0.72, 0.42)
    scene.add(residuo)
    manifestacoes.push("bancada:calor-residual")
  }
  if (intensidade(vestigios, "frio") >= 2) manifestacoes.push("placa:condensacao")
  if (intensidade(vestigios, "observacao") >= 2) manifestacoes.push("placa:fixacao")
  if (combinacoes.reflexoCortado) manifestacoes.push("rara:reflexoCortado")

  return {
    id: "salaA",
    data,
    porta: refs.porta,
    obstaculos,
    interativos,
    spawn: { x: -0.45, y: 1.65, z: 3.02, olharY: 0 },
    // Atrás da placa metálica: som e padrão de cortes ocupam o mesmo ponto,
    // mas o jogo nunca afirma que uma coisa causa a outra.
    fonteSom: { x: LARGURA / 2 + 0.22, y: 1.18, z: 0.38 },
    limites: { peDireito: PE_DIREITO },
    manifestacoes,
  }
}
