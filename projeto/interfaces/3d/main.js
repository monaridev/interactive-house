// Motor da versão 3D: câmera, renderer, movimento, interação, HUD e
// troca de sala.
//
// Este arquivo não sabe o que é uma cozinha nem um corredor. Cada sala
// é um módulo com a mesma assinatura — construirX(scene, ctx) devolve
// { obstaculos, interativos, spawn, ... } — e main.js só orquestra:
// decide QUANDO trocar (a porta calculou um destino que existe em 3D)
// e COMO (descarta a cena anterior, constrói a próxima, reposiciona a
// câmera). Nenhuma sala sabe que a outra existe.
//
// Reaproveitamento real: window.DATA e window.Estado são os MESMOS
// arquivos que a versão 2D usa. As falas condicionais (obj.fala(ja)) e a
// decisão da porta (porta.proxima(clicados, snapshot)) rodam sem
// alteração nenhuma.

import * as THREE from "three"
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js"
import { OutputPass } from "three/addons/postprocessing/OutputPass.js"
import { construirCozinha } from "./cozinha.js"
import { construirCorredor } from "./corredor.js"
import { construirSalaA } from "./sala-a.js"
import { construirSalaB } from "./sala-b.js"
import { construirSalaC } from "./sala-c.js"
import { construirSalaD } from "./sala-d.js"
import { construirSalaFinal } from "./sala-final.js"
import { construirSalaDino } from "./sala-dino.js"
import { criarLeitorDiario } from "./diario.js"
import { criarModoTecnico } from "./modo-tecnico.js"
import { criarSistemaReacoes } from "./reacoes.js"
import { resolverMovimento, desencaixar } from "./colisao.js"
import { variacaoDossie } from "./vestigios.js"

// ---------- registro de salas 3D ----------
// Quando a porta calcula um destino que está aqui, a troca é real (nova
// geometria, câmera reposicionada). "relatorio" e "relatorioApressado" são
// tratados à parte, antes desta checagem (ver encerrarExperiencia) — não
// são salas, são o fim da experiência.
const SALAS_3D = {
  cozinha: construirCozinha,
  corredor: construirCorredor,
  salaA: construirSalaA,
  salaB: construirSalaB,
  salaC: construirSalaC,
  salaD: construirSalaD,
  salaFinal: construirSalaFinal,
  salaDino: construirSalaDino,
}

// ---------- cena ----------
const scene = new THREE.Scene()
const FUNDO_PADRAO = 0x08080a
const NEVOA_PADRAO = { cor: 0x08080a, densidade: 0.075 }
scene.background = new THREE.Color(FUNDO_PADRAO)
// Neblina fraca: a Cozinha tem 4m, então não é pra "esconder
// distância" — é pra que o canto mais longe da bancada perca um pouco
// de definição. Serve pro Corredor também: ele é ainda mais estreito.
scene.fog = new THREE.FogExp2(NEVOA_PADRAO.cor, NEVOA_PADRAO.densidade)

const camera = new THREE.PerspectiveCamera(68, innerWidth / innerHeight, 0.04, 40)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
// ACESFilmic evita que a poça de luz sob o pendente estoure em branco
// puro — com uma fonte dominante e o resto escuro, sem tone mapping o
// tampo da ilha viraria uma chapa branca sem textura.
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.15
document.body.prepend(renderer.domElement)
const reacoes = criarSistemaReacoes({
  canvas: renderer.domElement,
  efeitoTela: document.getElementById("efeito-reacao"),
})

// ---------- composição (pra ter contorno de verdade no hover) ----------
// Contorno de seleção via OutlinePass, não mais uma luz posicionada no
// objeto — é o mesmo mecanismo que o próprio editor do Three.js usa pra
// "objeto selecionado": detecta a silhueta e desenha uma linha em cima,
// em vez de iluminar a superfície ao redor de forma desigual.
//
// `samples: 4` no render target do composer — sem isso, o antialias do
// renderer (antialias: true) não chega no resultado final: o composer
// desenha pra um buffer intermediário próprio, e sem multisample nele
// as quinas de tudo (não só do contorno) voltam a serrilhar.
const alvoComposer = new THREE.WebGLRenderTarget(innerWidth, innerHeight, { samples: 4 })
const composer = new EffectComposer(renderer, alvoComposer)
composer.addPass(new RenderPass(scene, camera))

const outlinePass = new OutlinePass(new THREE.Vector2(innerWidth, innerHeight), scene, camera)
outlinePass.edgeStrength = 2.6
outlinePass.edgeGlow = 0.25 // um pouco de vazamento suave, não uma linha dura de UI
outlinePass.edgeThickness = 1.0
outlinePass.pulsePeriod = 0 // sem pulsar — pulso lembra alerta, e aqui é só afordância
outlinePass.visibleEdgeColor.set(0xffffff)
outlinePass.hiddenEdgeColor.set(0x2a2a28) // contorno atrás do próprio objeto, bem apagado
outlinePass.selectedObjects = []
composer.addPass(outlinePass)

// OutputPass no fim da cadeia: sem ele, o tone mapping (ACESFilmic) e a
// conversão de espaço de cor do renderer não se aplicam ao resultado do
// composer — a cena inteira voltaria a ficar lavada/errada de cor.
composer.addPass(new OutputPass())

let sala // sala atual — populada por entrarEm(), nunca construída direto aqui
let grupoSalaAtual = null // tudo que a sala pôs na cena, num Group só

