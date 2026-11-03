---
id: SPEC-0006
title: Ícone SVG global dos fóruns
status: aprovado
created: 2026-11-02
updated: 2026-11-02
author: MaiconJh
reviewer: MaiconJh
approved_at: 2026-11-02
implemented_at: null
commit: null
superseded_by: null
supersedes: null
last_audit: null
test_report: null
files:
  - src/types/icon.ts
  - src/lib/icons.ts
  - src/hooks/useGlobalForumIcon.ts
  - src/components/admin/GlobalForumIconPicker.tsx
  - src/pages/admin/AdminConfig.tsx
  - src/components/forum/ForumIndex.tsx
  - firestore.rules
  - firebase-blueprint.json
  - PROJECT_STANDARDS.md
tags: [forum, icons, admin, realtime, firestore]
---

# SPEC-0006 — Ícone SVG global dos fóruns

## Contexto

Atualmente, todos os cards de fórum na listagem pública (`src/components/forum/ForumIndex.tsx`, linhas 199–201) renderizam um ícone estático Lucide (`<MessageSquare className="w-[22px] h-[22px]" />`) dentro do bloco de ícone `w-11 h-11`. Não existe configuração administrativa para definir um ícone SVG customizado global que represente os cards de fóruns em tempo real.

A coleção `icons` já armazena ícones SVG sanitizados (`CustomIcon`), e `listCustomIcons()` (`src/lib/icons.ts`, linha 36) executa `orderBy('name', 'asc')`, o que faz o Firestore omitir automaticamente documentos que não possuam o campo `name`. Armazenar um documento ponteiro reservado `icons/settings` (sem o campo `name` e com discriminante `kind: 'global-forum-icon'`) permite reutilizar integralmente os módulos de sanitização, visualização e persistência já existentes (`src/lib/svgSanitizer.ts`, `src/components/admin/SvgSourceInput.tsx`, `src/components/admin/SvgPreview.tsx`, `src/data/icons/iconRegistry.ts` e `src/hooks/useCustomIcons.ts`, todos consumidos apenas para leitura/reuso, sem modificação).

### Justificativa de escopo (9 arquivos)

Conforme `AGENTS.md` §Scope e `PROJECT_STANDARDS.md` §Scope, alterações que ultrapassam 5 arquivos exigem listagem completa e justificativa explícita:
1. `src/types/icon.ts` — adição das constantes `GLOBAL_FORUM_ICON_DOC_ID`, `GLOBAL_FORUM_ICON_KIND` e da interface `GlobalForumIconSetting`.
2. `src/lib/icons.ts` — leitura, escrita, assinatura `onSnapshot` de `icons/settings`, proteção contra colisão de ID em `createCustomIcon`, filtro defensivo em `listCustomIcons` e auto-limpeza de ponteiro órfão em `deleteCustomIcon`.
3. `src/hooks/useGlobalForumIcon.ts` — novo hook que combina a assinatura em tempo real do ponteiro `icons/settings` com a leitura pontual `getCustomIcon(iconId)`.
4. `src/components/admin/GlobalForumIconPicker.tsx` — novo componente administrativo com abas para seleção de ícone existente ou criação rápida de novo SVG sanitizado.
5. `src/pages/admin/AdminConfig.tsx` — inclusão da terceira seção administrativa em `/admin/configuracao` protegida pela permissão derivada `manageForum`.
6. `src/components/forum/ForumIndex.tsx` — consumo de `useGlobalForumIcon()` para exibir o ícone global nos cards de fórum com retorno automático ao ícone Lucide padrão.
7. `firestore.rules` — atualização das regras de escrita de `match /icons/{iconId}` para contemplar administradores com `manageForum`.
8. `firebase-blueprint.json` — registro documental das entidades `CustomIcon` e `GlobalForumIconSetting`.
9. `PROJECT_STANDARDS.md` — documentação do documento reservado `icons/settings` na seção de schema do Firestore.

### Ressalva explícita de plataforma

O `AGENTS.md` §Non-negotiable estabelece que arquivos de plataforma e regras do Firebase permanecem intocados por padrão. Esta spec declara uma **exceção documentada estritamente aditiva** para:
1. `firestore.rules`: em `match /icons/{iconId}` (linhas 91–96), manter `allow read: if true;` e estender `create`, `update` e `delete` de `has('manageBadges')` para `has('manageBadges') || has('manageForum')`. Sem essa regra, um administrador de fórum sem `manageBadges` recebe `permission-denied` ao gravar `icons/settings` ou criar um SVG pelo seletor.
2. `firebase-blueprint.json` e `PROJECT_STANDARDS.md`: atualização estritamente documental para refletir o contrato de `icons/{iconId}` e `icons/settings`.

