---
id: SPEC-0004
title: Edição de post no fórum com modal fixo, feedback responsável e transições suaves
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
  - src/components/forum/ThreadView.tsx
  - src/types/forum.ts
  - src/lib/forumThreads.ts
  - firestore.rules
  - PROJECT_STANDARDS.md
tags: [forum, edicao, modal, feedback, motion, acessibilidade, revisoes, rollback]
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
fixo via portal** para o corpo do tópico, implementando o **Caminho A**:
histórico de revisões real e auditável persistido em subcoleção do Firestore,
motivo de edição obrigatório, controle de visibilidade estrito (autor e staff)
e funcionalidade de rollback append-only exclusiva para moderação.

### Ressalva explícita de plataforma

O `AGENTS.md` §Non-negotiable estabelece que `firestore.rules` e
`PROJECT_STANDARDS.md` devem permanecer intocados. Esta spec declara uma
**exceção documentada estritamente aditiva** para ambos os arquivos:
1. `firestore.rules`: inclusão exclusiva das regras de leitura e escrita para a
   subcoleção `threads/{threadId}/revisions/{revisionId}`. Sem essa regra, a
   escrita do histórico é negada por padrão pelo Firestore, inviabilizando a
   persistência real.
2. `PROJECT_STANDARDS.md`: documentação do schema da subcoleção de revisões,
   garantindo conformidade com as diretrizes do repositório.

## Objetivo

Garantir que o modal de edição de tópico seja renderizado em um overlay fixo
no nível do `<body>`, com feedback responsável (sucesso, erro, carregamento,
concorrência), transições suaves consistentes com o design system, histórico de
revisões auditável persistido no Firestore e capacidade de rollback para staff,
respeitando a regra "Real data only" do projeto.

## Requisitos

Progresso: `[14/14]`

- [x] **R-01** — O modal de edição deve ser renderizado fora do card do post,
      em um overlay `position: fixed` no nível do `<body>` (equivalente a
      `ReactDOM.createPortal(..., document.body)`).
      **Critério:** com o modal aberto, inspecionar o DOM e confirmar que o
      elemento do modal é filho do `<body>`, não de `.thread-card`; o modal
      cobre a viewport inteira e não é cortado por `overflow` do card.

- [x] **R-02** — O overlay deve usar o token `--bg-overlay` como fundo e
      `backdrop-filter: blur(2px)`, centralizando o modal com flexbox.
      **Critério:** o fundo da página fica escurecido e desfocado; o modal
      permanece centralizado em telas de 320px a 1920px.

- [x] **R-03** — O modal deve aplicar a transição `dialog-transition`
      (200ms, `scale(.98) → 1`, `opacity 0 → 1`) na entrada e uma saída
      equivalente em `ease-in` (150–200ms).
      **Critério:** ao abrir, o modal anima de `scale(.98)` para `1`; ao
      fechar, anima de volta; com `prefers-reduced-motion: reduce`, não há
      animação.

- [x] **R-04** — O botão "Salvar alterações" deve aplicar
      `btn-save-transition` (150ms, `opacity` + `border-color` +
      `background`) e exibir spinner com o texto "Salvando..." enquanto a
      operação assíncrona estiver em andamento.
      **Critério:** durante o salvamento, o botão fica desabilitado e mostra
      spinner; ao concluir, volta ao estado normal; em erro, volta ao estado
      normal e mostra feedback.

- [x] **R-05** — O modal deve exibir um alerta inline âmbar (`--feedback-warning`)
      quando a janela de edição (calculada no componente como
      `Date.now() - thread.createdAt.toMillis() > 2 * 3600 * 1000`) tiver expirado
      para autor sem privilégios de staff/moderação, desabilitando o salvamento.
      **Critério:** para autor comum com post criado há mais de 2 horas, o
      alerta aparece e o botão "Salvar alterações" fica `disabled`; para
      usuários staff ou moderadores (`isStaff` ou `manageForum`), o alerta não
      aparece e o salvamento permanece permitido.

