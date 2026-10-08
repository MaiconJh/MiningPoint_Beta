
# PROJECT_STANDARDS.md

Standards for MiningPoint. Read before any change.

## Language

Code in English, interface in Portuguese.

English: file names, folders, components, functions, variables, types, hooks,
comments, utility classes, storage keys.

Portuguese: rendered text, labels, placeholders, aria-label, alt, title,
meta description.

Never translate an identifier. Never write a visible string in English.

## Styling

Tailwind utility classes for layout, typography, flexbox, grid and structure.

CSS custom properties in the global CSS file, exclusively for the colour and
theme system. Colours defined in :root. Never use Tailwind colour utilities
directly (no bg-slate-900, no text-blue-500).

## Content

A page shows real content or shows nothing. It never explains what it will be.

Forbidden in any visible string: "demonstração", "prévia", "em construção",
"em breve", "fictício", "simulado", "mock", "valores de demonstração",
"site em desenvolvimento", "conteúdo de demonstração".

Comments may explain technical decisions. Visible strings may not.

## Scope

Read before writing. Read a file's current content before editing it.

If a change requires editing more than 5 files, list them all before
proceeding.

Never recreate a file that was not named in the request. Never reformat
neighbouring files.

Before creating a component, check whether one already exists that solves it.

## Firebase

Auth: Google provider only. No email/password, no magic link, no anonymous.
Firestore: single database, no Realtime Database. No Firebase Hosting.
Hosting and deploy are decided separately.

Firestore collections are lowercase plural English: users, events, threads,
products. Field names are lowercase camelCase English.

Security rules are required for every collection. Never leave a collection
with default-allow. Read rules and write rules are explicit.

Never store secrets in the client. Firebase config comes from the
environment, never hardcoded.

## Firestore schema

users/{uid}
  uid: string
  displayName: string
  email: string
  photoURL: string | null
  primaryGroupId: string         // required, drives the badge
  secondaryGroupIds: string[]    // optional, default []
  isStaff: boolean               // derived, true if ANY user group has isStaff === true
  effectivePermissions: {        // derived, union across all user groups
    accessPanel: boolean
    manageUsers: boolean
    manageGroups: boolean
    manageBadges: boolean
    manageForum: boolean
    manageContent: boolean
    manageCatalogs: boolean
  }
  bio: string
  featuredTitleId: string | null // null by default, chosen by user
  visibility: 'public' | 'private'  // 'public' by default
  featuredBadges: string[]       // [] by default, max 8
  attributes: {
    exploration: number          // 0-100
    gathering: number
    knowledge: number
    community: number
    endurance: number
    economy: number
  }
  isBanned: boolean              // false by default
  bannedAt: timestamp | null     // null by default
  bannedBy: string | null        // null by default
  createdAt: timestamp

groups/{groupId}
  name: string                    // "Visitante", "Membro", "VIP", "Admin"
  description: string
  color: string                   // hex code for badges and highlights
  priority: number                // 0-100 authority order
  isStaff: boolean                // access permission to /admin
  isDefault: boolean              // default for new users (only 1 default)
  permissions: {
    admin: {
      accessPanel: boolean
      manageUsers: boolean
      manageGroups: boolean
      manageBadges: boolean
      manageForum: boolean
      manageContent: boolean
      manageCatalogs: boolean
    }
    forum: {
      categories: {}
    }
  }
  createdAt: timestamp
  createdBy: string

badges/{badgeId}
  name: string
  description: string
  icon: string
  rarityId: string | null         // ref para rarities/{rarityId}
  categoryId: string | null       // ref para catalogCategories/{categoryId}
  originId: string | null         // ref para origins/{originId}
  collectionId: string | null     // ref para collections/{collectionId}
  order: number                   // 0-999 ordem de exibição/hierarquia
  linkedTitleIds: string[]        // [] por padrão, títulos concedidos junto
  createdAt: timestamp
  createdBy: string

userCollectibles/{userId_kind_itemId}
  userId: string
  kind: 'badge' | 'title'
  itemId: string
  awardedAt: timestamp
  awardedBy: string

icons/{iconId}
  name: string                    // "Picareta cruzada"
  category: CategoryKey           // reuse 8 categories
  tags: string[]                  // 3-6 lowercase tags
  svg: string                     // sanitized SVG markup
  viewBox: string                 // "0 0 24 24"
  createdAt: timestamp
  createdBy: string

titles/{titleId}
  name: string                    // "Pioneiro", "Filho da Profundeza"
  description: string
  color: string                   // hex code for title rendering
  chipStyle?: ChipStyle           // estilos customizados opcionais do chip
  rarityId: string | null         // ref para rarities/{rarityId}
  categoryId: string | null       // ref para catalogCategories/{categoryId}
  originId: string | null         // ref para origins/{originId}
  collectionId: string | null     // ref para collections/{collectionId}
  order: number                   // 0-999 ordem de exibição/hierarquia
  linkedBadgeIds: string[]        // [] por padrão, insígnias concedidas junto
  createdAt: timestamp
  createdBy: string

rarities/{rarityId}
  label: string                   // "Comum", "Rara", "Lendária"
  color: string                   // hex code para highlight da raridade
  order: number                   // 0-999 ordem de exibição/hierarquia
  createdAt: timestamp
  createdBy: string

catalogCategories/{categoryId}
  name: string                    // "Expedição", "Combate", "Social"
  description: string
  order: number                   // 0-999
  createdAt: timestamp
  createdBy: string

origins/{originId}
  name: string                    // "Evento de Inauguração", "Loja"
  description: string
  order: number                   // 0-999
  createdAt: timestamp
  createdBy: string

