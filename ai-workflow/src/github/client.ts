import { Octokit } from '@octokit/rest';

let octokitInstance: Octokit | null = null;

export function getOctokit(): Octokit {
if (octokitInstance) return octokitInstance;

const token = process.env.GITHUB_TOKEN || process.env.AI_ORCHESTRATOR_TOKEN;
if (!token) {
throw new Error('GITHUB_TOKEN ou AI_ORCHESTRATOR_TOKEN nao configurado.');
}

octokitInstance = new Octokit({ auth: token });
return octokitInstance;
}

export function getRepoContext(): { owner: string; repo: string } {
const repoFull = process.env.GITHUB_REPOSITORY;
if (!repoFull || !repoFull.includes('/')) {
throw new Error('GITHUB_REPOSITORY nao configurado ou invalido.');
}
const parts = repoFull.split('/');
return { owner: parts[0], repo: parts[1] };
}

export function getIssueNumber(): number {
const raw = process.env.ISSUE_NUMBER;
if (!raw) throw new Error('ISSUE_NUMBER nao configurado.');
return parseInt(raw, 10);
}

export function getPRNumber(): number {
const raw = process.env.PR_NUMBER;
if (!raw) throw new Error('PR_NUMBER nao configurado.');
return parseInt(raw, 10);
}

/**

- Branch base para o contexto do evento (usada em validacao de PR).
- Le BASE_REF do evento GitHub, cai para a branch de trabalho da IA.
*/
export function getBaseRef(): string {
return process.env.BASE_REF || process.env.AI_BASE_BRANCH || 'main';
}

/**

- Branch onde a IA deposita o trabalho.
- 
- Todas as branches criadas pela IA (ai/feat-*, audit-log) partem daqui,
- e todos os PRs abertos pela IA tem esta branch como destino.
- 
- Configuravel via AI_BASE_BRANCH. Neste repositorio: "AI_ORCHESTRATOR".
*/
export function getAITargetBranch(): string {
return process.env.AI_BASE_BRANCH || 'main';
}

export function getHeadRef(): string {
return process.env.HEAD_REF || '';
}