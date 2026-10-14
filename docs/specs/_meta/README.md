# Fluxo de rastreabilidade de specs

Este diretório contém as specs do MiningPoint. Toda mudança material de
comportamento é precedida por uma spec, revisada e rastreada até o commit
que a implementou.

## Estrutura

`
docs/specs/
├── INDEX.md               ← registro central (único arquivo na raiz)
├── entries/               ← as specs, uma por arquivo
│   └── SPEC-NNNN-slug.md
├── audits/                ← relatórios da skill de verificação
│   └── SPEC-NNNN-YYYY-MM-DD.md
└── _meta/                 ← infraestrutura do fluxo (não é spec)
    ├── README.md          ← este arquivo (o manual)
    └── _TEMPLATE.md       ← template vazio para novas specs
`

## Estados

| Estado | Significado |
|---|---|
| `rascunho` | Em construção, ainda não submetida. |
| `em-leitura` | Submetida para revisão. |
| `aprovado` | Aprovada, pronta para implementação. Corpo congelado. |
| `negado` | Rejeitada. Motivo registrado no corpo. |
| `implementado` | Código aplicado. Requer `commit` no frontmatter. |
| `obsoleto` | Superada por outra spec. Requer `superseded_by`. |

`
rascunho ──► em-leitura ──► aprovado ──► implementado
                 │                          │
                 └──► negado                └──► obsoleto
`

**Regra de imutabilidade:** a partir de `aprovado`, o corpo da spec não é
editado silenciosamente. Alterações materiais viram uma nova linha no
Histórico de revisões ou uma nova spec que supersede.

## Como criar uma spec

1. Copie `_meta/_TEMPLATE.md` para `entries/SPEC-NNNN-slug.md`, onde `NNNN` é
   o próximo número livre (ver `INDEX.md`) e `slug` é um identificador curto
   em kebab-case.
2. Preencha o frontmatter com `status: rascunho`.
3. Escreva contexto, objetivo, requisitos (R-xx), restrições e fora de escopo.
4. Atualize `INDEX.md` com a nova linha.

## Como submeter para leitura

1. Troque `status` para `em-leitura` e atualize `updated`.
2. Abra um PR (ou avise o revisor).
3. O revisor preenche `reviewer` e `approved_at`, e troca o status para
   `aprovado` ou `negado`.

## Como implementar

1. Cole a spec no AI Studio.
2. Commite o resultado.
3. Marque os requisitos entregues no checklist R-xx.
4. Atualize o contador no topo dos requisitos: [5/8].
5. Preencha `commit`, `implemented_at` e troque `status` para `implementado`
   (só quando todos os R-xx estiverem marcados).
6. Atualize `INDEX.md`.

## Como auditar

A skill `MiningPoint-Spec-Verifier` lê o frontmatter para localizar a spec,
os arquivos declarados e o commit-alvo. Relatórios são gravados em
`audits/SPEC-NNNN-YYYY-MM-DD.md`, e o frontmatter da spec recebe o campo
`last_audit` apontando para o relatório mais recente.

## Convenções

- `id`: SPEC-NNNN, sequencial, nunca reutilizado.
- Uma spec por arquivo. Nunca acumule várias em um arquivo.
- O `INDEX.md` é atualizado a cada transição de estado.
- Código em inglês; corpo da spec em português (PROJECT_STANDARDS.md,
  seção Language).