// ---------- movimento em 1ª pessoa ----------
const controls = new PointerLockControls(camera, renderer.domElement)
const capa = document.getElementById("capa")
let leituraAberta = false
let modoTecnico = null
capa.addEventListener("click", () => controls.lock())
controls.addEventListener("lock", () => capa.classList.add("oculto"))
controls.addEventListener("unlock", () => {
  if (!leituraAberta) capa.classList.remove("oculto")
})

const teclas = { w: false, a: false, s: false, d: false, shift: false }
const MAPA_TECLAS = { arrowup: "w", arrowleft: "a", arrowdown: "s", arrowright: "d" }
function normalizar(e) {
  const k = e.key.toLowerCase()
  if (k === "shift") return "shift"
  return MAPA_TECLAS[k] || k
}
addEventListener("keydown", (e) => {
  if (leituraAberta) return
  const k = normalizar(e)
  if (k in teclas) teclas[k] = true
})
addEventListener("keyup", (e) => {
  const k = normalizar(e)
  if (k in teclas) teclas[k] = false
})
// solta as teclas ao perder o foco, senão sair da aba andando deixa o
// jogador correndo contra a parede pelo resto da sessão
addEventListener("blur", () => Object.keys(teclas).forEach((k) => (teclas[k] = false)))

// 1,15 m/s. Antes era 2,2 — velocidade de jogo de tiro, e num cômodo de
// 4m o jogador atravessava a sala em menos de 2 segundos. WORLD_DESIGN
// diz "a experiência nunca acelera": andar devagar é o que dá tempo de
// notar que a bancada tem um canto mais escuro (e, no Corredor, tempo
// de sentir o teto baixo em vez de só atravessar ele rápido demais).
const VELOCIDADE = 1.15
const VELOCIDADE_LENTA = 0.5 // Shift: aproximar sem passar do objeto
const clock = new THREE.Clock()

const frente = new THREE.Vector3()
const lado = new THREE.Vector3()
const direcao = new THREE.Vector3()

// Balanço de passo. Minúsculo (2cm) e proposital: sem ele a câmera
// desliza como um drone, e a sala perde escala humana na hora.
let fase = 0

function mover(delta) {
  camera.getWorldDirection(frente)
  frente.y = 0
  frente.normalize()
  lado.crossVectors(frente, camera.up).normalize()

  direcao.set(0, 0, 0)
  if (teclas.w) direcao.add(frente)
  if (teclas.s) direcao.sub(frente)
  if (teclas.d) direcao.add(lado)
  if (teclas.a) direcao.sub(lado)

  const andando = direcao.lengthSq() > 0
  if (andando) {
    const vel = teclas.shift ? VELOCIDADE_LENTA : VELOCIDADE
    direcao.normalize().multiplyScalar(vel * delta)
    const nova = resolverMovimento(
      { x: camera.position.x, z: camera.position.z },
      { x: direcao.x, z: direcao.z },
      sala.obstaculos,
    )
    camera.position.x = nova.x
    camera.position.z = nova.z
    fase += delta * (teclas.shift ? 4 : 7.5)
  } else {
    fase += delta * 1.1 // respiração parada
  }

  const amplitude = andando ? 0.018 : 0.005
  camera.position.y = sala.spawn.y + Math.sin(fase) * amplitude
}

// ---------- interação por raycast ----------
const raycaster = new THREE.Raycaster()
// As trincas do prato e do copo são THREE.Line. O padrão do Three aceita
// linhas a até 1 metro do raio, criando uma área de seleção invisível enorme.
// Um centímetro acompanha o desenho real e impede o copo de roubar vizinhos.
raycaster.params.Line.threshold = 0.01
const ALCANCE = 2.1
const centro = new THREE.Vector2(0, 0)
const hud = document.getElementById("hud")
const hudTitulo = document.getElementById("hud-titulo")
const hudTexto = document.getElementById("hud-texto")
const DURACAO_NOTIFICACAO = 5000
let temporizadorHud = null

// Os modelos agora são Groups com várias peças (lâmina, cabo, ilhó...),
// então o raycast tem que ser recursivo e depois SUBIR até o grupo que
// carrega o userData. Sem isso, clicar no cabo da faca não acha a faca.
function alvoInterativo() {
  raycaster.setFromCamera(centro, camera)
  const hits = raycaster.intersectObjects(sala.interativos, true)
  for (const hit of hits) {
    if (hit.distance > ALCANCE) break
    let no = hit.object
    while (no && !no.userData?.tipo) no = no.parent
    if (no) return no
  }
  return null
}

// Descrição da sala, vinda de dados.js (a mesma função que o 2D chama).
function descreverSala() {
  const d = sala.data.descricao
  return typeof d === "function"
    ? d({ clicados: Estado.clicadosDe(sala.id), visitas: Estado.contarVisitas(sala.id) })
    : d
}

function escrever(titulo, texto) {
  clearTimeout(temporizadorHud)
  hudTitulo.textContent = titulo
  hudTexto.textContent = texto
  hud.classList.remove("visivel")
  // força reflow pra reiniciar a entrada mesmo em cliques seguidos
  void hud.offsetWidth
  hud.classList.add("visivel")
  temporizadorHud = setTimeout(() => hud.classList.remove("visivel"), DURACAO_NOTIFICACAO)
}

