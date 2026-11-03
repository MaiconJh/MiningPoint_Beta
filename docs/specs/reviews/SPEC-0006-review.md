---
id: SPEC-0006
spec: docs/specs/entries/SPEC-0006-icone-svg-global-foruns.md
verdict: APROVADO
status_at_review: rascunho
reviewed_at: 2026-11-03T01:08:00Z
reviewer_version: 1.1.0
axes_executed: [A, B, C, D, E]
blocking_findings: 0
non_blocking_findings: 0
---

# Parecer de Review — SPEC-0006 — Ícone SVG global dos fóruns

## 1. Resumo
- **Veredito:** APROVADO
- **Spec:** SPEC-0006 — Ícone SVG global dos fóruns
- **Status atual:** rascunho
- **Eixos executados:** A, B, C, D, E
- **Achados bloqueantes:** 0
- **Achados não-bloqueantes:** 0
- **Limitação principal:** Nenhuma relevante; a spec detalha integralmente os contratos de dados, invariantes de integridade referencial, componentes reutilizados e exceções aditivas de escopo e plataforma.

## 2. Eixo A — Estrutura
- **Estado:** CONFORME
- **Achados:** Nenhum. O frontmatter segue integralmente `_meta/_TEMPLATE.md` (`id: SPEC-0006`, `status: rascunho`, `reviewer: null`, `approved_at: null`, `files` com os 9 arquivos do escopo), a seção `## Requisitos` enumera `R-01` a `R-08` com `Progresso: [0/8]` e critérios de aceitação observáveis, a seção `## Testes` permanece vazia apenas com os marcadores canônicos `<!-- BEGIN AI STUDIO REPORT -->` / `<!-- END AI STUDIO REPORT -->`, e a spec está catalogada em `docs/specs/INDEX.md`.

## 3. Eixo B — Escopo
- **Estado:** CONFORME
- **Achados:** Nenhum. O campo `files:` nomeia todos os 9 arquivos a serem criados ou editados, a subseção `### Justificativa de escopo (9 arquivos)` (linhas 37–49) justifica individualmente por que o escopo excede 5 arquivos, os módulos existentes consumidos sem edição estão explicitamente declarados como somente leitura (linha 35), não há conflito com `SPEC-0001` a `SPEC-0005`, e a seção `## Fora de escopo` (linhas 107–113) delimita as fronteiras da entrega.

## 4. Eixo C — Normas duras
- **Estado:** CONFORME
- **Checks executados:** 15 de 15
- **Achados:**
  | ID | Check | Estado | Evidência | Regra |
  |---|---|---|---|---|
  | C-01 | Escopo >5 arquivos | CONFORME | Subseção `### Justificativa de escopo (9 arquivos)` (linhas 37–49) justifica os 9 arquivos listados em `files:` | AGENTS.md §Scope |
  | C-02 | Arquivos não nomeados | CONFORME | Todos os arquivos com criação/edição constam em `files:` (linhas 16–25); arquivos reutilizados são declarados somente leitura (linha 35) | AGENTS.md §Scope |
  | C-03 | Termos proibidos | CONFORME | Nenhuma ocorrência dos termos vedados nas linhas 1–130 da spec | AGENTS.md §Non-negotiable |
  | C-04 | Strings em inglês | CONFORME | Rótulos, abas e botões visíveis especificados em português (`R-04`, `R-05` e linha 105) | PROJECT_STANDARDS.md §Language |
  | C-05 | Utilitário de cor Tailwind | CONFORME | Nenhum utilitário de cor Tailwind proposto (linhas 80, 82, 87, 104) | PROJECT_STANDARDS.md §Styling |
  | C-06 | Cor literal sem exceção | CONFORME | Uso exclusivo de `var(--token)` e `color-mix` (linha 104) | PROJECT_STANDARDS.md §Styling |
  | C-07 | Auth não-Google | NÃO APLICÁVEL | A spec não altera provedores de autenticação | PROJECT_STANDARDS.md §Firebase |
  | C-08 | Coleção sem regra | CONFORME | `R-07` (linhas 92–93) especifica `allow read: if true;` e `allow create, update, delete: if has('manageBadges') \|\| has('manageForum');` em `match /icons/{iconId}` | PROJECT_STANDARDS.md §Firebase |
  | C-09 | Nomenclatura de schema | CONFORME | Reutiliza a coleção `icons` e campos em `camelCase` (`kind`, `iconId`, `updatedAt`, `updatedBy`) em `R-01` e `R-02` | PROJECT_STANDARDS.md §Firebase |
  | C-10 | Arquivo protegido | CONFORME | Subseção `### Ressalva explícita de plataforma` (linhas 50–55) documenta a exceção aditiva para `firestore.rules`, `firebase-blueprint.json` e `PROJECT_STANDARDS.md` | AGENTS.md §Non-negotiable |
  | C-11 | Segredo no cliente | NÃO APLICÁVEL | Não envolve chaves, variáveis de ambiente ou segredos | AGENTS.md §Non-negotiable |
  | C-12 | Derivação editada à mão | CONFORME | `R-05` (linha 87) e Restrições (linha 103) consomem `profile?.effectivePermissions?.manageForum` sem escrita manual em `isStaff` ou `effectivePermissions` | PROJECT_STANDARDS.md §Derivation |
  | C-13 | SVG sem sanitização | CONFORME | `R-04` (linha 84) e Restrições (linha 102) exigem sanitização obrigatória via `src/lib/svgSanitizer.ts` | PROJECT_STANDARDS.md §Badges & Icons |
  | C-14 | Chip por variante | NÃO APLICÁVEL | Não toca no componente `<Chip>` nem em estilos de chip | PROJECT_STANDARDS.md §Chip system |
  | C-15 | Motion fora de superfície | NÃO APLICÁVEL | Não introduz efeitos da `Effect Stack` | PROJECT_STANDARDS.md §Effect Stack |

