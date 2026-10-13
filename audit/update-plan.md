# Plano de Atualização do PROJECT_STANDARDS.md

Este documento estabelece o plano de edição estruturado e executável para alinhar o `PROJECT_STANDARDS.md` com o código e arquitetura vigentes do workspace `MiningPoint_Beta`, derivado da matriz de correção (`audit/correction-matrix.md`).

---

## Resumo de Contagem

- **Total de itens mapeados:** 16
- **Itens aplicados e corrigidos:** 16 (11 do PROJECT_STANDARDS.md + 5 do backlog técnico de código)
- **Itens de código resolvidos:** 5 (R-01, R-04, R-05, R-06, R-07)
- **Itens pendentes:** 0

---

## Propostas de Atualização por Seção

### 1. Seção `## Firebase`

#### [CORRIGIDO] Item 1.1 — Suporte ao Firebase Storage para mídia de perfil
- **ID de origem:** `ND-02`
- **Seção do documento:** `## Firebase`
- **Trecho atual:**
> Firestore: single database, no Realtime Database. No Firebase Hosting.
> Hosting and deploy are decided separately.
- **Trecho proposto:**
> Firestore: single database, no Realtime Database. No Firebase Hosting.
> Hosting and deploy are decided separately.
>
> Firebase Storage:
>   Dedicated client module (`src/lib/storage.ts`) for profile assets (avatars
>   and banners). Covers upload, compression, deletion, and friendly error mapping.
- **Justificativa:** Documenta o módulo ativo de armazenamento e upload de imagens no Cloud Storage, ausente na especificação original.
- **Pré-requisito:** `—`

#### [CORRIGIDO — decisão: aceitar fallback] Item 1.2 — Política de configuração do Firebase e fallback para JSON
- **ID de origem:** `R-03`
- **Seção do documento:** `## Firebase`
- **Trecho atual:**
> Never store secrets in the client. Firebase config comes from the
> environment, never hardcoded.
- **Trecho proposto:**
> Never store secrets in the client. Firebase config comes from the
> environment, never hardcoded. In AI Studio preview runtime environments,
> falling back to `firebase-applet-config.json` when `VITE_*` variables are
> not injected is permitted.
- **Justificativa:** Documenta a exceção permitida para ambientes de preview onde variáveis `VITE_*` não estão injetadas (Decisão D2).
- **Pré-requisito:** Decisão D2 (aceitar fallback)

---

### 2. Seção `## Firestore schema`

#### [CORRIGIDO] Item 2.1 — Subseção Handle & ShortId e campos de identificação amigável no perfil
- **ID de origem:** `ND-01`
- **Seção do documento:** `## Navigation & Account Routes` / `## Firestore schema`
- **Trecho atual:**
"não existe"
- **Trecho proposto:**
> Handle & ShortId:
>   - Every user is assigned a unique alphanumeric shortId (`src/lib/shortId.ts`).
>   - Users may claim a unique `@nick` handle (`src/lib/handle.ts`) with a single self-service redefinition.
>   - Public profile routes (`/perfil/:slug`) resolve transparently against UID, `@nick`, or `shortId`.
- **Justificativa:** Reflete o sistema de identificadores amigáveis `@nick` e `shortId` implementado no perfil e rotas públicas.
- **Pré-requisito:** `—`

#### [CORRIGIDO — decisão: max 4] Item 2.2 — Harmonização do teto de insígnias destacadas (featuredBadges)
- **ID de origem:** `R-02`
- **Seção do documento:** `## Firestore schema` (`users/{uid}`)
- **Trecho atual:**
```
  featuredBadges: string[]       // [] by default, max 8
```
- **Trecho proposto:**
```
  featuredBadges: string[]       // [] by default, max 4
```
- **Justificativa:** Alinha o schema na linha 85 com a linha 239 do documento e com a restrição de UI em `ProfileEditPanel.tsx` (Decisão D1).
- **Pré-requisito:** Decisão D1 (max 4)

#### [CORRIGIDO] Item 2.3 — Suporte a chipStyle na coleção de grupos
- **ID de origem:** `ND-07`
- **Seção do documento:** `## Firestore schema` (`groups/{groupId}`)
- **Trecho atual:**
```
groups/{groupId}
  name: string                    // "Visitante", "Membro", "VIP", "Admin"
  description: string
  color: string                   // hex code for badges and highlights
  priority: number                // 0-100 authority order
```
- **Trecho proposto:**
```
groups/{groupId}
  name: string                    // "Visitante", "Membro", "VIP", "Admin"
  description: string
  color: string                   // hex code for badges and highlights
  chipStyle?: ChipStyle           // optional custom badge/chip styling overrides
  priority: number                // 0-100 authority order
```
- **Justificativa:** Alinha o schema declarado de grupos com a tipagem `Group.chipStyle` e com a regra da linha 251 da seção "Chip system".
- **Pré-requisito:** `—`

