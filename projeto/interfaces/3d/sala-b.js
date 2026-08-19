import * as THREE from "three"
import { caixa } from "./colisao.js"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"
import { combinacoesRaras, intensidade } from "./vestigios.js"

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

function tecidoMesa(material) {
  const geometria = new THREE.PlaneGeometry(1.52, 2.08, 8, 12)
  const pos = geometria.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const borda = Math.max(Math.abs(x) / 0.76, Math.abs(y) / 1.04)
    pos.setZ(i, Math.sin(x * 8 + y * 3) * 0.004 - Math.max(0, borda - 0.86) * 0.035)
  }
  geometria.computeVertexNormals()
  const pano = mesh(geometria, material, 0, 0.842, 0, -Math.PI / 2)
  pano.material.side = THREE.DoubleSide
  return pano
}

function pratoPosto(materialLouca, materialMetal, z) {
  const partes = []
  partes.push(mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.025, 28), materialLouca, 0, 0.855, z))
  partes.push(mesh(new THREE.TorusGeometry(0.125, 0.012, 7, 28), materialLouca, 0, 0.873, z, Math.PI / 2))
  for (const x of [-0.245, 0.245]) {
    partes.push(mesh(new THREE.BoxGeometry(0.016, 0.012, 0.25), materialMetal, x, 0.874, z))
  }
  // Três dentes tornam o talher da esquerda reconhecível sem geometria cara.
  for (let i = -1; i <= 1; i++) {
    partes.push(mesh(new THREE.BoxGeometry(0.007, 0.012, 0.06), materialMetal, -0.245 + i * 0.012, 0.876, z - 0.145))
  }
  return partes
}