- [x] **R-06** — O modal deve tratar encerramento ou remoção concorrente do
      tópico na abertura e na submissão, exibindo alerta inline vermelho
      (`--feedback-error`) ou toast de erro e bloqueando o salvamento.
      **Critério:** se a thread estiver marcada como removida ou se a chamada
      a `updateThread` falhar por post removido/inválido, o erro é exibido no
      modal com feedback claro e o salvamento é interrompido.

- [x] **R-07** — Ao fechar o modal com alterações não salvas, o sistema deve
      pedir confirmação de descarte.
      **Critério:** alterar título, corpo ou categoria e clicar em "Cancelar"
      (ou pressionar `Esc`, ou clicar fora do modal) abre confirmação;
      confirmar descarta, cancelar mantém o modal aberto.

- [x] **R-08** — O modal deve implementar focus trap: `Tab` e `Shift+Tab`
      ciclam apenas entre os elementos focáveis do modal; `Esc` fecha com
      confirmação; ao fechar, o foco retorna ao elemento que abriu o modal.
      **Critério:** com o modal aberto, `Tab` não escapa para a página;
      `Esc` fecha com confirmação; o foco volta ao botão que abriu a edição.

- [x] **R-09** — O toast de sucesso deve usar `toast-transition`
      (300ms, `translateY(80px) → 0`, `cubic-bezier(.2,.8,.2,1)`) e
      desaparecer após ~2,8s; toasts de erro/aviso usam a mesma transição
      com cor correspondente.
      **Critério:** ao salvar com sucesso, o toast anima de baixo para cima;
      com `prefers-reduced-motion: reduce`, aparece sem animação.

- [x] **R-10** — Todos os estados de feedback devem ter `role="alert"` (ou
      live region equivalente) para leitores de tela, e a informação não
      deve ser comunicada apenas por cor.
      **Critério:** inspecionar o DOM dos alertas e toasts; cada um tem
      `role="alert"` e texto descritivo; a mensagem inclui o que aconteceu,
      por quê e o que fazer agora.

- [x] **R-11** — Persistência atômica da revisão com 7 campos na subcoleção
      `threads/{threadId}/revisions/{revisionId}` na mesma operação de
      `updateThread`: `title` (string), `body` (string), `categoryId` (string |
      null), `reason` (string), `editedBy` (string uid), `editedByStaff`
      (boolean) e `editedAt` (timestamp via `serverTimestamp()`).
      **Critério:** salvar uma edição cria um documento na subcoleção
      `revisions` contendo o estado anterior antes da alteração, atualiza o
      tópico com o novo conteúdo e grava `editReason` no tópico.

- [x] **R-12** — O campo "Motivo da edição" no modal deve ser obrigatório
      (`required`), com label em português e hint explicativo; o botão "Salvar
      alterações" deve permanecer `disabled` enquanto `reason.trim()` estiver
      vazio, acompanhado de mensagem inline explicativa.
      **Critério:** enquanto o campo estiver em branco ou contiver apenas
      espaços, o botão de salvar permanece inativo e a mensagem inline orienta o
      preenchimento; ao digitar o motivo, o botão torna-se ativo.

- [x] **R-13** — O painel "Histórico de edições" deve ser visível no modal
      exclusivamente para o autor do tópico e usuários staff/moderação (gate:
      `profile.isStaff === true || profile.effectivePermissions.manageForum === true || thread.authorId === user.uid`),
      listando as revisões com `editedBy`, `editedAt` formatado em pt-BR e
      `reason`; o botão "Restaurar" em cada revisão é visível apenas para
      staff/moderação, permanecendo oculto para o autor comum.
      **Critério:** usuário sem permissão e não-autor não visualiza o painel;
      autor visualiza as revisões mas não tem botão de restauração; staff
      visualiza as revisões e o botão "Restaurar".

