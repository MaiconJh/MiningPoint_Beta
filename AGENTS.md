# AGENTS.md

MiningPoint — operational rules for AI coding agents. `PROJECT_STANDARDS.md` owns
the domain layer (Firestore schema, colour tokens, routes, chip rules). This file
owns process. If they disagree, `PROJECT_STANDARDS.md` wins; explicit chat
instructions win over both.

Only this file, at the repository root, is the operational manual. A file named
`AGENTS.md.txt` or a copy outside the root is not authoritative.

## Before you edit

1. Read `PROJECT_STANDARDS.md` in full, from disk, not from memory.
2. Read the current content of every file you will touch, and the spec that
   governs the change.
3. Open your reply with one line:
   `Pre-flight: standards lido; spec SPEC-NNNN; escopo: <arquivos>.`
   If you cannot read the standards or locate the spec, stop and report it.

## Non-negotiable

- **Real data only.** Read and write through `src/lib/` and `src/hooks/`. When a
  collection is empty, render a Portuguese empty state. Application code and UI
  carry no hardcoded record arrays, no seed objects, and none of: `mock`, `fake`,
  `dummy`, `sample`, `placeholder`, `TODO`, `lorem`, "em breve", "demonstração",
  "prévia".
- **Portuguese interface, English code.** Every rendered string, `aria-label`,
  `alt` and `title` is Portuguese. Identifiers, files, comments and types are
  English.
- **Theme tokens only.** Use `var(--token)` or Tailwind layout utilities. The two
  `design-tokens/*` ESLint rules fail the build; do not bypass them.
- **Auth is Google-only.** Do not add email/password, magic link or anonymous
  providers.
- **Platform files stay untouched:** `vite.config.ts` (including `DISABLE_HMR`),
  `eslint.config.js`, `package.json`, `metadata.json`, Firebase rules, and the
  colour tokens in the global stylesheet.
- **Secrets stay server-side.** No key in `VITE_*`, `import.meta.env`, `src/`, or
  a key-entry UI.

## Commands

- `npm run check` — lint + typecheck; must pass.
- `npm test` — Vitest; must pass.
- `npm run dev` — Vite on port 3000, host 0.0.0.0.

## Scope

Change only the files named in the request or in the spec's `files:` frontmatter.
If the work needs more than five files, list them and wait for approval. Reuse an
existing component, hook or helper before creating one. Never recreate a file the
request did not name.

## Specs

Material behaviour changes need a spec in `docs/specs/entries/`. The states,
template, frontmatter and `R-xx` conventions live in `docs/specs/_meta/README.md`
— read it; do not reconstruct the flow from this file. A spec from `aprovado`
onward has a frozen body; its test report is append-only.

## Done means

- [ ] `npm run check` passes
- [ ] `npm test` passes
- [ ] the diff contains no mock, placeholder or hardcoded record array
- [ ] only in-scope files changed
- [ ] the reply ends with the four sections below

## Response

End every reply that changes or attempts to change code with these four sections,
in this order:

- `### Spec solicitada` — one short paragraph, in Portuguese.
- `### Arquivos alterados` — one bullet per file: path, what changed, why. Or
  "nenhum".
- `### Testes usados para validação` — command, pass/fail, coverage. Or which
  command was skipped and why.
- `### Sugestões` — only if useful; otherwise "nenhuma".

## When in doubt

Stop and ask. A wrong assumption costs more than a question. If the request
conflicts with `PROJECT_STANDARDS.md`, say so before writing code.
