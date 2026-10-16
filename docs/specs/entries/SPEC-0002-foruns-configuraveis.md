---
id: SPEC-0002
title: Módulo de fóruns configuráveis
status: aprovado
created: 2026-10-16
updated: 2026-10-16
author: MaiconJh
reviewer: Maiconjh
approved_at: 2026-10-16
implemented_at: null
commit: null
superseded_by: null
supersedes: null
last_audit: null
test_report: null
files: []
tags: [forum, admin, permissions, routing, community]
---

# SPEC-0002 — Módulo de fóruns configuráveis

## Contexto

O MiningPoint ainda não possui um ambiente de discussão comunitária. As
páginas existentes cobrem perfis, catálogo de insígnias, títulos e o painel
Admin, mas não oferecem um espaço onde membros possam abrir tópicos, responder
e organizar conversas por assunto.

A intenção registrada é criar um módulo de **fóruns configuráveis**, não uma
única página de discussão. Cada fórum é uma entidade distinta, criada e mantida
pelo painel Admin, com rota própria, foco próprio (discussões, suporte,
sugestões, bugs ou qualquer outro definido na criação) e regras de acesso
próprias para ver, publicar tópicos e comentar. A estrutura de respostas e a
existência de subdivisões internas também são decisões de configuração do
fórum, não do código.

O schema atual já reserva dois pontos de encaixe no documento de grupo:
`permissions.admin.manageForum` (permissão de gerenciamento no painel) e
`permissions.forum.categories: {}` (objeto vazio, hoje sem uso). Esta spec
estende esses pontos sem substituí-los e sem alterar o modelo derivado de
`isStaff` e `effectivePermissions`.

### Estruturas mínimas propostas

As formas abaixo são o mínimo necessário para satisfazer os requisitos desta
spec e manter a coerência com as convenções vigentes (coleções em inglês
minúsculo plural, campos em camelCase inglês, leituras que nunca lançam). A
implementação pode ajustar desde que preserve os comportamentos exigidos nos
Requisitos.

**Fórum — coleção `forums/{forumId}`**

`
forums/{forumId}
  slug: string
  title: string
  description: string
  focus: string
  route: string
  order: number
  isActive: boolean
  threadStructure: string
  categories: ForumCategory[]
  features: {
    solution: boolean
    reactions: boolean
    reports: boolean
  }
  permissions: ForumPermissionMap
  createdAt: timestamp
  createdBy: string
  updatedAt: timestamp
  updatedBy: string
`

**Mapa de permissões do fórum**

`
ForumPermissionMap:
  view:         PermissionRule
  createThread: PermissionRule
  comment:      PermissionRule
  moderate:
    pin:    PermissionRule
    lock:   PermissionRule
    move:   PermissionRule
    remove: PermissionRule

PermissionRule:
  mode: anyone | authenticated | groups | staff | admin
  groupIds: string[]
`

**Regra padrão de um fórum recém-criado:** todas as entradas em
`view`, `createThread`, `comment` e `moderate.*` caem em
`mode: staff` até que o Admin altere.

**Tópicos — coleção `threads/{threadId}`**

`
threads/{threadId}
  forumId: string
  categoryId: string | null
  title: string
  body: string
  authorId: string
  createdAt: timestamp
  updatedAt: timestamp
  isPinned: boolean
  isLocked: boolean
  isRemoved: boolean
  commentCount: number
  solutionCommentId: string | null
  reactionCounts: Record<string, number>
`

**Comentários — subcoleção `threads/{threadId}/comments/{commentId}`**

Nested por padrão, para leitura delimitada por tópico e cascata natural de
remoção. Campos mínimos: `authorId`, `body`, `createdAt`, `updatedAt`,
`isRemoved`, `parentCommentId` (nulo quando a estrutura for plana),
`reactionCounts`.

**Reações por usuário — coleção `forumReactions/{userId_kind_itemId}`**

