import { getOctokit, getRepoContext, getAITargetBranch } from '../github/client.js';
import type { AuditEntry } from '../types/index.js';

const AUDIT_BRANCH = process.env.AUDIT_BRANCH || 'audit-log';
const AUDIT_DIR = '.ai/audit';

export async function logAudit(entry: AuditEntry): Promise<void> {
const octokit = getOctokit();
const { owner, repo } = getRepoContext();

const date = entry.timestamp.slice(0, 10);
const filePath = AUDIT_DIR + '/' + date + '.jsonl';
const line = JSON.stringify(entry) + '\n';

await ensureAuditBranch();

let existingContent = '';
let existingSha: string | undefined;
try {
const { data } = await octokit.repos.getContent({
owner,
repo,
path: filePath,
ref: AUDIT_BRANCH,
});
if (!Array.isArray(data) && 'content' in data) {
existingContent = Buffer.from(data.content, 'base64').toString('utf-8');
existingSha = data.sha;
}
} catch {
// arquivo ainda nao existe
}

const targetLabel = entry.prNumber
? 'PR#' + entry.prNumber
: 'issue#' + entry.issueNumber;
const commitMessage = 'audit: ' + entry.action + ' ' + targetLabel;

await octokit.repos.createOrUpdateFileContents({
owner,
repo,
path: filePath,
message: commitMessage,
content: Buffer.from(existingContent + line, 'utf-8').toString('base64'),
branch: AUDIT_BRANCH,
sha: existingSha,
});

console.log('[audit] Entrada registrada em ' + AUDIT_BRANCH + ':' + filePath);
}

async function ensureAuditBranch(): Promise<void> {
const octokit = getOctokit();
const { owner, repo } = getRepoContext();

try {
await octokit.git.getRef({ owner, repo, ref: 'heads/' + AUDIT_BRANCH });
return;
} catch {
// nao existe, cria
}

try {
const base = getAITargetBranch();
const { data: baseRef } = await octokit.git.getRef({
owner,
repo,
ref: 'heads/' + base,
});

await octokit.git.createRef({
owner,
repo,
ref: 'refs/heads/' + AUDIT_BRANCH,
sha: baseRef.object.sha,
});

console.log('[audit] Branch ' + AUDIT_BRANCH + ' criada a partir de ' + base);
} catch (err) {
console.warn('[audit] Falha ao criar branch de auditoria:', err);
}
}