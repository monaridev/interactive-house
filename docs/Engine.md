# ENGINE.md

> Documento responsável por definir o funcionamento interno do sistema.
>
> Este documento transforma a ideia narrativa em regras técnicas.
>
> NÃO contém implementação final.
>
> Ele define a lógica que deverá ser programada.

---

# Visão Geral

O sistema deve funcionar como um ambiente adaptativo.

O usuário não interage com uma sequência fixa de telas.

Ele interage com um mundo que possui:

- estado;
- memória;
- regras;
- eventos;
- inconsistências controladas.

---

# Conceito Central

O sistema possui uma realidade interna.

Os usuários recebem apenas interpretações dessa realidade.

Portanto:

```
REALIDADE INTERNA

↓

REGRAS DO SISTEMA

↓

ESTADO ATUAL

↓

EXPERIÊNCIA DO USUÁRIO
```

O usuário nunca acessa diretamente a realidade interna.

---

# Arquitetura Conceitual

O projeto deve ser dividido em camadas.

```
Interface

↓

Eventos

↓

Motor de Regras

↓

Estado do Mundo

↓

Persistência
```

---

# Estado do Mundo

O mundo possui um estado global.

Exemplo conceitual:

```json
{
    "current_room": 17,

    "rooms": {},

    "objects": {},

    "documents": {},

    "visitors": {},

    "events": []
}
```

Esse estado representa a realidade do sistema.

---

# Visitantes

Cada visitante possui um estado individual.

Exemplo:

```json
{
    "id": "A",

    "observations": [],

    "choices": [],

    "time_spent": {},

    "interactions": []
}
```

---

# Estados dos Notebooks

Cada notebook possui:

- visão própria;
- informações próprias;
- documentos próprios;
- diferenças controladas.

Porém todos apontam para o mesmo mundo.

---

# Exemplo

Estado real:

```
Sala 04:

porta = existente

janela = inexistente

cadeira = existente
```

Notebook A:

```
porta = existente

janela = inexistente

cadeira = existente
```

Notebook B:

```
porta = existente

janela = existente

cadeira = existente
```

Nenhum está necessariamente "errado".

---

# Motor de Eventos

Tudo que muda no mundo deve passar por eventos.

Exemplo:

```
Usuário analisou cadeira

↓

Regra avaliada

↓

Evento criado

↓

Estado alterado

↓

Nova experiência gerada
```

---

# Tipos de Eventos

## Eventos de usuário

Criados por ações diretas.

Exemplos:

- clicar;
- abrir;
- voltar;
- esperar;
- comparar.

---

## Eventos de tempo

Criados pela passagem de tempo.

Exemplos:

Após 3 minutos:

- documento aparece.

Após 5 minutos:

- sala muda.

---

## Eventos de comparação

Criados pela interação entre notebooks.

Exemplo:

Usuário A encontrou documento X.

Usuário B recebe uma alteração relacionada.

---

## Eventos internos

Eventos que existem sem o usuário saber.

Exemplo:

O sistema reorganizou um arquivo.

---

# Máquina de Estados

O mundo deve possuir fases.

Não fases explícitas.

Estados internos.

Exemplo:

```
ESTADO 0

Sistema normal


↓

ESTADO 1

Primeiras inconsistências


↓

ESTADO 2

Usuário percebe diferenças


↓

ESTADO 3

Sistema começa a responder


↓

ESTADO 4

Realidade inconsistente
```

---

# Regra das Mudanças

Toda mudança deve obedecer:

## Pequena

Nunca alterar tudo.

## Justificável

Deve parecer consequência.

## Ambígua

Nunca explicar completamente.

---

# Sistema de Observação

O sistema registra comportamento.

Não para avaliar o usuário.

Mas para construir uma experiência personalizada.

---

# Dados observados

## Tempo

Exemplo:

Usuário ficou 40 segundos parado.

Possível consequência:

Documento adicional aparece.

---

## Ordem

Exemplo:

Primeiro abriu fotografia.

Depois abriu relatório.

Possível consequência:

Relatório menciona fotografia.

---

## Repetição

Exemplo:

Usuário abriu a mesma sala 5 vezes.

Possível consequência:

Sala possui pequena alteração.

---

## Ignorar elementos

Exemplo:

Nunca abriu a porta.

Possível consequência:

A porta recebe destaque posteriormente.

---

# Sistema de Personalização

O usuário recebe uma versão da experiência.

Não uma resposta certa.

---

# Exemplos

Usuário explorador:

```
Muitas áreas visitadas

↓

Recebe mais documentos
```

Usuário cuidadoso:

```
Poucos cliques

↓

Recebe mais detalhes
```

Usuário rápido:

```
Pouca observação

↓

Recebe informações incompletas
```

---

# Sistema de Inconsistência

As diferenças devem parecer erros.

Mas nunca erros reais.

---

# Exemplos de inconsistências

## Texto

Antes:

"Arquivo criado em 2017"

Depois:

"Arquivo criado em 2014"

---

## Espaço

Antes:

Sala possui duas portas.

Depois:

Sala possui uma porta.

---

## Identidade

Antes:

Documento assinado por João.

Depois:

Documento assinado por Maria.

---

# Gerador de Documentos

Documentos são uma das principais formas de narrativa.

Cada documento possui:

- origem;
- data;
- conteúdo;
- relação com outros documentos.

---

# Documentos não explicam.

Eles criam perguntas.

---

# Exemplo

Documento:

"Funcionário 12 solicitou remoção da sala 08."

Perguntas:

- Quem é funcionário 12?
- Por que removeu?
- O que existia na sala 08?

---

# Sistema de Memória

O programa deve lembrar:

- visitas;
- decisões;
- comparações;
- eventos anteriores.

---

# Persistência

A experiência deve sobreviver ao fechamento do programa.

Exemplo:

Usuário fecha.

Volta depois.

O mundo pode estar diferente.

---

# Aleatoriedade

Evitar aleatoriedade pura.

Não usar:

"50% de chance de acontecer algo."

Preferir:

"Dependendo do comportamento, certas possibilidades são desbloqueadas."

---

# Fórmula conceitual

Mudança:

```
Estado atual

+

Comportamento

+

Tempo

+

Estado do outro notebook

=

Novo estado
```

---

# Comunicação entre notebooks

Os notebooks devem trocar apenas informações necessárias.

Nunca revelar tudo.

---

# Exemplo

Notebook A:

Usuário encontrou sala secreta.

Notebook B:

Recebe:

"Foi registrada uma movimentação incomum."

Não recebe:

"A encontrou sala secreta."

---

# Finalização

O sistema deve gerar um relatório final.

Esse relatório depende da experiência.

Nunca deve ser igual para todos.

---

# Relatório

Pode conter:

- padrões observados;
- comportamento;
- documentos encontrados;
- diferenças entre usuários.

---

# Importante

O relatório NÃO deve explicar o mistério.

Ele deve aumentar a curiosidade.

---

# Prioridades de Desenvolvimento

Ordem correta:

1. Estado global funcionando.

2. Dois notebooks conectados.

3. Registro de ações.

4. Eventos.

5. Mudanças simples.

6. Documentos.

7. Interface.

8. Atmosfera.

---

# Regra final

A tecnologia existe para criar a sensação:

"Existe algo acontecendo aqui que eu ainda não entendo."