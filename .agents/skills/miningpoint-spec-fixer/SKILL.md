---
name: miningpoint-spec-fixer
description: >
  Corrige uma spec do repositório MiningPoint_Beta aplicando as correções
  indicadas por um parecer de review em `docs/specs/reviews/SPEC-NNNN-review.md`.
  Use quando o usuário pedir para "corrigir a spec", "aplicar as correções
  do parecer", "resolver os achados da review", "corrigir a SPEC-NNNN
  conforme o parecer", ou quando houver um parecer de review com veredito
  REPROVADO ou COM RESSALVAS e o usuário quiser aplicar as correções.
  Totalmente autônoma para correções mecanicamente determináveis; quando
  o parecer oferece múltiplas correções válidas que mudam o escopo, escolhe
  a mais conservadora, registra a alternativa descartada e NÃO transita o
  status até o usuário confirmar. NÃO use para gerar specs nem para auditar
  implementação (use `miningpoint-spec-verifier`).
version: 1.0.0
author: DeepSeek Web
tags: [spec, fix, miningpoint, governance, pre-implementation, apply-review]
---

# Skill: miningpoint-spec-fixer

## 0. O que esta skill faz (e o que não faz)

Esta skill é o **corretor de spec** que consome um parecer de review e
aplica as correções na spec. Ela é a skill irmã da
`miningpoint-spec-reviewer` (que emite o parecer) e da
`miningpoint-spec-verifier` (que audita a implementação).

Fluxo de referência:

```

reviewer (emite parecer) → fixer (aplica correções) → verifier (audita implementação)

```

**Ela nunca:**
- Gera spec do zero. Pedido de spec está fora do escopo.
- Audita implementação, lê commits ou roda testes.
- Corrige uma spec sem parecer de review. Sem parecer, não há achado
  para ancorar a correção.
- Inventa achados que não estão no parecer.

**Quando NÃO usar esta skill:**
- Não existe parecer em `docs/specs/reviews/SPEC-NNNN-review.md` →
  encerrar e pedir o parecer.
- O parecer tem veredito `APROVADO` ou `CONFORME` → não há o que
  corrigir. Encerrar.
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
   as correções.

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

### Passo 1 — Identificar a spec e o parecer

1. Obtenha o caminho da spec. Se o usuário não indicou, peça o `id`
   (`SPEC-NNNN`) ou uma palavra-chave e localize via `find_files` em
   `docs/specs/entries/`.
2. Localize o parecer em `docs/specs/reviews/SPEC-NNNN-review.md`. Se
   não existir, **pare** e peça ao usuário.
3. Leia o frontmatter da spec com `read_file`. Extraia: `id`, `title`,
   `status`, `files`, `approved_at`, `reviewer`.
4. Leia o parecer integralmente. Extraia: veredito, eixos executados,
   achados bloqueantes, achados não-bloqueantes, próximos passos.

**Se o veredito for `APROVADO` ou `CONFORME`:** encerre. Não há o que
corrigir.

**Se a spec estiver em `implementado`:** encerre e redirecione para
`miningpoint-spec-verifier`.

### Passo 2 — Ler as fontes da verdade

Leia, via `read_file`:
- `PROJECT_STANDARDS.md` (integral).
- `AGENTS.md` (integral).
- `docs/specs/_meta/README.md` (integral).

Se algum não existir, registre limitação e siga com o que houver.

### Passo 3 — Ler a spec integral

Leia a spec inteira com `read_file`. Confirme que as linhas citadas no
parecer (evidências) existem e correspondem ao que o parecer descreve.
Se a spec mudou desde o parecer, registre a divergência e pergunte ao
usuário antes de prosseguir.

### Passo 4 — Planejar as correções

Carregue `references/corrections.md` e, para cada achado do parecer:

1. Classifique o achado em **mecanicamente determinável** ou
   **múltiplas correções válidas que mudam escopo** (ver Seção 2).
