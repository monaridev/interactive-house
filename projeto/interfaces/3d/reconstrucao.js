import * as THREE from "three"
import { intensidade, nomesCombinacoesAtivas, vestigioPredominante } from "./vestigios.js"

// Reconstrução semântica da sessão. Não grava câmera nem movimento: cada
// pulso representa uma entrada, interação, transição ou definição de rota já
// registrada por Estado. O mesmo log sempre gera a mesma sequência visual.
const POSICOES = {
  cozinha: [-0.22, 0.35],
  corredor: [0, 0.08],
  salaA: [-0.38, -0.2],
  salaB: [-0.13, -0.27],
  salaC: [0.13, -0.27],
  salaD: [0.38, -0.2],
  salaFinal: [0.22, 0.35],
}

const CORES = {
  corte: 0x9a5550,
  frio: 0x79aeb9,
  ausencia: 0x687478,
  observacao: 0x9da8a1,
  domestico: 0xb48b59,
  registro: 0x8e8061,
  ordem: 0xb5ad87,
}
const CORES_CLUSTER = { corte: 0x9a5550, domestico: 0xb48b59, vazio: 0x6f939b, registro: 0x8e8061 }

function material(cor, emissivo = cor, intensidadeEmissiva = 0) {
  return new THREE.MeshStandardMaterial({
    color: cor,
    emissive: emissivo,
    emissiveIntensity: intensidadeEmissiva,
    roughness: 0.48,
    metalness: 0.38,
    transparent: true,
    opacity: 0.88,
  })
}

function hash(texto) {
  let valor = 2166136261
  for (let i = 0; i < texto.length; i++) valor = Math.imul(valor ^ texto.charCodeAt(i), 16777619)
  return (valor >>> 0) / 4294967295
}

function corDoEvento(evento) {
  if (evento.cluster && CORES_CLUSTER[evento.cluster]) return CORES_CLUSTER[evento.cluster]
  const tipos = Object.entries(evento.vestigios || {}).sort(([, a], [, b]) => b - a)
  return CORES[tipos[0]?.[0]] || 0xa7b2ae
}

function texturaRotulo() {
  const canvas = document.createElement("canvas")
  canvas.width = 512
  canvas.height = 128
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#18201f"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = "rgba(159, 190, 181, .5)"
  ctx.lineWidth = 3
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10)
  ctx.fillStyle = "#a9beb7"
  ctx.textAlign = "center"
  ctx.font = "26px Courier New, monospace"
  ctx.fillText("RECUPERAR SEQUÊNCIA", 256, 73)
  const textura = new THREE.CanvasTexture(canvas)
  textura.colorSpace = THREE.SRGBColorSpace
  return textura
}

function passosDoLog(eventos) {
  const passos = []
  for (const evento of eventos) {
    if (evento.sala === "salaDino" || evento.destino === "salaDino" || evento.origem === "salaDino") continue
    if (["entrada_sala", "interacao", "transicao", "rota_definida"].includes(evento.tipo)) passos.push(evento)
    if (evento.tipo === "entrada_sala" && evento.sala === "salaFinal") break
  }
  return passos
}

