// Motor da versão 3D: câmera, renderer, movimento, interação e HUD.
//
// Este arquivo não sabe o que é uma cozinha. Ele recebe um descritor de
// sala (construirCozinha devolve obstáculos, interativos e spawn) e opera
// sobre ele. Quando o Corredor existir, será outro módulo com a mesma
// assinatura, e a troca de sala acontece aqui — em um lugar só.
//
// Reaproveitamento real: window.DATA e window.Estado são os MESMOS
// arquivos que a versão 2D usa. As falas condicionais (obj.fala(ja)) e a
// decisão da porta (porta.proxima(clicados)) rodam sem alteração nenhuma.

import * as THREE from "three"
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js"
import { construirCozinha } from "./cozinha.js"
import { resolverMovimento, desencaixar } from "./colisao.js"

// ---------- cena ----------
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x08080a)
// Neblina fraca: a sala tem 4m, então não é pra "esconder distância" —
// é pra que o canto mais longe da bancada perca um pouco de definição.
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

// ---------- sala ----------
const sala = construirCozinha(scene)

camera.position.set(sala.spawn.x, sala.spawn.y, sala.spawn.z)
camera.rotation.y = sala.spawn.olharY
// se um ajuste de layout jogar o spawn dentro de um móvel, sai sozinho
const inicio = desencaixar({ x: camera.position.x, z: camera.position.z }, sala.obstaculos)
camera.position.x = inicio.x
camera.position.z = inicio.z

Estado.registrarVisita(sala.id)

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
// notar que a bancada tem um canto mais escuro.
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
const mira = document.getElementById("mira")

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

let mensagemAtual = ""
function escrever(texto) {
  mensagemAtual = texto
  hud.textContent = texto
  hud.classList.remove("surgindo")
  // força reflow pra reiniciar a animação mesmo em cliques seguidos
  void hud.offsetWidth
  hud.classList.add("surgindo")
}
escrever(descreverSala())

// A mira reage só à POSSIBILIDADE de examinar (afordância), nunca ao
// histórico. Ela não distingue objeto novo de objeto já visto — o
// sistema não informa progresso, conforme a decisão da Sessão 6.
let miraAtiva = false
function atualizarMira() {
  const ativa = !!alvoInterativo()
  if (ativa === miraAtiva) return
  miraAtiva = ativa
  mira.classList.toggle("ativa", ativa)
}

renderer.domElement.addEventListener("click", () => {
  if (!controls.isLocked) return
  const alvo = alvoInterativo()
  if (!alvo) return
  const { tipo, ref } = alvo.userData

  if (tipo === "objeto") {
    Estado.registrarClique(sala.id, ref.id)
    const ja = Estado.clicadosDe(sala.id)
    const texto = typeof ref.fala === "function" ? ref.fala(ja) : ref.fala
    escrever(`${ref.nome.toUpperCase()}\n${texto}`)
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
    // A decisão já é a definitiva (mesma função do 2D). O que falta é a
    // sala do outro lado — próximo passo, o Corredor.
    escrever(`PORTA\nEstá entreaberta. Não cede.`)
    console.log(`[3d] destino que a porta calculou: ${destino}`)
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
    sala,
    olhar(de, para) {
      camera.position.set(de[0], de[1], de[2])
      camera.lookAt(para[0], para[1], para[2])
      renderer.render(scene, camera)
    },
  }
  capa.classList.add("oculto")
}

// ---------- loop ----------
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

function animar() {
  requestAnimationFrame(animar)
  const delta = Math.min(clock.getDelta(), 0.1)
  if (controls.isLocked) {
    mover(delta)
    atualizarMira()
  }
  renderer.render(scene, camera)
}
animar()
