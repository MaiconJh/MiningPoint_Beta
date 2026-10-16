# Prompt canônico do AI Studio

Este arquivo contém o prompt que deve ser colado no AI Studio **antes** do
corpo da spec. Ele instrui o agente a produzir o relatório de testes no
formato `T-NN`, dentro da seção `## Testes` da própria spec.

O relatório é escrito entre os marcadores:

```
<!-- BEGIN AI STUDIO REPORT --><!-- END AI STUDIO REPORT -->
```

Nada fora desses marcadores é considerado relatório. A skill de auditoria
(`miningpoint-spec-verifier`) lê apenas o que está entre eles.

---

## Prompt

Copie o bloco abaixo integralmente e cole no AI Studio, seguido do corpo da
spec. Não altere os marcadores nem os nomes dos campos.

````text
Você vai implementar a spec aprovada abaixo. Ao terminar, produza um
relatório de testes no formato T-NN, dentro da seção `## Testes` da própria
spec, entre os marcadores `<!-- BEGIN AI STUDIO REPORT -->` e
`<!-- END AI STUDIO REPORT -->`.

Regras do relatório:

1. Um bloco `T-NN` por requisito `R-xx` que você conseguir verificar.
   Numeração sequencial, começando em `T-01`.
2. Cada bloco começa com `### T-NN — <título curto do teste>` e contém, nesta
   ordem, exatamente estes campos em negrito:
   - `**Requisito:**` — o `R-xx` que este teste cobre.
   - `**Tipo:**` — um de: `unit`, `integration`, `build`, `lint`, `manual`.
   - `**Executado:**` — `sim` ou `não`.
   - `**Comando:**` — o comando exato que você rodou, ou `—` se manual.
   - `**Resultado:**` — um de: `passou`, `falhou`, `parcial`,
     `inconclusivo`, `não-especificado`, `não-aplicável`.
   - `**Evidência:**` — o que você observou: saída de comando, arquivo e
     símbolo, ou descrição do que foi conferido à mão.
3. Se um requisito não tiver teste viável no ambiente, escreva mesmo assim o
   bloco com `**Executado:** não` e
   `**Resultado:** não-especificado`, explicando o motivo em
   `**Evidência:**`. Não invente resultado.
4. Se você não rodou um teste, não escreva `passou`. Use `não-especificado`
   ou `inconclusivo`.
5. Não edite nada fora da seção `## Testes`. O corpo da spec é congelado a
   partir de `aprovado`.

Exemplo de bloco:

### T-01 — Seção @nick renderiza no painel de edição

- **Requisito:** R-01
- **Tipo:** manual
- **Executado:** sim
- **Comando:** —
- **Resultado:** passou
- **Evidência:** `src/components/account/ProfileEditPanel.tsx` monta
  `<HandleSettings>` como primeiro bloco do corpo rolável, acima da seção
  de Imagens, com as três props exigidas.

Ao terminar a implementação, troque `status` no frontmatter para
`implementado` e preencha `commit`, `implemented_at`. Não atualize
`INDEX.md` — essa transição é feita pelo dono após o commit.

---

<corpo da spec vai aqui>
```

---

## Notas para o dono

- O prompt é **colado antes** do corpo da spec. O agente lê a spec, implementa
e devolve o relatório dentro dela.
- O campo `**Resultado:**` é o único que o auditor promove ou não. Valores
aceitos e o que significam estão na skill `miningpoint-spec-verifier`,
seção 3.4.
- Se o agente do AI Studio não tiver como rodar testes no ambiente dele,
todos os blocos sairão com `**Executado:** não`. Isso é o comportamento
correto — melhor um relatório honesto do que um `passou` fabricado.

