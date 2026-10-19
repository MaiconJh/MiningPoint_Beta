---
name: miningpoint-spec-fixer
description: >
  Corrige uma spec do repositório MiningPoint_Beta aplicando as correções
  indicadas por um parecer de review persistido em
  `docs/specs/reviews/SPEC-NNNN-review.md` (gerado pela skill
  `miningpoint-spec-reviewer`). Use quando o usuário pedir para "corrigir
  a spec", "aplicar as correções do parecer", "resolver os achados da
  review", "corrigir a SPEC-NNNN conforme o parecer", ou quando houver um
  parecer de review com veredito REPROVADO, COM RESSALVAS ou NÃO CONFORME
  e o usuário quiser aplicar as correções. Totalmente autônoma para
  correções mecanicamente determináveis; quando o parecer oferece múltiplas
  correções válidas que mudam o escopo, escolhe a mais conservadora,
  registra a alternativa descartada e NÃO transita o status até o usuário
  confirmar. NÃO use para gerar specs nem para auditar implementação (use
  `miningpoint-spec-verifier`).
version: 1.1.0
author: DeepSeek Web
tags: [spec, fix, miningpoint, governance, pre-implementation, apply-review]
---

# Skill: miningpoint-spec-fixer

## 0. O que esta skill faz (e o que não faz)

Esta skill é o **corretor de spec** que consome o parecer persistido pela
`miningpoint-spec-reviewer` e aplica as correções na spec. Ela é a skill
irmã da `miningpoint-spec-reviewer` (que emite e persiste o parecer) e da
`miningpoint-spec-verifier` (que audita a implementação).

Fluxo de referência:

```
reviewer (emite e persiste parecer) → fixer (aplica correções) → verifier (audita implementação)
```

**Ela nunca:**
- Gera spec do zero. Pedido de spec está fora do escopo.
- Audita implementação, lê commits ou roda testes.
- Corrige uma spec sem parecer persistido. Sem parecer em
  `docs/specs/reviews/`, não há achado para ancorar a correção.
- Inventa achados que não estão no parecer.

**Quando NÃO usar esta skill:**
- Não existe parecer em `docs/specs/reviews/SPEC-NNNN-review.md` →
  encerrar e pedir ao usuário para rodar a `miningpoint-spec-reviewer`
  primeiro.
- O parecer tem veredito `APROVADO` → não há o que corrigir. Encerrar.
- A spec está em `implementado` → use `miningpoint-spec-verifier`.
- O usuário quer que a spec seja revisada (não corrigida) → use
  `miningpoint-spec-reviewer`.

## 1. Fontes da verdade

A skill opera sobre **quatro artefatos**, nesta ordem de precedência:

1. **`PROJECT_STANDARDS.md`** (raiz) — camada de domínio. Vence sobre
   `AGENTS.md` em caso de conflito.
2. **`AGENTS.md`** (raiz) — camada de processo.
3. **`docs/specs/_meta/README.md`** — fluxo de estados, template,
   convenções de `R-xx` e `files:`.
4. **`docs/specs/reviews/SPEC-NNNN-review.md`** — o parecer que ancora
   as correções (com frontmatter canônico).

A skill **lê os quatro arquivos a cada execução**. Se algum não existir,
registre como limitação e prossiga com o que estiver disponível — mas se
o parecer não existir, **pare** (sem parecer, não há correção).

O mapeamento detalhado de "tipo de achado → correção" está em
`references/corrections.md`. Carregue-o ao planejar as correções.

## 2. Autonomia e regra do fallback documentado

A skill é **totalmente autônoma** para correções mecanicamente
determináveis. Ela distingue dois tipos de achado:

### Achados mecanicamente determináveis

A correção é única e não muda escopo. Exemplos:
- `approved_at` preenchido em spec `rascunho` → trocar por `null`.
- Arquivo no `files:` que o parecer aponta como redundante → remover.
- `R-xx` sem critério de aceitação → adicionar critério derivado da
  regra violada.
- Termo proibido no corpo → substituir pelo equivalente correto.

**Comportamento:** a skill corrige e **pode transitar o status**,
respeitando o fluxo de `docs/specs/_meta/README.md`.

### Achados com múltiplas correções válidas que mudam escopo

O parecer oferece duas ou mais opções mutuamente exclusivas, e a
escolha muda o tamanho ou o rumo do projeto. Exemplos:
- "Mover R-07/R-08 para 'Fora de escopo' **ou** adicionar
  `types/forum.ts` + `lib/forumThreads.ts` ao `files:`".
- "Calcular a janela de 2h no componente **ou** criar um helper novo
  **ou** alterar `canEditThread` (que a spec proíbe)".

**Comportamento (regra do fallback documentado):**
1. A skill escolhe a opção **mais conservadora** — a que **mantém ou
   reduz** o escopo (menos arquivos, menos mudanças, menos risco).
2. Registra a escolha no relatório de correção, com a alternativa
   descartada e o motivo.
