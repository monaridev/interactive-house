// Motor sala-a-sala, primeira pessoa, sem índice/catálogo.
// window.DATA define um grafo de salas (window.DATA.salas) e a sala inicial
// (window.DATA.inicio). Cada objeto de uma sala é OU:
//   - "falante": tem `fala` — ao clicar, fala o texto (digitado + voz sintetizada)
//     e fica marcado como já observado; a sala continua a mesma.
//   - "porta": tem `proxima` (string fixa OU função que recebe o Set de objetos
//     falantes já clicados nesta sala e devolve a chave da próxima sala) —
//     ao clicar, navega imediatamente, sem falar nada.
// Todo o estado vive em memória (nada de localStorage): reiniciar uma rodada
// pra a próxima dupla de visitantes é só dar F5.

(function () {
  const data = window.DATA;
  const notebookId = window.NOTEBOOK_ID;

  const main = document.getElementById("main-content");
  const idField = document.getElementById("system-id");
  const clockField = document.getElementById("system-clock");

  idField.textContent = `TERMINAL ${notebookId}`;

  // ---------- relógio (com falha rara e proposital) ----------
  function pad(n) { return String(n).padStart(2, "0"); }
  function horaAtual() {
    const d = new Date();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function tickClock() {
    if (Math.random() < 0.025) {
      clockField.textContent = "--:--:--";
      setTimeout(() => { clockField.textContent = horaAtual(); }, 220);
    } else {
      clockField.textContent = horaAtual();
    }
  }
  tickClock();
  setInterval(tickClock, 1000);

  // ---------- som sintetizado (sem arquivos externos) ----------
  let audioCtx = null;
  let droneIniciado = false;

  function iniciarAudio() {
    if (audioCtx) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { }
  }
  function iniciarZumbido() {
    if (!audioCtx || droneIniciado) return;
    droneIniciado = true;
    const master = audioCtx.createGain();
    master.gain.value = 0.018;
    master.connect(audioCtx.destination);
    [55, 55.6].forEach((freq) => {
      const osc = audioCtx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      osc.connect(master);
      osc.start();
    });
    const lfo = audioCtx.createOscillator();
    const lfoGain = audioCtx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.008;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();
  }
  function tocarClique() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = 340;
    gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.06);
  }
  function tocarPorta() {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, audioCtx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.42);
  }
  window.addEventListener("click", function iniciar() {
    iniciarAudio();
    iniciarZumbido();
    window.removeEventListener("click", iniciar);
  }, { once: true });

  // ---------- voz sintetizada opcional (Web Speech API — sem arquivos) ----------
  let vozEscolhida = null;
  function prepararVoz() {
    if (!("speechSynthesis" in window)) return;
    const escolher = () => {
      const vozes = window.speechSynthesis.getVoices();
      vozEscolhida = vozes.find(v => v.lang && v.lang.toLowerCase().startsWith("pt")) || null;
    };
    escolher();
    window.speechSynthesis.onvoiceschanged = escolher;
  }
  function falar(texto) {
    if (!("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(texto);
      if (vozEscolhida) u.voice = vozEscolhida;
      u.lang = "pt-BR";
      u.rate = 0.95;
      u.pitch = 0.85;
      u.volume = 0.85;
      window.speechSynthesis.speak(u);
    } catch (e) { /* silencioso — voz é bônus, não requisito */ }
  }
  prepararVoz();

  // ---------- cintilação rara da tela ----------
  function agendarFlickerAleatorio() {
    const proximo = 8000 + Math.random() * 20000;
    setTimeout(() => {
      document.body.classList.add("flicker");
      setTimeout(() => document.body.classList.remove("flicker"), 160);
      agendarFlickerAleatorio();
    }, proximo);
  }

  // ---------- ícones (SVG desenhado em código — sem depender de imagem/internet) ----------
  const ICONES = {
    faca: '<path d="M4 20L15 9"/><path d="M15 9a2.5 2.5 0 0 0 3.5-3.5L21 3"/>',
    tabua: '<rect x="3" y="7" width="18" height="11" rx="1.5"/><path d="M7 7v11M12 7v11"/>',
    garfo: '<path d="M7 3v7a2 2 0 0 0 4 0V3M9 10v11M15 3v18"/>',
    porta: '<rect x="5" y="2" width="14" height="20" rx="1"/><circle cx="15" cy="12" r="1"/>',
    parede: '<path d="M4 2 L11 10 L8 14 L15 22" /><path d="M2 12h4M18 12h4" opacity="0.5"/>',
    cadeira: '<path d="M6 3v9M18 3v18M6 12h12M6 12v9"/>',
    panela: '<rect x="4" y="10" width="16" height="8" rx="1"/><path d="M2 12H4M20 12h2M8 10V6a4 4 0 0 1 8 0v4"/>',
    tesoura: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
    amolador: '<rect x="4" y="9" width="16" height="6" rx="1"/><path d="M4 9l4-4M20 15l-4 4"/>',
    espeto: '<path d="M3 21L21 3"/><path d="M7 17l2-2M11 13l2-2M15 9l2-2"/>',
    toalha: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M3 12h18M9 6v12M15 6v12"/>',
    gelo: '<path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11"/>',
    pratovazio: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>',
    copo: '<path d="M6 3h12l-2 18H8L6 3z"/><path d="M9 8h6M9 12h6" opacity="0.5"/>',
    mancha: '<path d="M6 20c-2-3 1-6 2-9s-1-6 3-8 8 1 7 5 2 5-1 8-9 4-11 4z" opacity="0.7"/>',
    caderno: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M3.5 7h1.5M3.5 11h1.5M3.5 15h1.5"/><path d="M8 8h8M8 12h8"/>',
    etiqueta: '<path d="M3 12l9-9h7v7l-9 9-7-7z"/><circle cx="15" cy="7" r="1.2"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    camera: '<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M8 7l1.5-3h5L16 7"/>',
    trilha: '<path d="M4 20L20 4" stroke-dasharray="3 3.5"/>',
    mesa: '<rect x="3" y="9" width="18" height="3" rx="1"/><path d="M6 12v9M18 12v9"/>',
    ar: '<path d="M3 8h12M3 12h18M3 16h9"/>',
    gota: '<path d="M12 3s6 7 6 11a6 6 0 1 1-12 0c0-4 6-11 6-11z"/>',
    prateleira: '<path d="M4 6h16M4 12h16M4 18h16"/><path d="M4 6v12M20 6v12"/>',
    ficha: '<rect x="4" y="5" width="16" height="14" rx="1"/><path d="M8 9h5M8 13h8"/>',
    selo: '<circle cx="12" cy="12" r="7"/><path d="M9 12l2 2 4-4"/>'
  };
  function svgIcone(nome) {
    const miolo = ICONES[nome] || '<circle cx="12" cy="12" r="7"/>';
    return `<svg class="icone-objeto" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${miolo}</svg>`;
  }

  const CLUSTER_LABEL = { corte: "Corte", domestico: "Doméstico", vazio: "Vazio", registro: "Registro" };

  // ---------- efeito de digitação ----------
  function digitar(elemento, texto, velocidade, aoTerminar) {
    elemento.textContent = "";
    let i = 0;
    const vel = velocidade || 16;
    (function passo() {
      if (i <= texto.length) {
        elemento.textContent = texto.slice(0, i);
        i++;
        setTimeout(passo, vel);
      } else if (aoTerminar) {
        aoTerminar();
      }
    })();
  }

  function exibirFicha(ficha) {
    main.innerHTML = "";
    ficha.classList.add("ficha-entrando");
    main.appendChild(ficha);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => ficha.classList.remove("ficha-entrando"));
    });
  }

  // ---------- estado da rodada ----------
  // Vive inteiro em window.Estado (estado.js) — este arquivo só consome.
  // Ver estado.js para o porquê da separação.
  const Estado = window.Estado;

  // Detalhe presente em toda sala, sempre igual, nunca explicado — a única
  // coisa que conecta todos os ambientes visivelmente. Não é decoração: é o
  // mesmo zumbido que o sistema de áudio está tocando de verdade, então o
  // texto e o som se confirmam um ao outro.
  const MOTIVO_RECORRENTE = " Um zumbido baixo persiste, indiferente ao ambiente.";

  function renderSala(salaId) {
    const sala = data.salas[salaId];
    const clicados = Estado.clicadosDe(salaId);
    const visitas = Estado.registrarVisita(salaId);
    const ctx = { clicados, visitas };

    const comuns = sala.objetos.filter(o => !o.ehSaida);
    const saida = sala.objetos.find(o => o.ehSaida);
    const prefixo = sala.prefixo || salaId.slice(0, 3).toUpperCase();
    const numAcervo = (idx) => `${prefixo}-${String(idx + 1).padStart(2, "0")}`;

    // Agrupa por cluster quando existir (só a Cozinha usa isso hoje);
    // salas sem cluster caem todas no grupo "_" e renderizam sem cabeçalho.
    const grupos = [];
    const porChave = {};
    comuns.forEach((o, idx) => {
      const chave = o.cluster || "_";
      if (!porChave[chave]) {
        porChave[chave] = { chave, titulo: (window.CLUSTERS && window.CLUSTERS[chave]) ? window.CLUSTERS[chave].titulo : null, itens: [] };
        grupos.push(porChave[chave]);
      }
      porChave[chave].itens.push({ obj: o, numero: numAcervo(idx) });
    });

    const cartaoHtml = (obj, numero) => `
      <button type="button" class="cartao-objeto ${clicados.has(obj.id) ? "visitado" : ""}" data-obj="${obj.id}" ${obj.cluster ? `data-cluster="${obj.cluster}"` : ""}>
        ${svgIcone(obj.icone || obj.id)}
        <span>${obj.nome}</span>
        <span class="num-acervo">${numero}</span>
      </button>
    `;

    const ficha = document.createElement("div");
    ficha.className = "ficha" + (comuns.length > 6 ? " grande" : "") + (sala.cluster ? " cluster-" + sala.cluster : "");
    ficha.innerHTML = `
      <div class="protocolo">
        <span>TERMINAL ${notebookId}</span>
        <span>—</span>
      </div>
      <h1>${sala.titulo}${sala.cluster ? `<span class="categoria-chip" style="--cor-categoria: var(--acc-${sala.cluster})">${CLUSTER_LABEL[sala.cluster]}</span>` : ""}</h1>
      <p class="digitando"></p>
      <div class="objetos objetos-jogo">
        ${grupos.map(g => `
          ${g.titulo ? `<div class="grupo-titulo">${g.titulo}</div>` : ""}
          <div class="grade-objetos">
            ${g.itens.map(it => cartaoHtml(it.obj, it.numero)).join("")}
          </div>
        `).join("")}
        ${saida ? `
          <button type="button" class="saida-destaque" data-obj="${saida.id}">
            ${svgIcone(saida.icone || "porta")}
            <span>${saida.nome}</span>
          </button>
        ` : ""}
      </div>
    `;
    exibirFicha(ficha);
    const descricaoBase = typeof sala.descricao === "function" ? sala.descricao(ctx) : sala.descricao;
    const textoCompleto = descricaoBase + MOTIVO_RECORRENTE;
    const campoDescricao = ficha.querySelector(".digitando");
    if (Estado.jaDigitou(salaId)) {
      campoDescricao.textContent = textoCompleto;
    } else {
      digitar(campoDescricao, textoCompleto, undefined, () => Estado.marcarDigitado(salaId));
    }

    function tratarClique(obj, elemento) {
      if (obj.ehSaida) {
        tocarPorta();
        const destino = typeof obj.proxima === "function"
          ? obj.proxima(clicados, Estado.snapshotGlobal())
          : obj.proxima;
        if (destino === "relatorio") renderRelatorio(salaId);
        else if (destino === "relatorioApressado") renderRelatorio("apressado");
        else renderSala(destino);
        return;
      }
      tocarClique();
      const jaClicados = new Set(clicados);
      const texto = typeof obj.fala === "function" ? obj.fala(jaClicados) : obj.fala;
      Estado.registrarClique(salaId, obj.id, obj.vestigios);
      elemento.classList.add("visitado");
      renderFala(texto, () => renderSala(salaId));
    }

    ficha.querySelectorAll("[data-obj]").forEach(el => {
      el.addEventListener("click", () => {
        const todos = [...comuns, ...(saida ? [saida] : [])];
        const obj = todos.find(o => o.id === el.dataset.obj);
        if (obj) tratarClique(obj, el);
      });
    });
  }

  function renderFala(texto, aoContinuar) {
    const ficha = document.createElement("div");
    ficha.className = "ficha";
    ficha.innerHTML = `
      <div class="protocolo"><span>TERMINAL ${notebookId}</span><span>—</span></div>
      <p class="digitando fala"></p>
      <div class="encerrar"><button type="button" data-voltar>← continuar</button></div>
    `;
    exibirFicha(ficha);
    digitar(ficha.querySelector(".digitando"), texto);
    falar(texto);
    ficha.querySelector("[data-voltar]").addEventListener("click", () => {
      tocarClique();
      aoContinuar();
    });
  }

  function renderRelatorio(salaFinalId) {
    const perfil = (data.relatorios && data.relatorios[salaFinalId]) || {
      texto: "O levantamento foi encerrado."
    };
    const ficha = document.createElement("div");
    ficha.className = "ficha";
    ficha.innerHTML = `
      <div class="protocolo"><span>TERMINAL ${notebookId}</span><span>${new Date().toLocaleDateString("pt-BR")}</span></div>
      <h1>Registro encerrado</h1>
      <p class="digitando"></p>
      <div class="selo">encerrado</div>
    `;
    exibirFicha(ficha);
    digitar(ficha.querySelector(".digitando"), perfil.texto, undefined, () => {
      const botao = document.createElement("button");
      botao.type = "button";
      botao.className = "continuar-catalogacao";
      botao.textContent = "Consultar catalogação final";
      botao.addEventListener("click", () => renderTerminalFinal(salaFinalId));
      ficha.appendChild(botao);
    });
  }

  // Segunda tela: olha pra sessão inteira (não só pro trajeto), e
  // interpreta o comportamento sem confirmar nem negar nada — o mesmo
  // recurso que os relatórios de sala já usam, aplicado à pessoa.
  function renderTerminalFinal(salaFinalId) {
    const objetosAnalisados = Estado.contarCliques("cozinha");
    const clusterId = salaFinalId !== "apressado" && data.salas[salaFinalId] ? data.salas[salaFinalId].cluster : null;
    const rotuloCluster = clusterId ? CLUSTER_LABEL[clusterId] : "Nenhum";
    const comportamento = (data.comportamentos && data.comportamentos[clusterId || "apressado"])
      || "Nenhuma conclusão definitiva pode ser extraída.";

    const ficha = document.createElement("div");
    ficha.className = "ficha";
    ficha.innerHTML = `
      <div class="protocolo"><span>TERMINAL ${notebookId}</span><span>${new Date().toLocaleDateString("pt-BR")}</span></div>
      <h1>Catalogação finalizada</h1>
      <div class="ficha-dados">
        <div><span class="rotulo-dado">Objetos analisados</span><span class="valor-dado">${objetosAnalisados}</span></div>
        <div><span class="rotulo-dado">Cluster predominante</span><span class="valor-dado">${rotuloCluster}</span></div>
      </div>
      <p class="digitando"></p>
      <div class="selo">encerrado</div>
    `;
    exibirFicha(ficha);
    digitar(ficha.querySelector(".digitando"), comportamento);
  }

  function renderBoot(aoFim) {
    const ficha = document.createElement("div");
    ficha.className = "ficha boot";
    ficha.innerHTML = `<div class="boot-linhas"></div>`;
    exibirFicha(ficha);
    const container = ficha.querySelector(".boot-linhas");
    const linhas = [
      "sistema de catalogação patrimonial",
      "verificando sessão...",
      `sessão localizada: terminal ${notebookId}`,
      "sincronizando registros...",
      "acesso liberado.",
      "saída disponível a qualquer momento."
    ];
    let i = 0;
    function proximaLinha() {
      if (i >= linhas.length) { setTimeout(aoFim, 900); return; }
      const p = document.createElement("p");
      p.className = "linha-boot";
      container.appendChild(p);
      digitar(p, linhas[i], 22, () => {
        i++;
        setTimeout(proximaLinha, 260);
      });
    }
    proximaLinha();
  }

  agendarFlickerAleatorio();
  renderBoot(() => renderSala(data.inicio));
})();
