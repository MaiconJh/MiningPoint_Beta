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