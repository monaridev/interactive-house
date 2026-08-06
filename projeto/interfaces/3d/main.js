// Prova de conceito da Fase 2 — só a Cozinha, só pra validar o pipeline
// técnico (movimento, colisão simples, iluminação, interação por raycast)
// ANTES de desenhar geometria "de verdade" pras 16 salas.
//
// Importante: isso reaproveita window.DATA e window.Estado de verdade
// (os mesmos arquivos que a versão 2D usa) — não é um mockup separado.
// A porta já roda a mesma lógica condicional (obj.proxima) que decide
// pra onde o jogador vai. Só ainda não existe uma sala 3D do outro lado
// dela — isso é o próximo passo, não este.
//
// Posições dos objetos abaixo são um placeholder (dois "prateleiras" na
// parede leste) só pra ter algo clicável no espaço 3D. A disposição
// real da bancada é decisão de level design, não de engenharia — troque
// o objeto POSICOES sem mexer no resto do arquivo.

import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

// ---------- dimensões da sala (rascunho do PROGRESS.md, Sessão 2) ----------
const LARGURA = 4.0;   // eixo X (parede leste/oeste)
const PROFUNDIDADE = 3.2; // eixo Z (parede norte/sul)
const PE_DIREITO = 2.6;   // eixo Y — ainda não confirmado, usando como padrão

const META_X = LARGURA / 2;   // 2.0
const META_Z = PROFUNDIDADE / 2; // 1.6
const LARGURA_PORTA = 0.9;

const SALA_ID = "cozinha";
const salaData = window.DATA.salas[SALA_ID];
const objetos = salaData.objetos.filter((o) => !o.ehSaida);
const porta = salaData.objetos.find((o) => o.ehSaida);

// ---------- cor por cluster (placeholder visual, não é decisão final de arte) ----------
const COR_CLUSTER = {
  corte: 0xb23b3b,
  domestico: 0x4a7a6b,
  vazio: 0x6b7280,
  registro: 0x8a6d3b
};

// ---------- posições ----------
// Redesenhado a partir de um sketch top-down do Diogo: bancada e
// estante ficam nos DOIS CANTOS perto da porta (não espalhadas pela
// parede inteira) — layout mais parecido com uma cozinha de verdade,
// tudo concentrado perto da entrada.
//
// Uma restrição que veio da própria narrativa, não de engenharia: o
// gelo ("um ponto DA BANCADA está mais frio") não pode ir pro chão
// sem contradizer a fala dele. Por isso só a mancha ficou no grupo
// "chão" — os outros 15 objetos têm texto que já os amarra à bancada
// ou à estante.
const POSICOES = {
  // bancada — canto nordeste, perto da porta (x=1.85, leste; z negativo = perto da porta norte)
  faca:       { x: 1.85, y: 0.95, z: -1.55 },
  tabua:      { x: 1.85, y: 0.95, z: -1.25 },
  tesoura:    { x: 1.85, y: 0.95, z: -0.95 },
  amolador:   { x: 1.85, y: 0.95, z: -0.65 },
  espeto:     { x: 1.75, y: 0.95, z: -0.35, rotY: 0.35 }, // encostado, não deitado reto
  garfo:      { x: 1.85, y: 1.35, z: -1.55 },
  panela:     { x: 1.85, y: 1.35, z: -1.31 },
  toalha:     { x: 1.85, y: 1.30, z: -1.07 },
  pratovazio: { x: 1.85, y: 1.35, z: -0.83 },
  copo:       { x: 1.85, y: 1.35, z: -0.59 },
  gelo:       { x: 1.85, y: 1.35, z: -0.35 }, // fica na bancada — o texto exige isso
  // estante — canto noroeste, perto da porta (x=-1.85, oeste), dois níveis
  caderno:    { x: -1.85, y: 1.5, z: -1.2 },
  etiqueta:   { x: -1.85, y: 1.5, z: -0.7 },
  relogio:    { x: -1.85, y: 1.9, z: -1.2 },
  camera:     { x: -1.85, y: 1.9, z: -0.7, rotY: -Math.PI / 2 }, // olhando pra bancada
  // chão — único objeto cuja fala não o amarra a nenhuma superfície específica
  mancha:     { x: 0, y: 0.01, z: 0.9, chao: true }
};

// ---------- cena, câmera, renderer ----------
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0908, 0.05); // reduzido — 0.12 escurecia demais um cômodo desse tamanho

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 50);
camera.position.set(0, 1.6, META_Z - 0.3); // perto da parede sul, olhando pro norte

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.prepend(renderer.domElement);