Mesmo padrão de `userCollectibles`: `userId`, `kind` (thread ou comment),
`itemId`, `reaction`, `createdAt`. A contagem agregada vive no documento
reagido (`reactionCounts`).

**Denúncias — coleção `forumReports/{reportId}`**

Campos mínimos: `forumId`, `kind` (thread ou comment), `itemId`,
`reporterId`, `reason`, `createdAt`, `status` (open, reviewed ou dismissed),
`reviewedBy`, `reviewedAt`.

**Rotas**

A rota base do índice global é fixa e reservada. Cada fórum declara um
segmento próprio, validado contra colisões com rotas existentes e com a rota
base. A rota de um fórum pode ser alterada no Admin sem impacto no
identificador interno (`forumId`).

## Objetivo

Entregar um módulo de fóruns em que cada fórum é criado e mantido pelo painel
Admin, com rota, foco, estrutura de respostas e regras de acesso próprias,
integrado visualmente ao MiningPoint e respeitando o modelo de permissões
derivadas vigente.

## Requisitos

Progresso: `[0/21]`

- [ ] **R-01** — Modelo de fórum configurável.
      **Critério:** existe uma coleção de fóruns no Firestore; cada fórum é
      criado exclusivamente pelo painel Admin e não há fórum pré-definido em
      código. O documento declara identificador de rota, título, descrição,
      foco, ordem, estado ativo/inativo, estrutura de respostas e o mapa de
      permissões.

- [ ] **R-02** — Rotas configuráveis por fórum.
      **Critério:** cada fórum ativo responde em sua própria rota pública; a
      rota base do índice global é fixa e não colide. Alterar a rota no Admin
      altera imediatamente o endereço público, sem mudança de código. Rotas
      duplicadas ou que colidem com rotas existentes são recusadas na
      configuração.

- [ ] **R-03** — Índice global de fóruns.
      **Critério:** a rota base pública lista os fóruns cuja permissão de
      visualização é satisfeita pelo usuário atual. Fóruns sem permissão de
      visualização não aparecem na listagem, nem como link, nem em contagens.
      Usuário sem acesso a nenhum fórum vê estado vazio.

- [ ] **R-04** — Subdivisões internas por fórum (opcional).
      **Critério:** cada fórum pode declarar uma ou mais categorias internas
      para organizar tópicos. A presença, a quantidade e a nomenclatura são
      decisão do Admin na configuração do fórum. Fórum sem subdivisões exibe
      seus tópicos diretamente na listagem principal.

- [ ] **R-05** — Permissão de visibilidade por fórum.
      **Critério:** cada fórum declara quem pode vê-lo, escolhendo entre
      visitante não autenticado, membro autenticado, grupos específicos,
      staff ou administradores. A regra é configurada no Admin e avaliada
      tanto na leitura quanto nas Security Rules. Fórum recém-criado nasce
      restrito a staff/admin.

- [ ] **R-06** — Permissão de publicação de tópicos.
      **Critério:** cada fórum declara quem pode abrir tópicos, com a mesma
      flexibilidade de R-05. Usuário sem essa permissão vê o fórum (se R-05
      permitir) mas não tem acesso ao formulário de novo tópico.

- [ ] **R-07** — Permissão de comentário.
      **Critério:** cada fórum declara quem pode comentar, com a mesma
      flexibilidade de R-05. A permissão é independente de R-06: é possível
      ter um fórum onde o usuário comenta sem poder abrir novo tópico.

- [ ] **R-08** — Moderação por fórum com granularidade por ação.
      **Critério:** cada fórum declara, por ação, quem pode fixar, trancar,
      mover tópicos entre subdivisões internas e remover conteúdo. As quatro
      regras são independentes entre si e independentes de R-05..R-07. Um
      usuário pode ser moderador em um fórum e não em outro.

- [ ] **R-09** — Criação de tópicos.
      **Critério:** usuário com R-06 abre um tópico com título e corpo;
      quando o fórum tem subdivisões (R-04), escolhe a subdivisão. O autor é
      registrado. O tópico aparece na listagem do fórum na ordem definida
      pela configuração.

