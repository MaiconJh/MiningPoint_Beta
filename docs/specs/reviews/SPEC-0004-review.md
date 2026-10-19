---
id: SPEC-0004
spec: docs/specs/entries/SPEC-0004-edicao-post-forum-modal.md
verdict: REPROVADO
status_at_review: rascunho
reviewed_at: 2026-10-19T04:28:00Z
reviewer_version: 1.1.0
axes_executed: [A, B, C, D, E]
blocking_findings: 1
non_blocking_findings: 4
---

# Parecer de Review — SPEC-0004 — Edição de post no fórum com modal fixo, feedback responsável e transições suaves

## 1. Resumo
- **Veredito:** REPROVADO
- **Spec:** SPEC-0004 — Edição de post no fórum com modal fixo, feedback responsável e transições suaves
- **Status atual:** rascunho
- **Eixos executados:** A, B, C, D, E
- **Achados bloqueantes:** 1
- **Achados não-bloqueantes:** 4
- **Limitação principal:** Auditoria puramente documental e estática da coerência da spec frente ao codebase atual; nenhum código em execução ou banco Firestore real foi alterado durante a análise.

## 2. Eixo A — Estrutura
- **Estado:** NÃO CONFORME
- **Achados:**
  - [A-01] Frontmatter com inconsistência de ciclo de vida — Evidência: linhas 4 e 8-9 de `SPEC-0004-edicao-post-forum-modal.md` indicam `status: rascunho` conjuntamente com `reviewer: MaiconJh` e `approved_at: 2026-10-19`. — Regra: `docs/specs/_meta/README.md` §Estados e §Como submeter para leitura (em estado `rascunho`, `reviewer` e `approved_at` devem permanecer `null`).
  - [A-02] Spec não catalogada no índice central — Evidência: `docs/specs/INDEX.md` contém apenas SPEC-0001 a SPEC-0003. — Regra: `docs/specs/_meta/README.md` §Como criar uma spec ("4. Atualize INDEX.md com a nova linha").

## 3. Eixo B — Escopo
- **Estado:** NÃO CONFORME
- **Achados:**
  - [B-01] Inclusão redundante de arquivo protegido / global — Evidência: `files:` lista `src/index.css`, porém a spec em §Restrições (linhas 138-140) proíbe expressamente criar novas classes, variáveis CSS ou durações, e as classes `.dialog-transition`, `.btn-save-transition` e `.toast-transition` já existem prontas em `src/index.css`. — Regra: `AGENTS.md` §Scope ("Change only the files named in the request or in the spec's files: frontmatter").
  - [B-02] Omissão de arquivos necessários para persistência de revisões — Evidência: R-07 e R-08 exigem salvar motivo e exibir histórico de revisões, mas `src/types/forum.ts` e `src/lib/forumThreads.ts` não constam em `files:`. — Regra: `AGENTS.md` §Scope.

## 4. Eixo C — Normas duras
- **Estado:** NÃO CONFORME
- **Checks executados:** 15 de 15
- **Achados:**
  | ID | Check | Estado | Evidência | Regra |
  |---|---|---|---|---|
  | C-01 | Escopo >5 arquivos | CONFORME | `files:` lista 2 arquivos (`ThreadView.tsx`, `index.css`) | AGENTS.md §Scope |
  | C-02 | Arquivos não nomeados | VIOLADO | R-07 (histórico de revisões) e R-08 (motivo da edição) exigem dados persistidos, mas `src/types/forum.ts` e `src/lib/forumThreads.ts` não estão no `files:`, e a linha 158 coloca backend/Firestore fora de escopo | AGENTS.md §Scope / checks.md C-02 |
  | C-03 | Termos proibidos | CONFORME | Nenhum termo proibido no corpo da spec | AGENTS.md §Non-negotiable |
  | C-04 | Strings em inglês | CONFORME | Strings visíveis especificadas em português ("Salvando...", "Motivo da edição", etc.) | PROJECT_STANDARDS.md §Language |
  | C-05 | Utilitário de cor Tailwind | CONFORME | Uso exclusivo de tokens `--bg-overlay`, `--feedback-*`, etc. | PROJECT_STANDARDS.md §Styling |
  | C-06 | Cor literal sem exceção | CONFORME | Nenhuma cor literal proposta | PROJECT_STANDARDS.md §Styling |
  | C-07 | Auth não-Google | NÃO APLICÁVEL | Não altera autenticação | PROJECT_STANDARDS.md §Firebase |
  | C-08 | Coleção sem regra | NÃO APLICÁVEL | Não cria coleções novas | PROJECT_STANDARDS.md §Firebase |
  | C-09 | Nomenclatura de schema | NÃO APLICÁVEL | Não cria novo schema Firestore | PROJECT_STANDARDS.md §Firebase |
  | C-10 | Arquivo protegido | CONFORME | Não modifica regras nem tokens de cor de plataforma | AGENTS.md §Non-negotiable |
  | C-11 | Segredo no cliente | NÃO APLICÁVEL | Não manipula segredos ou chaves | AGENTS.md §Non-negotiable |
  | C-12 | Derivação editada à mão | CONFORME | Não edita `isStaff` ou `effectivePermissions` manualmente | PROJECT_STANDARDS.md §Derivation |
  | C-13 | SVG sem sanitização | NÃO APLICÁVEL | Não envolve novos uploads ou SVGs | PROJECT_STANDARDS.md §Badges |
  | C-14 | Chip por variante | NÃO APLICÁVEL | Não altera componentes de chip | PROJECT_STANDARDS.md §Chip |
  | C-15 | Motion fora de superfície | CONFORME | Microtransições aplicadas em modal/toasts com suporte a `prefers-reduced-motion` | PROJECT_STANDARDS.md §Effect Stack |

