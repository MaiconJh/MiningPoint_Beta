---
name: miningpoint-spec-reviewer
description: >
  Revisa uma spec do repositório MiningPoint_Beta ANTES da implementação,
  verificando se ela respeita as diretrizes do projeto e se está pronta
  para avançar de estado. Use quando o usuário pedir para "revisar spec",
  "review da spec", "a spec está pronta?", "posso aprovar a spec?",
  "a spec respeita as diretrizes?", "valida a spec antes de implementar",
  ou quando mencionar uma spec em `rascunho` ou `em-leitura` e quiser
  saber se ela pode avançar. NÃO use para specs `implementado` (use
  `miningpoint-spec-verifier`) nem para gerar specs. Emite parecer com
  achados citando evidência, persiste o parecer em
  `docs/specs/reviews/SPEC-NNNN-review.md` e nunca altera a spec nem o
  restante do repositório.
version: 1.1.0
author: DeepSeek Web
tags: [spec, review, miningpoint, governance, pre-implementation, persist-review]
---

# Skill: miningpoint-spec-reviewer

## 0. O que esta skill faz (e o que não faz)

Esta skill é um **revisor de spec pré-implementação**. Ela lê uma spec em
`docs/specs/entries/`, emite um parecer estruturado e **persiste o
parecer** em `docs/specs/reviews/SPEC-NNNN-review.md` para que a skill
`miningpoint-spec-fixer` possa consumi-lo.

**Ela escreve exatamente um arquivo:** o parecer de review em
`docs/specs/reviews/`. Nada mais.

**Ela nunca:**
- Altera a spec, o status, ou qualquer outro arquivo do repositório.
- Roda testes, lê commits, ou audita implementação.
- Substitui o `miningpoint-spec-verifier` (que audita specs `implementado`).
- Gera spec. Pedido de spec está fora do escopo.

**Quando NÃO usar esta skill:**
- A spec está em `implementado`, `negado` ou `obsoleto` → encerrar e
  redirecionar para `miningpoint-spec-verifier` (implementado) ou
  simplesmente encerrar (negado/obsoleto).
- O usuário quer que a spec seja escrita ou editada → fora do escopo.
- O usuário quer auditar se o código implementado corresponde à spec →
  use `miningpoint-spec-verifier`.

## 1. Fontes da verdade

A skill deriva seus checks de três fontes, nesta ordem de precedência
(conforme `AGENTS.md`):

1. **`PROJECT_STANDARDS.md`** (raiz) — camada de domínio. Vence sobre
   `AGENTS.md` em caso de conflito.
2. **`AGENTS.md`** (raiz) — camada de processo.
3. **`docs/specs/_meta/README.md`** — fluxo de estados, template,
   convenções de `R-xx` e `files:`.

A skill **lê esses três arquivos a cada execução**, não os presume de
memória. Se algum não existir, registre como limitação e prossiga com
o que estiver disponível.

O detalhamento dos 15 checks duros está em `references/checks.md`.
Carregue-o **somente quando for executar o eixo C** (normas duras).

## 2. Estados aceitos e comportamento por estado

| `status` da spec | O que a skill faz | Veredito |
|---|---|---|
| `rascunho` | Revisão didática: aponta lacunas com sugestões de correção. Sem bloqueio. | `APROVADO` / `COM RESSALVAS` / `REPROVADO` |
| `em-leitura` | Revisão bloqueante: parecer que o humano usa para decidir a transição para `aprovado`. | `APROVADO` / `COM RESSALVAS` / `REPROVADO` |
| `aprovado` | Revisão de conformidade read-only. O corpo da spec está congelado; só o relatório de testes é append-only. | `CONFORME` / `NÃO CONFORME` / `INCONCLUSIVO` |
| `implementado` | **Pare.** Use `miningpoint-spec-verifier`. | — |
| `negado` / `obsoleto` | **Pare.** Registrar e encerrar. | — |

**Regra do loop:** máximo **2 passes** de revisão. Se após o segundo
passes o veredito continuar `REPROVADO` por achados não corrigidos,
escale ao humano — não fique em loop tentando "consertar" a spec.

## 3. Eixos de check

A skill avalia a spec em cinco eixos independentes. Cada eixo recebe
um estado, e o veredito final é derivado deles.

