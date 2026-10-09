import { loadAIConfig, getEnabledProviders, hasApiKey } from './config/loader.js';
import { createProvider } from './factory.js';
import type { AIProvider } from './providers/types.js';
import type { AIResponse, AIConfig } from '../types/index.js';
import { AIProviderError } from '../types/index.js';

interface ProviderRuntime {
config: AIConfig['providers'][number];
adapter: AIProvider;
}

export class ProviderRouter {
private readonly config: AIConfig;
private readonly providers: ProviderRuntime[];
private readonly circuitState = new Map<string, { failures: number; openUntil: number }>();

constructor() {
this.config = loadAIConfig();
this.providers = this.buildProviders();
}

getProviders(): ProviderRuntime[] {
return this.providers;
}

async complete(systemPrompt: string, userPrompt: string): Promise<AIResponse> {
if (this.providers.length === 0) {
throw new Error(
'Nenhum provider utilizavel. Verifique se:\n' +
'  - ai.config.json tem pelo menos um provider com "enabled": true\n' +
'  - as env vars das chaves de API estao definidas\n' +
'  - rode "npm run providers list" para inspecionar'
);
}

const errors: Array<{ providerId: string; error: Error }> = [];

for (const { config, adapter } of this.providers) {
if (this.isCircuitOpen(config.id)) {
console.warn('[router] Circuit breaker aberto para "' + config.id + '", pulando.');
continue;
}

for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
try {
console.log(
'[router] Tentando "' +
config.id +
'" (' +
adapter.model +
') - tentativa ' +
attempt +
'/' +
config.maxRetries
);

const response = await adapter.complete(systemPrompt, userPrompt);
this.recordSuccess(config.id);

const tokenInfo = response.tokensUsed
? ' (' + response.tokensUsed + ' tokens)'
: '';
console.log(
'[router] OK "' + config.id + '" respondeu em ' + response.latencyMs + 'ms' + tokenInfo
);
return response;
} catch (err) {
const error = err instanceof Error ? err : new Error(String(err));
const isRateLimit = err instanceof AIProviderError && err.statusCode === 429;

console.warn(
'[router] FALHA "' +
config.id +
'" (tentativa ' +
attempt +
'): ' +
error.message
);

this.recordFailure(config.id);

if (isRateLimit) {
errors.push({ providerId: config.id, error });
break;
}

if (attempt === config.maxRetries) {
errors.push({ providerId: config.id, error });
break;
}

const delay =
this.config.router.retryBackoffMs *
Math.pow(this.config.router.retryBackoffMultiplier, attempt - 1);
await sleep(delay);
}
}
}

const summary = errors
.map((e) => '  - ' + e.providerId + ': ' + e.error.message)
.join('\n');

throw new Error(
'Todos os providers de IA falharam:\n' +
summary +
'\n\nVerifique com "npm run providers test-all".'
);
}

private buildProviders(): ProviderRuntime[] {
const enabled = getEnabledProviders(this.config);
const runtimes: ProviderRuntime[] = [];

for (const config of enabled) {
if (!hasApiKey(config.id, config.apiKeyEnv)) {
console.warn(
'[router] Provider "' +
config.id +
'" ignorado: env var "' +
config.apiKeyEnv +
'" ausente.'
);
continue;
}

try {
const adapter = createProvider(config);
runtimes.push({ config, adapter });
} catch (err) {
console.warn(
'[router] Falha ao instanciar "' +
config.id +
'": ' +
(err instanceof Error ? err.message : String(err))
);
}
}

return runtimes;
}

private isCircuitOpen(providerId: string): boolean {
const state = this.circuitState.get(providerId);
if (!state) return false;
if (state.openUntil === 0) return false;
if (Date.now() >= state.openUntil) {
this.circuitState.delete(providerId);
return false;
}
return true;
}

private recordSuccess(providerId: string): void {
this.circuitState.delete(providerId);
}

private recordFailure(providerId: string): void {
const state = this.circuitState.get(providerId) ?? { failures: 0, openUntil: 0 };
state.failures += 1;

if (state.failures >= this.config.router.circuitBreaker.failureThreshold) {
state.openUntil = Date.now() + this.config.router.circuitBreaker.resetTimeoutMs;
console.warn(
'[router] Circuit breaker aberto para "' +
providerId +
'" por ' +
this.config.router.circuitBreaker.resetTimeoutMs +
'ms'
);
}

this.circuitState.set(providerId, state);
}
}

function sleep(ms: number): Promise<void> {
return new Promise((resolve) => setTimeout(resolve, ms));
}