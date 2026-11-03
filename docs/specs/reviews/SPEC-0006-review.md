---
id: SPEC-0006
spec: docs/specs/entries/SPEC-0006-icone-svg-global-foruns.md
verdict: APROVADO
status_at_review: rascunho
reviewed_at: 2026-11-03T01:30:00Z
reviewer_version: 1.1.0
axes_executed: [A, B, C, D, E]
blocking_findings: 0
non_blocking_findings: 0
---

# Parecer de Review — SPEC-0006 — Ícone SVG individual por fórum

## 1. Resumo
- **Veredito:** APROVADO
- **Spec:** SPEC-0006 — Ícone SVG individual por fórum
- **Status atual:** rascunho
- **Eixos executados:** A, B, C, D, E
- **Achados bloqueantes:** 0
- **Achados não-bloqueantes:** 0
- **Limitação principal:** Nenhuma relevante; a spec detalha integralmente o contrato de dados individual por fórum (`forums/{forumId}.iconId`), a configuração no formulário `/admin/forum` (`ForumForm.tsx` + `ForumIconPicker.tsx`), a resolução independente em `ForumIndex.tsx` e a limpeza de referências órfãs ao excluir um ícone.

## 2. Eixo A — Estrutura
- **Estado:** CONFORME
- **Achados:** Nenhum. O frontmatter segue integralmente `_meta/_TEMPLATE.md` (`id: SPEC-0006`, `status: rascunho`, `reviewer: null`, `approved_at: null`, `files` com os 9 arquivos do escopo), a seção `## Requisitos` enumera `R-01` a `R-08` com `Progresso: [0/8]` e critérios de aceitação observáveis, a seção `## Testes` permanece vazia apenas com os marcadores canônicos `<!-- BEGIN AI STUDIO REPORT -->` / `<!-- END AI STUDIO REPORT -->`, e a spec está catalogada em `docs/specs/INDEX.md`.

## 3. Eixo B — Escopo
- **Estado:** CONFORME
- **Achados:** Nenhum. O campo `files:` nomeia todos os 9 arquivos a serem criados ou editados, a subseção `### Justificativa de escopo (9 arquivos)` (linhas 37–49) justifica individualmente por que o escopo excede 5 arquivos, os módulos existentes consumidos sem edição estão explicitamente declarados como somente leitura (linha 35), não há conflito com `SPEC-0001` a `SPEC-0005`, e a seção `## Fora de escopo` (linhas 104–109) delimita as fronteiras da entrega (excluindo configuração global e `AdminConfig.tsx`).

