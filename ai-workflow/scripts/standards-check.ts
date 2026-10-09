#!/usr/bin/env tsx
/**

- Standards Check - valida se o PR viola PROJECT_STANDARDS.md.
*/

import { getOctokit, getRepoContext, getPRNumber } from '../src/github/client.js';
import { postComment } from '../src/github/pr-manager.js';
import { ProviderRouter } from '../src/ai/provider-router.js';
import { StandardsLoader, getRepoRoot } from '../src/ai/context/standards-loader.js';
import { logAudit } from '../src/audit/audit-logger.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AuditEntry } from '../src/types/index.js';

interface StandardsViolation {
rule: string;
section: string;
file: string;
line: number;
severity: 'error' | 'warning';
explanation: string;
suggested_fix: string;
}

interface StandardsResult {
compliant: boolean;
violations: StandardsViolation[];
summary: string;
}

async function main() {
const start = Date.now();
const octokit = getOctokit();
const { owner, repo } = getRepoContext();
const prNumber = getPRNumber();

console.log('\nStandards Check - PR #' + prNumber + '\n');

const { data: files } = await octokit.pulls.listFiles({
owner,
repo,
pull_number: prNumber,
per_page: 100,
});

const diff = files
.filter((f) => f.patch)
.map((f) => '--- a/' + f.filename + '\n+++ b/' + f.filename + '\n' + f.patch)
.join('\n\n');

if (!diff.trim()) {
console.log('Nenhum diff para validar.');
return;
}

const standards = new StandardsLoader();

const promptTemplate = readFileSync(
join(getRepoRoot(), '.github', 'ai-config', 'prompts', 'standards-review.md'),
'utf-8'
);

const userPrompt = promptTemplate
.replace('{{STANDARDS}}', standards.getFullContent())
.replace('{{DIFF}}', diff.slice(0, 30000));

const router = new ProviderRouter();
const aiResponse = await router.complete(
'Voce e um auditor de conformidade. Retorne apenas JSON valido.',
userPrompt
);

const result = parseStandardsResult(aiResponse.content);

console.log('   Conforme: ' + (result.compliant ? 'Sim' : 'Nao'));
console.log('   Violacoes: ' + result.violations.length);

await postComment(
prNumber,
buildStandardsComment(result, aiResponse.providerId, aiResponse.model)
);

const entry: AuditEntry = {
timestamp: new Date().toISOString(),
action: 'standards_check',
prNumber,
providerId: aiResponse.providerId,
model: aiResponse.model,
success: result.compliant,
durationMs: Date.now() - start,
details: {
violationCount: result.violations.length,
errorCount: result.violations.filter((v) => v.severity === 'error').length,
},
};
await logAudit(entry).catch((err) => console.warn('[audit] Falha ao registrar:', err));

const errorCount = result.violations.filter((v) => v.severity === 'error').length;
if (errorCount > 0) {
console.error('\n' + errorCount + ' violacao(oes) de severidade error.\n');
process.exit(1);
}

console.log('\nStandards check concluido em ' + (Date.now() - start) + 'ms');
}

function parseStandardsResult(raw: string): StandardsResult {
const cleaned = raw
.replace(/^`(?:json)?\s*/gm, '')
    .replace(/`\s*/gm, '')
.trim();

try {
const parsed = JSON.parse(cleaned) as StandardsResult;
parsed.violations = Array.isArray(parsed.violations) ? parsed.violations : [];
return parsed;
} catch {
return {
compliant: false,
violations: [],
summary: 'A IA nao conseguiu gerar um resultado estruturado.',
};
}
}

function buildStandardsComment(
result: StandardsResult,
providerId: string,
model: string
): string {
const lines: string[] = [
'## Standards Check',
'',
result.compliant
? 'Conforme - nenhuma violacao encontrada.'
: result.violations.length + ' violacao(oes) encontrada(s).',
'',
result.summary,
'',
];

if (result.violations.length > 0) {
lines.push('### Violacoes detalhadas');
lines.push('');

for (const v of result.violations) {
const loc = v.line ? ':' + v.line : '';
lines.push('**' + v.severity.toUpperCase() + '** - ' + v.file + loc);
lines.push('- **Regra:** ' + v.rule);
lines.push('- **Secao:** ' + v.section);
lines.push('- **Explicacao:** ' + v.explanation);
lines.push('- **Correcao sugerida:** ' + v.suggested_fix);
lines.push('');
}
}

lines.push('---');
lines.push('> Gerado por "' + providerId + '" (' + model + ')');

return lines.join('\n');
}

main().catch((err) => {
console.error('\nStandards check falhou:', err);
process.exit(1);
});