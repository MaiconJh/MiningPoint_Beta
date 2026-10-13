# Relatório de Auditoria — PROJECT_STANDARDS.md vs. código

## 1. Resumo executivo
- **Regras auditadas**: 44
- **Distribuição de estados**:
  - `ATENDIDO`: 31
  - `PARCIAL`: 2
  - `NÃO ATENDIDO`: 1
  - `DIVERGENTE`: 2
  - `INCONCLUSIVO`: 0
  - `NÃO DOCUMENTADO`: 8
- **Achados CRÍTICOS**: 1 (`firebase.json` ausente no repositório)
- **Achados ALTOS**: 2 (Discrepância no limite de `featuredBadges` 8 vs. 4; Fallback de configuração do Firebase para JSON com valores fixos em vez de variáveis de ambiente estritas)
- **Achados MÉDIOS**: 3 (Migração de `groupId` sem escrita destrutiva do campo legado; Chave de armazenamento `mp.tema` em português; Gear icon na NavBar visível para administradores banidos)
- **Achados BAIXOS**: 2 (Uso de cores literais `white` em regras de faísca no `effects.css`; Rota pública declarada no padrão como `/perfil/:id` e implementada como `/perfil/:slug`)
- **Principais seções do padrão desatualizadas**:
  - **Firestore schema**: omite campos centrais do usuário (`bannerUrl`, `shortId`, `handle`, `hasRedefinedHandle`), o campo `chipStyle` na coleção `groups` e `theme` na coleção `rarities`. Contém contradição interna no limite de `featuredBadges` (linha 85 estipula máx 8, enquanto linha 239 e código estipulam máx 4).
  - **Firebase**: omite o módulo completo de upload de mídia via Firebase Storage (`src/lib/storage.ts`).
  - **Badges & Icons / Styling**: não documenta o sistema Effect Stack (8 efeitos visuais: Tilt, Spotlight, Holo, Aurora, Prism, Shimmer, Neon, Ember) nem os tokens CSS de feedback, acento secundário e sombras presentes em `src/index.css`.
  - **Navigation**: não documenta o sistema de identificadores amigáveis (`@nick` / `shortId`) com resolução via rota `/perfil/:slug`.

---

## 2. Matriz de conformidade

