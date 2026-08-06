// Um modelo por objeto da Cozinha, montado com primitivas do Three.
//
// Por que primitivas em vez de .glb importado:
// WORLD_DESIGN.md é explícito — "objetos comuns, nunca mágicos", "poucas
// cores", "tudo parece comum". O que o jogador precisa reconhecer é a
// SILHUETA (aquilo é uma faca, aquilo é uma panela), não o número de
// polígonos. Uma faca é uma lâmina fina e um cabo; modelada em duas caixas
// ela já lê como faca à meia-luz. Além disso .glb exigiria loader
// assíncrono, arquivos binários no repo e um pipeline de arte que a equipe
// não tem — e ENGINE.md manda não implementar tecnologia só pra impressionar.
//
// O que os cubos coloridos anteriores custavam:
// eles pintavam cada objeto com a cor do cluster dele. Isso VAZAVA a
// lógica da porta — o jogador via, de longe, quais objetos "andam juntos",
// e a Sessão 6 decidiu explicitamente que essa lógica não é revelada.
// Agora a cor vem do material real (aço, madeira, louça, pano, papel),
// que é uma propriedade do objeto, não da regra escondida.
//
// Convenção: todo modelo nasce com a BASE em y = 0 e o comprimento no
// eixo Z. Quem posiciona só escolhe a altura da superfície de apoio e o
// ângulo — não precisa saber a geometria interna de nada.

import * as THREE from "three"
import { TEX } from "./texturas.js"

// ---------- materiais compartilhados ----------
// Compartilhar instância importa: são 16 objetos, e material novo por
// mesh significa um shader novo por mesh.
const M = {
  aco: new THREE.MeshStandardMaterial({
    map: TEX.metal(1, 1),
    color: 0x9aa0a6,
    roughness: 0.34,
    metalness: 0.85,
  }),
  acoEscuro: new THREE.MeshStandardMaterial({
    map: TEX.metal(1, 1),
    color: 0x5c6166,
    roughness: 0.5,
    metalness: 0.8,
  }),
  madeira: new THREE.MeshStandardMaterial({
    map: TEX.madeiraClara(1, 1),
    roughness: 0.78,
    metalness: 0,
  }),
  madeiraEscura: new THREE.MeshStandardMaterial({
    map: TEX.madeiraEscura(1, 1),
    roughness: 0.82,
    metalness: 0,
  }),
  louca: new THREE.MeshStandardMaterial({ color: 0xcfc9ba, roughness: 0.28, metalness: 0.02 }),
  loucaEsmalte: new THREE.MeshStandardMaterial({ color: 0xe2ddd0, roughness: 0.16, metalness: 0.03 }),
  pano: new THREE.MeshStandardMaterial({ map: TEX.tecido(1, 1), roughness: 0.95, metalness: 0 }),
  papel: new THREE.MeshStandardMaterial({ map: TEX.papel(1, 1), roughness: 0.9, metalness: 0 }),
  capaCaderno: new THREE.MeshStandardMaterial({ color: 0x2f2a24, roughness: 0.75, metalness: 0 }),
  pedra: new THREE.MeshStandardMaterial({ color: 0x4a4640, roughness: 0.98, metalness: 0 }),
  borracha: new THREE.MeshStandardMaterial({ color: 0x1a1816, roughness: 0.9, metalness: 0 }),
  vidro: new THREE.MeshStandardMaterial({
    color: 0xbfd0cf,
    roughness: 0.08,
    metalness: 0,
    transparent: true,
    opacity: 0.28,
  }),
  // gelo: sem cor "azul de gelo" chamativo — é só um ponto frio na pedra
  geada: new THREE.MeshStandardMaterial({
    color: 0xa9b6b8,
    roughness: 0.42,
    metalness: 0,
    transparent: true,
    opacity: 0.5,
  }),
  vestigio: new THREE.MeshStandardMaterial({ color: 0x0d0c0a, roughness: 1, metalness: 0 }),
  vestigioBorda: new THREE.MeshStandardMaterial({
    color: 0x2a2620,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.55,
  }),
}

// atalho: cria mesh, posiciona, rotaciona e pendura no grupo
function peca(grupo, geom, mat, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geom, mat)
  m.position.set(x, y, z)
  m.rotation.set(rx, ry, rz)
  m.castShadow = true
  grupo.add(m)
  return m
}