// ---------- luz ----------
// Primeira versão era "meia-luz" de verdade — bonita pro clima, mas
// baixa demais pra dar pra avaliar o layout na prática. Subindo bastante
// aqui; ajustar o clima fica pra quando o layout já estiver fechado.
scene.add(new THREE.AmbientLight(0x55524a, 1.4));
const luzCentral = new THREE.PointLight(0xffdca8, 2.2, 9, 1.6);
luzCentral.position.set(0, PE_DIREITO - 0.2, 0);
scene.add(luzCentral);
const luzBancada = new THREE.PointLight(0xfff2d8, 1.6, 7, 1.6);
luzBancada.position.set(META_X - 0.6, 1.6, 0);
scene.add(luzBancada);
const luzOeste = new THREE.PointLight(0xfff2d8, 1.2, 6, 1.6);
luzOeste.position.set(-META_X + 0.6, 1.7, 0);
scene.add(luzOeste);

// ---------- sala: chão, teto, 4 paredes (norte com vão da porta) ----------
const matParede = new THREE.MeshStandardMaterial({ color: 0x2b2823, roughness: 0.95 });
const matChao = new THREE.MeshStandardMaterial({ color: 0x1c1a17, roughness: 0.9 });
const matTeto = new THREE.MeshStandardMaterial({ color: 0x14120f, roughness: 1 });

function addPlano(w, h, mat, x, y, z, rotX, rotY) {
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plano.position.set(x, y, z);
  if (rotX) plano.rotation.x = rotX;
  if (rotY) plano.rotation.y = rotY;
  scene.add(plano);
  return plano;
}

addPlano(LARGURA, PROFUNDIDADE, matChao, 0, 0, 0, -Math.PI / 2);
addPlano(LARGURA, PROFUNDIDADE, matTeto, 0, PE_DIREITO, 0, Math.PI / 2);
addPlano(PROFUNDIDADE, PE_DIREITO, matParede, -META_X, PE_DIREITO / 2, 0, 0, Math.PI / 2);   // oeste
addPlano(PROFUNDIDADE, PE_DIREITO, matParede, META_X, PE_DIREITO / 2, 0, 0, -Math.PI / 2);   // leste
addPlano(LARGURA, PE_DIREITO, matParede, 0, PE_DIREITO / 2, META_Z, 0, Math.PI);             // sul

// parede norte com vão de porta: dois segmentos + verga
const larguraSegmento = (LARGURA - LARGURA_PORTA) / 2;
addPlano(larguraSegmento, PE_DIREITO, matParede, -(LARGURA_PORTA / 2 + larguraSegmento / 2), PE_DIREITO / 2, -META_Z, 0, 0);
addPlano(larguraSegmento, PE_DIREITO, matParede, (LARGURA_PORTA / 2 + larguraSegmento / 2), PE_DIREITO / 2, -META_Z, 0, 0);
addPlano(LARGURA_PORTA, PE_DIREITO - 2.0, matParede, 0, PE_DIREITO - (PE_DIREITO - 2.0) / 2, -META_Z, 0, 0); // verga

// porta em si — leve entreaberta, como no texto da versão 2D
const portaMesh = new THREE.Mesh(
  new THREE.BoxGeometry(LARGURA_PORTA - 0.1, 2.0, 0.05),
  new THREE.MeshStandardMaterial({ color: 0x0d0c0a, roughness: 0.8 })
);
portaMesh.position.set(-0.15, 1.0, -META_Z + 0.05);
portaMesh.rotation.y = 0.35; // entreaberta
portaMesh.userData = { tipo: "porta", ref: porta };
scene.add(portaMesh);

// ---------- objetos interativos ----------
const interativos = [portaMesh];
const geomObjeto = new THREE.BoxGeometry(0.18, 0.18, 0.18);
const geomMancha = new THREE.CircleGeometry(0.35, 24);
const matMancha = new THREE.MeshStandardMaterial({ color: 0x0c0b09, roughness: 1 });

objetos.forEach((o) => {
  const p = POSICOES[o.id];
  if (!p) return;
  const mat = new THREE.MeshStandardMaterial({
    color: COR_CLUSTER[o.cluster] || 0x888888,
    roughness: 0.6,
    emissive: 0x000000
  });
  const mesh = p.chao
    ? new THREE.Mesh(geomMancha, matMancha)
    : new THREE.Mesh(geomObjeto, mat);
  mesh.position.set(p.x, p.y, p.z);
  if (p.chao) mesh.rotation.x = -Math.PI / 2; // decalque deitado no chão
  if (p.rotY) mesh.rotation.y = p.rotY;
  // decalque no chão não brilha por cima de si mesmo (sem emissive) —
  // usa leve elevação de cor ao ser examinado em vez de emissive
  mesh.userData = { tipo: "objeto", ref: o, decalque: !!p.chao };
  scene.add(mesh);
  interativos.push(mesh);
});

