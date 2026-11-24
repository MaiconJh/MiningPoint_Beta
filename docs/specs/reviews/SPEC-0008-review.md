---
id: SPEC-0008
spec: docs/specs/entries/SPEC-0008-nome-pessoal-privado.md
verdict: APROVADO
status_at_review: rascunho
reviewed_at: 2026-11-24T23:18:00Z
reviewer_version: 1.1.0
axes_executed: [A, B, C, D, E]
blocking_findings: 0
non_blocking_findings: 0
---

# Parecer de Review — SPEC-0008 — Nome pessoal privado nas configurações da conta

## 1. Resumo
- **Veredito:** APROVADO
- **Spec:** SPEC-0008 — Nome pessoal privado nas configurações da conta
- **Status atual:** aprovado (transitado após parecer `APROVADO` emitido sobre a versão em `rascunho`)
- **Eixos executados:** A, B, C, D, E
- **Achados bloqueantes:** 0
- **Achados não-bloqueantes:** 0
- **Limitação principal:** Esta é uma revisão pré-implementação (sem execução de código, build, lint, testes automatizados ou deploy de regras); além disso, `src/lib/privateProfile.ts` ainda não existe no repositório, portanto a análise de coerência desse módulo baseia-se no contrato especificado e nos arquivos vizinhos lidos.

## 2. Eixo A — Estrutura
- **Estado:** CONFORME
- **Achados:** Nenhum.
  - **Fatos observados:** O frontmatter (linhas 1–22) segue integralmente `docs/specs/_meta/_TEMPLATE.md` (`id: SPEC-0008`, `title`, `status`, `created`/`updated: 2026-11-24`, `author: MaiconJh`, `files:` com 4 caminhos e `tags`). A seção `## Requisitos` (linhas 51–124) traz `Progresso: [0/5]` e cinco requisitos numerados (`R-01` a `R-05`), todos com `**Critério:**` observável. A seção `## Testes` (linhas 165–174) permanece vazia contendo apenas os marcadores canônicos `<!-- BEGIN AI STUDIO REPORT -->` / `<!-- END AI STUDIO REPORT -->`. A spec está registrada em `docs/specs/INDEX.md` (linha 14) com contagem de `4` arquivos, e o `## Histórico de revisões` (linhas 176–182) documenta a aplicação dos achados do parecer anterior e a aprovação.

## 3. Eixo B — Escopo
- **Estado:** CONFORME
- **Achados:** Nenhum.
  - **Fatos observados:** O campo `files:` (linhas 16–20) nomeia 4 arquivos (`≤ 5`), correspondendo integralmente às alterações descritas no corpo (`PROJECT_STANDARDS.md`, `firestore.rules`, `src/lib/privateProfile.ts`, `src/components/account/ProfileEditPanel.tsx`). `UserProfile` e `users/{uid}` são citados apenas para preservar sua integridade sem alteração (`R-01`, `R-03`, `R-05`). A seção `## Fora de escopo` (linhas 148–163) delimita com clareza as fronteiras da entrega, incluindo `firebase-blueprint.json` e a limpeza server-side de documentos privados órfãos na exclusão administrativa de contas. Não há conflito com `SPEC-0001` a `SPEC-0007` (atende ao desdobramento deixado em `SPEC-0007`, linhas 175–178).

