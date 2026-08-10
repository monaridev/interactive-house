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
import { resolverMovimento, desencaixar } from "./colisao.js"

// ---------- registro de salas 3D ----------
// Quando a porta calcula um destino que está aqui, a troca é real
// (nova geometria, câmera reposicionada). Quando não está (salaB-D,
// relatorio, relatorioApressado — ainda só existem no 2D), a porta só
// mostra o texto de sempre, sem sala nenhuma pra ir.
const SALAS_3D = {
  cozinha: construirCozinha,
  corredor: construirCorredor,
  salaA: construirSalaA,
}

// ---------- cena ----------
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x08080a)
// Neblina fraca: a Cozinha tem 4m, então não é pra "esconder
// distância" — é pra que o canto mais longe da bancada perca um pouco
// de definição. Serve pro Corredor também: ele é ainda mais estreito.
scene.fog = new THREE.FogExp2(0x08080a, 0.075)

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
capa.addEventListener("click", () => controls.lock())
controls.addEventListener("lock", () => capa.classList.add("oculto"))
controls.addEventListener("unlock", () => capa.classList.remove("oculto"))

const teclas = { w: false, a: false, s: false, d: false, shift: false }
const MAPA_TECLAS = { arrowup: "w", arrowleft: "a", arrowdown: "s", arrowright: "d" }
function normalizar(e) {
  const k = e.key.toLowerCase()
  if (k === "shift") return "shift"
  return MAPA_TECLAS[k] || k
}
addEventListener("keydown", (e) => {
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

  audio = { context, panner }
  atualizarFonteAudio()
}

function atualizarFonteAudio() {
  if (!audio || !sala?.fonteSom) return
  const { x, y, z } = sala.fonteSom
  audio.panner.positionX.value = x
  audio.panner.positionY.value = y
  audio.panner.positionZ.value = z
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
  limparSala()
  grupoSalaAtual = new THREE.Group()
  scene.add(grupoSalaAtual)

  const visita = Estado.contarVisitas(id)
  sala = SALAS_3D[id](grupoSalaAtual, { visita })

  camera.position.set(sala.spawn.x, sala.spawn.y, sala.spawn.z)
  camera.rotation.set(0, sala.spawn.olharY, 0) // zera inclinação de cabeça herdada da sala anterior
  const pos = desencaixar({ x: camera.position.x, z: camera.position.z }, sala.obstaculos)
  camera.position.x = pos.x
  camera.position.z = pos.z

  Estado.registrarVisita(sala.id)
  atualizarFonteAudio()
  escrever(sala.data.titulo.toUpperCase(), descreverSala())
}

entrarEm("cozinha")

// ---------- contorno no hover ----------
// Reage só à POSSIBILIDADE de examinar, nunca ao histórico — mesma
// regra de sempre (WORLD_DESIGN: o sistema não informa progresso), só
// mudou COMO aparece. `outlinePass` já foi criado lá em cima, junto
// com o resto do composer.
function atualizarContorno() {
  const alvo = alvoInterativo()
  outlinePass.selectedObjects = alvo ? [alvo] : []
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

  if (tipo === "objeto") {
    Estado.registrarClique(sala.id, ref.id)
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
      typeof sala.porta.proxima === "function"
        ? sala.porta.proxima(clicados, Estado.snapshotGlobal())
        : sala.porta.proxima
    console.log(`[3d] destino calculado: ${destino}`)

    if (SALAS_3D[destino]) {
      iniciarTransicao(destino)
    } else {
      // Ainda não existe em 3D (salaB-D, relatorio, relatorioApressado)
      // — mesma mensagem de sempre, sem vazar o destino calculado pro
      // jogador (isso é só pra depuração, no console).
      escrever("PORTA", "Está entreaberta. Não cede.")
    }
  }
})

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
  atualizarOuvinte()
  composer.render()
}
animar()