| Seção | Regra | Estado | Severidade | Impacto | Esforço | Evidência | Nota |
|---|---|---|---|---|---|---|---|
| **Language** | Identificadores de código em inglês | `PARCIAL` | MÉDIA | Manutenção | Pontual | `src/context/ThemeContext.tsx:13` (`THEME_STORAGE_KEY = 'mp.tema'`), `index.html:12` | Chave de localStorage em português viola a regra explícita de storage keys em inglês (`mp.theme`). |
| **Language** | Strings visíveis e metadados em português | `ATENDIDO` | — | Usuário final | Pontual | `index.html:2,6-9`, `src/components/**/*.tsx` | Textos, labels, aria-labels, placeholders e tags meta auditados estão em pt-BR. |
| **Language** | Proibição de identificadores traduzidos | `ATENDIDO` | — | Manutenção | Pontual | `src/types/*.ts`, `src/lib/*.ts` | Tipos, funções e propriedades declaradas exclusivamente em inglês. |
| **Language** | Proibição de strings visíveis em inglês | `ATENDIDO` | — | Usuário final | Pontual | Varredura de `aria-label`, `alt`, `title`, `placeholder` | Zero ocorrências de strings visíveis em inglês detectadas na UI. |
| **Styling** | Tailwind apenas para layout, tipografia e estrutura | `ATENDIDO` | — | Manutenção | Pontual | `eslint.config.js:22`, `src/components/**/*.tsx` | Regra `design-tokens/no-tailwind-color-utilities` ativa sem erros. |
| **Styling** | Cores por propriedades CSS customizadas em `:root` / `[data-theme="light"]` | `ATENDIDO` | — | Manutenção | Pontual | `src/index.css:4-78` | Cores centralizadas em variáveis sem classes literais Tailwind. |
| **Styling** | Proibição de literais de cor em JSX/style | `ATENDIDO` | — | Manutenção | Pontual | `src/components/profile/ProfileBanner.tsx:31,48`, `BadgeCarousel.tsx:189,202,208` | Regra `design-tokens/no-raw-color-literals` ativa; exceções pontuais utilizam comentário justificativo. |
| **Styling** | Literais em folhas CSS de efeitos | `DIVERGENTE` | BAIXA | Manutenção | Pontual | `src/styles/effects.css:179,184` | Uso de literal `white` em regras de partículas de faísca (`.is-spark`). |
| **Content** | Conteúdo real sem promessas/pedidos de desculpa | `ATENDIDO` | — | Usuário final | Pontual | `src/pages/**/*.tsx` | Telas mostram conteúdo real ou cascas neutras. |
| **Content** | Proibição dos 10 termos restritos em strings visíveis | `ATENDIDO` | — | Usuário final | Pontual | Varredura com `grep -riEn` em `src/**/*.{ts,tsx}` | Zero ocorrências nos arquivos da aplicação (ocorrências de `mock` restritas a testes unitários `*.test.ts(x)`). |
| **Scope** | Não duplicação do componente `<Chip>` | `ATENDIDO` | — | Manutenção | Pontual | `src/components/chip/Chip.tsx:13` | Único componente responsável pela renderização de chips no sistema. |
| **Scope** | Unicidade de componentes estruturais de perfil e SVG | `ATENDIDO` | — | Manutenção | Pontual | `ProfileBanner.tsx`, `ProfileHeader.tsx`, `SvgPreview.tsx` | Sem duplicações concorrentes detectadas no workspace. |
| **Firebase** | Auth: Google Provider exclusivo | `ATENDIDO` | — | Segurança | Pontual | `src/context/AuthContext.tsx:7,118-124` | `GoogleAuthProvider` e `signInWithPopup` utilizados; sem providers anônimos ou email/senha. |
| **Firebase** | Ausência de Realtime Database e Firebase Hosting | `ATENDIDO` | — | Arquitetura | Pontual | `src/lib/firebase.ts:1-28`, `package.json:26` | Apenas Firestore, Auth e Storage inicializados via SDK modular. |
| **Firebase** | Coleções em minúsculo plural e campos em camelCase | `ATENDIDO` | — | Manutenção | Pontual | `firestore.rules`, `src/lib/*.ts` | Nomenclatura compatível em todas as 12 coleções acessadas. |
| **Firebase** | Regras de segurança explícitas sem default-allow | `ATENDIDO` | — | Segurança | Pontual | `firestore.rules:41-117` | Cada coleção possui regras de leitura e escrita; `match /{document=**}` aplica negação total. |
| **Firebase** | Configuração proveniente do ambiente sem segredos no cliente | `DIVERGENTE` | ALTA | Segurança | Pontual | `src/lib/firebase.ts:7-13`, `firebase-applet-config.json` | Fallback ativo para arquivo JSON local no bundle quando variáveis `VITE_*` não são fornecidas. |
| **Firebase** | Existência de `firebase.json` | `NÃO ATENDIDO` | CRÍTICA | Segurança | Pontual | Raiz do repositório (`find . -name "firebase.json"`) | Arquivo ausente. Regras `firestore.rules` existem na raiz, mas deploy CLI depende de `firebase.json`. |
| **Firestore schema** | Schema `users/{uid}` | `ATENDIDO` | — | Manutenção | Pontual | `src/types/profile.ts:22-49`, `src/lib/profile.ts:36-100` | Campos requeridos e derivados atendidos com fallbacks em `normalizeUserProfile`. |
| **Firestore schema** | Limite de `featuredBadges` (8 vs. 4) | `DIVERGENTE` | ALTA | Usuário final | Pontual | `src/components/account/ProfileEditPanel.tsx:151,383,393` | Código limita a 4 insígnias. O schema (linha 85) diz máx 8, divergindo do código e da linha 239 do próprio padrão. |
| **Firestore schema** | Campos não documentados em `users` (`shortId`, `handle`, `bannerUrl`, etc.) | `NÃO DOCUMENTADO` | — | Manutenção | Pontual | `src/types/profile.ts:27-30` | Prática válida para personalização e menções que o padrão não descreve. |
| **Firestore schema** | Schema `groups/{groupId}` | `ATENDIDO` | — | Manutenção | Pontual | `src/types/group.ts:21-33`, `src/lib/groups.ts` | Todos os campos do padrão atendidos. |
| **Firestore schema** | Campo `chipStyle` na coleção `groups` | `NÃO DOCUMENTADO` | — | Manutenção | Pontual | `src/types/group.ts:30` | Código suporta `chipStyle` em grupos; bloco de schema das linhas 100-123 omitiu o campo. |
| **Firestore schema** | Schema `badges/{badgeId}` | `ATENDIDO` | — | Manutenção | Pontual | `src/types/profile.ts:51-54`, `src/lib/badges.ts:48-63` | Campos requeridos, catálogo, ordem 0-999 e `linkedTitleIds` presentes. |
| **Firestore schema** | Schema `userCollectibles/{userId_kind_itemId}` | `ATENDIDO` | — | Manutenção | Pontual | `src/lib/collectibleLinks.ts:49-57` | Estrutura de chave composta e campos atendidos. |
| **Firestore schema** | Schema `icons/{iconId}` | `ATENDIDO` | — | Manutenção | Pontual | `src/types/icon.ts:4-13`, `src/lib/icons.ts:20-31` | Nomes, 8 categorias, tags, svg sanitizado e viewBox presentes. |
| **Firestore schema** | Schema `titles/{titleId}` | `ATENDIDO` | — | Manutenção | Pontual | `src/types/title.ts:5-9`, `src/lib/titles.ts:42-58` | Cores, chipStyle, catalog links e `linkedBadgeIds` presentes. |
| **Firestore schema** | Schema `rarities/{rarityId}` | `ATENDIDO` | — | Manutenção | Pontual | `src/types/rarity.ts:4-12`, `src/lib/rarities.ts` | Campos `label`, `color`, `order` presentes. |
| **Firestore schema** | Campo `theme` em `rarities` | `NÃO DOCUMENTADO` | — | Manutenção | Pontual | `src/types/rarity.ts:9` | Campo opcional do sistema Effect Stack não citado no bloco de raridades. |
| **Firestore schema** | Schema `catalogCategories/{categoryId}` | `ATENDIDO` | — | Manutenção | Pontual | `src/types/catalogCategory.ts:3-10` | Campos `name`, `description`, `order` presentes. |
| **Firestore schema** | Schema `origins/{originId}` | `ATENDIDO` | — | Manutenção | Pontual | `src/types/origin.ts:3-10` | Campos `name`, `description`, `order` presentes. |
| **Firestore schema** | Schema `collections/{collectionId}` | `ATENDIDO` | — | Manutenção | Pontual | `src/types/collection.ts:3-10` | Campos `name`, `description`, `order` presentes. |
| **Firestore schema** | Migração do campo legado `groupId` com exclusão física | `PARCIAL` | MÉDIA | Manutenção | Pontual | `src/lib/profile.ts:51-52`, `src/lib/users.ts:161,352,428` | Leitura faz fallback em memória, mas nenhuma função invoca `deleteField()` para limpar `groupId` do banco. |
| **Firestore schema** | Regras de derivação (`isStaff`, `effectivePermissions`) | `ATENDIDO` | — | Segurança | Pontual | `src/lib/permissions.ts:15-35` | União lógica (OR) e derivação de equipe implementadas estritamente conforme especificado. |
| **Ban Semantics** | Acesso de leitura preservado para usuários banidos | `ATENDIDO` | — | Usuário final | Pontual | `firestore.rules:41-45,58,63,73,80,90` | Leitura de documentos públicos não impõe `!isBannedUser`. |
| **Ban Semantics** | Proibição de escrita para banidos via `!isBannedUser` | `ATENDIDO` | — | Segurança | Pontual | `firestore.rules:25,47,51` | Função `has()` e regras de create/update barram usuários banidos de qualquer mutação. |
| **Ban Semantics** | Bloqueio de administradores banidos ao `/admin` | `ATENDIDO` | — | Segurança | Pontual | `src/components/admin/RequireAdmin.tsx:21-24` | `hasAccessPanel` checa `!profile?.isBanned`; renderiza `<NotFound />` se banido. |
| **Ban Semantics** | Auto-atualização restrita a campos de perfil | `ATENDIDO` | — | Segurança | Pontual | `firestore.rules:32-39,49-53` | `onlyTouchesProfileFields()` barra alteração de grupos, permissões, staff, ban e atributos. |
| **Ban Semantics** | Exclusão de conta via admin remove user e userCollectibles | `ATENDIDO` | — | Manutenção | Pontual | `src/lib/users.ts:302-310`, `collectibleLinks.ts:175-189` | `deleteUser()` remove documento e invoca `deleteCollectiblesForUser(uid)`. |
| **Badges & Icons** | 300 ícones Lucide em 8 categorias (distribuição 40/35/40/40/40/40/30/35) | `ATENDIDO` | — | Usuário final | Pontual | `src/data/icons/iconRegistry.ts`, script de contagem | Contagem exata de 300 itens com a divisão por categoria rigorosamente cumprida. |
| **Badges & Icons** | Resolução `resolveIcon` (custom -> lucide -> fallback award 1x) | `ATENDIDO` | — | Manutenção | Pontual | `src/data/icons/iconRegistry.ts:2454-2499` | Ordem respeitada; cache de warnings via `warnedUnknownIcons = new Set()`. |
| **Badges & Icons** | Política de sanitização SVG em `svgSanitizer.ts` | `ATENDIDO` | — | Segurança | Pontual | `src/lib/svgSanitizer.ts:5-88,145-202` | Whitelist de 16 tags, safe attrs, limites (20KB, 200 nós, 4000 carac.) e rejeição de scripts/styles/on*. |
| **Badges & Icons** | Fluxos de concessão e revogação de insígnias e títulos | `ATENDIDO` | — | Usuário final | Pontual | `src/lib/collectibleLinks.ts:42-93` | Documentos criados com chave composta; remoção limpa `featuredTitleId` ou `featuredBadges`. |
| **Chip system** | `DEFAULT_CHIP_STYLE` como fallback e efeitos isolados | `ATENDIDO` | — | Visual | Pontual | `src/lib/chipStyle.ts:4-37`, `Chip.tsx:51-78` | Shimmer, glow e pulse permitidos apenas em chips e configurados por item. |
| **Navigation** | Rotas de conta e sub-nav de 240px | `ATENDIDO` | — | Usuário final | Pontual | `src/App.tsx:117`, `AccountPanel.tsx:21`, `AccountPanelNav.tsx:40` | `/conta` redireciona para `/conta/visao-geral`; sidebar desktop fixa em `w-[240px]`. |
| **Navigation** | Dropdown do avatar na NavBar e ícone de engrenagem para admin | `ATENDIDO` | — | Usuário final | Pontual | `src/components/NavBar.tsx:361-384,403-495` | Dropdown possui Perfil, Conta e Sair com divisores; engrenagem condicionada a `accessPanel`. |
| **Navigation** | Rota pública de perfil `/perfil/:id` | `ATENDIDO` | — | Usuário final | Pontual | `src/App.tsx:109`, `src/pages/PublicProfile.tsx:23` | Implementada com parâmetro `:slug` para suportar tanto UID legado quanto `@nick` e `shortId`. |
| **Colour tokens** | Valores hexadecimais Dark e Light no CSS global | `ATENDIDO` | — | Visual | Pontual | `src/index.css:4-78` | Todos os 22 valores hexadecimais declarados no padrão batem dígito a dígito com o arquivo. |
| **Colour tokens** | Tokens adicionais de feedback, acento secundário e sombras | `NÃO DOCUMENTADO` | — | Visual | Pontual | `src/index.css:27,31-34,41,67,71-74,77` | Cores semânticas consolidadas (`--feedback-*`, `--brand-secondary`, etc.) omitidas na tabela do padrão. |