// ---------- zumbido espacial ----------
// O som não é uma trilha estéreo fixa: nasce de um ponto físico da sala.
// O jogador pode localizá-lo girando a cabeça e aproximando-se da fonte.
let audio = null
const frenteAudio = new THREE.Vector3()

function iniciarAudio() {
  if (audio) {
    if (audio.context.state === "suspended") audio.context.resume()
    return
  }

  const AudioContexto = window.AudioContext || window.webkitAudioContext
  if (!AudioContexto) return
  const context = new AudioContexto()
  const panner = new PannerNode(context, {
    panningModel: "HRTF",
    distanceModel: "inverse",
    refDistance: 0.5,
    maxDistance: 12,
    rolloffFactor: 1.35,
  })
  const filtro = new BiquadFilterNode(context, { type: "lowpass", frequency: 180, Q: 1.2 })
  const ganho = new GainNode(context, { gain: 0.035 })
  filtro.connect(panner).connect(ganho).connect(context.destination)

  // Duas frequências próximas produzem uma pulsação orgânica, mas estável:
  // parece equipamento elétrico atrás da arquitetura, não música ambiente.
  for (const frequencia of [57, 61.5]) {
    const oscilador = new OscillatorNode(context, { type: "sine", frequency: frequencia })
    const volume = new GainNode(context, { gain: frequencia === 57 ? 0.7 : 0.3 })
    oscilador.connect(volume).connect(filtro)
    oscilador.start()
  }

  audio = { context, panner, filtro, ganho }
  atualizarFonteAudio()
}

function atualizarFonteAudio() {
  if (!audio || !sala?.fonteSom) return
  const { x, y, z } = sala.fonteSom
  audio.panner.positionX.value = x
  audio.panner.positionY.value = y
  audio.panner.positionZ.value = z
  const vestigios = Estado.snapshotVestigios()
  const frio = vestigios.tipos.frio || 0
  const ausencia = vestigios.tipos.ausencia || 0
  const registro = vestigios.tipos.registro || 0
  const ordem = vestigios.tipos.ordem || 0
  const volume = 0.03 + Math.min(ausencia, 7) * 0.0012 + Math.min(registro, 6) * 0.0008
  const corte = Math.max(125, 180 + ordem * 4 - frio * 5)
  audio.ganho.gain.setTargetAtTime(volume, audio.context.currentTime, 0.18)
  audio.filtro.frequency.setTargetAtTime(corte, audio.context.currentTime, 0.22)
}

function atualizarOuvinte() {
  if (!audio) return
  const listener = audio.context.listener
  camera.getWorldDirection(frenteAudio)
  listener.positionX.value = camera.position.x
  listener.positionY.value = camera.position.y
  listener.positionZ.value = camera.position.z
  listener.forwardX.value = frenteAudio.x
  listener.forwardY.value = frenteAudio.y
  listener.forwardZ.value = frenteAudio.z
  listener.upX.value = camera.up.x
  listener.upY.value = camera.up.y
  listener.upZ.value = camera.up.z
}

capa.addEventListener("click", iniciarAudio)

// ---------- relatório / encerramento ----------
// Mesmo conteúdo e mesma regra do 2D (renderRelatorio/renderTerminalFinal em
// app.js): DATA.relatorios e DATA.comportamentos são dado puro, sem DOM —
// foram extraídos assim de propósito, então rodam sem alteração aqui. A
// diferença é só COMO aparece: aqui é um overlay de papel por cima do
// canvas 3D, em vez de trocar o conteúdo da página inteira.
const overlayRelatorio = document.getElementById("relatorio-overlay")
const overlayDiario = document.getElementById("diario-overlay")
const CLUSTER_LABEL = { corte: "Corte", domestico: "Doméstico", vazio: "Vazio", registro: "Registro" }
const REGISTRO_ID = { salaA: "41-A", salaB: "41-B", salaC: "41-C", salaD: "41-D" }
const SALAS_DESFECHO = new Set(["salaA", "salaB", "salaC", "salaD"])
let rotaFinalId = null

function clusterParcial() {
  const clicados = Estado.clicadosDe("cozinha")
  if (!clicados.size) return null
  const contagens = Object.fromEntries(Object.entries(CLUSTERS).map(([id, cluster]) => [id, cluster.objetos.filter((objeto) => clicados.has(objeto)).length]))
  const maior = Math.max(...Object.values(contagens))
  const empatados = Object.keys(contagens).filter((id) => contagens[id] === maior)
  for (const objeto of [...clicados].reverse()) {
    const cluster = empatados.find((id) => CLUSTERS[id].objetos.includes(objeto))
    if (cluster) return cluster
  }
  return empatados[0] || null
}

function digitarTexto(elemento, texto, velocidade, aoTerminar) {
  elemento.textContent = ""
  let i = 0
  const vel = velocidade || 16
  ;(function passo() {
    if (i <= texto.length) {
      elemento.textContent = texto.slice(0, i)
      i++
      setTimeout(passo, vel)
    } else if (aoTerminar) {
      aoTerminar()
    }
  })()
}

function montarFicha(html) {
  overlayRelatorio.innerHTML = `<div class="ficha ficha-entrando">${html}</div>`
  const ficha = overlayRelatorio.querySelector(".ficha")
  // dois rAF, não um: força o navegador a pintar o estado "entrando"
  // antes de tirar a classe, senão a transição às vezes é pulada
  // (mesmo truque que exibirFicha() usa no 2D)
  requestAnimationFrame(() => requestAnimationFrame(() => ficha.classList.remove("ficha-entrando")))
  return ficha
}

