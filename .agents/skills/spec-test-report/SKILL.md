---
name: spec-test-report
description: >
  Use when a spec implementation just finished — every `R-xx` delivered in
  a `docs/specs/entries/SPEC-NNNN-*.md`, or the user said "apliquei",
  "implementei", "terminei a spec", "resultado dos testes", "o que foi
  testado". Trigger before ending the response, even if the user did not
  ask. Do NOT use for unrelated test output or CI logs — this is only for
  closing a MiningPoint spec.
license: Proprietary
metadata:
  author: MiningPoint
  version: "1.1"
  project: MiningPoint_Beta
---

# Spec Test Report

## Overview

A closed spec carries a test report in its `## Testes` section — one
`T-NN` block per requirement. The `MiningPoint-Spec-Verifier` reads that
section as the `RELATADO` source; without it, the audit has nothing to
cross-reference.

Where the report goes and how it is delimited are already defined by
`docs/specs/_meta/_TEMPLATE.md`. This skill defines **only** the block
itself — its fields, its controlled vocabulary, and the rules that keep
it auditable.

## When to Use

Trigger the moment a spec implementation is done:

- Every `R-xx` in `docs/specs/entries/SPEC-NNNN-*.md` is ticked.
- The user said "apliquei", "implementei", "terminei a spec".
- The user asked for "testes", "resultado dos testes", "relatório de
  testes", "o que foi testado".
- You are about to write the closing response of a spec task.

Do **not** trigger for: unrelated test runs, CI logs, exploratory
debugging, or a spec that is still in `rascunho` / `em-leitura` /
`aprovado`.

## Hard Gates

<HARD-GATE>
The block must reflect **observed** execution only. Do not invent a
command, a count, a line number, an output, or a file path. If a test was
not run, `Executado: não`. If the outcome is unknown, `Resultado:
inconclusivo`. If nothing was prescribed, `Resultado: não-especificado`.
</HARD-GATE>

## Format

A single markdown block:

```

## Testes da Spec — <id> — <título>

### T-01 — <título curto>

- **Requisito:** R-01
- **Tipo:** unit | integration | build | lint | manual
- **Executado:** sim | não | parcial
- **Comando:** `<comando exato, se houver>`
- **Resultado:** passou | falhou | parcial | inconclusivo | não-especificado | não-aplicável
- **Evidência:** <arquivo, contagem, trecho de saída>
- **Erro:** <mensagem, apenas quando Resultado=falhou>
- **Observações:** <opcional, uma linha>

### T-02 — <título curto>

- **Requisito:** R-02
...

```

Rules:

- One `### T-NN` per test, numbered sequentially from `T-01`.
- Every `T-NN` points to at least one `R-xx`. A requirement with no test
  still gets a block, with `Resultado: não-especificado` and a one-line
  note in `Observações`.
- `Comando` appears only when a command was actually run.
- `Erro` appears only when `Resultado: falhou`, capped at 200 chars.
- Plain text — no emoji, no colour, no extra markup.

### Controlled vocabulary

Do not invent values. Use exactly:

| Field | Allowed values |
|---|---|
| `Tipo` | `unit` · `integration` · `build` · `lint` · `manual` |
| `Executado` | `sim` · `não` · `parcial` |
| `Resultado` | `passou` · `falhou` · `parcial` · `inconclusivo` · `não-especificado` · `não-aplicável` |

## Example

```

## Testes da Spec — SPEC-0042 — Autenticação de operadores

### T-01 — Login com credenciais válidas

- **Requisito:** R-01
- **Tipo:** integration
- **Executado:** sim
- **Comando:** `npm test -- auth.login`
- **Resultado:** passou
- **Evidência:** 4 testes, 4 passaram, 0 falharam

### T-02 — Bloqueio após 5 tentativas inválidas

- **Requisito:** R-02
- **Tipo:** unit
- **Executado:** sim
- **Comando:** `npm test -- auth.lockout`
- **Resultado:** falhou
- **Evidência:** `lockout.spec.ts:42`
- **Erro:** esperado 429, recebido 401

### T-03 — Mensagem de erro amigável

- **Requisito:** R-03
- **Tipo:** manual
- **Executado:** não
- **Resultado:** inconclusivo
- **Observações:** requer UI em ambiente de homologação

```

## Rationalizations

| Excuse | Reality |
|---|---|
| "The tests passed in my last message, I don't need a block." | The audit reads the spec, not the chat. Produce the block. |
| "This requirement has no test, I'll skip it." | Skipping means the audit sees silence. Emit `não-especificado`. |
| "I'll round up to `passou` from what I saw." | `passou` is the reported outcome. Inventing it is a red flag. |
| "The user can paste it later." | You finish the task with the block; the user only places it. |
| "It passed earlier so I'll reuse that result." | Only if the earlier run is part of *this* implementation. Otherwise `inconclusivo`. |

## Red Flags — Stop

- You are about to write a `Comando` you did not run.
- You are about to raise an outcome from `inconclusivo` to `passou`.
- You are about to skip a `R-xx` because it had no test.
- You are about to promote `passou` to `PASSOU` — that word belongs to the
  verifier, never to this block.
- You are about to mix the block with the rest of the response.
- You are about to edit a `T-NN` block already placed in the spec — that
  section is append-only; regenerate instead.

## References

- `docs/specs/_meta/_TEMPLATE.md` — defines the `## Testes` section and
  the markers the block sits between.
- `docs/specs/_meta/README.md` — the spec flow (states, transitions).
- `.agents/skills/spec-implementation/SKILL.md` — invokes this skill at
  closure.
- `.agents/skills/miningpoint-spec-verifier/SKILL.md` — consumes this
  block as `RELATADO`.
- `AGENTS.md` — global rules, response protocol.