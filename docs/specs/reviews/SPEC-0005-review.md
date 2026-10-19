---
id: SPEC-0005
spec: docs/specs/entries/SPEC-0005-camadas-card-topico.md
verdict: APROVADO COM RESSALVAS
status_at_review: em-leitura
reviewed_at: 2026-10-19T07:48:00Z
reviewer_version: 1.1.0
axes_executed: [A, B, C, D, E]
blocking_findings: 0
non_blocking_findings: 3
---

# Parecer de Review — SPEC-0005 — Camadas de responsabilidade no card de tópico do fórum

## 1. Resumo
- **Veredito:** APROVADO COM RESSALVAS
- **Spec:** SPEC-0005 — Camadas de responsabilidade no card de tópico do fórum
- **Status atual:** em-leitura
- **Eixos executados:** A, B, C, D, E
- **Achados bloqueantes:** 0
- **Achados não-bloqueantes:** 3
- **Limitação principal:** Nenhuma relevante; a spec é concisa, focada estritamente em refinar a composição do ThreadListItem da SPEC-0003 sem impacto funcional ou de schema.

## 2. Eixo A — Estrutura
- **Estado:** CONFORME
- **Achados:**
  - [A-01] Frontmatter com `author: null` (não-bloqueante) — Evidência: linha 7 da spec (`author: null`) — Regra: docs/specs/_meta/README.md §Como criar uma spec. Recomenda-se preencher a autoria antes de transicionar para `aprovado`.

## 3. Eixo B — Escopo
- **Estado:** CONFORME
- **Achados:**
  - [B-01] Oportunidade de redução de escopo para 1 arquivo (não-bloqueante) — Evidência: linhas 16-18 (`files: [src/components/forum/ThreadListItem.tsx, src/index.css]`) e linhas 132-135 — Regra: AGENTS.md §Scope e §Non-negotiable. O arquivo `src/index.css` é protegido, porém possui justificativa explícita na linha 132. Caso o divisor com `color-mix` seja aplicado via classes utilitárias no JSX de `ThreadListItem.tsx`, a edição de `src/index.css` torna-se dispensável.

## 4. Eixo C — Normas duras
- **Estado:** CONFORME
- **Checks executados:** 15 de 15
- **Achados:**
  | ID | Check | Estado | Evidência | Regra |
  |---|---|---|---|---|
  | C-01 | Escopo >5 arquivos | CONFORME | `files:` lista 2 arquivos | AGENTS.md §Scope |
  | C-02 | Arquivos não nomeados | CONFORME | Todas as mudanças descritas referem-se aos arquivos listados | AGENTS.md §Scope |
  | C-03 | Termos proibidos | CONFORME | Nenhum termo proibido presente no corpo | AGENTS.md §Non-negotiable |
  | C-04 | Strings em inglês | CONFORME | Textos e fallbacks em português ("Fixado", "Trancado", "Resolvido", "Membro") | PROJECT_STANDARDS.md §Language |
  | C-05 | Utilitário de cor Tailwind | CONFORME | Não introduz classes de cor Tailwind | PROJECT_STANDARDS.md §Styling |
  | C-06 | Cor literal sem exceção | CONFORME | Cores baseadas em `var(--token)` e derivação via `color-mix` | PROJECT_STANDARDS.md §Styling |
  | C-07 | Auth não-Google | NÃO APLICÁVEL | Não altera autenticação | PROJECT_STANDARDS.md §Firebase |
  | C-08 | Coleção sem regra | NÃO APLICÁVEL | Não altera nem adiciona coleções Firestore | PROJECT_STANDARDS.md §Firebase |
  | C-09 | Nomenclatura de schema | NÃO APLICÁVEL | Nenhum schema alterado | PROJECT_STANDARDS.md §Firebase |
  | C-10 | Arquivo protegido | CONFORME | `src/index.css` conta com justificativa explícita de exceção nas linhas 132-135 | AGENTS.md §Non-negotiable |
  | C-11 | Segredo no cliente | NÃO APLICÁVEL | Sem credenciais ou variáveis de ambiente | AGENTS.md §Non-negotiable |
  | C-12 | Derivação editada à mão | NÃO APLICÁVEL | Não toca em grupos nem permissões | PROJECT_STANDARDS.md §Derivation |
  | C-13 | SVG sem sanitização | NÃO APLICÁVEL | Utiliza ícones Lucide pré-existentes | PROJECT_STANDARDS.md §Badges & Icons |
  | C-14 | Chip por variante | NÃO APLICÁVEL | Não introduz variantes de Chip | PROJECT_STANDARDS.md §Chip system |
  | C-15 | Motion fora de superfície | CONFORME | R-07 restringe movimento à transição já existente (`forum-card-transition`) | PROJECT_STANDARDS.md §Effect Stack |

## 5. Eixo D — Coerência com codebase
- **Estado:** CONFORME
- **Arquivos lidos:** `src/components/forum/ThreadListItem.tsx`, `src/index.css`
- **Achados:**
  - [D-01] Semântica HTML do container e zonas (não-bloqueante) — Evidência: linha 71-73 de R-01 ("renderiza exatamente três regiões semânticas usando elementos header, article e footer (ou role equivalente)"). O item `ThreadListItem` já é um card de lista; estruturalmente o próprio container do card pode ser a tag `<article>` (ou elemento com `role="article"`), contendo `<header>`, `<div className="...">` (para o conteúdo) e `<footer>`, garantindo conformidade semântica plena sem sobrepor articles internos.

## 6. Eixo E — Riscos e lacunas
- **Estado:** CONFORME
- **Achados:** Nenhum risco impeditivo. R-06 contempla explicitamente tópicos sem categoria, reações desligadas, falha no carregamento do autor e corpo do tópico vazio sem quebra de layout. R-08 resguarda explicitamente integridade de links, cache de requisições de perfil e compacidade de markdown.

## 7. Próximos passos
1. Opcionalmente preencher o campo `author` no frontmatter de `SPEC-0005`.
2. O revisor/humano pode aprovar a spec (`status: aprovado`, `approved_at: 2026-10-19`, `reviewer: <nome>`), congelando o corpo para implementação.
3. Na implementação, avaliar a aplicação do divisor semântico diretamente via Tailwind no JSX de `ThreadListItem.tsx`, permitindo manter `src/index.css` intocado.

**Limite do parecer:** Esta revisão avalia a conformidade conceitual, estrutural e normativa da especificação SPEC-0005 frente a PROJECT_STANDARDS.md e AGENTS.md. Não realiza execuções de build ou alterações em código-fonte.
