import * as THREE from "three"
import { caixa, cilindro } from "./colisao.js"
import { criarPorta } from "./modelos.js"

// Área bônus curta e autocontida. Não consulta Vestígios, não decide rota e
// não alimenta o dossiê; usa apenas o contrato comum de uma sala 3D.
const LARGURA = 5.2
const COMPRIMENTO = 5.8
const PE_DIREITO = 3.1
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
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#b8b89d"
  ctx.fillRect(0, 0, 512, 256)
  ctx.strokeStyle = "#4b554a"
  ctx.lineWidth = 6
  ctx.strokeRect(14, 14, 484, 228)
  ctx.fillStyle = "#26332d"
  ctx.textAlign = "center"
  ctx.font = "24px Courier New, monospace"
  ctx.fillText("AMBIENTE NÃO CATALOGADO", 256, 112)
  ctx.font = "17px Courier New, monospace"
  ctx.fillText("ACESSO MANTIDO POR COMPATIBILIDADE", 256, 154)
  const textura = new THREE.CanvasTexture(canvas)
  textura.colorSpace = THREE.SRGBColorSpace
  return textura
}

function criarPlanta(materialFolha, materialCaule, escala, x, z, rotacao = 0) {
  const grupo = new THREE.Group()
  grupo.add(mesh(new THREE.CylinderGeometry(0.018, 0.035, 0.75, 7), materialCaule, 0, 0.38, 0))
  for (let i = 0; i < 7; i++) {
    const angulo = rotacao + i * 2.37
    const folha = mesh(new THREE.ConeGeometry(0.12, 0.52, 5), materialFolha, Math.cos(angulo) * 0.13, 0.42 + (i % 3) * 0.14, Math.sin(angulo) * 0.13, 0, 0, Math.PI / 2 - angulo)
    folha.scale.z = 0.35
    grupo.add(folha)
  }
  grupo.scale.setScalar(escala)
  grupo.position.set(x, 0, z)
  return grupo
}

function criarDinossauro(material, escala = 1) {
  const grupo = new THREE.Group()
  grupo.add(mesh(new THREE.SphereGeometry(0.34, 10, 7), material, 0, 0.62, 0))
  grupo.add(mesh(new THREE.CylinderGeometry(0.12, 0.22, 0.72, 8), material, 0.22, 0.83, -0.02, 0, 0, -0.62))
  grupo.add(mesh(new THREE.SphereGeometry(0.2, 9, 6), material, 0.48, 1.08, -0.02))
  const cauda = mesh(new THREE.ConeGeometry(0.14, 1.05, 7), material, -0.58, 0.64, 0, 0, 0, Math.PI / 2)
  grupo.add(cauda)
  for (const x of [-0.17, 0.16]) {
    grupo.add(mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.48, 7), material, x, 0.25, 0.13, 0.06, 0, x * 0.2))
  }
  grupo.scale.setScalar(escala)
  return grupo
}