- [ ] **R-10** — Estrutura de respostas configurável.
      **Critério:** cada fórum declara sua estrutura de respostas (plana, com
      citação ou aninhada) no Admin. O módulo não impõe um formato único. A
      interface de comentário respeita a estrutura configurada, inclusive
      após remoção do comentário-pai, quando R-11 exigir.

- [ ] **R-11** — Edição e exclusão pelo autor.
      **Critério:** o autor de um tópico ou comentário edita o próprio
      conteúdo e o exclui, conforme a configuração do fórum. Exclusão pelo
      autor é lógica (marca como removido) e preserva a integridade da
      estrutura de respostas vigente (R-10).

- [ ] **R-12** — Moderação de conteúdo.
      **Critério:** usuário com a permissão correspondente em R-08 fixa,
      desfixa, tranca, destranca, move entre subdivisões e remove tópicos;
      e remove comentários. Cada ação fica registrada com autor e timestamp
      no próprio documento afetado (ou em trilha equivalente).

- [ ] **R-13** — Marcação de solução.
      **Critério:** quando o fórum habilita `features.solution`, o autor do
      tópico (ou quem tem a permissão de moderação correspondente) pode
      marcar uma resposta como solução; o tópico passa a exibir a resposta
      destacada na listagem e na leitura.

- [ ] **R-14** — Reações.
      **Critério:** quando o fórum habilita `features.reactions`, usuários
      com permissão de visualização reagem a tópicos e comentários com o
      conjunto de reações definido em configuração. A contagem é exibida e
      a reação por usuário é registrada. Reagir de novo com a mesma reação
      remove a reação anterior do usuário naquele item.

- [ ] **R-15** — Denúncias.
      **Critério:** quando o fórum habilita `features.reports`, usuários com
      permissão de visualização denunciam tópicos ou comentários. A denúncia
      entra em um fluxo de revisão acessível a quem tem a permissão de
      remoção no fórum.

- [ ] **R-16** — Gestão exclusivamente pelo painel Admin.
      **Critério:** criação, edição, ativação/desativação e exclusão de
      fóruns, bem como alteração de rota, foco, estrutura de respostas,
      subdivisões, funcionalidades e mapa de permissões, ocorrem no painel
      Admin sob a permissão existente de gerenciamento de fórum. Nenhum
      ajuste de comportamento exige alteração de código.

- [ ] **R-17** — Coerência visual com o MiningPoint.
      **Critério:** todas as telas do módulo (índice, fórum, tópico,
      formulários e painel Admin) usam layout, tipografia, espaçamento e
      componentes já existentes. Cores exclusivamente via custom properties
      do tema; nenhum utilitário de cor Tailwind; nenhuma cor literal fora
      das exceções já declaradas em `PROJECT_STANDARDS.md`.

- [ ] **R-18** — Estados vazios, de carregamento e de erro.
      **Critério:** cada tela do módulo exibe estado vazio (sem fóruns, sem
      tópicos, sem comentários), estado de carregamento e estado de erro de
      leitura. Nenhuma string visível usa termos proibidos por
      `PROJECT_STANDARDS.md`.

- [ ] **R-19** — Banimento e segurança.
      **Critério:** usuário com `isBanned === true` continua lendo o que sua
      visibilidade permitir, mas não cria tópico, não comenta, não reage,
      não denuncia, não edita e não exclui. As Security Rules refletem todos
      os pontos de R-05..R-08 e R-19 de forma explícita, sem default-allow.

- [ ] **R-20** — Defaults e retrocompatibilidade.
      **Critério:** leituras de fórum, tópico e comentário nunca lançam;
      campos ausentes caem em defaults seguros (visibilidade restrita, sem
      publicação, sem comentário, sem moderação delegada, `features` todas
      desligadas). Fórum sem configuração explícita não vaza conteúdo nem
      comportamento.

