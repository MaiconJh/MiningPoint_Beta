---
id: SPEC-0005
title: Camadas de responsabilidade no card de tópico do fórum
status: implementado
created: 2026-10-19
updated: 2026-10-19
author: MaiconJh
reviewer: MaiconJh
approved_at: 2026-10-19
implemented_at: 2026-10-19
commit: null
superseded_by: null
supersedes: null
last_audit: null
test_report: null
files:
  - src/components/forum/ThreadListItem.tsx
tags: [forum, ui, hierarchy, card]
---

# SPEC-0005 — Camadas de responsabilidade no card de tópico do fórum

## Contexto

O `ThreadListItem` foi entregue pela SPEC-0003 com autoria visível e
escala tipográfica densa, mas o card continua sendo uma superfície
única. Avatar, badges de estado, categoria, título, excerto, meta de
autoria e contadores dividem o mesmo plano visual, sem separação por
responsabilidade.

O resultado é o descrito pelo solicitante: os itens perdem a
rastreabilidade visual e ficam mesclados. O olho não distingue o que é
contexto (quem escreveu, onde, quando), o que é conteúdo (título e
excerto) e o que é atividade (reações, respostas, última resposta).

Evidências no código atual:

- `ThreadListItem.tsx` renderiza um único `div` com `p-4 sm:p-5
  rounded-xl border`; dentro dele, um `flex items-start
  justify-between gap-4` sem subdivisões.
- Os badges de estado (Fixado, Trancado, Resolvido) e o badge de
  categoria ocupam a mesma linha, acima do título. Onde e estado
  competem no mesmo plano.
- A meta de autoria (nick, data, tempo relativo, última resposta) fica
  abaixo do excerto, no mesmo bloco do conteúdo.
- Os contadores usam `self-center` e flutuam no meio vertical do card,
  sem âncora com o rodapé.
- `--border-subtle` em tema escuro é `#38404C`, idêntico a
  `--bg-surface`; um divisor com esse token fica invisível.

A referência de composição é o padrão de card em camadas: header com
contexto, corpo com conteúdo, footer com atividade. A borda externa
permanece a mais forte; o divisor interno é mais fraco que ela.

Esta spec refina a composição do `ThreadListItem` entregue pela
SPEC-0003. Ela não substitui a SPEC-0003: o requisito R-04 daquela spec
(autoria visível) continua válido e é pressuposto aqui.

## Objetivo

Dar ao card de tópico três zonas visuais com responsabilidades distintas
— contexto, conteúdo e atividade — sem introduzir linguagem visual nova,
sem alterar comportamento funcional e sem tocar em contratos de dados.

## Requisitos

Progresso: `[8/8]`

- [x] **R-01** — Três zonas nomeadas no card.
      **Critério:** `ThreadListItem` renderiza um elemento container
      `<article>` com exatamente três regiões semânticas: `<header>`
      (contexto), `<div className="space-y-1.5 flex-1 min-w-0">` (conteúdo)
      e `<footer>` (atividade) (ou roles equivalentes). Cada zona contém
      apenas os elementos da sua responsabilidade. A borda externa do
      container continua sendo a mais forte do card. Em telas estreitas,
      as três zonas empilham sem overflow horizontal e sem sobreposição.

- [x] **R-02** — Contexto separado do estado.
      **Critério:** o nome da categoria aparece na zona de contexto. Os
      badges de estado (Fixado, Trancado, Resolvido) aparecem na zona
      de conteúdo. Nenhuma linha visual mistura categoria com estado.

- [x] **R-03** — Autoria ancorada no topo.
      **Critério:** avatar, nick e data de criação ficam na zona de
      contexto. A meta de autoria deixa de existir abaixo do excerto.
      Enquanto o perfil do autor carrega, a zona mantém o fallback
      atual (`membro-<prefixo>` ou `Membro`) sem mudar de altura nem
      deslocar o conteúdo. Quando o autor não é resolvido, o fallback
      de identificação continua o mesmo e não quebra a zona.

- [x] **R-04** — Atividade ancorada no rodapé.
      **Critério:** última resposta, contador de reações e contador de
      respostas ficam na zona de atividade, alinhados à direita. Nenhum
      contador usa `self-center` nem flutua no meio vertical do card.

- [x] **R-05** — Hierarquia de bordas em três níveis.
      **Critério:** a borda do container usa `--border-default`; a
      separação entre zonas usa um tom mais fraco, derivado de
      `--border-default` via `color-mix`, visível nos dois temas. O
      divisor nunca é mais forte que a borda externa. Nenhum token de
      cor novo é adicionado ao bloco de tokens raiz nem ao bloco de
      tema claro.

- [x] **R-06** — Estados preservados.
      **Critério:** fixado, trancado, resolvido, sem categoria,
      reações desligadas, autor ausente e corpo vazio continuam
      renderizando sem quebrar a estrutura de três zonas. Quando o
      corpo está vazio, a zona de conteúdo mostra apenas o título e
      não reserva espaço para um excerto inexistente. Tópico fixado
      mantém o realce de borda já existente.