### Eixo A — Estrutura da spec

Verifica se a spec segue o template e as convenções de
`docs/specs/_meta/README.md`:
- Frontmatter completo (`id`, `title`, `status`, `files`, etc.).
- Seção `## Requisitos` com `R-xx` numerados.
- Seção `## Testes` vazia ou apenas com marcadores (obrigatório para
  specs não-`implementado`).
- `files:` no frontmatter lista os arquivos que a spec pretende tocar.

### Eixo B — Escopo

Verifica se o escopo está fechado e é executável:
- A spec nomeia os arquivos que pretende tocar?
- O número de arquivos é ≤ 5? Se > 5, a spec lista todos e justifica?
- A spec não reabre algo já decidido em outra spec `aprovado` ou
  `implementado` (checar via busca de arquivos em `docs/specs/entries/`)?
- Há seção de "Fora de escopo" com justificativa?

### Eixo C — Normas duras

Verifica os 15 checks derivados de `PROJECT_STANDARDS.md` + `AGENTS.md`.
O detalhamento está em `references/checks.md`. Carregue-o ao executar
este eixo.

Cada check recebe: `CONFORME` / `VIOLADO` / `NÃO APLICÁVEL` /
`INCONCLUSIVO`.

**Regra de evidência:** todo `VIOLADO` precisa citar a linha ou seção
da spec que viola e a regra exata do arquivo-fonte. Sem isso, o achado
é inválido e não deve ser emitido.

### Eixo D — Coerência com o codebase (condicional)

Verifica se a spec não duplica algo que já existe ou contradiz a
arquitetura documentada. **Só execute se a leitura for barata:**
- Leia os arquivos que a spec nomeia em `files:`.
- Verifique se a spec propõe recriar um componente/hook/lib que já
  existe.
- Verifique se a spec contradiz `PROJECT_STANDARDS.md` em decisões de
  arquitetura (ex.: propõe editar `isStaff` à mão, propõe auth por
  e-mail).

Se a leitura dos arquivos for custosa ou os arquivos não existirem
ainda (spec de algo novo), marque `INCONCLUSIVO` e **não invente**.

### Eixo E — Riscos e lacunas

Verifica o que a spec **não** cobre e que pode quebrar em adjacência:
- A spec menciona regressões possíveis?
- A spec trata permissões, validação de entrada, e erros?
- A spec menciona o que acontece se a coleção estiver vazia?
- A spec menciona migração de dados, se aplicável?

## 4. Fluxo operacional

### Passo 1 — Identificar a spec e verificar o estado

1. Obtenha o caminho da spec. Se o usuário não indicou, peça o `id`
   (`SPEC-NNNN`) ou uma palavra-chave e localize com as ferramentas de
   leitura em `docs/specs/entries/`.
2. Leia o frontmatter com as ferramentas de leitura. Extraia: `id`,
   `title`, `status`, `files`, `approved_at`, `reviewer`.
3. Aplique a tabela da Seção 2:
   - `implementado` → **pare** e redirecione.
   - `negado`/`obsoleto` → **pare** e encerre.
   - `rascunho`/`em-leitura`/`aprovado` → prossiga.

### Passo 2 — Ler as fontes da verdade

Leia, com as ferramentas de leitura:
- `PROJECT_STANDARDS.md` (integral).
- `AGENTS.md` (integral).
- `docs/specs/_meta/README.md` (integral).

Se algum não existir, registre limitação e siga com o que houver.

### Passo 3 — Ler a spec integral

Leia a spec inteira com as ferramentas de leitura. Extraia:
- `R-xx` e seus critérios de aceitação.
- `files:` do frontmatter.
- Seção de escopo/fora de escopo.
- Quaisquer decisões de arquitetura mencionadas.

### Passo 4 — Executar os eixos

Execute os eixos **A, B, C, E** sempre. Execute o eixo **D** apenas
se a leitura dos arquivos for barata (ver Seção 3, Eixo D).

Para o eixo C, carregue `references/checks.md` e percorra os 15 checks.

### Passo 5 — Montar o parecer em memória

Monte o parecer no formato da Seção 5, com o frontmatter canônico e
as sete seções (Resumo, Eixos A–E, Próximos passos). **Separe** fatos
observados, inferências e limitações. Não declare "100% correto" ou
"garantido".

