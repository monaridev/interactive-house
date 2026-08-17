# Interactive House — AI Workflow

Este projeto usa documentação local + `monaridev/monari-ai-brain`.

## Entrada de uma tarefa

Ao receber uma feature, bugfix, refactor ou pedido visual:

1. determine o tipo de tarefa;
2. leia `.ai/PROJECT.md`;
3. leia a parte relevante de `docs/PROGRESS.md` e demais documentos necessários;
4. consulte o brain global quando a tarefa se beneficiar de padrões compartilhados;
5. proponha a menor mudança coerente;
6. implemente sem alterar regras narrativas ou arquitetura fora do necessário;
7. execute as verificações disponíveis;
8. liste testes manuais restantes, especialmente WebGL, Pointer Lock, áudio, raycast, iluminação e navegação quando afetados;
9. registre no `docs/PROGRESS.md` mudanças substanciais depois de validadas.

## Regra de sincronização

Antes de confiar no contexto local, confirme que o checkout representa a branch esperada. Se houver divergência entre o clone local e o remoto, alterações não commitadas ou dúvida sobre a versão em uso, pare e informe isso antes de implementar.

## Próximo de apresentações

Quando a versão atual já estiver apresentável:

- prefira mudanças isoladas e reversíveis;
- não faça refactors amplos sem necessidade;
- mantenha ferramentas de debug separadas do fluxo normal;
- preserve um caminho conhecido e funcional para demonstração;
- trate validação manual no navegador da apresentação como parte da entrega.

## Persistência de conhecimento

- histórico da sessão e estado do projeto → `docs/PROGRESS.md`;
- regra/decisão local duradoura → documento apropriado em `docs/` ou `.ai/PROJECT.md`;
- padrão reutilizável entre projetos → candidato a `monari-ai-brain`;
- detalhes efêmeros → não precisam virar documentação permanente.
