import { getOctokit, getRepoContext, getAITargetBranch } from './client.js';

export function sanitizeSlug(input: string): string {
let result = input
.toLowerCase()
.replace(/[^a-z0-9-]/g, '-')
.replace(/-+/g, '-');

while (result.startsWith('-')) result = result.slice(1);
while (result.endsWith('-')) result = result.slice(0, -1);

return result;
}

export async function createBranch(
branchName: string,
baseRef?: string
): Promise<{ created: boolean; sha: string }> {
const octokit = getOctokit();
const { owner, repo } = getRepoContext();
const base = baseRef ?? getAITargetBranch();

const { data: baseRefData } = await octokit.git.getRef({
owner,
repo,
ref: 'heads/' + base,
});
const baseSha = baseRefData.object.sha;

try {
const { data: existing } = await octokit.git.getRef({
owner,
repo,
ref: 'heads/' + branchName,
});
console.log(
'[branch] Branch ' + branchName + ' ja existe (SHA: ' + existing.object.sha + ')'
);
return { created: false, sha: existing.object.sha };
} catch {
// nao existe, cria
}

const { data: newRef } = await octokit.git.createRef({
owner,
repo,
ref: 'refs/heads/' + branchName,
sha: baseSha,
});

console.log('[branch] Branch ' + branchName + ' criada a partir de ' + base);
return { created: true, sha: newRef.object.sha };
}

export async function commitFile(
branchName: string,
filePath: string,
content: string,
message: string
): Promise<string> {
const octokit = getOctokit();
const { owner, repo } = getRepoContext();

let existingSha: string | undefined;
try {
const { data } = await octokit.repos.getContent({
owner,
repo,
path: filePath,
ref: branchName,
});
if (!Array.isArray(data) && 'sha' in data) {
existingSha = data.sha;
}
} catch {
// arquivo nao existe
}

const { data: result } = await octokit.repos.createOrUpdateFileContents({
owner,
repo,
path: filePath,
message,
content: Buffer.from(content, 'utf-8').toString('base64'),
branch: branchName,
sha: existingSha,
});

console.log('[branch] Arquivo ' + filePath + ' commitado em ' + branchName);
return result.commit.sha ?? '';
}

export function buildBranchName(slug: string): string {
return 'ai/feat-' + sanitizeSlug(slug);
}