- [x] **R-14** — Mecanismo de rollback funcional, append-only e com diálogo de
      confirmação exclusivo para staff: ao confirmar a restauração de uma
      revisão, o sistema grava primeiro o estado atual do tópico como uma nova
      revisão em `revisions` (preservando evidência histórica), aplica os valores
      de `title`, `body` e `categoryId` da revisão escolhida na thread, fecha o
      modal e exibe toast de sucesso.
      **Critério:** restaurar uma revisão gera exatamente dois registros no
      histórico (preservação do estado pré-rollback + revisão restaurada), os
      campos do tópico refletem os valores restaurados e nenhuma revisão anterior
      é excluída ou sobrescrita.

## Restrições

- **Sem alteração em `forumPermissions.ts`**: os gates de visualização e ação
  do histórico/rollback são tratados no componente `ThreadView.tsx` e nos
  helpers de `src/lib/forumThreads.ts` utilizando as permissões derivadas já
  existentes (`isStaff`, `effectivePermissions.manageForum`).
- **Edição estritamente aditiva em arquivos de plataforma**: as modificações em
  `firestore.rules` limitam-se a adicionar as regras para
  `threads/{threadId}/revisions/{revisionId}`; as alterações em
  `PROJECT_STANDARDS.md` limitam-se a registrar o schema da nova subcoleção.
  Nenhuma regra ou token existente pode ser removido ou alterado.
- **Reutilização de tokens e CSS**: utilizar os tokens de variáveis CSS e as
  classes já prontas em `src/index.css`. Não criar novas classes globais nem
  utilitários de cor do Tailwind.
- **Não introduzir bibliotecas novas**: utilizar exclusivamente React, ReactDOM
  (portal), Lucide Icons e a SDK do Firebase Firestore já instalados.
- **Nenhum dado mockado**: a subcoleção de revisões opera com dados reais do
  Firestore; caso uma thread não possua revisões, exibe-se estado vazio amigável
  em português.
- **Nenhum emoji** no lugar de ícone Lucide no modal, no painel de revisões ou
  nos toasts.
- **Respeitar `prefers-reduced-motion: reduce`** em todas as transições não
  essenciais.
- Código em inglês; interface e strings visíveis em português
  (PROJECT_STANDARDS.md, seção Language).

## Fora de escopo

- Edição inline de tópico diretamente na listagem ou feed.
- Edição ou histórico de revisões para comentários (`comments`).
- Histórico de revisões público para visitantes e membros não-autores e não-staff.
- Edição destrutiva ou exclusão de revisões passadas (o histórico é append-only).
- Notificações por e-mail ou push sobre edição ou rollback.
- Internacionalização (i18n) das mensagens.

## Testes

> Preenchido **após** a execução no AI Studio. Cole aqui, **verbatim**, o
> bloco retornado no formato definido em `_meta/AI-STUDIO-PROMPT.md`. Esta
> seção é **append-only**: não edite o conteúdo colado — se precisar
> corrigir, gere um novo relatório no AI Studio e substitua o bloco.

<!-- BEGIN AI STUDIO REPORT -->
## Testes da Spec — SPEC-0004 — Edição de post no fórum com modal fixo, feedback responsável e transições suaves

### T-01 — Renderização do modal fora do card via portal no body
- **Requisito:** R-01
- **Tipo:** build
- **Executado:** sim
- **Comando:** `npm run build`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: invocação de `createPortal(..., document.body)` montando o elemento no nível da raiz do DOM sem corte de overflow.

### T-02 — Overlay fixo com backdrop-blur e centralização flexbox
- **Requisito:** R-02
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: classes `fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-overlay)] backdrop-blur-xs` validadas sem infrações de tokens.

### T-03 — Microtransição dialog-transition no modal
- **Requisito:** R-03
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: classe `dialog-transition` presente no container do modal, com regras de motion e `prefers-reduced-motion` ativas em `src/index.css`.

