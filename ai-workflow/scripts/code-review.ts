#!/usr/bin/env tsx
/**

- AI Code Review - revisa o diff de um PR e posta comentarios.
*/

import {
getOctokit,
getRepoContext,
getPRNumber,
getBaseRef,
getHeadRef,
} from '../src/github/client.js';
import { postReview } from '../src/github/review-manager.js';
import { ProviderRouter } from '../src/ai/provider-router.js';
import { StandardsLoader, getRepoRoot } from '../src/ai/context/standards-loader.js';
import { logAudit } from '../src/audit/audit-logger.js';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ReviewResult, AuditEntry } from '../src/types/index.js';

async function main() {
const start = Date.now();
const octokit = getOctokit();
const { owner, repo } = getRepoContext();
const prNumber = getPRNumber();
const baseRef = getBaseRef();
const headRef = getHeadRef();

console.log(
'\nAI Code Review - PR #' + prNumber + ' (' + headRef + ' -> ' + baseRef + ')\n'
);

const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
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
console.log('Nenhum diff textual para revisar.');
return;
}

console.log(files.length + ' arquivos alterados, ' + diff.length + ' caracteres de diff');

const standards = new StandardsLoader();

const promptTemplate = readFileSync(
join(getRepoRoot(), '.github', 'ai-config', 'prompts', 'code-review.md'),
'utf-8'
);

const userPrompt = promptTemplate
.replace('{{STANDARDS}}', standards.getCompactContext())
.replace('{{DIFF}}', diff.slice(0, 30000))
.replace('{{PR_TITLE}}', pr.title)
.replace('{{HEAD_REF}}', headRef)
.replace('{{BASE_REF}}', baseRef)
.replace('{{FILE_COUNT}}', String(files.length));

const router = new ProviderRouter();
const aiResponse = await router.complete(
'Voce e um revisor de codigo senior. Retorne apenas JSON valido.',
userPrompt
);

console.log(
'Review gerado por "' + aiResponse.providerId + '" em ' + aiResponse.latencyMs + 'ms'
);

const review = parseReview(aiResponse.content);
console.log('   Veredito: ' + review.verdict);
console.log('   Comentarios: ' + review.comments.length);
console.log('   Violacoes: ' + review.standards_violations.length);

await postReview(prNumber, review);

const entry: AuditEntry = {
timestamp: new Date().toISOString(),
action: 'code_review',
prNumber,
providerId: aiResponse.providerId,
model: aiResponse.model,
success: true,
durationMs: Date.now() - start,
details: {
verdict: review.verdict,
commentCount: review.comments.length,
violationCount: review.standards_violations.length,
filesReviewed: files.length,
},
};
await logAudit(entry).catch((err) => console.warn('[audit] Falha ao registrar:', err));

console.log('\nConcluido em ' + (Date.now() - start) + 'ms');
}

function parseReview(raw: string): ReviewResult {
  // 1. Remove fences de código em qualquer posição
  let cleaned = raw.replace(/```(?:json|javascript)?\s*/gi, '').replace(/```/g, '').trim();

  // 2. Extrai o primeiro bloco JSON válido procurando { ... }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned) as ReviewResult;
    if (!parsed.summary || !parsed.verdict) {
      throw new Error('Review incompleto: summary e verdict sao obrigatorios.');
    }
    parsed.comments = Array.isArray(parsed.comments) ? parsed.comments : [];
    parsed.standards_violations = Array.isArray(parsed.standards_violations)
      ? parsed.standards_violations
      : [];
    return parsed;
  } catch (err) {
    console.error('Falha ao parsear review. Resposta bruta (primeiros 800 chars):');
    console.error(raw.slice(0, 800));
    console.error('Erro:', err);
    return {
      summary: 'A IA nao conseguiu gerar um review estruturado.',
      verdict: 'comment',
      comments: [],
      standards_violations: [],
    };
  }
}

main().catch((err) => {
console.error('\nCode review falhou:', err);
process.exit(1);
});
