# MiningPoint AI Workflow — Orquestrador de PRs

Este diretório contém o **código do orquestrador** que roda dentro do GitHub Actions. Ele é responsável por:

1. Ler issues marcadas com `ai:propose`
2. Gerar especificações técnicas via IA (sem exigir configuração de chave)
3. Criar branches `ai/feat-*` a partir de `AI_ORCHESTRATOR`
4. Abrir draft PRs apontando para `AI_ORCHESTRATOR`
5. Revisar PRs automaticamente
6. Validar conformidade com o `PROJECT_STANDARDS.md`
7. Registrar tudo em log auditável

## Estrutura

```
ai-workflow/
├── ai.config.json                Configuração dos providers de IA
├── package.json                  Dependências (Node + Octokit + zod)
├── tsconfig.json                 TypeScript config
├── src/
│   ├── types/                    Contratos compartilhados
│   ├── ai/
│   │   ├── config/               Schema, loader e defaults
│   │   ├── providers/            Adapters por protocolo (não por vendor)
│   │   ├── factory.ts            Config -> adapter
│   │   ├── provider-router.ts    Fallback + circuit breaker
│   │   └── context/              Standards + contexto do repo
│   ├── github/                   Octokit, branches, PRs, reviews
│   └── audit/                    Audit log em JSONL
└── scripts/
    ├── providers.ts              CLI de gerenciamento de providers
    ├── feature-proposal.ts       Issue -> spec -> PR
    ├── code-review.ts            PR -> comentários de review
    └── standards-check.ts        PR -> validação de conformidade
```

## Como funciona

O diretório é executado pelo GitHub Actions em `.github/workflows/`. Cada workflow:

1. Faz checkout da branch `AI_ORCHESTRATOR`
2. Roda `npm install` dentro de `ai-workflow/`
3. Executa o script correspondente passando `REPO_ROOT` para a raiz do repo

O orquestrador lê `PROJECT_STANDARDS.md` e os prompts em `.github/ai-config/prompts/` **a partir da raiz do repositório** (via `REPO_ROOT`).

## Providers de IA

Por padrão, o sistema usa o gateway do **Kilo Code Auto Free** com a chave literal `anonymous`. Não é necessário criar conta, gerar key ou configurar secret.

Para adicionar outros providers (BYOK), edite `ai.config.json` ou use a CLI:

```
npm run providers list
npm run providers add
npm run providers test-all
```

## Variáveis de ambiente consumidas

| Variável ↕▾ | Default ↕▾ | Descrição ↕▾ |
|---|---|---|
| −`REPO_ROOT` | `process.cwd()` | Raiz do repo (para ler standards e prompts) |
| `AI_BASE_BRANCH` | `main` | Branch alvo do orquestrador (definir como `AI_ORCHESTRATOR`) |
| `AI_CONFIG_JSON` | — | Config inline (prioridade máxima) |
| `AI_CONFIG_PATH` | `./ai.config.json` | Caminho alternativo para config |
| `AI_PROVIDER_KEYS_JSON` | — | Blob JSON com chaves BYOK |
| `KILO_ANONYMOUS_KEY` | `anonymous` | Injetada automaticamente |
| `AI_DRY_RUN` | `false` | Se `true`, não cria branches nem PRs |
| `AUDIT_BRANCH` | `audit-log` | Branch onde os logs são commitados |
⚙

## Desenvolvimento local

Para testar os scripts fora do Actions:

```
cd ai-workflow
npm install

# Valida a config
npm run providers validate

# Lista providers
npm run providers list

# Testa a cadeia de fallback
npm run providers test-all

# Simula um feature proposal (sem criar nada)
GITHUB_REPOSITORY=owner/repo ISSUE_NUMBER=1 AI_DRY_RUN=true npm run feature:propose
```

## Notas técnicas

- **Sem template literals com interpolação**: o código usa concatenação de strings para evitar corrupção por renderizadores de markdown.
- **Regex sem âncoras de fim**: validações usam a função `matchesFull` que compara o match inteiro contra a string de entrada.
- **Zero vendor lock-in**: o roteador só conhece tipos de protocolo (`openai-compatible`, `google-generative`). Nenhum nome de provider aparece no código-fonte.
- **A IA nunca faz merge**: PRs são sempre abertos como draft e a decisão final é humana.

## Licença

MIT