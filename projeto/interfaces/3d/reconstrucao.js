import * as THREE from "three"
import { intensidade, nomesCombinacoesAtivas, vestigioPredominante } from "./vestigios.js"

// Planta volumétrica compacta da House. As posições formam uma topologia
// legível (origem, eixo, quatro salas e fechamento), não um grafo decorativo.
const AMBIENTES = {
  cozinha: { x: -0.39, z: 0.2, w: 0.3, d: 0.22, rotulo: "COZ" },
  corredor: { x: -0.06, z: 0.04, w: 0.12, d: 0.34, rotulo: "EIXO" },
  salaA: { x: -0.42, z: -0.24, w: 0.17, d: 0.16, rotulo: "A" },
  salaB: { x: -0.18, z: -0.27, w: 0.17, d: 0.16, rotulo: "B" },
  salaC: { x: 0.06, z: -0.27, w: 0.17, d: 0.16, rotulo: "C" },
  salaD: { x: 0.3, z: -0.24, w: 0.17, d: 0.16, rotulo: "D" },
  salaFinal: { x: 0.4, z: 0.19, w: 0.26, d: 0.22, rotulo: "FINAL" },
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

function material(cor, emissivo = cor, intensidadeEmissiva = 0, opacidade = 1) {
  return new THREE.MeshStandardMaterial({
    color: cor,
    emissive: emissivo,
    emissiveIntensity: intensidadeEmissiva,
    roughness: 0.48,
    metalness: 0.42,
    transparent: opacidade < 1,
    opacity: opacidade,
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

function texturaPainel(titulo, subtitulo = "") {
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 256
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#101817"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.strokeStyle = "rgba(119, 172, 160, .72)"
  ctx.lineWidth = 6
  ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20)
  ctx.fillStyle = "#c7d6d0"
  ctx.textAlign = "center"
  ctx.font = "bold 53px Courier New, monospace"
  ctx.fillText(titulo, 512, 112)
  if (subtitulo) {
    ctx.fillStyle = "#77968d"
    ctx.font = "29px Courier New, monospace"
    ctx.fillText(subtitulo, 512, 174)
  }
  const textura = new THREE.CanvasTexture(canvas)
  textura.colorSpace = THREE.SRGBColorSpace
  textura.anisotropy = 4
  return textura
}

function texturaProcesso() {
  const canvas = document.createElement("canvas")
  canvas.width = 1024
  canvas.height = 128
  const ctx = canvas.getContext("2d")
  ctx.fillStyle = "#171d1c"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "#8da49d"
  ctx.textAlign = "center"
  ctx.font = "bold 25px Courier New, monospace"
  ctx.fillText("OBSERVAÇÃO   ›   MEMÓRIA   ›   INTERPRETAÇÃO   ›   CONSEQUÊNCIA", 512, 76)
  const textura = new THREE.CanvasTexture(canvas)
  textura.colorSpace = THREE.SRGBColorSpace
  textura.anisotropy = 4
  return textura
}

function texturaAmbiente(rotulo) {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = "rgba(8, 18, 16, .88)"
  ctx.fillRect(6, 6, canvas.width - 12, canvas.height - 12)
  ctx.strokeStyle = "rgba(126, 197, 180, .7)"
  ctx.lineWidth = 5
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16)
  ctx.fillStyle = "#b8d8cf"
  ctx.textAlign = "center"
  ctx.font = rotulo.length > 2 ? "bold 56px Courier New, monospace" : "bold 78px Courier New, monospace"
  ctx.fillText(rotulo, 128, 88)
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

function chaveLigacao(a, b) {
  return [a, b].sort().join(":")
}

export function criarReconstrucao({ eventos = [], vestigios = {}, rota = null } = {}) {
  const grupo = new THREE.Group()
  const interativo = new THREE.Group()

  // Console sólido, inclinado e construído em camadas. A tecnologia tem peso
  // físico e o projetor nasce do equipamento, em vez de flutuar na parede.
  const baseMat = material(0x27302f, 0x172320, 0.035)
  const metalMat = material(0x596663, 0x263b36, 0.04)
  const bordaMat = material(0x151b1a, 0x13201d, 0.025)
  const controleMat = material(0x29423d, 0x397c6c, 0.08)
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.56, 0.66), baseMat)
  base.position.y = 0.29
  base.castShadow = true
  base.receiveShadow = true
  interativo.add(base)
  const rodape = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.12, 0.58), bordaMat)
  rodape.position.set(0, 0.06, 0)
  interativo.add(rodape)
  for (const x of [-0.51, 0.51]) {
    const ombro = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.7), metalMat)
    ombro.position.set(x, 0.62, -0.02)
    ombro.rotation.z = x < 0 ? -0.09 : 0.09
    interativo.add(ombro)
  }
  const console = new THREE.Mesh(new THREE.BoxGeometry(1.13, 0.08, 0.4), controleMat)
  console.position.set(0, 0.72, 0.11)
  console.rotation.x = 0.2
  console.castShadow = true
  interativo.add(console)
  const frente = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.24, 0.055), bordaMat)
  frente.position.set(0, 0.51, 0.34)
  frente.rotation.x = -0.035
  interativo.add(frente)

  const rotulo = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.19), new THREE.MeshBasicMaterial({ map: texturaPainel("RECONSTRUIR SESSÃO", "REGISTRO DE CAMPO") }))
  rotulo.position.set(0, 0.755, 0.315)
  rotulo.rotation.x = -Math.PI / 2 + 0.2
  interativo.add(rotulo)
  const processo = new THREE.Mesh(new THREE.PlaneGeometry(0.94, 0.118), new THREE.MeshBasicMaterial({ map: texturaProcesso() }))
  processo.position.set(0, 0.535, 0.371)
  processo.rotation.x = -0.035
  interativo.add(processo)

  const emissorMat = material(0x4f6c65, 0x65c7b3, 0.18)
  const emissor = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.065, 32), emissorMat)
  emissor.position.set(0, 0.82, -0.07)
  interativo.add(emissor)
  const nucleoMat = material(0x6da99b, 0x7de0ca, 0.22, 0.48)
  const nucleo = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.074, 28), nucleoMat)
  nucleo.position.set(0, 0.855, -0.07)
  interativo.add(nucleo)

  const statusMateriais = []
  for (let i = 0; i < 4; i++) {
    const mat = material(0x39504b, 0x6fc2af, 0.02)
    statusMateriais.push(mat)
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.022, 0.035), mat)
    led.position.set(-0.33 + i * 0.22, 0.675, 0.325)
    led.rotation.x = 0.2
    interativo.add(led)
  }
  interativo.userData = {
    tipo: "reconstrucao",
    ref: { id: "reconstrucao", nome: "Terminal de observação", fala: "Reconstruir sessão" },
  }
  grupo.add(interativo)

  // Maquete holográfica horizontal. Cada ambiente é um volume nomeado e as
  // únicas linhas existentes representam deslocamentos possíveis da House.
  const mapa = new THREE.Group()
  mapa.position.set(0, 0.94, -0.08)
  grupo.add(mapa)
  const gradeMat = new THREE.MeshBasicMaterial({ color: 0x4d8177, transparent: true, opacity: 0.025, side: THREE.DoubleSide, depthWrite: false })
  const grade = new THREE.GridHelper(1.18, 12, 0x5d9b8e, 0x355c54)
  grade.material.transparent = true
  grade.material.opacity = 0.05
  grade.position.y = -0.015
  mapa.add(grade)
  const campo = new THREE.Mesh(new THREE.PlaneGeometry(1.17, 0.72), gradeMat)
  campo.rotation.x = -Math.PI / 2
  campo.position.y = -0.02
  mapa.add(campo)

  const nos = {}
  const materiaisNos = {}
  const materiaisArestas = {}
  const materiaisEtiquetas = {}
  for (const [id, ambiente] of Object.entries(AMBIENTES)) {
    const cor = id === "salaFinal" ? 0x8e826a : id === "cozinha" ? 0x677b71 : 0x506560
    const mat = material(cor, id === "salaFinal" ? 0xd2af72 : 0x72cab7, 0.015, 0.18)
    const no = new THREE.Mesh(new THREE.BoxGeometry(ambiente.w, 0.065, ambiente.d), mat)
    no.position.set(ambiente.x, 0.035, ambiente.z)
    no.castShadow = false
    mapa.add(no)
    const arestaMat = new THREE.LineBasicMaterial({ color: 0x9ed9cc, transparent: true, opacity: 0.13 })
    const arestas = new THREE.LineSegments(new THREE.EdgesGeometry(no.geometry), arestaMat)
    arestas.position.copy(no.position)
    mapa.add(arestas)
    const etiquetaMat = new THREE.MeshBasicMaterial({ map: texturaAmbiente(ambiente.rotulo), transparent: true, opacity: 0.28, depthWrite: false })
    const etiqueta = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(ambiente.w * 0.88, 0.105), 0.055), etiquetaMat)
    etiqueta.position.set(ambiente.x, 0.105, ambiente.z + ambiente.d / 2 + 0.012)
    etiqueta.rotation.x = -0.18
    mapa.add(etiqueta)
    nos[id] = no
    materiaisNos[id] = mat
    materiaisArestas[id] = arestaMat
    materiaisEtiquetas[id] = etiquetaMat
  }

  const paresLigacoes = [
    ["cozinha", "corredor"], ["corredor", "salaA"], ["corredor", "salaB"],
    ["corredor", "salaC"], ["corredor", "salaD"], ["salaA", "salaFinal"],
    ["salaB", "salaFinal"], ["salaC", "salaFinal"], ["salaD", "salaFinal"],
  ]
  const materiaisLigacoes = new Map()
  for (const [a, b] of paresLigacoes) {
    const origem = AMBIENTES[a]
    const destino = AMBIENTES[b]
    const curva = new THREE.LineCurve3(new THREE.Vector3(origem.x, 0.078, origem.z), new THREE.Vector3(destino.x, 0.078, destino.z))
    const mat = material(0x38524d, 0x64b9a7, 0.005, 0.12)
    const ligacao = new THREE.Mesh(new THREE.TubeGeometry(curva, 8, 0.008, 5, false), mat)
    mapa.add(ligacao)
    materiaisLigacoes.set(chaveLigacao(a, b), mat)
  }

  const passos = passosDoLog(eventos)
  const marcadores = passos.map((evento, indice) => {
    const id = evento.tipo === "rota_definida" ? evento.rota : evento.destino || evento.sala || "cozinha"
    const ambiente = AMBIENTES[id] || AMBIENTES.cozinha
    const semente = `${evento.objeto || evento.tipo}:${indice}`
    const dx = (hash(semente) - 0.5) * ambiente.w * 0.46
    const dz = (hash(`${semente}:z`) - 0.5) * ambiente.d * 0.4
    const cor = corDoEvento(evento)
    const mat = material(cor, cor, 0.12, 0.92)
    const marcador = new THREE.Group()
    const repetida = evento.primeiraInteracao === false
    const escala = repetida ? 0.66 : 1

    // Cada forma descreve uma função, em vez de decorar a maquete: cruz de
    // presença, chip de interação, chevron de deslocamento e moldura de rota.
    if (evento.tipo === "entrada_sala") {
      marcador.add(new THREE.Mesh(new THREE.BoxGeometry(0.052 * escala, 0.009, 0.012), mat))
      marcador.add(new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.009, 0.052 * escala), mat))
    } else if (evento.tipo === "transicao") {
      for (const lado of [-1, 1]) {
        const chevron = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.011, 0.009), mat)
        chevron.position.z = lado * 0.012
        chevron.rotation.y = lado * 0.58
        marcador.add(chevron)
      }
    } else if (evento.tipo === "rota_definida") {
      for (const lado of [-1, 1]) {
        const horizontal = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.012, 0.009), mat)
        horizontal.position.z = lado * 0.033
        marcador.add(horizontal)
        const vertical = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.012, 0.072), mat)
        vertical.position.x = lado * 0.033
        marcador.add(vertical)
      }
    } else {
      const chip = new THREE.Mesh(new THREE.BoxGeometry(0.032 * escala, 0.014, 0.032 * escala), mat)
      chip.rotation.y = Math.PI / 4
      marcador.add(chip)
      const sinal = new THREE.Mesh(new THREE.BoxGeometry(0.007, 0.042 * escala, 0.007), mat)
      sinal.position.y = 0.026 * escala
      marcador.add(sinal)
    }
    marcador.position.set(ambiente.x + dx, 0.103 + (indice % 3) * 0.008, ambiente.z + dz)
    marcador.visible = false
    mapa.add(marcador)
    return { grupo: marcador, material: mat, evento }
  })

  // Um único pacote geométrico percorre somente conexões semanticamente
  // válidas. É reutilizado entre passos para não criar partículas soltas nem
  // dezenas de meshes temporários durante a apresentação.
  const pulsoMaterial = material(0x9ce4d3, 0x9ce4d3, 1.4, 0.94)
  const pulsoDados = new THREE.Group()
  for (let i = 0; i < 3; i++) {
    const pacote = new THREE.Mesh(new THREE.BoxGeometry(0.032 - i * 0.005, 0.014, 0.012), pulsoMaterial)
    pacote.position.x = -i * 0.025
    pacote.material = pulsoMaterial
    pulsoDados.add(pacote)
  }
  pulsoDados.visible = false
  mapa.add(pulsoDados)

  function pontosDoPulso(evento) {
    let ids = []
    if (evento?.tipo === "rota_definida" && AMBIENTES[evento.rota]) {
      ids = ["cozinha", "corredor", evento.rota, "salaFinal"]
    } else if (evento?.tipo === "transicao") {
      if (evento.origem === "cozinha" && /^sala[A-D]$/.test(evento.destino || "")) ids = ["cozinha", "corredor", evento.destino]
      else if (AMBIENTES[evento.origem] && AMBIENTES[evento.destino]) ids = [evento.origem, evento.destino]
    }
    return ids.map((id) => new THREE.Vector3(AMBIENTES[id].x, 0.126, AMBIENTES[id].z))
  }

  function posicionarPulso(pontos, progresso) {
    if (pontos.length < 2) return false
    let total = 0
    const trechos = []
    for (let i = 0; i < pontos.length - 1; i++) {
      const comprimento = pontos[i].distanceTo(pontos[i + 1])
      trechos.push(comprimento)
      total += comprimento
    }
    let restante = Math.min(0.999, Math.max(0, progresso)) * total
    let trecho = 0
    while (trecho < trechos.length - 1 && restante > trechos[trecho]) restante -= trechos[trecho++]
    const a = pontos[trecho]
    const b = pontos[trecho + 1]
    const t = trechos[trecho] ? restante / trechos[trecho] : 0
    pulsoDados.position.lerpVectors(a, b, t)
    pulsoDados.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x)
    return true
  }

  const dominante = vestigioPredominante(vestigios)
  const ambienteResultado = AMBIENTES[rota] || AMBIENTES.salaFinal
  const haloMat = material(CORES[dominante] || 0x8da49e, CORES[dominante] || 0x8da49e, 0.22, 0.32)
  haloMat.opacity = 0.2 + Math.min(intensidade(vestigios, dominante), 8) * 0.025
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.105, 0.126, 32), haloMat)
  halo.position.set(ambienteResultado.x, 0.095, ambienteResultado.z)
  halo.rotation.x = -Math.PI / 2
  halo.visible = false
  mapa.add(halo)

  const raras = nomesCombinacoesAtivas(vestigios, rota)
  let assinatura = null
  if (raras.length) {
    assinatura = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.146, 3), new THREE.MeshBasicMaterial({ color: 0xa8c9bf, transparent: true, opacity: 0.2 + raras.length * 0.08, side: THREE.DoubleSide }))
    assinatura.position.set(ambienteResultado.x, 0.1, ambienteResultado.z)
    assinatura.rotation.x = -Math.PI / 2
    assinatura.rotation.z = Math.PI / 6
    assinatura.visible = false
    mapa.add(assinatura)
  }

  const luzProjetor = new THREE.PointLight(0x67c8b5, 0.18, 1.5, 2)
  luzProjetor.position.set(0, 1.08, -0.08)
  grupo.add(luzProjetor)

  let ativo = false
  let tempo = 0
  let ultimoPasso = -1
  const duracaoPasso = 0.52 // timing aprovado: não alterar

  function acenderLigacao(a, b, intensidadeEmissiva = 0.9) {
    const mat = materiaisLigacoes.get(chaveLigacao(a, b))
    if (mat) {
      mat.emissiveIntensity = Math.max(mat.emissiveIntensity, intensidadeEmissiva)
      mat.opacity = Math.max(mat.opacity, 0.78)
    }
  }

  function acenderRota(salaId) {
    if (!AMBIENTES[salaId]) return
    acenderLigacao("cozinha", "corredor", 1.05)
    acenderLigacao("corredor", salaId, 1.25)
    acenderLigacao(salaId, "salaFinal", 1.2)
  }

  function entrarStandby() {
    halo.visible = false
    if (assinatura) assinatura.visible = false
    pulsoDados.visible = false
    marcadores.forEach(({ grupo: sinal, material: mat }) => {
      sinal.visible = false
      mat.emissiveIntensity = 0.12
    })
    Object.values(materiaisNos).forEach((mat) => {
      mat.emissiveIntensity = 0.015
      mat.opacity = 0.18
    })
    Object.values(materiaisArestas).forEach((mat) => { mat.opacity = 0.13 })
    Object.values(materiaisEtiquetas).forEach((mat) => { mat.opacity = 0.28 })
    materiaisLigacoes.forEach((mat) => {
      mat.emissiveIntensity = 0.005
      mat.opacity = 0.12
    })
    grade.material.opacity = 0.05
    gradeMat.opacity = 0.025
    statusMateriais.forEach((mat) => { mat.emissiveIntensity = 0.02 })
    controleMat.emissiveIntensity = 0.08
    emissorMat.emissiveIntensity = 0.18
    nucleoMat.emissiveIntensity = 0.22
    nucleoMat.opacity = 0.48
    luzProjetor.intensity = 0.18
  }

  function iniciar() {
    if (ativo) return false
    ativo = true
    tempo = 0
    ultimoPasso = -1
    halo.visible = false
    if (assinatura) assinatura.visible = false
    pulsoDados.visible = false
    marcadores.forEach(({ grupo: sinal, material: mat }) => {
      sinal.visible = false
      mat.emissiveIntensity = 0.12
    })
    Object.values(materiaisNos).forEach((mat) => {
      mat.emissiveIntensity = 0.03
      mat.opacity = 0.32
    })
    Object.values(materiaisArestas).forEach((mat) => { mat.opacity = 0.34 })
    Object.values(materiaisEtiquetas).forEach((mat) => { mat.opacity = 0.62 })
    materiaisLigacoes.forEach((mat) => {
      mat.emissiveIntensity = 0.018
      mat.opacity = 0.32
    })
    grade.material.opacity = 0.13
    gradeMat.opacity = 0.075
    statusMateriais.forEach((mat, i) => { mat.emissiveIntensity = i === 0 ? 1.05 : 0.035 })
    controleMat.emissiveIntensity = 0.72
    emissorMat.emissiveIntensity = 1.05
    nucleoMat.emissiveIntensity = 1.2
    nucleoMat.opacity = 0.82
    luzProjetor.intensity = 1.38
    return true
  }

  function aplicarPasso(indice) {
    const evento = passos[indice]
    if (!evento) return
    const marcador = marcadores[indice]
    marcador.grupo.visible = true
    marcador.material.emissiveIntensity = 0.9
    const salaId = evento.tipo === "rota_definida" ? evento.rota : evento.destino || evento.sala
    if (materiaisNos[salaId]) {
      materiaisNos[salaId].emissiveIntensity = evento.tipo === "rota_definida" ? 1.05 : 0.55
      materiaisNos[salaId].opacity = 0.82
      materiaisArestas[salaId].opacity = 0.88
      materiaisEtiquetas[salaId].opacity = 0.96
    }
    if (evento.tipo === "transicao") {
      if (evento.origem === "cozinha" && /^sala[A-D]$/.test(evento.destino || "")) {
        acenderLigacao("cozinha", "corredor", 0.9)
        acenderLigacao("corredor", evento.destino, 1.05)
      } else acenderLigacao(evento.origem, evento.destino, 1.05)
    }
    if (evento.tipo === "rota_definida") acenderRota(evento.rota)
  }

  function atualizar(delta) {
    if (!ativo) {
      baseMat.emissiveIntensity = 0.028 + (Math.sin(performance.now() * 0.0012) + 1) * 0.01
      emissorMat.emissiveIntensity = 0.14 + (Math.sin(performance.now() * 0.001) + 1) * 0.025
      return
    }
    tempo += delta
    const indice = Math.min(Math.floor(tempo / duracaoPasso), passos.length)
    while (ultimoPasso < indice - 1) aplicarPasso(++ultimoPasso)
    const pulso = (Math.sin(tempo * 8) + 1) * 0.5
    if (ultimoPasso >= 0 && marcadores[ultimoPasso]?.material) marcadores[ultimoPasso].material.emissiveIntensity = 0.62 + pulso * 1.35

    const fasePasso = tempo / duracaoPasso - (ultimoPasso + 1)
    const pontos = pontosDoPulso(passos[ultimoPasso])
    pulsoDados.visible = fasePasso >= 0 && fasePasso < 1 && posicionarPulso(pontos, fasePasso)
    pulsoMaterial.emissiveIntensity = 1.1 + pulso * 1.25

    const progresso = passos.length ? indice / passos.length : 1
    const etapa = Math.min(3, Math.floor(progresso * 4))
    statusMateriais.forEach((mat, i) => { mat.emissiveIntensity = i <= etapa ? 0.78 + pulso * 0.32 : 0.06 })
    controleMat.emissiveIntensity = 0.52 + pulso * 0.34
    luzProjetor.intensity = 1.05 + pulso * 0.42

    if (indice >= passos.length) {
      pulsoDados.visible = false
      halo.visible = true
      haloMat.emissiveIntensity = 0.25 + pulso * 0.3
      if (assinatura) assinatura.visible = true
      if (rota) acenderRota(rota)
      if (materiaisNos.salaFinal) materiaisNos.salaFinal.emissiveIntensity = 0.9
      statusMateriais.forEach((mat) => { mat.emissiveIntensity = 0.95 + pulso * 0.2 })
      if (tempo > passos.length * duracaoPasso + 4.5) {
        ativo = false
        entrarStandby()
      }
    }
  }

  entrarStandby()
  return { grupo, interativo, iniciar, atualizar, get ativo() { return ativo }, passos: passos.length }
}
