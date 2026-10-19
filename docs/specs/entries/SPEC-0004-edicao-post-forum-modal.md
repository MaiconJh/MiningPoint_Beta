---
id: SPEC-0004
title: Edição de post no fórum com modal fixo, feedback responsável e transições suaves
status: rascunho
created: 2026-10-19
updated: 2026-10-19
author: MaiconJh
reviewer: MaiconJh
approved_at: 2026-10-19
implemented_at: null
commit: null
superseded_by: null
supersedes: null
last_audit: null
test_report: null
files:
  - src/components/forum/ThreadView.tsx
  - src/index.css
tags: [forum, edicao, modal, feedback, motion, acessibilidade]
---

# SPEC-0004 — Edição de post no fórum com modal fixo, feedback responsável e transições suaves

## Contexto

Hoje, o modal de edição de tópico em `ThreadView.tsx` é renderizado **dentro**
do card do post, com `position` herdado do container. O sintoma observado é
que o painel fica preso ao card, sofre corte por `overflow` e não bloqueia a
interação com o restante da página. O usuário relatou exatamente isso:
"o card que aparece sobre o site deveria ser fixo e não aparecer no card".

O `src/index.css` já define os tokens visuais (`--bg-surface`,
`--border-default`, `--brand-primary`, `--feedback-*`) e as microtransições
aprovadas (`dialog-transition`, `btn-save-transition`, `toast-transition`,
`forum-card-transition`, `forum-icon-hover`, `forum-screen-fade`). O modal
atual não as aplica de forma consistente e não cobre estados de erro,
carregamento ou concorrência.

A pesquisa em fóruns de referência mostrou que não existe padrão universal:
Discourse usa modal fora do container; Reddit usa inline; Flarum recusou
inline; BuddyPress usa híbrido. A decisão desta spec é **modal em overlay
fixo via portal** para o corpo do tópico, com as salvaguardas que a pesquisa
recomenda (janela de edição, sinalização de editado, confirmação de descarte,
histórico para staff).

## Objetivo

Garantir que o modal de edição de tópico seja renderizado em um overlay fixo
no nível do `<body>`, com feedback responsável (sucesso, erro, carregamento,
concorrência) e transições suaves consistentes com o design system, sem
alterar o comportamento de permissões existente.

## Requisitos

Progresso: `[0/12]`

- [ ] **R-01** — O modal de edição deve ser renderizado fora do card do post,
      em um overlay `position: fixed` no nível do `<body>` (equivalente a
      `ReactDOM.createPortal(..., document.body)`).
      **Critério:** com o modal aberto, inspecionar o DOM e confirmar que o
      elemento do modal é filho do `<body>`, não de `.thread-card`; o modal
      cobre a viewport inteira e não é cortado por `overflow` do card.

- [ ] **R-02** — O overlay deve usar o token `--bg-overlay` como fundo e
      `backdrop-filter: blur(2px)`, centralizando o modal com flexbox.
      **Critério:** o fundo da página fica escurecido e desfocado; o modal
      permanece centralizado em telas de 320px a 1920px.

- [ ] **R-03** — O modal deve aplicar a transição `dialog-transition`
      (200ms, `scale(.98) → 1`, `opacity 0 → 1`) na entrada e uma saída
      equivalente em `ease-in` (150–200ms).
      **Critério:** ao abrir, o modal anima de `scale(.98)` para `1`; ao
      fechar, anima de volta; com `prefers-reduced-motion: reduce`, não há
      animação.

- [ ] **R-04** — O botão "Salvar alterações" deve aplicar
      `btn-save-transition` (150ms, `opacity` + `border-color` +
      `background`) e exibir spinner com o texto "Salvando..." enquanto a
      operação assíncrona estiver em andamento.
      **Critério:** durante o salvamento, o botão fica desabilitado e mostra
      spinner; ao concluir, volta ao estado normal; em erro, volta ao estado
      normal e mostra feedback.

- [ ] **R-05** — O modal deve exibir um alerta inline âmbar (`--feedback-warning`)
      quando a janela de edição tiver expirado para usuário comum, e
      desabilitar o botão "Salvar alterações" nesse estado.
      **Critério:** com papel "usuário comum" e janela expirada, o alerta
      aparece e o botão fica `disabled`; com papel "admin", o alerta não
      aparece e o botão permanece habilitado.