3. **Não transita o status** até o usuário confirmar a escolha.

Se **todas** as opções aumentarem escopo, a skill **para** e pergunta
ao usuário qual caminho seguir — não escolhe sozinha nesse caso.

## 3. Fluxo operacional

### Passo 0 — Verificar o parecer persistido

1. Obtenha o caminho da spec. Se o usuário não indicou, peça o `id`
   (`SPEC-NNNN`) ou uma palavra-chave e localize com as ferramentas de
   leitura em `docs/specs/entries/`.
2. Monte o caminho do parecer: `docs/specs/reviews/SPEC-NNNN-review.md`.
3. Verifique se o arquivo existe com as ferramentas de leitura.
   - Se **não existir**: **pare** e peça ao usuário para rodar a
     `miningpoint-spec-reviewer` primeiro. Não tente reconstruir o
     parecer de memória.
   - Se **existir**: prossiga.
4. Leia o frontmatter do parecer. Extraia: `id`, `spec`, `verdict`,
   `status_at_review`, `reviewed_at`, `reviewer_version`,
   `axes_executed`, `blocking_findings`, `non_blocking_findings`.

**Se o veredito for `APROVADO`:** encerre. Não há o que corrigir.

**Se a spec estiver em `implementado`:** encerre e redirecione para
`miningpoint-spec-verifier`.

### Passo 1 — Ler as fontes da verdade

Leia, com as ferramentas de leitura:
- `PROJECT_STANDARDS.md` (integral).
- `AGENTS.md` (integral).
- `docs/specs/_meta/README.md` (integral).
- O parecer integral (frontmatter + corpo).

Se algum não existir, registre limitação e siga com o que houver.

### Passo 2 — Ler a spec integral

Leia a spec inteira com as ferramentas de leitura. Confirme que as
linhas citadas no parecer (evidências) existem e correspondem ao que o
parecer descreve. Se a spec mudou desde o parecer, registre a
divergência e pergunte ao usuário antes de prosseguir.

### Passo 3 — Planejar as correções

Carregue `references/corrections.md` e, para cada achado do parecer:

1. Classifique o achado em **mecanicamente determinável** ou
   **múltiplas correções válidas que mudam escopo** (ver Seção 2).
2. Determine a correção concreta (o que muda, em qual linha/seção).
3. Verifique se a correção não viola uma regra de
   `PROJECT_STANDARDS.md` nem de `AGENTS.md`.

Monte um plano de correções no formato da Seção 4.

### Passo 4 — Aplicar as correções

Para cada correção do plano:

1. Construa um patch com o contexto real da spec.
2. Aplique em modo **dry-run** com as ferramentas de escrita.
3. Leia o `preview` e os `failed` no retorno.
4. Se o dry-run passar, aplique de fato.

**Regra de ouro:** nunca aplique um patch sem antes ver o `preview` do
dry-run. Se o dry-run falhar (`failed[*].stage == "apply"`), releia a
spec e refaça o hunk com o contexto exato.

Se uma correção depende de outra (ex.: remover `src/index.css` do
`files:` **e** remover a menção a ele no corpo), aplique as duas no
mesmo patch ou em sequência, nunca em ordem que deixe a spec
inconsistente no meio.

### Passo 5 — Decidir a transição de status

Após aplicar as correções:

- Se **todos** os achados eram mecanicamente determináveis e foram
  corrigidos com sucesso → a skill **pode transitar o status** conforme
  o fluxo de `docs/specs/_meta/README.md`.
- Se **algum** achado caiu na regra do fallback documentado (Seção 2)
  → a skill **não transita o status**. Ela registra a escolha e pede
  confirmação ao usuário.

A transição sugerida depende do estado atual e do veredito do parecer:

| Status atual | Veredito do parecer | Transição sugerida |
|---|---|---|
| `rascunho` | `REPROVADO` | Permanecer em `rascunho` até o usuário revisar |
| `rascunho` | `COM RESSALVAS` | `em-leitura` (se todas as correções aplicadas) |
| `em-leitura` | `REPROVADO` | Voltar para `rascunho` (se o usuário autorizar) |
| `em-leitura` | `COM RESSALVAS` | `aprovado` (se todas as correções aplicadas) |
| `aprovado` | `NÃO CONFORME` | Não transitar (corpo congelado; só relatório append-only) |

**Regra dura:** a skill nunca transita para `aprovado` se houver achado
não corrigido ou escolha pendente de confirmação.

### Passo 6 — Emitir o relatório de correção

Use o formato da Seção 5. **Separe** fatos observados, decisões
tomadas e limitações.

## 4. Formato do plano de correções (interno)

Antes de aplicar, monte internamente (não precisa mostrar ao usuário,
mas use para organizar):

```markdown
| Achado | Tipo | Correção | Evidência | Risco |
|---|---|---|---|---|
| A-01 | mecânica | Trocar approved_at para null | linha 9 | Baixo |
| B-01 | fallback | Mover R-07/R-08 para Fora de escopo | linhas 98-105 | Médio |
```