// Segunda tela: olha pra sessão inteira, não só pro trajeto — mesmo texto
// interpretativo do 2D, que nunca confirma nem nega (WORLD_DESIGN regra 1).
function mostrarCatalogacaoFinal(salaFinalId) {
  const objetosAnalisados = Estado.contarCliques("cozinha")
  const clusterId = salaFinalId !== "apressado" && DATA.salas[salaFinalId] ? DATA.salas[salaFinalId].cluster : null
  const rotuloCluster = clusterId ? CLUSTER_LABEL[clusterId] : "Nenhum"
  const comportamento =
    (DATA.comportamentos && DATA.comportamentos[clusterId || "apressado"]) ||
    "Nenhuma conclusão definitiva pode ser extraída."

  const ficha = montarFicha(`
    <div class="protocolo"><span>UNIDADE 04</span><span>${new Date().toLocaleDateString("pt-BR")}</span></div>
    <h1>Catalogação finalizada</h1>
    <div class="ficha-dados">
      <div><span class="rotulo-dado">Objetos analisados</span><span class="valor-dado">${objetosAnalisados}</span></div>
      <div><span class="rotulo-dado">Cluster predominante</span><span class="valor-dado">${rotuloCluster}</span></div>
    </div>
    <p class="digitando"></p>
    <div class="selo">encerrado</div>
  `)
  digitarTexto(ficha.querySelector(".digitando"), comportamento)
}

function mostrarRelatorio(salaFinalId) {
  const perfil = (DATA.relatorios && DATA.relatorios[salaFinalId]) || { texto: "O levantamento foi encerrado." }
  const ficha = montarFicha(`
    <div class="protocolo"><span>UNIDADE 04</span><span>${new Date().toLocaleDateString("pt-BR")}</span></div>
    <h1>Registro encerrado</h1>
    <p class="digitando"></p>
    <div class="selo">encerrado</div>
  `)
  digitarTexto(ficha.querySelector(".digitando"), perfil.texto, undefined, () => {
    const botao = document.createElement("button")
    botao.type = "button"
    botao.className = "continuar-catalogacao"
    botao.textContent = "Consultar catalogação final"
    botao.addEventListener("click", () => mostrarCatalogacaoFinal(salaFinalId))
    ficha.appendChild(botao)
  })
}

// Chamada uma única vez, quando a porta calcula "relatorio" ou
// "relatorioApressado". Libera o ponteiro (PointerLockControls) e some
// com o HUD e o contorno — a partir daqui não há mais jogo, só a ficha.
// O overlay cobre a tela inteira, então cliques não voltam a alcançar o
// canvas por baixo.
function encerrarExperiencia(salaFinalId) {
  Estado.registrarEvento("encerramento", { sala: sala?.id || null, rota: salaFinalId })
  leituraAberta = true
  controls.unlock()
  outlinePass.selectedObjects = []
  hud.classList.remove("visivel")
  overlayRelatorio.setAttribute("aria-hidden", "false")
  overlayRelatorio.className = "visivel modo-fallback"
  mostrarRelatorio(salaFinalId)
}

// ---------- dossiê da Sala Final ----------
// O relatório antigo acima permanece intacto como fallback. O fluxo normal
// das quatro salas agora passa por este leitor de duas páginas, mantendo a
// Sala Final renderizada atrás do papel.
function dadosDoDossie() {
  const id = rotaFinalId
  const salaOrigem = id && DATA.salas[id]
  const clusterId = salaOrigem?.cluster
  if (!salaOrigem || !clusterId) return null

  const comportamento = DATA.comportamentos?.[clusterId] || "Nenhuma conclusão definitiva pode ser extraída."
  const [interpretacao, observacaoFinal] = comportamento.split(/\n\n+/)
  const vestigios = Estado.snapshotVestigios()
  return {
    id,
    registro: REGISTRO_ID[id] || "41-—",
    cluster: CLUSTER_LABEL[clusterId] || "Não identificado",
    relatorio: DATA.relatorios?.[id]?.texto || "O levantamento foi encerrado.",
    objetosAnalisados: Estado.contarCliques("cozinha"),
    interpretacao,
    observacaoFinal: observacaoFinal || "Nenhuma conclusão definitiva pode ser extraída.",
    variacao: variacaoDossie(vestigios, id),
  }
}

function estruturaDocumento(conteudo, pagina) {
  const classesVestigio = conteudo.variacao.classes.join(" ")
  overlayRelatorio.innerHTML = `
    <article class="dossie-papel ${classesVestigio}" data-pagina="${pagina}">
      <header class="dossie-cabecalho">
        <div><strong>INSTITUTO DE OBSERVAÇÃO E COMPORTAMENTO</strong><span>SETOR DE ANÁLISE · NÚCLEO INTERNO</span></div>
        <div class="dossie-registro"><span>Nº DO REGISTRO</span><strong>${conteudo.registro}</strong><span>${new Date().toLocaleDateString("pt-BR")}</span></div>
      </header>
      <button type="button" class="dossie-fechar" aria-label="Fechar arquivo">×</button>
      <div class="dossie-corpo"></div>
      <footer class="dossie-navegacao"></footer>
      <div class="dossie-carimbo">confidencial</div>
    </article>
  `
  const papel = overlayRelatorio.querySelector(".dossie-papel")
  requestAnimationFrame(() => papel.classList.add("aberto"))
  overlayRelatorio.querySelector(".dossie-fechar").addEventListener("click", fecharDossie)
  return {
    corpo: overlayRelatorio.querySelector(".dossie-corpo"),
    navegacao: overlayRelatorio.querySelector(".dossie-navegacao"),
  }
}