## 4. Eixo C — Normas duras
- **Estado:** CONFORME
- **Checks executados:** 15 de 15
- **Achados:**
  | ID | Check | Estado | Evidência | Regra |
  |---|---|---|---|---|
  | C-01 | Escopo >5 arquivos | NÃO APLICÁVEL | `files:` lista 4 arquivos (`≤ 5`, linhas 16–20) | `AGENTS.md` §Scope / `PROJECT_STANDARDS.md` §Scope |
  | C-02 | Arquivos não nomeados | CONFORME | Todas as alterações descritas no corpo mapeiam para os 4 arquivos listados em `files:` (linhas 16–20) | `AGENTS.md` §Scope |
  | C-03 | Termos proibidos | CONFORME | Nenhum termo proibido proposto como string visível ou dado renderizado; a ocorrência de `"prévia"` em `R-04` (linha 103, "prévia pública do perfil") refere-se tecnicamente ao componente existente `ProfilePreviewCard` | `AGENTS.md` §Non-negotiable / `PROJECT_STANDARDS.md` §Content |
  | C-04 | Strings em inglês | CONFORME | Rótulo visível em português (`**Nome pessoal (privado)**`, `R-04`, linhas 96–97), mensagens de erro/aviso em português (`R-03` linha 91, `R-04` linhas 111–115) e regra explícita de idioma (linhas 144–145) | `PROJECT_STANDARDS.md` §Language |
  | C-05 | Utilitário de cor Tailwind | CONFORME | Nenhum utilitário de cor Tailwind proposto; Restrições (linha 146) determinam respeito aos tokens de tema | `PROJECT_STANDARDS.md` §Styling |
  | C-06 | Cor literal sem exceção | CONFORME | Nenhuma cor literal proposta; Restrições (linha 146) determinam uso dos tokens de tema | `PROJECT_STANDARDS.md` §Styling |
  | C-07 | Auth não-Google | CONFORME | Restrições (linha 139) e Fora de escopo (linha 153) mantêm autenticação exclusivamente pelo provedor Google | `PROJECT_STANDARDS.md` §Firebase |
  | C-08 | Coleção sem regra | CONFORME | `R-02` (linhas 65–80) define explicitamente `get`, `list`, `create`, `update` e `delete` em `match /userPrivateProfiles/{userId}`, preservando o default-deny global | `PROJECT_STANDARDS.md` §Firebase / §Security rules |
  | C-09 | Nomenclatura de schema | CONFORME | Coleção `userPrivateProfiles` em `camelCase` inglês plural (`R-01` linhas 58–60, `R-02` linha 66, `R-03` linha 85, `Restrições` linhas 129 e 133), alinhada a `userCollectibles`/`catalogCategories`/`forumReactions`/`forumReports`, e campos `personalName` e `updatedAt` em `camelCase` | `PROJECT_STANDARDS.md` §Firebase (linhas 72–75) / `references/checks.md` C-09 |
  | C-10 | Arquivo protegido | CONFORME | `firestore.rules` (linha 18) é arquivo protegido, com justificativa explícita e delimitada de exceção em `## Restrições` (linhas 127–130), autorizando exclusivamente as regras owner-only de `userPrivateProfiles/{uid}` | `AGENTS.md` §Non-negotiable / `references/checks.md` C-10 |
  | C-11 | Segredo no cliente | NÃO APLICÁVEL | A spec não envolve chaves, segredos ou variáveis de ambiente | `AGENTS.md` §Non-negotiable |
  | C-12 | Derivação editada à mão | NÃO APLICÁVEL | A spec não toca `isStaff`, `effectivePermissions` nem grupos | `PROJECT_STANDARDS.md` §Derivation |
  | C-13 | SVG sem sanitização | NÃO APLICÁVEL | A spec não envolve ícones ou SVG customizado | `PROJECT_STANDARDS.md` §Badges & Icons |
  | C-14 | Chip por variante | NÃO APLICÁVEL | A spec não toca `<Chip>` nem variantes de chip | `PROJECT_STANDARDS.md` §Chip system |
  | C-15 | Motion fora de superfície | NÃO APLICÁVEL | A spec não introduz efeitos visuais da `Effect Stack` | `PROJECT_STANDARDS.md` §Effect Stack |

## 5. Eixo D — Coerência com codebase
- **Estado:** CONFORME
- **Arquivos lidos:** `PROJECT_STANDARDS.md`, `firestore.rules`, `src/components/account/ProfileEditPanel.tsx`, `src/components/account/sections/ProfileSection.tsx`, `src/components/account/HandleSettings.tsx`, `src/components/account/__tests__/ProfileEditPanel.test.tsx`, `src/context/ProfileDraftContext.tsx`, `src/lib/firebase.ts`, `src/lib/users.ts`, `firebase-blueprint.json`, `docs/specs/entries/SPEC-0007-onboarding-identidade-publica.md`, `docs/specs/INDEX.md`.
- **Achados:** Nenhum.
  - **Fatos observados:** `R-02` reutiliza diretamente `isOwner(userId)` e `isBannedUser(userId)` já definidos em `firestore.rules` (linhas 13–21). `R-04` (linhas 99–115) acomoda integralmente o fato de `ProfileEditPanel.tsx` permanecer montado com `isOpen === false` (disparando leitura somente quando `isOpen === true` e houver `uid`, com cancelamento de efeito), protege a compatibilidade com `ProfileEditPanel.test.tsx` (que mocka `useAuth` sem `user` e sem `profile.uid`), e mantém o salvamento/remoção privados totalmente desacoplados do `ProfileDraftContext`, do estado `isDirty` e do fechamento do painel.

## 6. Eixo E — Riscos e lacunas
- **Estado:** CONFORME
- **Achados:** Nenhum.
  - **Fatos observados:** A spec cobre integralmente os riscos e lacunas relevantes: isolamento estrito de leitura pontual (`get`) e negação de listagens (`list: if false`), validação de chaves exatas e `personalName` não vazio em `create`/`update`, e exclusão idempotente (`R-02`); contrato discriminado de leitura sem lançar exceção (`Reads never throw`), separando ausência de documento (`null`) de falha de leitura com bloqueio de sobrescrita acidental e ação de tentar novamente (`R-03`, `R-04`); experiência de contas banidas com visualização preservada e ações de escrita desabilitadas + mapeamento de `permission-denied` (`R-04`); sincronização das três seções relevantes de `PROJECT_STANDARDS.md` (`R-01`); registro explícito em `## Fora de escopo` de `firebase-blueprint.json` e documentos privados órfãos na exclusão administrativa (`linhas 158–163`); e pré-requisito operacional de deploy de `firestore.rules` (`linhas 131–134`).

## 7. Próximos passos
1. Com a `SPEC-0008` em `status: aprovado` (corpo congelado) e `docs/specs/INDEX.md` atualizado, solicitar a execução da implementação via `spec-implementation`.
2. Após implementar, publicar as `firestore.rules` atualizadas (`deploy_firebase`), colar o relatório de testes verbatim na seção `## Testes` e auditar via `miningpoint-spec-verifier`.

**Limite do parecer:** Esta revisão valida a conformidade estrutural, normativa (`PROJECT_STANDARDS.md` + `AGENTS.md` + `docs/specs/_meta/README.md`) e de coerência estática com o codebase da `SPEC-0008` antes da implementação; não executa código, build, lint nem testes automatizados e não substitui a auditoria pós-implementação (`miningpoint-spec-verifier`).