const cx = (r1, r2, h, seg = 16) => new THREE.CylinderGeometry(r1, r2, h, seg)
const bx = (w, h, d) => new THREE.BoxGeometry(w, h, d)

// ---------- construtores, um por objeto ----------
const CONSTRUTORES = {
  // "O metal está frio." — lâmina larga, cabo de madeira, deitada.
  faca: (g) => {
    peca(g, bx(0.028, 0.005, 0.155), M.aco, 0, 0.006, -0.02)
    peca(g, bx(0.016, 0.005, 0.03), M.aco, 0, 0.006, 0.072) // espigão
    peca(g, bx(0.024, 0.019, 0.088), M.madeiraEscura, 0, 0.012, 0.13)
    peca(g, cx(0.006, 0.006, 0.02, 8), M.acoEscuro, 0, 0.012, 0.088, Math.PI / 2)
  },

  // "As lâminas estão alinhadas, sem qualquer sinal de uso." — fechada, alinhada.
  tesoura: (g) => {
    // lâminas quase paralelas: sinal de estar fechada, não de uso
    peca(g, bx(0.011, 0.004, 0.11), M.aco, -0.005, 0.005, -0.035, 0, 0.02)
    peca(g, bx(0.011, 0.004, 0.11), M.aco, 0.005, 0.009, -0.035, 0, -0.02)
    peca(g, cx(0.005, 0.005, 0.016, 8), M.acoEscuro, 0, 0.007, 0.022, Math.PI / 2)
    // argolas
    const argola = new THREE.TorusGeometry(0.019, 0.005, 8, 16)
    peca(g, argola, M.borracha, -0.014, 0.007, 0.075, Math.PI / 2, 0, 0.25)
    peca(g, argola, M.borracha, 0.014, 0.007, 0.075, Math.PI / 2, 0, -0.25)
  },

  // "A pedra está gasta de um lado só, como se alguém tivesse pressa."
  amolador: (g) => {
    peca(g, bx(0.055, 0.028, 0.18), M.pedra, 0, 0.014, 0)
    // o desgaste: uma concavidade só na metade esquerda da pedra
    const gasto = peca(g, bx(0.03, 0.012, 0.12), M.pedra, -0.012, 0.026, -0.01)
    gasto.material = M.pedra
    gasto.scale.y = 0.6
    peca(g, bx(0.062, 0.008, 0.19), M.madeiraEscura, 0, 0.004, 0) // base
  },

  // "Reto demais para já ter sido usado alguma vez."
  espeto: (g) => {
    peca(g, cx(0.0035, 0.0035, 0.27, 10), M.aco, 0, 0.004, -0.02, Math.PI / 2)
    peca(g, cx(0.0035, 0, 0.03, 10), M.aco, 0, 0.004, -0.17, -Math.PI / 2)
    peca(g, bx(0.014, 0.008, 0.055), M.madeiraEscura, 0, 0.005, 0.14)
  },

  // "Sulcos profundos cobrem toda a extensão da madeira."
  tabua: (g) => {
    peca(g, bx(0.21, 0.022, 0.31), M.madeira, 0, 0.011, 0)
    // sulcos: caneluras escuras cruzando a peça, densas e irregulares
    const sulco = bx(0.0035, 0.004, 0.26)
    const semente = [0.31, 0.77, 0.12, 0.58, 0.9, 0.43, 0.05, 0.67, 0.22, 0.84, 0.5, 0.38]
    semente.forEach((s, i) => {
      peca(
        g,
        sulco,
        M.madeiraEscura,
        -0.088 + s * 0.176,
        0.0215,
        (i % 3) * 0.012 - 0.012,
        0,
        (s - 0.5) * 0.5,
      )
    })
    peca(g, cx(0.011, 0.011, 0.024, 10), M.madeiraEscura, 0, 0.011, 0.142) // furo de pendurar
  },

  // "Está alinhado perfeitamente ao centro da bancada."
  garfo: (g) => {
    peca(g, bx(0.018, 0.0035, 0.09), M.aco, 0, 0.004, 0.055) // cabo
    peca(g, bx(0.026, 0.004, 0.03), M.aco, 0, 0.004, -0.005) // base dos dentes
    for (let i = 0; i < 4; i++) {
      peca(g, bx(0.0045, 0.0035, 0.05), M.aco, -0.009 + i * 0.006, 0.004, -0.043)
    }
  },

  // "Está seca por dentro."
  panela: (g) => {
    const corpo = peca(g, cx(0.105, 0.092, 0.11, 24), M.acoEscuro, 0, 0.055, 0)
    corpo.material = M.acoEscuro
    peca(g, new THREE.TorusGeometry(0.105, 0.006, 8, 24), M.aco, 0, 0.11, 0, Math.PI / 2)
    peca(g, cx(0.088, 0.088, 0.004, 20), M.acoEscuro, 0, 0.012, 0) // fundo interno (seco)
    // duas alças
    const alca = bx(0.035, 0.01, 0.012)
    peca(g, alca, M.borracha, 0.121, 0.088, 0)
    peca(g, alca, M.borracha, -0.121, 0.088, 0)
  },

  // "Está dobrada em quatro partes iguais, sem uma única marca de uso."
  toalha: (g) => {
    // quatro dobras visíveis empilhadas, ligeiramente desalinhadas —
    // desalinhamento mínimo, senão parece "usada", e o texto diz o contrário
    for (let i = 0; i < 4; i++) {
      peca(g, bx(0.22 - i * 0.004, 0.011, 0.17 - i * 0.004), M.pano, 0, 0.006 + i * 0.011, 0, 0, i * 0.006)
    }
  },

  // "Um ponto da bancada está visivelmente mais frio que o resto."
  // Não é objeto: é um estado da superfície. Decalque, não volume.
  gelo: (g) => {
    const d = peca(g, new THREE.CircleGeometry(0.115, 28), M.geada, 0, 0.001, 0, -Math.PI / 2)
    d.renderOrder = 1
    d.material.polygonOffset = true
    d.material.polygonOffsetFactor = -1
    // cristais mínimos na borda, o suficiente pra ler como geada
    const semente = [0.1, 0.35, 0.55, 0.72, 0.88, 0.22, 0.63]
    semente.forEach((s) => {
      const a = s * Math.PI * 2
      peca(g, bx(0.006, 0.002, 0.02), M.geada, Math.cos(a) * 0.085, 0.003, Math.sin(a) * 0.085, 0, -a)
    })
  },

  // "Está centralizado, como se esperasse algo que não chegou a vir."
  pratovazio: (g) => {
    peca(g, cx(0.115, 0.075, 0.018, 28), M.loucaEsmalte, 0, 0.009, 0)
    peca(g, new THREE.TorusGeometry(0.113, 0.007, 8, 28), M.loucaEsmalte, 0, 0.018, 0, Math.PI / 2)
    peca(g, cx(0.055, 0.055, 0.003, 20), M.louca, 0, 0.019, 0) // fundo raso, vazio
  },

  // "Parece ter sido usado há segundos. Está seco por dentro."
  copo: (g) => {
    const paredeCopo = new THREE.CylinderGeometry(0.036, 0.031, 0.105, 24, 1, true)
    peca(g, paredeCopo, M.vidro, 0, 0.053, 0)
    peca(g, cx(0.031, 0.031, 0.006, 24), M.vidro, 0, 0.004, 0) // fundo
    // o embaçamento: uma casca opaca por fora, sem líquido nenhum dentro
    const embacado = new THREE.MeshStandardMaterial({
      color: 0xc8cfcc,
      roughness: 0.95,
      transparent: true,
      opacity: 0.16,
    })
    peca(g, new THREE.CylinderGeometry(0.0375, 0.0325, 0.09, 24, 1, true), embacado, 0, 0.05, 0)
  },

  // "Um contorno no chão foi limpo até demais."
  mancha: (g) => {
    const base = peca(g, new THREE.CircleGeometry(0.34, 32), M.vestigio, 0, 0.001, 0, -Math.PI / 2)
    base.renderOrder = 1
    // o contorno que sobrou: um anel mais claro do que o miolo limpo
    const anel = peca(g, new THREE.RingGeometry(0.3, 0.35, 32), M.vestigioBorda, 0, 0.003, 0, -Math.PI / 2)
    anel.renderOrder = 2
  },

  // "Todas as páginas estão em branco, exceto a última."
  caderno: (g) => {
    peca(g, bx(0.15, 0.014, 0.205), M.papel, 0, 0.012, 0) // bloco de páginas
    peca(g, bx(0.158, 0.005, 0.213), M.capaCaderno, 0, 0.0025, 0) // contracapa
    peca(g, bx(0.158, 0.004, 0.213), M.capaCaderno, 0, 0.021, 0) // capa
    peca(g, cx(0.004, 0.004, 0.2, 8), M.acoEscuro, -0.076, 0.012, 0, Math.PI / 2) // espiral
  },

  // "Um número de catalogação sem correspondência em nenhum registro."
  etiqueta: (g) => {
    peca(g, bx(0.075, 0.0018, 0.048), M.papel, 0, 0.001, 0)
    peca(g, cx(0.004, 0.004, 0.004, 8), M.borracha, -0.03, 0.002, 0) // ilhó
    peca(g, cx(0.0012, 0.0012, 0.06, 6), M.pano, -0.058, 0.002, 0, 0, 0, Math.PI / 2) // cordão
  },

  // "Está parado numa hora que não bate com nenhum outro relógio da casa."
  relogio: (g) => {
    // apoiado na prateleira, mostrador voltado pra fora do móvel
    peca(g, cx(0.085, 0.085, 0.028, 28), M.capaCaderno, 0, 0.086, 0, Math.PI / 2)
    peca(g, cx(0.075, 0.075, 0.002, 28), M.papel, 0, 0.086, 0.015, Math.PI / 2)
    peca(g, new THREE.TorusGeometry(0.084, 0.005, 8, 28), M.acoEscuro, 0, 0.086, 0.014)
    // ponteiros travados numa hora arbitrária e assimétrica
    peca(g, bx(0.005, 0.0015, 0.05), M.borracha, 0.013, 0.1, 0.018, Math.PI / 2, 0, 0.35)
    peca(g, bx(0.004, 0.0015, 0.035), M.borracha, -0.016, 0.077, 0.018, Math.PI / 2, 0, -1.15)
    peca(g, cx(0.005, 0.005, 0.006, 10), M.acoEscuro, 0, 0.086, 0.018, Math.PI / 2)
    peca(g, bx(0.05, 0.014, 0.03), M.capaCaderno, 0, 0.007, 0) // pé
  },

  // "A lente está voltada para a bancada. Não há cabo, nem luz de gravação."
  camera: (g) => {
    peca(g, bx(0.062, 0.048, 0.05), M.borracha, 0, 0.024, 0)
    peca(g, cx(0.019, 0.021, 0.026, 20), M.acoEscuro, 0, 0.03, 0.036, Math.PI / 2)
    peca(g, cx(0.014, 0.014, 0.003, 20), M.vidro, 0, 0.03, 0.05, Math.PI / 2) // lente
    peca(g, cx(0.008, 0.011, 0.022, 10), M.acoEscuro, 0, 0.008, -0.008) // pedestal
  },
}

// A porta é o único "objeto" que também é arquitetura, então mora aqui
// separada — quem constrói a sala é que decide onde ela encaixa.
export function criarPorta(largura, altura) {
  const g = new THREE.Group()
  const folha = new THREE.MeshStandardMaterial({
    map: TEX.madeiraEscura(1, 2),
    color: 0x6a5c48,
    roughness: 0.82,
    metalness: 0,
  })
  peca(g, bx(largura, altura, 0.042), folha, 0, altura / 2, 0)
  // almofadas em relevo — o que separa "porta" de "retângulo escuro"
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
    // Fallback deliberadamente sem graça: se um objeto novo entrar em
    // dados.js sem modelo, ele aparece como um bloco neutro em vez de
    // sumir da sala — a ausência silenciosa seria muito mais difícil de
    // achar do que um bloco fora de lugar.
    peca(g, bx(0.09, 0.09, 0.09), M.pedra, 0, 0.045, 0)
    console.warn(`[3d] sem modelo para "${id}" — usando bloco neutro`)
    return g
  }
  construtor(g)
  return g
}

// Objetos que são marcas na superfície, não volumes: não recebem sombra
// própria nem colisão, e ficam rentes ao apoio.
export const DECALQUES = new Set(["mancha", "gelo"])