// bancada — canto nordeste, perto da porta (não a parede inteira)
const bancada = new THREE.Mesh(
  new THREE.BoxGeometry(0.5, 0.85, 1.4),
  new THREE.MeshStandardMaterial({ color: 0x22201c, roughness: 0.85 })
);
bancada.position.set(META_X - 0.3, 0.425, -0.95);
scene.add(bancada);

// estante — canto noroeste, perto da porta, dois níveis (prateleiras)
const matPrateleira = new THREE.MeshStandardMaterial({ color: 0x22201c, roughness: 0.85 });
const prateleiraBaixa = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 1.0), matPrateleira);
prateleiraBaixa.position.set(-META_X + 0.15, 1.45, -0.95);
scene.add(prateleiraBaixa);
const prateleiraAlta = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 1.0), matPrateleira);
prateleiraAlta.position.set(-META_X + 0.15, 1.85, -0.95);
scene.add(prateleiraAlta);

// ---------- movimento em 1ª pessoa ----------
const controls = new PointerLockControls(camera, renderer.domElement);
const capa = document.getElementById("capa");
capa.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => (capa.style.display = "none"));
controls.addEventListener("unlock", () => (capa.style.display = "flex"));

const teclas = { w: false, a: false, s: false, d: false };
addEventListener("keydown", (e) => { if (e.key.toLowerCase() in teclas) teclas[e.key.toLowerCase()] = true; });
addEventListener("keyup", (e) => { if (e.key.toLowerCase() in teclas) teclas[e.key.toLowerCase()] = false; });

const VELOCIDADE = 2.2; // m/s
const MARGEM_PAREDE = 0.35;
const clock = new THREE.Clock();

function mover(delta) {
  const dir = new THREE.Vector3();
  const frente = new THREE.Vector3();
  const lado = new THREE.Vector3();
  camera.getWorldDirection(frente);
  frente.y = 0;
  frente.normalize();
  lado.crossVectors(frente, camera.up).normalize();

  if (teclas.w) dir.add(frente);
  if (teclas.s) dir.sub(frente);
  if (teclas.d) dir.add(lado);
  if (teclas.a) dir.sub(lado);
  if (dir.lengthSq() > 0) dir.normalize().multiplyScalar(VELOCIDADE * delta);

  const alvo = camera.position.clone().add(dir);
  // colisão simples: clamp dentro dos limites da sala (sem checar a bancada ainda)
  alvo.x = THREE.MathUtils.clamp(alvo.x, -META_X + MARGEM_PAREDE, META_X - MARGEM_PAREDE);
  alvo.z = THREE.MathUtils.clamp(alvo.z, -META_Z + MARGEM_PAREDE, META_Z - MARGEM_PAREDE);
  camera.position.x = alvo.x;
  camera.position.z = alvo.z;
}

// ---------- interação (raycast do centro da tela) ----------
const raycaster = new THREE.Raycaster();
const ALCANCE = 2.0;
const centro = new THREE.Vector2(0, 0);
const hud = document.getElementById("hud");
const contadorEl = document.getElementById("contador");

function atualizarContador() {
  contadorEl.textContent = `objetos examinados: ${Estado.contarCliques(SALA_ID)}/16`;
}
atualizarContador();
hud.textContent = typeof salaData.descricao === "function"
  ? salaData.descricao({ clicados: Estado.clicadosDe(SALA_ID) })
  : salaData.descricao;

renderer.domElement.addEventListener("click", () => {
  if (!controls.isLocked) return;
  raycaster.setFromCamera(centro, camera);
  const hits = raycaster.intersectObjects(interativos, false);
  if (!hits.length || hits[0].distance > ALCANCE) return;
  const alvo = hits[0].object;
  const dados = alvo.userData;

  if (dados.tipo === "objeto") {
    const o = dados.ref;
    Estado.registrarClique(SALA_ID, o.id);
    const ja = Estado.clicadosDe(SALA_ID);
    const texto = typeof o.fala === "function" ? o.fala(ja) : o.fala;
    hud.textContent = `${o.nome.toUpperCase()}\n${texto}`;
    alvo.material.emissive.setHex(0x333333); // marca como já examinado
    atualizarContador();
  } else if (dados.tipo === "porta") {
    const clicados = Estado.clicadosDe(SALA_ID);
    const destino = typeof porta.proxima === "function" ? porta.proxima(clicados) : porta.proxima;
    // Só a Cozinha existe em 3D por enquanto — não há transição real
    // ainda. Isso só prova que a MESMA função de decisão da versão 2D
    // roda aqui sem alteração nenhuma.
    hud.textContent = `PORTA\nDestino calculado: ${destino}\n(transição real ainda não existe nesta prova de conceito)`;
  }
});

// ---------- loop ----------
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function animar() {
  requestAnimationFrame(animar);
  const delta = Math.min(clock.getDelta(), 0.1);
  if (controls.isLocked) mover(delta);
  renderer.render(scene, camera);
}
animar();
