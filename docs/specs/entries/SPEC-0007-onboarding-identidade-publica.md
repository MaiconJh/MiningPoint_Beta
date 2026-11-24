---
id: SPEC-0007
title: Onboarding obrigatório de nome público e @nick
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
  - src/App.tsx
  - src/context/AuthContext.tsx
  - src/pages/ProfileSetup.tsx
  - src/types/profile.ts
  - src/lib/profile.ts
  - src/lib/users.ts
tags: [onboarding, profile, identity, handle]
---

# SPEC-0007 — Onboarding obrigatório de nome público e @nick

## Contexto

A criação inicial do documento `users/{uid}` define atualmente `displayName`
a partir de `currentUser.displayName` fornecido pelo Firebase Authentication
(Google) e mantém `handle` como `null`. O usuário entra na comunidade sem
escolher explicitamente como deseja ser identificado publicamente.

A definição do @nick é solicitada posteriormente por meio do `HandleBanner`
exibido no próprio perfil. Esse fluxo não solicita um nome público escolhido
pelo usuário e não garante que a configuração da identidade seja concluída
antes do uso da comunidade.

O modelo já possui regras de validação e unicidade para `handle`, além da
possibilidade de uma única redefinição pelo próprio usuário
(`hasRedefinedHandle`). A nova etapa deve reutilizar essas regras, sem criar
um segundo mecanismo de identificação.

## Objetivo

Adicionar uma etapa obrigatória de configuração da identidade pública após o
primeiro cadastro, na qual o usuário define seu nome de exibição e seu @nick
antes de acessar a experiência autenticada da comunidade.

## Requisitos

Progresso: `[0/6]`

- [ ] **R-01** — Identificar contas recém-criadas que ainda não concluíram a
      configuração inicial do perfil.
      **Critério:** novos documentos de usuário começam com
      `profileSetupCompleted: false`; documentos legados sem esse campo são
      interpretados como configurados, sem exigir novo onboarding de contas
      existentes.

- [ ] **R-02** — Apresentar uma etapa de configuração inicial com dois campos
      obrigatórios e semanticamente distintos: **Nome de exibição** e **@nick**.
      **Critério:** o campo de nome informa que seu conteúdo será exibido
      publicamente; o campo de @nick informa que é um identificador exclusivo
      e alerta, antes da confirmação, que só poderá ser redefinido uma vez
      depois da escolha inicial.

- [ ] **R-03** — Validar o nome de exibição antes da conclusão.
      **Critério:** o valor não pode ser vazio ou composto apenas por espaços;
      espaços externos são removidos; a grafia informada é preservada; nomes
      de exibição duplicados são permitidos. O nome do Google não substitui
      automaticamente a escolha explícita do usuário em novas contas.

- [ ] **R-04** — Reutilizar a validação, normalização e verificação de
      disponibilidade já existentes para o @nick.
      **Critério:** o @nick respeita as regras atuais de formato, tamanho,
      caracteres permitidos, nomes reservados e unicidade; a configuração
      inicial não consome a redefinição futura e mantém
      `hasRedefinedHandle: false`.

- [ ] **R-05** — Persistir a conclusão do onboarding como uma única operação
      lógica, registrando `displayName`, `handle` e
      `profileSetupCompleted: true`.
      **Critério:** a aplicação não libera o acesso autenticado enquanto a
      gravação não for confirmada; falhas de validação ou persistência mantêm
      o usuário na etapa, preservando os valores digitados e permitindo nova
      tentativa sem criar um perfil parcialmente concluído.

- [ ] **R-06** — Preservar o comportamento das contas existentes e das
      funcionalidades atuais de perfil.
      **Critério:** contas existentes não são redirecionadas para o novo
      onboarding apenas por não possuírem @nick; o fluxo atual de definição
      posterior do @nick continua disponível para essas contas; após a
      conclusão, o nome público e o @nick são refletidos nas áreas que já
      apresentam a identidade do usuário.

## Restrições

- A autenticação continua exclusivamente pelo provedor Google.
- Reutilizar `validateHandle` e a verificação de unicidade existentes; não
  criar regras paralelas para @nick.
- `displayName` permanece como nome público do perfil. Não tratar o nome
  retornado pelo Google como escolha explícita do usuário em novas contas.
- Não alterar a regra de uma única redefinição posterior do @nick.
- Não armazenar informações pessoais privadas em `users/{uid}`.
- Não alterar `firestore.rules`, arquivos de configuração de plataforma ou
  tokens de cor.
- Interface e mensagens em português; identificadores e código em inglês.
- A implementação futura deve respeitar o limite operacional de cinco
  arquivos: como o escopo declarado contém seis arquivos, a execução deverá
  apresentar a lista completa e aguardar aprovação antes de editar código.

## Fora de escopo

- Adicionar ou persistir um nome pessoal privado. Esse dado não deve ser
  colocado no documento público `users/{uid}`; seu armazenamento e suas
  regras de acesso precisam de uma especificação própria compatível com as
  restrições de segurança do repositório.
- Permitir alteração do nome de exibição com cooldown ou limite de frequência.
- Alterar as regras de redefinição do @nick após o cadastro.
- Alterar o formato de URLs públicas, `shortId` ou a resolução de perfis.
- Redesenhar o painel de edição de perfil ou outras áreas da conta.

## Testes

> Preenchido **após** a execução no AI Studio. Cole aqui, **verbatim**, o
> bloco retornado no formato definido em `_meta/AI-STUDIO-PROMPT.md`. Esta
> seção é **append-only**: não edite o conteúdo colado — se precisar
> corrigir, gere um novo relatório no AI Studio e substitua o bloco.

<!-- BEGIN AI STUDIO REPORT -->
<!-- Cole o bloco "## Testes da Spec — SPEC-0007 — <título>" abaixo -->
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-11-24 | MaiconJh | Criação da especificação de onboarding de identidade pública. |
