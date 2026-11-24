---
id: SPEC-0007
spec: docs/specs/entries/SPEC-0007-onboarding-identidade-publica.md
verdict: APROVADO
status_at_review: rascunho
reviewed_at: 2026-11-24T22:26:00Z
reviewer_version: 1.1.0
axes_executed: [A, B, C, D, E]
blocking_findings: 0
non_blocking_findings: 0
---

# Parecer de Review — SPEC-0007 — Onboarding obrigatório de nome público e @nick

## 1. Resumo
- **Veredito:** APROVADO
- **Spec:** SPEC-0007 — Onboarding obrigatório de nome público e @nick
- **Status atual:** aprovado (transitado após parecer `APROVADO` emitido sobre a versão em `rascunho`)
- **Eixos executados:** A, B, C, D, E
- **Achados bloqueantes:** 0
- **Achados não-bloqueantes:** 0
- **Limitação principal:** Como esta é uma revisão pré-implementação, o parecer valida conformidade estrutural, normativa e de coerência com o codebase atual, mas não executa código, build, lint nem testes automatizados.

## 2. Eixo A — Estrutura
- **Estado:** CONFORME
- **Achados:** Nenhum.
  - **Fatos observados:** O frontmatter (linhas 1–24) segue integralmente `docs/specs/_meta/_TEMPLATE.md` (`id: SPEC-0007`, `title`, `status`, `created`/`updated: 2026-11-24`, `author: MaiconJh`, `files:` com os 6 caminhos do escopo, `tags`). A seção `## Requisitos` (linhas 80–145) traz `Progresso: [0/6]` e seis requisitos numerados (`R-01` a `R-06`), todos com `**Critério:**` observável. A seção `## Testes` (linhas 190–199) permanece vazia contendo apenas os marcadores canônicos `<!-- BEGIN AI STUDIO REPORT -->` / `<!-- END AI STUDIO REPORT -->`. A spec está catalogada em `docs/specs/INDEX.md` com contagem de `6` arquivos.

## 3. Eixo B — Escopo
- **Estado:** CONFORME
- **Achados:** Nenhum.
  - **Fatos observados:** O campo `files:` nomeia os 6 arquivos a serem criados ou editados (linhas 16–22); a subseção `### Justificativa de escopo (6 arquivos)` (linhas 49–72) justifica individualmente por que cada um dos 6 arquivos é necessário; os módulos existentes consumidos sem modificação (`src/lib/handle.ts`, `src/components/onboarding/HandleBanner.tsx`, `src/components/RequireAuth.tsx` e `src/pages/Login.tsx`) estão explicitamente declarados em modo somente leitura (linhas 43–47); a seção `## Fora de escopo` (linhas 173–188) delimita com clareza nome privado, atualização documental de schema (`PROJECT_STANDARDS.md` e `firebase-blueprint.json`), índice separado de handles, cooldown de `displayName`, alteração das regras de redefinição de `@nick`, URLs públicas/`shortId` e redesenho do painel de conta. Não há conflito com `SPEC-0001` a `SPEC-0006` (`R-06` preserva o fluxo de `SPEC-0001`).

## 4. Eixo C — Normas duras
- **Estado:** CONFORME
- **Checks executados:** 15 de 15
- **Achados:**
  | ID | Check | Estado | Evidência | Regra |
  |---|---|---|---|---|
  | C-01 | Escopo >5 arquivos | CONFORME | Subseção `### Justificativa de escopo (6 arquivos)` (linhas 49–72) justifica individualmente os 6 arquivos de `files:` (linhas 16–22), complementada pela exigência operacional de aprovação antes da edição de código (linhas 169–171) | `AGENTS.md` §Scope / `references/checks.md` C-01 |
  | C-02 | Arquivos não nomeados | CONFORME | Todas as alterações descritas no corpo mapeiam para os 6 arquivos de `files:` (linhas 16–22); módulos reutilizados sem edição são declarados somente leitura (linhas 43–47) | `AGENTS.md` §Scope |
  | C-03 | Termos proibidos | CONFORME | Nenhuma ocorrência de termos vedados (`mock`, `fake`, `dummy`, `sample`, `placeholder`, `TODO`, `lorem`, "em breve", "demonstração", "prévia", "fictício", "simulado") nas linhas 1–208 | `AGENTS.md` §Non-negotiable / `PROJECT_STANDARDS.md` §Content |
  | C-04 | Strings em inglês | CONFORME | Rótulos e botão visíveis especificados em português ("Nome de exibição", "@nick", `"Sair"` em `R-02`, linhas 99–105; regra explícita na linha 168) | `PROJECT_STANDARDS.md` §Language |
  | C-05 | Utilitário de cor Tailwind | CONFORME | Nenhum utilitário de cor Tailwind proposto; Restrições (linhas 166–167) restringem a estilização de `ProfileSetup.tsx` a tokens CSS `var(--token)` e utilitários de layout Tailwind | `PROJECT_STANDARDS.md` §Styling |
  | C-06 | Cor literal sem exceção | CONFORME | Nenhuma cor literal proposta; Restrições (linhas 165–167) exigem uso exclusivo de `var(--token)` e proíbem alterar tokens de cor | `PROJECT_STANDARDS.md` §Styling |
  | C-07 | Auth não-Google | CONFORME | Restrições (linha 149) mantêm autenticação exclusivamente pelo provedor Google | `PROJECT_STANDARDS.md` §Firebase |
  | C-08 | Coleção sem regra | CONFORME | Não cria coleção nova; utiliza `users/{uid}`. Verificado em `firestore.rules` (linhas 50–74): `allow create` permite criação pelo dono não banido e `onlyTouchesProfileFields()` usa blocklist de campos sensíveis, já autorizando `displayName`, `handle`, `visibility` e `profileSetupCompleted` | `PROJECT_STANDARDS.md` §Firebase / §Security rules |
  | C-09 | Nomenclatura de schema | CONFORME | Utiliza coleção `users/{uid}` (lowercase plural English) e campos `profileSetupCompleted`, `displayName`, `handle`, `visibility`, `hasRedefinedHandle` em `camelCase` (`R-01`, `R-04`, `R-05`) | `PROJECT_STANDARDS.md` §Firebase |
  | C-10 | Arquivo protegido | CONFORME | Nenhum arquivo protegido (`vite.config.ts`, `eslint.config.js`, `package.json`, `metadata.json`, `firestore.rules`, tokens de cor globais) consta em `files:`; Restrições (linhas 165–166) proíbem modificá-los | `AGENTS.md` §Non-negotiable |
  | C-11 | Segredo no cliente | NÃO APLICÁVEL | A spec não envolve chaves, segredos ou variáveis de ambiente | `AGENTS.md` §Non-negotiable |
  | C-12 | Derivação editada à mão | CONFORME | A spec não toca `isStaff`, `effectivePermissions` nem grupos | `PROJECT_STANDARDS.md` §Derivation |
  | C-13 | SVG sem sanitização | NÃO APLICÁVEL | A spec não envolve ícones ou SVG customizado | `PROJECT_STANDARDS.md` §Badges & Icons |
  | C-14 | Chip por variante | NÃO APLICÁVEL | A spec não toca o componente `<Chip>` nem variantes de chip | `PROJECT_STANDARDS.md` §Chip system |
  | C-15 | Motion fora de superfície | NÃO APLICÁVEL | A spec não introduz efeitos visuais da `Effect Stack` | `PROJECT_STANDARDS.md` §Effect Stack |