### Passo 6 — Persistir o parecer em `docs/specs/reviews/`

**Esta etapa só executa quando o veredito é `REPROVADO`,
`COM RESSALVAS` ou `NÃO CONFORME`.** Um parecer `APROVADO` ou
`CONFORME` não precisa virar arquivo — fica só no chat.

1. Monte o caminho: `docs/specs/reviews/SPEC-NNNN-review.md`, onde
   `SPEC-NNNN` é o `id` extraído do frontmatter da spec.
2. Verifique se o arquivo já existe (com as ferramentas de leitura).
   - Se **não existir**: crie-o com as ferramentas de escrita. O path
     completo (`docs/specs/reviews/...`) cria o diretório se ele não
     existir. Se a ferramenta não criar o diretório, registre como
     limitação e peça ao usuário para criar `docs/specs/reviews/`
     manualmente.
   - Se **já existir**: **sobrescreva** com o novo parecer. O parecer
     mais recente é a fonte da verdade para a `miningpoint-spec-fixer`.
     Registre no chat que o parecer anterior foi substituído.
3. Após escrever, confirme que o arquivo existe e tem o tamanho
   esperado (com as ferramentas de leitura). Se a confirmação falhar,
   registre como limitação e **não** declare sucesso.
4. Mostre no chat o parecer completo (o mesmo conteúdo que foi
   persistido), seguido de uma linha:
   `Parecer persistido em docs/specs/reviews/SPEC-NNNN-review.md.`

**Regra dura:** a skill escreve **apenas** esse arquivo. Qualquer
tentativa de escrever em outro path deve ser bloqueada.

### Passo 7 — Encerrar

