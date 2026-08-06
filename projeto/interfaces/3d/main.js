// Prova de conceito da Fase 2 — só a Cozinha, só pra validar o pipeline
// técnico (movimento, colisão simples, iluminação, interação por raycast)
// ANTES de desenhar geometria "de verdade" pras 16 salas.
//
// Importante: isso reaproveita window.DATA e window.Estado de verdade
// (os mesmos arquivos que a versão 2D usa) — não é um mockup separado.
// A porta já roda a mesma lógica condicional (obj.proxima) que decide
// pra onde o jogador vai. Só ainda não existe uma sala 3D do outro lado
// dela — isso é o próximo passo, não este.

import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

// ---------- dimensões da sala ----------
// Aumentadas a partir de uma planta de cozinha real que o Diogo trouxe
// como referência (4,28m x 3,28m) — bem maior que o rascunho anterior
// (4,0 x 3,2), suficiente pra diferença ser perceptível andando.
const LARGURA = 4.28;      // eixo X (parede leste/oeste)
const PROFUNDIDADE = 3.28; // eixo Z (parede norte/sul)
const PE_DIREITO = 2.6;    // eixo Y — ainda não confirmado, usando como padrão

const META_X = LARGURA / 2;
const META_Z = PROFUNDIDADE / 2;
const LARGURA_PORTA = 0.9;
const PORTA_OFFSET_X = -0.9; // porta fora do centro da parede norte, como no sketch novo

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

// ---------- bancada em L ----------
// Layout v3, a partir do segundo sketch do Diogo (inspirado numa planta
// de cozinha real): a bancada não fica mais num canto só — ela contorna
// TRÊS paredes (parte da parede norte à direita da porta, a parede
// leste inteira, parte da parede sul), como um balcão de verdade.
//
// Em vez de hardcodar x/z pra cada um dos 10 objetos que moram nela
// (o que não escala — se o formato do balcão mudar de novo, seria
// reescrever tudo à mão outra vez), a bancada é um CAMINHO (uma
// polilinha) e os objetos são distribuídos uniformemente ao longo
// dele. Mudar o formato da bancada = mudar CAMINHO_BANCADA, nada além
// disso.
const CAMINHO_BANCADA = [
  { x: PORTA_OFFSET_X + LARGURA_PORTA / 2 + 0.25, z: -META_Z + 0.3 }, // logo à direita da porta
  { x: META_X - 0.3, z: -META_Z + 0.3 },                              // canto nordeste
  { x: META_X - 0.3, z: META_Z - 0.3 },                               // canto sudeste
  { x: 0.1, z: META_Z - 0.3 }                                         // termina antes do centro da parede sul
];

function distribuirNoCaminho(pontos, n) {
  const trechos = [];
  let total = 0;
  for (let i = 0; i < pontos.length - 1; i++) {
    const a = pontos[i], b = pontos[i + 1];
    const comprimento = Math.hypot(b.x - a.x, b.z - a.z);
    trechos.push({ a, b, comprimento });
    total += comprimento;
  }
  const resultado = [];
  for (let i = 0; i < n; i++) {
    // (i + 0.5) em vez de i: centraliza os objetos nos espaços entre
    // as pontas do caminho, em vez de grudar um objeto bem na quina
    let alvo = total * ((i + 0.5) / n);
    for (const t of trechos) {
      if (alvo <= t.comprimento || t === trechos[trechos.length - 1]) {
        const f = t.comprimento === 0 ? 0 : alvo / t.comprimento;
        resultado.push({
          x: t.a.x + (t.b.x - t.a.x) * f,
          z: t.a.z + (t.b.z - t.a.z) * f
        });
        break;
      }
      alvo -= t.comprimento;
    }
  }
  return resultado;
}

// ---------- posições ----------
// gelo e a fala dele ("um ponto DA BANCADA está mais frio") — por isso
// ele continua preso à bancada e não pode virar objeto de chão.
// pratovazio voltou a ficar isolado numa ilha central — com o cômodo
// maior, cabe uma ilha de verdade no meio, igual à planta de referência
// (e reforça de novo o "esperando algo que não veio").
const OBJETOS_BANCADA = ["faca", "tabua", "tesoura", "amolador", "espeto", "garfo", "panela", "toalha", "copo", "gelo"];
const pontosBancada = distribuirNoCaminho(CAMINHO_BANCADA, OBJETOS_BANCADA.length);

const POSICOES = {};
OBJETOS_BANCADA.forEach((id, i) => {
  POSICOES[id] = { x: pontosBancada[i].x, y: 0.95, z: pontosBancada[i].z };
});

// estante — parede oeste inteira, uma fileira só (parede já é longa o
// suficiente com o cômodo maior)
const OBJETOS_ESTANTE = ["caderno", "etiqueta", "relogio", "camera"];
const zEstante0 = -META_Z + 0.5, zEstante1 = META_Z - 0.5;
OBJETOS_ESTANTE.forEach((id, i) => {
  const z = zEstante0 + (zEstante1 - zEstante0) * (i / (OBJETOS_ESTANTE.length - 1));
  POSICOES[id] = { x: -META_X + 0.15, y: 1.6, z };
});
POSICOES.camera.rotY = Math.PI / 2; // vira pra dentro do cômodo

