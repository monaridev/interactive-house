// Estado da rodada — separado de qualquer lógica de renderização.
//
// Por quê isso é um módulo à parte: quando a camada visual mudar (Fase 2,
// Three.js), ela só precisa CONSULTAR este estado, nunca reimplementá-lo.
// Nenhuma função aqui toca no DOM, em áudio, ou em texto — só contagens
// e conjuntos. Isso permite trocar a "pele" do jogo sem arriscar mudar
// as regras por engano.
//
// Tudo em memória (nada de localStorage): reiniciar uma rodada é F5,
// exatamente como já era antes da extração.

window.Estado = (function () {
  const clicadosPorSala = {}; // { salaId: Set(objId, objId...) }
  const visitasPorSala = {};  // { salaId: contagem }
  const jaDigitadoPorSala = {}; // { salaId: true }
  const tiposVestigio = {}; // { tipoSemantico: intensidade acumulada }
  const origensVestigio = new Set(); // objetos da Cozinha já registrados
  const eventosVestigio = []; // ordem das primeiras interações relevantes
  const eventosSessao = []; // linha do tempo semântica (nunca frames/movimento)
  const inicioSessao = typeof performance !== "undefined" ? performance.now() : Date.now();
  let rotaEscolhida = null;

  function agora() {
    const atual = typeof performance !== "undefined" ? performance.now() : Date.now();
    return Math.max(0, Math.round(atual - inicioSessao));
  }

  function copiar(valor) {
    if (valor === undefined) return undefined;
    return JSON.parse(JSON.stringify(valor));
  }

  function registrarEvento(tipo, detalhes) {
    const evento = {
      tempo: agora(),
      ordem: eventosSessao.length,
      tipo,
      ...(detalhes || {})
    };
    eventosSessao.push(evento);
    return copiar(evento);
  }

  function clicadosDe(salaId) {
    if (!clicadosPorSala[salaId]) clicadosPorSala[salaId] = new Set();
    return clicadosPorSala[salaId];
  }

  function registrarClique(salaId, objId, vestigios) {
    const clicados = clicadosDe(salaId);
    const primeiraInteracao = !clicados.has(objId);
    clicados.add(objId);

    let consequencias = null;
    if (primeiraInteracao && salaId === "cozinha" && vestigios) {
      consequencias = registrarVestigiosDetalhados(objId, vestigios);
    }
    registrarEvento("interacao", {
      sala: salaId,
      objeto: objId,
      primeiraInteracao,
      vestigios: consequencias || {},
      consequencias: { vestigios: consequencias || {} }
    });
    return primeiraInteracao;
  }

  function registrarVestigiosDetalhados(origem, tipos) {
    if (!origem || origensVestigio.has(origem) || !tipos) return null;
    const entradas = Object.entries(tipos).filter(([, quantidade]) => Number.isFinite(quantidade) && quantidade > 0);
    if (entradas.length === 0) return null;

    origensVestigio.add(origem);
    const registrados = {};
    entradas.forEach(([tipo, quantidade]) => {
      tiposVestigio[tipo] = (tiposVestigio[tipo] || 0) + quantidade;
      registrados[tipo] = quantidade;
    });
    eventosVestigio.push({ ordem: eventosVestigio.length, origem, tipos: registrados });
    return registrados;
  }

  // Mantém o retorno booleano da API anterior; o log usa internamente o
  // objeto detalhado para ligar a interação às consequências produzidas.
  function registrarVestigios(origem, tipos) {
    return !!registrarVestigiosDetalhados(origem, tipos);
  }

  function snapshotVestigios() {
    return {
      tipos: { ...tiposVestigio },
      origens: [...origensVestigio],
      eventos: eventosVestigio.map((evento) => ({
        ordem: evento.ordem,
        origem: evento.origem,
        tipos: { ...evento.tipos }
      }))
    };
  }

  function registrarVisita(salaId) {
    visitasPorSala[salaId] = (visitasPorSala[salaId] || 0) + 1;
    registrarEvento("entrada_sala", { sala: salaId, visita: visitasPorSala[salaId] });
    return visitasPorSala[salaId];
  }

  function registrarTransicao(origem, destino, objeto) {
    return registrarEvento("transicao", {
      sala: origem,
      objeto: objeto || "porta",
      origem,
      destino
    });
  }

  function registrarRota(rota, cluster, motivo, salaId) {
    if (!rota || rotaEscolhida?.rota === rota) return false;
    rotaEscolhida = { rota, cluster: cluster || null, motivo: motivo || "porta", origem: salaId || null };
    registrarEvento("rota_definida", { sala: salaId || null, rota, cluster: cluster || null, motivo: rotaEscolhida.motivo });
    return true;
  }

  function registrarManifestacoes(salaId, manifestacoes) {
    const lista = Array.isArray(manifestacoes) ? manifestacoes.filter(Boolean) : [];
    if (lista.length === 0) return false;
    registrarEvento("manifestacao_ambiental", { sala: salaId, manifestacoes: [...lista] });
    return true;
  }

  function snapshotEventos() {
    return eventosSessao.map(copiar);
  }

  function snapshotSessao() {
    return {
      duracao: agora(),
      eventos: snapshotEventos(),
      vestigios: snapshotVestigios(),
      rota: rotaEscolhida ? { ...rotaEscolhida } : null,
      clicadosPorSala: Object.fromEntries(Object.entries(clicadosPorSala).map(([id, itens]) => [id, [...itens]])),
      visitasPorSala: { ...visitasPorSala }
    };
  }

  function contarVisitas(salaId) {
    return visitasPorSala[salaId] || 0;
  }

  function jaDigitou(salaId) {
    return !!jaDigitadoPorSala[salaId];
  }

  function marcarDigitado(salaId) {
    jaDigitadoPorSala[salaId] = true;
  }

  function contarCliques(salaId) {
    return clicadosPorSala[salaId] ? clicadosPorSala[salaId].size : 0;
  }

  // Exposto só para as funções `proxima` de DATA, que hoje recebem o
  // histórico completo (não só da sala atual) para decidir o destino
  // da porta. Mantém a mesma assinatura que elas já usavam.
  function snapshotGlobal() {
    return {
      clicadosPorSala,
      visitasPorSala,
      vestigios: snapshotVestigios(),
      eventos: snapshotEventos(),
      rota: rotaEscolhida ? { ...rotaEscolhida } : null
    };
  }

  return {
    clicadosDe,
    registrarEvento,
    registrarClique,
    registrarVestigios,
    snapshotVestigios,
    registrarVisita,
    registrarTransicao,
    registrarRota,
    registrarManifestacoes,
    contarVisitas,
    jaDigitou,
    marcarDigitado,
    contarCliques,
    snapshotGlobal,
    snapshotEventos,
    snapshotSessao
  };
})();
