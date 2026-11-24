---
id: SPEC-0007
title: Onboarding obrigatório de nome público e @nick
status: implementado
created: 2026-11-24
updated: 2026-11-24
author: MaiconJh
reviewer: MaiconJh
approved_at: 2026-11-24
implemented_at: 2026-11-24
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
um segundo mecanismo de identificação. Os módulos existentes
`src/lib/handle.ts` (`validateHandle`, `RESERVED_HANDLES`),
`src/components/onboarding/HandleBanner.tsx`, `src/components/RequireAuth.tsx`
e `src/pages/Login.tsx` são consumidos apenas em modo somente leitura/reuso,
sem modificação.

### Justificativa de escopo (6 arquivos)

Conforme `AGENTS.md` §Scope e `PROJECT_STANDARDS.md` §Scope, alterações que
ultrapassam 5 arquivos exigem listagem completa e justificativa explícita:

1. `src/types/profile.ts` — inclusão do campo `profileSetupCompleted: boolean`
   na interface `UserProfile`.
2. `src/lib/profile.ts` — normalização retroativa em `normalizeUserProfile`,
   interpretando documentos legados sem `profileSetupCompleted` como `true`.
3. `src/lib/users.ts` — validação de `displayName`, helper atômico para
   concluir o onboarding (`displayName`, `handle`, `visibility: 'public'` e
   `profileSetupCompleted: true`) reutilizando `validateHandle` e
   `checkHandleUniqueness`, e filtro defensivo em `listUsers` para não expor
   contas com `profileSetupCompleted === false`.
4. `src/context/AuthContext.tsx` — inicialização de novos documentos
   `users/{uid}` com `displayName: ''`, `visibility: 'private'` e
   `profileSetupCompleted: false`, além da inclusão de `profileSetupCompleted`
   no objeto de fallback do perfil do dono.
5. `src/pages/ProfileSetup.tsx` — nova página dedicada de onboarding em
   `/completar-perfil` com campos obrigatórios de Nome de exibição e `@nick`,
   validação inline, mensagens de erro em português e ação `"Sair"`.
6. `src/App.tsx` — registro da rota `/completar-perfil` e guarda de navegação
   para redirecionar contas autenticadas pendentes de onboarding e impedir
   reacesso de contas já configuradas.

## Objetivo

Adicionar uma etapa obrigatória de configuração da identidade pública após o
primeiro cadastro, na qual o usuário define seu nome de exibição e seu @nick
antes de acessar a experiência autenticada da comunidade.

## Requisitos

Progresso: `[6/6]`

- [x] **R-01** — Identificar contas recém-criadas que ainda não concluíram a
      configuração inicial do perfil e evitar sua exposição pública prematura.
      **Critério:** novos documentos `users/{uid}` criados em
      `src/context/AuthContext.tsx` começam com `profileSetupCompleted: false`,
      `displayName: ''` e `visibility: 'private'` (evitando aparição em
      `/membros` ou `/perfil/:slug` antes da conclusão); `listUsers` em
      `src/lib/users.ts` também ignora defensivamente registros com
      `profileSetupCompleted === false`; documentos legados sem o campo são
      normalizados em `normalizeUserProfile` (`src/lib/profile.ts`) como
      `profileSetupCompleted: true`; o objeto de fallback do dono em
      `AuthContext.tsx` define `profileSetupCompleted: true` para preservar a
      tipagem sem forçar onboarding em falhas de leitura.

- [x] **R-02** — Apresentar a etapa de configuração inicial em rota dedicada
      `/completar-perfil`, em layout isolado (sem `<NavBar>` e sem `<Footer>`),
      com dois campos obrigatórios e semanticamente distintos: **Nome de
      exibição** e **@nick**, além de opção explícita de saída da conta.
      **Critério:** o campo de nome informa que seu conteúdo será exibido
      publicamente; o campo de @nick informa que é um identificador exclusivo
      e alerta, antes da confirmação, que só poderá ser redefinido uma vez
      depois da escolha inicial; a tela oferece botão `"Sair"` que aciona
      `signOutUser` para permitir troca de conta Google antes da conclusão.

- [x] **R-03** — Validar o nome de exibição antes da conclusão.
      **Critério:** espaços externos são removidos (`trim`); após o corte, o
      valor não pode ser vazio, deve ter entre 2 e 50 caracteres e não pode
      conter quebras de linha ou caracteres de controle; a grafia informada é
      preservada; nomes de exibição duplicados são permitidos. O nome do Google
      (`currentUser.displayName`) não é preenchido automaticamente nem
      substitui a escolha explícita do usuário em novas contas.

