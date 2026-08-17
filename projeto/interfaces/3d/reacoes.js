// Reações curtas dos 16 objetos da Cozinha.
// Não há física nem novos assets: pequenas interpolações, um overlay de tela
// compartilhado e sons procedurais reproduzidos somente após o clique do usuário.

import * as THREE from "three"

const clamp01 = (v) => Math.max(0, Math.min(1, v))
const suave = (p) => 1 - (1 - clamp01(p)) ** 3

export function criarSistemaReacoes({ canvas, efeitoTela }) {
  const animacoes = []
  let contextoAudio = null
  let temporizadorEfeito = null
  let temporizadorTremor = null

  function obterContexto() {
    const AudioContexto = window.AudioContext || window.webkitAudioContext
    if (!AudioContexto) return null
    if (!contextoAudio) contextoAudio = new AudioContexto()
    if (contextoAudio.state === "suspended") contextoAudio.resume()
    return contextoAudio
  }

  function tom(frequencia, duracao, volume = 0.045, tipo = "sine", frequenciaFinal = frequencia, atraso = 0) {
    const ctx = obterContexto()
    if (!ctx) return
    const inicio = ctx.currentTime + atraso
    const oscilador = new OscillatorNode(ctx, { type: tipo, frequency: frequencia })
    const ganho = new GainNode(ctx, { gain: 0.0001 })
    oscilador.frequency.exponentialRampToValueAtTime(Math.max(25, frequenciaFinal), inicio + duracao)
    ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.006)
    ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao)
    oscilador.connect(ganho).connect(ctx.destination)
    oscilador.start(inicio)
    oscilador.stop(inicio + duracao + 0.02)
  }

  function ruido(duracao, volume = 0.025, frequencia = 1800, atraso = 0) {
    const ctx = obterContexto()
    if (!ctx) return
    const taxa = ctx.sampleRate
    const buffer = ctx.createBuffer(1, Math.ceil(taxa * duracao), taxa)
    const canal = buffer.getChannelData(0)
    for (let i = 0; i < canal.length; i++) canal[i] = (Math.random() * 2 - 1) * (1 - i / canal.length)
    const fonte = new AudioBufferSourceNode(ctx, { buffer })
    const filtro = new BiquadFilterNode(ctx, { type: "bandpass", frequency: frequencia, Q: 0.8 })
    const ganho = new GainNode(ctx, { gain: volume })
    fonte.connect(filtro).connect(ganho).connect(ctx.destination)
    fonte.start(ctx.currentTime + atraso)
  }

  function som(id) {
    switch (id) {
      case "faca":
        ruido(0.11, 0.035, 2600)
        tom(520, 0.13, 0.028, "sawtooth", 150)
        break
      case "tesoura":
        tom(1450, 0.09, 0.035, "square", 720)
        tom(980, 0.08, 0.02, "triangle", 520, 0.035)
        break
      case "espeto":
        tom(1750, 0.22, 0.026, "triangle", 680)
        break
      case "amolador":
        ruido(0.52, 0.025, 3100)
        tom(920, 0.45, 0.012, "sawtooth", 1450)
        break
      case "garfo":
        tom(1320, 0.42, 0.025, "sine", 1260)
        break
      case "panela":
        tom(210, 0.42, 0.05, "triangle", 95)
        tom(490, 0.18, 0.018, "square", 240)
        break
      case "tabua":
        ruido(0.09, 0.042, 190)
        tom(95, 0.12, 0.026, "sine", 55)
        break
      case "toalha":
        ruido(0.42, 0.018, 560)
        break
      case "gelo":
        ruido(0.38, 0.018, 4200)
        tom(640, 0.62, 0.02, "sine", 330)
        break
      case "pratovazio":
        tom(2250, 0.18, 0.028, "triangle", 980)
        tom(1600, 0.22, 0.018, "sine", 760, 0.04)
        break
      case "copo":
        ruido(0.22, 0.035, 5200)
        tom(2850, 0.28, 0.03, "triangle", 720)
        tom(1900, 0.2, 0.018, "sine", 560, 0.045)
        break
      case "mancha":
        tom(62, 0.8, 0.025, "sine", 44)
        break
      case "caderno":
        ruido(0.56, 0.02, 1100)
        break
      case "etiqueta":
        ruido(0.24, 0.016, 1700)
        break
      case "relogio":
        tom(1100, 0.06, 0.036, "square", 700)
        tom(130, 0.18, 0.03, "triangle", 70, 0.12)
        break
      case "camera":
        ruido(0.055, 0.045, 2400)
        tom(420, 0.08, 0.025, "square", 180)
        tom(950, 0.045, 0.02, "square", 500, 0.065)
        break
    }
  }

  function efeito(classe, duracao) {
    clearTimeout(temporizadorEfeito)
    efeitoTela.className = ""
    void efeitoTela.offsetWidth
    efeitoTela.classList.add(classe)
    temporizadorEfeito = setTimeout(() => efeitoTela.className = "", duracao)
  }

  function tremor(intensidade = "leve") {
    clearTimeout(temporizadorTremor)
    canvas.classList.remove("tremor-leve", "tremor-corte")
    void canvas.offsetWidth
    const classe = intensidade === "corte" ? "tremor-corte" : "tremor-leve"
    canvas.classList.add(classe)
    temporizadorTremor = setTimeout(() => canvas.classList.remove(classe), intensidade === "corte" ? 300 : 220)
  }

  function animar(duracao, atualizar, finalizar = null) {
    animacoes.push({ duracao, tempo: 0, atualizar, finalizar })
  }

  function deslocamentoLocal(grupo, distancia) {
    return { x: Math.sin(grupo.rotation.y) * distancia, z: Math.cos(grupo.rotation.y) * distancia }
  }

  function mostrarPrefixo(grupo, prefixo) {
    grupo.traverse((objeto) => {
      if (objeto.name.startsWith(prefixo)) objeto.visible = true
    })
  }

  function disparar(grupo, id) {
    if (!grupo || grupo.userData.reacaoExecutada) return false
    grupo.userData.reacaoExecutada = true
    som(id)

    if (id === "faca") {
      tremor("corte")
      efeito("efeito-sangue", 1450)
    } else if (id === "tesoura") {
      const esquerda = grupo.getObjectByName("tesoura-esquerda")
      const direita = grupo.getObjectByName("tesoura-direita")
      const e0 = esquerda?.rotation.y || 0
      const d0 = direita?.rotation.y || 0
      animar(0.24, (p) => {
        if (esquerda) esquerda.rotation.y = THREE.MathUtils.lerp(e0, -0.025, suave(p))
        if (direita) direita.rotation.y = THREE.MathUtils.lerp(d0, 0.025, suave(p))
      })
    } else if (id === "espeto") {
      const origem = grupo.position.clone()
      const d = deslocamentoLocal(grupo, -0.045)
      tremor()
      animar(0.32, (p) => {
        const vai = Math.sin(clamp01(p) * Math.PI * 0.78)
        grupo.position.set(origem.x + d.x * vai, origem.y + Math.sin(p * Math.PI) * 0.012, origem.z + d.z * vai)
      }, () => grupo.position.set(origem.x + d.x * 0.65, origem.y, origem.z + d.z * 0.65))
    } else if (id === "amolador") {
      const x0 = grupo.position.x
      const canal = grupo.getObjectByName("canal-amolador")
      animar(0.55, (p) => {
        grupo.position.x = x0 + Math.sin(p * Math.PI * 18) * 0.006 * (1 - p)
        if (canal?.material) {
          canal.material.emissive.setHex(0xb5c9d0)
          canal.material.emissiveIntensity = Math.sin(p * Math.PI) * 1.4
        }
      }, () => {
        grupo.position.x = x0
        if (canal?.material) canal.material.emissiveIntensity = 0
      })
    } else if (id === "garfo") {
      const r0 = grupo.rotation.y
      animar(0.36, (p) => grupo.rotation.y = THREE.MathUtils.lerp(r0, r0 + 0.42, suave(p)))
    } else if (id === "panela") {
      const tampa = grupo.getObjectByName("tampa-panela")
      if (tampa) {
        const y0 = tampa.position.y
        animar(0.48, (p) => {
          tampa.position.y = y0 + Math.abs(Math.sin(p * Math.PI * 2.2)) * 0.045 * (1 - p * 0.45)
          tampa.rotation.z = Math.sin(p * Math.PI * 2) * 0.08
        }, () => {
          tampa.position.y = y0
          tampa.rotation.z = 0.035
        })
      }
    } else if (id === "tabua") {
      const origem = grupo.position.clone()
      const d = deslocamentoLocal(grupo, 0.025)
      const marca = grupo.getObjectByName("marca-tabua")
      if (marca) marca.visible = true
      animar(0.22, (p) => grupo.position.set(origem.x + d.x * suave(p), origem.y, origem.z + d.z * suave(p)))
    } else if (id === "toalha") {
      const mover = grupo.getObjectByName("toalha-movel")
      const d = deslocamentoLocal(grupo, 0.038)
      const origem = grupo.position.clone()
      animar(0.52, (p) => {
        grupo.position.set(origem.x + d.x * suave(p), origem.y, origem.z + d.z * suave(p))
        if (mover) mover.rotation.z = THREE.MathUtils.lerp(0, 0.08, suave(p))
      })
    } else if (id === "gelo") {
      const nucleo = grupo.getObjectByName("nucleo-gelo")
      efeito("efeito-frio", 1550)
      animar(0.9, (p) => {
        const escala = THREE.MathUtils.lerp(1, 1.28, suave(p))
        grupo.scale.set(escala, escala, escala)
        if (nucleo?.material) {
          nucleo.material.color.lerpColors(new THREE.Color(0xaac7d1), new THREE.Color(0x65b8d5), suave(p))
          nucleo.material.emissiveIntensity = THREE.MathUtils.lerp(0.32, 0.78, suave(p))
        }
      })
    } else if (id === "pratovazio") {
      mostrarPrefixo(grupo, "trinca-prato-")
      const r0 = grupo.rotation.y
      animar(0.28, (p) => grupo.rotation.y = r0 + Math.sin(p * Math.PI * 4) * 0.018 * (1 - p), () => grupo.rotation.y = r0)
    } else if (id === "copo") {
      mostrarPrefixo(grupo, "trinca-copo-")
      tremor()
      const r0 = grupo.rotation.z
      animar(0.46, (p) => grupo.rotation.z = THREE.MathUtils.lerp(r0, r0 + 0.38, suave(p)))
    } else if (id === "mancha") {
      const nucleo = grupo.getObjectByName("nucleo-mancha")
      animar(1.05, (p) => {
        const pulso = Math.sin(p * Math.PI * 3) * 0.035 * (1 - p)
        const escala = THREE.MathUtils.lerp(1, 1.16, suave(p)) + pulso
        grupo.scale.set(escala, escala, escala)
        if (nucleo?.material) nucleo.material.opacity = THREE.MathUtils.lerp(0.82, 0.98, suave(p))
      })
    } else if (id === "caderno") {
      const capa = grupo.getObjectByName("capa-caderno")
      const pagina = grupo.getObjectByName("pagina-caderno")
      if (pagina) pagina.visible = true
      animar(0.72, (p) => {
        if (capa) capa.rotation.z = THREE.MathUtils.lerp(0, 1.18, suave(p))
        if (pagina) pagina.rotation.z = THREE.MathUtils.lerp(0, 0.82, suave(Math.max(0, p - 0.15) / 0.85))
      })
    } else if (id === "etiqueta") {
      const etiqueta = grupo.getObjectByName("etiqueta-movel")
      if (etiqueta) animar(0.5, (p) => {
        etiqueta.rotation.x = THREE.MathUtils.lerp(0, -0.68, suave(p))
        etiqueta.rotation.z = Math.sin(p * Math.PI) * 0.12
      })
    } else if (id === "relogio") {
      const corpo = grupo.getObjectByName("corpo-relogio")
      const minuto = grupo.getObjectByName("ponteiro-minuto")
      const minutoInicial = minuto?.rotation.z || 0
      if (corpo) animar(0.56, (p) => {
        corpo.rotation.x = THREE.MathUtils.lerp(0, -1.12, suave(p))
        if (minuto) minuto.rotation.z = THREE.MathUtils.lerp(minutoInicial, minutoInicial + 0.52, suave(p))
      })
    } else if (id === "camera") {
      const flash = grupo.getObjectByName("flash-camera")
      const luz = new THREE.PointLight(0xe9f2ff, 0, 2.2, 2)
      luz.position.set(0, 0.08, 0.12)
      grupo.add(luz)
      efeito("efeito-flash", 420)
      animar(0.32, (p) => {
        const intensidade = Math.max(0, 1 - p * 2.4)
        luz.intensity = 7 * intensidade
        if (flash?.material) {
          flash.material.emissive.setHex(0xe9f2ff)
          flash.material.emissiveIntensity = 4 * intensidade
        }
      }, () => {
        grupo.remove(luz)
        if (flash?.material) flash.material.emissiveIntensity = 0
      })
    }
    return true
  }

  function atualizar(delta) {
    for (let i = animacoes.length - 1; i >= 0; i--) {
      const animacao = animacoes[i]
      animacao.tempo += delta
      const p = clamp01(animacao.tempo / animacao.duracao)
      animacao.atualizar(p)
      if (p >= 1) {
        animacao.finalizar?.()
        animacoes.splice(i, 1)
      }
    }
  }

  function limpar() {
    animacoes.length = 0
    clearTimeout(temporizadorEfeito)
    clearTimeout(temporizadorTremor)
    efeitoTela.className = ""
    canvas.classList.remove("tremor-leve", "tremor-corte")
  }

  return { disparar, atualizar, limpar }
}
