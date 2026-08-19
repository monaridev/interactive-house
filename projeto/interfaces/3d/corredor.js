// O Corredor: espaço de transição entre a Cozinha e ela mesma. No 2D é
// o loop cozinha -> corredor -> cozinha, e é onde mora o "final
// apressado" (quem só vai de porta em porta sem clicar em nada). Não
// tem os 16 objetos da Cozinha — window.DATA.salas.corredor só define
// a porta de saída — então a decisão aqui é só arquitetura e atmosfera,
// não posicionamento de conteúdo.
//
// Mesma assinatura de construirCozinha: construirCorredor(scene, ctx)
// devolve { obstaculos, interativos, spawn, ... }. main.js troca de
// sala chamando essa função de novo sem saber o que tem dentro dela.

import * as THREE from "three"
import { TEX } from "./texturas.js"
import { criarPorta } from "./modelos.js"
import { caixa, segmento } from "./colisao.js"
import { intensidade, temOrigem } from "./vestigios.js"

// ---------- dimensões ----------
// Bem mais estreito e mais baixo que a Cozinha (2,70m) — de propósito:
// a Cozinha é pra olhar em volta, o Corredor é pra passar por ele. O
// teto baixo (2,35m) aperta sem precisar dizer que aperta.
const LARGURA = 1.15
const PE_DIREITO = 2.35
const ESPESSURA_PAREDE = 0.12
const LARGURA_PORTA = 0.9
const ALTURA_PORTA = 2.0

// ---------- traçado: levemente torto ----------
// Dois trechos retos com uma quebra pequena no meio, em vez de reto
// (sem nada de especial) ou de esquina de 90° (fácil de memorizar e
// apontar exatamente onde vira). ~14° é o meio-termo: dá pra sentir
// que o corredor não é uma linha reta, mas não dá pra fixar UM ponto
// como "a curva" — o efeito é justamente não conseguir confirmar se é
// sempre o mesmo traçado.
const ANGULO_QUEBRA = -0.24 // rad, ~14°, sempre pro mesmo lado (oeste)
const COMPRIMENTO_1 = 2.6 // da porta da Cozinha até a quebra
const COMPRIMENTO_2 = 2.2 // da quebra até a porta de saída

const P0 = { x: 0, z: 0 } // entrada — onde a porta da Cozinha fica atrás do jogador
const ANGULO_1 = 0 // primeiro trecho segue reto em +Z
const DIR_1 = { x: Math.sin(ANGULO_1), z: Math.cos(ANGULO_1) }
const P1 = { x: P0.x + DIR_1.x * COMPRIMENTO_1, z: P0.z + DIR_1.z * COMPRIMENTO_1 } // a quebra
const ANGULO_2 = ANGULO_1 + ANGULO_QUEBRA
const DIR_2 = { x: Math.sin(ANGULO_2), z: Math.cos(ANGULO_2) }
const P2 = { x: P1.x + DIR_2.x * COMPRIMENTO_2, z: P1.z + DIR_2.z * COMPRIMENTO_2 } // a porta de saída

// Overlap pequeno nas juntas: sem isso, dois trechos com ângulos
// diferentes deixam uma fresta visível bem no ponto da quebra.
const SOBREPOR = 0.1

// hash determinístico simples (não é PRNG de sequência, é "mesma
// entrada -> mesma saída"). Sem seed fixa por sessão de propósito: a
// entrada é o número de visitas, então o mesmo visita=2 sempre produz
// o mesmo jitter, mas visita=2 e visita=3 produzem jitters diferentes.
function hash(seed) {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return s - Math.floor(s) // 0..1
}
function jitter(seed, amplitude) {
  return (hash(seed) - 0.5) * 2 * amplitude
}