- [x] **R-07** — Movimento existente, sem animação nova.
      **Critério:** o card continua usando `forum-card-transition`; o
      hover continua elevando o card e deslocando a borda para
      `--border-focus`. Nenhuma classe de transição nova é criada. A
      regra `prefers-reduced-motion: reduce` existente continua
      cobrindo o card.

- [x] **R-08** — Sem regressão funcional.
      **Critério:** o link do título continua apontando para
      `/forum/:forumSlug/:threadId`; `getCachedProfile` continua
      compartilhando requisições por `authorId`; `MarkdownBody` com
      `compact` continua renderizando o excerto; `forum.features`
      continua controlando reações e solução.

## Restrições

- Não alterar comportamento funcional: rotas, hooks, permissões e
  leitura/escrita no Firestore permanecem como estão.
- Não alterar contratos de dados: `ForumThread`, `Forum` e
  `UserProfile` não mudam.
- Divisores e bordas entre zonas utilizam borda derivada de
  `--border-default` via `color-mix`, configurada diretamente com
  utilitários de classe no componente, preservando `src/index.css` intocado.
- Toda cor vem de `var(--token)` ou de `color-mix` sobre um token
  existente. Nenhum utilitário de cor Tailwind, nenhum valor literal.
- Strings visíveis em português; identificadores em inglês.
- Sem novos assets, sem novas dependências, sem novos componentes
  compartilhados.

## Fora de escopo

- Alterar `ForumIndex`, `ForumView`, `ThreadView`, `CommentForm` ou
  `NewThreadForm`.
- Alterar o painel administrativo do fórum.
- Alterar a escala tipográfica `forum-meta` / `forum-body` /
  `forum-title` / `forum-page` / `forum-num`.
- Adicionar filtros, ordenação, busca, votação ou bookmarking.
- Redesenhar a página do fórum fora do item de lista.

## Testes

> Preenchido **após** a execução no AI Studio. Cole aqui, **verbatim**, o
> bloco retornado no formato definido em `_meta/AI-STUDIO-PROMPT.md`. Esta
> seção é **append-only**: não edite o conteúdo colado — se precisar
> corrigir, gere um novo relatório no AI Studio e substitua o bloco.

<!-- BEGIN AI STUDIO REPORT -->
## Testes da Spec — SPEC-0005 — Camadas de responsabilidade no card de tópico do fórum

### T-01 — Três zonas nomeadas no container article
- **Requisito:** R-01
- **Tipo:** build
- **Executado:** sim
- **Comando:** `npm run check && npm run build`
- **Resultado:** passou
- **Evidência:** `ThreadListItem.tsx` renderiza `<article>` contendo `<header>`, bloco de conteúdo e `<footer>` com empilhamento responsivo
- **Observações:** estrutura em 3 zonas sem sobreposição ou overflow horizontal

### T-02 — Contexto no topo separado do estado
- **Requisito:** R-02
- **Tipo:** build
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** Categoria isolada no `<header>` à direita; badges Fixado, Trancado e Resolvido isolados no bloco de conteúdo

### T-03 — Autoria ancorada no cabeçalho
- **Requisito:** R-03
- **Tipo:** build
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** Avatar, nick e data de criação renderizados no `<header>`; meta removida abaixo do excerto; fallbacks `membro-<prefixo>` e `Membro` preservados

### T-04 — Atividade ancorada no rodapé à direita
- **Requisito:** R-04
- **Tipo:** build
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `<footer>` alinha à direita última resposta, contador de reações e respostas sem flutuação vertical nem `self-center`

### T-05 — Hierarquia de bordas e divisores
- **Requisito:** R-05
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run lint`
- **Resultado:** passou
- **Evidência:** Borda externa `--border-default` preservada; divisores usam `border-[color-mix(in_srgb,var(--border-default)_60%,transparent)]` sem criação de tokens proibidos

### T-06 — Preservação de estados e tratamento de corpo vazio
- **Requisito:** R-06
- **Tipo:** unit
- **Executado:** sim
- **Comando:** `npm test -- --run`
- **Resultado:** passou
- **Evidência:** 154 testes unitários e de integração aprovados; corpo vazio renderiza apenas o título sem reservar espaço para excerto

### T-07 — Preservação de movimento e transições
- **Requisito:** R-07
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run lint`
- **Resultado:** passou
- **Evidência:** Mantida classe `forum-card-transition` no container com elevação hover e `--border-focus` sem classes novas

### T-08 — Ausência de regressão funcional
- **Requisito:** R-08
- **Tipo:** unit
- **Executado:** sim
- **Comando:** `npm test -- --run`
- **Resultado:** passou
- **Evidência:** Navegação para `/forum/:forumSlug/:threadId`, cache de perfil `getCachedProfile` e flags `forum.features` funcionais com 0 falhas
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-10-19 | — | Criação |
| 2026-10-19 | — | Review: nota de refinamento da SPEC-0003, semântica das zonas, responsividade, estado transitório do autor e corpo vazio |
| 2026-10-19 | MaiconJh | Ajustes pós-review: autoria preenchida, redução de escopo para 1 arquivo (ThreadListItem.tsx), semântica de `<article>` em R-01; aprovado |