- [x] **R-04** — Reutilizar a validação, normalização e verificação de
      disponibilidade já existentes para o @nick.
      **Critério:** o @nick respeita as regras atuais de formato, tamanho,
      caracteres permitidos, nomes reservados e unicidade (`validateHandle` em
      `src/lib/handle.ts` e `checkHandleUniqueness` em `src/lib/users.ts`); a
      configuração inicial não consome a redefinição futura e mantém
      `hasRedefinedHandle: false`.

- [x] **R-05** — Persistir a conclusão do onboarding como uma única operação
      lógica e impor o guarda de navegação em `src/App.tsx`.
      **Critério:** a confirmação executa uma única atualização em
      `users/{uid}` registrando `displayName`, `handle`, `visibility: 'public'`
      e `profileSetupCompleted: true`; o guarda em `src/App.tsx` só avalia
      redirecionamentos quando `loading === false` e `profile !== null`,
      redirecionando contas autenticadas com `profileSetupCompleted === false`
      de qualquer outra rota (inclusive pós-login vindo de `Login.tsx`) para
      `/completar-perfil`, redirecionando visitantes não autenticados em
      `/completar-perfil` para `/entrar` e redirecionando contas já
      configuradas (`profileSetupCompleted !== false`) em `/completar-perfil`
      para `/perfil`; falhas de validação, rede ou permissão (incluindo conta
      banida com `isBanned: true`) mantêm o usuário na etapa exibindo mensagem
      clara em português, preservando os valores digitados sem criar um perfil
      parcialmente concluído.

- [x] **R-06** — Preservar o comportamento das contas existentes e das
      funcionalidades atuais de perfil.
      **Critério:** contas existentes não são redirecionadas para o novo
      onboarding apenas por não possuírem @nick; o fluxo atual de definição
      posterior do @nick continua disponível para essas contas; após a
      conclusão, o nome público e o @nick são refletidos nas áreas que já
      apresentam a identidade do usuário.

## Restrições

- A autenticação continua exclusivamente pelo provedor Google.
- Reutilizar `validateHandle` (`src/lib/handle.ts`) e a verificação de
  unicidade existente (`checkHandleUniqueness` em `src/lib/users.ts`); não
  criar regras paralelas para @nick.
- Limitação pré-existente reconhecida: a verificação de unicidade reutilizada
  (`checkHandleUniqueness` seguida de `updateDoc`) é não-transacional e
  consulta apenas documentos legíveis pelo usuário autenticado sob
  `firestore.rules`; a criação de índice separado de handles fica fora desta
  spec por exigir alteração em `firestore.rules`.
- A rota `/completar-perfil` usa hífen, não colidindo com o namespace válido de
  `@nick` (`^[a-z0-9_]+$`) nem com `RESERVED_HANDLES`, dispensando alteração em
  `src/lib/handle.ts`.
- `displayName` permanece como nome público do perfil. Não tratar o nome
  retornado pelo Google como escolha explícita do usuário em novas contas.
- Não alterar a regra de uma única redefinição posterior do @nick.
- Não armazenar informações pessoais privadas em `users/{uid}`.
- Não alterar `firestore.rules`, arquivos de configuração de plataforma ou
  tokens de cor; toda estilização de `src/pages/ProfileSetup.tsx` deve usar
  exclusivamente tokens CSS (`var(--token)`) e utilitários de layout Tailwind.
- Interface e mensagens em português; identificadores e código em inglês.
- O escopo declarado contém 6 arquivos (justificados em `### Justificativa de
  escopo (6 arquivos)`); na execução, apresentar a lista completa e aguardar
  aprovação explícita antes de editar código, conforme `AGENTS.md` §Scope.

## Fora de escopo

- Adicionar ou persistir um nome pessoal privado. Esse dado não deve ser
  colocado no documento público `users/{uid}`; seu armazenamento e suas
  regras de acesso precisam de uma especificação própria compatível com as
  restrições de segurança do repositório.
- Atualização documental do schema de `users/{uid}` em `PROJECT_STANDARDS.md`
  e `firebase-blueprint.json` para registrar `profileSetupCompleted` (tratada
  em atualização documental separada para manter o escopo restrito aos 6
  arquivos de código).
- Criação de coleção auxiliar ou transação server-side para unicidade global de
  `@nick` entre perfis privados.
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
## Testes da Spec — SPEC-0007 — Onboarding obrigatório de nome público e @nick

### T-01 — Estado inicial de contas novas, filtro defensivo e fallback legado

