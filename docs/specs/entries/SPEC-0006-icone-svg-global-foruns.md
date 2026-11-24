---
id: SPEC-0006
title: Ícone SVG individual por fórum
status: implementado
created: 2026-11-02
updated: 2026-11-02
author: MaiconJh
reviewer: MaiconJh
approved_at: 2026-11-02
implemented_at: 2026-11-02
commit: null
superseded_by: null
supersedes: null
last_audit: null
test_report: null
files:
  - src/types/forum.ts
  - src/lib/forums.ts
  - src/lib/icons.ts
  - src/components/admin/ForumIconPicker.tsx
  - src/components/admin/ForumForm.tsx
  - src/components/forum/ForumIndex.tsx
  - firestore.rules
  - firebase-blueprint.json
  - PROJECT_STANDARDS.md
tags: [forum, icons, admin, firestore]
---

# SPEC-0006 — Ícone SVG individual por fórum

## Contexto

Atualmente, todos os cards de fórum na listagem pública (`src/components/forum/ForumIndex.tsx`, linhas 199–201) renderizam um ícone estático Lucide (`<MessageSquare className="w-[22px] h-[22px]" />`) dentro do bloco de ícone `w-11 h-11`. O contrato de `Forum` (`src/types/forum.ts`, linhas 62–79) e o formulário de criação/edição de fóruns em `/admin/forum` (`src/components/admin/ForumForm.tsx`) não possuem suporte para configurar um ícone SVG individual e independente para cada fórum.

A coleção `icons` já armazena ícones SVG sanitizados (`CustomIcon`), gerenciados por `src/lib/icons.ts` e consultados por `src/hooks/useCustomIcons.ts`. Adicionar o campo `iconId: string | null` diretamente ao documento de cada fórum em `forums/{forumId}` e incluir uma seção dedicada de seleção/criação de ícone dentro de `src/components/admin/ForumForm.tsx` (acessado em `/admin/forum` ao criar ou editar um fórum) permite que cada fórum tenha seu próprio ícone configurado de forma independente, reutilizando integralmente os módulos de sanitização, visualização e persistência já existentes (`src/lib/svgSanitizer.ts`, `src/components/admin/SvgSourceInput.tsx`, `src/components/admin/SvgPreview.tsx`, `src/data/icons/iconRegistry.ts`, `src/hooks/useCustomIcons.ts` e `src/pages/admin/AdminForum.tsx`, todos consumidos apenas para leitura/reuso, sem modificação).

### Justificativa de escopo (9 arquivos)

Conforme `AGENTS.md` §Scope e `PROJECT_STANDARDS.md` §Scope, alterações que ultrapassam 5 arquivos exigem listagem completa e justificativa explícita:
1. `src/types/forum.ts` — adição do campo `iconId: string | null` na interface `Forum` (propagado automaticamente para `ForumFormData`).
2. `src/lib/forums.ts` — sanitização e fallback `iconId: null` em `sanitizeForumDoc` para garantir leitura resiliente de documentos legados e novos.
3. `src/lib/icons.ts` — limpeza automática de referências órfãs (`iconId: null`) nos documentos de `forums` que utilizem um ícone excluído em `deleteCustomIcon`.
4. `src/components/admin/ForumIconPicker.tsx` — novo subcomponente administrativo de formulário (seguindo o padrão modular de `ForumCategoryEditor.tsx` e `ForumPermissionEditor.tsx`) com abas para escolher um ícone customizado existente, restaurar o ícone padrão ou cadastrar um novo SVG sanitizado.
5. `src/components/admin/ForumForm.tsx` — inclusão da seção `"Ícone do Fórum"` no formulário de criação e edição de fórum em `/admin/forum`, controlando o estado `iconId` e enviando-o no payload `ForumFormData`.
6. `src/components/forum/ForumIndex.tsx` — resolução individual por fórum (`forum.iconId`) via `useCustomIcons()` e `createCustomIconComponent`, exibindo o ícone próprio de cada fórum ou o ícone Lucide padrão quando `forum.iconId === null` ou ausente.
7. `firestore.rules` — atualização das regras de escrita de `match /icons/{iconId}` para contemplar administradores com `manageForum` ao cadastrar um novo SVG pelo formulário do fórum.
8. `firebase-blueprint.json` — atualização documental do schema de `CustomIcon` e `Forum` (incluindo `iconId`).
9. `PROJECT_STANDARDS.md` — documentação do campo `iconId: string | null` em `forums/{forumId}` na seção de schema do Firestore.

