// Modelos procedurais leves da experiência 3D.
// Cada silhueta contém as partes necessárias para leitura imediata. As peças
// que reagem ao clique recebem `name`, mantendo o motor separado da modelagem.

import * as THREE from "three"
import { TEX } from "./texturas.js"

const M = {
  aco: new THREE.MeshStandardMaterial({ map: TEX.metal(1, 1), color: 0xb7bdc1, roughness: 0.25, metalness: 0.9 }),
  acoEscuro: new THREE.MeshStandardMaterial({ map: TEX.metal(1, 1), color: 0x656b70, roughness: 0.48, metalness: 0.78 }),
  acoGasto: new THREE.MeshStandardMaterial({ map: TEX.metal(1, 1), color: 0x77766f, roughness: 0.7, metalness: 0.62 }),
  madeira: new THREE.MeshStandardMaterial({ map: TEX.madeiraClara(1.4, 1.8), color: 0xc09a68, roughness: 0.72 }),
  madeiraEscura: new THREE.MeshStandardMaterial({ map: TEX.madeiraEscura(1, 2), color: 0x5c4937, roughness: 0.8 }),
  louca: new THREE.MeshStandardMaterial({ color: 0xd3cdbf, roughness: 0.32, metalness: 0.02 }),
  loucaEsmalte: new THREE.MeshStandardMaterial({ color: 0xeee8db, roughness: 0.14, metalness: 0.02 }),
  pano: new THREE.MeshStandardMaterial({ map: TEX.tecido(1.5, 1.5), color: 0x9c8e78, roughness: 0.98, side: THREE.DoubleSide }),
  costura: new THREE.MeshStandardMaterial({ color: 0x665b4b, roughness: 1 }),
  papel: new THREE.MeshStandardMaterial({ map: TEX.papel(1, 1), color: 0xd2c7aa, roughness: 0.92 }),
  papelEscuro: new THREE.MeshStandardMaterial({ map: TEX.papel(1, 1), color: 0xa99a78, roughness: 0.96 }),
  capaCaderno: new THREE.MeshStandardMaterial({ color: 0x403830, roughness: 0.76 }),
  pedra: new THREE.MeshStandardMaterial({ color: 0x56524b, roughness: 0.96 }),
  borracha: new THREE.MeshStandardMaterial({ color: 0x1b1917, roughness: 0.88 }),
  tinta: new THREE.MeshStandardMaterial({ color: 0x25221d, roughness: 1 }),
  vidro: new THREE.MeshStandardMaterial({ color: 0xc8d9d9, roughness: 0.1, transparent: true, opacity: 0.34, depthWrite: false, side: THREE.DoubleSide }),
  vidroFosco: new THREE.MeshStandardMaterial({ color: 0xd5dedc, roughness: 0.82, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }),
  lente: new THREE.MeshStandardMaterial({ color: 0x1a2529, roughness: 0.12, metalness: 0.12 }),
  vestigio: new THREE.MeshStandardMaterial({ color: 0x141310, roughness: 1, transparent: true, opacity: 0.82 }),
  vestigioBorda: new THREE.MeshStandardMaterial({ color: 0x514a3e, roughness: 1, transparent: true, opacity: 0.52 }),
}

function peca(grupo, geom, mat, x, y, z, rx = 0, ry = 0, rz = 0, nome = "") {
  const objeto = new THREE.Mesh(geom, mat)
  objeto.position.set(x, y, z)
  objeto.rotation.set(rx, ry, rz)
  objeto.castShadow = true
  objeto.receiveShadow = true
  objeto.name = nome
  grupo.add(objeto)
  return objeto
}

const cx = (r1, r2, h, seg = 16, aberto = false) => new THREE.CylinderGeometry(r1, r2, h, seg, 1, aberto)
const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d)

function grupoNome(pai, nome, x = 0, y = 0, z = 0) {
  const grupo = new THREE.Group()
  grupo.name = nome
  grupo.position.set(x, y, z)
  pai.add(grupo)
  return grupo
}

