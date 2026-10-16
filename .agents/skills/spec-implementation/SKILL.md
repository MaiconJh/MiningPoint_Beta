---
name: spec-implementation
description: >
  Use when the user asks to implement, apply, execute, or deliver a spec from
  `docs/specs/entries/` in the MiningPoint_Beta repository — including phrasings
  like "implementa a spec", "aplique a SPEC-NNNN", "vamos com a spec", "pode
  aplicar", "vai", "começa". Also use when the user pastes a SPEC-NNNN body and
  asks for the changes, or when a material behaviour change is requested without
  an existing spec (this skill creates one first and pauses for approval). Do NOT
  use to audit an already-implemented spec — that is `miningpoint-spec-verifier`
  — nor to review the text of a spec still in `em-leitura`.
license: Proprietary
metadata:
  author: DeepSeek Web
  version: "1.1.0"
  project: MiningPoint_Beta
  tags: spec, implementation, workflow, ai-studio
---

# Spec Implementation

## Overview

A spec is the unit of work that ties a request to a commit. This skill takes a
spec from `aprovado` to `implementado`, respecting the scope the spec declared
and delegating the test report to `spec-test-report`.

**Core principle:** the spec defines the work, the `files:` field defines the
boundary, and the closing checklist defines done. Nothing here overrides the
manual in `docs/specs/_meta/README.md` — if this file diverges from it, the
manual wins.

## When to Use

Trigger this skill when the intent is **produce or apply** a spec:

- Explicit: "implementa a spec", "aplique a SPEC-NNNN", "execute a spec",
  "atende a spec", "vamos com a spec", "pode aplicar", "vai", "começa".
- Contextual: the user pasted a `SPEC-NNNN` body and asks for the changes, or
  the conversation is already about a spec and the user says "avança".
- Missing spec: a material behaviour change is requested with no spec — this
  skill creates one from `_meta/_TEMPLATE.md` and **stops for approval**.

Do **not** trigger for: auditing an implemented spec (`miningpoint-spec-verifier`),
reviewing an `em-leitura` spec (owner-driven), or trivial edits that do not
change behaviour (typos, formatting, cosmetic tweaks).

## Hard Gates

<HARD-GATE>
Do NOT write production code, edit files, or scaffold anything until ALL three
conditions hold:

1. The target spec exists at `docs/specs/entries/SPEC-NNNN-*.md`.
2. Its frontmatter carries `status: aprovado`.
3. Every file you intend to touch is listed in the spec's `files:` frontmatter.

If any condition fails, stop and report the blocker. Do not auto-approve a spec,
do not widen the scope, do not start "just the easy part".
</HARD-GATE>

<EXTREMELY-IMPORTANT>
The spec body is frozen from `aprovado` onward. The only section you may write
to is `## Testes`, and only by placing the block produced by the
`spec-test-report` skill between its BEGIN/END markers. Never edit any other
part of the body — a material change becomes a new revision row or a new spec
that supersedes.
</EXTREMELY-IMPORTANT>

## Workflow

### 1. Pre-flight

Run these steps in order. Do not skip.

1. **Locate the spec.** If the user gave a `SPEC-NNNN`, open
   `docs/specs/entries/SPEC-NNNN-*.md`. If not, ask for the id. Never
   reconstruct a spec from memory.
2. **Read the frontmatter.** Extract `id`, `status`, `files`, `commit`,
   `implemented_at`. Apply the state table below.
3. **Read the scope.** Open every path in `files:`. Read before editing — no
   exceptions.
4. **Read the requirements.** Collect every `R-xx` with its acceptance
   criterion. Note the progress counter (`Progresso: [n/total]`).

### 2. State gate

| `status` found | Action |
|---|---|
| `rascunho` / `em-leitura` | Stop. The flow requires approval first. Do not auto-approve. |
| `aprovado` | Proceed to §3. |
| `implementado` | Stop. The spec is closed. Point to `miningpoint-spec-verifier` if the intent was to audit. If more work is needed, propose a new spec that supersedes. |
| `negado` / `obsoleto` | Stop. There is no work to do. |

If the spec is `aprovado` but the repo has changed materially since `updated:`,
flag the divergence and ask before proceeding.

### 3. Implement

- **Stay inside `files:`.** If a required change falls outside that list, stop
  and say so before touching anything.
- **Tick as you go.** After each `R-xx` is delivered, mark its checkbox and
  update the progress counter in the same edit cycle.
- **Verify locally.** Run `npm run check` and `npm test` (see `AGENTS.md` →
  Testing). If a test cannot be added, state why.
- **Respect the protected list.** Nothing under "Do not touch" in `AGENTS.md`
  is in scope unless the spec explicitly names it.

### 4. Close

The close only runs when every `R-xx` is ticked. Order is fixed.

1. **Produce the test report.** Load and follow
   `.agents/skills/spec-test-report/SKILL.md`. It is the single source of truth
   for the format. Place its output in the spec's `## Testes` section, between
   `<!-- BEGIN AI STUDIO REPORT -->` and `<!-- END AI STUDIO REPORT -->`.
2. **Update the frontmatter.** Set `status: implementado`, `implemented_at`,
   `updated`, and `commit` (or leave `commit: null` and record the pendency).
3. **Update `docs/specs/INDEX.md`.** The spec line and the aggregate counters.

If any of 1–3 cannot be completed, do **not** set `status: implementado`. Leave
the spec at `aprovado`, explain the blocker, and say what is missing.

## Common Rationalizations

| Excuse | Reality |
|---|---|
| "The spec is basically approved, I'll start." | `em-leitura` is not `aprovado`. Ask the owner. |
| "This extra file is small, it won't matter." | `files:` is the scope contract. Ask before widening it. |
| "I'll write the test report at the end in one go." | It goes in the spec file. Skipping it leaves the audit blind. |
| "The commit SHA isn't ready, I'll skip it." | Leave `commit: null`, record the pendency. Do not mark `implementado`. |
| "I'll tidy the neighbouring code while I'm here." | Out of scope. Keep diffs reviewable. |
| "The report block has a typo, I'll fix it inline." | It is append-only. Regenerate via `spec-test-report`. |

## Red Flags — Stop and Ask

- You are about to write code while `status: rascunho` or `em-leitura`.
- You are about to edit a file that is not in `files:`.
- You are about to mark `status: implementado` with an empty `## Testes`.
- You are about to edit the body of a spec (outside `## Testes`) after `aprovado`.
- You are about to edit the report block already pasted.
- You are about to invent a SHA, a date, an author, or a test output.

## Closing Checklist

- [ ] Spec read; `status: aprovado` confirmed before starting.
- [ ] Every file touched is listed in `files:`.
- [ ] All `R-xx` ticked; progress counter updated.
- [ ] `npm run check` passed (or the blocker is recorded).
- [ ] `npm test` passed (or the blocker is recorded).
- [ ] Report produced via `spec-test-report` and placed in `## Testes`.
- [ ] Frontmatter: `status`, `implemented_at`, `updated`, `commit` (or pendency).
- [ ] `docs/specs/INDEX.md` updated.
- [ ] Report block untouched after paste.
- [ ] Response follows the four-block protocol in `AGENTS.md` and confirms the
      closure items above.

## References

- `docs/specs/_meta/README.md` — authoritative manual for the spec flow.
- `docs/specs/_meta/_TEMPLATE.md` — template for new specs.
- `.agents/skills/spec-test-report/SKILL.md` — produces the `T-NN` report.
- `.agents/skills/miningpoint-spec-verifier/SKILL.md` — audits closed specs.
- `AGENTS.md` — commands, runtime rules, scope discipline, response protocol.