2. Determine a correção concreta (o que muda, em qual linha/seção).
3. Verifique se a correção não viola uma regra de
   `PROJECT_STANDARDS.md` nem de `AGENTS.md`.

Monte um plano de correções no formato da Seção 5.

### Passo 5 — Aplicar as correções

Para cada correção do plano:

1. Construa um patch V4A com o contexto real da spec.
2. Chame `apply_patch` com `confirm=false` (dry-run).
3. Leia `preview` e `failed` no retorno.
4. Se o dry-run passar, chame `apply_patch` com `confirm=true`.

**Regra de ouro:** nunca aplique um patch sem antes ver o `preview` do
dry-run. Se o dry-run falhar (`failed[*].stage == "apply"`), releia a
spec e refaça o hunk com o contexto exato.

Se uma correção depende de outra (ex.: remover `src/index.css` do
`files:` **e** remover a menção a ele no corpo), aplique as duas no
mesmo patch ou em sequência, nunca em ordem que deixe a spec
inconsistente no meio.

### Passo 6 — Decidir a transição de status

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

### Passo 7 — Emitir o relatório de correção

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

```
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

- **Leitura:** `read_file`, `read_multiple_files`, `find_files`,
`list_directory`, `search_files` (MCP Local Files).
- **Escrita:** `apply_patch` (MCP Local Files Write), sempre com
dry-run antes de `confirm=true`.

### Proibições absolutas

- Nunca chame `apply_patch` sem dry-run anterior.
- Nunca aplique um patch que o dry-run não confirmou.
- Nunca altere arquivos fora da spec e do parecer (não toque em
`PROJECT_STANDARDS.md`, `AGENTS.md`, código, etc.).
- Nunca invente achados que não estão no parecer.
- Nunca transite para `aprovado` se houver achado não corrigido ou
fallback pendente de confirmação.
- Nunca use `mode="permanent"` em `delete_file`. Se precisar remover
algo, use `apply_patch` com `*** Delete File:`.
- Nunca rode testes, lint, typecheck, build.
- Nunca leia commits, diffs ou código remoto.

## 7. Checklist antes de emitir

- [ ] Parecer lido integralmente e veredito confirmado (`REPROVADO` ou `COM RESSALVAS`).
- [ ] Spec lida integralmente.
- [ ] `PROJECT_STANDARDS.md` lido integralmente.
- [ ] `AGENTS.md` lido integralmente.
- [ ] `docs/specs/_meta/README.md` lido integralmente.
- [ ] Cada achado classificado (mecânico vs fallback).
- [ ] Cada correção tem evidência (linha/seção da spec).
- [ ] Dry-run executado antes de cada `confirm=true`.
- [ ] Fallback documentado registra escolha e alternativa descartada.
- [ ] Status só foi transitado se não houver fallback pendente.
- [ ] Nenhum arquivo fora da spec foi alterado.
- [ ] Limitações declaradas explicitamente.

## 8. Referências cruzadas

- **Mapeamento achado → correção:** `references/corrections.md`
- **Parecer de review:** `docs/specs/reviews/SPEC-NNNN-review.md`
- **Fluxo e transições de estado:** `docs/specs/_meta/README.md`
- **Template da spec:** `docs/specs/_meta/_TEMPLATE.md`
- **Regras de domínio:** `PROJECT_STANDARDS.md`
- **Regras de processo:** `AGENTS.md`
- **Skill que emite o parecer:** `miningpoint-spec-reviewer`
- **Skill de auditoria pós-implementação:** `miningpoint-spec-verifier`
- **Ferramentas MCP de leitura:** skill `MCP-Local-Files-Usage`
- **Ferramentas MCP de escrita:** skill `MCP-Files-Write-Usage`

</BDS:create_file>

<BDS:create_file fileName="miningpoint-spec-fixer/references/corrections.md">

```markdown
# Mapeamento achado → correção

Carregue este arquivo ao planejar as correções (Passo 4 do
`miningpoint-spec-fixer`).