export function construirSalaDino(scene) {
  const data = DATA.salas.salaDino
  const refPorta = data.objetos.find((objeto) => objeto.ehSaida)
  const obstaculos = []
  const interativos = []
  const mx = LARGURA / 2
  const mz = COMPRIMENTO / 2

  const parede = new THREE.MeshStandardMaterial({ color: 0x27332c, roughness: 0.98 })
  const piso = new THREE.MeshStandardMaterial({ color: 0x1b251d, roughness: 1 })
  const rocha = new THREE.MeshStandardMaterial({ color: 0x38453b, roughness: 0.96 })
  const folha = new THREE.MeshStandardMaterial({ color: 0x3c6745, emissive: 0x173522, emissiveIntensity: 0.18, roughness: 0.91 })
  const caule = new THREE.MeshStandardMaterial({ color: 0x4d5233, roughness: 0.96 })
  const dinoMat = new THREE.MeshStandardMaterial({ color: 0x6f925f, emissive: 0x203d27, emissiveIntensity: 0.24, roughness: 0.74 })

  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), piso, 0, 0, 0, -Math.PI / 2))
  scene.add(mesh(new THREE.PlaneGeometry(LARGURA, COMPRIMENTO), parede, 0, PE_DIREITO, 0, Math.PI / 2))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), parede, -mx, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(ESPESSURA, PE_DIREITO, COMPRIMENTO), parede, mx, PE_DIREITO / 2, 0))
  scene.add(mesh(new THREE.BoxGeometry(LARGURA, PE_DIREITO, ESPESSURA), parede, 0, PE_DIREITO / 2, mz))
  scene.add(mesh(new THREE.BoxGeometry(LARGURA, PE_DIREITO, ESPESSURA), parede, 0, PE_DIREITO / 2, -mz))
  obstaculos.push(
    caixa(-mx, 0, ESPESSURA, COMPRIMENTO + ESPESSURA), caixa(mx, 0, ESPESSURA, COMPRIMENTO + ESPESSURA),
    caixa(0, mz, LARGURA, ESPESSURA), caixa(0, -mz, LARGURA, ESPESSURA),
  )

  for (const [i, [x, z, escala]] of [[-2.0, -1.8, 1.2], [2.05, -1.5, 1.05], [-2.1, 1.55, 0.92], [1.9, 1.65, 1.18], [0.95, -2.15, 0.72]].entries()) {
    scene.add(criarPlanta(folha, caule, escala, x, z, i * 0.7))
    obstaculos.push(cilindro(x, z, 0.18 * escala))
  }
  for (const [x, z, escala] of [[-1.35, -0.55, 0.72], [1.35, 0.6, 0.5], [0.2, -1.75, 0.42]]) {
    const pedra = mesh(new THREE.DodecahedronGeometry(0.42 * escala, 0), rocha, x, 0.18 * escala, z)
    pedra.scale.y = 0.55
    scene.add(pedra)
  }

  const dino = criarDinossauro(dinoMat, 1.05)
  dino.position.set(0.2, 0, -0.45)
  dino.rotation.y = -0.48
  scene.add(dino)
  obstaculos.push(cilindro(0.2, -0.45, 0.5))

  const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 0.78), new THREE.MeshBasicMaterial({ map: texturaAviso() }))
  placa.position.set(0, 1.76, -mz + 0.085)
  scene.add(placa)

  const porta = criarPorta(0.84, 2.02)
  porta.position.set(0, 0, mz - 0.09)
  porta.rotation.y = Math.PI
  porta.userData = { tipo: "porta", ref: refPorta }
  scene.add(porta)
  interativos.push(porta)

  scene.add(new THREE.AmbientLight(0x294737, 0.78))
  scene.add(new THREE.HemisphereLight(0x86b58f, 0x172219, 1.05))
  const luz = new THREE.PointLight(0x9dd49b, 6.8, 6.4, 1.8)
  luz.position.set(-0.4, 2.45, -0.2)
  luz.castShadow = true
  luz.shadow.mapSize.set(512, 512)
  scene.add(luz)
  const fundo = new THREE.PointLight(0x4da59a, 3.1, 4.5, 2)
  fundo.position.set(1.8, 1.1, -1.9)
  scene.add(fundo)

  let tempo = 0
  return {
    id: "salaDino",
    data,
    porta: refPorta,
    obstaculos,
    interativos,
    spawn: { x: 0, y: 1.65, z: 2.05, olharY: 0 },
    fonteSom: { x: 1.6, y: 0.7, z: -2.1 },
    limites: { peDireito: PE_DIREITO },
    ambiente: { fundo: 0x07100c, nevoa: { cor: 0x10251a, densidade: 0.12 } },
    atualizar(delta) {
      tempo += delta
      dino.rotation.y = -0.48 + Math.sin(tempo * 0.42) * 0.025
      dinoMat.emissiveIntensity = 0.2 + (Math.sin(tempo * 0.75) + 1) * 0.045
    },
  }
}
