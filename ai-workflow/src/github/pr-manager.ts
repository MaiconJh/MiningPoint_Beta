import { getOctokit, getRepoContext, getAITargetBranch } from './client.js';
import type { FeatureSpec } from '../types/index.js';

export async function openDraftPR(
branchName: string,
spec: FeatureSpec,
baseRef?: string
): Promise<{ number: number; url: string }> {
const octokit = getOctokit();
const { owner, repo } = getRepoContext();
const base = baseRef ?? getAITargetBranch();

const { data: pr } = await octokit.pulls.create({
owner,
repo,
title: spec.title,
head: branchName,
base,
body: buildPRBody(spec, base),
draft: true,
});

console.log('[pr] Draft PR #' + pr.number + ' aberto: ' + pr.html_url);
return { number: pr.number, url: pr.html_url };
}

function buildPRBody(spec: FeatureSpec, baseBranch: string): string {
const criteria = spec.acceptance_criteria.map((c) => '- [ ] ' + c).join('\n');
const risks = spec.risks.map((r) => '- ' + r).join('\n');
const areas = spec.affected_areas.map((a) => '- ' + a).join('\n');
const standards = spec.linked_standards.map((s) => '- ' + s).join('\n');

const lines = [
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
areas,
'',
'## Criterios de aceite',
'',
criteria,
'',
'## Riscos identificados',
'',
risks,
'',
'## Padroes do projeto aplicaveis',
'',
standards,
'',
'## Metadados',
'',
'| Campo | Valor |',
'| --- | --- |',
'| Complexidade estimada | ' + spec.estimated_complexity + ' |',
'| Gerado por | AI Orchestrator |',
'| Branch base | ' + baseBranch + ' |',
'| Slug da feature | ' + spec.slug + ' |',
'',
'---',
'',
'> Este PR foi aberto automaticamente como draft. A IA nunca faz merge.',
'> Revise as alteracoes, aprove e faca o merge manualmente.',
];

return lines.join('\n');
}

export async function postComment(issueNumber: number, body: string): Promise<void> {
const octokit = getOctokit();
const { owner, repo } = getRepoContext();

await octokit.issues.createComment({
owner,
repo,
issue_number: issueNumber,
body,
});
}