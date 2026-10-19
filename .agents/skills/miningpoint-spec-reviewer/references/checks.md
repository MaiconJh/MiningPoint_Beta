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