#!/usr/bin/env tsx
/**

- Feature Proposal - le uma issue e gera branch + draft PR automaticamente.
- 
- A branch de trabalho e criada a partir de AI_BASE_BRANCH, e o draft PR
- tem AI_BASE_BRANCH como destino.
*/

import {
getOctokit,
getRepoContext,
getIssueNumber,
getAITargetBranch,
} from '../src/github/client.js';
import { createBranch, commitFile, buildBranchName } from '../src/github/branch-manager.js';
import { openDraftPR, postComment } from '../src/github/pr-manager.js';
import { ProviderRouter } from '../src/ai/provider-router.js';
import { StandardsLoader, getRepoRoot } from '../src/ai/context/standards-loader.js';
import { RepoContextBuilder } from '../src/ai/context/repo-context.js';
import { logAudit } from '../src/audit/audit-logger.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FeatureSpec, AuditEntry } from '../src/types/index.js';

const DRY_RUN = process.env.AI_DRY_RUN === 'true';

async function main() {
const start = Date.now();
const octokit = getOctokit();
const { owner, repo } = getRepoContext();
const issueNumber = getIssueNumber();
const baseBranch = getAITargetBranch();

console.log('\nFeature Proposal - Issue #' + issueNumber);
console.log('Branch base: ' + baseBranch + '\n');

const { data: issue } = await octokit.issues.get({
owner,
repo,
issue_number: issueNumber,
});

const labels = issue.labels
.map((l) => (typeof l === 'string' ? l : l.name))
.join(', ');

console.log('Issue: "' + issue.title + '"');
console.log('   Labels: ' + labels);

const standards = new StandardsLoader();
const repoContext = new RepoContextBuilder();

const promptTemplate = readFileSync(
join(getRepoRoot(), '.github', 'ai-config', 'prompts', 'feature-spec.md'),
'utf-8'
);

const userPrompt = promptTemplate
.replace('{{REPO_CONTEXT}}', repoContext.buildFullContext())
.replace('{{STANDARDS}}', standards.getCompactContext())
.replace('{{ISSUE_TITLE}}', issue.title)
.replace('{{ISSUE_BODY}}', issue.body || '(sem descricao)')
.replace('{{ISSUE_LABELS}}', labels);

const router = new ProviderRouter();
const providerList = router.getProviders().map((p) => p.config.id).join(' -> ');
console.log('\nCadeia de fallback: ' + (providerList || '(vazia)'));

const aiResponse = await router.complete(
'Voce e um engenheiro senior da MiningPoint. Retorne apenas JSON valido.',
userPrompt
);

console.log(
'\nResposta de "' + aiResponse.providerId + '" em ' + aiResponse.latencyMs + 'ms'
);

const spec = parseSpec(aiResponse.content);
console.log('\nSpec gerada: "' + spec.title + '"');
console.log('   Slug: ' + spec.slug);
console.log('   Complexidade: ' + spec.estimated_complexity);

if (DRY_RUN) {
console.log('\nDRY_RUN ativo - nada foi criado.');
console.log(JSON.stringify(spec, null, 2));
return;
}

const branchName = buildBranchName(spec.slug);
await createBranch(branchName, baseBranch);

const specPath = '.ai/specs/' + spec.slug + '.md';
await commitFile(
branchName,
specPath,
buildSpecMarkdown(spec, issueNumber),
'docs(ai): add spec for ' + spec.slug + ' (#' + issueNumber + ')'
);

const pr = await openDraftPR(branchName, spec, baseBranch);

const commentLines = [
'## Feature Proposal gerada',
'',
'- **Branch de trabalho:** ' + branchName,
'- **Branch base:** ' + baseBranch,
'- **Draft PR:** #' + pr.number,
'- **Provider:** ' + aiResponse.providerId,
'- **Complexidade:** ' + spec.estimated_complexity,
'',
'> O PR foi aberto como **draft**. Revise a spec, implemente e marque como pronto para review.',
];

await postComment(issueNumber, commentLines.join('\n'));

const entry: AuditEntry = {
timestamp: new Date().toISOString(),
action: 'feature_proposal',
issueNumber,
providerId: aiResponse.providerId,
model: aiResponse.model,
success: true,
durationMs: Date.now() - start,
details: {
specSlug: spec.slug,
branchName,
baseBranch,
prNumber: pr.number,
},
};
await logAudit(entry).catch((err) => console.warn('[audit] Falha ao registrar:', err));

console.log('\nConcluido em ' + (Date.now() - start) + 'ms');
console.log('   PR: ' + pr.url);
}

function parseSpec(raw: string): FeatureSpec {
const cleaned = raw
.replace(/^`(?:json)?\s*/gm, '')
    .replace(/`\s*/gm, '')
.trim();

try {
const parsed = JSON.parse(cleaned) as FeatureSpec;
if (!parsed.title || !parsed.slug || !parsed.summary) {
throw new Error('Spec incompleta: title, slug e summary sao obrigatorios.');
}

let slug = parsed.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
while (slug.startsWith('-')) slug = slug.slice(1);
while (slug.endsWith('-')) slug = slug.slice(0, -1);
parsed.slug = slug.slice(0, 50);

return parsed;
} catch (err) {
console.error('Falha ao parsear spec:', err);
console.error('Conteudo bruto:', raw.slice(0, 500));
throw new Error('A IA retornou uma spec em formato invalido.');
}
}

function buildSpecMarkdown(spec: FeatureSpec, issueNumber: number): string {
const lines = [
'# ' + spec.title,
'',
'> Spec gerada automaticamente a partir da issue #' + issueNumber + '.',
'',
'## Resumo',
'',
spec.summary,
'',
'## Abordagem tecnica',
'',
spec.technical_approach,
'',
'## Areas afetadas',
'',
spec.affected_areas.map((a) => '- ' + a).join('\n'),
'',
'## Criterios de aceite',
'',
spec.acceptance_criteria.map((c) => '- [ ] ' + c).join('\n'),
'',
'## Riscos',
'',
spec.risks.map((r) => '- ' + r).join('\n'),
'',
'## Padroes aplicaveis',
'',
spec.linked_standards.map((s) => '- ' + s).join('\n'),
'',
'## Metadados',
'',
'| Campo | Valor |',
'| --- | --- |',
'| Complexidade | ' + spec.estimated_complexity + ' |',
'| Issue original | #' + issueNumber + ' |',
];
return lines.join('\n');
}

main().catch((err) => {
console.error('\nFeature proposal falhou:', err);
process.exit(1);
});