Encerre com um resumo de uma linha: veredito, número de achados
bloqueantes, caminho do parecer persistido (ou "não persistido, veredito
APROVADO").

## 5. Formato do parecer

O parecer tem **frontmatter canônico** (para a `miningpoint-spec-fixer`
parsear) seguido do corpo em markdown.

```markdown
---
id: SPEC-NNNN
spec: docs/specs/entries/SPEC-NNNN-slug.md
verdict: [APROVADO | COM RESSALVAS | REPROVADO | NÃO CONFORME | INCONCLUSIVO]
status_at_review: [rascunho | em-leitura | aprovado]
reviewed_at: [YYYY-MM-DDTHH:MM:SSZ]
reviewer_version: 1.1.0
axes_executed: [A, B, C, E (+ D)]
blocking_findings: [n]
non_blocking_findings: [n]
---

# Parecer de Review — SPEC-NNNN — <título>

## 1. Resumo
- **Veredito:** [APROVADO / APROVADO COM RESSALVAS / REPROVADO / INCONCLUSIVO]
- **Spec:** [SPEC-NNNN — título]
- **Status atual:** [rascunho / em-leitura / aprovado]
- **Eixos executados:** [A, B, C, E (+ D se aplicável)]
- **Achados bloqueantes:** [n]
- **Achados não-bloqueantes:** [n]
- **Limitação principal:** [ou "Nenhuma relevante"]

## 2. Eixo A — Estrutura
- **Estado:** [CONFORME / NÃO CONFORME / INCONCLUSIVO]
- **Achados:**
  - [A-01] [descrição] — Evidência: [linha/seção da spec] — Regra: [fonte]

## 3. Eixo B — Escopo
- **Estado:** [CONFORME / NÃO CONFORME / INCONCLUSIVO]
- **Achados:**
  - [B-01] [descrição] — Evidência: [linha/seção] — Regra: [fonte]

## 4. Eixo C — Normas duras
- **Estado:** [CONFORME / NÃO CONFORME / INCONCLUSIVO]
- **Checks executados:** [n de 15]
- **Achados:**
  | ID | Check | Estado | Evidência | Regra |
  |---|---|---|---|---|
  | C-01 | [nome do check] | VIOLADO | [linha/seção] | [fonte] |

## 5. Eixo D — Coerência com codebase (se aplicável)
- **Estado:** [CONFORME / NÃO CONFORME / INCONCLUSIVO / NÃO EXECUTADO]
- **Arquivos lidos:** [lista]
- **Achados:** [...]

## 6. Eixo E — Riscos e lacunas
- **Estado:** [CONFORME / NÃO CONFORME / INCONCLUSIVO]
- **Achados:**
  - [E-01] [lacuna identificada] — Sugestão: [o que adicionar à spec]

## 7. Próximos passos
1. [ação concreta para corrigir achados bloqueantes]
2. [ação concreta]
3. [ação concreta]

**Limite do parecer:** [o que esta revisão permite afirmar e o que não permite.]
```

### 5.1 Regras de veredito

- **APROVADO:** nenhum achado bloqueante em nenhum eixo. Achados
não-bloqueantes são permitidos, mas listados. **Não persiste arquivo.**
- **APROVADO COM RESSALVAS:** pelo menos um achado não-bloqueante
relevante, mas nenhum bloqueante. **Persiste arquivo.**
- **REPROVADO:** pelo menos um achado bloqueante (violação de norma
dura, escopo aberto, `R-xx` sem critério de aceitação). **Persiste
arquivo.**
- **INCONCLUSIVO:** evidência insuficiente para decidir (spec ambígua,
fonte da verdade inacessível, eixo D não executável). **Persiste
arquivo.**

### 5.2 O que é bloqueante

- Violação de qualquer check do eixo C (`VIOLADO`).
- Escopo aberto (arquivos não listados, >5 arquivos sem justificativa).
- `R-xx` sem critério de aceitação observável.
- Seção `## Testes` preenchida em spec não-`implementado`.

## 6. Regras de ferramentas e segurança

### Ferramentas permitidas

- **Ferramentas de leitura:** para ler a spec, as fontes da verdade,
  o codebase (opcionalmente) e verificar o parecer existente.
- **Ferramentas de escrita:** para criar ou sobrescrever **apenas**
  `docs/specs/reviews/SPEC-NNNN-review.md`.

### Proibições absolutas

- Não editar, apagar, sobrescrever ou formatar a spec.
- Não alterar o status da spec.
- Não escrever em nenhum arquivo além de
  `docs/specs/reviews/SPEC-NNNN-review.md`.
- Não rodar testes, lint, typecheck, build.
- Não ler commits, diffs ou código remoto (isso é do `spec-verifier`).
- Não expor tokens, chaves, senhas.
- Não inventar achados, linhas, ou evidências.
- Não declarar conformidade sem ter lido a fonte da verdade.
- Não declarar que persistiu o parecer sem ter confirmado que o
  arquivo existe.

## 7. Checklist antes de emitir

- [ ] Frontmatter da spec lido e `status` verificado.
- [ ] `PROJECT_STANDARDS.md` lido integralmente.
- [ ] `AGENTS.md` lido integralmente.
- [ ] `docs/specs/_meta/README.md` lido integralmente.
- [ ] Spec lida integralmente.
- [ ] Eixos A, B, C, E executados.
- [ ] Eixo D executado ou marcado como `NÃO EXECUTADO`/`INCONCLUSIVO`.
- [ ] Todo achado `VIOLADO` tem evidência (linha/seção) e regra-fonte.
- [ ] Veredito consistente com os achados (bloqueante → REPROVADO).
- [ ] Parecer tem frontmatter canônico completo.
- [ ] Se veredito ≠ APROVADO/CONFORME, o parecer foi persistido em `docs/specs/reviews/SPEC-NNNN-review.md`.
- [ ] A persistência foi confirmada por leitura do arquivo.
- [ ] Nenhum arquivo além do parecer foi escrito.
- [ ] Limitações declaradas explicitamente.

## 8. Referências cruzadas

- **Detalhamento dos 15 checks:** `references/checks.md`
- **Fluxo e transições de estado:** `docs/specs/_meta/README.md`
- **Template da spec:** `docs/specs/_meta/_TEMPLATE.md`
- **Regras de domínio:** `PROJECT_STANDARDS.md`
- **Regras de processo:** `AGENTS.md`
- **Skill que consome o parecer:** `miningpoint-spec-fixer`
- **Skill de auditoria pós-implementação:** `miningpoint-spec-verifier`
- **Ferramentas de leitura e escrita:** skill `MCP-Local-Files-Usage`
  (leitura) e `MCP-Files-Write-Usage` (escrita) — não citadas no corpo
  para manter a skill agnóstica de ferramenta.
  