- **Requisito:** R-01
- **Tipo:** unit
- **Executado:** sim
- **Comando:** `npm test`
- **Resultado:** passou
- **Evidência:** 22 arquivos de teste, 154 testes passaram, 0 falharam (incluindo `src/lib/__tests__/profileBannerData.test.ts` sobre `normalizeUserProfile`); implementado em `src/types/profile.ts:42`, `src/lib/profile.ts:92`, `src/lib/users.ts:120` e `src/context/AuthContext.tsx:69,91-93,163`
- **Observações:** Criação real de documento em Firestore com nova conta Google requer validação manual; nenhum arquivo de teste novo foi criado para manter o escopo restrito aos 6 arquivos declarados.

### T-02 — Rota /completar-perfil em layout isolado, campos obrigatórios e ação Sair

- **Requisito:** R-02
- **Tipo:** lint
- **Executado:** sim
- **Comando:** `npm run check`
- **Resultado:** passou
- **Evidência:** `eslint .` concluiu com 0 erros e 0 avisos nos 6 arquivos da spec (regras `design-tokens/no-raw-color-literals` e `design-tokens/no-tailwind-color-utilities` aprovadas) e `tsc --noEmit` concluiu com 0 erros sobre `src/pages/ProfileSetup.tsx` e `src/App.tsx:50,73-83`
- **Observações:** Conferência visual e interação de saída (`signOutUser`) no navegador exigem validação manual.

### T-03 — Validação de nome de exibição e ausência de autopreenchimento do Google

- **Requisito:** R-03
- **Tipo:** manual
- **Executado:** não
- **Resultado:** inconclusivo
- **Evidência:** `validateDisplayName` em `src/lib/users.ts:531-557` (trim, 2-50 caracteres, bloqueio de quebras de linha e caracteres de controle, preservação de grafia) e inicialização vazia em `src/pages/ProfileSetup.tsx:41` e `src/context/AuthContext.tsx:69`
- **Observações:** Nenhum teste unitário novo foi adicionado fora dos 6 arquivos de escopo; requer validação manual ou teste unitário dedicado.

### T-04 — Reuso de validação, normalização e unicidade de @nick sem consumir redefinição

- **Requisito:** R-04
- **Tipo:** manual
- **Executado:** não
- **Resultado:** inconclusivo
- **Evidência:** `completeProfileSetup` em `src/lib/users.ts:564-597` reutiliza `validateHandle` (`src/lib/handle.ts`) e `checkHandleUniqueness` sem atualizar `hasRedefinedHandle`; `src/pages/ProfileSetup.tsx:57,113` reutiliza `validateHandle`
- **Observações:** Verificação de colisão de unicidade contra a coleção `users` depende de execução em sessão conectada ao Firestore.

### T-05 — Persistência única, guarda de navegação e tratamento de falhas e conta banida

- **Requisito:** R-05
- **Tipo:** build
- **Executado:** sim
- **Comando:** `npm run build`
- **Resultado:** passou
- **Evidência:** `vite build` transformou 2766 módulos e concluiu em 2.39s sem erros; guarda em `src/App.tsx:57-71`, atualização única em `src/lib/users.ts:588-594`, mapeamento de erros e bloqueio de `isBanned` em `src/pages/ProfileSetup.tsx:12-35,98-130`
- **Observações:** Redirecionamentos pós-login e rejeição por permissão/rede em tempo real requerem validação manual no navegador.

### T-06 — Compatibilidade retroativa de contas existentes e suíte de regressão

- **Requisito:** R-06
- **Tipo:** unit
- **Executado:** sim
- **Comando:** `npm test`
- **Resultado:** passou
- **Evidência:** 22 arquivos de teste, 154 testes passaram, 0 falharam; `normalizeUserProfile` (`src/lib/profile.ts:92`) normaliza documentos legados sem `profileSetupCompleted` como `true`, preservando `HandleBanner.tsx` e `HandleSettings.tsx` sem alteração
<!-- END AI STUDIO REPORT -->

## Histórico de revisões

| Data | Autor | Mudança |
|---|---|---|
| 2026-11-24 | MaiconJh | Criação da especificação de onboarding de identidade pública. |
| 2026-11-24 | miningpoint-spec-fixer | Aplicação dos achados de `docs/specs/reviews/SPEC-0007-review.md`: justificativa de escopo (6 arquivos), módulos somente leitura, estado inicial privado/vazio em `AuthContext.tsx`, rota `/completar-perfil` com layout isolado/guard/logout, limites de `displayName` (2–50 caracteres), tratamento de `loading`/`profile === null`/`isBanned`, limitação de unicidade e nota de docs fora de escopo. |
| 2026-11-24 | MaiconJh | Aprovação da spec após revalidação pelo `miningpoint-spec-reviewer` (veredito `APROVADO`). |
