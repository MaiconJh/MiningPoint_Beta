# Plano de Atualização do PROJECT_STANDARDS.md

Este documento estabelece o plano de edição estruturado e executável para alinhar o `PROJECT_STANDARDS.md` com o código e arquitetura vigentes do workspace `MiningPoint_Beta`, derivado da matriz de correção (`audit/correction-matrix.md`).

---

## Resumo de Contagem

- **Total de itens mapeados:** 16
- **Itens `DOC` prontos para aplicação:** 9 (ND-01, ND-02, ND-03, ND-04, ND-05, ND-06, ND-07, ND-08, R-08)
- **Itens `PENDENTE` (bloqueados por decisão):** 2 (R-02, R-03)
- **Itens `CÓDIGO` fora de escopo (apenas registro):** 5 (R-01, R-04, R-05, R-06, R-07)

---

## Propostas de Atualização por Seção

### 1. Seção `## Firebase`

#### Item 1.1 — Suporte ao Firebase Storage para mídia de perfil
- **ID de origem:** `ND-02`
- **Seção do documento:** `## Firebase`
- **Trecho atual:**
> Firestore: single database, no Realtime Database. No Firebase Hosting.
> Hosting and deploy are decided separately.
- **Trecho proposto:**
> Firestore: single database, no Realtime Database. No Firebase Hosting.
> Storage: Firebase Storage for user avatars and banners only via `src/lib/storage.ts`.
> Hosting and deploy are decided separately.
- **Justificativa:** Documenta o módulo ativo de armazenamento e upload de imagens no Cloud Storage, ausente na especificação original.
- **Pré-requisito:** `—`

#### Item 1.2 — [PENDENTE] Política de configuração do Firebase e fallback para JSON
- **ID de origem:** `R-03`
- **Seção do documento:** `## Firebase`
- **Trecho atual:**
> Never store secrets in the client. Firebase config comes from the
> environment, never hardcoded.
- **Trecho proposto:**
*(Pendente de definição pelo dono do produto — ver seção "Bloqueados por decisão" no final)*
- **Justificativa:** Define se o fallback para `firebase-applet-config.json` em ambientes preview é uma exceção aceita no padrão ou deve ser removido do código.
- **Pré-requisito:** Decisão em `R-03`

---

### 2. Seção `## Firestore schema`

#### Item 2.1 — Inclusão de campos de identificação amigável e banner no perfil do usuário
- **ID de origem:** `ND-01`
- **Seção do documento:** `## Firestore schema` (`users/{uid}`)
- **Trecho atual:**
```
users/{uid}
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  primaryGroupId: string         // required, drives the badge
```
- **Trecho proposto:**
```
users/{uid}
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  bannerUrl: string | null       // null by default, uploaded via Firebase Storage
  shortId: string                // unique 4-6 char alphanumeric identifier
  handle: string | null          // user @nick, unique, null until set
  hasRedefinedHandle: boolean    // default false, allows exactly 1 self-service rename
  primaryGroupId: string         // required, drives the badge
```
- **Justificativa:** Reflete os campos do sistema de `@nick` e banners amplamente implementados em `UserProfile` e componentes de conta.
- **Pré-requisito:** `—`

#### Item 2.2 — [PENDENTE] Harmonização do teto de insígnias destacadas (`featuredBadges`)
- **ID de origem:** `R-02`
- **Seção do documento:** `## Firestore schema` (`users/{uid}`)
- **Trecho atual:**
```
  featuredBadges: string[]       // [] by default, max 8
```
- **Trecho proposto:**
*(Pendente de definição pelo dono do produto — ver seção "Bloqueados por decisão" no final)*
- **Justificativa:** Resolve a divergência entre a linha 85 (máx 8), a linha 239 (máx 4) e a restrição da interface de edição (`ProfileEditPanel.tsx`).
- **Pré-requisito:** Decisão em `R-02`

#### Item 2.3 — Suporte a `chipStyle` na coleção de grupos
- **ID de origem:** `ND-08`
- **Seção do documento:** `## Firestore schema` (`groups/{groupId}`)
- **Trecho atual:**
```
groups/{groupId}
  name: string                    // "Visitante", "Membro", "VIP", "Admin"
  description: string
  color: string                   // hex code for badges and highlights
  priority: number                // 0-100 authority order
  isStaff: boolean                // access permission to /admin
  isDefault: boolean              // default for new users (only 1 default)
  permissions: {
```
- **Trecho proposto:**
```
groups/{groupId}
  name: string                    // "Visitante", "Membro", "VIP", "Admin"
  description: string
  color: string                   // hex code for badges and highlights
  chipStyle?: ChipStyle           // optional custom badge/chip styling overrides
  priority: number                // 0-100 authority order
  isStaff: boolean                // access permission to /admin
  isDefault: boolean              // default for new users (only 1 default)
  permissions: {
```
- **Justificativa:** Alinha o schema declarado de grupos com a tipagem `Group.chipStyle` e com a própria regra da linha 251 da seção "Chip system".
- **Pré-requisito:** `—`

