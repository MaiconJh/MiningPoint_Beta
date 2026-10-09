import { getOctokit, getRepoContext } from './client.js';
import type { ReviewResult } from '../types/index.js';

export async function postReview(prNumber: number, review: ReviewResult): Promise<void> {
const octokit = getOctokit();
const { owner, repo } = getRepoContext();

const { data: pr } = await octokit.pulls.get({
owner,
repo,
pull_number: prNumber,
});

const body = buildReviewBody(review);

if (review.comments.length > 0) {
try {
const comments = review.comments
.filter((c) => c.file && typeof c.line === 'number' && c.line > 0)
.slice(0, 20)
.map((c) => ({
path: c.file,
line: c.line,
body: formatComment(c),
}));

if (comments.length > 0) {
await octokit.pulls.createReview({
owner,
repo,
pull_number: prNumber,
commit_id: pr.head.sha,
body,
event: 'COMMENT',
comments,
});
console.log('[review] Review postado com ' + comments.length + ' comentarios em linha');
return;
}
} catch (err) {
console.warn('[review] Falha ao postar comentarios em linha, usando fallback:', err);
}
}

await octokit.issues.createComment({
owner,
repo,
issue_number: prNumber,
body,
});
console.log('[review] Comentario geral postado no PR');
}

function buildReviewBody(review: ReviewResult): string {
const verdictEmojiMap: Record<string, string> = {
approve: '[OK]',
request_changes: '[X]',
comment: '[i]',
};
const verdictLabelMap: Record<string, string> = {
approve: 'Aprovado',
request_changes: 'Alteracoes solicitadas',
comment: 'Comentarios',
};

const emoji = verdictEmojiMap[review.verdict] ?? '[?]';
const label = verdictLabelMap[review.verdict] ?? review.verdict;

const lines: string[] = [
'## AI Code Review',
'',
'**Veredito:** ' + emoji + ' ' + label,
'',
review.summary,
'',
];

if (review.standards_violations.length > 0) {
lines.push('### Violacoes de padroes');
lines.push('');
for (const v of review.standards_violations) {
const loc = v.line ? ':' + v.line : '';
lines.push('- **' + v.standard + '** - ' + v.file + loc);
lines.push('  ' + v.explanation);
}
lines.push('');
}

if (review.comments.length > 0) {
const bySeverity = {
blocker: review.comments.filter((c) => c.severity === 'blocker'),
warning: review.comments.filter((c) => c.severity === 'warning'),
suggestion: review.comments.filter((c) => c.severity === 'suggestion'),
nitpick: review.comments.filter((c) => c.severity === 'nitpick'),
};

lines.push('### Comentarios por severidade');
lines.push('');
lines.push('| Severidade | Quantidade |');
lines.push('| --- | --- |');
lines.push('| Blocker | ' + bySeverity.blocker.length + ' |');
lines.push('| Warning | ' + bySeverity.warning.length + ' |');
lines.push('| Suggestion | ' + bySeverity.suggestion.length + ' |');
lines.push('| Nitpick | ' + bySeverity.nitpick.length + ' |');
lines.push('');
}

lines.push('---');
lines.push('');
lines.push('> Este review foi gerado automaticamente. A decisao final e sempre humana.');

return lines.join('\n');
}

function formatComment(c: { severity: string; category: string; message: string }): string {
const emojiMap: Record<string, string> = {
blocker: '[BLOCKER]',
warning: '[WARNING]',
suggestion: '[SUGGESTION]',
nitpick: '[NITPICK]',
};
const emoji = emojiMap[c.severity] ?? '[COMMENT]';
return emoji + ' **' + c.severity.toUpperCase() + '** (' + c.category + ')\n\n' + c.message;
}