<div align="center">

# MiningPoint

**Comunidade de exploração subterrânea: materiais voláteis, expedições, eventos e uma economia própria em MP.**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth_%2B_Firestore-FFCA28?logo=firebase&logoColor=black)
![Status](https://img.shields.io/badge/status-beta-blue)

</div>

> Nas profundezas, cada descoberta abre novas possibilidades. Cada recurso guarda perguntas ainda sem resposta — e cada explorador decide até onde está disposto a ir.

MiningPoint é a plataforma web da comunidade de exploração subterrânea de mesmo nome. A aplicação reúne a identidade de cada membro (perfil público, `@nick`, insígnias e títulos), a governança da comunidade por grupos e permissões, e a base para fórum, eventos, loja e conteúdo editorial.

A interface é escrita em português (pt-BR); o código é escrito em inglês. Essa separação é uma regra do projeto, descrita em [PROJECT_STANDARDS.md](PROJECT_STANDARDS.md).

## Sumário

- [Status atual](#status-atual)
- [Stack](#stack)
- [Requisitos](#requisitos)
- [Como rodar](#como-rodar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Arquitetura](#arquitetura)
- [Rotas](#rotas)
- [Autenticação e perfil](#autenticação-e-perfil)
- [Grupos, permissões e banimento](#grupos-permissões-e-banimento)
- [Insígnias, títulos e ícones](#insígnias-títulos-e-ícones)
- [Modelo de dados](#modelo-de-dados)
- [Segurança](#segurança)
- [Tema e estilos](#tema-e-estilos)
- [Convenções de código](#convenções-de-código)
- [Limitações conhecidas](#limitações-conhecidas)
- [Licença](#licença)

## Status atual

O projeto está em beta: o núcleo de identidade e o painel administrativo estão funcionais, enquanto as áreas de conteúdo ainda são rotas reservadas.

| Área | Estado |
| --- | --- |
| Login com Google e provisionamento automático de perfil | Implementado |
| Perfil próprio e público, com abas, bio, atributos e visibilidade | Implementado |
| `@nick` único, com validação, reserva de nomes e onboarding | Implementado |
| Grupos, permissões derivadas, cargo e banimento | Implementado |
| Insígnias, títulos e ícones SVG customizados (`/admin`) | Implementado |
| Painel admin: usuários, grupos, insígnias, títulos, ícones e manutenção | Implementado |
| Tema escuro (padrão) e claro | Implementado |
| Páginas Sobre, Eventos, Membros, Fórum e Loja | Rota criada, conteúdo pendente |
| Admin: Visão geral, Fórum, Conteúdo e Logs | Rota criada, conteúdo pendente |
| Fórum, eventos e loja funcionais (economia em MP) | Planejado |

## Stack

- **React 19** com **TypeScript** — aplicação de página única, sem framework de metadados.
- **Vite 8** — servidor de desenvolvimento e build; plugin `@tailwindcss/vite`.
- **Tailwind CSS 4** — utilitários de layout e estrutura, complementados por CSS custom properties para cores.
- **React Router 7** — rotas públicas, de conta e do painel administrativo.
- **Framer Motion** (`motion`) — transições de página e microinterações.
- **Firebase 12** — Firebase Auth (provedor Google) e Cloud Firestore como banco único.
- **lucide-react** — origem do registro curado de ícones usado em insígnias, grupos e títulos.

Os pacotes `@google/genai`, `express` e `dotenv` estão declarados nas dependências, mas não são usados pelo código atual em `src/`: a aplicação é hoje totalmente cliente. `GEMINI_API_KEY` e `APP_URL` em [.env.example](.env.example) existem para uma futura camada de servidor, assim como o script `clean`, que remove o `server.js` gerado.

## Requisitos

- **Node.js** 20 ou superior (o projeto foi verificado em Node 24).
- Um gerenciador de pacotes. O repositório versiona `bun.lock`, então o **bun** é a referência; `npm` e `pnpm` também funcionam, mas ignoram esse lockfile.

## Como rodar

```bash
# 1. Instalar as dependências
bun install
# ou: npm install / pnpm install

# 2. Configurar o ambiente (opcional — veja a seção seguinte)
cp .env.example .env

# 3. Subir o servidor de desenvolvimento
bun run dev
```

O servidor sobe em `http://localhost:3000`, com bind em `0.0.0.0` (acessível pela rede local). Para gerar e conferir o build de produção:

```bash
bun run build     # gera dist/
bun run preview   # serve o dist/ localmente
bun run lint      # verificação de tipos (tsc --noEmit)
```

## Variáveis de ambiente

O arquivo [.env.example](.env.example) lista todas as chaves esperadas. As variáveis abaixo sobrescrevem os valores de [firebase-applet-config.json](firebase-applet-config.json), que serve como fallback versionado para o projeto Firebase atual.

| Variável | Descrição |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Chave web do projeto Firebase. |
| `VITE_FIREBASE_AUTH_DOMAIN` | Domínio de autenticação (`*.firebaseapp.com`). |
| `VITE_FIREBASE_PROJECT_ID` | Identificador do projeto Firebase. |
| `VITE_FIREBASE_STORAGE_BUCKET` | Bucket de armazenamento. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID do projeto. |
| `VITE_FIREBASE_APP_ID` | App ID do aplicativo web. |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Nome do banco Firestore nomeado usado pela aplicação. |
| `GEMINI_API_KEY` | Reservada para a futura camada de servidor (Gemini). Não usada hoje. |
| `APP_URL` | URL pública da aplicação. Reservada para a futura camada de servidor. |

A configuração do Firebase é pública por natureza — a proteção real dos dados vem de [firestore.rules](firestore.rules), não do sigilo dessas chaves. Nunca coloque segredos (chaves de serviço, tokens de Admin SDK) em variáveis `VITE_*`: tudo com esse prefixo é embutido no bundle do cliente.

## Scripts

| Script | Comando | O que faz |
| --- | --- | --- |
| `dev` | `vite --port=3000 --host=0.0.0.0` | Servidor de desenvolvimento com HMR. |
| `build` | `vite build` | Build de produção em `dist/`. |
| `preview` | `vite preview` | Serve o build de produção. |
| `lint` | `tsc --noEmit` | Checagem de tipos em todo o projeto. |
| `clean` | `rm -rf dist server.js` | Remove artefatos de build (requer shell Unix, como Git Bash ou WSL). |

Não há suíte de testes configurada no momento; `lint` é a única verificação automatizada e deve passar antes de qualquer commit.

O HMR pode ser desligado definindo `DISABLE_HMR=true`, usado pelo ambiente do AI Studio para evitar recarregamentos durante edições automatizadas ([vite.config.ts](vite.config.ts)).

## Estrutura de pastas

```
MiningPoint_Beta/
├── index.html                    # Shell HTML, meta tags pt-BR e tema inicial
├── vite.config.ts                # Plugins, alias @ e servidor de desenvolvimento
├── tsconfig.json                 # Configuração TypeScript (noEmit)
├── firebase-applet-config.json   # Configuração pública do projeto Firebase (fallback)
├── firebase-blueprint.json       # Blueprint das entidades do Firestore
├── firestore.rules               # Regras de segurança do Firestore
├── metadata.json                 # Metadados do applet (nome, descrição, capacidades)
├── PROJECT_STANDARDS.md          # Padrões obrigatórios — leia antes de alterar código
└── src/
    ├── index.tsx                 # Bootstrap do React
    ├── index.css                 # Tokens de cor, temas e animações globais
    ├── App.tsx                   # Providers, rotas públicas e rotas do painel
    ├── components/               # Componentes de UI agrupados por domínio
    │   ├── account/              # Painel de conta (perfil, @nick, título, visibilidade)
    │   ├── admin/                # Formulários e utilitários do painel administrativo
    │   ├── chip/                 # Componente único <Chip> para grupos e títulos
    │   ├── onboarding/           # Aviso de definição do @nick
    │   ├── profile/              # Cabeçalho, abas, carrossel e visão de perfil
    │   └── skeleton/             # Estados de carregamento
    ├── context/                  # AuthContext, ThemeContext e ToastContext
    ├── data/                     # Navegação e registro curado de ícones Lucide
    ├── hooks/                    # Hooks de leitura (perfil, grupos, insígnias, títulos, ícones)
    ├── layouts/                  # AdminLayout (sidebar de 240px com drawer no mobile)
    ├── lib/                      # Regras de domínio e acesso ao Firebase
    ├── pages/                    # Páginas públicas, de conta e de perfil
    │   └── admin/                # Páginas do painel administrativo
    └── types/                    # Tipos compartilhados do domínio
```

## Arquitetura

O fluxo de dados é unidirecional e em camadas, sempre no mesmo sentido:

```
pages/  →  components/  →  hooks/  →  lib/  →  Firebase
```

- **`pages/`** — apenas composição de tela e roteamento. Cada página é uma rota declarada em [App.tsx](src/App.tsx).
- **`components/`** — blocos de interface reutilizáveis, agrupados pelo domínio a que servem, nunca pela tela que os usa.
- **`hooks/`** — estado de leitura e carregamento (`useProfile`, `useGroups`, `useBadges`, `useTitles`, `useCustomIcons`, `useIconSearch`, `useProfileDraft`).
- **`lib/`** — o coração do domínio. Cada módulo concentra as operações de uma entidade e é o único lugar que fala com o Firestore: `users.ts`, `groups.ts`, `badges.ts`, `titles.ts`, `icons.ts`, `profile.ts`, além de regras puras como `permissions.ts`, `handle.ts`, `chipStyle.ts` e `svgSanitizer.ts`.
- **`context/`** — estado global de sessão e apresentação: `AuthContext` (usuário, perfil, login e logout), `ThemeContext` (tema claro/escuro) e `ToastContext` (notificações).
- **`types/`** — contratos de dados compartilhados entre camadas.

Três decisões estruturais merecem destaque:

1. **Perfil derivado, não duplicado.** `isStaff` e `effectivePermissions` nunca são editados à mão: são recalculados a partir dos grupos do usuário por `unionUserPermissions` e `deriveIsStaff` ([permissions.ts](src/lib/permissions.ts)).
2. **Leituras resilientes.** Nenhuma leitura lança exceção por campo ausente: `normalizeUserProfile` preenche os padrões documentados em [PROJECT_STANDARDS.md](PROJECT_STANDARDS.md).
3. **Componentização de identidade visual.** Grupos e títulos compartilham o mesmo componente `<Chip>` e o mesmo resolvedor de estilo ([chipStyle.ts](src/lib/chipStyle.ts)); não existem classes CSS por variante.

## Rotas

### Site

| Rota | Página | Acesso |
| --- | --- | --- |
| `/` | Home — pilares, lore dos materiais voláteis e chamadas para ação | Público |
| `/sobre` | Sobre | Público |
| `/eventos` | Eventos | Público |
| `/membros` | Membros | Público |
| `/forum` | Fórum | Público |
| `/loja` | Loja | Público |
| `/entrar`, `/login` | Entrada com Google | Público |
| `/perfil` | Perfil próprio, com abas Feed, Sobre, Qualidades e Histórico | Autenticado |
| `/perfil/:slug` | Perfil público, resolvido por `@nick` ou `shortId` | Público (respeita a visibilidade) |
| `*` | Página não encontrada | Público |

### Conta

| Rota | Conteúdo |
| --- | --- |
| `/conta` | Redireciona para `/conta/visao-geral` |
| `/conta/visao-geral` | Grupo, cargo, data de entrada e contagem de insígnias |
| `/conta/perfil` | Bio, título exibido, visibilidade e insígnias destacadas |
| `/conta/preferencias` | Seletor de tema (Claro/Escuro) |

### Painel administrativo

Todas as rotas sob `/admin` são protegidas por `RequireAdmin`, que exige `effectivePermissions.accessPanel === true`.

| Rota | Conteúdo |
| --- | --- |
| `/admin` | Redireciona para `/admin/visao-geral` |
| `/admin/visao-geral` | Visão geral (conteúdo pendente) |
| `/admin/usuarios` | Busca e listagem de usuários |
| `/admin/usuarios/:uid` | Detalhe do usuário: grupos, atributos, banimento e exclusão |
| `/admin/grupos` | Grupos, prioridade, cor e permissões |
| `/admin/insignias` e `/admin/insignias/:badgeId` | Catálogo de insígnias e concessão/revogação por usuário |
| `/admin/icones` | Ícones SVG customizados, com sanitização |
| `/admin/titulos` e `/admin/titulos/:titleId` | Catálogo de títulos e concessão/revogação por usuário |
| `/admin/forum`, `/admin/conteudo`, `/admin/logs` | Conteúdo pendente |
| `/admin/configuracao` | Manutenção: geração retroativa de `shortId` |

## Autenticação e perfil

O login é exclusivamente via **Google**, por popup (`signInWithPopup`), sem e-mail/senha, magic link ou acesso anônimo. Toda a sessão vive no `AuthContext`.

No primeiro login, um documento é criado automaticamente em `users/{uid}` com `shortId` aleatório e único, `handle: null`, `primaryGroupId: 'visitante'`, `visibility: 'public'` e os atributos padrão zerados. Contas sem `handle` veem o aviso de onboarding para definir o `@nick`.

O `@nick` ([handle.ts](src/lib/handle.ts)) tem regras próprias: 3 a 20 caracteres, apenas minúsculas, números e `_`, não pode começar com número ou `_`, não pode colidir com nomes reservados do sistema (`admin`, `conta`, `perfil`, `eventos`, `loja` etc.) e deve ser único. O perfil público é acessível tanto pelo `@nick` quanto pelo `shortId`, então o link de um membro continua funcionando mesmo que ele altere o `@nick`.

A visibilidade do perfil é `public` ou `private`; perfis privados só são acessíveis ao próprio dono, a quem tem `manageUsers` e à staff.

## Grupos, permissões e banimento

Cada usuário tem um grupo primário (`primaryGroupId`, que define a cor e a insígnia exibidas) e grupos secundários opcionais. O conjunto de permissões é a **união** das permissões de todos os seus grupos.

Grupos semeados em [groups.ts](src/lib/groups.ts):

| Grupo | Prioridade | Staff | Permissões |
| --- | --- | --- | --- |
| `visitante` | 10 | Não | Padrão de novos usuários, sem acesso ao painel |
| `membro` | 40 | Não | Sem acesso ao painel |
| `vip` | 70 | Não | Sem acesso ao painel |
| `admin` | 100 | Sim | Todas as permissões |

As permissões administrativas são independentes entre si: `accessPanel`, `manageUsers`, `manageGroups`, `manageBadges`, `manageForum` e `manageContent`. O ícone de engrenagem no menu aparece apenas com `accessPanel`, mas cada ação no painel é verificada pela sua própria chave, tanto na interface quanto nas regras do Firestore.

Banimento:

- Um usuário banido **continua lendo** tudo o que lia antes.
- Um usuário banido **não escreve em lugar nenhum**, e um admin banido perde o acesso ao painel.
- Na edição do próprio perfil, o usuário só pode alterar bio, título exibido, visibilidade e insígnias destacadas; grupos, permissões, atributos e status de banimento exigem `manageUsers`.
- Excluir uma conta pelo painel remove o documento do usuário e seus vínculos em `userCollectibles`. A remoção da conta no Firebase Auth exige Admin SDK ou Cloud Functions e está fora do escopo do cliente.

## Insígnias, títulos e ícones

**Insígnias** são definidas em `badges/{badgeId}` e concedidas por vínculos em `userCollectibles/{userId_badge_badgeId}`. O membro escolhe até 4 insígnias destacadas em `/conta/perfil`, exibidas no carrossel do cabeçalho do perfil.

**Títulos** seguem o mesmo desenho, com `titles/{titleId}` e vínculos em `userCollectibles/{userId_title_titleId}`. O título exibido é renderizado acima do nome no cabeçalho do perfil, com a cor definida no próprio título.

**Ícones** vêm de duas origens: um registro curado de cerca de 300 ícones Lucide em 8 categorias (Geral, Comunidade, Exploração, Progresso, Itens, Conquistas, Tempo e Documentos) e ícones SVG customizados criados pela administração em `/admin/icones`. A referência aceita três formatos — `"shield"` (slug), `"lucide:shield"` (explícito) e `"custom:iconId"` (personalizado) — resolvidos centralizadamente, com fallback para o ícone `award`.

Todo SVG customizado passa pelo sanitizador em [svgSanitizer.ts](src/lib/svgSanitizer.ts): whitelist de tags e atributos, limite de 20 KB, 200 elementos e 4000 caracteres por atributo, com rejeição absoluta de `<script>`, `<foreignObject>`, `<iframe>`, manipuladores `on*`, atributos `style`, protocolos `javascript:` e `href` externos.

Grupos e títulos podem ainda carregar um `chipStyle` (cores, gradiente, brilho, shimmer, pulso). Quando ausente, aplica-se o estilo padrão. Efeitos de brilho e animação são permitidos **somente** em chips; no resto da interface a regra continua sendo sombras discretas, sem neon.

## Modelo de dados

Firestore é o único banco (sem Realtime Database) e usa um banco nomeado, indicado por `VITE_FIREBASE_FIRESTORE_DATABASE_ID`.

| Coleção | Papel |
| --- | --- |
| `users/{uid}` | Perfil, grupos, permissões derivadas, atributos, visibilidade e banimento |
| `groups/{groupId}` | Grupos de autoridade, cor, prioridade e permissões |
| `badges/{badgeId}` | Definições de insígnias |
| `titles/{titleId}` | Definições de títulos |
| `icons/{iconId}` | Ícones SVG customizados, já sanitizados |
| `userCollectibles/{userId_kind_itemId}` | Vínculos de insígnias e títulos concedidos a usuários |
| `rarities/{rarityId}` | Níveis de raridade de colecionáveis (rótulo, cor, ordem) |
| `catalogCategories/{categoryId}` | Categorias temáticas de colecionáveis |
| `origins/{originId}` | Origens de obtenção (evento, conquista, lore, etc.) |
| `collections/{collectionId}` | Conjuntos temáticos de colecionáveis |

Coleções usam substantivos em inglês, minúsculos e no plural, e os campos são `camelCase` em inglês. O esquema completo de cada documento, incluindo os padrões de campos ausentes e as regras de migração, está em [PROJECT_STANDARDS.md](PROJECT_STANDARDS.md); o resumo de entidades está em [firebase-blueprint.json](firebase-blueprint.json).

## Segurança

As regras de [firestore.rules](firestore.rules) partem de uma negação global (`allow read, write: if false`) e liberam apenas o necessário:

- **Leitura** — catálogos (`groups`, `badges`, `titles`, `icons`, `userCollectibles`, `rarities`, `catalogCategories`, `origins`, `collections`) são públicos; `users` é legível pelo próprio dono, por quem tem `manageUsers` e para perfis com `visibility: 'public'`.
- **Escrita** — sempre condicionada à permissão correspondente, e todo usuário banido é bloqueado por `!isBannedUser(uid)`.
- **Autoedição** — o dono do perfil só altera campos de perfil, verificado por `onlyTouchesProfileFields()`.

Nenhuma coleção pode ficar com permissão padrão: leitura e escrita são sempre explícitas.

Como a aplicação usa um banco Firestore **nomeado**, confirme no console do Firebase que as regras estão publicadas no banco correto antes de qualquer implantação.

## Tema e estilos

Os tokens de cor ficam em [index.css](src/index.css), em `:root` para o tema escuro (padrão) e em `[data-theme="light"]` para o claro. As superfícies, textos, bordas, cores de marca e feedback são sempre consumidos por CSS custom properties — **nunca** por utilitários de cor do Tailwind.

O tema é aplicado no `<html>` por `data-theme`, persistido em `localStorage` sob a chave `mp.tema` e restaurado por um script inline em [index.html](index.html) para evitar o flash de tema incorreto no carregamento.

## Convenções de código

O documento [PROJECT_STANDARDS.md](PROJECT_STANDARDS.md) é a fonte da verdade e deve ser lido antes de qualquer alteração. Em resumo:

- Código em inglês, interface em português. Nunca traduza um identificador nem escreva texto visível em inglês.
- Tailwind para layout e estrutura; CSS custom properties apenas para cores e temas.
- Uma página mostra conteúdo real ou não mostra nada — nada de textos que anunciam o que a página será.
- Antes de criar um componente, verifique se já existe um que resolva o problema. Não reformate arquivos vizinhos nem recrie arquivos que não foram pedidos.
- Alterações que tocam mais de 5 arquivos devem ter a lista completa apresentada antes de começar.

O alias `@` aponta para a raiz do projeto em [vite.config.ts](vite.config.ts) e [tsconfig.json](tsconfig.json), mas o padrão adotado no código é o uso de imports relativos.

## Limitações conhecidas

- Não há testes automatizados nem pipeline de CI; a verificação disponível é `bun run lint`.
- A aplicação é totalmente cliente: não existe `server.js` no repositório, apesar das dependências de servidor declaradas.
- A exclusão de conta remove apenas os dados do Firestore; a conta no Firebase Auth permanece.
- Páginas e seções marcadas como pendentes na tabela de [status atual](#status-atual) ainda não têm conteúdo.
- O script `clean` depende de `rm -rf` e não roda no `cmd`/PowerShell sem um shell Unix.

## Licença

Não há arquivo de licença no repositório. Todos os direitos são reservados aos autores do projeto até que uma licença seja definida.