#### Item 2.4 — Inclusão de tema visual de raridade (`theme?: EffectStack`)
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
  theme?: EffectStack             // optional visual preset/stack (holo, aurora, ember, etc.)
  createdAt: timestamp
  createdBy: string
```
- **Justificativa:** Documenta o campo utilizado para aplicar estilos dinâmicos de raridade em insígnias vinculadas.
- **Pré-requisito:** `—`

---

### 3. Seção `## Styling`

#### Item 3.1 — Especificação da fundação visual Effect Stack
- **ID de origem:** `ND-03`
- **Seção do documento:** `## Styling`
- **Trecho atual:**
> CSS custom properties in the global CSS file, exclusively for the colour and
> theme system. Colours defined in :root. Never use Tailwind colour utilities
> directly (no bg-slate-900, no text-blue-500).
- **Trecho proposto:**
> CSS custom properties in the global CSS file, exclusively for the colour and
> theme system. Colours defined in :root. Never use Tailwind colour utilities
> directly (no bg-slate-900, no text-blue-500).
>
> Effect Stack system (`src/lib/effects/`, `src/styles/effects.css`):
> High-performance GPU-accelerated visual effects (tilt, spotlight, holo, aurora,
> prism, shimmer, neon, ember) restricted to `transform`, `opacity`, and CSS variable
> color mixing. Permitted on designated surfaces (`<EffectSurface>`, rarity badges,
> banners) with mandatory `@media (prefers-reduced-motion: reduce)` fallbacks.
- **Justificativa:** Integra formalmente ao padrão a arquitetura de efeitos visuais criada em `src/lib/effects/` e `src/styles/effects.css`.
- **Pré-requisito:** `—`

#### Item 3.2 — Política de exceções para tokens de design com comentários inline
- **ID de origem:** `ND-07`
- **Seção do documento:** `## Styling`
- **Trecho atual:**
"não existe"
- **Trecho proposto:**
> Design token exceptions:
> Surfaces that must remain dark regardless of active theme (e.g., banner backdrops,
> high-contrast media overlays in `ProfileBanner.tsx` and `BadgeCarousel.tsx`) may carry
> raw color literals exclusively via inline ESLint disables with an immediate preceding
> justification comment:
> `/* Sombreado fixo independente de tema para legibilidade */`
> `/* eslint-disable-next-line design-tokens/no-raw-color-literals */`
- **Justificativa:** Formaliza a prática exigida pelas regras locais do ESLint para camadas decorativas que não suportam inversão no tema claro.
- **Pré-requisito:** `—`

---

### 4. Seção `## Badges & Icons`

#### Item 4.1 — Consolidação do módulo unificado `userCollectibles`
- **ID de origem:** `ND-08`
- **Seção do documento:** `## Badges & Icons`
- **Trecho atual:**
> Badge grant/revoke flow:
>   - Admin grants a badge to a user from `/admin/insignias/:badgeId`.
>   - Creates a doc in `userCollectibles/${userId}_badge_${badgeId}` with `userId`, `kind: 'badge'`, `itemId: badgeId`, `awardedAt: serverTimestamp()`, `awardedBy: adminUid`.
>   - Admin revoking a badge deletes the `userCollectibles/${userId}_badge_${badgeId}` doc.
- **Trecho proposto:**
> Collectible grant/revoke architecture (`src/lib/collectibleLinks.ts`):
>   - Unified management for both badges and titles under `userCollectibles/{userId}_{kind}_{itemId}`.
>   - Grant operations persist `userId`, `kind`, `itemId`, `awardedAt`, and `awardedBy`.
>   - Revoke operations remove the document and automatically clear user showcase references:
>     revoking a badge strips it from `users/{uid}.featuredBadges`; revoking a title resets
>     `users/{uid}.featuredTitleId` to null if currently displayed.
- **Justificativa:** Esclarece a automação de limpeza de destaques executada centralizadamente em `collectibleLinks.ts` ao revogar itens.
- **Pré-requisito:** `—`

---

### 5. Seção `## Navigation & Account Routes`

#### Item 5.1 — Rota de perfil público amigável com suporte a slugs (`/perfil/:slug`)
- **ID de origem:** `R-08`
- **Seção do documento:** `## Navigation & Account Routes`
- **Trecho atual:**
> - `/perfil/:id` — Public profile view for any user.
- **Trecho proposto:**
> - `/perfil/:slug` — Public profile view resolving transparently by user UID, `@nick` handle, or unique `shortId`.
- **Justificativa:** Atualiza a assinatura da rota para coincidir com a implementação real em `App.tsx` e `PublicProfile.tsx`.
- **Pré-requisito:** `—`

---

### 6. Seção `## Colour tokens`

#### Item 6.1 — Inclusão de tokens semânticos de feedback
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
  Brand      #8BD0EF  #BDDCEB  #E8D3B0
  Feedback   #4ADE80 (success)  #FBBF24 (warning)  #F87171 (error)  #60A5FA (info)