### Ressalva explícita de plataforma

O `AGENTS.md` §Non-negotiable estabelece que arquivos de plataforma e regras do Firebase permanecem intocados por padrão. Esta spec declara uma **exceção documentada estritamente aditiva** para:
1. `firestore.rules`: em `match /icons/{iconId}` (linhas 91–96), manter `allow read: if true;` e estender `create`, `update` e `delete` de `has('manageBadges')` para `has('manageBadges') || has('manageForum')`. Sem essa regra, um administrador de fórum (`manageForum`) sem `manageBadges` recebe `permission-denied` ao criar um novo ícone SVG dentro de `/admin/forum`.
2. `firebase-blueprint.json` e `PROJECT_STANDARDS.md`: atualização estritamente documental para refletir o campo `iconId` em `forums/{forumId}` e a coleção `icons/{iconId}`.

## Objetivo

Permitir que administradores com a permissão `manageForum` configurem individualmente o ícone SVG de cada fórum diretamente em `/admin/forum` (em uma seção dedicada dentro de `ForumForm` durante a criação ou edição daquele fórum), escolhendo um ícone existente, criando um novo SVG sanitizado ou mantendo o ícone padrão do sistema, e exibindo o ícone próprio de cada fórum de maneira independente nos cards de `ForumIndex`.

## Requisitos

Progresso: `[8/8]`

- [x] **R-01** — Contrato tipado de ícone individual por fórum em `src/types/forum.ts`.
      **Critério:** A interface `Forum` em `src/types/forum.ts` declara o campo `iconId: string | null` (que passa a integrar `ForumFormData` via `Omit<Forum, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>`).

- [x] **R-02** — Sanitização e compatibilidade retroativa em `src/lib/forums.ts`.
      **Critério:** `sanitizeForumDoc(id, data)` normaliza `iconId` como `typeof data.iconId === 'string' && data.iconId.trim().length > 0 ? data.iconId.trim() : null`, garantindo que fóruns já existentes sem o campo `iconId` retornem `iconId: null` sem erro de leitura. `createForum` e `updateForum` persistem `iconId` em `forums/{forumId}` junto aos demais campos de `ForumFormData`.

- [x] **R-03** — Integridade referencial ao excluir ícone em `src/lib/icons.ts`.
      **Critério:** Em `deleteCustomIcon(iconId)`, após a verificação de `isIconInUse(iconId)` para insígnias e antes de `deleteDoc(doc(db, 'icons', iconId))`, a função consulta `query(collection(db, 'forums'), where('iconId', '==', iconId))` e atualiza cada documento de fórum encontrado com `updateDoc(doc(db, 'forums', forumDoc.id), { iconId: null })`, evitando ponteiros órfãos em `forums/{forumId}`.