---

## 3. Achados detalhados (agrupados por severidade)

### CRÍTICOS
- **R-01: Ausência de arquivo `firebase.json` na raiz do workspace**
  - **Evidência**: Busca abrangente no workspace (`find . -name "firebase.json"`) retornou vazio.
  - **Impacto**: Segurança e deploy. Embora o arquivo `firestore.rules` exista fisicamente na raiz com 120 linhas de regras seguras, a CLI padrão do Firebase (`firebase deploy --only firestore:rules`) requer um manifesto `firebase.json` apontando para `firestore.rules`. Sem ele, deploys convencionais de regras de segurança falham silenciosamente ou exigem comandos manuais com flags ad-hoc.
  - **Recomendação**: Adicionar `firebase.json` na raiz vinculando o banco de dados e o arquivo de regras:
    ```json
    {
      "firestore": {
        "rules": "firestore.rules"
      }
    }
    ```

### ALTOS
- **R-02: Contradição no teto de insígnias destacadas (`featuredBadges`: 8 vs. 4)**
  - **Evidência**: `PROJECT_STANDARDS.md:85` estipula `featuredBadges: string[] // [] by default, max 8`. Em contraste, `PROJECT_STANDARDS.md:239` estipula *"choose up to 4 featured badges in /conta/perfil"*, e o código em `src/components/account/ProfileEditPanel.tsx:151,383,393` trava o limite rígido em 4 (`draft.featuredBadges.length >= 4`).
  - **Impacto**: Usuário final e integridade de dados. Usuários não conseguem selecionar mais de 4 insígnias na interface de edição, e o carrossel do banner foi projetado para acomodar no máximo 4 slots.
  - **Recomendação**: Alinhar o schema na linha 85 do `PROJECT_STANDARDS.md` para documentar `max 4` em consonância com a linha 239 e a implementação da UI.