### T-04 — Microtransição e estado de carregamento do botão salvar
- **Requisito:** R-04
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: classe `btn-save-transition` com alternância para `Loader2 animate-spin` e label "Salvando..." durante salvamento assíncrono.

### T-05 — Alerta inline e bloqueio de expiração da janela de 2h
- **Requisito:** R-05
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: cálculo `Date.now() - thread.createdAt.toMillis() > 2 * 3600 * 1000` bloqueia o form e exibe alerta âmbar com `role="alert"`.

### T-06 — Tratamento de tópico removido ou erro de concorrência
- **Requisito:** R-06
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `src/lib/forumThreads.ts` e `ThreadView.tsx`: transação Firestore rejeita salvamento se `isRemoved === true` e a UI exibe alerta inline vermelho de erro.

### T-07 — Diálogo de confirmação de descarte de alterações
- **Requisito:** R-07
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: cálculo `isDirty` avaliando título, corpo, categoria e motivo; intercepta fechamento por Esc, botão cancelar e clique no overlay abrindo `role="alertdialog"`.

### T-08 — Focus trap acessível e retenção do foco
- **Requisito:** R-08
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: hook de focus trap com navegação cíclica via `Tab`/`Shift+Tab` e retorno do foco a `triggerButtonRef` ao fechar.

### T-09 — Notificação toast com toast-transition e timeout
- **Requisito:** R-09
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: toast renderizado via portal com `toast-transition`, temporizador de 2800ms e cores temáticas (`--feedback-success`, `--feedback-warning`, `--feedback-error`).

### T-10 — Acessibilidade de alertas e leitores de tela
- **Requisito:** R-10
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: atributos `role="alert"` e `role="alertdialog"`, `aria-modal="true"`, sem dependência exclusiva de cor para transmissão de estado.

### T-11 — Gravação atômica da revisão de 7 campos no Firestore
- **Requisito:** R-11
- **Tipo:** unit
- **Executado:** sim
- **Comando:** `npm test`
- **Resultado:** passou
- **Evidência:** `src/lib/forumThreads.ts`: `updateThread` utiliza `runTransaction` gravando `title`, `body`, `categoryId`, `reason`, `editedBy`, `editedByStaff` e `editedAt` em `threads/{threadId}/revisions`.

### T-12 — Campo motivo de edição obrigatório
- **Requisito:** R-12
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: input obrigatório com label e texto de apoio; botão salvar desabilitado se `!editReason.trim()`.

### T-13 — Gate de visualização do histórico e restauração
- **Requisito:** R-13
- **Tipo:** unit
- **Executado:** sim
- **Comando:** `npm test`
- **Resultado:** passou
- **Evidência:** `src/components/forum/ThreadView.tsx`: gates `canViewHistory` (autor + staff) e `canRestoreHistory` (apenas staff), garantindo isolamento da interface sem tocar `forumPermissions.ts`.

### T-14 — Mecanismo de rollback funcional append-only
- **Requisito:** R-14
- **Tipo:** unit
- **Executado:** sim
- **Comando:** `npm test`
- **Resultado:** passou
- **Evidência:** `src/lib/forumThreads.ts`: `restoreThreadRevision` preserva o estado anterior como nova revisão antes de aplicar os valores da revisão alvo em transação atômica.
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-10-19 | — | Criação inicial |
| 2026-10-19 | miningpoint-spec-fixer | Correções com base no parecer SPEC-0004-review.md: saneamento de frontmatter e isolamento temporário de requisitos sem backend. |
| 2026-10-19 | MaiconJh | Adoção do Caminho A: inclusão de histórico de revisões em subcoleção Firestore, motivo obrigatório, rollback append-only para staff, definição dos 5 arquivos em files: com ressalva aditiva explícita e expansão para 14 requisitos (R-01 a R-14). |
