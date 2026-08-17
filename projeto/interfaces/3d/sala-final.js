import * as THREE from "three"
import { caixa } from "./colisao.js"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"
import { combinacoesRaras, intensidade } from "./vestigios.js"

// Sala Final — uma pequena sala de avaliação. Diferente da Sala D, o
// arquivo não domina a arquitetura: há poucos móveis e toda a composição
// conduz ao único objeto interativo, o dossiê sobre a mesa.
const LARGURA = 4.8
const COMPRIMENTO = 4.6
const PE_DIREITO = 2.7
const ESPESSURA = 0.15

function mesh(geometria, material, x, y, z, rx = 0, ry = 0, rz = 0) {
  const objeto = new THREE.Mesh(geometria, material)
  objeto.position.set(x, y, z)
  objeto.rotation.set(rx, ry, rz)
  objeto.castShadow = true
  objeto.receiveShadow = true
  return objeto
}

function texturaTituloDiario() {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 512
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#49352e"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = "rgba(205, 187, 146, .58)"
  ctx.lineWidth = 4
  ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28)
  ctx.fillStyle = "#d0bd91"
  ctx.textAlign = "center"
  ctx.font = "bold 31px Georgia, serif"
  ctx.fillText("DIÁRIO", 128, 176)
  ctx.fillText("DE BORDO", 128, 218)
  ctx.font = "22px Georgia, serif"
  ctx.fillText("A CASA", 128, 280)
  ctx.font = "19px Georgia, serif"
  ctx.fillText("2026", 128, 326)
  const textura = new THREE.CanvasTexture(canvas)
  textura.colorSpace = THREE.SRGBColorSpace
  return textura
}

function criarDiarioFisico() {
  const grupo = new THREE.Group()
  const capa = new THREE.MeshStandardMaterial({
    color: 0x49352e,
    emissive: 0x6a4c37,
    emissiveIntensity: 0.035,
    roughness: 0.84,
  })
  const paginas = new THREE.MeshStandardMaterial({ color: 0xc3b99e, roughness: 0.94 })
  const titulo = new THREE.MeshBasicMaterial({ map: texturaTituloDiario(), transparent: false })

  grupo.add(mesh(new THREE.BoxGeometry(0.24, 0.36, 0.025), capa, 0, 0, -0.025))
  grupo.add(mesh(new THREE.BoxGeometry(0.22, 0.325, 0.045), paginas, 0.005, -0.002, 0))
  grupo.add(mesh(new THREE.BoxGeometry(0.24, 0.36, 0.025), capa, 0, 0, 0.025))
  grupo.add(mesh(new THREE.BoxGeometry(0.035, 0.36, 0.07), capa, -0.11, 0, 0))
  grupo.add(mesh(new THREE.PlaneGeometry(0.18, 0.3), titulo, 0.008, 0, 0.039))

  return { grupo, materialCapa: capa }
}

