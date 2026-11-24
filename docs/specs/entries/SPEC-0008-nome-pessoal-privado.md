---
id: SPEC-0008
title: Nome pessoal privado nas configurações da conta
status: rascunho
created: 2026-11-24
updated: 2026-11-24
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
      **Critério:** adicionar `userPrivate/{uid}` ao schema de
      `PROJECT_STANDARDS.md`, com o campo `personalName: string` e
      `updatedAt: timestamp`; o documento é identificado pelo UID do titular
      e não adiciona `personalName` à interface `UserProfile` nem ao
      documento `users/{uid}`.

- [ ] **R-02** — Garantir isolamento de acesso no Firestore.
      **Critério:** em `firestore.rules`, permitir leitura somente quando
      `request.auth.uid` corresponder ao UID do documento; permitir criação,
      atualização e exclusão somente pelo próprio titular autenticado e não
      banido; validar que os campos gravados sejam exclusivamente
      `personalName` e `updatedAt`, que o nome seja string com até 100
      caracteres e que `updatedAt` corresponda ao horário da requisição.
      Administradores e demais usuários não recebem acesso especial a esse
      documento. A regra geral de negação continua válida para qualquer
      acesso não explicitamente autorizado.

- [ ] **R-03** — Criar uma camada de acesso dedicada para o documento privado.
      **Critério:** `src/lib/privateProfile.ts` fornece operações tipadas
      para consultar e salvar/remover o nome pessoal do UID autenticado,
      utiliza exclusivamente `userPrivate/{uid}`, normaliza espaços externos,
      rejeita valores acima de 100 caracteres ou com quebras de linha e
      caracteres de controle, e usa `serverTimestamp()` em `updatedAt`.
      Valor vazio após normalização remove o documento privado; a ausência do
      documento é interpretada como nome pessoal não definido. Nenhuma
      operação consulta ou atualiza `users/{uid}` para esse dado.

- [ ] **R-04** — Disponibilizar a configuração no painel de edição do perfil.
      **Critério:** adicionar uma seção identificada como **Nome pessoal
      (privado)** em `ProfileEditPanel`, com campo editável, indicação
      explícita de que somente o titular pode consultar esse valor e ação para
      salvar ou remover. O valor é carregado ao abrir o painel, não aparece
      na prévia pública do perfil e não altera o nome de exibição nem o @nick.
      A operação privada possui estado de carregamento, feedback de sucesso e
      erro próprios, sem sinalizar como salvas alterações públicas que não
      tenham sido persistidas.

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
  para declarar as regras owner-only de `userPrivate/{uid}`. Nenhuma outra
  regra ou coleção deve ser alterada.
- O armazenamento privado não pode reutilizar `users/{uid}` nem qualquer
  coleção com leitura pública.
- Não conceder leitura do documento privado a administradores, moderadores ou
  outros usuários por conveniência.
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