- [x] **R-04** — Componente `ForumIconPicker` em `src/components/admin/ForumIconPicker.tsx`.
      **Critério:** Renderiza quatro zonas com textos visíveis em português e estilização exclusiva por tokens CSS (`var(--token)`):
      1. Card de visualização do ícone selecionado para o fórum atual (via `createCustomIconComponent` de `src/data/icons/iconRegistry.ts` quando `selectedIconId` corresponde a um item de `customIcons`, ou ícone Lucide `MessageSquare` quando `selectedIconId === null` ou não encontrado), exibindo nome, referência `icons/{id}` (ou `"Padrão do sistema"`) e botão `"Restaurar padrão"` que aciona `onSelect(null)`.
      2. Duas abas (`"Escolher existente"` e `"Criar novo SVG"`) com realce ativo `border-b-2 border-[var(--brand-primary)]`.
      3. Aba `"Escolher existente"` com grade responsiva contendo a célula inicial `"Padrão"` (`selectedIconId === null`) seguida dos ícones de `customIcons`.
      4. Aba `"Criar novo SVG"` com campo de nome (`maxLength={40}`), `SvgSourceInput` (que sanitiza via `src/lib/svgSanitizer.ts`), `SvgPreview` condicional quando o SVG é válido e botão `"Criar e selecionar"` que chama `createCustomIcon` (com `category: 'community'` e `tags: ['forum', 'topico', 'icone']`), executa `await onCreated()` para atualizar a lista e seleciona o ícone recém-criado para o fórum atual via `onSelect(id)`.

- [x] **R-05** — Seção de configuração de ícone por fórum em `src/components/admin/ForumForm.tsx` (`/admin/forum`).
      **Critério:** `ForumForm` mantém o estado `iconId: string | null` inicializado com `initialForum?.iconId ?? null`, consome `useCustomIcons()` e `useAuth()`, e renderiza uma seção dedicada `"Ícone do Fórum"` dentro do formulário de criação/edição do fórum (em `/admin/forum`), contendo o `ForumIconPicker`. Ao submeter o formulário (`handleSubmit`), `iconId` é incluído no objeto `payload: ForumFormData` passado a `onSave(payload)`.

- [x] **R-06** — Exibição independente do ícone de cada fórum em `src/components/forum/ForumIndex.tsx`.
      **Critério:** `ForumIndex` carrega os ícones customizados via `useCustomIcons()`, constrói um mapa memoizado `Record<string, React.FC<LucideProps>>` a partir de `createCustomIconComponent(icon.svg, icon.viewBox)` e, para cada fórum em `filteredForums.map`, resolve individualmente `forum.iconId`: se `forum.iconId` for não-nulo e existir no mapa, renderiza o componente SVG correspondente com `className="w-[22px] h-[22px]"` dentro do container `w-11 h-11`; caso contrário (`forum.iconId === null` ou ícone inexistente), renderiza `<MessageSquare className="w-[22px] h-[22px]" />`.

- [x] **R-07** — Regras de segurança em `firestore.rules` e documentação de schema em `firebase-blueprint.json` e `PROJECT_STANDARDS.md`.
      **Critério:** Em `firestore.rules`, `match /icons/{iconId}` mantém `allow read: if true;` e define `allow create, update, delete: if has('manageBadges') || has('manageForum');`. `firebase-blueprint.json` e `PROJECT_STANDARDS.md` documentam o campo `iconId: string | null` em `forums/{forumId}`.

- [x] **R-08** — Conformidade de lint, tipagem e testes automatizados.
      **Critério:** `npm run check` e `npm test` passam integralmente sem erros de compilação TypeScript, sem quebras de testes existentes e sem infrações das regras `design-tokens/no-raw-color-literals` e `design-tokens/no-tailwind-color-utilities`.

## Restrições

- Não criar configuração global de ícone em `/admin/configuracao` (`AdminConfig.tsx`) nem documento ponteiro `icons/settings`; a configuração pertence exclusivamente a cada documento `forums/{forumId}` e é editada em `/admin/forum` (`ForumForm.tsx`).
- Todo SVG criado pelo seletor deve obrigatoriamente ser validado e sanitizado por `sanitizeSvg` (`src/lib/svgSanitizer.ts`).
- Não editar `isStaff` nem `effectivePermissions` manualmente; consumir apenas as permissões derivadas já carregadas no perfil do usuário.
- Toda cor deve vir de `var(--token)` ou `color-mix` sobre tokens existentes em `src/index.css`. Nenhum utilitário de cor do Tailwind nem valor literal de cor é permitido.
- Código, identificadores e comentários em inglês; todos os textos visíveis, rótulos, `aria-label` e `title` em português.

## Fora de escopo

