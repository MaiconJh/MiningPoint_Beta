---
id: SPEC-0003
title: Redesign visual e de interação do fórum
status: aprovado
created: 2026-10-16
updated: 2026-10-17
author: MaiconJh
reviewer: MaiconJh
approved_at: 2026-10-17
implemented_at: 2026-10-17
commit: null
superseded_by: null
supersedes: null
last_audit: null
test_report: null
files:
  - src/index.css
  - src/components/forum/CommentForm.tsx
  - src/components/forum/ForumIndex.tsx
  - src/components/forum/ForumView.tsx
  - src/components/forum/NewThreadForm.tsx
  - src/components/forum/ThreadListItem.tsx
  - src/components/forum/ThreadView.tsx
  - src/lib/forumReactions.ts
tags: []
---

# SPEC-0003 — Redesign visual e de interação do fórum

## Contexto

O fórum foi entregue funcional mas visualmente plano. Home, categoria, tópico e comentário usam a mesma superfície e o mesmo peso; nada sinaliza o que é primário em cada tela. A autoria dos posts aparece como um rótulo genérico, sem avatar, nick ou cargo. Nenhuma categoria tem cor ou ícone próprio. Não há micro-transições além das herdadas do framework.

O resto do app já tem linguagem visual consolidada — superfície, raio, tipografia, tema. O fórum não a usa. A referência visual para o resultado esperado é o mock interativo da SPEC-0003 (docs/designs/SPEC-0003-mock.html): ele usa os mesmos tokens do app e mostra como o fórum se parece quando herda essa linguagem.

## Objetivo

Dar ao fórum a identidade visual e a densidade de interação do mock — hierarquia em camadas, autoria visível e micro-transições — sem introduzir linguagem visual nova. O fórum passa a se parecer com o resto do app; o que muda é a composição, não o vocabulário visual.

Referência visual: docs/designs/SPEC-0003-mock.html.

## Requisitos

Progresso: [0/7]

- [ ] **R-01** — Escala tipográfica densa.
      **Critério:** a tela usa quatro pesos de texto (meta, corpo, título, página), uma altura de linha própria para cada e um monoespaçado para números. Cada elemento escolhe um peso e só um; não há tamanhos intermediários.

- [ ] **R-02** — ForumIndex em camadas.
      **Critério:** a home se organiza em quatro zonas visíveis: barra horizontal de categorias acima do conteúdo, grid de cards de categoria, feed de últimos tópicos abaixo do grid e sidebar contextual à direita (stats da comunidade, ranking da semana, membros ativos). A sidebar some em telas estreitas; o grid vira coluna única em telas muito estreitas.

- [ ] **R-03** — Cards de categoria com identidade própria.
      **Critério:** cada card tem uma capa com campo de cor próprio, ícone à esquerda e pílula de foco à direita; abaixo, título e descrição; em seguida, lista de subdivisões com contagem; por fim, rodapé com volume (tópicos, respostas) e acesso. O título é o único elemento primário; todo o resto é meta. A capa e o ícone reagem ao hover.

- [ ] **R-04** — Thread list com autoria visível.
      **Critério:** cada item de lista de tópicos mostra avatar colorido pelo grupo do autor, nick, meta (data, tempo relativo, última resposta) e badges (fixado, trancado, resolvido, categoria). Contagens e tempos usam o monoespaçado. Nenhum item recorre a rótulo genérico de autor.

- [ ] **R-05** — ThreadView com anatomia completa.
      **Critério:** a tela de tópico tem cabeçalho de autoria (avatar, nick, cargo, data, views), corpo com peso de leitura, reações com contagem e picker ancorado, banner de solução quando o tópico está resolvido, respostas com a mesma anatomia de autoria, respostas aninhadas com barra lateral de indentação, composer com toolbar de ícones e sidebar própria (resumo do tópico, participantes).

- [ ] **R-06** — Micro-transições consistentes.
      **Critério:** hover em cards eleva o card e desloca a borda para o tom de foco; hover em ícone de capa aplica leve escala e rotação; a troca entre as três telas usa fade com deslocamento sutil. Com prefers-reduced-motion: reduce, todas as animações e transições são desativadas.

- [ ] **R-07** — Consistência com o resto do app.
      **Critério:** o fórum usa a mesma superfície, os mesmos raios, os mesmos tokens de cor e tipografia do resto do app; responde ao tema claro/escuro sem flash de cor. O fórum não introduz linguagem visual nova — o que ele acrescenta é composição.

## Restrições

- Não alterar comportamento funcional: rotas, hooks, permissões e escrita no Firestore permanecem como estão.
- Não alterar contratos de dados: tipos e modelo de dados do fórum não mudam.

## Fora de escopo

- Novas funcionalidades de fórum (busca global, notificações, votação, bookmarking).
- Alterações no backend (Firestore rules, Cloud Functions).
- Redesign das páginas fora do fórum (Home, Sobre, Eventos, Membros, Loja, Perfil).
- Alterações no painel administrativo do fórum (/admin/forum).
- Novos assets gráficos (logos, ilustrações, fotografias de capa).