## 5. Eixo D — Coerência com codebase
- **Estado:** NÃO CONFORME
- **Arquivos lidos:** `src/components/forum/ThreadView.tsx`, `src/types/forum.ts`, `src/lib/forumThreads.ts`, `src/lib/forumPermissions.ts`, `src/index.css`
- **Achados:**
  - [D-01] Premissa inverídica sobre janela de edição de 2h — Evidência: linha 156-157 da spec afirma "o valor de 2h é o atual; a spec apenas representa o estado expirado". No entanto, a função `canEditThread` em `src/lib/forumPermissions.ts` checa apenas `thread.authorId === user.uid` e `!thread.isRemoved` (sem qualquer verificação temporal de 2 horas).
  - [D-02] Incompatibilidade com modelo de dados real — Evidência: `ForumThread` em `src/types/forum.ts` não possui campos de revisões (`editHistory` ou similar), e `updateThread` em `src/lib/forumThreads.ts` atualiza exclusivamente `title`, `body` e `categoryId`. A implementação de R-07/R-08 sob a premissa de "Alterações no backend/Firestore fora de escopo" forçaria o desenvolvedor a inventar dados fictícios ou mockados, violando a regra "Real data only" do `PROJECT_STANDARDS.md`.

## 6. Eixo E — Riscos e lacunas
- **Estado:** NÃO CONFORME
- **Achados:**
  - [E-01] Lacuna de mecanismo reativo para R-06 — A spec exige que o modal exiba alerta caso o post seja removido por moderador durante a edição, mas não define se a detecção será via snapshot listener em tempo real no documento `threads/{id}` ou via interceptação do erro ao tentar salvar (`updateThread`).
  - [E-02] Risco de acoplamento entre portal e acessibilidade — R-01 prescreve `ReactDOM.createPortal(..., document.body)` e R-10 prescreve focus trap e retorno de foco. A spec não detalha o gerenciamento de desmontagem caso o usuário navegue ou o componente seja desmontado externamente enquanto o portal está aberto.

## 7. Próximos passos
1. **Decidir a fronteira de R-07 e R-08:**
   - Opção recomendada: Mover R-07 (histórico de revisões) e o armazenamento de R-08 (motivo de edição) para "Fora de escopo", limitando esta SPEC-0004 estritamente ao comportamento visual e acessibilidade do modal (Portal, focus trap, feedback de erro/sucesso de rede, microtransições).
   - Alternativa: Expandir o escopo incluindo `src/types/forum.ts` e `src/lib/forumThreads.ts` no `files:` e especificando como as revisões serão modeladas e gravadas no Firestore sem mocks.
2. **Remover `src/index.css` de `files:`:** Como as classes de transição já existem e não haverá criação de novos tokens, o escopo deve conter apenas `src/components/forum/ThreadView.tsx`.
3. **Corrigir a premissa de janela de edição (R-05):** Esclarecer na spec como a janela de 2h deve ser calculada (ex.: calculada no client via `thread.createdAt` + 2 horas para usuários não-moderadores), ou removê-la caso a regra de negócio ainda não esteja padronizada em `forumPermissions.ts`.
4. **Sanear o frontmatter e catálogo:** Resetar `reviewer: null` e `approved_at: null` enquanto o status for `rascunho`, e registrar a spec no `docs/specs/INDEX.md`.

**Limite do parecer:** Esta análise atesta a conformidade estrutural e arquitetural da spec SPEC-0004 antes de sua implementação no código-fonte. Não avalia a performance em tempo de execução nem o funcionamento de endpoints externos.