## 4. Eixo C — Normas duras
- **Estado:** CONFORME
- **Checks executados:** 15 de 15
- **Achados:**
  | ID | Check | Estado | Evidência | Regra |
  |---|---|---|---|---|
  | C-01 | Escopo >5 arquivos | CONFORME | Subseção `### Justificativa de escopo (9 arquivos)` (linhas 37–49) justifica os 9 arquivos listados em `files:` | AGENTS.md §Scope |
  | C-02 | Arquivos não nomeados | CONFORME | Todos os arquivos com criação/edição constam em `files:` (linhas 16–25); arquivos reutilizados são declarados somente leitura (linha 35) | AGENTS.md §Scope |
  | C-03 | Termos proibidos | CONFORME | Nenhuma ocorrência dos termos vedados nas linhas 1–127 da spec | AGENTS.md §Non-negotiable |
  | C-04 | Strings em inglês | CONFORME | Rótulos, abas, seções e botões visíveis especificados em português (`R-04`, `R-05` e linha 102) | PROJECT_STANDARDS.md §Language |
  | C-05 | Utilitário de cor Tailwind | CONFORME | Nenhum utilitário de cor Tailwind proposto (linhas 75, 77, 101) | PROJECT_STANDARDS.md §Styling |
  | C-06 | Cor literal sem exceção | CONFORME | Uso exclusivo de `var(--token)` e `color-mix` (linha 101) | PROJECT_STANDARDS.md §Styling |
  | C-07 | Auth não-Google | NÃO APLICÁVEL | A spec não altera provedores de autenticação | PROJECT_STANDARDS.md §Firebase |
  | C-08 | Coleção sem regra | CONFORME | `R-07` (linhas 87–88) especifica `allow read: if true;` e `allow create, update, delete: if has('manageBadges') \|\| has('manageForum');` em `match /icons/{iconId}`; `match /forums/{forumId}` já possui regra explícita | PROJECT_STANDARDS.md §Firebase |
  | C-09 | Nomenclatura de schema | CONFORME | Utiliza `forums/{forumId}` e `icons/{iconId}` com o campo `iconId` em `camelCase` (`R-01`, `R-02`, `R-07`) | PROJECT_STANDARDS.md §Firebase |
  | C-10 | Arquivo protegido | CONFORME | Subseção `### Ressalva explícita de plataforma` (linhas 50–55) documenta a exceção aditiva para `firestore.rules`, `firebase-blueprint.json` e `PROJECT_STANDARDS.md` | AGENTS.md §Non-negotiable |
  | C-11 | Segredo no cliente | NÃO APLICÁVEL | Não envolve chaves, variáveis de ambiente ou segredos | AGENTS.md §Non-negotiable |
  | C-12 | Derivação editada à mão | CONFORME | Restrições (linha 100) proíbem escrita manual em `isStaff` ou `effectivePermissions` | PROJECT_STANDARDS.md §Derivation |
  | C-13 | SVG sem sanitização | CONFORME | `R-04` (linha 79) e Restrições (linha 99) exigem sanitização obrigatória via `src/lib/svgSanitizer.ts` | PROJECT_STANDARDS.md §Badges & Icons |
  | C-14 | Chip por variante | NÃO APLICÁVEL | Não toca no componente `<Chip>` nem em estilos de chip | PROJECT_STANDARDS.md §Chip system |
  | C-15 | Motion fora de superfície | NÃO APLICÁVEL | Não introduz efeitos da `Effect Stack` | PROJECT_STANDARDS.md §Effect Stack |

## 5. Eixo D — Coerência com codebase
- **Estado:** CONFORME
- **Arquivos lidos:** `src/types/forum.ts`, `src/lib/forums.ts`, `src/lib/icons.ts`, `src/components/admin/ForumForm.tsx`, `src/pages/admin/AdminForum.tsx`, `src/components/forum/ForumIndex.tsx`, `src/components/admin/IconForm.tsx`, `src/components/admin/SvgSourceInput.tsx`, `src/components/admin/SvgPreview.tsx`, `src/data/icons/iconRegistry.ts`, `src/hooks/useCustomIcons.ts`, `firestore.rules`, `firebase-blueprint.json`, `PROJECT_STANDARDS.md`
- **Achados:** Nenhum. A adição de `iconId: string | null` em `Forum` integra-se diretamente a `ForumFormData` e ao fluxo de `AdminForum.tsx` (`createForum`/`updateForum`); `ForumIconPicker.tsx` segue a mesma decomposição modular de `ForumCategoryEditor.tsx` e `ForumPermissionEditor.tsx` dentro de `ForumForm.tsx`; e `ForumIndex.tsx` resolve o ícone de cada fórum de maneira independente mantendo o container `w-11 h-11` e o tamanho `w-[22px] h-[22px]`.

## 6. Eixo E — Riscos e lacunas
- **Estado:** CONFORME
- **Achados:** Nenhum. A spec cobre compatibilidade retroativa para documentos de fórum legados sem `iconId` (`R-02`), limpeza de referências órfãs nos fóruns quando um ícone customizado é excluído em `/admin/icones` (`R-03`), fallback individual para `<MessageSquare />` quando `forum.iconId` é `null` ou não encontrado (`R-06`), e permissão de escrita em `icons/{iconId}` para administradores com `manageForum` (`R-07`).

## 7. Próximos passos
1. Transitar a `SPEC-0006` para `status: aprovado` (preenchendo `reviewer` e `approved_at` no frontmatter e atualizando `docs/specs/INDEX.md`) quando desejar congelar o corpo para implementação.
2. Com a spec em `status: aprovado`, solicitar a execução da implementação via `spec-implementation`.

**Limite do parecer:** Esta revisão valida a conformidade estrutural, normativa (`PROJECT_STANDARDS.md` + `AGENTS.md`) e arquitetural da `SPEC-0006` antes da implementação; não audita código implementado nem executa testes de aceitação (responsabilidade da skill `miningpoint-spec-verifier` pós-implementação).