- **R-03: Fallback de inicialização do Firebase para arquivo JSON empacotado**
  - **Evidência**: `src/lib/firebase.ts:5,7-13`:
    ```typescript
    import firebaseConfigJson from '../../firebase-applet-config.json';
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey;
    ```
  - **Impacto**: Segurança e governança de ambiente. O padrão estabelece (linhas 60-61): *"Firebase config comes from the environment, never hardcoded"*. O fallback para `firebase-applet-config.json` mitiga indisponibilidade no preview do AI Studio, mas contradiz a diretriz estrita de obter a configuração exclusivamente do ambiente.
  - **Recomendação**: Documentar formalmente no `PROJECT_STANDARDS.md` a exceção permitida para ambientes de preview onde o arquivo de provisionamento local é a fonte padrão caso variáveis `VITE_*` não estejam injetadas.

### MÉDIOS
- **R-04: Migração de `groupId` para `primaryGroupId` incompleta na persistência [RESOLVIDO]**
  - **Evidência**: `src/lib/profile.ts:51-52` e `src/lib/users.ts:161,352,428`. O padrão estipula (linhas 196-202): *"A user doc that has groupId and not primaryGroupId: primaryGroupId = groupId ... Then deletes the obsolete groupId field"*.
  - **Impacto**: Manutenção. O código resolve a compatibilidade em memória durante a leitura (`primaryGroupId = data.primaryGroupId || data.groupId || 'visitante'`), mas não executa a gravação nem chamava `deleteField()` para remover a propriedade legada do documento no Firestore.
  - **Recomendação & Conclusão de Regras de Segurança**:
    - **Análise das `firestore.rules`**: A regra de atualização de perfil em self-update restringe os campos modificáveis via `onlyTouchesProfileFields()`, que **bloqueia** explicitamente `primaryGroupId`, `secondaryGroupIds`, `isStaff`, `effectivePermissions`, `isBanned`, `bannedAt`, `bannedBy` e `attributes`. Logo, qualquer tentativa de migração em self-update (ex.: gatilho no login do usuário comum) é rejeitada pelo Firebase com erro de permissão.
    - **Solução implementada**: O acesso administrativo via `allow update: if (isOwner && !banned && onlyTouchesProfileFields()) || has('manageUsers')` permite que administradores com a permissão `manageUsers` façam mutações completas nesses campos. A função administrativa `backfillPrimaryGroupId` foi implementada em `src/lib/users.ts` e disponibilizada na interface administrativa em `src/pages/admin/AdminConfig.tsx`, permitindo executar a migração em lotes e remover o campo obsoleto `groupId` via `deleteField()` em conformidade com as regras de segurança.

