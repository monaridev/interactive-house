// Leitura dos vestígios da rodada. O estado bruto vive em core/estado.js;
// este módulo contém apenas seletores e combinações narrativas determinísticas
// compartilhadas pelas salas 3D e pelo dossiê.

export function intensidade(vestigios, tipo) {
  return vestigios?.tipos?.[tipo] || 0
}

export function temOrigem(vestigios, origem) {
  return vestigios?.origens?.includes(origem) || false
}

function ordemDaOrigem(vestigios, origem) {
  return vestigios?.eventos?.find((evento) => evento.origem === origem)?.ordem ?? -1
}

function ocorreuAntes(vestigios, primeira, segunda) {
  const a = ordemDaOrigem(vestigios, primeira)
  const b = ordemDaOrigem(vestigios, segunda)
  return a >= 0 && b >= 0 && a < b
}

export function combinacoesRaras(vestigios, rota) {
  return {
    reflexoCortado: rota === "salaA" && ocorreuAntes(vestigios, "faca", "camera"),
    fibraMarcada: rota === "salaB" && ocorreuAntes(vestigios, "faca", "toalha"),
    horaCondensada: rota === "salaC" && ocorreuAntes(vestigios, "gelo", "relogio"),
    fichaApagada: rota === "salaD" && ocorreuAntes(vestigios, "mancha", "caderno"),
  }
}

export function variacaoDossie(vestigios, rota) {
  const combinacoes = combinacoesRaras(vestigios, rota)
  const classes = []
  if (intensidade(vestigios, "corte") >= 2) classes.push("marca-corte")
  if (intensidade(vestigios, "frio") >= 2) classes.push("marca-frio")
  if (intensidade(vestigios, "observacao") >= 2) classes.push("marca-observacao")
  if (intensidade(vestigios, "ordem") >= 3) classes.push("marca-ordem")

  let nota = ""
  if (combinacoes.reflexoCortado) {
    nota = "A imagem anexada apresenta uma linha que não consta na cópia física."
  } else if (combinacoes.fibraMarcada) {
    nota = "Uma fibra escura foi preservada entre as páginas, sem classificação."
  } else if (combinacoes.horaCondensada) {
    nota = "O horário de emissão está parcialmente ilegível na via arquivada."
  } else if (combinacoes.fichaApagada) {
    nota = "Uma área da ficha parece ter sido apagada depois do arquivamento."
  }

  return { classes, nota }
}
