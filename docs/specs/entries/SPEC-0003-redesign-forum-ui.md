---
id: SPEC-0003
title: Redesign visual e de interação do fórum
status: aprovado
created: 2026-10-16
updated: 2026-10-17
author: null
reviewer: null
approved_at: null
implemented_at: null
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
<!-- Cole o bloco "## Testes da Spec — SPEC-0003 — <título>" abaixo -->
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-10-16 | — | Criação |
| 2026-10-17 | — | Correção editorial: requisitos reescritos como intenção, sem fixar valores de implementação |
| 2026-10-17 | — | Removido R-02 (ícones vs. emojis) por ser redundante com o padrão de UI do projeto; requisitos renumerados (7 no total) |
| 2026-10-17 | — | Contexto, objetivo e requisitos reescritos para carregar a identidade visual do mock sem redefinir linguagem do app |