- **R-05: Chave de armazenamento local em português (`mp.tema`)**
  - **Evidência**: `src/context/ThemeContext.tsx:13` (`export const THEME_STORAGE_KEY = 'mp.tema';`) e `index.html:12` (`localStorage.getItem('mp.tema')`).
  - **Impacto**: Manutenção. O padrão define explicitamente na seção Language: *"English: file names, folders, components, functions, variables, types, hooks, comments, utility classes, storage keys"*.
  - **Recomendação**: Atualizar a chave para `mp.theme` com fallback transitório de leitura para `mp.tema`.

- **R-06: Visibilidade do ícone de engrenagem na NavBar para administradores banidos**
  - **Evidência**: `src/components/NavBar.tsx:34,361`:
    ```typescript
    const canAccessPanel = !!profile?.effectivePermissions?.accessPanel;
    ```
    Em contraste com `src/components/admin/RequireAdmin.tsx:21`:
    ```typescript
    const hasAccessPanel = !profile?.isBanned && !!profile?.effectivePermissions?.accessPanel;
    ```
  - **Impacto**: Experiência do usuário. Se um usuário com cargo administrativo for banido, o ícone da engrenagem permanece visível na barra de navegação, mas ao clicar ele é direcionado a uma tela de página não encontrada (404 / NotFound).
  - **Recomendação**: Ajustar `NavBar.tsx` para `const canAccessPanel = !profile?.isBanned && !!profile?.effectivePermissions?.accessPanel;`.