## Objetivo

Permitir que administradores com a permissão `manageForum` escolham, cadastrem ou limpem um ícone SVG global em `/admin/configuracao`, refletindo a mudança em tempo real (`onSnapshot`) em todos os cards de fóruns de `ForumIndex`, com retorno imediato ao ícone Lucide padrão quando ausente e auto-limpeza quando o ícone referenciado for excluído em `/admin/icones`.

## Requisitos

Progresso: `[0/8]`

- [ ] **R-01** — Contrato tipado do ponteiro global em `src/types/icon.ts`.
      **Critério:** `src/types/icon.ts` exporta `GLOBAL_FORUM_ICON_DOC_ID = 'settings'`, `GLOBAL_FORUM_ICON_KIND = 'global-forum-icon'` e a interface `GlobalForumIconSetting` com os campos `kind: typeof GLOBAL_FORUM_ICON_KIND`, `iconId: string | null`, `updatedAt: Timestamp | null` e `updatedBy: string`.

- [ ] **R-02** — Operações de leitura, escrita, tempo real e integridade referencial em `src/lib/icons.ts`.
      **Critério:**
      1. `listCustomIcons()` ignora defensivamente qualquer documento cujo `d.id === GLOBAL_FORUM_ICON_DOC_ID`.
      2. `createCustomIcon()` impede que um novo ícone receba o ID `'settings'` (quando `baseId === GLOBAL_FORUM_ICON_DOC_ID`, acrescenta o sufixo `-${Date.now().toString(36)}`).
      3. `getGlobalForumIconConfig()` lê `icons/settings` e retorna `GlobalForumIconSetting | null` validando `kind === GLOBAL_FORUM_ICON_KIND`.
      4. `setGlobalForumIconConfig(iconId, updatedBy)` grava `{ kind: GLOBAL_FORUM_ICON_KIND, iconId, updatedAt: serverTimestamp(), updatedBy }` em `icons/settings` usando `setDoc` sem `merge: true` (garantindo ausência do campo `name`).
      5. `subscribeGlobalForumIconConfig(callback)` assina `icons/settings` via `onSnapshot`, validando `kind` e retornando a função `unsubscribe`.
      6. `deleteCustomIcon(iconId)` verifica antes de `deleteDoc` se o ícone excluído é o `iconId` ativo em `icons/settings`; se for, executa `await setGlobalForumIconConfig(null, 'system')` antes de remover o documento.

- [ ] **R-03** — Hook `useGlobalForumIcon` em `src/hooks/useGlobalForumIcon.ts`.
      **Critério:** O hook assina `subscribeGlobalForumIconConfig` em tempo real; quando `setting?.iconId` é não-nulo, busca o documento com `getCustomIcon(setting.iconId)` protegendo contra condições de corrida no desmonte ou troca rápida de `iconId`, e retorna `{ setting, icon, loading }`. Quando `setting === null`, `setting.iconId === null` ou `getCustomIcon` retorna `null`, `icon` permanece `null`.

- [ ] **R-04** — Componente `GlobalForumIconPicker` em `src/components/admin/GlobalForumIconPicker.tsx`.
      **Critério:** Renderiza quatro zonas com textos visíveis em português e estilização exclusiva por tokens CSS (`var(--token)`):
      1. Card de visualização do ícone selecionado (via `createCustomIconComponent` de `src/data/icons/iconRegistry.ts` ou ícone Lucide padrão quando `selectedIconId === null`), exibindo nome, referência `icons/{id}` (ou `"Padrão do sistema"`) e botão `"Restaurar padrão"` que aciona `onSelect(null)`.
      2. Duas abas (`"Escolher existente"` e `"Criar novo SVG"`) com realce ativo `border-b-2 border-[var(--brand-primary)]`.
      3. Aba `"Escolher existente"` com grade responsiva contendo a célula inicial `"Padrão"` (`selectedIconId === null`) seguida dos ícones de `customIcons`.
      4. Aba `"Criar novo SVG"` com campo de nome (`maxLength={40}`), `SvgSourceInput` (que sanitiza via `src/lib/svgSanitizer.ts`), `SvgPreview` condicional quando o SVG é válido e botão `"Criar e selecionar"` que chama `createCustomIcon` (com `category: 'community'` e `tags: ['forum', 'global', 'icone']`), executa `await onCreated()` e seleciona o ícone recém-criado via `onSelect(id)`.

