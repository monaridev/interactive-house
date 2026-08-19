import * as THREE from "three"
import { caixa } from "./colisao.js"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"
import { combinacoesRaras, intensidade } from "./vestigios.js"

// Ambiente D — arquivo/catalogação. A repetição é institucional, não uma
// pilha de detalhes caros: geometrias e materiais são compartilhados e os
// quatro alvos narrativos continuam distintos.
const LARGURA = 3.5
const COMPRIMENTO = 7.4
const PE_DIREITO = 2.55
const ESPESSURA = 0.14
const PROF_PRATELEIRA = 0.46

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
  const manifestacoes = []
  const mx = LARGURA / 2
  const mz = COMPRIMENTO / 2

  const parede = new THREE.MeshStandardMaterial({ map: TEX.parede(2, 3), color: 0x77776f, roughness: 0.94 })
  const piso = new THREE.MeshStandardMaterial({ map: TEX.piso(2, 5), color: 0x555750, roughness: 0.92 })
  const metal = new THREE.MeshStandardMaterial({ map: TEX.metal(1, 3), color: 0x626c6d, roughness: 0.62, metalness: 0.68 })
  const corPapel = intensidade(vestigios, "frio") >= 2 ? 0xb4bab0 : 0xbdb59f
  const papel = new THREE.MeshStandardMaterial({ map: TEX.papel(), color: corPapel, roughness: 0.92 })
  const pasta = new THREE.MeshStandardMaterial({ color: 0x6f6654, roughness: 0.9 })
  const tinta = new THREE.MeshStandardMaterial({ color: 0x2b2925, roughness: 0.9 })
  const carimbo = new THREE.MeshStandardMaterial({ color: 0x713b36, roughness: 0.82 })
  const metalEscuro = new THREE.MeshStandardMaterial({ color: 0x353d3e, roughness: 0.72, metalness: 0.58 })
  const vidro = new THREE.MeshStandardMaterial({ color: 0x809397, roughness: 0.2, transparent: true, opacity: 0.32 })

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

  // À esquerda, módulos fechados de arquivo; à direita, uma estrutura de
  // consulta aberta. A diferença de silhueta impede a leitura de "duas
  // prateleiras genéricas" e transforma o eixo central em área de triagem.
  function estruturaBanco(lado, fechado) {
    const partes = []
    const frente = -lado * (PROF_PRATELEIRA / 2 + 0.01)
    partes.push(mesh(new THREE.BoxGeometry(0.045, 2.22, COMPRIMENTO - 0.72), metalEscuro, lado * (PROF_PRATELEIRA / 2 - 0.025), 1.11, 0))
    for (const z of [-2.88, -1.44, 0, 1.44, 2.88]) {
      partes.push(mesh(new THREE.BoxGeometry(PROF_PRATELEIRA, 2.22, 0.055), metal, 0, 1.11, z))
    }
    for (const y of [0.18, 0.64, 1.1, 1.56, 2.02]) {
      partes.push(mesh(new THREE.BoxGeometry(PROF_PRATELEIRA, 0.035, COMPRIMENTO - 0.82), metal, 0, y, 0))
    }
    if (fechado) {
      for (let linha = 0; linha < 4; linha++) for (let coluna = 0; coluna < 4; coluna++) {
        const z = -2.16 + coluna * 1.44
        const y = 0.4 + linha * 0.46
        partes.push(mesh(new THREE.BoxGeometry(0.025, 0.36, 1.22), metal, frente, y, z))
        partes.push(mesh(new THREE.BoxGeometry(0.018, 0.055, 0.22), papel, frente - lado * 0.018, y + 0.05, z))
        partes.push(mesh(new THREE.BoxGeometry(0.018, 0.025, 0.2), metalEscuro, frente - lado * 0.025, y - 0.08, z))
      }
    }
    return partes
  }
  const bancoX = mx - PROF_PRATELEIRA / 2
  const estanteEsq = alvo(scene, refs.arquivo, estruturaBanco(-1, true), -bancoX, 0, 0)
  const estanteDir = alvo(scene, refs.prateleira, estruturaBanco(1, false), bancoX, 0, 0)

  const pastaGeom = new THREE.BoxGeometry(0.31, 0.35, 0.065)
  const etiquetaGeom = new THREE.BoxGeometry(0.15, 0.058, 0.008)
  const slotAusente = intensidade(vestigios, "ausencia") >= 3 ? 7 : -1
  for (let i = 0; i < 15; i++) {
    if (i === slotAusente) continue
    const linha = Math.floor(i / 5)
    const z = -2.45 + (i % 5) * 1.2
    const xLocal = -PROF_PRATELEIRA * 0.48
    const inclinacao = intensidade(vestigios, "ordem") >= 3 ? 0 : (i % 3 - 1) * 0.025
    const folha = mesh(pastaGeom, pasta, xLocal, 0.38 + linha * 0.46, z, 0, -Math.PI / 2, inclinacao)
    estanteDir.add(folha)
    estanteDir.add(mesh(etiquetaGeom, papel, xLocal - 0.17, 0.41 + linha * 0.46, z, 0, -Math.PI / 2))
  }
  if (intensidade(vestigios, "domestico") >= 3) {
    const tecido = new THREE.MeshStandardMaterial({ map: TEX.tecido(), color: 0x746b5b, roughness: 0.98 })
    const dobra = mesh(new THREE.BoxGeometry(0.2, 0.018, 0.16), tecido, PROF_PRATELEIRA * 0.55, 1.15, 1.34, 0.08, Math.PI / 2, 0.12)
    estanteEsq.add(dobra)
    manifestacoes.push("arquivo:tecido")
  }
  if (slotAusente >= 0) manifestacoes.push("arquivo:slot-ausente")
  if (intensidade(vestigios, "ordem") >= 3) manifestacoes.push("arquivo:alinhado")
  interativos.push(estanteEsq, estanteDir)
  obstaculos.push(
    caixa(-bancoX, 0, PROF_PRATELEIRA, COMPRIMENTO - 0.65),
    caixa(bancoX, 0, PROF_PRATELEIRA, COMPRIMENTO - 0.65),
  )

  // Ficha em uma mesa de catalogação inclinada, com prendedor e bandeja de
  // devolução. O móvel tem uma função legível e continua pequeno o bastante
  // para permitir passagem pelos dois lados.
  const bandeja = mesh(new THREE.BoxGeometry(0.72, 0.055, 0.5), metal, 0, 0.87, 0, -0.12)
  const haste = mesh(new THREE.BoxGeometry(0.09, 0.82, 0.09), metalEscuro, 0, 0.41, 0)
  const base = mesh(new THREE.BoxGeometry(0.48, 0.055, 0.36), metalEscuro, 0, 0.04, 0)
  const ficha = mesh(new THREE.BoxGeometry(0.57, 0.012, 0.36), papel, 0, 0.915, -0.015, -0.12)
  const presilha = mesh(new THREE.BoxGeometry(0.18, 0.025, 0.035), metalEscuro, 0, 0.945, -0.165, -0.12)
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
  const fichaAlvo = alvo(scene, refs.ficha, [bandeja, haste, base, ficha, presilha], 0, 0, 0.72)
  if (intensidade(vestigios, "frio") >= 2) {
    const gota = new THREE.MeshStandardMaterial({ color: 0xb4ced1, roughness: 0.12, transparent: true, opacity: 0.42 })
    fichaAlvo.add(mesh(new THREE.SphereGeometry(0.022, 8, 6), gota, 0.23, 0.865, -0.12))
  }
  interativos.push(fichaAlvo)
  obstaculos.push(caixa(0, 0.72, 0.74, 0.54))

  // Carimbo com empunhadura e almofada, sobre um gaveteiro de três frentes.
  const seloPartes = [
    mesh(new THREE.CylinderGeometry(0.06, 0.085, 0.11, 16), carimbo, 0, 0.75, 0),
    mesh(new THREE.CylinderGeometry(0.035, 0.055, 0.11, 14), carimbo, 0, 0.855, 0),
    mesh(new THREE.SphereGeometry(0.047, 12, 8), tinta, 0, 0.925, 0),
    mesh(new THREE.BoxGeometry(0.2, 0.025, 0.16), tinta, 0.14, 0.705, 0.04),
    mesh(new THREE.BoxGeometry(0.42, 0.68, 0.48), metal, 0, 0.34, 0),
  ]
  for (const y of [0.16, 0.34, 0.52]) {
    seloPartes.push(mesh(new THREE.BoxGeometry(0.32, 0.135, 0.025), metalEscuro, 0, y, 0.252))
    seloPartes.push(mesh(new THREE.BoxGeometry(0.1, 0.02, 0.018), papel, 0, y, 0.27))
  }
  interativos.push(alvo(scene, refs.selo, seloPartes, -0.77, 0, -1.28))
  obstaculos.push(caixa(-0.77, -1.28, 0.46, 0.52))

  // Um único instrumento de observação amarra a Sala D à Sala Final. Não é
  // interativo: sua função é fazer o visitante perguntar quem ocupa o outro
  // lado do registro.
  const camera = new THREE.Group()
  camera.add(mesh(new THREE.BoxGeometry(0.28, 0.16, 0.18), metalEscuro, 0, 0, 0))
  camera.add(mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 16), vidro, 0, -0.015, 0.14, Math.PI / 2))
  if (intensidade(vestigios, "observacao") >= 2) {
    const reflexoLente = new THREE.MeshStandardMaterial({ color: 0x8fb5ad, emissive: 0x557f76, emissiveIntensity: 0.68, roughness: 0.16 })
    camera.add(mesh(new THREE.CircleGeometry(0.035, 16), reflexoLente, 0, -0.015, 0.205))
    manifestacoes.push("camera:reflexo")
  }
  camera.add(mesh(new THREE.BoxGeometry(0.05, 0.28, 0.05), metal, 0, 0.2, -0.03, 0, 0, -0.3))
  camera.position.set(0.82, 2.18, 2.38)
  camera.rotation.y = -0.28
  camera.rotation.x = -0.22
  scene.add(camera)
  scene.add(mesh(new THREE.BoxGeometry(0.045, 0.035, 3.6), metalEscuro, mx - 0.14, 2.3, 1.15))

  const porta = criarPorta(portaL - 0.06, portaA - 0.04)
  porta.position.set(0, 0, -mz + 0.08)
  porta.userData = { tipo: "porta", ref: refs.porta }
  scene.add(porta)
  interativos.push(porta)

  scene.add(new THREE.AmbientLight(0x424747, 0.65))
  scene.add(new THREE.HemisphereLight(0xa0aaa7, 0x232724, 0.7))
  const emissivo = new THREE.MeshStandardMaterial({ color: 0xb7bdb8, emissive: 0x929b98, emissiveIntensity: 1.8, roughness: 0.28 })
  for (const [i, z] of [2.35, 0.05, -2.55].entries()) {
    scene.add(mesh(new THREE.BoxGeometry(0.9, 0.035, 0.1), emissivo, 0, 2.43, z))
    const potencia = i === 1 ? 5.2 : i === 2 ? 5.8 : 3.8
    const luz = new THREE.PointLight(i === 1 ? 0xd4d9d2 : 0xc2cbc8, potencia, 4.8, 1.8)
    luz.position.set(0, 2.31, z)
    luz.castShadow = i === 1
    if (luz.castShadow) luz.shadow.mapSize.set(512, 512)
    scene.add(luz)
  }
  const luzFicha = new THREE.SpotLight(0xe0d4b8, 2.35, 2.9, Math.PI / 5, 0.8, 2)
  luzFicha.position.set(-0.45, 1.8, 1.15)
  luzFicha.target.position.set(0, 0.88, 0.72)
  scene.add(luzFicha, luzFicha.target)
  if (intensidade(vestigios, "corte") >= 2) manifestacoes.push("ficha:risco")
  if (intensidade(vestigios, "frio") >= 2) manifestacoes.push("ficha:gota")
  if (combinacoes.fichaApagada) manifestacoes.push("rara:fichaApagada")

  return {
    id: "salaD",
    data,
    porta: refs.porta,
    obstaculos,
    interativos,
    spawn: { x: 0, y: 1.65, z: 3.0, olharY: 0 },
    fonteSom: { x: mx + 0.35, y: 1.05, z: -1.35 },
    limites: { peDireito: PE_DIREITO },
    manifestacoes,
  }
}