function criarDossie(materiais, vestigios, rota) {
  const grupo = new THREE.Group()
  const { pasta, papel, tinta, metal } = materiais
  const combinacoes = combinacoesRaras(vestigios, rota)

  grupo.add(mesh(new THREE.BoxGeometry(0.56, 0.025, 0.39), pasta, 0, 0.013, 0))
  grupo.add(mesh(new THREE.BoxGeometry(0.51, 0.028, 0.35), papel, 0.01, 0.038, -0.005))
  grupo.add(mesh(new THREE.BoxGeometry(0.22, 0.006, 0.11), papel, -0.04, 0.057, -0.035))
  grupo.add(mesh(new THREE.BoxGeometry(0.15, 0.005, 0.012), tinta, -0.04, 0.062, -0.055))
  grupo.add(mesh(new THREE.BoxGeometry(0.11, 0.005, 0.009), tinta, -0.06, 0.062, -0.025))
  grupo.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.018, 10), metal, 0.22, 0.05, 0.13))

  if (intensidade(vestigios, "corte") >= 2) {
    const linha = new THREE.MeshStandardMaterial({ color: 0x70433d, roughness: 0.95 })
    grupo.add(mesh(new THREE.BoxGeometry(0.42, 0.005, 0.009), linha, 0.01, 0.064, 0.085, 0, 0.02, -0.025))
  }
  if (intensidade(vestigios, "observacao") >= 2) {
    const registro = new THREE.MeshStandardMaterial({ color: 0x373a37, roughness: 0.32, metalness: 0.55 })
    grupo.add(mesh(new THREE.RingGeometry(0.018, 0.025, 16), registro, 0.18, 0.066, -0.1, -Math.PI / 2))
  }
  if (combinacoes.reflexoCortado) {
    const reflexo = new THREE.MeshStandardMaterial({ color: 0x9ba6a3, emissive: 0x687773, emissiveIntensity: 0.48, roughness: 0.2 })
    grupo.add(mesh(new THREE.BoxGeometry(0.31, 0.004, 0.006), reflexo, -0.04, 0.067, 0.03, 0, 0, 0.04))
  } else if (combinacoes.fibraMarcada) {
    const fibra = new THREE.MeshStandardMaterial({ color: 0x713c36, roughness: 0.98 })
    grupo.add(mesh(new THREE.BoxGeometry(0.26, 0.004, 0.006), fibra, -0.08, 0.067, 0.14, 0, 0, -0.08))
  } else if (combinacoes.horaCondensada) {
    const gota = new THREE.MeshStandardMaterial({ color: 0xaec7c8, roughness: 0.12, transparent: true, opacity: 0.38 })
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      grupo.add(mesh(new THREE.SphereGeometry(0.009, 6, 5), gota, 0.16 + Math.cos(a) * 0.045, 0.069, 0.08 + Math.sin(a) * 0.045))
    }
  } else if (combinacoes.fichaApagada) {
    const apagado = new THREE.MeshStandardMaterial({ color: 0x766e5f, roughness: 1, transparent: true, opacity: 0.3 })
    const marca = mesh(new THREE.RingGeometry(0.035, 0.052, 20), apagado, -0.12, 0.068, 0.01, -Math.PI / 2)
    marca.scale.x = 1.5
    grupo.add(marca)
  }

  return grupo
}