## Testes

> Preenchido **após** a execução no AI Studio. Cole aqui, **verbatim**, o
> bloco retornado no formato definido em _meta/AI-STUDIO-PROMPT.md. Esta
> seção é **append-only**: não edite o conteúdo colado — se precisar
> corrigir, gere um novo relatório no AI Studio e substitua o bloco.

<!-- BEGIN AI STUDIO REPORT -->
## Testes da Spec — SPEC-0003 — Redesign visual e de interação do fórum

### T-01 — Escala tipográfica densa sem tamanhos hardcoded

- **Requisito:** R-01
- **Tipo:** lint
- **Executado:** sim
- **Comando:** grep -rnE "text-(xs|sm|base|lg|xl|2xl|3xl|4xl|\[[0-9]+px\])" src/components/forum/
- **Resultado:** passou
- **Evidência:** `src/index.css` define as 4 classes de peso (`.forum-meta`, `.forum-body`, `.forum-title`, `.forum-page`) e monoespaçado (`.forum-num`). O comando de busca retornou zero ocorrências de tamanhos de fonte utilitários ou hardcoded em todos os componentes de `src/components/forum/`.

### T-02 — Organização em camadas de ForumIndex

- **Requisito:** R-02
- **Tipo:** build
- **Executado:** sim
- **Comando:** npm run check
- **Resultado:** passou
- **Evidência:** `src/components/forum/ForumIndex.tsx` estrutura a tela nas quatro zonas especificadas: barra horizontal de categorias com filtros de foco, grid responsivo de cards (`grid-cols-1 sm:grid-cols-2`), feed de tópicos recentes e aside contextual à direita (`hidden lg:block lg:w-80`) com estatísticas, ranking da semana e membros ativos.

### T-03 — Identidade própria e interatividade nos cards de categoria

- **Requisito:** R-03
- **Tipo:** build
- **Executado:** sim
- **Comando:** npm run check
- **Resultado:** passou
- **Evidência:** `src/components/forum/ForumIndex.tsx` implementa cada card com capa temática, ícone à esquerda com classe `.forum-icon-hover`, pílula de foco à direita, título primário em `.forum-title`, descrição em `.forum-meta`, lista de subdivisões com contagem e rodapé com contadores em `.forum-num` e botão de acesso ao fórum.

### T-04 — Thread list com autoria visível e sem rótulo genérico

- **Requisito:** R-04
- **Tipo:** build
- **Executado:** sim
- **Comando:** npm run check
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadListItem.tsx` renderiza avatar com anel colorido pela cor do grupo primário do autor, `@handle` ou nick real, data formatada, tempo relativo com `.forum-num`, badges de estado (fixado, trancado, resolvido, subdivisão) e contador de comentários em monoespaçado, sem uso de rótulos genéricos.

### T-05 — ThreadView com anatomia completa, reações Lucide e sidebar própria

- **Requisito:** R-05
- **Tipo:** build
- **Executado:** sim
- **Comando:** npm run check
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx` possui cabeçalho de autoria completo com avatar colorido pelo grupo, nick, cargo e métricas em `.forum-num`; reações ancoradas utilizando exclusivamente ícones da biblioteca `lucide-react` (`REACTION_ICONS`); banner de solução; respostas aninhadas com recuo e borda lateral em `.border-l-2`; toolbar de formatação no composer em `CommentForm.tsx` e sidebar com resumo e participantes.

### T-06 — Micro-transições e suporte a prefers-reduced-motion

- **Requisito:** R-06
- **Tipo:** lint
- **Executado:** sim
- **Comando:** npm run check
- **Resultado:** passou
- **Evidência:** `src/index.css` define `.forum-card-transition`, `.forum-icon-hover` e `.forum-screen-fade`. A seção `@media (prefers-reduced-motion: reduce)` sobrescreve todas as 3 classes com `animation: none !important; transition: none !important; transform: none !important;`.

### T-07 — Consistência de tokens de tema e ausência de utilitários de cor Tailwind

- **Requisito:** R-07
- **Tipo:** lint
- **Executado:** sim
- **Comando:** npm run check
- **Resultado:** passou
- **Evidência:** Validação do ESLint com regras locais de design tokens aprovada com zero erros. Todas as superfícies, bordas e textos utilizam CSS custom properties do tema (`var(--bg-*)`, `var(--text-*)`, `var(--border-*)`, `var(--brand-*)`, `var(--feedback-*)`) e respeitam o chaveamento claro/escuro.
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-10-16 | — | Criação |
| 2026-10-17 | — | Correção editorial: requisitos reescritos como intenção, sem fixar valores de implementação |
| 2026-10-17 | — | Removido R-02 (ícones vs. emojis) por ser redundante com o padrão de UI do projeto; requisitos renumerados (7 no total) |
| 2026-10-17 | — | Contexto, objetivo e requisitos reescritos para carregar a identidade visual do mock sem redefinir linguagem do app |