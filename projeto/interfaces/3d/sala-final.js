import * as THREE from "three"
import { caixa } from "./colisao.js"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"

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

function criarDossie(materiais) {
  const grupo = new THREE.Group()
  const { pasta, papel, tinta, metal } = materiais

  grupo.add(mesh(new THREE.BoxGeometry(0.56, 0.025, 0.39), pasta, 0, 0.013, 0))
  grupo.add(mesh(new THREE.BoxGeometry(0.51, 0.028, 0.35), papel, 0.01, 0.038, -0.005))
  grupo.add(mesh(new THREE.BoxGeometry(0.22, 0.006, 0.11), papel, -0.04, 0.057, -0.035))
  grupo.add(mesh(new THREE.BoxGeometry(0.15, 0.005, 0.012), tinta, -0.04, 0.062, -0.055))
  grupo.add(mesh(new THREE.BoxGeometry(0.11, 0.005, 0.009), tinta, -0.06, 0.062, -0.025))
  grupo.add(mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.018, 10), metal, 0.22, 0.05, 0.13))

  return grupo
}

export function construirSalaFinal(scene) {
  const data = DATA.salas.salaFinal
  const refDossie = data.objetos.find((objeto) => objeto.id === "dossie")
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
  const papel = new THREE.MeshStandardMaterial({ map: TEX.papel(), color: 0xc8bda3, roughness: 0.91 })
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

  // Armário baixo e estante compacta ao fundo: suficientes para sugerir
  // rotina administrativa, sem repetir o corredor de arquivos da Sala D.
  scene.add(mesh(new THREE.BoxGeometry(1.15, 0.78, 0.38), metal, -1.63, 0.39, -1.82))
  scene.add(mesh(new THREE.BoxGeometry(1.12, 1.12, 0.34), metalEscuro, -1.63, 1.42, -1.84))
  for (const y of [0.96, 1.34, 1.72]) {
    scene.add(mesh(new THREE.BoxGeometry(1.03, 0.028, 0.31), metal, -1.63, y, -1.67))
  }
  for (let i = 0; i < 8; i++) {
    scene.add(mesh(new THREE.BoxGeometry(0.075, 0.3, 0.24), pasta, -2.0 + (i % 4) * 0.22, 1.11 + Math.floor(i / 4) * 0.39, -1.63, 0, 0, (i % 3 - 1) * 0.025))
  }
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

  // O único objeto interativo.
  const dossie = criarDossie({ pasta, papel, tinta, metal })
  dossie.position.set(0.08, mesaA + 0.055, -0.02)
  dossie.rotation.y = -0.16
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
  }
}