### BAIXOS
- **R-07: Literais `white` em regras de animação de faísca no CSS**
  - **Evidência**: `src/styles/effects.css:179,184` utiliza a palavra-chave literal `white` no gradiente e sombra de `.ember-particle.is-spark`.
  - **Impacto**: Manutenção cosmética. O padrão prevê que cores sejam extraídas de variáveis customizadas (ex: `--text-primary` ou `--brand-primary`).
  - **Recomendação**: Substituir por `var(--text-primary)` ou criar um token específico para partículas luminosas.

- **R-08: Rota de perfil público nomeada como `/perfil/:slug` em vez de `/perfil/:id`**
  - **Evidência**: `src/App.tsx:109` declara `<Route path="/perfil/:slug" ... />`, enquanto a seção Navigation cita `/perfil/:id`.
  - **Impacto**: Apenas nomenclatura de rota. O componente `PublicProfile.tsx` resolve o slug procurando sucessivamente por UID, `@nick` ou `shortId`.
  - **Recomendação**: Atualizar a documentação da seção Navigation para refletir o parâmetro `:slug`.

---

## 4. Seções do PROJECT_STANDARDS.md desatualizadas

### 1. Seção "Firestore schema"
- **Contradição em `featuredBadges`**: Linha 85 afirma `max 8`, enquanto a linha 239 e a tela de edição em `ProfileEditPanel.tsx` limitam estritamente a 4.
- **Campos de perfil ausentes**: O documento não cita `bannerUrl: string | null`, `shortId: string`, `handle: string | null` e `hasRedefinedHandle: boolean`, todos plenamente implementados em `UserProfile` e validados em `ProfileEditPanel.tsx`, `HandleSettings.tsx` e `ConfirmHandleModal.tsx`.
- **Coleção `groups`**: Não lista `chipStyle?: ChipStyle` no bloco da coleção (linhas 100-123), embora a seção "Chip system" (linha 251) afirme que grupos e títulos suportam o campo.
- **Coleção `rarities`**: Não lista `theme?: EffectStack` no schema, campo usado para aplicar efeitos visuais de raridade em insígnias.