- [ ] **R-05** — Seção de configuração em `src/pages/admin/AdminConfig.tsx`.
      **Critério:** A página `/admin/configuracao` renderiza uma terceira `<section>` abaixo das duas seções de migração existentes, mantendo o wrapper `p-6 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] space-y-6`. A escrita respeita o gate `canManageForum = !profile?.isBanned && !!profile?.effectivePermissions?.manageForum`, exibindo alerta em português com `ShieldAlertIcon` quando `!canManageForum` e mensagens de confirmação ou erro com `role="alert"` ao persistir.

- [ ] **R-06** — Exibição em tempo real nos cards de `src/components/forum/ForumIndex.tsx`.
      **Critério:** `ForumIndex` invoca `useGlobalForumIcon()` uma única vez no nível da página, memoiza o componente SVG via `createCustomIconComponent(icon.svg, icon.viewBox)` e o renderiza com `className="w-[22px] h-[22px]"` dentro do container `w-11 h-11` de cada item em `filteredForums.map`. Quando `icon === null`, renderiza o ícone Lucide padrão com `className="w-[22px] h-[22px]"`.

- [ ] **R-07** — Regras de segurança em `firestore.rules` e documentação de schema em `firebase-blueprint.json` e `PROJECT_STANDARDS.md`.
      **Critério:** Em `firestore.rules`, `match /icons/{iconId}` mantém `allow read: if true;` e define `allow create, update, delete: if has('manageBadges') || has('manageForum');`. `firebase-blueprint.json` e `PROJECT_STANDARDS.md` documentam o schema de `icons/settings` (`kind`, `iconId`, `updatedAt`, `updatedBy`).

- [ ] **R-08** — Conformidade de lint, tipagem e testes automatizados.
      **Critério:** `npm run check` e `npm test` passam integralmente sem erros de compilação TypeScript, sem quebras de testes existentes e sem infrações das regras `design-tokens/no-raw-color-literals` e `design-tokens/no-tailwind-color-utilities`.

## Restrições

- Não criar nova coleção raiz no Firestore; utilizar exclusivamente `icons/settings` para o ponteiro e `icons/{iconId}` para os documentos de ícone.
- Nunca gravar o campo `name` no documento `icons/settings`, preservando sua omissão natural na query `orderBy('name', 'asc')`.
- Todo SVG criado pelo seletor deve obrigatoriamente ser validado e sanitizado por `sanitizeSvg` (`src/lib/svgSanitizer.ts`).
- Não editar `isStaff` nem `effectivePermissions` manualmente; consumir apenas as permissões derivadas já carregadas no perfil do usuário.
- Toda cor deve vir de `var(--token)` ou `color-mix` sobre tokens existentes em `src/index.css`. Nenhum utilitário de cor do Tailwind nem valor literal de cor é permitido.
- Código, identificadores e comentários em inglês; todos os textos visíveis, rótulos, `aria-label` e `title` em português.

## Fora de escopo

- Suporte a ícone individual por fórum (`forum.iconId` nos documentos de `forums/{forumId}`).
- Exibição do ícone global em `ForumView.tsx`, `ThreadListItem.tsx`, `ThreadView.tsx`, `AdminForum.tsx` ou `ForumList.tsx`.
- Busca textual ou filtro por categoria dentro do componente `GlobalForumIconPicker`.
- Edição de código SVG de ícones já existentes.

## Testes

> Preenchido **após** a execução no AI Studio. Cole aqui, **verbatim**, o
> bloco retornado no formato definido em `_meta/AI-STUDIO-PROMPT.md`. Esta
> seção é **append-only**: não edite o conteúdo colado — se precisar
> corrigir, gere um novo relatório no AI Studio e substitua o bloco.

<!-- BEGIN AI STUDIO REPORT -->
<!-- Cole o bloco "## Testes da Spec — SPEC-0006 — Ícone SVG global dos fóruns" abaixo -->
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-11-02 | MaiconJh | Criação da spec |
| 2026-11-02 | MaiconJh | Revisão aprovada (SPEC-0006-review.md); transição para aprovado |
