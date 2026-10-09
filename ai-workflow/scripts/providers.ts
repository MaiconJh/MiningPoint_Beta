#!/usr/bin/env tsx
/**

- CLI para gerenciar providers de IA.
- 
- Comandos:
- list                          Lista todos os providers
- add [flags]                   Adiciona um provider (interativo se sem flags)
- remove <id>                   Remove um provider
- enable <id> / disable <id>    Ativa/desativa sem remover
- test <id>                     Testa um provider especifico
- test-all                      Testa toda a cadeia em ordem
- validate                      Valida o ai.config.json
- reorder                       Reordena prioridades interativamente
- reset                         Restaura a config padrao (so kilo-default)
*/

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { AIConfigSchema, formatZodErrors } from '../src/ai/config/schema.js';
import {
DEFAULT_AI_CONFIG,
KILO_ANONYMOUS_ENV,
KILO_ANONYMOUS_VALUE,
} from '../src/ai/config/defaults.js';
import { createProvider } from '../src/ai/factory.js';
import type { AIConfig, ResolvedProviderConfig } from '../src/types/index.js';

const CONFIG_PATH = process.env.AI_CONFIG_PATH || join(process.cwd(), 'ai.config.json');

const ENV_NAME_PATTERN = /^[A-Z][A-Z0-9_]*/;

function isEnvName(v: string): boolean {
const m = v.match(ENV_NAME_PATTERN);
return m !== null && m[0] === v;
}

async function main() {
if (!process.env[KILO_ANONYMOUS_ENV]) {
process.env[KILO_ANONYMOUS_ENV] = KILO_ANONYMOUS_VALUE;
}

const { values, positionals } = parseArgs({
args: process.argv.slice(2),
options: {
id: { type: 'string' },
label: { type: 'string' },
type: { type: 'string' },
'base-url': { type: 'string' },
model: { type: 'string' },
'api-key-env': { type: 'string' },
priority: { type: 'string' },
'max-retries': { type: 'string' },
'timeout-ms': { type: 'string' },
'no-enabled': { type: 'boolean' },
help: { type: 'boolean', short: 'h' },
},
allowPositionals: true,
});

const command = positionals[0];

if (!command || values.help) {
printHelp();
return;
}

switch (command) {
case 'list':
await cmdList();
break;
case 'add':
await cmdAdd(values);
break;
case 'remove':
await cmdRemove(positionals[1]);
break;
case 'enable':
await cmdToggle(positionals[1], true);
break;
case 'disable':
await cmdToggle(positionals[1], false);
break;
case 'test':
await cmdTest(positionals[1]);
break;
case 'test-all':
await cmdTestAll();
break;
case 'validate':
await cmdValidate();
break;
case 'reorder':
await cmdReorder();
break;
case 'reset':
await cmdReset();
break;
default:
console.error('Comando desconhecido: "' + command + '"\n');
printHelp();
process.exit(1);
}
}

async function cmdList(): Promise<void> {
const config = readConfig();
console.log('\nProviders configurados (' + config.providers.length + ')\n');

if (config.providers.length === 0) {
console.log('   (nenhum - use "npm run providers add")\n');
return;
}

const sorted = [...config.providers].sort((a, b) => a.priority - b.priority);

for (const p of sorted) {
const enabled = p.enabled ? '[OK]' : '[--]';
const keyStatus = process.env[p.apiKeyEnv] ? 'key ok' : 'key ausente';
console.log(enabled + ' [' + p.priority + '] ' + p.id + (p.label ? ' - ' + p.label : ''));
console.log('    type: ' + p.type);
console.log('    model: ' + p.model);
if (p.baseUrl) console.log('    baseUrl: ' + p.baseUrl);
console.log('    apiKeyEnv: ' + p.apiKeyEnv + ' (' + keyStatus + ')');
console.log('    retries: ' + p.maxRetries + ', timeout: ' + p.timeoutMs + 'ms');
console.log('');
}
}

async function cmdAdd(values: Record<string, unknown>): Promise<void> {
const config = readConfig();

const hasFlags = values.id || values.model || values['base-url'];
const newProvider = hasFlags
? buildFromFlags(values, config)
: await buildInteractive(config);

if (config.providers.some((p) => p.id === newProvider.id)) {
console.error('\nJa existe um provider com id "' + newProvider.id + '".');
process.exit(1);
}
if (config.providers.some((p) => p.priority === newProvider.priority)) {
console.error('\nJa existe um provider com prioridade ' + newProvider.priority + '.');
process.exit(1);
}

config.providers.push(newProvider);
saveConfig(config);

console.log(
'\nProvider "' + newProvider.id + '" adicionado com prioridade ' + newProvider.priority + '.'
);
console.log(
'\nNao esqueca de definir a env var "' + newProvider.apiKeyEnv + '" com a chave de API.\n'
);
}

async function cmdRemove(id?: string): Promise<void> {
if (!id) {
console.error('Uso: npm run providers remove <id>');
process.exit(1);
}

const config = readConfig();
const idx = config.providers.findIndex((p) => p.id === id);
if (idx === -1) {
console.error('Provider "' + id + '" nao encontrado.');
process.exit(1);
}

config.providers.splice(idx, 1);
saveConfig(config);
console.log('Provider "' + id + '" removido.');
}

