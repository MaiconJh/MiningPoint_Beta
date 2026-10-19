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
  achados citando evidência; nunca altera a spec nem o repositório.
version: 1.0.0
author: DeepSeek Web
tags: [spec, review, miningpoint, governance, pre-implementation, read-only]
---

# Skill: miningpoint-spec-reviewer

## 0. O que esta skill faz (e o que não faz)

Esta skill é um **revisor de spec pré-implementação**. Ela lê uma spec em
`docs/specs/entries/` e emite um parecer estruturado sobre se a spec está
pronta para avançar de estado, respeitando as diretrizes do projeto.

**Ela nunca:**
- Altera a spec, o status, ou qualquer arquivo do repositório.
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
  `implementado` (checar via `find_files` em `docs/specs/entries/`)?
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
- Leia os arquivos que a spec nomeia em `files:` (via `read_file`).
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
   (`SPEC-NNNN`) ou uma palavra-chave e localize via `find_files` em
   `docs/specs/entries/`.
2. Leia o frontmatter com `read_file` (MCP Local Files).
3. Aplique a tabela da Seção 2:
   - `implementado` → **pare** e redirecione.
   - `negado`/`obsoleto` → **pare** e encerre.
   - `rascunho`/`em-leitura`/`aprovado` → prossiga.

### Passo 2 — Ler as fontes da verdade

Leia, via `read_file`:
- `PROJECT_STANDARDS.md` (integral).
- `AGENTS.md` (integral).
- `docs/specs/_meta/README.md` (integral).

Se algum não existir, registre limitação e siga com o que houver.

### Passo 3 — Ler a spec integral

Leia a spec inteira com `read_file`. Extraia:
- `R-xx` e seus critérios de aceitação.
- `files:` do frontmatter.
- Seção de escopo/fora de escopo.
- Quaisquer decisões de arquitetura mencionadas.

### Passo 4 — Executar os eixos

Execute os eixos **A, B, C, E** sempre. Execute o eixo **D** apenas
se a leitura dos arquivos for barata (ver Seção 3, Eixo D).

Para o eixo C, carregue `references/checks.md` e percorra os 15 checks.

### Passo 5 — Emitir o parecer

Use o formato da Seção 5. **Separe** fatos observados, inferências e
limitações. Não declare "100% correto" ou "garantido".

## 5. Formato do parecer

```markdown
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
não-bloqueantes são permitidos, mas listados.
- **APROVADO COM RESSALVAS:** pelo menos um achado não-bloqueante
relevante, mas nenhum bloqueante.
- **REPROVADO:** pelo menos um achado bloqueante (violação de norma
dura, escopo aberto, `R-xx` sem critério de aceitação).
- **INCONCLUSIVO:** evidência insuficiente para decidir (spec ambígua,
fonte da verdade inacessível, eixo D não executável).

### 5.2 O que é bloqueante

- Violação de qualquer check do eixo C (`VIOLADO`).
- Escopo aberto (arquivos não listados, >5 arquivos sem justificativa).
- `R-xx` sem critério de aceitação observável.
- Seção `## Testes` preenchida em spec não-`implementado`.

## 6. Regras de ferramentas e segurança

### Ferramentas permitidas

- `read_file`, `read_multiple_files`, `find_files`, `list_directory`,
`search_files` (MCP Local Files) para ler a spec, as fontes da
verdade, e (opcionalmente) o codebase.

### Proibições absolutas

- Não editar, apagar, sobrescrever ou formatar arquivos.
- Não alterar o status da spec.
- Não rodar testes, lint, typecheck, build.
- Não ler commits, diffs ou código remoto (isso é do `spec-verifier`).
- Não expor tokens, chaves, senhas.
- Não inventar achados, linhas, ou evidências.
- Não declarar conformidade sem ter lido a fonte da verdade.

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
- [ ] Nenhuma operação de escrita realizada.
- [ ] Limitações declaradas explicitamente.

## 8. Referências cruzadas

- **Detalhamento dos 15 checks:** `references/checks.md`
- **Fluxo e transições de estado:** `docs/specs/_meta/README.md`
- **Template da spec:** `docs/specs/_meta/_TEMPLATE.md`
- **Regras de domínio:** `PROJECT_STANDARDS.md`
- **Regras de processo:** `AGENTS.md`
- **Skill de auditoria pós-implementação:** `miningpoint-spec-verifier`
- **Ferramentas MCP de leitura:** skill `MCP-Local-Files-Usage`

</BDS:create_file>