export function construirSalaB(scene, ctx = {}) {
  const data = DATA.salas.salaB
  const vestigios = ctx.vestigios
  const combinacoes = combinacoesRaras(vestigios, "salaB")
  const refs = Object.fromEntries(data.objetos.map((objeto) => [objeto.id, objeto]))
  const obstaculos = []
  const interativos = []
  const manifestacoes = []

  const parede = new THREE.MeshStandardMaterial({ map: TEX.parede(2, 2), color: 0x8b806f, roughness: 0.94 })
  const piso = new THREE.MeshStandardMaterial({ map: TEX.madeiraEscura(3, 4), color: 0x665845, roughness: 0.86 })
  const madeira = new THREE.MeshStandardMaterial({ map: TEX.madeiraEscura(1, 2), color: 0x574735, roughness: 0.82 })
  const tecido = new THREE.MeshStandardMaterial({ map: TEX.tecido(2, 2), color: 0x8b8373, roughness: 0.98 })
  const metal = new THREE.MeshStandardMaterial({ map: TEX.metal(), color: 0x8a8a84, roughness: 0.42, metalness: 0.78 })
  const louca = new THREE.MeshStandardMaterial({ color: 0xd1cbbc, roughness: 0.25 })
  const vidro = new THREE.MeshStandardMaterial({ color: 0xb8c5c3, roughness: 0.08, transparent: true, opacity: 0.32 })
  const escuro = new THREE.MeshStandardMaterial({ color: 0x29251f, roughness: 0.85 })
  const papel = new THREE.MeshStandardMaterial({ map: TEX.papel(), color: 0xb7ad96, roughness: 0.94 })

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

  // Molduras e um aparador reconstruído de forma quase simétrica deixam a
  // sala doméstica demais para ser institucional, e regular demais para ser
  // uma casa em uso. Um nicho permanece vazio no conjunto.
  for (const x of [-1.25, 0, 1.25]) {
    scene.add(mesh(new THREE.BoxGeometry(0.92, 0.045, 0.035), madeira, x, 2.04, mz - 0.09))
    scene.add(mesh(new THREE.BoxGeometry(0.045, 0.72, 0.035), madeira, x - 0.44, 1.7, mz - 0.09))
    scene.add(mesh(new THREE.BoxGeometry(0.045, 0.72, 0.035), madeira, x + 0.44, 1.7, mz - 0.09))
    scene.add(mesh(new THREE.BoxGeometry(0.92, 0.045, 0.035), madeira, x, 1.36, mz - 0.09))
  }
  const aparadorX = -mx + 0.34
  scene.add(mesh(new THREE.BoxGeometry(0.56, 0.82, 2.1), madeira, aparadorX, 0.41, 0.08))
  for (const z of [-0.62, 0.08, 0.78]) {
    scene.add(mesh(new THREE.BoxGeometry(0.025, 0.62, 0.58), escuro, aparadorX + 0.293, 0.47, z))
    scene.add(mesh(new THREE.BoxGeometry(0.018, 0.025, 0.18), metal, aparadorX + 0.31, 0.49, z))
  }
  for (const [z, presente] of [[-0.62, true], [0.08, false], [0.78, true]]) {
    if (!presente) {
      const marca = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.25), new THREE.MeshStandardMaterial({ color: 0x817867, transparent: true, opacity: 0.2, roughness: 1 }))
      marca.position.set(aparadorX + 0.315, 1.08, z)
      marca.rotation.y = Math.PI / 2
      scene.add(marca)
      continue
    }
    scene.add(mesh(new THREE.CylinderGeometry(0.1, 0.075, 0.22, 18), louca, aparadorX + 0.03, 0.97, z))
  }
  obstaculos.push(caixa(aparadorX, 0.08, 0.6, 2.16))

  // Mesa posta: a toalha é um alvo próprio e cobre só o tampo; a mesa
  // mantém pés e talheres no mesmo grupo para o contorno ler o conjunto.
  const mesaPartes = [mesh(new THREE.BoxGeometry(1.58, 0.09, 2.15), madeira, 0, 0.77, 0)]
  mesaPartes.push(mesh(new THREE.BoxGeometry(1.43, 0.14, 0.06), madeira, 0, 0.67, -0.97))
  mesaPartes.push(mesh(new THREE.BoxGeometry(1.43, 0.14, 0.06), madeira, 0, 0.67, 0.97))
  mesaPartes.push(mesh(new THREE.BoxGeometry(0.06, 0.14, 1.88), madeira, -0.7, 0.67, 0))
  mesaPartes.push(mesh(new THREE.BoxGeometry(0.06, 0.14, 1.88), madeira, 0.7, 0.67, 0))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    mesaPartes.push(mesh(new THREE.BoxGeometry(0.075, 0.74, 0.075), madeira, sx * 0.66, 0.37, sz * 0.94))
  }
  for (const z of [-0.58, 0.58]) mesaPartes.push(...pratoPosto(louca, metal, z))
  const mesa = alvo(scene, refs.mesa, mesaPartes, -0.18, 0, -0.05)
  if (intensidade(vestigios, "registro") >= 2) {
    const tinta = new THREE.MeshStandardMaterial({ color: 0x3d3932, roughness: 1 })
    mesa.add(mesh(new THREE.BoxGeometry(0.2, 0.008, 0.1), papel, 0.52, 0.837, -0.64, 0, 0.08))
    mesa.add(mesh(new THREE.BoxGeometry(0.11, 0.003, 0.008), tinta, 0.52, 0.844, -0.64, 0, 0.08))
  }
  interativos.push(mesa)
  obstaculos.push(caixa(-0.18, -0.05, 1.58, 2.15))

  const toalha = alvo(scene, refs.toalha, [tecidoMesa(tecido)])
  toalha.position.set(-0.18, 0, -0.05)
  if (intensidade(vestigios, "corte") >= 2) {
    const corFibra = combinacoes.fibraMarcada ? 0x713c36 : 0x4b4439
    const fibra = new THREE.MeshStandardMaterial({ color: corFibra, roughness: 0.96 })
    toalha.add(mesh(new THREE.BoxGeometry(1.12, 0.005, 0.012), fibra, 0.02, 0.839, -0.94, 0, 0, -0.01))
    if (combinacoes.fibraMarcada) {
      toalha.add(mesh(new THREE.BoxGeometry(0.34, 0.004, 0.009), fibra, -0.29, 0.841, -0.91, 0, 0.05))
    }
  }
  interativos.push(toalha)

  // Cadeira isolada no lado norte, virada de costas para a entrada.
  const cadeiraPartes = [mesh(new THREE.BoxGeometry(0.52, 0.08, 0.48), madeira, 0, 0.47, 0)]
  cadeiraPartes.push(mesh(new THREE.BoxGeometry(0.52, 0.075, 0.065), madeira, 0, 1.04, -0.21))
  for (const x of [-0.2, -0.1, 0, 0.1, 0.2]) {
    cadeiraPartes.push(mesh(new THREE.BoxGeometry(0.038, 0.52, 0.045), madeira, x, 0.79, -0.21, 0.06))
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    cadeiraPartes.push(mesh(new THREE.BoxGeometry(0.055, 0.46, 0.055), madeira, sx * 0.21, 0.23, sz * 0.18))
  }
  const cadeiraX = intensidade(vestigios, "ausencia") >= 3 ? -0.27 : -0.18
  const cadeiraRotacao = Math.PI + (intensidade(vestigios, "ordem") >= 3 ? 0 : 0.11)
  interativos.push(alvo(scene, refs.cadeira, cadeiraPartes, cadeiraX, 0, -1.56, cadeiraRotacao))
  obstaculos.push(caixa(cadeiraX, -1.56, 0.58, 0.58))
  if (cadeiraX !== -0.18) manifestacoes.push("cadeira:deslocada")
  if (cadeiraRotacao === Math.PI) manifestacoes.push("cadeira:alinhada")

  // Copo de boca para baixo no lugar oposto ao da cadeira.
  const copoPartes = [
    mesh(new THREE.CylinderGeometry(0.052, 0.038, 0.14, 20, 1, true), vidro, 0, 0.9, 0),
    mesh(new THREE.RingGeometry(0.041, 0.052, 20), vidro, 0, 0.973, 0, -Math.PI / 2),
    mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.008, 20), vidro, 0, 0.828, 0),
  ]
  const copo = alvo(scene, refs.copo, copoPartes, 0.34, 0, 0.62)
  if (intensidade(vestigios, "observacao") >= 2) {
    const reflexo = new THREE.MeshStandardMaterial({ color: 0xdbe4e1, emissive: 0x6f8584, emissiveIntensity: 0.35, roughness: 0.12 })
    copo.add(mesh(new THREE.RingGeometry(0.026, 0.032, 18), reflexo, 0, 0.982, 0, -Math.PI / 2))
  }
  interativos.push(copo)

  const porta = criarPorta(portaL - 0.06, portaA - 0.04)
  porta.position.set(0, 0, -mz + 0.08)
  porta.userData = { tipo: "porta", ref: refs.porta }
  scene.add(porta)
  interativos.push(porta)

  scene.add(new THREE.AmbientLight(0x5b5145, 0.72))
  scene.add(new THREE.HemisphereLight(0xb0a28a, 0x33281e, 0.68))
  const pendente = new THREE.PointLight(0xffcf91, 8.4, 6.8, 2)
  pendente.position.set(-0.18, 2.18, -0.05)
  pendente.castShadow = true
  pendente.shadow.mapSize.set(512, 512)
  scene.add(pendente)
  scene.add(mesh(new THREE.ConeGeometry(0.24, 0.18, 20, 1, true), madeira, -0.18, 2.34, -0.05, Math.PI))
  for (const x of [-1.25, 1.25]) {
    const lavagem = new THREE.SpotLight(0xe3c79c, 1.45, 3.5, Math.PI / 5, 0.92, 2)
    lavagem.position.set(x, 2.22, mz - 0.5)
    lavagem.target.position.set(x, 1.45, mz - 0.08)
    scene.add(lavagem, lavagem.target)
  }
  const luzPorta = new THREE.PointLight(0xaab9c4, 3.2, 4.2, 2)
  luzPorta.position.set(0, 1.75, -mz + 0.35)
  scene.add(luzPorta)
  if (intensidade(vestigios, "frio") >= 2) {
    const reflexoFrio = new THREE.PointLight(0xa8c8d2, 0.55, 1.45, 2)
    reflexoFrio.position.set(0.34, 1.02, 0.62)
    scene.add(reflexoFrio)
  }
  if (intensidade(vestigios, "registro") >= 2) manifestacoes.push("mesa:ficha")
  if (intensidade(vestigios, "corte") >= 2) manifestacoes.push("toalha:fibra")
  if (intensidade(vestigios, "observacao") >= 2) manifestacoes.push("copo:reflexo")
  if (intensidade(vestigios, "frio") >= 2) manifestacoes.push("copo:luz-fria")
  if (combinacoes.fibraMarcada) manifestacoes.push("rara:fibraMarcada")

  return {
    id: "salaB",
    data,
    porta: refs.porta,
    obstaculos,
    interativos,
    spawn: { x: 1.08, y: 1.65, z: 2.12, olharY: 0.42 },
    fonteSom: { x: -mx - 0.2, y: 0.8, z: -0.9 },
    limites: { peDireito: PE_DIREITO },
    manifestacoes,
  }
}