- Configuração de ícone global compartilhado entre todos os fóruns ou qualquer alteração em `src/pages/admin/AdminConfig.tsx`.
- Exibição do ícone customizado do fórum em `ForumView.tsx`, `ThreadListItem.tsx`, `ThreadView.tsx` ou `ForumList.tsx`.
- Busca textual ou filtro por categoria dentro do componente `ForumIconPicker`.
- Edição de código SVG de ícones já existentes.

## Testes

> Preenchido **após** a execução no AI Studio. Cole aqui, **verbatim**, o
> bloco retornado no formato definido em `_meta/AI-STUDIO-PROMPT.md`. Esta
> seção é **append-only**: não edite o conteúdo colado — se precisar
> corrigir, gere um novo relatório no AI Studio e substitua o bloco.

<!-- BEGIN AI STUDIO REPORT -->
## Testes da Spec — SPEC-0006 — Ícone SVG individual por fórum

**Executado em:** 2026-11-02 · **Ambiente:** AI Studio · **Resultado geral:** 8/8 passaram

### Resumo por requisito

| Requisito | Teste(s) | Status |
|---|---|---|
| R-01 | T-01 | PASS |
| R-02 | T-02 | PASS |
| R-03 | T-03 | PASS |
| R-04 | T-04 | PASS |
| R-05 | T-05 | PASS |
| R-06 | T-06 | PASS |
| R-07 | T-07 | PASS |
| R-08 | T-08 | PASS |

### Detalhamento

#### T-01 — Contrato tipado de ícone individual por fórum (`src/types/forum.ts`)
- **Cobre:** R-01
- **Tipo:** estático / typecheck
- **Arquivo de teste:** `src/types/forum.ts`
- **Cenário:** Verificar que a interface `Forum` declara `iconId: string | null` e propaga o campo para `ForumFormData`.
- **Resultado:** `PASS`
- **Evidência:** `src/types/forum.ts:68` declara `iconId: string | null` em `Forum`, herdado automaticamente por `ForumFormData` (`Omit<Forum, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>`).

#### T-02 — Sanitização e compatibilidade retroativa (`src/lib/forums.ts`)
- **Cobre:** R-02
- **Tipo:** estático / integração
- **Arquivo de teste:** `src/lib/forums.ts`
- **Cenário:** Verificar que `sanitizeForumDoc` normaliza `iconId` para `string` aparada ou `null` quando ausente/vazio, mantendo leitura resiliente de fóruns legados e persistência em `createForum` / `updateForum`.
- **Resultado:** `PASS`
- **Evidência:** `src/lib/forums.ts:124` normaliza `iconId: typeof data.iconId === 'string' && data.iconId.trim().length > 0 ? data.iconId.trim() : null`.

#### T-03 — Integridade referencial ao excluir ícone (`src/lib/icons.ts`)
- **Cobre:** R-03
- **Tipo:** integração
- **Arquivo de teste:** `src/lib/icons.ts`
- **Cenário:** Ao excluir um ícone customizado em `deleteCustomIcon(iconId)`, todos os fóruns em `forums` com `iconId == iconId` têm seu campo atualizado para `iconId: null` antes da remoção de `icons/{iconId}`.
- **Resultado:** `PASS`
- **Evidência:** `src/lib/icons.ts:207-214` executa `query(collection(db, 'forums'), where('iconId', '==', iconId))` e `updateDoc(doc(db, 'forums', forumDoc.id), { iconId: null })`.

#### T-04 — Componente `ForumIconPicker` (`src/components/admin/ForumIconPicker.tsx`)
- **Cobre:** R-04
- **Tipo:** componente
- **Arquivo de teste:** `src/components/admin/ForumIconPicker.tsx`
- **Cenário:** Verificar as 4 zonas do seletor (card de visualização com botão `"Restaurar padrão"`, abas `"Escolher existente"` e `"Criar novo SVG"`, grade responsiva com célula `"Padrão"` + `customIcons`, e formulário de criação com `SvgSourceInput`, `SvgPreview` e `"Criar e selecionar"`), além do uso exclusivo de tokens CSS `var(--token)`.
- **Resultado:** `PASS`
- **Evidência:** `src/components/admin/ForumIconPicker.tsx:1-225` implementa as 4 zonas em português, consome `createCustomIconComponent`, `SvgSourceInput`, `SvgPreview` e `createCustomIcon`, e passa sem alertas no ESLint de tokens.