// ilha central
POSICOES.pratovazio = { x: -0.3, y: 0.56, z: -0.2 };

// chão — único objeto cuja fala não o amarra a nenhuma superfície
POSICOES.mancha = { x: -0.9, y: 0.01, z: 0.5, chao: true };

// ---------- cena, câmera, renderer ----------
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0a0908, 0.045);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 50);
// spawn: canto sudoeste, longe da porta e da bancada, perto da estante
// — como no sketch (losango "spawn")
camera.position.set(-META_X + 0.7, 1.6, META_Z - 0.6);
camera.rotation.y = -0.6; // olhando em diagonal pro centro do cômodo, não reto pra parede

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
document.body.prepend(renderer.domElement);

// ---------- luz ----------
// Ainda na versão "clara demais de propósito" pra dar pra avaliar
// layout — baixar de novo só quando o layout estiver fechado de vez.
scene.add(new THREE.AmbientLight(0x55524a, 1.4));
const luzCentral = new THREE.PointLight(0xffdca8, 2.4, 10, 1.6);
luzCentral.position.set(-0.3, PE_DIREITO - 0.2, -0.1); // sobre a ilha
scene.add(luzCentral);
const luzBancadaNE = new THREE.PointLight(0xfff2d8, 1.6, 6, 1.6);
luzBancadaNE.position.set(META_X - 0.6, 1.6, -META_Z + 0.6);
scene.add(luzBancadaNE);
const luzBancadaSE = new THREE.PointLight(0xfff2d8, 1.6, 6, 1.6);
luzBancadaSE.position.set(META_X - 0.6, 1.6, META_Z - 0.6);
scene.add(luzBancadaSE);
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

// parede norte com vão de porta fora do centro (PORTA_OFFSET_X)
const vaoEsq = PORTA_OFFSET_X - LARGURA_PORTA / 2 - (-META_X); // largura do segmento à esquerda da porta
const vaoDir = META_X - (PORTA_OFFSET_X + LARGURA_PORTA / 2);  // largura do segmento à direita da porta
addPlano(vaoEsq, PE_DIREITO, matParede, -META_X + vaoEsq / 2, PE_DIREITO / 2, -META_Z, 0, 0);
addPlano(vaoDir, PE_DIREITO, matParede, META_X - vaoDir / 2, PE_DIREITO / 2, -META_Z, 0, 0);
addPlano(LARGURA_PORTA, PE_DIREITO - 2.0, matParede, PORTA_OFFSET_X, PE_DIREITO - (PE_DIREITO - 2.0) / 2, -META_Z, 0, 0); // verga

// porta em si — leve entreaberta, como no texto da versão 2D
const portaMesh = new THREE.Mesh(
  new THREE.BoxGeometry(LARGURA_PORTA - 0.1, 2.0, 0.05),
  new THREE.MeshStandardMaterial({ color: 0x0d0c0a, roughness: 0.8 })
);
portaMesh.position.set(PORTA_OFFSET_X - 0.15, 1.0, -META_Z + 0.05);
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
  mesh.userData = { tipo: "objeto", ref: o, decalque: !!p.chao };
  scene.add(mesh);
  interativos.push(mesh);
});

// bancada física — três segmentos de balcão seguindo o mesmo CAMINHO_BANCADA
// (norte-direita, leste inteira, sul-direita), pra não ficar só cubos
// flutuando sem apoio visual
const matBancada = new THREE.MeshStandardMaterial({ color: 0x22201c, roughness: 0.85 });
function addSegmentoBancada(a, b) {
  const comprimento = Math.hypot(b.x - a.x, b.z - a.z);
  const angulo = Math.atan2(b.x - a.x, b.z - a.z);
  const segMesh = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.85, comprimento + 0.3), matBancada);
  segMesh.position.set((a.x + b.x) / 2, 0.425, (a.z + b.z) / 2);
  segMesh.rotation.y = angulo;
  scene.add(segMesh);
}
for (let i = 0; i < CAMINHO_BANCADA.length - 1; i++) {
  addSegmentoBancada(CAMINHO_BANCADA[i], CAMINHO_BANCADA[i + 1]);
}

// estante — parede oeste inteira
const prateleira = new THREE.Mesh(
  new THREE.BoxGeometry(0.06, 0.04, zEstante1 - zEstante0 + 0.4),
  matBancada
);
prateleira.position.set(-META_X + 0.15, 1.5, (zEstante0 + zEstante1) / 2);
scene.add(prateleira);

// ilha central
const ilha = new THREE.Mesh(
  new THREE.CylinderGeometry(0.4, 0.35, 0.5, 20),
  new THREE.MeshStandardMaterial({ color: 0x1e1c19, roughness: 0.8 })
);
ilha.position.set(-0.3, 0.25, -0.2);
scene.add(ilha);

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
  // colisão simples: clamp dentro dos limites da sala (sem checar bancada/ilha ainda)
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