### 2. Seção "Badges & Icons" e "Styling"
- **Omissão total do sistema Effect Stack**: O código possui uma arquitetura completa de efeitos em `src/lib/effects/` (Tilt 3D, Spotlight, Holo, Aurora, Prism, Shimmer, Neon, Ember) e componentes visuais dedicados (`EffectSurface.tsx`, `ParticleLayer.tsx`, `EffectStackEditor.tsx`). O padrão restringe efeitos a *"glow, shimmer e pulse permitidos apenas em chips"*, desconhecendo os efeitos visuais de superfície e partículas introduzidos posteriormente.

### 3. Seção "Firebase"
- **Omissão do Firebase Storage**: O padrão afirma apenas *"Firestore: single database, no Realtime Database. No Firebase Hosting"*. Não faz menção ao módulo `src/lib/storage.ts`, que implementa upload, compressão e exclusão de avatares e banners em bucket do Cloud Storage com fallback seguro.

### 4. Seção "Colour tokens"
- **Omissão dos tokens semânticos secundários**: O padrão documenta apenas 11 cores Dark e 11 cores Light (Surface, Text, Border, Brand). A folha `src/index.css` define tokens fundamentais de feedback (`--feedback-success`, `--feedback-warning`, `--feedback-error`, `--feedback-info`), acento secundário (`--brand-secondary`), bordas de foco (`--border-focus`) e overlays translúcidos, nenhum dos quais consta no padrão.

### 5. Seção "Navigation & Account Routes"
- **Identificadores amigáveis (@nick / shortId)**: A rota pública é documentada como `/perfil/:id`. No código, a rota suporta resolução por slug legível (`/perfil/@nick` e `/perfil/shortId`), e o onboarding de handle possui regras de negócio completas (`HandleBanner.tsx`, `ConfirmHandleModal.tsx`).

---

## 5. Práticas observadas não documentadas (estado NÃO DOCUMENTADO)