- [ ] **R-21** — Referências de configuração expostas ao Admin.
      **Critério:** o painel Admin apresenta, para cada fórum, todos os
      pontos de configuração: rota, foco, ordem, estado, estrutura de
      respostas, subdivisões internas, visibilidade, publicação, comentário,
      moderação por ação e funcionalidades opcionais (solução, reações,
      denúncias).

## Restrições

- **Language** (`PROJECT_STANDARDS.md`): código, nomes de arquivo, coleções,
  campos e identificadores em inglês; strings visíveis em português. Nenhum
  identificador traduzido; nenhuma string visível em inglês.
- **Styling**: Tailwind apenas para layout, tipografia, flexbox e grid. Cores
  do módulo exclusivamente via custom properties do tema; nenhum utilitário
  de cor Tailwind; nenhuma cor literal fora das exceções já declaradas.
- **Firebase**: Auth exclusivamente Google. Firestore em banco único,
  sem Realtime Database. Nenhuma decisão de Hosting/deploy nesta spec.
- **Storage**: o módulo de fóruns não usa Firebase Storage; o bucket
  permanece dedicado a avatar e banner.
- **Security Rules**: explícitas para toda coleção tocada (`forums`,
  `threads`, `threads/*/comments`, `forumReactions`, `forumReports`).
  Nenhuma coleção com default-allow. Leitura e escrita declaradas
  separadamente.
- **Firestore**: coleções em inglês minúsculo plural; campos em camelCase
  inglês. Banco único.
- **Modelo derivado**: `isStaff` e `effectivePermissions` continuam derivados
  da união dos grupos do usuário. O módulo não introduz um segundo modelo de
  permissão nem substitui `permissions.admin.manageForum`.
- **`groups.permissions.forum`**: o campo `categories: {}` reservado no schema
  atual é preservado. Esta spec não o repurposa silenciosamente; se a
  implementação optar por armazenar o mapa de permissões por grupo, o
  comportamento deve continuar satisfazendo R-08 e R-16.
- **Content policy** (`PROJECT_STANDARDS.md`): nenhuma string visível usa os
  termos proibidos. Nenhuma tela se apresenta como em construção, prévia ou
  demonstração.
- **SVG**: qualquer ícone usado nas telas do módulo respeita a política de
  sanitização vigente; o módulo não introduz ícones por rota alternativa.
- **Scope** (`PROJECT_STANDARDS.md`): nenhum arquivo não nomeado na
  implementação é recriado; nenhum arquivo vizinho é reformatado.
- **Ban semantics** (`PROJECT_STANDARDS.md`): usuário banido lê, não escreve,
  não acessa o painel Admin. A regra já vigente é a referência; o módulo não
  a afrouxa nem a duplica.

## Fora de escopo

- Notificações por e-mail, push ou in-app de novos tópicos, respostas ou
  denúncias.
- Mensagens diretas entre usuários.
- Anexos e mídia embarcada em tópicos ou comentários (o Storage permanece
  dedicado a avatar e banner).
- Busca full-text entre fóruns.
- Editor rich text com formatação avançada; o corpo de tópicos e comentários
  fica limitado ao que a implementação definir como texto simples ou
  formatação mínima, sem decisão fechada nesta spec.
- Feed público de atividade do fórum fora das rotas configuradas.
- Migração de conteúdo de sistemas anteriores ou importação em massa.
- Integração com APIs externas.
- Moderação global fora do contexto de um fórum específico (a moderação
  desta spec é sempre escopada por fórum).

## Testes

> Preenchido **após** a execução no AI Studio. Cole aqui, **verbatim**, o
> bloco retornado no formato definido em `_meta/AI-STUDIO-PROMPT.md`. Esta
> seção é **append-only**: não edite o conteúdo colado — se precisar
> corrigir, gere um novo relatório no AI Studio e substitua o bloco.

<!-- BEGIN AI STUDIO REPORT -->
<!-- Cole o bloco "## Testes da Spec — SPEC-0002 — Módulo de fóruns configuráveis" abaixo -->
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-10-16 | — | Criação |