function mostrarPaginaDossie(pagina) {
  const conteudo = dadosDoDossie()
  if (!conteudo) {
    encerrarExperiencia(rotaFinalId || "apressado")
    return
  }

  const { corpo, navegacao } = estruturaDocumento(conteudo, pagina)
  if (pagina === 1) {
    corpo.innerHTML = `
      <p class="dossie-setor">RELATÓRIO INTERNO</p>
      <h1>Registro de observação</h1>
      <dl class="dossie-metadados">
        <div><dt>Cluster identificado</dt><dd>${conteudo.cluster}</dd></div>
        <div><dt>Objetos analisados</dt><dd>${conteudo.objetosAnalisados}</dd></div>
      </dl>
      <section><h2>Relatório</h2><p>${conteudo.relatorio}</p></section>
      ${conteudo.variacao.nota ? `<section class="dossie-nota"><h2>Observação de conferência</h2><p>${conteudo.variacao.nota}</p></section>` : ""}
    `
    navegacao.innerHTML = `<span></span><strong>1 / 2</strong><button type="button" data-proxima>Próxima página →</button>`
    navegacao.querySelector("[data-proxima]").addEventListener("click", () => mostrarPaginaDossie(2))
  } else {
    corpo.innerHTML = `
      <p class="dossie-setor">CATALOGAÇÃO FINAL DO VISITANTE</p>
      <h1>Catalogação do visitante</h1>
      <section><h2>Classificação</h2><p>${conteudo.cluster}</p></section>
      <section><h2>Interpretação</h2><p>${conteudo.interpretacao}</p></section>
      <section><h2>Observação final</h2><p>${conteudo.observacaoFinal}</p></section>
    `
    navegacao.innerHTML = `<button type="button" data-voltar>← Voltar</button><strong>2 / 2</strong><button type="button" data-encerrar>Encerrar levantamento</button>`
    navegacao.querySelector("[data-voltar]").addEventListener("click", () => mostrarPaginaDossie(1))
    navegacao.querySelector("[data-encerrar]").addEventListener("click", encerrarLevantamento)
  }
}

function abrirDossie() {
  if (leituraAberta) return
  const conteudo = dadosDoDossie()
  if (!conteudo) {
    encerrarExperiencia(rotaFinalId || "apressado")
    return
  }

  leituraAberta = true
  Estado.registrarEvento("consulta_dossie", { sala: "salaFinal", rota: rotaFinalId })
  Object.keys(teclas).forEach((k) => (teclas[k] = false))
  outlinePass.selectedObjects = []
  clearTimeout(temporizadorHud)
  hud.classList.remove("visivel")
  controls.unlock()
  capa.classList.add("oculto")
  overlayRelatorio.setAttribute("aria-hidden", "false")
  overlayRelatorio.className = "visivel modo-dossie"
  mostrarPaginaDossie(1)
}

function fecharDossie() {
  overlayRelatorio.classList.remove("visivel")
  overlayRelatorio.setAttribute("aria-hidden", "true")
  leituraAberta = false
  Object.keys(teclas).forEach((k) => (teclas[k] = false))
  // Se o navegador negar a retomada automática do pointer lock, a capa
  // reaparece e oferece um clique normal para continuar.
  capa.classList.remove("oculto")
  controls.lock()
}

// ---------- Diário de Bordo da Sala Final ----------
// A leitura vive num overlay próprio e não consulta nem altera Estado. O
// motor coordena somente a pausa/retomada da navegação, como já faz com o
// dossiê; conteúdo e paginação ficam isolados em diario.js.
const leitorDiario = criarLeitorDiario({
  overlay: overlayDiario,
  aoFechar() {
    leituraAberta = false
    Object.keys(teclas).forEach((k) => (teclas[k] = false))
    capa.classList.remove("oculto")
    controls.lock()
  },
})

function abrirDiario() {
  if (leituraAberta) return
  leituraAberta = true
  Estado.registrarEvento("consulta_diario", { sala: "salaFinal", objeto: "diario" })
  Object.keys(teclas).forEach((k) => (teclas[k] = false))
  outlinePass.selectedObjects = []
  clearTimeout(temporizadorHud)
  hud.classList.remove("visivel")
  controls.unlock()
  capa.classList.add("oculto")
  leitorDiario.abrir()
}

function encerrarLevantamento() {
  const papel = overlayRelatorio.querySelector(".dossie-papel")
  papel?.classList.remove("aberto")
  overlayRelatorio.classList.add("encerrando")
  setTimeout(() => {
    overlayRelatorio.innerHTML = `
      <div class="encerramento-final">
        <span>UNIDADE 04</span>
        <strong>Catalogação finalizada</strong>
        <p>Registro encerrado.</p>
      </div>
    `
    overlayRelatorio.className = "visivel modo-dossie encerrado"
  }, 480)
}