async function cmdToggle(id: string | undefined, enabled: boolean): Promise<void> {
if (!id) {
console.error('Uso: npm run providers ' + (enabled ? 'enable' : 'disable') + ' <id>');
process.exit(1);
}

const config = readConfig();
const p = config.providers.find((x) => x.id === id);
if (!p) {
console.error('Provider "' + id + '" nao encontrado.');
process.exit(1);
}

p.enabled = enabled;
saveConfig(config);
console.log('Provider "' + id + '" ' + (enabled ? 'ativado' : 'desativado') + '.');
}

async function cmdTest(id?: string): Promise<void> {
if (!id) {
console.error('Uso: npm run providers test <id>');
process.exit(1);
}

const config = readConfig();
const p = config.providers.find((x) => x.id === id);
if (!p) {
console.error('Provider "' + id + '" nao encontrado.');
process.exit(1);
}

console.log('\nTestando provider "' + p.id + '"...\n');

const keyValue = process.env[p.apiKeyEnv];
if (!keyValue) {
console.error('Env var "' + p.apiKeyEnv + '" nao esta definida.');
process.exit(1);
}

try {
const adapter = createProvider(p);
const response = await adapter.complete(
'Voce e um assistente util. Responda de forma concisa.',
'Responda apenas com a palavra "OK".'
);

console.log('Sucesso!');
console.log('   Provider: ' + response.providerId);
console.log('   Modelo: ' + response.model);
console.log('   Latencia: ' + response.latencyMs + 'ms');
if (response.tokensUsed) console.log('   Tokens: ' + response.tokensUsed);
console.log('   Resposta: "' + response.content.slice(0, 100) + '"\n');
} catch (err) {
console.error('Falha: ' + (err instanceof Error ? err.message : String(err)) + '\n');
process.exit(1);
}
}

async function cmdTestAll(): Promise<void> {
const config = readConfig();
const sorted = [...config.providers]
.filter((p) => p.enabled)
.sort((a, b) => a.priority - b.priority);

console.log('\nTestando ' + sorted.length + ' provider(s) habilitado(s)...\n');

let passed = 0;
let failed = 0;

for (const p of sorted) {
process.stdout.write('   [' + p.priority + '] ' + p.id + '... ');

const keyValue = process.env[p.apiKeyEnv];
if (!keyValue) {
console.log('(env var ' + p.apiKeyEnv + ' ausente)');
failed++;
continue;
}

try {
const adapter = createProvider(p);
const start = Date.now();
await adapter.complete(
'Voce e um assistente util. Responda de forma concisa.',
'Responda apenas com "OK".'
);
console.log('OK (' + (Date.now() - start) + 'ms)');
passed++;
} catch (err) {
console.log('FALHA: ' + (err instanceof Error ? err.message : String(err)));
failed++;
}
}

console.log('\nResultado: ' + passed + ' ok, ' + failed + ' falha(s)\n');
process.exit(failed > 0 ? 1 : 0);
}

async function cmdValidate(): Promise<void> {
try {
const raw = readFileSync(CONFIG_PATH, 'utf-8');
const parsed = JSON.parse(raw);
const result = AIConfigSchema.safeParse(parsed);

if (!result.success) {
console.error('\nConfig invalido:\n' + formatZodErrors(result.error) + '\n');
process.exit(1);
}

console.log('\nConfig valido: ' + CONFIG_PATH);
console.log('   ' + result.data.providers.length + ' provider(s) definido(s)\n');
} catch (err) {
console.error('\n' + (err instanceof Error ? err.message : String(err)) + '\n');
process.exit(1);
}
}

async function cmdReorder(): Promise<void> {
const config = readConfig();
const rl = createInterface({ input, output });

try {
console.log('\nReordenacao interativa\n');
console.log('Para cada provider, informe a nova prioridade (menor = primeiro).\n');

for (const p of config.providers) {
const current = p.priority;
const answer = await rl.question('   ' + p.id + ' (atual: ' + current + '): ');
if (answer.trim()) {
const newPriority = parseInt(answer.trim(), 10);
if (!isNaN(newPriority) && newPriority >= 0) {
p.priority = newPriority;
}
}
}

const priorities = config.providers.map((p) => p.priority);
const unique = new Set(priorities);
if (unique.size !== priorities.length) {
console.error('\nHa prioridades duplicadas. Nada foi salvo.');
process.exit(1);
}

saveConfig(config);
console.log('\nPrioridades atualizadas.\n');
} finally {
rl.close();
}
}

async function cmdReset(): Promise<void> {
const rl = createInterface({ input, output });
try {
const answer = await rl.question(
'\nIsso vai sobrescrever o ai.config.json com a config padrao (so kilo-default). Continuar? [s/N]: '
);
if (answer.trim().toLowerCase() !== 's') {
console.log('Cancelado.\n');
return;
}

writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_AI_CONFIG, null, 2) + '\n', 'utf-8');
console.log('\nConfig restaurada em ' + CONFIG_PATH + '\n');
} finally {
rl.close();
}
}

