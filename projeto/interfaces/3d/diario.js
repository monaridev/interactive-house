const PAGINAS = [
  {
    data: "Abril/2026",
    titulo: "Primeira proposta",
    corpo: [
      "O primeiro conceito do projeto foi um sistema de agendamento de salas, pensado para organizar o uso de espaços como a sala de recursos.",
      "Durante o desenvolvimento inicial, a necessidade que motivava a proposta foi resolvida pela própria gestão através de um sistema de agendamento pré-ordenado.",
      "Com o problema original já atendido, continuar o desenvolvimento perderia parte do sentido. A proposta foi encerrada e o grupo decidiu buscar uma nova direção.",
    ],
  },
  {
    data: "Abril/2026",
    titulo: "Segunda proposta",
    corpo: [
      "A nova ideia foi um chatbot, onde o visitante poderia interagir através de perguntas e respostas.",
      "A proposta permitia participação direta, mas durante o planejamento ficou evidente que a experiência ainda se aproximava de uma consulta tradicional: o usuário perguntava e o sistema respondia.",
      "O projeto precisava de algo em que a descoberta dependesse mais da curiosidade e das ações do visitante.",
    ],
    destaque: "A interface deixou de ser uma conversa. O próprio ambiente passou a ser a interface.",
  },
  {
    data: "Maio/2026",
    titulo: "A Casa",
    corpo: [
      "Surgiu então a ideia de construir um ambiente digital que pudesse ser explorado. O conteúdo deixaria de aparecer em menus e passaria a existir no próprio cenário.",
      "Objetos comuns se tornaram pontos de descoberta. A ordem das ações, o que era observado e aquilo que permanecia ignorado começaram a orientar a experiência.",
      "A curiosidade passou a ocupar o lugar que antes pertencia às perguntas escritas.",
    ],
  },
  {
    data: "Junho/2026",
    titulo: "Primeiro protótipo",
    corpo: [
      "O primeiro protótipo reuniu ambientes navegáveis, objetos clicáveis e um sistema básico de interação. A Casa já podia responder ao percurso do visitante sem apresentar uma sequência fixa de telas.",
      "As primeiras animações, efeitos visuais e sonoros foram acrescentados aos poucos. A navegação ganhou ajustes, e uma sequência inicial passou a preparar a entrada sem explicar o que deveria ser encontrado.",
    ],
  },
  {
    data: "Julho/2026",
    titulo: "O Museu",
    corpo: [
      "Durante o desenvolvimento surgiu uma segunda experiência chamada O Museu, criada para explorar regras explícitas, observação e descoberta através de outro formato.",
      "O protótipo serviu como experimento paralelo e ajudou a testar ideias de interação.",
      "Conforme A Casa ganhou mais profundidade, identidade visual e sistemas próprios, ficou claro que concentrar o desenvolvimento em duas experiências enfraquecia o projeto principal.",
      "O Museu foi descontinuado. A Casa passou a concentrar o desenvolvimento, os testes e a evolução técnica do projeto.",
    ],
  },
  {
    data: "Agosto/2026",
    titulo: "A Casa",
    corpo: [
      "Com Three.js, a experiência passou para um espaço tridimensional em primeira pessoa. Salas, móveis e objetos ganharam volume através de formas simples, enquanto colisões, luz e som passaram a definir como cada ambiente era percebido.",
      "A Cozinha tornou-se o ponto de partida. Dela nasceram o Corredor, quatro destinos possíveis e uma Sala Final onde o percurso é transformado em registro.",
    ],
  },
  {
    data: "Agosto/2026",
    titulo: "O que permaneceu",
    corpo: [
      "As escolhas feitas na Cozinha passaram a determinar rotas e pequenas reações posteriores. Certos gestos deixam vestígios que reaparecem em outras salas ou no dossiê, sem que a origem seja confirmada.",
      "A própria Cozinha também mudou. Ficou mais doméstica, mais respirável e marcada por lugares onde alguma coisa deveria estar. A vida familiar continua sugerida por poucos objetos; as ausências passaram a participar da arquitetura.",
    ],
  },
  {
    data: "17/08/2026",
    titulo: "",
    corpo: [],
    destaque: "Algumas ausências deixaram de ser apenas espaços vazios.",
    final: true,
  },
]

function paginaHtml(pagina, numero) {
  const paragrafos = pagina.corpo.map((texto) => `<p>${texto}</p>`).join("")
  return `
    <section class="diario-pagina${pagina.final ? " diario-pagina-final" : ""}" aria-label="Página ${numero}">
      <header><span>${pagina.data}</span>${pagina.titulo ? `<h2>${pagina.titulo}</h2>` : ""}</header>
      <div class="diario-texto">${paragrafos}${pagina.destaque ? `<blockquote>${pagina.destaque}</blockquote>` : ""}</div>
      <small>${String(numero).padStart(2, "0")}</small>
    </section>
  `
}

export function criarLeitorDiario({ overlay, aoFechar }) {
  let aberto = false
  let abertura = 0

  function renderizar() {
    const primeira = abertura * 2
    const anteriorDisponivel = abertura > 0
    const proximaDisponivel = primeira + 2 < PAGINAS.length
    overlay.innerHTML = `
      <article class="diario-livro" aria-label="Diário de Bordo de A Casa">
        <button type="button" class="diario-fechar" data-diario-fechar aria-label="Fechar Diário de Bordo">Fechar</button>
        <div class="diario-abertura">
          ${paginaHtml(PAGINAS[primeira], primeira + 1)}
          ${paginaHtml(PAGINAS[primeira + 1], primeira + 2)}
        </div>
        <nav class="diario-navegacao" aria-label="Navegação do Diário de Bordo">
          <button type="button" data-diario-anterior ${anteriorDisponivel ? "" : "disabled"}>← Voltar</button>
          <span>${abertura + 1} / ${Math.ceil(PAGINAS.length / 2)}</span>
          <button type="button" data-diario-proxima ${proximaDisponivel ? "" : "disabled"}>Folhear →</button>
        </nav>
      </article>
    `
    requestAnimationFrame(() => overlay.querySelector(".diario-livro")?.classList.add("aberto"))
    overlay.querySelector("[data-diario-fechar]")?.focus()
  }

  function abrir() {
    if (aberto) return false
    aberto = true
    abertura = 0
    overlay.setAttribute("aria-hidden", "false")
    overlay.classList.add("visivel")
    renderizar()
    return true
  }

  function fechar() {
    if (!aberto) return false
    aberto = false
    overlay.classList.remove("visivel")
    overlay.setAttribute("aria-hidden", "true")
    aoFechar?.()
    return true
  }

  overlay.addEventListener("click", (evento) => {
    if (evento.target.closest("[data-diario-fechar]")) {
      fechar()
    } else if (evento.target.closest("[data-diario-anterior]") && abertura > 0) {
      abertura--
      renderizar()
    } else if (evento.target.closest("[data-diario-proxima]") && (abertura + 1) * 2 < PAGINAS.length) {
      abertura++
      renderizar()
    }
  })

  addEventListener("keydown", (evento) => {
    if (!aberto || evento.key !== "Escape") return
    evento.preventDefault()
    evento.stopPropagation()
    fechar()
  })

  return {
    abrir,
    fechar,
    get aberto() {
      return aberto
    },
  }
}