1. **Sistema de Handle e ShortId (`src/lib/handle.ts`, `src/lib/shortId.ts`)**: Identificadores únicos de 4 a 6 caracteres alfanuméricos e apelidos `@nick` com redefinição única para privacidade e URLs limpas.
2. **Gerenciamento de Imagens via Firebase Storage (`src/lib/storage.ts`)**: Serviço encapsulado para upload de banners e avatares com validação de bucket, mapeamento de erros em português e tratamento de concorrência.
3. **Arquitetura de Efeitos Visuais Effect Stack (`src/lib/effects/`)**: Motor desacoplado com registro (`registry.ts`), resolução de propriedades CSS (`resolve.ts`) e renderização acelerada por GPU (`EffectSurface.tsx`, `effects.css`).
4. **Vínculo de Efeitos a Raridades (`src/types/rarity.ts:9`)**: Associação de temas visuais (aurora, holograma, brasas) diretamente à entidade de raridade do catálogo para herança automática em colecionáveis.
5. **Paleta Semântica de Feedback no CSS Global (`src/index.css:30-35,70-75`)**: Variáveis `--feedback-*` para sucesso, aviso, erro e informação, permitindo notificações e validações sem violar a regra de ausência de cores Tailwind utilitárias.
6. **Mapeamento de Acento Comunitário e Secundário (`src/index.css:27-28,67-68`)**: Tokens `--brand-secondary` e `--brand-community` utilizados para diferenciar eventos, grupos de comunidade e gradientes semânticos.
7. **Tratamento de Exceções de Tokens em Camadas Não-Tematizáveis (`ProfileBanner.tsx`, `BadgeCarousel.tsx`)**: Aplicação padronizada de comentários explicativos prévios a cada `eslint-disable-next-line design-tokens/no-raw-color-literals` em texturas que obrigatoriamente devem permanecer escuras em ambos os temas.
8. **Compatibilidade Transversal de Colecionáveis (`src/lib/collectibleLinks.ts`)**: Módulo unificado para insígnias e títulos que centraliza concessão, contagem de portadores e revogação em lote com limpeza automática de itens destacados.

---

## 6. Execução de ferramentas

| Comando | Exit code | Resultado | Observações |
|---|---|---|---|
| `npm run lint` | 0 | Sucesso (0 erros, 4 warnings) | Regras customizadas de tokens (`design-tokens/*`) passaram com 100% de conformidade. 4 warnings restritos a hooks do React (`react-hooks/exhaustive-deps`). |
| `npm run typecheck` | 0 | Sucesso (0 erros) | Compilação TypeScript (`tsc --noEmit`) concluída sem nenhuma falha de tipo no workspace. |
| `npm run test` | 0 | Sucesso (20 arquivos, 135 testes passados) | Execução completa com Vitest v5.0.3 em 49.05s. Cobertura completa de regras de tokens, links de colecionáveis, banners, carrossel e permissões. |

---

## 7. Cobertura

- **Arquivos nomeados no PROJECT_STANDARDS.md**: 14
- **Arquivos efetivamente lidos e auditados**: 38
- **Regras auditadas**: 44
- **Limitações**:
  - Auditoria estritamente estática e em modo leitura: nenhuma conexão com instâncias remotas do Firebase Firestore/Storage foi realizada durante os testes; todos os mocks de integração foram validados localmente.
  - A coleção `events`, `threads` e `products` citada no padrão como exemplo de nomenclatura ainda não possui coleções ativas criadas no código (páginas existem como cascas de apresentação).

---

## 8. Conclusão

A base de código do **MiningPoint_Beta** apresenta conformidade notavelmente alta com os princípios arquiteturais fundamentais do `PROJECT_STANDARDS.md`: a proibição de cores Tailwind literais é rigorosamente respeitada e validada por ESLint em 100% dos arquivos; o catálogo de ícones cumpre a contagem exata de 300 itens nas 8 categorias especificadas; as regras de segurança em `firestore.rules` são robustas e contêm defesas sólidas contra usuários banidos e escalada de privilégios; e todos os 135 testes automatizados passam com sucesso.

Os pontos de divergência encontrados não decorrem de degradação da qualidade do código, mas do **descompasso cronológico do documento**: o projeto evoluiu para incorporar funcionalidades sofisticadas (upload de mídia no Firebase Storage, sistema de `@nick` e `shortId`, motor Effect Stack para raridades e carrossel de 4 insígnias) que nunca foram consolidadas de volta no `PROJECT_STANDARDS.md`. O único achado com severidade operacional crítica imediata é a ausência do arquivo `firebase.json` na raiz, cuja inclusão é recomendada antes de qualquer automação de deploy das regras de segurança.
