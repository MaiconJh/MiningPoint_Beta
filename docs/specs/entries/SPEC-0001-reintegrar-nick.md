---
id: SPEC-0001
title: Reintegrar interface de definição/redefinição de @nick
status: implementado
created: 2026-10-14
updated: 2026-10-16
author: MaiconJh
reviewer: MaiconJh
approved_at: 2026-10-16
implemented_at: 2026-10-16
commit: 419c58a
superseded_by: null
supersedes: null
last_audit: null
files:
  - src/components/account/ProfileEditPanel.tsx
  - src/components/account/sections/ProfileSection.tsx
tags: [ui, profile, handle]
---

# SPEC-0001 — Reintegrar interface de definição/redefinição de @nick

## Contexto

A interface de definição/redefinição de @nick foi desmontada pelo commit
`ff0ee13` (feat(profile): overhaul profile editing interface, 11/10/2026),
que reescreveu `ProfileSection.tsx` e criou `ProfileEditPanel.tsx`. O
componente `HandleSettings` deixou de ser importado e montado — ficou órfão.
A lógica de persistência **nunca foi removida**: `useProfileDraft.ts` ainda
gerencia `handle` no draft, no `isDirty` e chama `setHandle` / `redefineHandle`
no `save()`.

Como consequência, o `HandleBanner` (onboarding) aponta para `/conta/perfil`,
um destino que hoje não exibe a interface. Adicionalmente, o `draftProfile`
em `ProfileSection.tsx` deixou de incluir `handle`, então o preview não
reflete mudanças de nick.

Evidência do estado anterior (commit pai `60d7591`): o `HandleSettings` era
o primeiro bloco da Editing Card, acima de Bio/Título/Visibilidade.

## Objetivo

Remontar a UI de definição/redefinição de @nick no painel de edição de
perfil, reutilizando os componentes e a persistência existentes, e restaurar
`handle` no objeto de preview.

## Requisitos

Progresso: `[2/2]`

- [x] **R-01** — Montar `HandleSettings` como primeira seção do corpo
      rolável de `ProfileEditPanel.tsx`, acima de Imagens, recebendo
      `profile`, `currentDraftHandle={draft.handle}` e
      `onUpdateDraftHandle={(h) => setField("handle", h)}`.
      **Critério:** `/conta/perfil` exibe a seção @nick no painel de
      edição, com o formulário funcional.
- [x] **R-02** — Restaurar `handle: draft.handle` no `useMemo` que monta
      `draftProfile` em `ProfileSection.tsx`.
      **Critério:** o preview do perfil reflete o nick do draft.

## Restrições

- Ler cada arquivo antes de editá-lo (PROJECT_STANDARDS.md, seção Scope).
- Não recriar arquivos existentes. Não reformatar arquivos vizinhos.
- Não alterar `handle.ts`, `users.ts`, `useProfileDraft.ts`,
  `ProfileDraftContext.tsx`, `ConfirmHandleModal.tsx`, `firestore.rules`.
- Cores apenas via CSS custom properties do tema.
- Apenas 2 arquivos são alterados (abaixo do limite de 5).

## Fora de escopo

- Cooldown entre redefinições.
- Verificação de unicidade em tempo real.
- Fluxo de suporte para segunda redefinição.
- Alterar a rota pública `/perfil/:slug` ou o `resolveSlugToUid`.

## Testes

<!-- BEGIN AI STUDIO REPORT -->
## Testes da Spec — SPEC-0001 — Reintegrar interface de definição/redefinição de @nick

### T-01 — Montagem de HandleSettings no painel de edição

- **Requisito:** R-01
- **Tipo:** unit
- **Executado:** sim
- **Comando:** `npx vitest run src/components/account/__tests__/ProfileEditPanel.test.tsx`
- **Resultado:** passou
- **Evidência:** 6 testes aprovados em src/components/account/__tests__/ProfileEditPanel.test.tsx
- **Observações:** HandleSettings montado como primeira seção rolável de ProfileEditPanel.tsx

### T-02 — Preservação de handle no draftProfile de preview

- **Requisito:** R-02
- **Tipo:** build
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** verificação de lint e tipagem do TypeScript concluída com 0 erros; handle propagado em draftProfile
- **Observações:** objeto draftProfile em ProfileSection.tsx inclui handle: draft.handle
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-10-14 | MaiconJh | Criação |
| 2026-10-16 | MaiconJh | Implementação concluída |
