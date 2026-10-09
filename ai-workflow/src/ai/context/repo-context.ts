import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { getRepoRoot } from './standards-loader.js';

export class RepoContextBuilder {
private readonly root: string;
private readonly maxDepth: number;

constructor(root?: string, maxDepth = 4) {
this.root = root || getRepoRoot();
this.maxDepth = maxDepth;
}

buildTree(): string {
const lines: string[] = [];
this.walk(this.root, '', lines, 0);
return lines.join('\n');
}

buildKeyFiles(): string {
const keyFiles = [
'PROJECT_STANDARDS.md',
'package.json',
'tsconfig.json',
'eslint.config.js',
];

const parts: string[] = [];
for (const file of keyFiles) {
try {
const content = readFileSync(join(this.root, file), 'utf-8');
parts.push('### ' + file + '\n`\n' + content.slice(0, 4000) + '\n`');
} catch {
// Arquivo nao existe, ignora
}
}

return parts.join('\n\n');
}

buildFullContext(): string {
return [
'## Estrutura do repositorio',
'`',
      this.buildTree(),
      '`',
'',
'## Arquivos-chave',
this.buildKeyFiles(),
].join('\n');
}

private walk(dir: string, prefix: string, lines: string[], depth: number): void {
if (depth > this.maxDepth) return;

const entries = readdirSync(dir).filter((e) => {
if (e.startsWith('.')) return false;
if (['node_modules', 'dist', 'build', 'coverage'].includes(e)) return false;
return true;
});

for (const entry of entries) {
const fullPath = join(dir, entry);
const stat = statSync(fullPath);

if (stat.isDirectory()) {
lines.push(prefix + entry + '/');
this.walk(fullPath, prefix + '  ', lines, depth + 1);
} else {
lines.push(prefix + entry);
}
}
}
}