<BDS:create_file fileName="miningpoint-spec-reviewer/references/checks.md">

```markdown
# Checks duros — derivados de PROJECT_STANDARDS.md + AGENTS.md

Carregue este arquivo ao executar o **Eixo C** (Normas duras) do
`miningpoint-spec-reviewer`.

Cada check recebe um estado: `CONFORME` / `VIOLADO` / `NÃO APLICÁVEL` /
`INCONCLUSIVO`.

**Regra de evidência:** todo `VIOLADO` precisa citar a linha ou seção
da spec que viola e a regra exata do arquivo-fonte. Sem isso, o achado
é inválido.

---

## C-01 — Escopo: mais de 5 arquivos

**Fonte:** `AGENTS.md` §Scope / `PROJECT_STANDARDS.md` §Scope
**O que verificar:** O `files:` do frontmatter (ou a seção de escopo)
lista mais de 5 arquivos?
**Violação:** Lista >5 arquivos sem uma seção explícita de aprovação
que justifique o número.
**NÃO APLICÁVEL:** se a spec lista ≤5 arquivos.

---

## C-02 — Escopo: arquivos não nomeados

**Fonte:** `AGENTS.md` §Scope
**O que verificar:** A spec descreve mudanças em arquivos que **não**
estão no `files:` do frontmatter nem no corpo?
**Violação:** O corpo menciona "alterar X" ou "criar Y" sem que X/Y
apareçam no `files:`.
**NÃO APLICÁVEL:** se toda mudança descrita tem arquivo correspondente
no `files:`.

---

## C-03 — Dados: termos proibidos

**Fonte:** `AGENTS.md` §Non-negotiable / `PROJECT_STANDARDS.md` §Content
**O que verificar:** A spec (corpo, `R-xx`, critérios de aceitação)
contém algum dos termos: `mock`, `fake`, `dummy`, `sample`,
`placeholder`, `TODO`, `lorem`, "em breve", "demonstração", "prévia",
"fictício", "simulado", "conteúdo de demonstração"?
**Violação:** Qualquer ocorrência em texto que descreva comportamento
visível ou dado a ser renderizado. (Comentários técnicos explicando
decisões são permitidos.)
**NÃO APLICÁVEL:** se a spec não menciona UI nem dados.

---

## C-04 — Idioma: strings visíveis em inglês

**Fonte:** `PROJECT_STANDARDS.md` §Language
**O que verificar:** A spec especifica strings visíveis (labels,
`aria-label`, `alt`, `title`) em inglês?
**Violação:** Qualquer `R-xx` que determine texto visível em inglês.
**NÃO APLICÁVEL:** se a spec não define strings visíveis.

---

## C-05 — Estilo: utilitários de cor Tailwind

**Fonte:** `PROJECT_STANDARDS.md` §Styling
**O que verificar:** A spec propõe usar utilitários de cor do Tailwind
(`bg-slate-900`, `text-blue-500`, etc.)?
**Violação:** Qualquer menção a utilitário de cor Tailwind.
**NÃO APLICÁVEL:** se a spec não menciona estilização.

---

## C-06 — Estilo: cores literais sem TOKEN-EXCEPTION

**Fonte:** `PROJECT_STANDARDS.md` §Styling
**O que verificar:** A spec propõe usar cor literal (`white`, `#fff`,
`rgb(...)`, `hsl(...)`) sem declarar uma `TOKEN-EXCEPTION` na lista
001/002/003?
**Violação:** Cor literal proposta sem exceção declarada.
**NÃO APLICÁVEL:** se a spec não menciona cores.

---

## C-07 — Firebase: auth não-Google

**Fonte:** `PROJECT_STANDARDS.md` §Firebase
**O que verificar:** A spec propõe e-mail/senha, magic link, ou
autenticação anônima?
**Violação:** Qualquer menção a provedor diferente de Google.
**NÃO APLICÁVEL:** se a spec não toca autenticação.

---

## C-08 — Firebase: coleção sem regra explícita

**Fonte:** `PROJECT_STANDARDS.md` §Firebase / §Security rules
**O que verificar:** A spec cria ou modifica uma coleção do Firestore
sem especificar regras de leitura e escrita explícitas?
**Violação:** Nova coleção sem regra, ou alteração de regra sem
explicitar read/write.
**NÃO APLICÁVEL:** se a spec não toca Firestore.

---

## C-09 — Schema: nomenclatura de coleção/campo

