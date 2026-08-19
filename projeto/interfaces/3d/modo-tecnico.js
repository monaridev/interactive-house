// Observabilidade de apresentação. O módulo só é criado por main.js quando
// ?apresentacao=1; no fluxo normal não há DOM, listener nem API adicional.
const ROTULOS = {
  corte: "corte",
  frio: "frio",
  ausencia: "ausência",
  observacao: "observação",
  domestico: "doméstico",
  registro: "registro",
  ordem: "ordem",
}

function formatarEvento(evento) {
  const tempo = `${(evento.tempo / 1000).toFixed(1)}s`
  if (evento.tipo === "interacao") return `${tempo} · ${evento.sala} · interação:${evento.objeto}`
  if (evento.tipo === "transicao") return `${tempo} · ${evento.origem} → ${evento.destino}`
  if (evento.tipo === "rota_definida") return `${tempo} · rota:${evento.rota} · cluster:${evento.cluster || "—"}`
  if (evento.tipo === "manifestacao_ambiental") return `${tempo} · ${evento.sala} · mundo:${evento.manifestacoes.join(", ")}`
  return `${tempo} · ${evento.tipo}:${evento.sala || "—"}`
}

function instalarEstilo() {
  if (document.getElementById("modo-tecnico-estilo")) return
  const estilo = document.createElement("style")
  estilo.id = "modo-tecnico-estilo"
  estilo.textContent = `
    #modo-tecnico { position:fixed; inset:0; z-index:45; display:grid; place-items:center; padding:24px;
      box-sizing:border-box; background:rgba(5,9,9,.9); color:#bfd0ca; font:11px/1.5 "Courier New",monospace;
      opacity:0; visibility:hidden; pointer-events:none; transition:opacity .2s ease,visibility 0s linear .2s; }
    #modo-tecnico.aberto { opacity:1; visibility:visible; pointer-events:auto; transition:opacity .2s ease; }
    #modo-tecnico .tecnico-painel { width:min(1040px,94vw); max-height:88vh; overflow:auto; padding:22px;
      box-sizing:border-box; border:1px solid #4c6861; background:#0b1110;
      box-shadow:0 24px 90px #000b,inset 0 0 55px #28443d18; }
    #modo-tecnico header { display:flex; justify-content:space-between; gap:20px; align-items:start;
      border-bottom:1px solid #2f4943; padding-bottom:14px; }
    #modo-tecnico h1 { margin:0; color:#e0e9e5; font-size:15px; letter-spacing:.13em; text-transform:uppercase; }
    #modo-tecnico header p { margin:3px 0 0; color:#718d85; }
    #modo-tecnico button { border:1px solid #48645d; color:#aec4bd; background:#111c1a; padding:7px 10px;
      font:inherit; cursor:pointer; }
    #modo-tecnico button:hover,#modo-tecnico button:focus-visible { color:#fff; border-color:#92afa6; }
    #modo-tecnico .tecnico-fluxo { display:grid; grid-template-columns:repeat(7,minmax(95px,1fr)); gap:16px;
      margin:20px 0; padding:16px; border:1px solid #263b36; background:#0e1715; }
    #modo-tecnico .tecnico-etapa { position:relative; min-height:48px; display:grid; place-items:center; text-align:center;
      padding:7px; border:1px solid #365149; color:#a9beb7; letter-spacing:.07em; }
    #modo-tecnico .tecnico-etapa:not(:last-child)::after { content:"→"; position:absolute; right:-14px; color:#55736b; }
    #modo-tecnico .tecnico-grade { display:grid; grid-template-columns:minmax(240px,.8fr) 1.2fr; gap:18px; }
    #modo-tecnico dl { display:grid; grid-template-columns:1fr 1fr; margin:0; border:1px solid #263b36; }
    #modo-tecnico dl div { padding:10px; border-bottom:1px solid #22342f; }
    #modo-tecnico dt { color:#66847c; text-transform:uppercase; letter-spacing:.08em; }
    #modo-tecnico dd { margin:3px 0 0; color:#d5e1dd; overflow-wrap:anywhere; }
    #modo-tecnico .tecnico-vestigios { grid-column:1/-1; }
    #modo-tecnico .tecnico-eventos { border:1px solid #263b36; padding:12px 14px; }
    #modo-tecnico h2 { margin:0 0 8px; color:#78978f; font-size:10px; letter-spacing:.1em; text-transform:uppercase; }
    #modo-tecnico ol { margin:0; padding-left:22px; color:#9fb2ac; }
    @media(max-width:780px){#modo-tecnico .tecnico-fluxo{grid-template-columns:1fr 1fr}.tecnico-etapa::after{display:none}
      #modo-tecnico .tecnico-grade{grid-template-columns:1fr}}
  `
  document.head.append(estilo)
}