// ---------- troca de sala ----------
// Descarta tudo que a sala anterior pôs na cena — geometria E material/
// textura, não só o mesh — antes de construir a próxima. Sem isso, cada
// ida e volta cozinha<->corredor vaza memória de GPU: o loop do "final
// apressado" pode passar pelas duas várias vezes numa sessão só.
//
// Cada sala recebe um Group próprio (não a `scene` direto) e só sabe
// adicionar coisas nele — o parâmetro ainda se chama `scene` dentro de
// cozinha.js/corredor.js, mas quem entra ali é este Group. Isso separa
// o que É da sala (descartado a cada troca) do que é do MOTOR (câmera,
// composer, outlinePass — nada disso é filho da sala, então nada disso
// é tocado aqui).
function limparSala() {
  if (!grupoSalaAtual) return
  scene.remove(grupoSalaAtual)
  grupoSalaAtual.traverse((no) => {
    no.geometry?.dispose()
    const materiais = Array.isArray(no.material) ? no.material : no.material ? [no.material] : []
    for (const m of materiais) {
      m.map?.dispose()
      m.dispose()
    }
  })
}

// `Estado.contarVisitas(id)` é lido ANTES de `registrarVisita` marcar
// esta entrada — assim a sala recebe "quantas vezes eu já estive aqui
// ANTES desta vez" (0 na primeira, 1 na segunda...), útil pra variações
// como a porta do Corredor, sem que a sala precise conhecer `Estado`
// diretamente. Ela só recebe um número pelo `ctx`.
function entrarEm(id) {
  if (!SALAS_3D[id]) return false
  reacoes.limpar()
  limparSala()
  grupoSalaAtual = new THREE.Group()
  scene.add(grupoSalaAtual)

  const visita = Estado.contarVisitas(id)
  Estado.registrarVisita(id)
  sala = SALAS_3D[id](grupoSalaAtual, {
    visita,
    vestigios: Estado.snapshotVestigios(),
    rotaFinalId,
    sessao: Estado.snapshotSessao(),
  })

  const ambiente = sala.ambiente || {}
  scene.background.set(ambiente.fundo ?? FUNDO_PADRAO)
  scene.fog.color.set(ambiente.nevoa?.cor ?? NEVOA_PADRAO.cor)
  scene.fog.density = ambiente.nevoa?.densidade ?? NEVOA_PADRAO.densidade

  camera.position.set(sala.spawn.x, sala.spawn.y, sala.spawn.z)
  camera.rotation.set(0, sala.spawn.olharY, 0) // zera inclinação de cabeça herdada da sala anterior
  const pos = desencaixar({ x: camera.position.x, z: camera.position.z }, sala.obstaculos)
  camera.position.x = pos.x
  camera.position.z = pos.z

  Estado.registrarManifestacoes(sala.id, sala.manifestacoes)
  atualizarFonteAudio()
  escrever(sala.data.titulo.toUpperCase(), descreverSala())
  return true
}

entrarEm("cozinha")

// ---------- contorno no hover ----------
// Reage só à POSSIBILIDADE de examinar, nunca ao histórico — mesma
// regra de sempre (WORLD_DESIGN: o sistema não informa progresso), só
// mudou COMO aparece. `outlinePass` já foi criado lá em cima, junto
// com o resto do composer.
let ultimoAlvoHover = null
function atualizarContorno() {
  const alvo = alvoInterativo()
  outlinePass.selectedObjects = alvo ? [alvo] : []
  if (alvo !== ultimoAlvoHover) {
    ultimoAlvoHover = alvo
    if (alvo?.userData?.tipo === "dossie") escrever(alvo.userData.ref.nome.toUpperCase(), alvo.userData.ref.fala)
    if (alvo?.userData?.tipo === "diario") escrever(alvo.userData.ref.nome.toUpperCase(), alvo.userData.ref.fala)
    if (alvo?.userData?.tipo === "reconstrucao") escrever(alvo.userData.ref.nome.toUpperCase(), alvo.userData.ref.fala)
    if (alvo?.userData?.tipo === "dino") escrever(alvo.userData.ref.nome.toUpperCase(), alvo.userData.ref.fala)
  }
}

// ---------- transição entre salas (fade + passo) ----------
// Substitui o corte seco de antes: dá um passo em direção a pra onde
// já estava olhando (a porta, quase sempre) enquanto escurece, troca a
// sala no ponto mais escuro do fade, clareia já do outro lado. Roda
// dentro do loop de render — não em setTimeout — pra nunca dessincronizar
// do frame real nem brigar com o pointer lock.
const overlayTransicao = document.getElementById("transicao")
const DURACAO_PASSO = 0.22
const DURACAO_FADE = 0.22
const PASSO_TAMANHO = 0.35 // metros — só cosmético, não passa por colisão:
// a tela já está preta antes do passo terminar, e entrarEm() reposiciona
// a câmera do zero logo em seguida, então não importa se cruzar alguma
// geometria no meio do caminho
const origemPasso = new THREE.Vector3()
const alvoPasso = new THREE.Vector3()
const direcaoPasso = new THREE.Vector3()
let transicao = null // { fase: "saindo" | "entrando", t, destino }

function easeOutQuad(p) {
  return 1 - (1 - p) * (1 - p)
}

function iniciarTransicao(destino) {
  if (transicao) return // clique duplo durante a transição: ignora
  Estado.registrarTransicao(sala?.id || null, destino, "porta")
  camera.getWorldDirection(direcaoPasso)
  direcaoPasso.y = 0
  direcaoPasso.normalize()
  origemPasso.copy(camera.position)
  alvoPasso.copy(camera.position).addScaledVector(direcaoPasso, PASSO_TAMANHO)
  outlinePass.selectedObjects = [] // não deixa o contorno atravessar o fade
  transicao = { fase: "saindo", t: 0, destino }
}