## 5. Eixo D — Coerência com codebase
- **Estado:** CONFORME
- **Arquivos lidos:** `src/App.tsx`, `src/context/AuthContext.tsx`, `src/types/profile.ts`, `src/lib/profile.ts`, `src/lib/users.ts`, `src/lib/handle.ts`, `src/components/onboarding/HandleBanner.tsx`, `src/components/RequireAuth.tsx`, `src/pages/Login.tsx`, `firestore.rules`, `firebase-blueprint.json`.
- **Achados:** Nenhum.
  - **Fatos observados:** A criação inicial em `src/context/AuthContext.tsx` com `displayName: ''`, `visibility: 'private'` e `profileSetupCompleted: false` impede exposição prematura em `/membros` e `/perfil/:slug` aproveitando diretamente `firestore.rules` (linhas 50–74), e o objeto de fallback do dono preserva compatibilidade com `UserProfile` (`src/types/profile.ts`). `normalizeUserProfile` (`src/lib/profile.ts`) oferece o ponto único para compatibilizar contas legadas (`R-01`). `src/lib/users.ts` concentra `checkHandleUniqueness` e `listUsers`, permitindo a atualização atômica de `{ displayName, handle, visibility: 'public', profileSetupCompleted: true }` sem marcar `hasRedefinedHandle: true` (`R-04`, `R-05`) e o filtro defensivo de contas pendentes (`R-01`). A rota `/completar-perfil` em `src/App.tsx` utiliza hífen, não colidindo com `RESERVED_HANDLES` nem com o padrão `^[a-z0-9_]+$` em `src/lib/handle.ts`, e o guarda de navegação coordena o redirecionamento pós-login sem modificar `src/pages/Login.tsx`.

## 6. Eixo E — Riscos e lacunas
- **Estado:** CONFORME
- **Achados:** Nenhum.
  - **Fatos observados:** A spec cobre os riscos identificados na primeira revisão: contrato completo de rota `/completar-perfil`, layout isolado, guarda de navegação (contas pendentes, visitantes não autenticados e contas já configuradas) e botão `"Sair"` (`R-02`, `R-05`); prevenção de exposição pública antes do onboarding (`R-01`); validação de tamanho (2–50 caracteres após `trim`), ausência de quebras de linha/caracteres de controle e não autopreenchimento a partir do Google (`R-03`); avaliação do guarda apenas após `loading === false && profile !== null` e tratamento de falhas de validação/rede/permissão incluindo contas banidas com `isBanned: true` (`R-05`); compatibilidade retroativa com contas legadas (`R-01`, `R-06`); e registro explícito da limitação pré-existente de `checkHandleUniqueness` (linhas 153–157) e da atualização documental de schema fora de escopo (linhas 179–184).

## 7. Próximos passos
1. Com a `SPEC-0007` em `status: aprovado` (corpo congelado) e `docs/specs/INDEX.md` atualizado, solicitar a execução da implementação via `spec-implementation` (confirmando a aprovação do escopo de 6 arquivos antes de editar código).
2. Após a implementação, colar o relatório de testes verbatim na seção `## Testes` e auditar via `miningpoint-spec-verifier`.

**Limite do parecer:** Esta revisão valida a conformidade estrutural, normativa (`PROJECT_STANDARDS.md` + `AGENTS.md`) e de coerência com o codebase da `SPEC-0007` antes da implementação; não executa código, build, lint nem testes automatizados e não substitui a auditoria pós-implementação (`miningpoint-spec-verifier`).