Light:
  Surface    #F7F7F8  #EFF0F0  #FCFCFD
  Text       #272C35  #545E6E  #9DA4AF
  Border     #DEE0E2  #EFF0F0
  Brand      #177CE8  #0F80B3  #A9762D
  Feedback   #16A34A (success)  #D97706 (warning)  #DC2626 (error)  #2563EB (info)
```
- **Justificativa:** Registra formalmente os tokens `--feedback-*` vigentes em `src/index.css` utilizados em toasts, alertas e chips.
- **Pré-requisito:** `—`

#### Item 6.2 — Inclusão de tokens complementares de acento e bordas
- **ID de origem:** `ND-06`
- **Seção do documento:** `## Colour tokens`
- **Trecho atual:**
"não existe"
- **Trecho proposto:**
> Secondary tokens defined in `:root` and `[data-theme="light"]`:
> - `--brand-secondary`: `#B2E6E1` (Dark) / `#108A80` (Light)
> - `--border-strong`: `#9DA4AF` (Dark) / `#C2C6CC` (Light)
> - `--border-focus`: `#BDDCEB` (Dark) / `#BED3E9` (Light)
> - `--text-inverse`: `#1A1D23` (Dark) / `#FCFCFD` (Light)
- **Justificativa:** Documenta variáveis essenciais de contraste, foco e marcas secundárias presentes no CSS global e ausentes do texto do padrão.
- **Pré-requisito:** `—`

---

## Bloqueados por decisão

Esta seção reúne os itens cuja resolução depende de resposta mandatória do dono do produto antes de qualquer alteração no `PROJECT_STANDARDS.md`.

### Decisão R-02: Teto de insígnias destacadas (`featuredBadges`)
- **Pergunta ao dono do produto:**
  Qual é o número máximo definitivo de insígnias que um usuário pode destacar no perfil (`featuredBadges`)?
- **Contexto da contradição:**
  - A linha 85 do `PROJECT_STANDARDS.md` estipula `max 8`.
  - A linha 239 do próprio `PROJECT_STANDARDS.md` estipula *"choose up to 4 featured badges in /conta/perfil"*.
  - A interface de usuário em `src/components/account/ProfileEditPanel.tsx:151,383,393` trava o limite rígido em 4.
  - O carrossel visual no banner (`BadgeCarousel.tsx`) é dimensionado espacialmente para 4 slots.
- **Opções disponíveis:**
  - **Opção A (Recomendada):** Fixar em **4 insígnias**. Altera a linha 85 do `PROJECT_STANDARDS.md` de `max 8` para `max 4`, mantendo o código atual 100% inalterado.
  - **Opção B:** Fixar em **8 insígnias**. Mantém a linha 85 do documento, corrige a linha 239 do documento e exige tarefa de `CÓDIGO` para refatorar `ProfileEditPanel.tsx` e o layout responsivo de `BadgeCarousel.tsx`.

---

### Decisão R-03: Política de credenciais do Firebase e arquivo JSON em preview
- **Pergunta ao dono do produto:**
  Como o padrão deve governar a fonte de credenciais do Firebase SDK no cliente?
- **Contexto da divergência:**
  - O `PROJECT_STANDARDS.md` (linhas 60-61) proíbe configurações fixas: *"Firebase config comes from the environment, never hardcoded"*.
  - O código em `src/lib/firebase.ts:7-13` realiza fallback automático para `firebase-applet-config.json` caso variáveis `VITE_*` não existam, garantindo que o applet funcione imediatamente no runtime AI Studio.
- **Opções disponíveis:**
  - **Opção A (Recomendada):** Formalizar o fallback como exceção permitida no `PROJECT_STANDARDS.md`: *"Firebase config is loaded from VITE_* environment variables, falling back to firebase-applet-config.json for AI Studio preview runtime environments"*.
  - **Opção B:** Reafirmar a exigência estrita de ambiente no documento e abrir uma tarefa de `CÓDIGO` para remover a importação de `firebase-applet-config.json` em `src/lib/firebase.ts`, exigindo `.env` provisionado.

---

## Fora de escopo (registro)

Os itens abaixo foram classificados como `CÓDIGO` na matriz de correção. Eles não alteram o `PROJECT_STANDARDS.md` e estão registrados aqui apenas para rastreabilidade de backlog técnico:

1. **R-01:** Criação do arquivo de manifesto `firebase.json` na raiz do repositório para viabilizar deploy CLI de `firestore.rules`.
2. **R-04:** Implementação da chamada `deleteField()` em rotina de migração para expurgar fisicamente o campo obsoleto `groupId` dos documentos de `users`.
3. **R-05:** Renomeação da chave de localStorage de `mp.tema` para `mp.theme` em `src/context/ThemeContext.tsx` e `index.html`.
4. **R-06:** Ajuste em `src/components/NavBar.tsx:34` para ocultar o ícone da engrenagem quando o administrador estiver com status `isBanned === true`.
5. **R-07:** Substituição da palavra-chave literal `white` por variável de tema semântica em regras de faísca de `src/styles/effects.css`.