export function criarReconstrucao({ eventos = [], vestigios = {}, rota = null } = {}) {
  const grupo = new THREE.Group()
  const interativo = new THREE.Group()
  const baseMat = material(0x303a38, 0x1d2b28, 0.08)
  const vidroMat = material(0x66847f, 0x4e7c74, 0.1)
  vidroMat.opacity = 0.22
  vidroMat.side = THREE.DoubleSide

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.82, 0.5), baseMat)
  base.position.y = 0.41
  interativo.add(base)
  const tampo = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.055, 0.58), material(0x56615e, 0x283b37, 0.12))
  tampo.position.y = 0.84
  interativo.add(tampo)
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.52), vidroMat)
  placa.position.set(0, 1.18, 0.22)
  interativo.add(placa)
  const rotulo = new THREE.Mesh(new THREE.PlaneGeometry(0.58, 0.145), new THREE.MeshBasicMaterial({ map: texturaRotulo() }))
  rotulo.position.set(0, 0.54, 0.256)
  interativo.add(rotulo)
  interativo.userData = {
    tipo: "reconstrucao",
    ref: { id: "reconstrucao", nome: "Registro de campo", fala: "Recuperar sequência" },
  }
  grupo.add(interativo)

  const mapa = new THREE.Group()
  mapa.position.set(0, 1.18, 0.235)
  grupo.add(mapa)
  const nos = {}
  const materiaisNos = {}
  for (const [id, [x, y]] of Object.entries(POSICOES)) {
    const mat = material(id === "salaFinal" ? 0x8a806c : 0x53615e, 0x82b8ad, 0.03)
    const no = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.072, 0.026), mat)
    no.position.set(x, y, 0)
    mapa.add(no)
    nos[id] = no
    materiaisNos[id] = mat
  }

  const ligacoes = [
    ["cozinha", "corredor"], ["cozinha", "salaA"], ["cozinha", "salaB"],
    ["cozinha", "salaC"], ["cozinha", "salaD"], ["salaA", "salaFinal"],
    ["salaB", "salaFinal"], ["salaC", "salaFinal"], ["salaD", "salaFinal"],
  ]
  const linhaMat = new THREE.LineBasicMaterial({ color: 0x607b75, transparent: true, opacity: 0.25 })
  for (const [a, b] of ligacoes) {
    const pontos = [nos[a].position.clone(), nos[b].position.clone()]
    mapa.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pontos), linhaMat))
  }

  const passos = passosDoLog(eventos)
  const marcadores = passos.map((evento, indice) => {
    const pos = POSICOES[evento.tipo === "rota_definida" ? evento.rota : evento.sala] || POSICOES[evento.destino] || POSICOES.cozinha
    const semente = `${evento.objeto || evento.tipo}:${indice}`
    const dx = (hash(semente) - 0.5) * 0.09
    const dy = (hash(`${semente}:y`) - 0.5) * 0.07
    const marcador = new THREE.Mesh(
      new THREE.SphereGeometry(evento.tipo === "rota_definida" ? 0.026 : evento.primeiraInteracao === false ? 0.009 : 0.015, 10, 8),
      material(corDoEvento(evento), corDoEvento(evento), 0.85),
    )
    marcador.position.set(pos[0] + dx, pos[1] + dy, 0.028 + (indice % 3) * 0.004)
    marcador.visible = false
    mapa.add(marcador)
    return marcador
  })

  const dominante = vestigioPredominante(vestigios)
  const haloMat = material(CORES[dominante] || 0x8da49e, CORES[dominante] || 0x8da49e, 0.18)
  haloMat.opacity = 0.18 + Math.min(intensidade(vestigios, dominante), 8) * 0.025
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.255, 40), haloMat)
  halo.position.set(0, 0.04, -0.006)
  halo.visible = false
  mapa.add(halo)

  const raras = nomesCombinacoesAtivas(vestigios, rota)
  if (raras.length) {
    const geometria = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.36, 0.37, 0.012),
      new THREE.Vector3(0.04, -0.06, 0.012),
      new THREE.Vector3(0.36, 0.37, 0.012),
    ])
    const assinatura = new THREE.Line(geometria, new THREE.LineBasicMaterial({ color: 0xa8c9bf, transparent: true, opacity: 0.18 + raras.length * 0.1 }))
    assinatura.visible = false
    mapa.add(assinatura)
    marcadores.push(assinatura)
  }

  let ativo = false
  let tempo = 0
  let ultimoPasso = -1
  const duracaoPasso = 0.52

  function iniciar() {
    ativo = true
    tempo = 0
    ultimoPasso = -1
    halo.visible = false
    marcadores.forEach((marcador) => { marcador.visible = false })
    Object.values(materiaisNos).forEach((mat) => { mat.emissiveIntensity = 0.03 })
  }

  function aplicarPasso(indice) {
    const evento = passos[indice]
    if (!evento) return
    marcadores[indice].visible = true
    const salaId = evento.tipo === "rota_definida" ? evento.rota : evento.sala || evento.destino
    if (materiaisNos[salaId]) materiaisNos[salaId].emissiveIntensity = evento.tipo === "rota_definida" ? 1.35 : 0.72
    if (evento.tipo === "transicao" && materiaisNos[evento.destino]) materiaisNos[evento.destino].emissiveIntensity = 0.82
  }

  function atualizar(delta) {
    if (!ativo) {
      baseMat.emissiveIntensity = 0.06 + (Math.sin(performance.now() * 0.0012) + 1) * 0.025
      return
    }
    tempo += delta
    const indice = Math.min(Math.floor(tempo / duracaoPasso), passos.length)
    while (ultimoPasso < indice - 1) aplicarPasso(++ultimoPasso)
    const pulso = (Math.sin(tempo * 8) + 1) * 0.5
    if (ultimoPasso >= 0 && marcadores[ultimoPasso]?.material) marcadores[ultimoPasso].material.emissiveIntensity = 0.55 + pulso * 1.3
    if (indice >= passos.length) {
      halo.visible = true
      haloMat.emissiveIntensity = 0.18 + pulso * 0.22
      marcadores.slice(passos.length).forEach((marcador) => { marcador.visible = true })
      if (tempo > passos.length * duracaoPasso + 4.5) ativo = false
    }
  }

  return { grupo, interativo, iniciar, atualizar, get ativo() { return ativo }, passos: passos.length }
}
