---
id: SPEC-0008
title: Nome pessoal privado nas configurações da conta
status: aprovado
created: 2026-11-24
updated: 2026-11-24
author: MaiconJh
reviewer: MaiconJh
approved_at: 2026-11-24
implemented_at: null
commit: null
superseded_by: null
supersedes: null
last_audit: null
test_report: null
files:
  - PROJECT_STANDARDS.md
  - firestore.rules
  - src/lib/privateProfile.ts
  - src/components/account/ProfileEditPanel.tsx
tags: [account, profile, privacy, firestore]
---

# SPEC-0008 — Nome pessoal privado nas configurações da conta

## Contexto

A SPEC-0007 estabelece a identidade pública inicial da conta por meio de
`displayName` e `handle`. Esses campos têm finalidade pública: o nome de
exibição aparece no perfil e nas áreas de interação, enquanto o @nick identifica
a conta e participa da URL pública.

Existe uma necessidade distinta: permitir que o titular registre um nome
pessoal que não seja apresentado publicamente. Esse dado não deve ser
confundido com `displayName`, nem armazenado no documento `users/{uid}`,
pois as regras atuais permitem a leitura desse documento por outras pessoas
quando o perfil é público.

O painel lateral de edição do perfil, em
`src/components/account/ProfileEditPanel.tsx`, já concentra configurações
editáveis da conta e é o ponto de integração adequado. A nova informação
precisa de armazenamento separado, acesso restrito ao próprio titular e
contrato documentado no padrão do projeto.

## Objetivo

Permitir que o titular cadastre, consulte, altere ou remova um nome pessoal
privado nas configurações da conta, mantendo esse dado isolado da identidade
pública e inacessível a outros usuários.

## Requisitos

Progresso: `[0/5]`

- [ ] **R-01** — Definir o armazenamento privado separado da identidade pública
      e documentá-lo no contrato de dados do projeto.
      **Critério:** em `PROJECT_STANDARDS.md`, adicionar
      `userPrivateProfiles/{uid}` ao `## Firestore schema` com os campos
      `personalName: string` e `updatedAt: timestamp`, incluir
      `userPrivateProfiles` na lista de coleções em `## Firebase` e registrar a
      regra de isolamento owner-only em `## Ban Semantics & Security Rules`; o
      documento é identificado pelo UID do titular e não adiciona
      `personalName` à interface `UserProfile` nem ao documento `users/{uid}`.

- [ ] **R-02** — Garantir isolamento de acesso no Firestore.
      **Critério:** em `firestore.rules`, declarar `match /userPrivateProfiles/{userId}`
      reutilizando os helpers existentes `isOwner(userId)` e
      `isBannedUser(userId)`: permitir apenas leitura pontual pelo titular
      (`allow get: if isOwner(userId);`) e negar listagens da coleção
      (`allow list: if false;`); permitir `create` e `update` somente quando
      `isOwner(userId) && !isBannedUser(userId)` e o payload contiver
      exclusivamente as chaves `['personalName', 'updatedAt']` (`hasOnly` e
      `hasAll`), com `personalName is string`, `personalName.size() >= 1`,
      `personalName.size() <= 100`, `personalName.trim().size() > 0` e
      `updatedAt == request.time`; permitir `delete` de forma idempotente
      somente quando `isOwner(userId) && !isBannedUser(userId)` (sem inspecionar
      `request.resource` nem exigir existência prévia do documento).
      Administradores e demais usuários não recebem acesso especial a esse
      documento. A regra geral de negação continua válida para qualquer acesso
      não explicitamente autorizado.

- [ ] **R-03** — Criar uma camada de acesso dedicada para o documento privado.
      **Critério:** `src/lib/privateProfile.ts` fornece operações tipadas para
      consultar e salvar/remover o nome pessoal do UID autenticado, utiliza
      exclusivamente `userPrivateProfiles/{uid}`, normaliza espaços externos
      (`trim`), rejeita valores acima de 100 caracteres ou com quebras de linha
      e caracteres de controle, e usa `serverTimestamp()` em `updatedAt`. A
      operação de leitura nunca lança exceção (`Reads never throw`) e retorna
      um resultado discriminado distinguindo sucesso (`personalName: string | null`,
      onde ausência do documento equivale a `null`) de falha de leitura
      (`ok: false` com mensagem em português). Valor vazio após normalização
      remove o documento privado via `deleteDoc`. Nenhuma operação consulta ou
      atualiza `users/{uid}` para esse dado.