Cada tipo de achado tem uma ou mais correções possíveis. A skill
classifica cada achado em **mecânico** (correção única, não muda
escopo) ou **fallback** (múltiplas opções válidas que mudam escopo).
No fallback, escolhe a opção mais conservadora e registra a alternativa.

---

## A-01 — Incongruência de ciclo de vida no frontmatter

**Achado típico:** `status: rascunho` com `approved_at` preenchido.
**Tipo:** mecânico.
**Correção:** trocar `approved_at` por `null` (e `reviewer` por `null`,
se também estiver preenchido).
**Evidência:** linha do frontmatter onde o campo aparece.
**Risco:** baixo.

---

## A-02 — Seção `## Testes` preenchida em spec não-implementado

**Achado típico:** spec em `rascunho`/`em-leitura`/`aprovado` com
blocos T-NN na seção `## Testes`.
**Tipo:** mecânico.
**Correção:** remover o conteúdo entre os marcadores
`<!-- BEGIN AI STUDIO REPORT -->` e `<!-- END AI STUDIO REPORT -->`,
mantendo os marcadores e a seção vazia.
**Evidência:** bloco `## Testes` da spec.
**Risco:** baixo (o relatório de testes só existe em `implementado`).

---

## A-03 — Frontmatter incompleto

**Achado típico:** falta `id`, `title`, `files` ou outro campo
obrigatório.
**Tipo:** mecânico **se** o valor puder ser derivado da spec; caso
contrário, fallback (perguntar ao usuário).
**Correção:** adicionar o campo com o valor derivado do corpo da spec
ou do template.
**Evidência:** frontmatter da spec.
**Risco:** médio se o valor não for óbvio.

---

## B-01 — Contradição de escopo (R-xx exige algo fora do `files:`)

**Achado típico:** R-07 exige histórico de revisões, mas
`types/forum.ts` e `lib/forumThreads.ts` estão fora do `files:` e na
seção "Fora de escopo".
**Tipo:** fallback.
**Opções do parecer:**
- **Opção A:** mover R-07/R-08 para "Fora de escopo" (reduz escopo).
- **Opção B:** adicionar `types/forum.ts` + `lib/forumThreads.ts` ao
  `files:` e descrever o schema (aumenta escopo).
**Correção escolhida:** **Opção A** (mais conservadora — reduz escopo).
**Registro:** no relatório de correção, com a alternativa descartada.
**Status travado:** sim, até o usuário confirmar.
**Risco:** médio.

---

## B-02 — Escopo >5 arquivos sem justificativa

**Achado típico:** `files:` lista mais de 5 arquivos sem seção de
aprovação.
**Tipo:** mecânico **se** o parecer indicar quais arquivos remover;
caso contrário, fallback.
**Correção:** adicionar seção `## Aprovação de escopo` listando os
arquivos e a justificativa, **ou** remover arquivos se o parecer
indicar que são redundantes.
**Evidência:** frontmatter `files:`.
**Risco:** médio.

---

## C-03 — Termo proibido no corpo

**Achado típico:** spec menciona "mock", "placeholder", "em breve" etc.
em texto que descreve comportamento visível.
**Tipo:** mecânico.
**Correção:** substituir o termo pelo equivalente correto (ex.:
"placeholder" → "estado vazio com mensagem em português"; "em breve" →
"conteúdo pendente de spec própria").
**Evidência:** linha onde o termo aparece.
**Risco:** baixo.

---

## C-04 — String visível em inglês

**Achado típico:** R-xx determina label/aria-label em inglês.
**Tipo:** mecânico.
**Correção:** traduzir a string para pt-BR, mantendo o identificador em
inglês.
**Evidência:** R-xx que define a string.
**Risco:** baixo.

---

## C-05 — Utilitário de cor Tailwind

**Achado típico:** spec propõe `bg-slate-900`, `text-blue-500` etc.
**Tipo:** mecânico.
**Correção:** substituir por `var(--token)` correspondente.
**Evidência:** linha onde o utilitário aparece.
**Risco:** baixo.