export function construirSalaFinal(scene, ctx = {}) {
  const data = DATA.salas.salaFinal
  const vestigios = ctx.vestigios
  const refDossie = data.objetos.find((objeto) => objeto.id === "dossie")
  const refDiario = { id: "diario", nome: "Diário de Bordo", fala: "Folhear o registro" }
  const obstaculos = []
  const interativos = []
  const mx = LARGURA / 2
  const mz = COMPRIMENTO / 2

  const parede = new THREE.MeshStandardMaterial({ map: TEX.parede(2, 2), color: 0x74736b, roughness: 0.95 })
  const piso = new THREE.MeshStandardMaterial({ map: TEX.madeiraEscura(3, 3), color: 0x49443b, roughness: 0.88 })
  const madeira = new THREE.MeshStandardMaterial({ map: TEX.madeiraEscura(2, 2), color: 0x554939, roughness: 0.84 })
  const metal = new THREE.MeshStandardMaterial({ map: TEX.metal(), color: 0x646b69, roughness: 0.57, metalness: 0.62 })
  const metalEscuro = new THREE.MeshStandardMaterial({ color: 0x303433, roughness: 0.7, metalness: 0.45 })
  const tecido = new THREE.MeshStandardMaterial({ map: TEX.tecido(), color: 0x393b38, roughness: 0.96 })
  const corPapel = intensidade(vestigios, "frio") >= 2 ? 0xbfc1b4 : 0xc8bda3
  const papel = new THREE.MeshStandardMaterial({ map: TEX.papel(), color: corPapel, roughness: 0.91 })
  const pasta = new THREE.MeshStandardMaterial({ color: 0x9a8050, roughness: 0.88 })
  const tinta = new THREE.MeshStandardMaterial({ color: 0x302b24, roughness: 1 })

  // Casca simples, fechada. A porta no fundo é apenas arquitetura: o
  // jogador chegou ao último ambiente e o único caminho narrativo é o dossiê.
  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), piso, 0, 0, 0, -Math.PI / 2))
  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), parede, 0, PE_DIREITO, 0, Math.PI / 2))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), parede, -mx, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), parede, mx, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(LARGURA, PE_DIREITO, ESPESSURA), parede, 0, PE_DIREITO / 2, mz))
  scene.add(mesh(new THREE.BoxGeometry(LARGURA, PE_DIREITO, ESPESSURA), parede, 0, PE_DIREITO / 2, -mz))
  obstaculos.push(
    caixa(-mx, 0, ESPESSURA, COMPRIMENTO + ESPESSURA),
    caixa(mx, 0, ESPESSURA, COMPRIMENTO + ESPESSURA),
    caixa(0, mz, LARGURA, ESPESSURA),
    caixa(0, -mz, LARGURA, ESPESSURA),
  )

  // Mesa central, robusta e vazia o bastante para o arquivo dominar.
  const mesaL = 1.8
  const mesaP = 1.08
  const mesaA = 0.78
  scene.add(mesh(new THREE.BoxGeometry(mesaL, 0.09, mesaP), madeira, 0, mesaA, 0.05))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    scene.add(mesh(new THREE.BoxGeometry(0.075, mesaA, 0.075), metalEscuro, sx * 0.75, mesaA / 2, 0.05 + sz * 0.39))
  }
  obstaculos.push(caixa(0, 0.05, mesaL, mesaP))

  // Cadeira do avaliador, voltada para a mesa e ligeiramente fora do eixo
  // para não esconder o dossiê no enquadramento inicial.
  scene.add(mesh(new THREE.BoxGeometry(0.55, 0.08, 0.5), tecido, -0.42, 0.48, 1.02))
  scene.add(mesh(new THREE.BoxGeometry(0.55, 0.62, 0.07), tecido, -0.42, 0.79, 1.24, 0.06))
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    scene.add(mesh(new THREE.BoxGeometry(0.05, 0.47, 0.05), metalEscuro, -0.42 + sx * 0.22, 0.235, 1.02 + sz * 0.19))
  }
  obstaculos.push(caixa(-0.42, 1.02, 0.62, 0.62))

  // Armário baixo e estante compacta ao fundo: uma descoberta secundária,
  // fora do eixo mesa–dossiê e sem repetir o corredor de arquivos da Sala D.
  scene.add(mesh(new THREE.BoxGeometry(1.15, 0.78, 0.38), metal, -1.63, 0.39, -1.82))
  scene.add(mesh(new THREE.BoxGeometry(1.12, 1.12, 0.055), metalEscuro, -1.63, 1.42, -1.98))
  for (const x of [-2.16, -1.1]) {
    scene.add(mesh(new THREE.BoxGeometry(0.06, 1.12, 0.34), metalEscuro, x, 1.42, -1.84))
  }
  for (const y of [0.88, 1.24, 1.6, 1.98]) {
    scene.add(mesh(new THREE.BoxGeometry(1.03, 0.028, 0.31), metal, -1.63, y, -1.67))
  }
  const volumes = [
    { x: -2, y: 1.055, h: 0.31, cor: 0x75684f, inclinacao: 0.015 },
    { x: -1.89, y: 1.045, h: 0.29, cor: 0x5f665f, inclinacao: -0.035 },
    { x: -1.28, y: 1.415, h: 0.32, cor: 0x6d5b48, inclinacao: 0.025 },
    { x: -1.17, y: 1.405, h: 0.3, cor: 0x5c5548, inclinacao: -0.02 },
  ]
  for (const volume of volumes) {
    const materialVolume = new THREE.MeshStandardMaterial({ color: volume.cor, roughness: 0.91 })
    scene.add(mesh(new THREE.BoxGeometry(0.085, volume.h, 0.24), materialVolume, volume.x, volume.y, -1.63, 0, 0, volume.inclinacao))
  }

  const { grupo: diario, materialCapa: materialDiario } = criarDiarioFisico()
  diario.position.set(-1.7, 1.43, -1.61)
  diario.rotation.z = -0.075
  diario.rotation.y = -0.035
  diario.userData = { tipo: "diario", ref: refDiario }
  scene.add(diario)
  interativos.push(diario)
  let tempoDiario = 0
  obstaculos.push(caixa(-1.63, -1.82, 1.2, 0.42))

  // Porta fechada e quadro de protocolo: elementos estáticos, sem competir
  // com o único alvo interativo.
  const portaFundo = criarPorta(0.82, 1.98)
  portaFundo.position.set(0.66, 0, -mz + 0.085)
  scene.add(portaFundo)

  scene.add(mesh(new THREE.BoxGeometry(0.045, 1.18, 1.45), metalEscuro, mx - 0.09, 1.48, -0.55))
  const aviso = mesh(new THREE.PlaneGeometry(1.03, 0.72), papel, mx - 0.116, 1.48, -0.55, 0, -Math.PI / 2)
  scene.add(aviso)
  for (let i = 0; i < 5; i++) {
    scene.add(mesh(new THREE.BoxGeometry(0.006, 0.012, 0.7 - i * 0.07), tinta, mx - 0.124, 1.68 - i * 0.09, -0.55))
  }

  // O dossiê continua sendo o alvo principal no centro da composição.
  const dossie = criarDossie({ pasta, papel, tinta, metal }, vestigios, ctx.rotaFinalId)
  dossie.position.set(0.08, mesaA + 0.055, -0.02)
  dossie.rotation.y = intensidade(vestigios, "ordem") >= 3 ? -0.08 : -0.16
  dossie.userData = { tipo: "dossie", ref: refDossie }
  scene.add(dossie)
  interativos.push(dossie)

  // Luz institucional envelhecida, com foco discreto no documento.
  scene.add(new THREE.AmbientLight(0x4e4d48, 0.72))
  scene.add(new THREE.HemisphereLight(0x8f9896, 0x2b2925, 0.62))
  const teto = new THREE.PointLight(0xe4dbc5, 5.2, 6.2, 1.85)
  teto.position.set(0, 2.42, 0.18)
  teto.castShadow = true
  teto.shadow.mapSize.set(512, 512)
  scene.add(teto)
  const calha = new THREE.MeshStandardMaterial({ color: 0xd0c7b3, emissive: 0xbcb39f, emissiveIntensity: 1.6, roughness: 0.28 })
  scene.add(mesh(new THREE.BoxGeometry(1.1, 0.04, 0.13), calha, 0, 2.57, 0.18))
  const preenchimento = new THREE.PointLight(0xa9b2ae, 1.6, 4.2, 2)
  preenchimento.position.set(-1.45, 1.45, -1.2)
  scene.add(preenchimento)
  const foco = new THREE.SpotLight(0xe8d6aa, 3.4, 3.2, Math.PI / 5, 0.72, 2)
  foco.position.set(0.45, 1.85, 0.55)
  foco.target.position.copy(dossie.position)
  scene.add(foco)
  scene.add(foco.target)

  return {
    id: "salaFinal",
    data,
    porta: null,
    obstaculos,
    interativos,
    spawn: { x: 0.92, y: 1.65, z: 1.78, olharY: 0.42 },
    fonteSom: { x: -0.2, y: 2.56, z: 0.18 },
    limites: { peDireito: PE_DIREITO },
    atualizar(delta) {
      tempoDiario += delta
      materialDiario.emissiveIntensity = 0.035 + (Math.sin(tempoDiario * 1.45) + 1) * 0.022
    },
  }
}
