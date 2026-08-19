// Conteúdo do mundo: salas, clusters, objetos, relatórios e comportamentos.
// Extraído do notebook-a.html pra ser consumido tanto pela versão 2D
// (app.js) quanto pela prova de conceito 3D — o conteúdo é o mesmo,
// só muda quem desenha.

// Os 16 objetos da Cozinha, organizados em 4 clusters temáticos.
// A porta decide o destino pelo cluster com mais cliques (não pela
// combinação exata) — evita explosão de salas por combinação.
const CLUSTERS = {
  corte:     { titulo: "Utensílios de corte",     objetos: ["faca", "tesoura", "amolador", "espeto"] },
  domestico: { titulo: "Louça e mesa",             objetos: ["garfo", "panela", "tabua", "toalha"] },
  vazio:     { titulo: "Vestígios",                objetos: ["gelo", "pratovazio", "copo", "mancha"] },
  registro:  { titulo: "Registro e vigilância",    objetos: ["caderno", "etiqueta", "relogio", "camera"] }
};
const SALA_POR_CLUSTER = { corte: "salaA", domestico: "salaB", vazio: "salaC", registro: "salaD" };
window.CLUSTERS = CLUSTERS;
const OBJ_CLUSTER = {};
Object.keys(CLUSTERS).forEach((c) => CLUSTERS[c].objetos.forEach((id) => { OBJ_CLUSTER[id] = c; }));

// Camada semântica paralela aos clusters. Cluster continua decidindo a rota;
// vestígios apenas descrevem o que uma interação pode deixar no restante da
// sessão. Os pesos não são progresso e nunca são exibidos ao visitante.
const VESTIGIOS_COZINHA = {
  faca:        { corte: 2, frio: 1 },
  tesoura:     { corte: 1, ausencia: 1, ordem: 1 },
  amolador:    { corte: 1, registro: 1 },
  espeto:      { corte: 1, ausencia: 1, ordem: 1 },
  garfo:       { domestico: 1, ordem: 2 },
  panela:      { domestico: 2, ausencia: 1 },
  tabua:       { domestico: 1, corte: 1, registro: 1 },
  toalha:      { domestico: 1, ordem: 2, ausencia: 1 },
  gelo:        { frio: 2, ausencia: 1 },
  pratovazio:  { ausencia: 2, domestico: 1 },
  copo:        { frio: 1, ausencia: 1, domestico: 1 },
  mancha:      { ausencia: 2, registro: 1 },
  caderno:     { registro: 2, ausencia: 1 },
  etiqueta:    { registro: 2, ordem: 1 },
  relogio:     { registro: 1, ordem: 1, ausencia: 1 },
  camera:      { observacao: 2, registro: 1 }
};

