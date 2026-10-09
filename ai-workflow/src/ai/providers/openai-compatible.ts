import OpenAI from 'openai';
import type { AIProvider } from './types.js';
import type { AIResponse, ResolvedProviderConfig } from '../../types/index.js';
import { AIProviderError } from '../../types/index.js';

export class OpenAICompatibleProvider implements AIProvider {
readonly id: string;
readonly label: string;
readonly model: string;

private readonly client: OpenAI;
private readonly options: NonNullable<ResolvedProviderConfig['options']>;

constructor(config: ResolvedProviderConfig) {
if (!config.baseUrl) {
throw new Error(
'[' + config.id + '] openai-compatible requer baseUrl na configuracao.'
);
}

const apiKey = process.env[config.apiKeyEnv];
if (!apiKey || !apiKey.trim()) {
throw new Error(
'[' + config.id + '] env var "' + config.apiKeyEnv + '" nao esta definida.'
);
}

this.id = config.id;
this.label = config.label ?? config.id;
this.model = config.model;
this.options = config.options ?? {};

this.client = new OpenAI({
apiKey,
baseURL: config.baseUrl,
timeout: config.timeoutMs,
maxRetries: 0,
defaultHeaders: config.headers,
});
}

async complete(
systemPrompt: string,
userPrompt: string,
signal?: AbortSignal
): Promise<AIResponse> {
const start = Date.now();

try {
const completion = await this.client.chat.completions.create(
{
model: this.model,
messages: [
{ role: 'system', content: systemPrompt },
{ role: 'user', content: userPrompt },
],
temperature: this.options.temperature ?? 0.2,
max_tokens: this.options.maxTokens ?? 4096,
top_p: this.options.topP,
},
{ signal }
);

const text = completion.choices[0]?.message?.content;
if (!text) {
throw new AIProviderError('Resposta vazia do provider', this.id);
}

return {
content: text,
providerId: this.id,
model: this.model,
latencyMs: Date.now() - start,
tokensUsed: completion.usage?.total_tokens,
};
} catch (err) {
if (err instanceof AIProviderError) throw err;
const status = (err as { status?: number })?.status;
throw new AIProviderError(
err instanceof Error ? err.message : String(err),
this.id,
status
);
}
}
}