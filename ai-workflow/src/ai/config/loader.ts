import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { AIConfigSchema, formatZodErrors } from './schema.js';
import {
DEFAULT_AI_CONFIG,
KILO_ANONYMOUS_ENV,
KILO_ANONYMOUS_VALUE,
} from './defaults.js';
import type { AIConfig } from '../../types/index.js';

const ENV_NAME_PATTERN = /^[A-Z][A-Z0-9_]*/;

function isEnvName(input: string): boolean {
const m = input.match(ENV_NAME_PATTERN);
return m !== null && m[0] === input;
}

export function loadAIConfig(): AIConfig {
ensureDefaultKeys();
expandProviderKeys();

const raw = readRawConfigWithFallback();
const parsed = parseJson(raw);
const validated = validate(parsed);

return validated as AIConfig;
}

function ensureDefaultKeys(): void {
const current = process.env[KILO_ANONYMOUS_ENV];
if (!current || !current.trim()) {
process.env[KILO_ANONYMOUS_ENV] = KILO_ANONYMOUS_VALUE;
console.log(
'[config] Chave anonima do gateway injetada em ' +
KILO_ANONYMOUS_ENV +
' (modo zero-config).'
);
}
}

function expandProviderKeys(): void {
const blob = process.env.AI_PROVIDER_KEYS_JSON;
if (!blob || !blob.trim()) return;

try {
const keys = JSON.parse(blob) as Record<string, unknown>;
if (typeof keys !== 'object' || keys === null || Array.isArray(keys)) {
console.warn('[config] AI_PROVIDER_KEYS_JSON nao e um objeto. Ignorando.');
return;
}

let expanded = 0;
for (const [name, value] of Object.entries(keys)) {
if (typeof value !== 'string') {
console.warn('[config] Chave "' + name + '" nao e string. Ignorando.');
continue;
}
if (!isEnvName(name)) {
console.warn(
'[config] Nome de chave "' + name + '" invalido (UPPER_SNAKE_CASE esperado). Ignorando.'
);
continue;
}
if (process.env[name] === undefined) {
process.env[name] = value;
expanded++;
}
}

if (expanded > 0) {
console.log(
'[config] ' + expanded + ' chave(s) BYOK expandida(s) de AI_PROVIDER_KEYS_JSON.'
);
}
} catch (err) {
console.warn('[config] Falha ao parsear AI_PROVIDER_KEYS_JSON:', err);
}
}

function readRawConfigWithFallback(): string {
if (process.env.AI_CONFIG_JSON && process.env.AI_CONFIG_JSON.trim()) {
console.log('[config] Usando AI_CONFIG_JSON (env var).');
return process.env.AI_CONFIG_JSON;
}

const customPath = process.env.AI_CONFIG_PATH;
if (customPath) {
if (existsSync(customPath)) {
console.log('[config] Carregando de AI_CONFIG_PATH: ' + customPath);
return readFileSync(customPath, 'utf-8');
}
console.warn('[config] AI_CONFIG_PATH "' + customPath + '" nao existe. Tentando default.');
}

const defaultPath = join(process.cwd(), 'ai.config.json');
if (existsSync(defaultPath)) {
console.log('[config] Carregando de ' + defaultPath);
return readFileSync(defaultPath, 'utf-8');
}

console.log(
'[config] Nenhum ai.config.json encontrado. Usando config embutido (kilo-default).'
);
return JSON.stringify(DEFAULT_AI_CONFIG);
}

function parseJson(raw: string): unknown {
try {
return JSON.parse(raw);
} catch (err) {
throw new Error(
'Falha ao parsear JSON da configuracao: ' +
(err instanceof Error ? err.message : String(err))
);
}
}

function validate(data: unknown): unknown {
const result = AIConfigSchema.safeParse(data);

if (!result.success) {
const details = formatZodErrors(result.error);
throw new Error('ai.config.json invalido:\n' + details);
}

const config = result.data;
const ids = new Set<string>();
const priorities = new Set<number>();

for (const p of config.providers) {
if (ids.has(p.id)) {
throw new Error('ai.config.json: provider id duplicado "' + p.id + '".');
}
ids.add(p.id);

if (priorities.has(p.priority)) {
throw new Error(
'ai.config.json: prioridade ' +
p.priority +
' duplicada (providers devem ter prioridades unicas).'
);
}
priorities.add(p.priority);

if (p.type === 'openai-compatible' && !p.baseUrl) {
throw new Error(
'ai.config.json: provider "' + p.id + '" do tipo openai-compatible exige "baseUrl".'
);
}
}

return config;
}

export function getEnabledProviders(config: AIConfig) {
return config.providers
.filter((p) => p.enabled)
.sort((a, b) => a.priority - b.priority);
}

export function hasApiKey(providerId: string, apiKeyEnv: string): boolean {
const value = process.env[apiKeyEnv];
return typeof value === 'string' && value.trim().length > 0;
}