**Fonte:** `PROJECT_STANDARDS.md` §Firebase
**O que verificar:** A spec propõe coleção em `lowercase plural
English` e campos em `camelCase`?
**Violação:** Coleção em outro formato (CamelCase, singular,
português) ou campo em snake_case/PascalCase.
**NÃO APLICÁVEL:** se a spec não define schema.

---

## C-10 — Plataforma: arquivo protegido

**Fonte:** `AGENTS.md` §Non-negotiable
**O que verificar:** A spec toca `vite.config.ts`, `eslint.config.js`,
`package.json`, `metadata.json`, regras do Firebase, ou os tokens de
cor do CSS global?
**Violação:** Qualquer um desses arquivos listado em `files:` sem uma
justificativa explícita de exceção.
**NÃO APLICÁVEL:** se nenhum arquivo protegido está no escopo.

---

## C-11 — Segredos: chave no cliente

**Fonte:** `AGENTS.md` §Non-negotiable
**O que verificar:** A spec propõe expor segredo em `VITE_*`,
`import.meta.env`, `src/`, ou UI de entrada de chave?
**Violação:** Qualquer menção a segredo no cliente.
**NÃO APLICÁVEL:** se a spec não toca configuração/segredos.

---

## C-12 — Derivação: `isStaff` ou `effectivePermissions` editados à mão

**Fonte:** `PROJECT_STANDARDS.md` §Derivation
**O que verificar:** A spec propõe escrever diretamente em `isStaff`
ou `effectivePermissions`?
**Violação:** Qualquer `R-xx` que determine escrita manual nesses
campos (eles são derivados de grupos).
**NÃO APLICÁVEL:** se a spec não toca permissões/grupos.

---

## C-13 — Ícones: SVG sem sanitização

**Fonte:** `PROJECT_STANDARDS.md` §Badges & Icons
**O que verificar:** A spec propõe aceitar SVG customizado sem passar
por `src/lib/svgSanitizer.ts`?
**Violação:** Qualquer fluxo de ícone customizado que ignore o
sanitizador.
**NÃO APLICÁVEL:** se a spec não toca ícones.

---

## C-14 — Chip: classes CSS por variante

**Fonte:** `PROJECT_STANDARDS.md` §Chip system
**O que verificar:** A spec propõe criar classes CSS por variante de
chip em vez de usar o componente único `<Chip>`?
**Violação:** Qualquer menção a classe CSS específica de chip.
**NÃO APLICÁVEL:** se a spec não toca chips/grupos/títulos.

---

## C-15 — Motion: efeito fora de superfície permitida

**Fonte:** `PROJECT_STANDARDS.md` §Effect Stack
**O que verificar:** A spec propõe efeito visual (tilt, spotlight,
holo, aurora, prism, shimmer, neon, ember) fora de `<EffectSurface>`,
chips, ou banners?
**Violação:** Efeito em superfície não permitida.
**NÃO APLICÁVEL:** se a spec não toca efeitos visuais.

---

## Tabela-resumo

| ID | Check | Fonte | Bloqueante? |
|---|---|---|---|
| C-01 | Escopo >5 arquivos | AGENTS.md §Scope | Sim |
| C-02 | Arquivos não nomeados | AGENTS.md §Scope | Sim |
| C-03 | Termos proibidos | AGENTS.md §Non-negotiable | Sim |
| C-04 | Strings em inglês | PROJECT_STANDARDS.md §Language | Sim |
| C-05 | Utilitário de cor Tailwind | PROJECT_STANDARDS.md §Styling | Sim |
| C-06 | Cor literal sem exceção | PROJECT_STANDARDS.md §Styling | Sim |
| C-07 | Auth não-Google | PROJECT_STANDARDS.md §Firebase | Sim |
| C-08 | Coleção sem regra | PROJECT_STANDARDS.md §Firebase | Sim |
| C-09 | Nomenclatura de schema | PROJECT_STANDARDS.md §Firebase | Sim |
| C-10 | Arquivo protegido | AGENTS.md §Non-negotiable | Sim |
| C-11 | Segredo no cliente | AGENTS.md §Non-negotiable | Sim |
| C-12 | Derivação editada à mão | PROJECT_STANDARDS.md §Derivation | Sim |
| C-13 | SVG sem sanitização | PROJECT_STANDARDS.md §Badges | Sim |
| C-14 | Chip por variante | PROJECT_STANDARDS.md §Chip | Sim |
| C-15 | Motion fora de superfície | PROJECT_STANDARDS.md §Effect Stack | Sim |