- [ ] **R-06** — O modal deve exibir um alerta inline vermelho
      (`--feedback-error`) quando o post for removido por um moderador
      durante a edição, e bloquear o salvamento.
      **Critério:** com o modal aberto, ao remover o post, o alerta aparece
      e o botão "Salvar alterações" fica `disabled`; tentar salvar mostra
      toast de erro.

- [ ] **R-07** — O histórico de revisões deve ser visível apenas para admin,
      com autor, data/hora e resumo da alteração.
      **Critério:** com papel "admin", o bloco de revisões aparece; com papel
      "usuário comum", o bloco fica oculto.

- [ ] **R-08** — O modal deve incluir um campo opcional "Motivo da edição"
      com hint "Visível para moderadores no histórico de revisões".
      **Critério:** o campo existe, é opcional, e o hint aparece abaixo dele.

- [ ] **R-09** — Ao fechar o modal com alterações não salvas, o sistema deve
      pedir confirmação de descarte.
      **Critério:** alterar título ou corpo e clicar em "Cancelar" (ou
      pressionar `Esc`, ou clicar fora do modal) abre confirmação; confirmar
      descarta, cancelar mantém o modal aberto.

- [ ] **R-10** — O modal deve implementar focus trap: `Tab` e `Shift+Tab`
      ciclam apenas entre os elementos focáveis do modal; `Esc` fecha com
      confirmação; ao fechar, o foco retorna ao elemento que abriu o modal.
      **Critério:** com o modal aberto, `Tab` não escapa para a página;
      `Esc` fecha; o foco volta ao botão de edição.

- [ ] **R-11** — O toast de sucesso deve usar `toast-transition`
      (300ms, `translateY(80px) → 0`, `cubic-bezier(.2,.8,.2,1)`) e
      desaparecer após ~2,8s; toasts de erro/aviso usam a mesma transição
      com cor correspondente.
      **Critério:** ao salvar com sucesso, o toast anima de baixo para cima;
      com `prefers-reduced-motion: reduce`, aparece sem animação.

- [ ] **R-12** — Todos os estados de feedback devem ter `role="alert"` (ou
      live region equivalente) para leitores de tela, e a informação não
      deve ser comunicada apenas por cor.
      **Critério:** inspecionar o DOM dos alertas e toasts; cada um tem
      `role="alert"` e texto descritivo; a mensagem inclui o que aconteceu,
      por quê e o que fazer agora.

## Restrições

- **Não alterar o comportamento de permissões** existente em
  `canEditThread`/`canEditComment`. A spec cobre a apresentação e o
  comportamento do modal, não a lógica de autorização.
- **Reutilizar os tokens e as microtransições** já definidos em
  `src/index.css`. Não criar novas variáveis CSS, novas classes de transição
  ou novas durações/easings fora do catálogo aprovado.
- **Não introduzir bibliotecas novas** de UI ou de animação. Usar React
  puro e os utilitários já presentes no projeto.
- **Preservar a ordem de renderização** do código real (badges/título à
  esquerda, ações à direita com `align-self: flex-start`, depois barra de
  autoria, corpo, reações).
- **Nenhum emoji** no lugar de ícone lucide no modal ou nos toasts.
- **Respeitar `prefers-reduced-motion: reduce`** em todas as transições
  não essenciais.
- Código em inglês; corpo da spec em português (PROJECT_STANDARDS.md,
  seção Language).

## Fora de escopo

- Edição inline de título ou comentário (fica para spec futura).
- Histórico de revisões público (esta spec cobre apenas staff).
- Mudança na janela de edição configurável (o valor de 2h é o atual; a
  spec apenas representa o estado expirado).
- Alterações no backend/Firestore (`updateThread` já existe).
- Notificações por e-mail ou push sobre edição.
- Internacionalização (i18n) das mensagens.

## Testes

> Preenchido **após** a execução no AI Studio. Cole aqui, **verbatim**, o
> bloco retornado no formato definido em `_meta/AI-STUDIO-PROMPT.md`. Esta
> seção é **append-only**: não edite o conteúdo colado — se precisar
> corrigir, gere um novo relatório no AI Studio e substitua o bloco.

<!-- BEGIN AI STUDIO REPORT -->
<!-- Cole o bloco "## Testes da Spec — SPEC-0004 — <título>" abaixo -->
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-10-19 | — | Criação |
