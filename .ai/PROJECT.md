# Interactive House — AI Project Context

Este arquivo é o ponto de entrada para agentes de IA trabalhando neste repositório.

## Fonte de verdade e prioridade

Use esta ordem quando houver conflito:

1. instrução explícita atual do usuário;
2. documentação específica deste repositório;
3. decisões registradas neste projeto;
4. `monaridev/monari-ai-brain` como padrão global compartilhado;
5. suposições do agente.

O brain global complementa este projeto, mas nunca substitui decisões locais.

## Antes de alterar código

1. confirme que o checkout local está atualizado e entenda se existem mudanças não commitadas;
2. leia `docs/PROGRESS.md`, especialmente as sessões mais recentes;
3. leia os documentos relevantes ao escopo da tarefa em `docs/`;
4. entenda a arquitetura existente antes de propor mudanças;
5. preserve a versão atual funcional e prefira a menor mudança coerente.

## Documentos importantes

- `docs/PROGRESS.md` — estado atual, histórico de sessões, validações e pendências;
- `docs/World_Design.md` — regras de experiência e linguagem do mundo;
- `docs/Engine.md` — decisões do motor e arquitetura técnica;
- `docs/Experience_flow.md` — fluxo da experiência;
- `docs/Motores de Interação.md` — princípios das interações;
- `docs/Estratégia principal.md` e `docs/Estratégia Resumida.md` — intenção e direção do projeto;
- `docs/Evolucao_do_Projeto_A_Casa.md` — evolução histórica.

Leia apenas o que for relevante para a tarefa, mas nunca pule `PROGRESS.md` em mudanças substanciais.

## Regras que não devem ser quebradas sem decisão explícita

- curiosidade é a mecânica principal;
- o sistema não deve revelar diretamente a lógica interna das rotas;
- evitar contador de progresso ou confirmação explícita de que um objeto já foi examinado quando isso enfraquecer a experiência;
- preservar os dados narrativos existentes em `core/` como fonte reutilizável entre interfaces;
- manter separação entre estado/lógica e renderização;
- evitar abstrações, dependências ou build complexity sem ganho claro;
- preservar o fluxo normal ao adicionar ferramentas de inspeção, apresentação ou debug;
- mudanças próximas a apresentação devem privilegiar baixo risco e validação rápida.

## Estado arquitetural resumido

A experiência principal está em Three.js e usa módulos de sala independentes conectados por um orquestrador. Estado e conteúdo narrativo foram separados da renderização para permitir consumidores diferentes. Cozinha, Corredor, Ambientes A-D e Sala Final já existem no fluxo 3D; relatórios, catalogação e final apressado são preservados conforme registrado em `docs/PROGRESS.md`.

Não trate este resumo como substituto do estado mais recente do `PROGRESS.md`.

## Uso do Monari AI Brain

Quando útil, consulte o repositório privado `monaridev/monari-ai-brain` para padrões globais de engenharia, arquitetura, revisão, design e workflows.

Promova para o brain global apenas aprendizados realmente reutilizáveis entre projetos. Decisões específicas de A Casa devem permanecer aqui ou em `docs/`.