collections/{collectionId}
  name: string                    // "Série Mineral", "Fundadores"
  description: string
  order: number                   // 0-999
  createdAt: timestamp
  createdBy: string

Reads never throw. Missing fields fall back to defaults defined above.
Migration:
  A user doc that has `groupId` and not `primaryGroupId`:
    primaryGroupId = groupId
    secondaryGroupIds = []
    isStaff = computed from resolved group
    effectivePermissions = computed from resolved group
    Then deletes the obsolete `groupId` field.
Derivation rules:
  isStaff = user's groups.some(g => g.isStaff === true)
  effectivePermissions = OR of every permissions.admin.* across all user groups

## Ban Semantics & Security Rules

- A banned user (`isBanned == true`) can read everything they could read before.
- A banned user cannot write anywhere in Firestore (enforced by `!isBannedUser(uid)` on all write rules).
- A banned admin cannot access the `/admin` control panel.
- On profile self-update, users can only modify profile fields (bio, title, visibility, featuredBadges); updating groups, permissions, staff flag, attributes or ban status requires `manageUsers`.
- Deleting an account in the admin panel removes the user document from `users/{uid}` and all associated `userCollectibles` docs. (Firebase Auth account deletion requires Admin SDK/Cloud Functions, which is beyond client scope).

## Badges & Icons

Icon registry & custom icons:
  - Curated set of 300 Lucide icons across 8 categories:
    general (40), community (35), exploration (40), progress (40),
    items (40), achievements (40), time (30), documents (35).
  - Custom SVG icons created by admin in `/admin/icones` and stored in `icons/{iconId}`.
  - Icon reference formats:
    - `"shield"`: legacy or Lucide slug (no prefix)
    - `"lucide:shield"`: explicit Lucide slug
    - `"custom:iconId"`: custom icon document in `icons/{iconId}`
  - Resolution order via `resolveIcon`:
    1. If `custom:id`, lookup in custom icons cache/collection.
    2. Otherwise, strip `lucide:` prefix and lookup in Lucide registry.
    3. Fallback to `"award"` icon with a single console warning per session.
  - SVG Sanitization Policy (`src/lib/svgSanitizer.ts`):
    - Whitelist validation of tags (`svg`, `g`, `path`, `circle`, `rect`, `ellipse`, `line`, `polyline`, `polygon`, `defs`, `linearGradient`, `radialGradient`, `stop`, `clipPath`, `mask`, `use`) and safe attributes.
    - Max size 20 KB, max 200 elements, max 4000 chars per attribute.
    - Absolute rejection of `<script>`, `<foreignObject>`, `<iframe>`, `on*` event handlers, `style`, `javascript:` protocols, and external `href`s.

Badge grant/revoke flow:
  - Admin grants a badge to a user from `/admin/insignias/:badgeId`.
  - Creates a doc in `userCollectibles/${userId}_badge_${badgeId}` with `userId`, `kind: 'badge'`, `itemId: badgeId`, `awardedAt: serverTimestamp()`, `awardedBy: adminUid`.
  - Admin revoking a badge deletes the `userCollectibles/${userId}_badge_${badgeId}` doc.
  - Users with at least one badge choose up to 4 featured badges in `/conta/perfil` (Insígnias destacadas).
  - Selected badges are saved immediately to `users/{uid}.featuredBadges` and rendered in the profile header carousel.

Title grant/revoke & display flow:
  - Admin manages titles from `/admin/titulos` and grants/revokes from `/admin/titulos/:titleId`.
  - Creates a doc in `userCollectibles/${userId}_title_${titleId}` with `userId`, `kind: 'title'`, `itemId: titleId`, `awardedAt: serverTimestamp()`, `awardedBy: adminUid`.
  - Admin revoking a title deletes the `userCollectibles/${userId}_title_${titleId}` doc.
  - Users with at least one title choose which title to display in `/conta/perfil` (Título exibido).
  - Selected title ID is saved to `users/{uid}.featuredTitleId` and rendered above the user's name in `ProfileHeader` using the title's custom colour.

## Chip system

  Every group and title may carry a `chipStyle` object. When absent, the
  DEFAULT_CHIP_STYLE applies, preserving the historical badge look.

  Chips are rendered by the single `<Chip>` component. Do not create
  per-variant CSS classes for chips.

  Exception to the "nunca neon" rule: glow, shimmer and pulse effects are
  permitted on chips only. They are configured by an admin per item and
  never applied globally. Everywhere else in the interface, the original
  rule holds: subtle shadows, no neon, no animated shine.

## Navigation & Account Routes

- `/perfil` — Authenticated own profile view with 4 tabs: Feed, Sobre, Qualidades, Histórico.
- `/perfil/:id` — Public profile view for any user.
- `/conta` — Account management panel with 240px sub-nav, redirects to `/conta/visao-geral`.
  - `/conta/visao-geral` — Overview info: Grupo, Cargo, Membro desde, Insígnias count.
  - `/conta/perfil` — Self-editing profile info: Bio, Título, Visibilidade, Insígnias destacadas.
  - `/conta/preferencias` — Preferences: Theme selector (Claro / Escuro).
- Navbar Dropdown: Hovering avatar when authenticated opens dropdown menu with Perfil (/perfil), Conta (/conta), and Sair (with divider).
- Admin Gear Icon: Displayed next to avatar button when user has `effectivePermissions.accessPanel === true`, linking to `/admin`.

## Colour tokens

Defined in :root in the global CSS file. Dark is the default theme; light
overrides via [data-theme="light"].

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