export function construirCorredor(scene, ctx = {}) {
  const visita = ctx.visita || 0 // quantas vezes o corredor já foi visitado ANTES desta
  const vestigios = ctx.vestigios
  const frio = Math.min(intensidade(vestigios, "frio"), 4)
  const ausencia = Math.min(intensidade(vestigios, "ausencia"), 5)
  const ordem = Math.min(intensidade(vestigios, "ordem"), 6)
  const obstaculos = []
  const interativos = []
  const manifestacoes = []

  const salaData = window.DATA.salas.corredor
  const porta = salaData.objetos.find((o) => o.ehSaida)

  // ---------- materiais ----------
  // Metal, não madeira/pedra da Cozinha — o Corredor não pertence ao
  // mesmo léxico construtivo dela. É passagem institucional, não cômodo.
  const matParede = new THREE.MeshStandardMaterial({ map: TEX.metal(1, 1.6), color: 0x77858b, roughness: 0.55, metalness: 0.55 })
  const matPiso = new THREE.MeshStandardMaterial({ map: TEX.piso(1, 3), roughness: 0.8, metalness: 0.05 })
  const matTeto = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 1 })
  const matMarco = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.7, metalness: 0.4 })
  const matEstrutura = new THREE.MeshStandardMaterial({ color: 0x333b3e, roughness: 0.64, metalness: 0.62 })
  const matPainel = new THREE.MeshStandardMaterial({ color: 0x555b5b, roughness: 0.82, metalness: 0.3 })
  const matSinal = new THREE.MeshStandardMaterial({ color: 0xb7ae8f, roughness: 0.92 })
  const matCabo = new THREE.MeshStandardMaterial({ color: 0x171b1c, roughness: 0.72, metalness: 0.42 })

  // ---------- um trecho reto (chão, teto, duas paredes) ----------
  function trecho(a, b) {
    const comprimento = Math.hypot(b.x - a.x, b.z - a.z)
    const angulo = Math.atan2(b.x - a.x, b.z - a.z)
    const cxm = (a.x + b.x) / 2
    const czm = (a.z + b.z) / 2
    const compEstendido = comprimento + SOBREPOR * 2

    const piso = new THREE.Mesh(new THREE.BoxGeometry(LARGURA, 0.04, compEstendido), matPiso)
    piso.position.set(cxm, -0.02, czm)
    piso.rotation.y = angulo
    piso.receiveShadow = true
    scene.add(piso)

    const teto = new THREE.Mesh(new THREE.BoxGeometry(LARGURA, 0.04, compEstendido), matTeto)
    teto.position.set(cxm, PE_DIREITO + 0.02, czm)
    teto.rotation.y = angulo
    scene.add(teto)

    // normal: perpendicular ao trecho, aponta pra "direita" de quem
    // caminha de a pra b — mesma convenção usada em cozinha.js
    const normal = { x: Math.cos(angulo), z: -Math.sin(angulo) }
    for (const sinal of [-1, 1]) {
      const parede = new THREE.Mesh(new THREE.BoxGeometry(ESPESSURA_PAREDE, PE_DIREITO, compEstendido), matParede)
      parede.position.set(
        cxm + normal.x * sinal * (LARGURA / 2),
        PE_DIREITO / 2,
        czm + normal.z * sinal * (LARGURA / 2),
      )
      parede.rotation.y = angulo
      parede.receiveShadow = true
      scene.add(parede)
      const wa = { x: a.x + normal.x * sinal * (LARGURA / 2), z: a.z + normal.z * sinal * (LARGURA / 2) }
      const wb = { x: b.x + normal.x * sinal * (LARGURA / 2), z: b.z + normal.z * sinal * (LARGURA / 2) }
      if (Math.abs(wa.x - wb.x) < 0.001 || Math.abs(wa.z - wb.z) < 0.001) {
        obstaculos.push(segmento(wa, wb, ESPESSURA_PAREDE))
      } else {
        // Uma única AABB em torno da parede diagonal ocupava também o lado
        // interno da curva e podia fechar a passagem para o raio do jogador.
        // Pequenos retângulos mantêm o mesmo solver 2D e aproximam a parede
        // real sem introduzir física ou colisores girados no motor inteiro.
        const partes = Math.ceil(comprimento / 0.22)
        for (let i = 0; i < partes; i++) {
          const t0 = i / partes
          const t1 = (i + 1) / partes
          const inicio = { x: wa.x + (wb.x - wa.x) * t0, z: wa.z + (wb.z - wa.z) * t0 }
          const fim = { x: wa.x + (wb.x - wa.x) * t1, z: wa.z + (wb.z - wa.z) * t1 }
          obstaculos.push(caixa(
            (inicio.x + fim.x) / 2,
            (inicio.z + fim.z) / 2,
            Math.abs(fim.x - inicio.x) + ESPESSURA_PAREDE,
            Math.abs(fim.z - inicio.z) + ESPESSURA_PAREDE,
          ))
        }
      }
    }
  }

  trecho(P0, P1)
  trecho(P1, P2)

  // Uma infraestrutura repetida dá escala ao percurso. Os pórticos não
  // estreitam a circulação: ficam embutidos nas faces das paredes e no teto.
  // Na quebra, o trilho troca de direção sem uma junta perfeitamente alinhada,
  // deixando a dúvida se ele indica um destino ou apenas contorna um defeito.
  function pontoNoTrecho(a, angulo, distancia) {
    return { x: a.x + Math.sin(angulo) * distancia, z: a.z + Math.cos(angulo) * distancia }
  }

  function pórtico(ponto, angulo, indice) {
    const perp = { x: Math.cos(angulo), z: -Math.sin(angulo) }
    for (const lado of [-1, 1]) {
      const montante = new THREE.Mesh(new THREE.BoxGeometry(0.045, PE_DIREITO, 0.075), matEstrutura)
      montante.position.set(
        ponto.x + perp.x * lado * (LARGURA / 2 - 0.026),
        PE_DIREITO / 2,
        ponto.z + perp.z * lado * (LARGURA / 2 - 0.026),
      )
      montante.rotation.y = angulo
      scene.add(montante)

      const painel = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.62, 0.48), matPainel)
      painel.position.set(
        ponto.x + perp.x * lado * (LARGURA / 2 - 0.069),
        0.42,
        ponto.z + perp.z * lado * (LARGURA / 2 - 0.069),
      )
      painel.rotation.y = angulo
      scene.add(painel)
      for (let i = 0; i < 3; i++) {
        const rasgo = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.025, 0.31 - i * 0.025), matCabo)
        rasgo.position.set(
          painel.position.x - perp.x * lado * 0.014,
          0.29 + i * 0.13,
          painel.position.z - perp.z * lado * 0.014,
        )
        rasgo.rotation.y = angulo
        scene.add(rasgo)
      }
    }
    const travessa = new THREE.Mesh(new THREE.BoxGeometry(LARGURA - 0.08, 0.055, 0.075), matEstrutura)
    travessa.position.set(ponto.x, PE_DIREITO - 0.055, ponto.z)
    travessa.rotation.y = angulo
    scene.add(travessa)

    // Placas sem legenda legível: a ordem existe, mas não ajuda a localizar.
    const sinal = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.075, 0.012), matSinal)
    sinal.position.set(
      ponto.x + perp.x * (LARGURA / 2 - 0.095),
      1.67,
      ponto.z + perp.z * (LARGURA / 2 - 0.095),
    )
    sinal.rotation.y = angulo
    scene.add(sinal)
    for (let i = 0; i < 2; i++) {
      const marca = new THREE.Mesh(new THREE.BoxGeometry(0.025 + ((indice + i) % 2) * 0.035, 0.009, 0.006), matCabo)
      marca.position.set(-0.045 + i * 0.07, 0, 0.01)
      sinal.add(marca)
    }
  }

  const estruturas = [
    { p: pontoNoTrecho(P0, ANGULO_1, 1.03), a: ANGULO_1 },
    { p: pontoNoTrecho(P0, ANGULO_1, 2.02), a: ANGULO_1 },
    { p: pontoNoTrecho(P1, ANGULO_2, 0.75), a: ANGULO_2 },
    { p: pontoNoTrecho(P1, ANGULO_2, 1.58), a: ANGULO_2 },
  ]
  estruturas.forEach(({ p, a }, i) => pórtico(p, a, i + ordem))
  if (intensidade(vestigios, "registro") >= 2) {
    const placaInvertida = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.08, 0.012), matSinal)
    placaInvertida.position.set(P1.x - 0.43, 1.62, P1.z + 0.31)
    placaInvertida.rotation.set(0, ANGULO_2, Math.PI)
    scene.add(placaInvertida)
    manifestacoes.push("placa:invertida")
  }

  function trilho(a, b, angulo) {
    const comprimento = Math.hypot(b.x - a.x, b.z - a.z)
    const trilhoMesh = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, comprimento), matEstrutura)
    trilhoMesh.position.set((a.x + b.x) / 2, PE_DIREITO - 0.12, (a.z + b.z) / 2)
    trilhoMesh.rotation.y = angulo
    scene.add(trilhoMesh)
    const cabo = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, comprimento - 0.08), matCabo)
    cabo.position.set(trilhoMesh.position.x, PE_DIREITO - 0.165, trilhoMesh.position.z)
    cabo.rotation.y = angulo
    scene.add(cabo)
  }
  trilho(P0, P1, ANGULO_1)
  trilho(P1, P2, ANGULO_2)
  const junta = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.07, 12), matEstrutura)
  junta.position.set(P1.x, PE_DIREITO - 0.12, P1.z)
  scene.add(junta)

  // O frio reforça uma única seção do trilho; a ausência apaga outra. São
  // variações ambientais, não indicadores de progresso.
  const sinalFrio = new THREE.MeshStandardMaterial({
    color: 0xaec6ca,
    emissive: 0x789498,
    emissiveIntensity: frio >= 2 ? 0.85 : 0.18,
    roughness: 0.38,
  })
  const faixa = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.018, ausencia >= 3 ? 0.34 : 0.62), sinalFrio)
  faixa.position.set(P1.x, PE_DIREITO - 0.185, P1.z + 0.08)
  faixa.rotation.y = ANGULO_2
  scene.add(faixa)

  // AABB do vão da porta, mesmo com o trecho torto. `caixa`/`segmento`
  // em colisao.js só sabem desenhar retângulo alinhado aos eixos — pra
  // um vão num trecho em ângulo, a caixa de colisão é a ENVOLTÓRIA do
  // retângulo real girado, não o retângulo em si. É por isso que não
  // dá pra só testar "dir.x existe" como no trecho reto: essa conta só
  // funciona quando o ângulo é 0 ou 90°, e a quebra do Corredor não é
  // nenhum dos dois. Conservador (bloqueia um pouco mais do que a
  // porta em si), nunca permissivo — mesma regra do resto do arquivo.
  function bloqueioVao(ponto, angulo) {
    const dir = { x: Math.sin(angulo), z: Math.cos(angulo) }
    const perp = { x: Math.cos(angulo), z: -Math.sin(angulo) }
    const meiaLargura = LARGURA_PORTA / 2
    const meiaProfundidade = 0.28 // cobre o vão + a folha entreaberta
    const meioX = Math.abs(perp.x) * meiaLargura + Math.abs(dir.x) * meiaProfundidade
    const meioZ = Math.abs(perp.z) * meiaLargura + Math.abs(dir.z) * meiaProfundidade
    return caixa(ponto.x, ponto.z, meioX * 2, meioZ * 2)
  }

  // ---------- tampa de ponta, com vão de porta ----------
  // Mesmo padrão da parede norte da Cozinha: dois segmentos + verga,
  // com o vão sempre bloqueado pra caminhar (a travessia é por clique
  // na porta, nunca andando através dela — mesma regra da Cozinha).
  function tampaComVao(ponto, angulo) {
    const perp = { x: Math.cos(angulo), z: -Math.sin(angulo) }
    const largSobra = (LARGURA - LARGURA_PORTA) / 2
    for (const lado of [-1, 1]) {
      const centroLado = {
        x: ponto.x + perp.x * lado * (LARGURA_PORTA / 2 + largSobra / 2),
        z: ponto.z + perp.z * lado * (LARGURA_PORTA / 2 + largSobra / 2),
      }
      const painel = new THREE.Mesh(new THREE.BoxGeometry(largSobra, PE_DIREITO, ESPESSURA_PAREDE), matParede)
      painel.position.set(centroLado.x, PE_DIREITO / 2, centroLado.z)
      painel.rotation.y = angulo
      scene.add(painel)
    }
    const verga = new THREE.Mesh(new THREE.BoxGeometry(LARGURA_PORTA, PE_DIREITO - ALTURA_PORTA, ESPESSURA_PAREDE), matParede)
    verga.position.set(ponto.x, ALTURA_PORTA + (PE_DIREITO - ALTURA_PORTA) / 2, ponto.z)
    verga.rotation.y = angulo
    scene.add(verga)
    const marco = new THREE.BoxGeometry(0.04, ALTURA_PORTA, ESPESSURA_PAREDE + 0.02)
    for (const lado of [-1, 1]) {
      const b = new THREE.Mesh(marco, matMarco)
      b.position.set(
        ponto.x + perp.x * lado * (LARGURA_PORTA / 2 - 0.02),
        ALTURA_PORTA / 2,
        ponto.z + perp.z * lado * (LARGURA_PORTA / 2 - 0.02),
      )
      b.rotation.y = angulo
      scene.add(b)
    }

    // vão sempre bloqueado pra caminhar — a passagem é só por clique
    obstaculos.push(bloqueioVao(ponto, angulo))

    return { perp }
  }

  tampaComVao(P0, ANGULO_1)
  const { perp: perpSaida } = tampaComVao(P2, ANGULO_2)

  // ---------- porta de entrada (retorno à Cozinha) ----------
  // A porta da Cozinha, vista de trás — "atrás de você", como diz a
  // descrição em dados.js. Ela também é interativa para que o jogador
  // possa desfazer o trajeto e retornar à Cozinha.
  const portaEntrada = criarPorta(LARGURA_PORTA - 0.06, ALTURA_PORTA - 0.04)
  portaEntrada.position.set(P0.x, 0, P0.z)
  portaEntrada.rotation.y = ANGULO_1 + Math.PI // de costas pro corredor
  portaEntrada.userData = {
    tipo: "porta",
    ref: { id: "porta-retorno-cozinha", nome: "Porta para a Cozinha", proxima: "cozinha" },
  }
  scene.add(portaEntrada)
  interativos.push(portaEntrada)

  // ---------- porta de saída (interativa, sutilmente diferente a cada volta) ----------
  // "Sutilmente diferente": nada que mude a leitura da cena (não é uma
  // porta de cor diferente), só um resto entreaberto e uma posição de
  // batente que nunca são EXATAMENTE os mesmos dois visitas seguidas.
  // O seed é o número de visitas — determinístico (F5 no meio não
  // muda nada), mas cada volta ao corredor é um seed novo.
  const portaSaida = criarPorta(LARGURA_PORTA - 0.06, ALTURA_PORTA - 0.04)
  const anguloBase = 0.14 + ausencia * 0.006
  const fatorOrdem = Math.max(0.38, 1 - ordem * 0.1)
  const anguloJitter = jitter(visita * 7.31 + 1, 0.06) * fatorOrdem // ordem excessiva reduz a variação
  const desloceJitter = jitter(visita * 3.53 + 5, 0.012) // ±12mm ao longo do batente
  portaSaida.position.set(
    P2.x + perpSaida.x * desloceJitter,
    0,
    P2.z + perpSaida.z * desloceJitter,
  )
  portaSaida.rotation.y = ANGULO_2 + anguloBase + anguloJitter
  portaSaida.userData = { tipo: "porta", ref: porta }

  // Só aparece quando a pequena câmera foi examinada: um disco escuro no
  // alto da folha, pequeno demais para confirmar se é lente ou fixação.
  if (temOrigem(vestigios, "camera")) {
    const olho = new THREE.Mesh(
      new THREE.CircleGeometry(0.018, 16),
      new THREE.MeshStandardMaterial({ color: 0x15191a, roughness: 0.18, metalness: 0.55 }),
    )
    olho.position.set(-0.12, 1.55, 0.028)
    portaSaida.add(olho)
    manifestacoes.push("porta:lente")
  }
  scene.add(portaSaida)
  interativos.push(portaSaida)

  // ---------- luz ----------
  // A quebra continua sendo a única fonte com sombra. Duas calhas fracas
  // desenham profundidade suficiente para apresentação sem transformar o
  // corredor numa sucessão homogênea de lâmpadas.
  scene.add(new THREE.AmbientLight(0x3d4248, 0.52))
  scene.add(new THREE.HemisphereLight(0x77858e, 0x171a1b, 0.48))
  const corLampada = frio >= 2 ? 0xc8e0e7 : 0xdfe6ec
  const lampada = new THREE.PointLight(corLampada, 6.2 + frio * 0.12, 5.2, 2)
  lampada.position.set(P1.x, PE_DIREITO - 0.15, P1.z)
  lampada.castShadow = true
  lampada.shadow.mapSize.set(512, 512)
  scene.add(lampada)
  const bulbo = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 10, 8),
    new THREE.MeshStandardMaterial({ color: corLampada, emissive: corLampada, emissiveIntensity: 1.8 + frio * 0.08 }),
  )
  bulbo.position.copy(lampada.position)
  scene.add(bulbo)
  for (const { p, a } of [estruturas[0], estruturas[3]]) {
    const calha = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.025, 0.055), sinalFrio)
    calha.position.set(p.x, PE_DIREITO - 0.09, p.z)
    calha.rotation.y = a
    scene.add(calha)
    const apoio = new THREE.PointLight(0xaebfc6, 1.65, 2.6, 2)
    apoio.position.set(p.x, PE_DIREITO - 0.2, p.z)
    scene.add(apoio)
  }
  if (intensidade(vestigios, "domestico") >= 3) {
    const calorResidual = new THREE.PointLight(0xc39a6c, 0.38, 1.5, 2)
    calorResidual.position.set(P0.x, 1.35, P0.z + 0.72)
    scene.add(calorResidual)
    manifestacoes.push("entrada:calor-residual")
  }
  if (frio >= 2) manifestacoes.push("trilho:frio")
  if (ausencia >= 3) manifestacoes.push("trilho:interrompido")
  if (ordem >= 3) manifestacoes.push("porta:estavel")

  return {
    id: "corredor",
    data: salaData,
    porta,
    obstaculos,
    interativos,
    // spawn: logo depois da porta de entrada, já de frente pro corredor.
    // 0,8m de P0 — com o bloqueio do vão indo até 0,28m + raio do
    // jogador (0,28m), sobra margem de verdade, não só o suficiente pra
    // não colidir no frame de spawn.
    spawn: { x: P0.x, y: 1.65, z: P0.z + DIR_1.z * 0.8, olharY: ANGULO_1 + Math.PI },
    // No corredor a mesma frequência migra para trás da parede na quebra,
    // sugerindo continuidade física sem revelar a origem ao jogador.
    fonteSom: {
      x: P1.x - 0.72 - Math.min(intensidade(vestigios, "observacao"), 2) * 0.035,
      y: 1.05,
      z: P1.z + 0.18 + ausencia * 0.012,
    },
    limites: { peDireito: PE_DIREITO },
    manifestacoes,
  }
}