function formaIrregular(raios) {
  const forma = new THREE.Shape()
  raios.forEach((raio, i) => {
    const a = (i / raios.length) * Math.PI * 2
    const x = Math.cos(a) * raio
    const y = Math.sin(a) * raio * 0.76
    if (i === 0) forma.moveTo(x, y)
    else forma.lineTo(x, y)
  })
  forma.closePath()
  return forma
}

function laminaFaca() {
  const forma = new THREE.Shape()
  forma.moveTo(-0.026, 0.045)
  forma.lineTo(0.026, 0.045)
  forma.lineTo(0.021, -0.125)
  forma.lineTo(0, -0.17)
  forma.lineTo(-0.026, -0.125)
  forma.closePath()
  const geom = new THREE.ExtrudeGeometry(forma, { depth: 0.005, bevelEnabled: false })
  geom.rotateX(Math.PI / 2)
  return geom
}

function panoOndulado(largura, profundidade) {
  const geom = new THREE.PlaneGeometry(largura, profundidade, 5, 4)
  const pos = geom.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    pos.setZ(i, Math.sin(x * 55 + y * 31) * 0.0035)
  }
  pos.needsUpdate = true
  geom.computeVertexNormals()
  return geom
}

function linha(grupo, pontos, material, nome = "") {
  const geom = new THREE.BufferGeometry().setFromPoints(pontos.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
  const objeto = new THREE.Line(geom, material)
  objeto.name = nome
  grupo.add(objeto)
  return objeto
}

const CONSTRUTORES = {
  faca: (g) => {
    peca(g, laminaFaca(), M.aco, 0, 0.005, 0, 0, 0, 0, "lamina-faca")
    peca(g, bx(0.065, 0.018, 0.018), M.acoEscuro, 0, 0.013, 0.055)
    peca(g, new THREE.CapsuleGeometry(0.022, 0.075, 4, 10), M.madeiraEscura, 0, 0.017, 0.13, Math.PI / 2)
    for (const z of [0.105, 0.145]) peca(g, cx(0.004, 0.004, 0.046, 8), M.aco, 0, 0.035, z, 0, 0, Math.PI / 2)
  },

  tesoura: (g) => {
    const criarMetade = (nome, lado) => {
      const metade = grupoNome(g, nome, 0, 0.009, 0.015)
      metade.rotation.y = lado * 0.25
      peca(metade, bx(0.018, 0.006, 0.145), M.aco, 0, 0, -0.07)
      peca(metade, new THREE.ConeGeometry(0.009, 0.035, 4), M.aco, 0, 0, -0.158, -Math.PI / 2)
      peca(metade, new THREE.TorusGeometry(0.027, 0.006, 8, 20), M.borracha, lado * 0.018, 0, 0.075, Math.PI / 2)
      peca(metade, bx(0.012, 0.006, 0.06), M.acoEscuro, lado * 0.008, 0, 0.035)
    }
    criarMetade("tesoura-esquerda", -1)
    criarMetade("tesoura-direita", 1)
    peca(g, cx(0.009, 0.009, 0.022, 12), M.acoEscuro, 0, 0.01, 0.015, Math.PI / 2, 0, 0, "eixo-tesoura")
  },

  amolador: (g) => {
    peca(g, bx(0.095, 0.018, 0.225), M.madeiraEscura, 0, 0.009, 0)
    peca(g, bx(0.082, 0.045, 0.195), M.pedra, 0, 0.035, -0.005)
    peca(g, bx(0.014, 0.026, 0.17), M.acoGasto, -0.018, 0.061, -0.005, 0, 0, -0.2)
    peca(g, bx(0.014, 0.026, 0.17), M.acoGasto, 0.018, 0.061, -0.005, 0, 0, 0.2)
    const canal = peca(g, bx(0.008, 0.008, 0.155), M.aco.clone(), 0, 0.073, -0.005, 0, 0, 0, "canal-amolador")
    canal.material.emissive = new THREE.Color(0x000000)
  },

  espeto: (g) => {
    peca(g, cx(0.0045, 0.0045, 0.31, 10), M.aco, 0, 0.01, -0.015, Math.PI / 2)
    peca(g, new THREE.ConeGeometry(0.009, 0.048, 10), M.aco, 0, 0.01, -0.194, -Math.PI / 2)
    peca(g, new THREE.CapsuleGeometry(0.016, 0.06, 3, 8), M.madeiraEscura, 0, 0.014, 0.178, Math.PI / 2)
    peca(g, new THREE.TorusGeometry(0.014, 0.003, 6, 14), M.acoEscuro, 0, 0.014, 0.23, Math.PI / 2)
  },

  tabua: (g) => {
    peca(g, bx(0.25, 0.028, 0.34), M.madeira, 0, 0.014, 0)
    peca(g, bx(0.218, 0.004, 0.006), M.madeiraEscura, 0, 0.03, -0.145)
    peca(g, bx(0.218, 0.004, 0.006), M.madeiraEscura, 0, 0.03, 0.145)
    peca(g, bx(0.006, 0.004, 0.296), M.madeiraEscura, -0.108, 0.03, 0)
    peca(g, bx(0.006, 0.004, 0.296), M.madeiraEscura, 0.108, 0.03, 0)
    for (let i = 0; i < 7; i++) peca(g, bx(0.003, 0.003, 0.245), M.madeiraEscura, -0.075 + i * 0.025, 0.031, (i % 3 - 1) * 0.012, 0, (i - 3) * 0.055)
    const marca = peca(g, bx(0.012, 0.004, 0.225), M.tinta, 0.05, 0.033, 0, 0, 0.16, 0, "marca-tabua")
    marca.visible = false
    peca(g, new THREE.TorusGeometry(0.014, 0.004, 7, 16), M.madeiraEscura, 0, 0.031, 0.148, Math.PI / 2)
  },

  garfo: (g) => {
    peca(g, new THREE.CapsuleGeometry(0.012, 0.105, 3, 8), M.aco, 0, 0.008, 0.075, Math.PI / 2)
    peca(g, bx(0.047, 0.006, 0.035), M.aco, 0, 0.008, -0.005)
    for (let i = 0; i < 4; i++) {
      peca(g, bx(0.006, 0.005, 0.072), M.aco, -0.018 + i * 0.012, 0.008, -0.055)
      peca(g, new THREE.ConeGeometry(0.003, 0.018, 5), M.aco, -0.018 + i * 0.012, 0.008, -0.1, -Math.PI / 2)
    }
  },

  panela: (g) => {
    peca(g, cx(0.125, 0.105, 0.13, 28, true), M.acoEscuro, 0, 0.068, 0)
    peca(g, cx(0.106, 0.106, 0.008, 28), M.acoGasto, 0, 0.007, 0)
    peca(g, new THREE.TorusGeometry(0.125, 0.007, 8, 28), M.aco, 0, 0.134, 0, Math.PI / 2)
    for (const lado of [-1, 1]) {
      peca(g, bx(0.075, 0.018, 0.028), M.borracha, lado * 0.145, 0.096, 0)
      peca(g, bx(0.02, 0.035, 0.036), M.acoEscuro, lado * 0.112, 0.087, 0)
    }
    const tampa = grupoNome(g, "tampa-panela", 0, 0.14, 0)
    peca(tampa, cx(0.116, 0.106, 0.016, 28), M.acoGasto, 0, 0.008, 0)
    peca(tampa, new THREE.TorusGeometry(0.112, 0.005, 8, 28), M.aco, 0, 0.017, 0, Math.PI / 2)
    peca(tampa, cx(0.022, 0.028, 0.025, 14), M.borracha, 0, 0.033, 0)
  },

  toalha: (g) => {
    const mover = grupoNome(g, "toalha-movel")
    for (let i = 0; i < 3; i++) peca(mover, panoOndulado(0.25 - i * 0.008, 0.19 - i * 0.007), M.pano, 0, 0.009 + i * 0.009, 0, -Math.PI / 2, 0, i * 0.015)
    for (const x of [-0.105, 0.105]) peca(mover, bx(0.004, 0.004, 0.17), M.costura, x, 0.032, 0)
  },

  gelo: (g) => {
    const geada = new THREE.MeshStandardMaterial({ color: 0xaac7d1, emissive: 0x203b46, emissiveIntensity: 0.32, roughness: 0.26, transparent: true, opacity: 0.64, side: THREE.DoubleSide, depthWrite: false })
    const forma = formaIrregular([0.14, 0.12, 0.15, 0.125, 0.16, 0.115, 0.145, 0.13, 0.155, 0.12])
    const base = peca(g, new THREE.ShapeGeometry(forma), geada, 0, 0.003, 0, -Math.PI / 2, 0, 0, "nucleo-gelo")
    base.renderOrder = 2
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const r = 0.12 + (i % 3) * 0.009
      peca(g, new THREE.ConeGeometry(0.008, 0.035 + (i % 2) * 0.012, 5), geada, Math.cos(a) * r, 0.009, Math.sin(a) * r, Math.PI / 2, 0, -a)
    }
  },

  pratovazio: (g) => {
    peca(g, cx(0.135, 0.086, 0.025, 32), M.loucaEsmalte, 0, 0.0125, 0)
    peca(g, new THREE.TorusGeometry(0.132, 0.009, 10, 32), M.loucaEsmalte, 0, 0.027, 0, Math.PI / 2)
    peca(g, cx(0.074, 0.074, 0.004, 28), M.louca, 0, 0.029, 0)
    const matTrinca = new THREE.LineBasicMaterial({ color: 0x534c43 })
    const trincas = [
      [[0, 0.032, 0], [0.028, 0.034, 0.022], [0.05, 0.035, 0.018], [0.075, 0.036, 0.05]],
      [[0.027, 0.034, 0.022], [0.04, 0.035, 0.055], [0.06, 0.036, 0.078]],
      [[0.05, 0.035, 0.018], [0.075, 0.036, -0.008], [0.095, 0.037, -0.02]],
    ]
    trincas.forEach((pontos, i) => {
      const trinca = linha(g, pontos, matTrinca, `trinca-prato-${i}`)
      trinca.visible = false
    })
  },

  copo: (g) => {
    peca(g, cx(0.047, 0.039, 0.13, 28, true), M.vidro, 0, 0.066, 0)
    peca(g, cx(0.039, 0.039, 0.008, 28), M.vidro, 0, 0.004, 0)
    peca(g, new THREE.TorusGeometry(0.047, 0.003, 7, 28), M.vidro, 0, 0.132, 0, Math.PI / 2)
    peca(g, cx(0.0485, 0.041, 0.102, 28, true), M.vidroFosco, 0, 0.065, 0)
    for (let i = 0; i < 8; i++) peca(g, new THREE.SphereGeometry(0.0028, 5, 4), M.vidroFosco, Math.sin(i * 1.7) * 0.041, 0.035 + (i % 4) * 0.022, Math.cos(i * 1.7) * 0.041)
    const matTrinca = new THREE.LineBasicMaterial({ color: 0xe4eeee, transparent: true, opacity: 0.85 })
    const frente = 0.048
    const trincas = [
      [[0, 0.112, frente], [0.008, 0.09, frente], [-0.004, 0.07, frente], [0.012, 0.047, frente]],
      [[0.008, 0.09, frente], [0.026, 0.08, frente], [0.034, 0.06, frente]],
      [[-0.004, 0.07, frente], [-0.026, 0.058, frente], [-0.034, 0.035, frente]],
    ]
    trincas.forEach((pontos, i) => {
      const trinca = linha(g, pontos, matTrinca, `trinca-copo-${i}`)
      trinca.visible = false
    })
  },

  mancha: (g) => {
    const baseForma = formaIrregular([0.36, 0.3, 0.38, 0.32, 0.35, 0.285, 0.37, 0.31, 0.355, 0.295, 0.34, 0.31])
    const base = peca(g, new THREE.ShapeGeometry(baseForma), M.vestigio.clone(), 0, 0.002, 0, -Math.PI / 2, 0, 0, "nucleo-mancha")
    base.renderOrder = 1
    const bordaForma = formaIrregular([0.395, 0.33, 0.405, 0.35, 0.38, 0.32, 0.4, 0.345, 0.385, 0.325, 0.37, 0.34])
    const borda = peca(g, new THREE.ShapeGeometry(bordaForma), M.vestigioBorda, 0, 0.001, 0, -Math.PI / 2)
    borda.renderOrder = 0
    for (let i = 0; i < 4; i++) {
      const gota = peca(g, new THREE.CircleGeometry(0.025 + i * 0.006, 12), M.vestigio, -0.29 + i * 0.18, 0.003, 0.19 - (i % 2) * 0.42, -Math.PI / 2)
      gota.scale.set(1.5, 0.7, 1)
    }
  },

  caderno: (g) => {
    peca(g, bx(0.19, 0.007, 0.25), M.capaCaderno, 0, 0.004, 0)
    peca(g, bx(0.178, 0.026, 0.238), M.papel, 0.004, 0.02, 0)
    for (let i = 0; i < 5; i++) peca(g, bx(0.002, 0.002, 0.225), M.papelEscuro, -0.08 + i * 0.04, 0.034, 0)
    const capa = grupoNome(g, "capa-caderno", -0.095, 0.036, 0)
    peca(capa, bx(0.19, 0.006, 0.25), M.capaCaderno, 0.095, 0, 0)
    peca(capa, bx(0.11, 0.002, 0.055), M.papelEscuro, 0.095, 0.004, -0.035)
    const pagina = grupoNome(g, "pagina-caderno", -0.09, 0.035, 0)
    peca(pagina, bx(0.178, 0.002, 0.238), M.papel, 0.089, 0, 0)
    pagina.visible = false
    for (let i = 0; i < 8; i++) peca(g, new THREE.TorusGeometry(0.009, 0.0022, 6, 12, Math.PI * 1.45), M.acoEscuro, -0.095, 0.028, -0.095 + i * 0.027, Math.PI / 2, 0, Math.PI / 2)
  },

  etiqueta: (g) => {
    const etiqueta = grupoNome(g, "etiqueta-movel", 0, 0.004, -0.035)
    const forma = new THREE.Shape()
    forma.moveTo(-0.055, -0.035)
    forma.lineTo(0.055, -0.035)
    forma.lineTo(0.055, 0.035)
    forma.lineTo(-0.04, 0.035)
    forma.lineTo(-0.055, 0.02)
    forma.closePath()
    peca(etiqueta, new THREE.ShapeGeometry(forma), M.papel, 0, 0, 0.035, -Math.PI / 2)
    peca(etiqueta, new THREE.TorusGeometry(0.007, 0.002, 6, 12), M.acoEscuro, -0.043, 0.003, 0.053, Math.PI / 2)
    for (let i = 0; i < 3; i++) peca(etiqueta, bx(0.055 - i * 0.008, 0.002, 0.003), M.tinta, 0.01, 0.004, 0.02 + i * 0.014)
    peca(g, cx(0.0015, 0.0015, 0.09, 6), M.costura, -0.08, 0.004, 0, 0, 0, Math.PI / 2)
  },

  relogio: (g) => {
    const corpo = grupoNome(g, "corpo-relogio")
    peca(corpo, cx(0.098, 0.098, 0.038, 32), M.capaCaderno, 0, 0.106, 0, Math.PI / 2)
    peca(corpo, cx(0.085, 0.085, 0.004, 32), M.papel, 0, 0.106, 0.022, Math.PI / 2)
    peca(corpo, new THREE.TorusGeometry(0.096, 0.006, 8, 32), M.acoEscuro, 0, 0.106, 0.022)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      peca(corpo, bx(0.003, 0.012, 0.002), M.tinta, Math.sin(a) * 0.07, 0.106 + Math.cos(a) * 0.07, 0.026, 0, 0, -a)
    }
    peca(corpo, bx(0.005, 0.05, 0.003), M.tinta, 0.012, 0.126, 0.027, 0, 0, -0.55, "ponteiro-minuto")
    peca(corpo, bx(0.005, 0.038, 0.003), M.tinta, -0.014, 0.092, 0.028, 0, 0, 1.02, "ponteiro-hora")
    peca(corpo, cx(0.006, 0.006, 0.008, 10), M.acoEscuro, 0, 0.106, 0.028, Math.PI / 2)
    peca(corpo, bx(0.07, 0.018, 0.055), M.capaCaderno, 0, 0.009, -0.005)
    peca(corpo, bx(0.025, 0.032, 0.04), M.capaCaderno, -0.064, 0.022, -0.005, 0, 0, -0.22)
    peca(corpo, bx(0.025, 0.032, 0.04), M.capaCaderno, 0.064, 0.022, -0.005, 0, 0, 0.22)
    peca(corpo, cx(0.014, 0.018, 0.025, 12), M.acoEscuro, 0, 0.22, 0)
  },

  camera: (g) => {
    peca(g, bx(0.105, 0.072, 0.064), M.borracha, 0, 0.043, 0)
    peca(g, bx(0.04, 0.018, 0.055), M.acoEscuro, -0.02, 0.086, -0.002)
    peca(g, bx(0.027, 0.008, 0.02), M.aco, 0.034, 0.084, -0.005, 0, 0, 0, "botao-camera")
    peca(g, cx(0.03, 0.035, 0.035, 24), M.acoEscuro, 0, 0.048, 0.048, Math.PI / 2)
    peca(g, cx(0.022, 0.022, 0.006, 24), M.lente, 0, 0.048, 0.068, Math.PI / 2)
    peca(g, new THREE.TorusGeometry(0.029, 0.004, 8, 24), M.aco, 0, 0.048, 0.069)
    const flashMat = new THREE.MeshStandardMaterial({ color: 0xd9d2bb, emissive: 0x000000, roughness: 0.22 })
    peca(g, bx(0.025, 0.018, 0.005), flashMat, -0.034, 0.069, 0.034, 0, 0, 0, "flash-camera")
    peca(g, cx(0.01, 0.013, 0.025, 10), M.acoEscuro, 0, 0.013, -0.006)
  },
}

export function criarPorta(largura, altura) {
  const g = new THREE.Group()
  const folha = new THREE.MeshStandardMaterial({ map: TEX.madeiraEscura(1, 2), color: 0x6a5c48, roughness: 0.82 })
  peca(g, bx(largura, altura, 0.042), folha, 0, altura / 2, 0)
  const almofada = bx(largura * 0.62, altura * 0.32, 0.01)
  peca(g, almofada, folha, 0, altura * 0.7, 0.026)
  peca(g, almofada, folha, 0, altura * 0.29, 0.026)
  peca(g, cx(0.019, 0.019, 0.09, 12), M.acoEscuro, largura / 2 - 0.075, altura * 0.47, 0.03, Math.PI / 2)
  return g
}

export function criarModelo(id) {
  const g = new THREE.Group()
  const construtor = CONSTRUTORES[id]
  if (!construtor) {
    peca(g, bx(0.09, 0.09, 0.09), M.pedra, 0, 0.045, 0)
    console.warn(`[3d] sem modelo para "${id}" — usando bloco neutro`)
    return g
  }
  construtor(g)
  return g
}

export const DECALQUES = new Set(["mancha", "gelo"])