---

## C-06 — Cor literal sem `TOKEN-EXCEPTION`

**Achado típico:** spec propõe `#fff`, `rgb(...)` etc. sem exceção.
**Tipo:** mecânico.
**Correção:** substituir por `var(--token)` correspondente, **ou**
adicionar bloco `TOKEN-EXCEPTION` se a exceção for justificada.
**Evidência:** linha onde a cor aparece.
**Risco:** baixo.

---

## C-07 — Auth não-Google

**Achado típico:** spec propõe e-mail/senha, magic link ou anônimo.
**Tipo:** mecânico.
**Correção:** remover a menção ao provedor não-Google e substituir por
"Google provider only" (conforme `PROJECT_STANDARDS.md` §Firebase).
**Evidência:** R-xx que propõe o provedor.
**Risco:** médio (muda comportamento descrito).

---

## C-08 — Coleção sem regra explícita

**Achado típico:** spec cria coleção sem especificar regras read/write.
**Tipo:** mecânico **se** o parecer indicar as regras; caso contrário,
fallback.
**Correção:** adicionar ao R-xx a exigência de regras explícitas de
leitura e escrita.
**Evidência:** R-xx que cria a coleção.
**Risco:** médio.

---

## C-09 — Nomenclatura de schema

**Achado típico:** coleção em CamelCase/singular/português, ou campo
em snake_case/PascalCase.
**Tipo:** mecânico.
**Correção:** renomear para `lowercase plural English` (coleção) ou
`camelCase` (campo).
**Evidência:** linha onde o nome aparece.
**Risco:** baixo.

---

## C-10 — Arquivo protegido no escopo

**Achado típico:** `vite.config.ts`, `eslint.config.js`,
`package.json`, `metadata.json`, regras Firebase ou tokens de cor no
`files:` sem justificativa.
**Tipo:** mecânico **se** o arquivo for redundante; fallback se for
necessário.
**Correção:** remover o arquivo do `files:` (se redundante) **ou**
adicionar justificativa explícita de exceção.
**Evidência:** frontmatter `files:`.
**Risco:** médio.

---

## C-11 — Segredo no cliente

**Achado típico:** spec propõe chave em `VITE_*`, `import.meta.env`,
`src/` ou UI de entrada de chave.
**Tipo:** mecânico.
**Correção:** remover a menção ao segredo; se necessário, mover para
camada server-side (fora do escopo do cliente).
**Evidência:** R-xx que expõe o segredo.
**Risco:** alto (segurança).

---

## C-12 — `isStaff`/`effectivePermissions` editados à mão

**Achado típico:** R-xx determina escrita manual nesses campos.
**Tipo:** mecânico.
**Correção:** substituir por "derivado dos grupos via
`unionUserPermissions` e `deriveIsStaff`".
**Evidência:** R-xx que determina a escrita.
**Risco:** médio.

---

## C-13 — SVG sem sanitização

**Achado típico:** fluxo de ícone customizado ignora
`svgSanitizer.ts`.
**Tipo:** mecânico.
**Correção:** adicionar ao R-xx a exigência de passar por
`src/lib/svgSanitizer.ts`.
**Evidência:** R-xx que descreve o fluxo.
**Risco:** médio.

---

## C-14 — Chip por variante

**Achado típico:** spec propõe classes CSS por variante de chip.
**Tipo:** mecânico.
**Correção:** substituir por "usar o componente único `<Chip>` com
`chipStyle`".
**Evidência:** R-xx que propõe as classes.
**Risco:** baixo.

---

## C-15 — Motion fora de superfície permitida

**Achado típico:** efeito visual em superfície não permitida.
**Tipo:** mecânico.
**Correção:** restringir o efeito a `<EffectSurface>`, chips ou banners,
ou remover a menção ao efeito.
**Evidência:** R-xx que propõe o efeito.
**Risco:** médio.

---

## D-01 — Dependência de comportamento inexistente no codebase