- [ ] **R-04** — Disponibilizar a configuração no painel de edição do perfil.
      **Critério:** adicionar uma seção identificada como **Nome pessoal
      (privado)** em `ProfileEditPanel`, com campo editável, indicação
      explícita de que somente o titular pode consultar esse valor e ações
      próprias para salvar ou remover. A leitura só é disparada quando
      `isOpen === true` e houver `uid` autenticado (`user?.uid ?? profile?.uid`),
      com cancelamento de efeito ao fechar/desmontar e guarda defensiva para
      `uid` ausente (preservando compatibilidade com testes que não fornecem
      `uid`). O valor não aparece na prévia pública do perfil e não altera o
      nome de exibição nem o @nick. A operação privada possui estado de
      carregamento, feedback de sucesso e erro próprios, não fecha o painel ao
      salvar ou remover e não altera `isDirty` nem sinaliza como salvas
      alterações públicas pendentes; edições locais não salvas no campo privado
      são descartadas e recarregadas a partir do valor persistido ao reabrir o
      painel, mantendo o diálogo de descarte acoplado apenas ao rascunho
      público. Em caso de falha na leitura inicial, a seção exibe mensagem de
      erro em português com opção para tentar novamente e mantém salvar/remover
      desabilitados até uma leitura bem-sucedida. Para contas banidas
      (`profile.isBanned === true`), o valor salvo permanece visível, mas as
      ações de salvar e remover ficam desabilitadas com aviso claro em
      português (além de mapear `permission-denied` para mensagem em português).

- [ ] **R-05** — Preservar os limites de privacidade em toda a aplicação.
      **Critério:** `personalName` não é incluído em `UserProfile`,
      `users/{uid}`, consultas públicas, listagens de membros, perfil
      público, conteúdo de fórum, URL, metadados públicos ou dados de
      autenticação; o valor só é obtido pela camada privada e exibido ao
      titular dentro das configurações autenticadas. Falhas de leitura ou
      gravação não devem recorrer a armazenamento público como fallback.

## Restrições

- **Exceção de escopo protegida:** esta spec autoriza explicitamente a alteração
  de `firestore.rules`, arquivo protegido pelo `AGENTS.md`, exclusivamente
  para declarar as regras owner-only de `userPrivateProfiles/{uid}`. Nenhuma
  outra regra ou coleção deve ser alterada.
- **Pré-requisito operacional de deploy:** como `firestore.rules` bloqueia por
  padrão qualquer coleção não declarada (`allow read, write: if false`), o
  funcionamento de `userPrivateProfiles/{uid}` em ambiente Firestore conectado
  depende da publicação (`deploy`) das regras atualizadas.
- O armazenamento privado não pode reutilizar `users/{uid}` nem qualquer
  coleção com leitura pública.
- Não conceder leitura ou escrita do documento privado a administradores,
  moderadores ou outros usuários por conveniência.
- Não alterar a autenticação Google, o fluxo da SPEC-0007, `displayName`,
  `handle` ou as regras de redefinição do @nick.
- Não exigir o preenchimento do nome pessoal; o campo é opcional e pode ser
  removido posteriormente.
- O nome pessoal não é verificado como nome civil ou identidade legal.
- Interface e mensagens em português; identificadores, arquivos e código em
  inglês.
- Respeitar os tokens de tema e as convenções de interface já existentes.

## Fora de escopo

- Exibir o nome pessoal em qualquer superfície pública ou para outros
  usuários, incluindo administradores.
- Usar o nome pessoal como substituto do nome de exibição ou do @nick.
- Alterar o nome ou e-mail da conta no Firebase Authentication.
- Criar campos adicionais de endereço, telefone, documento ou outros dados
  pessoais.
- Implementar verificação documental ou validação de identidade civil.
- Redesenhar o painel de edição de perfil.
- Atualizar `firebase-blueprint.json` (tratado em atualização documental
  separada para manter o escopo restrito aos 4 arquivos declarados).
- Limpeza server-side de documentos privados órfãos em
  `userPrivateProfiles/{uid}` quando um administrador exclui uma conta pelo
  `/admin` (exigiria Admin SDK/Cloud Functions, preservando a vedação de acesso
  administrativo no cliente).

## Testes

> Preenchido **após** a execução no AI Studio. Cole aqui, **verbatim**, o
> bloco retornado no formato definido em `_meta/AI-STUDIO-PROMPT.md`. Esta
> seção é **append-only**: não edite o conteúdo colado — se precisar
> corrigir, gere um novo relatório no AI Studio.

<!-- BEGIN AI STUDIO REPORT -->
<!-- Cole o bloco "## Testes da Spec — SPEC-0008 — <título>" abaixo -->
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-11-24 | MaiconJh | Criação da especificação do nome pessoal privado. |
| 2026-11-24 | miningpoint-spec-fixer | Aplicação dos achados de `docs/specs/reviews/SPEC-0008-review.md`: renomeação da coleção para `userPrivateProfiles/{uid}` (`C-09`), ciclo de vida/guardas/isolamento de estado em `ProfileEditPanel` (`D-01`), endurecimento de `firestore.rules` com `get`/`list`, chaves exatas e `personalName` não vazio (`E-01`), contrato discriminado de erro de leitura (`E-02`), tratamento de conta banida na UI (`E-03`), sincronização documental em `PROJECT_STANDARDS.md` e registro de `firebase-blueprint.json` e documentos órfãos em `Fora de escopo` (`E-04`), e nota operacional de deploy de `firestore.rules` (`E-05`). |
| 2026-11-24 | MaiconJh | Aprovação da spec após revalidação pelo `miningpoint-spec-reviewer` (veredito `APROVADO`). |