## 5. Eixo D — Coerência com codebase
- **Estado:** CONFORME
- **Arquivos lidos:** `src/types/icon.ts`, `src/lib/icons.ts`, `src/pages/admin/AdminConfig.tsx`, `src/components/forum/ForumIndex.tsx`, `src/components/admin/IconForm.tsx`, `src/components/admin/SvgSourceInput.tsx`, `src/components/admin/SvgPreview.tsx`, `src/data/icons/iconRegistry.ts`, `src/hooks/useCustomIcons.ts`, `firestore.rules`, `firebase-blueprint.json`, `PROJECT_STANDARDS.md`
- **Achados:** Nenhum. A estratégia de usar `icons/settings` sem o campo `name` é compatível com `listCustomIcons()` (`orderBy('name', 'asc')` em `src/lib/icons.ts`, linha 36); o preenchimento de `category: 'community'` e `tags: ['forum', 'global', 'icone']` em `R-04` atende ao contrato de `CustomIconFormData` exigido por `createCustomIcon`; e a substituição em `ForumIndex.tsx` respeita exatamente o container `w-11 h-11` e a dimensão `w-[22px] h-[22px]` presentes nas linhas 199–201.

## 6. Eixo E — Riscos e lacunas
- **Estado:** CONFORME
- **Achados:** Nenhum. A spec cobre os principais casos de borda: (1) prevenção de colisão caso um ícone receba o nome `"Settings"` em `createCustomIcon` (`R-02.2`), (2) escrita sem `merge: true` em `setGlobalForumIconConfig` para impedir campos residuais (`R-02.4`), (3) auto-limpeza de ponteiro órfão em `deleteCustomIcon` (`R-02.6`), (4) proteção contra condição de corrida em `useGlobalForumIcon` (`R-03`), e (5) retorno imediato ao ícone Lucide padrão quando não houver configuração salva ou em caso de falha de rede (`R-03`, `R-06`).

## 7. Próximos passos
1. Transitar a `SPEC-0006` para `status: aprovado` (passando por `em-leitura` ou aprovando diretamente, preenchendo `reviewer` e `approved_at` no frontmatter e atualizando `docs/specs/INDEX.md`).
2. Com a spec em `status: aprovado`, solicitar a execução da implementação via `spec-implementation`.

**Limite do parecer:** Esta revisão valida a conformidade estrutural, normativa (`PROJECT_STANDARDS.md` + `AGENTS.md`) e arquitetural da `SPEC-0006` antes da implementação; não audita código implementado nem executa testes de aceitação (responsabilidade da skill `miningpoint-spec-verifier` pós-implementação).
