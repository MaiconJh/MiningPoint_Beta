---
id: SPEC-0004
spec: docs/specs/entries/SPEC-0004-edicao-post-forum-modal.md
verdict: APROVADO
status_at_review: em-leitura
reviewed_at: 2026-10-19T05:15:00Z
reviewer_version: 1.1.0
axes_executed: [A, B, C, D, E]
blocking_findings: 0
non_blocking_findings: 0
---

# Parecer de Review — SPEC-0004 — Edição de post no fórum com modal fixo, feedback responsável e transições suaves

## 1. Resumo
- **Veredito:** APROVADO
- **Spec:** SPEC-0004 — Edição de post no fórum com modal fixo, feedback responsável e transições suaves
- **Status atual:** em-leitura
- **Eixos executados:** A, B, C, D, E
- **Achados bloqueantes:** 0
- **Achados não-bloqueantes:** 0
- **Limitação principal:** Nenhuma relevante; a spec está plenamente detalhada com os 14 requisitos do Caminho A, escopo fechado de 5 arquivos e ressalva aditiva explícita.

## 2. Eixo A — Estrutura
- **Estado:** CONFORME
- **Achados:** Nenhum. O frontmatter está canônico e em conformidade com o ciclo de vida (`status: em-leitura`, `reviewer: null`, `approved_at: null`), a seção `## Requisitos` enumera R-01 a R-14 com critérios de aceitação observáveis, a seção `## Testes` permanece reservada com marcadores vazios e o documento está devidamente catalogado em `docs/specs/INDEX.md`.

## 3. Eixo B — Escopo
- **Estado:** CONFORME
- **Achados:** Nenhum. O `files:` lista exatamente 5 arquivos (`ThreadView.tsx`, `types/forum.ts`, `lib/forumThreads.ts`, `firestore.rules` e `PROJECT_STANDARDS.md`), atendendo ao teto máximo de 5 arquivos. A ressalva explícita de edição estritamente aditiva para os arquivos de plataforma está claramente documentada em seção dedicada no Contexto e nas Restrições. A seção "Fora de escopo" delimita explicitamente fronteiras essenciais.

## 4. Eixo C — Normas duras
- **Estado:** CONFORME
- **Checks executados:** 15 de 15
- **Achados:**
  | ID | Check | Estado | Evidência | Regra |
  |---|---|---|---|---|
  | C-01 | Escopo >5 arquivos | CONFORME | `files:` lista exatamente 5 arquivos | AGENTS.md §Scope |
  | C-02 | Arquivos não nomeados | CONFORME | Todos os 5 arquivos de suporte a tipos, lib, regras e schema estão nomeados | AGENTS.md §Scope |
  | C-03 | Termos proibidos | CONFORME | Nenhum termo proibido no corpo da spec | AGENTS.md §Non-negotiable |
  | C-04 | Strings em inglês | CONFORME | Todas as mensagens e labels visíveis definidas em português | PROJECT_STANDARDS.md §Language |
  | C-05 | Utilitário de cor Tailwind | CONFORME | Utiliza exclusivamente tokens (`--bg-overlay`, `--feedback-*`, etc.) | PROJECT_STANDARDS.md §Styling |
  | C-06 | Cor literal sem exceção | CONFORME | Nenhuma cor literal proposta | PROJECT_STANDARDS.md §Styling |
  | C-07 | Auth não-Google | NÃO APLICÁVEL | Não altera provedores de autenticação | PROJECT_STANDARDS.md §Firebase |
  | C-08 | Coleção sem regra | CONFORME | Regras aditivas para `threads/{threadId}/revisions/{revisionId}` especificadas | PROJECT_STANDARDS.md §Security rules |
  | C-09 | Nomenclatura de schema | CONFORME | Subcoleção `revisions` e 7 campos em camelCase definidos | PROJECT_STANDARDS.md §Firebase |
  | C-10 | Arquivo protegido | CONFORME | Exceção para regras e documentação devidamente declarada com ressalva aditiva | AGENTS.md §Non-negotiable |
  | C-11 | Segredo no cliente | NÃO APLICÁVEL | Nenhum segredo ou chave envolvido | AGENTS.md §Non-negotiable |
  | C-12 | Derivação editada à mão | CONFORME | Usa derivações existentes (`isStaff`, `manageForum`) sem escrita manual | PROJECT_STANDARDS.md §Derivation |
  | C-13 | SVG sem sanitização | NÃO APLICÁVEL | Não há adição de ícones SVG customizados | PROJECT_STANDARDS.md §Badges |
  | C-14 | Chip por variante | NÃO APLICÁVEL | Não altera estilos de chip | PROJECT_STANDARDS.md §Chip |
  | C-15 | Motion fora de superfície | CONFORME | Microtransições restritas ao modal e toasts, respeitando `prefers-reduced-motion` | PROJECT_STANDARDS.md §Effect Stack |

## 5. Eixo D — Coerência com codebase
- **Estado:** CONFORME
- **Arquivos lidos:** `src/components/forum/ThreadView.tsx`, `src/types/forum.ts`, `src/lib/forumThreads.ts`, `src/lib/forumPermissions.ts`, `firestore.rules`, `PROJECT_STANDARDS.md`
- **Achados:** Nenhum. A subcoleção `threads/{threadId}/revisions/{revisionId}` casa perfeitamente com a hierarquia Firestore já existente; a lógica de gate de visualização (`isStaff || manageForum || authorId === user.uid`) no componente não quebra `forumPermissions.ts`; a atomicidade da escrita via transação em `updateThread` garante integridade sem geração de mocks.

## 6. Eixo E — Riscos e lacunas
- **Estado:** CONFORME
- **Achados:** Nenhum. A concorrência em caso de post removido está mapeada para a abertura e submissão (R-06); o rollback foi blindado contra perda de auditoria através da criação de revisão prévia preservadora de evidências antes de aplicar a restauração (R-14); estados vazios de histórico são cobertos com feedback amigável em português.

## 7. Próximos passos
1. O revisor humano pode agora transitar a spec para `status: aprovado`, preenchendo `reviewer` e `approved_at` no frontmatter.
2. Com o status `aprovado`, o corpo da spec torna-se congelado e apto para implementação via prompt padrão do AI Studio.

**Limite do parecer:** Esta análise atesta a conformidade técnica, arquitetural e normativa da especificação SPEC-0004. Não executa testes em runtime nem audita código antes de sua implementação.