function atualizarTransicao(delta) {
  transicao.t += delta
  if (transicao.fase === "saindo") {
    const p = Math.min(transicao.t / DURACAO_PASSO, 1)
    camera.position.lerpVectors(origemPasso, alvoPasso, easeOutQuad(p))
    overlayTransicao.style.opacity = Math.min(transicao.t / DURACAO_FADE, 1)
    if (transicao.t >= Math.max(DURACAO_PASSO, DURACAO_FADE)) {
      entrarEm(transicao.destino)
      transicao.fase = "entrando"
      transicao.t = 0
    }
  } else {
    overlayTransicao.style.opacity = Math.max(1 - transicao.t / DURACAO_FADE, 0)
    if (transicao.t >= DURACAO_FADE) transicao = null
  }
}

renderer.domElement.addEventListener("click", () => {
  if (!controls.isLocked || transicao) return
  const alvo = alvoInterativo()
  if (!alvo) return
  const { tipo, ref } = alvo.userData

  if (tipo === "dossie") {
    abrirDossie()
    return
  }

  if (tipo === "diario") {
    abrirDiario()
    return
  }

  if (tipo === "reconstrucao") {
    Estado.registrarEvento("reconstrucao_iniciada", { sala: sala.id, objeto: ref.id, eventosFonte: sala.reconstrucao?.passos || 0 })
    sala.reconstrucao?.iniciar()
    escrever("REGISTRO DE CAMPO", "Sequência recuperada.")
    return
  }

  if (tipo === "dino") {
    if (sala.ativarDino?.()) {
      Estado.registrarEvento("acesso_revelado", { sala: sala.id, objeto: ref.id, destino: "salaDino" })
      escrever("MINIATURA", "O mecanismo responde sem emitir confirmação.")
    }
    return
  }

  if (tipo === "objeto") {
    Estado.registrarClique(sala.id, ref.id, ref.vestigios)
    if (sala.id === "cozinha") reacoes.disparar(alvo, ref.id)
    const ja = Estado.clicadosDe(sala.id)
    const texto = typeof ref.fala === "function" ? ref.fala(ja) : ref.fala
    escrever(ref.nome.toUpperCase(), texto)
    // Nada de emissive marcando "já examinado", e nada de contador X/16.
    // O sistema não dá feedback de progresso — quem quiser saber o que já
    // olhou tem que lembrar. É a regra 1 de WORLD_DESIGN ("nunca confirmar")
    // aplicada ao 3D, que a prova de conceito anterior violava.
    return
  }

  if (tipo === "porta") {
    const clicados = Estado.clicadosDe(sala.id)
    const destino =
      typeof ref.proxima === "function"
        ? ref.proxima(clicados, Estado.snapshotGlobal())
        : ref.proxima
    console.log(`[3d] destino calculado: ${destino}`)

    if (SALAS_DESFECHO.has(destino)) {
      rotaFinalId = destino
      Estado.registrarRota(destino, DATA.salas[destino]?.cluster, sala.id === "cozinha" ? "porta-cozinha" : "porta", sala.id)
    }

    if (destino === "relatorio" && SALAS_DESFECHO.has(sala.id)) {
      // dados.js continua com "relatorio" para preservar o terminal 2D.
      // Na experiência 3D, esse destino passa pela Sala Final e guarda a
      // origem para preencher o dossiê dinâmico.
      rotaFinalId = sala.id
      Estado.registrarRota(sala.id, DATA.salas[sala.id]?.cluster, "sala-desfecho", sala.id)
      iniciarTransicao("salaFinal")
    } else if (destino === "relatorio") {
      Estado.registrarTransicao(sala.id, "relatorio", ref.id)
      encerrarExperiencia(sala.id)
    } else if (destino === "relatorioApressado") {
      Estado.registrarRota("apressado", null, "ausencia-de-interacao", sala.id)
      Estado.registrarTransicao(sala.id, "relatorioApressado", ref.id)
      encerrarExperiencia("apressado")
    } else if (SALAS_3D[destino]) {
      iniciarTransicao(destino)
    } else {
      // Destino inválido não vaza o nome interno pro jogador; o console
      // acima mantém a informação necessária para depuração.
      escrever("PORTA", "Está entreaberta. Não cede.")
    }
  }
})