window.DATA = {
  inicio: "cozinha",
  salas: {
    cozinha: {
      titulo: "Cozinha",
      prefixo: "COZ",
      descricao: (ctx) => {
        let t = "Um cômodo pequeno, mobiliado à meia-luz. Há uma porta ao fundo, entreaberta.";
        const n = ctx.clicados.size;
        if (n === 0) return t;
        if (n < 4) t += " Alguns objetos sobre a bancada já foram manuseados.";
        else if (n < 8) t += " Boa parte dos objetos sobre a bancada já foi manuseada.";
        else if (n < 16) t += " Quase todos os objetos sobre a bancada já foram manuseados.";
        else t += " Todos os dezesseis objetos catalogados já foram manuseados. Ainda assim, ela não parece diferente.";
        return t;
      },
      objetos: [
        {
          id: "faca", nome: "Faca", icone: "faca", cluster: "corte",
          vestigios: VESTIGIOS_COZINHA.faca,
          fala: (ja) => {
            let t = "O metal está frio. Mais frio do que deveria estar.";
            if (ja.has("tabua")) t += " Ao lado da tábua, o frio parece se espalhar por ela também.";
            if (ja.has("garfo")) t += " Perto do garfo, ela quase não reflete luz.";
            return t;
          }
        },
        { id: "tesoura", nome: "Tesoura", icone: "tesoura", cluster: "corte",
          vestigios: VESTIGIOS_COZINHA.tesoura,
          fala: "As lâminas estão alinhadas, sem qualquer sinal de uso." },
        { id: "amolador", nome: "Amolador", icone: "amolador", cluster: "corte",
          vestigios: VESTIGIOS_COZINHA.amolador,
          fala: "A pedra está gasta de um lado só, como se alguém tivesse pressa." },
        { id: "espeto", nome: "Espeto", icone: "espeto", cluster: "corte",
          vestigios: VESTIGIOS_COZINHA.espeto,
          fala: "Reto demais para já ter sido usado alguma vez." },
        {
          id: "tabua", nome: "Tábua de corte", icone: "tabua", cluster: "domestico",
          vestigios: VESTIGIOS_COZINHA.tabua,
          fala: (ja) => {
            let t = "Sulcos profundos cobrem toda a extensão da madeira.";
            if (ja.has("faca")) t += " Alguns sulcos têm exatamente a largura da faca ao lado.";
            if (ja.has("garfo")) t += " Nenhum deles parece ter sido feito por um garfo.";
            return t;
          }
        },
        {
          id: "garfo", nome: "Garfo", icone: "garfo", cluster: "domestico",
          vestigios: VESTIGIOS_COZINHA.garfo,
          fala: (ja) => {
            let t = "Está alinhado perfeitamente ao centro da bancada.";
            if (ja.has("faca")) t += " A faca, ao lado, não está.";
            if (ja.has("tabua")) t += " A tábua, evidentemente usada, contrasta com o quão limpo ele está.";
            return t;
          }
        },
        { id: "panela", nome: "Panela", icone: "panela", cluster: "domestico",
          vestigios: VESTIGIOS_COZINHA.panela,
          fala: "Está seca por dentro. Não há marcas de uso recente, nem cheiro de nada." },
        { id: "toalha", nome: "Toalha de mesa", icone: "toalha", cluster: "domestico",
          vestigios: VESTIGIOS_COZINHA.toalha,
          fala: "Está dobrada em quatro partes iguais, sem uma única marca de uso." },
        { id: "gelo", nome: "Superfície gelada", icone: "gelo", cluster: "vazio",
          vestigios: VESTIGIOS_COZINHA.gelo,
          fala: "Um ponto da bancada está visivelmente mais frio que o resto. Não há explicação registrada." },
        { id: "pratovazio", nome: "Prato vazio", icone: "pratovazio", cluster: "vazio",
          vestigios: VESTIGIOS_COZINHA.pratovazio,
          fala: "Está centralizado, como se esperasse algo que não chegou a vir." },
        { id: "copo", nome: "Copo embaçado", icone: "copo", cluster: "vazio",
          vestigios: VESTIGIOS_COZINHA.copo,
          fala: "Parece ter sido usado há segundos. Está seco por dentro." },
        { id: "mancha", nome: "Mancha apagada", icone: "mancha", cluster: "vazio",
          vestigios: VESTIGIOS_COZINHA.mancha,
          fala: "Um contorno no chão foi limpo até demais. Ainda é possível vê-lo, se você souber onde olhar." },
        { id: "caderno", nome: "Caderno", icone: "caderno", cluster: "registro",
          vestigios: VESTIGIOS_COZINHA.caderno,
          fala: "Todas as páginas estão em branco, exceto a última." },
        { id: "etiqueta", nome: "Etiqueta", icone: "etiqueta", cluster: "registro",
          vestigios: VESTIGIOS_COZINHA.etiqueta,
          fala: "Um número de catalogação sem correspondência em nenhum registro consultado." },
        { id: "relogio", nome: "Relógio parado", icone: "relogio", cluster: "registro",
          vestigios: VESTIGIOS_COZINHA.relogio,
          fala: "Está parado numa hora que não bate com nenhum outro relógio da casa." },
        { id: "camera", nome: "Câmera pequena", icone: "camera", cluster: "registro",
          vestigios: VESTIGIOS_COZINHA.camera,
          fala: "A lente está voltada para a bancada. Não há cabo, nem luz de gravação." },
        {
          id: "porta", nome: "Porta", icone: "porta", ehSaida: true,
          proxima: (clicados) => {
            if (clicados.size <= 1) return "corredor";
            const contagem = {};
            Object.keys(CLUSTERS).forEach((c) => {
              contagem[c] = CLUSTERS[c].objetos.filter((id) => clicados.has(id)).length;
            });
            const maxContagem = Math.max(...Object.values(contagem));
            if (maxContagem === 0) return "corredor";
            const empatados = Object.keys(contagem).filter((c) => contagem[c] === maxContagem);
            let dominante = empatados[0];
            if (empatados.length > 1) {
              // desempate: cluster do objeto clicado por último (Set preserva ordem de inserção)
              const ordem = [...clicados];
              for (let i = ordem.length - 1; i >= 0; i--) {
                const cl = OBJ_CLUSTER[ordem[i]];
                if (cl && empatados.includes(cl)) { dominante = cl; break; }
              }
            }
            return SALA_POR_CLUSTER[dominante];
          }
        }
      ]
    },
    corredor: {
      titulo: "Corredor",
      prefixo: "COR",
      descricao: (ctx) => {
        let t = "Um espaço estreito, sem saída aparente além de uma única porta atrás de você.";
        if (ctx.visitas > 1) t += " Já se passou por aqui antes. A porta parece exatamente igual.";
        return t;
      },
      objetos: [
        {
          id: "porta", nome: "Porta", icone: "porta", ehSaida: true,
          proxima: (clicados, global) => {
            const visitas = (global.visitasPorSala.corredor) || 0;
            const clicadosCozinha = global.clicadosPorSala.cozinha ? global.clicadosPorSala.cozinha.size : 0;
            if (visitas >= 3 && clicadosCozinha === 0) return "relatorioApressado";
            return "cozinha";
          }
        }
      ]
    },
    salaA: {
      titulo: "Ambiente A",
      prefixo: "AMB-A",
      cluster: "corte",
      descricao: "Um corredor estreito, com marcas de corte nas paredes de metal — perfeitamente retas, como se feitas com régua.",
      objetos: [
        { id: "parede", nome: "Parede", icone: "parede", fala: "Arranhões alinhados, todos na mesma altura, todos com a mesma profundidade." },
        { id: "placa", nome: "Placa metálica", icone: "parede", fala: "Amassada, com um padrão de cortes idêntico ao da parede." },
        { id: "ferramenta", nome: "Ferramenta", icone: "espeto", fala: "Uma ferramenta de corte, sem cabo, deixada no chão." },
        { id: "trilha", nome: "Trilha no chão", icone: "trilha", fala: "Uma sequência de cortes leva até a porta, e para exatamente ali." },
        { id: "porta", nome: "Porta", icone: "porta", ehSaida: true, proxima: "relatorio" }
      ]
    },
    salaB: {
      titulo: "Ambiente B",
      prefixo: "AMB-B",
      cluster: "domestico",
      descricao: "Uma sala vazia, mobiliada como se fosse para uma refeição que nunca aconteceu. Uma cadeira está virada de costas para a porta.",
      objetos: [
        { id: "cadeira", nome: "Cadeira", icone: "cadeira", fala: "O encosto ainda está morno." },
        { id: "mesa", nome: "Mesa", icone: "mesa", fala: "Posta para uma refeição que não veio. Os talheres estão intactos." },
        { id: "toalha", nome: "Toalha", icone: "toalha", fala: "Está esticada demais para ter sido usada." },
        { id: "copo", nome: "Copo", icone: "copo", fala: "Vazio, virado de boca para baixo." },
        { id: "porta", nome: "Porta", icone: "porta", ehSaida: true, proxima: "relatorio" }
      ]
    },
    salaC: {
      titulo: "Ambiente C",
      prefixo: "AMB-C",
      cluster: "vazio",
      descricao: "O ar aqui é visivelmente mais frio. Nenhuma superfície é plana o suficiente para apoiar algo.",
      objetos: [
        { id: "parede", nome: "Parede", icone: "parede", fala: "Uma mancha escura se estende do chão ao teto, mais larga na base." },
        { id: "ar", nome: "Ar", icone: "ar", fala: "Pesa mais do que deveria, sem nenhuma fonte visível." },
        { id: "teto", nome: "Teto", icone: "gota", fala: "Uma condensação estranha, sem fonte de umidade em lugar nenhum." },
        { id: "chao", nome: "Chão", icone: "mancha", fala: "Frio ao toque, mesmo através do calçado." },
        { id: "porta", nome: "Porta", icone: "porta", ehSaida: true, proxima: "relatorio" }
      ]
    },
    salaD: {
      titulo: "Ambiente D",
      prefixo: "AMB-D",
      cluster: "registro",
      descricao: "Uma sala estreita, com prateleiras de arquivo em ambas as paredes. Nenhuma etiqueta bate com o número da anterior.",
      objetos: [
        { id: "arquivo", nome: "Arquivo", icone: "caderno", fala: "Pastas idênticas, todas vazias, todas com a mesma data de abertura." },
        { id: "prateleira", nome: "Prateleira", icone: "prateleira", fala: "Numerada, mas fora de ordem." },
        { id: "ficha", nome: "Ficha", icone: "ficha", fala: "Um nome ilegível, escrito e apagado várias vezes." },
        { id: "selo", nome: "Selo", icone: "selo", fala: "Um carimbo institucional que não corresponde a nenhum órgão conhecido." },
        { id: "porta", nome: "Porta", icone: "porta", ehSaida: true, proxima: "relatorio" }
      ]
    },
    salaFinal: {
      titulo: "Sala final",
      prefixo: "FINAL",
      descricao: "Uma pequena sala institucional de avaliação. Sobre a mesa, um único arquivo aguarda consulta.",
      objetos: [
        { id: "dossie", nome: "Arquivo", icone: "caderno", fala: "Examinar registro" }
      ]
    },
    salaDino: {
      titulo: "Ambiente não catalogado",
      prefixo: "DINO",
      descricao: "Uma sala de manutenção que não consta na planta. A vegetação parece ter sido instalada antes das paredes.",
      objetos: [
        { id: "porta-retorno", nome: "Retornar à Cozinha", icone: "porta", ehSaida: true, proxima: "cozinha" }
      ]
    }
  },
  relatorios: {
    salaA: { texto: "O trajeto seguiu por um corredor de metal, entre marcas de corte. Nenhuma menção a uma cadeira consta neste registro. Talvez conste em outro." },
    salaB: { texto: "O trajeto levou a um ambiente parado, mobiliado para uma refeição que nunca aconteceu. Arranhões alinhados não constam neste registro. Compare com quem testou ao seu lado." },
    salaC: { texto: "O trajeto seguiu por um ambiente mais frio que o previsto, sem superfície plana o suficiente. Nem toda cadeira mencionada em outros registros existe neste." },
    salaD: { texto: "O trajeto levou a uma sala de arquivo sem correspondência com o restante do levantamento. Nenhum outro registro consultado menciona essa sala." },
    apressado: { texto: "Nenhum objeto foi manuseado neste trajeto. Não há nada, neste registro, para comparar com quem entrou depois de você." }
  },
  comportamentos: {
    corte: "O visitante demonstrou preferência por objetos de corte em vez de utensílios comuns.\n\nNenhuma conclusão definitiva pode ser extraída.",
    domestico: "O visitante deteve-se sobre objetos domésticos comuns, evitando os demais.\n\nNenhuma conclusão definitiva pode ser extraída.",
    vazio: "O visitante concentrou-se em vestígios e ausências, não em objetos de função clara.\n\nNenhuma conclusão definitiva pode ser extraída.",
    registro: "O visitante demonstrou preferência por registros em vez de objetos domésticos.\n\nNenhuma conclusão definitiva pode ser extraída.",
    apressado: "Amostra insuficiente.\n\nNenhum padrão pôde ser extraído."
  }
};