#### [CORRIGIDO] Item 2.4 — Inclusão de tema visual de raridade (theme?: EffectStack)
- **ID de origem:** `ND-04`
- **Seção do documento:** `## Firestore schema` (`rarities/{rarityId}`)
- **Trecho atual:**
```
rarities/{rarityId}
  label: string                   // "Comum", "Rara", "Lendária"
  color: string                   // hex code para highlight da raridade
  order: number                   // 0-999 ordem de exibição/hierarquia
  createdAt: timestamp
  createdBy: string
```
- **Trecho proposto:**
```
rarities/{rarityId}
  label: string                   // "Comum", "Rara", "Lendária"
  color: string                   // hex code para highlight da raridade
  order: number                   // 0-999 ordem de exibição/hierarquia
  theme?: EffectStack             // optional visual theme preset/stack
  createdAt: timestamp
  createdBy: string
```
- **Justificativa:** Documenta o campo utilizado para aplicar temas visuais de raridade em insígnias vinculadas.
- **Pré-requisito:** `—`

---

### 3. Seção `## Badges & Icons`

#### [CORRIGIDO] Item 3.1 — Especificação da fundação visual Effect Stack em Badges & Icons
- **ID de origem:** `ND-03`
- **Seção do documento:** `## Badges & Icons`
- **Trecho atual:**
"não existe"
- **Trecho proposto:**
> Effect Stack:
>   - 8 GPU-accelerated visual effects defined in `src/lib/effects/` and `src/styles/effects.css`:
>     tilt, spotlight, holo, aurora, prism, shimmer, neon, ember.
>   - Restricts animations to `transform`, `opacity`, and CSS variable color mixing.
>   - Permitted on designated surfaces (`<EffectSurface>`), rarity badge themes, and banners.
>   - Disabled under `@media (prefers-reduced-motion: reduce)`.
- **Justificativa:** Integra formalmente ao padrão a arquitetura de 8 efeitos visuais em Badges & Icons sem duplicação de seções.
- **Pré-requisito:** `—`

#### [CORRIGIDO] Item 3.2 — Consolidação do módulo unificado collectibleLinks
- **ID de origem:** `ND-08`
- **Seção do documento:** `## Badges & Icons`
- **Trecho atual:**
"não existe"
- **Trecho proposto:**
> collectibleLinks:
>   - Unified module (`src/lib/collectibleLinks.ts`) managing badges and titles under `userCollectibles/{userId}_{kind}_{itemId}`.
>   - Grants persist `userId`, `kind`, `itemId`, `awardedAt`, and `awardedBy`.
>   - Revocations delete the link and automatically clear showcase references (`featuredBadges` or `featuredTitleId`).
- **Justificativa:** Formaliza a arquitetura unificada de colecionáveis e a automação de limpeza de destaques ao revogar itens.
- **Pré-requisito:** `—`

---

### 4. Seção `## Navigation & Account Routes`

#### [CORRIGIDO] Item 4.1 — Rota de perfil público amigável com suporte a slugs (/perfil/:slug)
- **ID de origem:** `R-08`
- **Seção do documento:** `## Navigation & Account Routes`
- **Trecho atual:**
> - `/perfil/:id` — Public profile view for any user.
- **Trecho proposto:**
> - `/perfil/:slug` — Public profile view resolving transparently by user UID, @nick handle, or shortId.
- **Justificativa:** Atualiza a assinatura da rota pública para refletir a resolução real por slug em `App.tsx` e `PublicProfile.tsx`.
- **Pré-requisito:** `—`

---

### 5. Seção `## Colour tokens`

#### [CORRIGIDO] Item 5.1 — Inclusão de tokens semânticos de feedback
- **ID de origem:** `ND-05`
- **Seção do documento:** `## Colour tokens`
- **Trecho atual:**
```
Dark:
  Surface    #272C35  #38404C  #545E6E
  Text       #F7F7F8  #C2C6CC  #768193
  Border     #545E6E  #38404C
  Brand      #8BD0EF  #BDDCEB  #E8D3B0

Light:
  Surface    #F7F7F8  #EFF0F0  #FCFCFD
  Text       #272C35  #545E6E  #9DA4AF
  Border     #DEE0E2  #EFF0F0
  Brand      #177CE8  #0F80B3  #A9762D
```
- **Trecho proposto:**
```
Dark:
  Surface    #272C35  #38404C  #545E6E
  Text       #F7F7F8  #C2C6CC  #768193
  Border     #545E6E  #38404C
  Brand      #8BD0EF  #BDDCEB  #B2E6E1 (secondary)  #E8D3B0 (community)
  Feedback   #4ADE80 (success)  #FBBF24 (warning)  #F87171 (error)  #60A5FA (info)

Light:
  Surface    #F7F7F8  #EFF0F0  #FCFCFD
  Text       #272C35  #545E6E  #9DA4AF
  Border     #DEE0E2  #EFF0F0
  Brand      #177CE8  #0F80B3  #108A80 (secondary)  #A9762D (community)
  Feedback   #16A34A (success)  #D97706 (warning)  #DC2626 (error)  #2563EB (info)
```
- **Justificativa:** Registra formalmente os tokens `--feedback-*` vigentes em `src/index.css`.
- **Pré-requisito:** `—`