// ---------- modo apresentação (?apresentacao=1) ----------
// Atalhos para demonstração e QA, instalados somente quando o parâmetro
// possui exatamente o valor "1". O fluxo normal não recebe listeners,
// elementos de interface nem funções globais adicionais.
if (new URLSearchParams(location.search).get("apresentacao") === "1") {
  const ATALHOS_APRESENTACAO = {
    Digit1: "cozinha",
    Numpad1: "cozinha",
    Digit2: "corredor",
    Numpad2: "corredor",
    Digit3: "salaA",
    Numpad3: "salaA",
    Digit4: "salaB",
    Numpad4: "salaB",
    Digit5: "salaC",
    Numpad5: "salaC",
    Digit6: "salaD",
    Numpad6: "salaD",
    Digit7: "salaFinal",
    Numpad7: "salaFinal",
    Digit8: "salaDino",
    Numpad8: "salaDino",
  }

  function irParaSalaApresentacao(id) {
    if (!SALAS_3D[id] || leituraAberta || transicao) return false

    // A Sala Final precisa conhecer a rota que alimentará o dossiê. Ao
    // visitar diretamente A-D, essa escolha acompanha o apresentador;
    // sem escolha anterior, A fornece um conteúdo válido e previsível.
    if (SALAS_DESFECHO.has(id)) rotaFinalId = id
    if (id === "salaFinal" && !SALAS_DESFECHO.has(rotaFinalId)) rotaFinalId = "salaA"
    if (SALAS_DESFECHO.has(rotaFinalId)) Estado.registrarRota(rotaFinalId, DATA.salas[rotaFinalId]?.cluster, "apresentacao", sala?.id)

    Object.keys(teclas).forEach((k) => (teclas[k] = false))
    outlinePass.selectedObjects = []
    entrarEm(id)
    return true
  }

  function resetarApresentacao() {
    location.reload()
  }

  function reconstruirApresentacao() {
    if (leituraAberta || transicao) return false
    if (sala.id !== "salaFinal") irParaSalaApresentacao("salaFinal")
    sala.reconstrucao?.iniciar()
    Estado.registrarEvento("reconstrucao_iniciada", { sala: "salaFinal", objeto: "atalho-apresentacao", eventosFonte: sala.reconstrucao?.passos || 0 })
    return true
  }

  addEventListener("keydown", (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
    if (e.code === "KeyR") {
      resetarApresentacao()
      return
    }
    if (e.code === "KeyL") {
      reconstruirApresentacao()
      return
    }
    const destino = ATALHOS_APRESENTACAO[e.code]
    if (destino) irParaSalaApresentacao(destino)
  })

  const indicador = document.createElement("aside")
  indicador.setAttribute("aria-label", "Atalhos do modo apresentação")
  indicador.style.cssText = [
    "position:fixed",
    "right:14px",
    "top:14px",
    "z-index:30",
    "max-width:290px",
    "padding:8px 10px",
    "border:1px solid rgba(255,255,255,.2)",
    "background:rgba(8,8,10,.72)",
    "color:rgba(255,255,255,.72)",
    "font:10px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace",
    "letter-spacing:.04em",
    "pointer-events:none",
  ].join(";")
  indicador.textContent = "MODO APRESENTAÇÃO · 1–7 Salas · 8 Dino · L Reconstrução · T Técnico · R Reset"
  document.body.append(indicador)

  modoTecnico = criarModoTecnico({
    podeAbrir: () => !leituraAberta,
    obterSnapshot() {
      const sessao = Estado.snapshotSessao()
      const cluster = clusterParcial()
      return {
        sala: sala?.id,
        objetosAnalisados: Estado.contarCliques("cozinha"),
        cluster: cluster ? CLUSTER_LABEL[cluster] || cluster : null,
        rota: rotaFinalId || sessao.rota?.rota || null,
        vestigios: sessao.vestigios.tipos,
        eventos: sessao.eventos,
        reconstrucao: sala?.reconstrucao?.ativo ? "em execução" : sala?.id === "salaFinal" ? "pronta" : "disponível na Sala Final",
      }
    },
    aoAbrir() {
      leituraAberta = true
      Object.keys(teclas).forEach((k) => (teclas[k] = false))
      outlinePass.selectedObjects = []
      clearTimeout(temporizadorHud)
      hud.classList.remove("visivel")
      controls.unlock()
      capa.classList.add("oculto")
    },
    aoFechar() {
      leituraAberta = false
      Object.keys(teclas).forEach((k) => (teclas[k] = false))
      capa.classList.remove("oculto")
      controls.lock()
    },
  })

  window.__apresentacao = {
    ir: irParaSalaApresentacao,
    resetar: resetarApresentacao,
    reconstruir: reconstruirApresentacao,
    tecnico: modoTecnico,
  }
}

// ---------- modo inspeção (?inspecao=1) ----------
// Ferramenta de desenvolvimento, desligada por padrão. Pointer lock não
// funciona em navegador headless, então sem isso não há como conferir se
// a faca está torta ou se o tampo está iluminado — só dá pra olhar a
// cena de onde o spawn deixou. Expõe câmera e sala pro console.
if (new URLSearchParams(location.search).has("inspecao")) {
  window.__inspecao = {
    camera,
    get sala() {
      return sala // getter, não valor fixo — continua correto depois de entrarEm() trocar de sala
    },
    ir: entrarEm, // ex.: __inspecao.ir("corredor") pra pular direto sem clicar na porta
    definirRotaFinal(id) {
      rotaFinalId = id
    },
    abrirDossie,
    abrirDiario,
    reconstruir() {
      return sala?.reconstrucao?.iniciar()
    },
    revelarDino() {
      return sala?.ativarDino?.()
    },
    olhar(de, para) {
      camera.position.set(de[0], de[1], de[2])
      camera.lookAt(para[0], para[1], para[2])
      composer.render()
    },
  }
  capa.classList.add("oculto")
}

// ---------- loop ----------
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
  composer.setSize(innerWidth, innerHeight)
  outlinePass.resolution.set(innerWidth, innerHeight)
})

function animar() {
  requestAnimationFrame(animar)
  const delta = Math.min(clock.getDelta(), 0.1)
  if (transicao) {
    atualizarTransicao(delta)
  } else if (controls.isLocked) {
    mover(delta)
    atualizarContorno()
  }
  reacoes.atualizar(delta)
  sala.atualizar?.(delta)
  modoTecnico?.atualizar()
  atualizarOuvinte()
  composer.render()
}
animar()
