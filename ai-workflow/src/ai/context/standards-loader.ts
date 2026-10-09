import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**

- Retorna a raiz do repositorio alvo, considerando REPO_ROOT.
- Usado por outros modulos que precisam montar caminhos a partir da raiz.
*/
export function getRepoRoot(): string {
return process.env.REPO_ROOT || process.cwd();
}

/**

- Retorna o caminho absoluto para um arquivo/diretorio dentro do repositorio alvo.
*/
export function repoPath(...segments: string[]): string {
return join(getRepoRoot(), ...segments);
}

export class StandardsLoader {
private readonly content: string;
private readonly sections: Map<string, string>;

constructor(repoRoot?: string) {
const root = repoRoot || getRepoRoot();
const path = join(root, 'PROJECT_STANDARDS.md');
this.content = readFileSync(path, 'utf-8');
this.sections = this.parseSections(this.content);
}

getFullContent(): string {
return this.content;
}

getSection(title: string): string | null {
return this.sections.get(title.toLowerCase()) ?? null;
}

findSections(query: string): Array<{ title: string; content: string }> {
const q = query.toLowerCase();
const result: Array<{ title: string; content: string }> = [];
for (const [key, value] of this.sections) {
if (key.includes(q)) result.push({ title: key, content: value });
}
return result;
}

getCompactContext(): string {
const relevant = [
'language',
'styling',
'content',
'scope',
'firebase',
'firestore schema',
'navigation & account routes',
'colour tokens',
];

const parts: string[] = [];
for (const title of relevant) {
const section = this.sections.get(title);
if (section) parts.push('## ' + title + '\n' + section);
}

return parts.join('\n\n---\n\n');
}

private parseSections(markdown: string): Map<string, string> {
const sections = new Map<string, string>();
const lines = markdown.split('\n');

let currentTitle = '';
let currentContent: string[] = [];

const flush = () => {
if (currentTitle) {
sections.set(currentTitle.toLowerCase(), currentContent.join('\n').trim());
}
};

for (const line of lines) {
const headingMatch = line.match(/^#{1,3}\s+(.+)/);
if (headingMatch) {
flush();
currentTitle = headingMatch[1].trim();
currentContent = [];
} else {
currentContent.push(line);
}
}

flush();
return sections;
}
}