#### [CORRIGIDO] Item 5.2 — Inclusão de tokens complementares de marca secundária e comunitária
- **ID de origem:** `ND-06`
- **Seção do documento:** `## Colour tokens`
- **Trecho atual:**
```
  Brand      #8BD0EF  #BDDCEB  #E8D3B0
```
- **Trecho proposto:**
```
  Brand      #8BD0EF  #BDDCEB  #B2E6E1 (secondary)  #E8D3B0 (community)
```
- **Justificativa:** Documenta explicitamente `--brand-secondary` (`#B2E6E1` / `#108A80`) e `--brand-community` (`#E8D3B0` / `#A9762D`) na tabela de tokens.
- **Pré-requisito:** `—`

---

## Decisões resolvidas

As duas decisões pendentes foram deliberadas pelo dono do produto:

- **Decisão R-02 (Teto de `featuredBadges`):** Resolvida como `max 4` (Decisão D1). A linha 85 do `PROJECT_STANDARDS.md` foi atualizada de `max 8` para `max 4`, alinhando-se com a linha 239 e com a trava da interface em `ProfileEditPanel.tsx`.
- **Decisão R-03 (Fallback de credenciais Firebase):** Resolvida como `aceitar fallback` (Decisão D2). O documento agora formaliza o fallback para `firebase-applet-config.json` em ambientes de preview do AI Studio como exceção permitida.

---

## Backlog técnico de código (resolvido)

Os itens abaixo foram classificados como `CÓDIGO` na matriz de correção original e não alteravam o `PROJECT_STANDARDS.md`. Todos foram plenamente implementados, testados e concluídos no código-fonte:

1. **[CORRIGIDO] R-01:** Criação do arquivo de manifesto `firebase.json` na raiz do repositório vinculando `firestore.rules` para viabilizar deploy CLI.
2. **[CORRIGIDO] R-04:** Implementação da rotina administrativa `backfillPrimaryGroupId` em `src/lib/users.ts` com chamada a `deleteField()` para expurgar fisicamente o campo obsoleto `groupId`, com interface administrativa em `AdminConfig.tsx` e testes unitários.
3. **[CORRIGIDO] R-05:** Renomeação da chave de localStorage de `mp.tema` para `mp.theme` em `src/context/ThemeContext.tsx` e `index.html`.
4. **[CORRIGIDO] R-06:** Ajuste em `src/components/NavBar.tsx:34` para ocultar o ícone da engrenagem quando o administrador estiver com status `isBanned === true`.
5. **[CORRIGIDO] R-07:** Formalização do padrão `TOKEN-EXCEPTION` para exceções visuais legítimas e retrofit em `effects.css`, `ProfileBanner.tsx` e `BadgeCarousel.tsx`.

---

## [O QUE FOI MODIFICADO]

Lista de elementos alterados no PROJECT_STANDARDS.md e a abordagem de decisão adotada.

| ID | Elemento alterado | Abordagem de decisão |
|---|---|---|
| R-02 | Teto de `featuredBadges` (linha 85) | Reduzido de 8 para 4, alinhando com a linha 239 e com `ProfileEditPanel.tsx` |
| R-03 | Seção Firebase | Parágrafo adicionado documentando o fallback `firebase-applet-config.json` como exceção permitida para preview do AI Studio |
| R-08 | Seção Navigation | Rota `/perfil/:id` → `/perfil/:slug` |
| ND-01 | Nova subseção Handle & ShortId | Documenta `src/lib/handle.ts` e `src/lib/shortId.ts` |
| ND-02 | Nova subseção Firebase Storage | Documenta `src/lib/storage.ts` |
| ND-03 | Nova subseção Effect Stack | Documenta os 8 efeitos e a regra de aplicação |
| ND-04 | Firestore schema → rarities | Adicionado `theme?: EffectStack` |
| ND-05 | Colour tokens | Adicionados tokens `--feedback-*` |
| ND-06 | Colour tokens | Adicionados tokens `--brand-secondary` e `--brand-community` |
| ND-07 | Firestore schema → groups | Adicionado `chipStyle?: ChipStyle` |
| ND-08 | Nova subseção collectibleLinks | Documenta `src/lib/collectibleLinks.ts` |

Todos os itens do plano foram concluídos (11 documentais e 5 de código). Nenhum item permanece pendente.