function readConfig(): AIConfig {
if (!existsSync(CONFIG_PATH)) {
return JSON.parse(JSON.stringify(DEFAULT_AI_CONFIG)) as AIConfig;
}
const raw = readFileSync(CONFIG_PATH, 'utf-8');
return JSON.parse(raw) as AIConfig;
}

function saveConfig(config: AIConfig): void {
writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

function buildFromFlags(
values: Record<string, unknown>,
config: AIConfig
): ResolvedProviderConfig {
const id = String(values.id ?? '').trim();
const type = String(values.type ?? 'openai-compatible');
const model = String(values.model ?? '').trim();
const apiKeyEnv = String(values['api-key-env'] ?? '').trim();

if (!id) throw new Error('--id e obrigatorio');
if (!model) throw new Error('--model e obrigatorio');
if (!apiKeyEnv) throw new Error('--api-key-env e obrigatorio');
if (!isEnvName(apiKeyEnv)) {
throw new Error('--api-key-env deve ser UPPER_SNAKE_CASE');
}

const maxPriority = config.providers.reduce((max, p) => Math.max(max, p.priority), -1);

return {
id,
label: values.label ? String(values.label) : undefined,
type: type as 'openai-compatible' | 'google-generative',
enabled: !values['no-enabled'],
priority: values.priority ? parseInt(String(values.priority), 10) : maxPriority + 1,
baseUrl: values['base-url'] ? String(values['base-url']) : undefined,
model,
apiKeyEnv,
maxRetries: values['max-retries'] ? parseInt(String(values['max-retries']), 10) : 3,
timeoutMs: values['timeout-ms'] ? parseInt(String(values['timeout-ms']), 10) : 60000,
};
}

async function buildInteractive(config: AIConfig): Promise<ResolvedProviderConfig> {
const rl = createInterface({ input, output });

try {
console.log('\nAdicionar provider (modo interativo)\n');

const id = (await rl.question('   id (kebab-case, ex: meu-modelo): ')).trim();
const label = (await rl.question('   label (opcional): ')).trim();
const type =
(await rl.question('   type [openai-compatible | google-generative]: ')).trim() ||
'openai-compatible';

let baseUrl = '';
if (type === 'openai-compatible') {
baseUrl = (await rl.question('   baseUrl (ex: https://api.x.com/v1): ')).trim();
}

const model = (await rl.question('   model (ex: llama-3.3-70b): ')).trim();
const apiKeyEnv = (
await rl.question('   apiKeyEnv (UPPER_SNAKE_CASE, ex: MINHA_CHAVE): ')
).trim();

const maxPriority = config.providers.reduce((max, p) => Math.max(max, p.priority), -1);
const priorityStr = (await rl.question('   priority [' + (maxPriority + 1) + ']: ')).trim();
const priority = priorityStr ? parseInt(priorityStr, 10) : maxPriority + 1;

const timeoutStr = (await rl.question('   timeoutMs [60000]: ')).trim();
const timeoutMs = timeoutStr ? parseInt(timeoutStr, 10) : 60000;

const maxRetriesStr = (await rl.question('   maxRetries [3]: ')).trim();
const maxRetries = maxRetriesStr ? parseInt(maxRetriesStr, 10) : 3;

if (!id) throw new Error('id e obrigatorio');
if (!model) throw new Error('model e obrigatorio');
if (!apiKeyEnv) throw new Error('apiKeyEnv e obrigatorio');
if (type === 'openai-compatible' && !baseUrl) {
throw new Error('baseUrl e obrigatorio para openai-compatible');
}

return {
id,
label: label || undefined,
type: type as 'openai-compatible' | 'google-generative',
enabled: true,
priority,
baseUrl: baseUrl || undefined,
model,
apiKeyEnv,
maxRetries,
timeoutMs,
};
} finally {
rl.close();
}
}

function printHelp(): void {
console.log(`
MiningPoint - Providers CLI

Uso: npm run providers <comando> [argumentos]

Comandos:
list                          Lista todos os providers
add [flags]                   Adiciona um provider
remove <id>                   Remove um provider
enable <id>                   Ativa um provider
disable <id>                  Desativa sem remover
test <id>                     Testa um provider especifico
test-all                      Testa toda a cadeia em ordem
validate                      Valida o ai.config.json
reorder                       Reordena prioridades interativamente
reset                         Restaura a config padrao (so kilo-default)

Flags de add:
--id           Identificador unico (kebab-case)
--label        Rotulo humano
--type         openai-compatible | google-generative
--base-url     URL base (obrigatorio para openai-compatible)
--model        Nome do modelo
--api-key-env  Nome da env var (UPPER_SNAKE_CASE)
--priority     Numero (menor = tentado primeiro)
--max-retries  Default: 3
--timeout-ms   Default: 60000
--no-enabled   Adiciona desabilitado

Exemplos:
npm run providers list
npm run providers test kilo-default
`);
}

main().catch((err) => {
console.error('\n' + (err instanceof Error ? err.message : String(err)) + '\n');
process.exit(1);
});