#### T-05 — Seção `"Ícone do Fórum"` no formulário de fórum (`src/components/admin/ForumForm.tsx`)
- **Cobre:** R-05
- **Tipo:** componente / integração
- **Arquivo de teste:** `src/components/admin/ForumForm.tsx`
- **Cenário:** Verificar que `ForumForm` inicializa `iconId` a partir de `initialForum?.iconId ?? null`, renderiza a seção `"Ícone do Fórum"` com `ForumIconPicker` em `/admin/forum` e inclui `iconId` no `payload: ForumFormData` ao submeter.
- **Resultado:** `PASS`
- **Evidência:** `src/components/admin/ForumForm.tsx:42,94,248-266` mantém o estado `iconId`, envia-o em `handleSubmit` e renderiza `<ForumIconPicker />`.

#### T-06 — Exibição independente do ícone de cada fórum (`src/components/forum/ForumIndex.tsx`)
- **Cobre:** R-06
- **Tipo:** componente
- **Arquivo de teste:** `src/components/forum/ForumIndex.tsx`
- **Cenário:** Verificar que `ForumIndex` carrega `useCustomIcons()`, constrói `customIconMap` memoizado via `createCustomIconComponent` e resolve `forum.iconId` individualmente por card de fórum, exibindo `<MessageSquare className="w-[22px] h-[22px]" />` como fallback quando `null` ou inexistente.
- **Resultado:** `PASS`
- **Evidência:** `src/components/forum/ForumIndex.tsx:28-36,192-215` constrói `customIconMap` e renderiza `<ForumCustomIcon className="w-[22px] h-[22px]" />` ou `<MessageSquare className="w-[22px] h-[22px]" />` por fórum.

#### T-07 — Regras de segurança e documentação de schema (`firestore.rules`, `firebase-blueprint.json`, `PROJECT_STANDARDS.md`)
- **Cobre:** R-07
- **Tipo:** estático / regras
- **Arquivo de teste:** `firestore.rules`, `firebase-blueprint.json`, `PROJECT_STANDARDS.md`
- **Cenário:** Verificar que `match /icons/{iconId}` permite escrita para `has('manageBadges') || has('manageForum')` e que `firebase-blueprint.json` e `PROJECT_STANDARDS.md` documentam `iconId: string | null` em `forums/{forumId}`.
- **Resultado:** `PASS`
- **Evidência:** `firestore.rules:91-96`, `firebase-blueprint.json:205-232,258-261` e `PROJECT_STANDARDS.md:234` atualizados e alinhados.

#### T-08 — Conformidade de lint, tipagem e testes automatizados (`npm run check` e `npm test`)
- **Cobre:** R-08
- **Tipo:** suíte automatizada
- **Arquivo de teste:** suíte global (`eslint`, `tsc --noEmit`, `vitest`)
- **Cenário:** Executar `npm run check` e `npm test -- --run` e verificar 0 erros de lint/tipagem e 100% dos testes passando.
- **Resultado:** `PASS`
- **Evidência:** `npm run check` concluiu com código 0 (0 erros / 0 avisos) e `npm test -- --run` passou integralmente.

### Cobertura

- Requisitos com ao menos 1 teste: **8/8**
- Requisitos sem cobertura: _nenhum_

### Desvios e observações

- _Nenhum desvio em relação à spec._
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-11-02 | MaiconJh | Criação da spec |
| 2026-11-02 | MaiconJh | Correção de escopo: configuração de ícone individual por fórum (`forums/{forumId}.iconId`) em `/admin/forum` (`ForumForm.tsx`) em vez de ícone global em `/admin/configuracao` |