**Achado típico:** R-05 assume janela de edição de 2h que
`canEditThread` não implementa, e a spec proíbe alterar a função.
**Tipo:** fallback.
**Opções do parecer:**
- **Opção A:** calcular a janela no componente `ThreadView.tsx`
  (Date.now() - thread.createdAt) — mantém escopo.
- **Opção B:** criar helper novo em `lib/` — aumenta escopo (novo
  arquivo).
- **Opção C:** alterar `canEditThread` — viola a proibição da spec.
**Correção escolhida:** **Opção A** (mais conservadora — mantém
escopo, respeita a proibição).
**Registro:** no relatório, com a alternativa descartada.
**Status travado:** sim, até o usuário confirmar.
**Risco:** médio.

---

## D-02 — Arquivo no `files:` é redundante

**Achado típico:** `src/index.css` no `files:`, mas as classes de
transição já existem e a spec proíbe criar novas.
**Tipo:** mecânico.
**Correção:** remover o arquivo do `files:` (se realmente redundante)
**ou** manter e justificar (se a spec precisar de uma classe nova de
saída).
**Evidência:** frontmatter `files:` + R-xx que menciona o arquivo.
**Risco:** baixo se redundante; médio se necessário.

---

## E-01 — Risco de dados fictícios

**Achado típico:** R-xx exige histórico com autor/data, mas a camada
de dados está fora de escopo.
**Tipo:** fallback (mesmo que B-01).
**Correção escolhida:** mover o R-xx para "Fora de escopo" (reduz
escopo).
**Registro:** no relatório, com a alternativa descartada.
**Status travado:** sim, até o usuário confirmar.
**Risco:** alto (viola "Real data only" se implementado sem dados).

---

## E-02 — Concorrência não especificada

**Achado típico:** R-06 exige detecção de remoção concorrente, mas não
define se é listener em tempo real (`onSnapshot`) ou validação na
submissão.
**Tipo:** fallback.
**Opções:**
- **Opção A:** validação na tentativa de submissão do `updateThread`
  (mais simples, mantém escopo).
- **Opção B:** listener `onSnapshot` (mais complexo, aumenta escopo).
**Correção escolhida:** **Opção A** (mais conservadora).
**Registro:** no relatório, com a alternativa descartada.
**Status travado:** sim, até o usuário confirmar.
**Risco:** médio.

---

## Tabela-resumo

| ID | Tipo | Correção padrão | Status travado? |
|---|---|---|---|
| A-01 | mecânico | `approved_at` → `null` | Não |
| A-02 | mecânico | Limpar `## Testes` | Não |
| A-03 | mecânico/fallback | Adicionar campo | Depende |
| B-01 | fallback | Mover R-xx para "Fora de escopo" | Sim |
| B-02 | mecânico/fallback | Adicionar justificativa ou remover arquivo | Depende |
| C-03 | mecânico | Substituir termo proibido | Não |
| C-04 | mecânico | Traduzir string | Não |
| C-05 | mecânico | Substituir por `var(--token)` | Não |
| C-06 | mecânico | Substituir por token ou `TOKEN-EXCEPTION` | Não |
| C-07 | mecânico | Remover provedor não-Google | Não |
| C-08 | mecânico/fallback | Adicionar regras explícitas | Depende |
| C-09 | mecânico | Renomear schema | Não |
| C-10 | mecânico/fallback | Remover arquivo ou justificar | Depende |
| C-11 | mecânico | Remover segredo do cliente | Não |
| C-12 | mecânico | Derivar dos grupos | Não |
| C-13 | mecânico | Exigir sanitização | Não |
| C-14 | mecânico | Usar `<Chip>` | Não |
| C-15 | mecânico | Restringir superfície | Não |
| D-01 | fallback | Calcular no componente | Sim |
| D-02 | mecânico | Remover do `files:` | Não |
| E-01 | fallback | Mover para "Fora de escopo" | Sim |
| E-02 | fallback | Validação na submissão | Sim |