export function criarModoTecnico({ obterSnapshot, podeAbrir, aoAbrir, aoFechar }) {
  instalarEstilo()
  const overlay = document.createElement("section")
  overlay.id = "modo-tecnico"
  overlay.setAttribute("role", "dialog")
  overlay.setAttribute("aria-modal", "true")
  overlay.setAttribute("aria-label", "Observabilidade técnica da sessão")
  overlay.setAttribute("aria-hidden", "true")
  overlay.innerHTML = `
    <div class="tecnico-painel">
      <header><div><h1>Observabilidade · Unidade 04</h1><p>Fluxo semântico em memória · sessão atual</p></div><button type="button" data-fechar>Fechar [T]</button></header>
      <div class="tecnico-fluxo" aria-label="Fluxo da arquitetura">
        <div class="tecnico-etapa">INTERAÇÃO</div><div class="tecnico-etapa">ESTADO</div><div class="tecnico-etapa">VESTÍGIOS</div>
        <div class="tecnico-etapa">DECISÃO / CLUSTER</div><div class="tecnico-etapa">ROTA</div><div class="tecnico-etapa">ALTERAÇÕES NO MUNDO</div>
        <div class="tecnico-etapa">DOSSIÊ / RECONSTRUÇÃO</div>
      </div>
      <div class="tecnico-grade">
        <dl>
          <div><dt>Sala atual</dt><dd data-sala>—</dd></div><div><dt>Objetos analisados</dt><dd data-objetos>0</dd></div>
          <div><dt>Cluster parcial</dt><dd data-cluster>—</dd></div><div><dt>Rota final</dt><dd data-rota>—</dd></div>
          <div><dt>Eventos</dt><dd data-total>0</dd></div><div><dt>Reconstrução</dt><dd data-reconstrucao>disponível na Sala Final</dd></div>
          <div class="tecnico-vestigios"><dt>Intensidades dos vestígios</dt><dd data-vestigios>—</dd></div>
        </dl>
        <section class="tecnico-eventos"><h2>Últimos eventos semânticos</h2><ol data-eventos></ol></section>
      </div>
    </div>
  `
  document.body.append(overlay)
  let aberto = false

  function atualizar() {
    if (!aberto) return
    const snapshot = obterSnapshot()
    overlay.querySelector("[data-sala]").textContent = snapshot.sala || "—"
    overlay.querySelector("[data-objetos]").textContent = String(snapshot.objetosAnalisados || 0)
    overlay.querySelector("[data-cluster]").textContent = snapshot.cluster || "—"
    overlay.querySelector("[data-rota]").textContent = snapshot.rota || "—"
    overlay.querySelector("[data-total]").textContent = String(snapshot.eventos.length)
    overlay.querySelector("[data-reconstrucao]").textContent = snapshot.reconstrucao || "disponível na Sala Final"
    const itensVestigio = Object.entries(snapshot.vestigios || {}).map(([tipo, valor]) => `${ROTULOS[tipo] || tipo}:${valor}`)
    overlay.querySelector("[data-vestigios]").textContent = itensVestigio.join(" · ") || "nenhum"
    const lista = overlay.querySelector("[data-eventos]")
    lista.replaceChildren()
    snapshot.eventos.slice(-8).forEach((evento) => {
      const item = document.createElement("li")
      item.textContent = formatarEvento(evento)
      lista.append(item)
    })
  }

  function abrir() {
    if (aberto || (podeAbrir && !podeAbrir())) return
    aberto = true
    aoAbrir?.()
    atualizar()
    overlay.classList.add("aberto")
    overlay.setAttribute("aria-hidden", "false")
    overlay.querySelector("[data-fechar]").focus()
  }

  function fechar() {
    if (!aberto) return
    aberto = false
    overlay.classList.remove("aberto")
    overlay.setAttribute("aria-hidden", "true")
    aoFechar?.()
  }

  function alternar() {
    if (aberto) fechar()
    else abrir()
  }

  overlay.querySelector("[data-fechar]").addEventListener("click", fechar)
  addEventListener("keydown", (evento) => {
    if (evento.repeat || evento.ctrlKey || evento.metaKey || evento.altKey) return
    if (evento.code === "KeyT") {
      evento.preventDefault()
      alternar()
    } else if (evento.code === "Escape" && aberto) {
      evento.preventDefault()
      fechar()
    }
  })

  return { abrir, fechar, alternar, atualizar, get aberto() { return aberto } }
}
