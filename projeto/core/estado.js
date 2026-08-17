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

  function clicadosDe(salaId) {
    if (!clicadosPorSala[salaId]) clicadosPorSala[salaId] = new Set();
    return clicadosPorSala[salaId];
  }

  function registrarClique(salaId, objId, vestigios) {
    const clicados = clicadosDe(salaId);
    const primeiraInteracao = !clicados.has(objId);
    clicados.add(objId);

    if (primeiraInteracao && salaId === "cozinha" && vestigios) {
      registrarVestigios(objId, vestigios);
    }
    return primeiraInteracao;
  }

  function registrarVestigios(origem, tipos) {
    if (!origem || origensVestigio.has(origem) || !tipos) return false;
    const entradas = Object.entries(tipos).filter(([, quantidade]) => Number.isFinite(quantidade) && quantidade > 0);
    if (entradas.length === 0) return false;

    origensVestigio.add(origem);
    const registrados = {};
    entradas.forEach(([tipo, quantidade]) => {
      tiposVestigio[tipo] = (tiposVestigio[tipo] || 0) + quantidade;
      registrados[tipo] = quantidade;
    });
    eventosVestigio.push({ ordem: eventosVestigio.length, origem, tipos: registrados });
    return true;
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
    return visitasPorSala[salaId];
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
    return { clicadosPorSala, visitasPorSala, vestigios: snapshotVestigios() };
  }

  return {
    clicadosDe,
    registrarClique,
    registrarVestigios,
    snapshotVestigios,
    registrarVisita,
    contarVisitas,
    jaDigitou,
    marcarDigitado,
    contarCliques,
    snapshotGlobal
  };
})();
