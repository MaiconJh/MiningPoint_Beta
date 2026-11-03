---
id: SPEC-0006
title: Ícone SVG individual por fórum
status: rascunho
created: 2026-11-02
updated: 2026-11-02
author: MaiconJh
reviewer: null
approved_at: null
implemented_at: null
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

Progresso: `[0/8]`

- [ ] **R-01** — Contrato tipado de ícone individual por fórum em `src/types/forum.ts`.
      **Critério:** A interface `Forum` em `src/types/forum.ts` declara o campo `iconId: string | null` (que passa a integrar `ForumFormData` via `Omit<Forum, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>`).

- [ ] **R-02** — Sanitização e compatibilidade retroativa em `src/lib/forums.ts`.
      **Critério:** `sanitizeForumDoc(id, data)` normaliza `iconId` como `typeof data.iconId === 'string' && data.iconId.trim().length > 0 ? data.iconId.trim() : null`, garantindo que fóruns já existentes sem o campo `iconId` retornem `iconId: null` sem erro de leitura. `createForum` e `updateForum` persistem `iconId` em `forums/{forumId}` junto aos demais campos de `ForumFormData`.

- [ ] **R-03** — Integridade referencial ao excluir ícone em `src/lib/icons.ts`.
      **Critério:** Em `deleteCustomIcon(iconId)`, após a verificação de `isIconInUse(iconId)` para insígnias e antes de `deleteDoc(doc(db, 'icons', iconId))`, a função consulta `query(collection(db, 'forums'), where('iconId', '==', iconId))` e atualiza cada documento de fórum encontrado com `updateDoc(doc(db, 'forums', forumDoc.id), { iconId: null })`, evitando ponteiros órfãos em `forums/{forumId}`.

- [ ] **R-04** — Componente `ForumIconPicker` em `src/components/admin/ForumIconPicker.tsx`.
      **Critério:** Renderiza quatro zonas com textos visíveis em português e estilização exclusiva por tokens CSS (`var(--token)`):
      1. Card de visualização do ícone selecionado para o fórum atual (via `createCustomIconComponent` de `src/data/icons/iconRegistry.ts` quando `selectedIconId` corresponde a um item de `customIcons`, ou ícone Lucide `MessageSquare` quando `selectedIconId === null` ou não encontrado), exibindo nome, referência `icons/{id}` (ou `"Padrão do sistema"`) e botão `"Restaurar padrão"` que aciona `onSelect(null)`.
      2. Duas abas (`"Escolher existente"` e `"Criar novo SVG"`) com realce ativo `border-b-2 border-[var(--brand-primary)]`.
      3. Aba `"Escolher existente"` com grade responsiva contendo a célula inicial `"Padrão"` (`selectedIconId === null`) seguida dos ícones de `customIcons`.
      4. Aba `"Criar novo SVG"` com campo de nome (`maxLength={40}`), `SvgSourceInput` (que sanitiza via `src/lib/svgSanitizer.ts`), `SvgPreview` condicional quando o SVG é válido e botão `"Criar e selecionar"` que chama `createCustomIcon` (com `category: 'community'` e `tags: ['forum', 'topico', 'icone']`), executa `await onCreated()` para atualizar a lista e seleciona o ícone recém-criado para o fórum atual via `onSelect(id)`.

- [ ] **R-05** — Seção de configuração de ícone por fórum em `src/components/admin/ForumForm.tsx` (`/admin/forum`).
      **Critério:** `ForumForm` mantém o estado `iconId: string | null` inicializado com `initialForum?.iconId ?? null`, consome `useCustomIcons()` e `useAuth()`, e renderiza uma seção dedicada `"Ícone do Fórum"` dentro do formulário de criação/edição do fórum (em `/admin/forum`), contendo o `ForumIconPicker`. Ao submeter o formulário (`handleSubmit`), `iconId` é incluído no objeto `payload: ForumFormData` passado a `onSave(payload)`.

- [ ] **R-06** — Exibição independente do ícone de cada fórum em `src/components/forum/ForumIndex.tsx`.
      **Critério:** `ForumIndex` carrega os ícones customizados via `useCustomIcons()`, constrói um mapa memoizado `Record<string, React.FC<LucideProps>>` a partir de `createCustomIconComponent(icon.svg, icon.viewBox)` e, para cada fórum em `filteredForums.map`, resolve individualmente `forum.iconId`: se `forum.iconId` for não-nulo e existir no mapa, renderiza o componente SVG correspondente com `className="w-[22px] h-[22px]"` dentro do container `w-11 h-11`; caso contrário (`forum.iconId === null` ou ícone inexistente), renderiza `<MessageSquare className="w-[22px] h-[22px]" />`.

- [ ] **R-07** — Regras de segurança em `firestore.rules` e documentação de schema em `firebase-blueprint.json` e `PROJECT_STANDARDS.md`.
      **Critério:** Em `firestore.rules`, `match /icons/{iconId}` mantém `allow read: if true;` e define `allow create, update, delete: if has('manageBadges') || has('manageForum');`. `firebase-blueprint.json` e `PROJECT_STANDARDS.md` documentam o campo `iconId: string | null` em `forums/{forumId}`.

- [ ] **R-08** — Conformidade de lint, tipagem e testes automatizados.
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
<!-- Cole o bloco "## Testes da Spec — SPEC-0006 — Ícone SVG individual por fórum" abaixo -->
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-11-02 | MaiconJh | Criação da spec |
| 2026-11-02 | MaiconJh | Correção de escopo: configuração de ícone individual por fórum (`forums/{forumId}.iconId`) em `/admin/forum` (`ForumForm.tsx`) em vez de ícone global em `/admin/configuracao` |

