import type { AIConfig } from '../../types/index.js';

export const DEFAULT_AI_CONFIG: AIConfig = {
version: 1,
router: {
maxTotalRetries: 10,
retryBackoffMs: 1000,
retryBackoffMultiplier: 2,
circuitBreaker: {
failureThreshold: 5,
resetTimeoutMs: 120000,
},
},
providers: [
{
id: 'kilo-default',
label: 'Kilo Code (Auto Free - zero config)',
type: 'openai-compatible',
enabled: true,
priority: 0,
baseUrl: 'https://api.kilo.ai/api/openrouter',
model: 'kilo-auto/free',
apiKeyEnv: 'KILO_ANONYMOUS_KEY',
maxRetries: 2,
timeoutMs: 60000,
headers: {
'X-KILOCODE-EDITORNAME': 'miningpoint-ai-workflow',
},
options: {
temperature: 0.2,
maxTokens: 4096,
},
},
],
};

export const KILO_ANONYMOUS_ENV = 'KILO_ANONYMOUS_KEY';
export const KILO_ANONYMOUS_VALUE = 'anonymous';