Se todos os achados forem mecânicos, pode pular a exibição do plano e
ir direto ao patch. Se houver achado de fallback, mostre o plano ao
usuário **antes** de aplicar o patch correspondente.

## 5. Formato do relatório de correção

```markdown
# Relatório de Correção — SPEC-NNNN — <título>

## 1. Resumo
- **Parecer de origem:** `docs/specs/reviews/SPEC-NNNN-review.md`
- **Veredito do parecer:** [REPROVADO / COM RESSALVAS / NÃO CONFORME]
- **Status antes:** [rascunho / em-leitura / aprovado]
- **Status depois:** [novo status / "inalterado (aguardando confirmação)"]
- **Achados corrigidos:** [n]
- **Achados com fallback documentado:** [n]
- **Achados não corrigidos:** [n]
- **Limitação principal:** [ou "Nenhuma relevante"]

## 2. Correções aplicadas
| ID | Achado | Tipo | Correção aplicada | Evidência | Resultado |
|---|---|---|---|---|---|
| A-01 | [descrição] | mecânica | [o que mudou] | [linha/seção] | APLICADO |

## 3. Escolhas de fallback documentado
| ID | Achado | Opções do parecer | Escolha | Alternativa descartada | Motivo |
|---|---|---|---|---|---|
| B-01 | [descrição] | [Opção A / Opção B] | [escolhida] | [descartada] | [mais conservadora] |

**Status travado:** [sim/não] — se sim, aguardando confirmação do
usuário para transitar.

## 4. Achados não corrigidos
| ID | Achado | Motivo | Sugestão |
|---|---|---|---|
| D-01 | [descrição] | [por que não foi corrigido] | [o que fazer] |

## 5. Transição de status
- **Transição aplicada:** [de X para Y / "nenhuma"]
- **Justificativa:** [por que transitar / por que não transitar]
- **Próximo passo sugerido:** [rodar o reviewer de novo / confirmar
  fallback / revisar manualmente]

## 6. Limitações
- [limitação 1]
- [limitação 2]
```

## 6. Regras de ferramentas e segurança

### Ferramentas permitidas

- **Ferramentas de leitura:** para ler a spec, as fontes da verdade,
  o parecer e o codebase.
- **Ferramentas de escrita:** para aplicar patches na spec, sempre com
  dry-run antes da aplicação real.

### Proibições absolutas

- Nunca aplique um patch sem dry-run anterior.
- Nunca aplique um patch que o dry-run não confirmou.
- Nunca altere arquivos fora da spec (não toque em
  `PROJECT_STANDARDS.md`, `AGENTS.md`, parecer, código, etc.).
- Nunca invente achados que não estão no parecer.
- Nunca transite para `aprovado` se houver achado não corrigido ou
  fallback pendente de confirmação.
- Nunca rode testes, lint, typecheck, build.
- Nunca leia commits, diffs ou código remoto.
- Nunca sobrescreva o parecer. Ele é append-only (gerenciado pela
  `miningpoint-spec-reviewer`).

## 7. Checklist antes de emitir

- [ ] Parecer existe em `docs/specs/reviews/SPEC-NNNN-review.md`.
- [ ] Frontmatter do parecer lido e veredito confirmado
      (`REPROVADO`, `COM RESSALVAS` ou `NÃO CONFORME`).
- [ ] Spec lida integralmente.
- [ ] `PROJECT_STANDARDS.md` lido integralmente.
- [ ] `AGENTS.md` lido integralmente.
- [ ] `docs/specs/_meta/README.md` lido integralmente.
- [ ] Cada achado classificado (mecânico vs fallback).
- [ ] Cada correção tem evidência (linha/seção da spec).
- [ ] Dry-run executado antes de cada aplicação real.
- [ ] Fallback documentado registra escolha e alternativa descartada.
- [ ] Status só foi transitado se não houver fallback pendente.
- [ ] Nenhum arquivo fora da spec foi alterado.
- [ ] O parecer não foi alterado.
- [ ] Limitações declaradas explicitamente.

## 8. Referências cruzadas

- **Mapeamento achado → correção:** `references/corrections.md`
- **Parecer de review:** `docs/specs/reviews/SPEC-NNNN-review.md`
- **Skill que emite e persiste o parecer:** `miningpoint-spec-reviewer`
- **Fluxo e transições de estado:** `docs/specs/_meta/README.md`
- **Template da spec:** `docs/specs/_meta/_TEMPLATE.md`
- **Regras de domínio:** `PROJECT_STANDARDS.md`
- **Regras de processo:** `AGENTS.md`
- **Skill de auditoria pós-implementação:** `miningpoint-spec-verifier`
- **Ferramentas de leitura e escrita:** skill `MCP-Local-Files-Usage`
  (leitura) e `MCP-Files-Write-Usage` (escrita) — não citadas no corpo
  para manter a skill agnóstica de ferramenta.