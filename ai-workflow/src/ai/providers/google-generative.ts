import { GoogleGenAI } from '@google/genai';
import type { AIProvider } from './types.js';
import type { AIResponse, ResolvedProviderConfig } from '../../types/index.js';
import { AIProviderError } from '../../types/index.js';

export class GoogleGenerativeProvider implements AIProvider {
readonly id: string;
readonly label: string;
readonly model: string;

private readonly client: GoogleGenAI;
private readonly options: NonNullable<ResolvedProviderConfig['options']>;
private readonly timeoutMs: number;

constructor(config: ResolvedProviderConfig) {
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
this.timeoutMs = config.timeoutMs;

this.client = new GoogleGenAI({ apiKey });
}

async complete(
systemPrompt: string,
userPrompt: string,
signal?: AbortSignal
): Promise<AIResponse> {
const start = Date.now();

const timeoutPromise = new Promise<never>((_, reject) => {
const timer = setTimeout(
() =>
reject(
new AIProviderError(
'Timeout apos ' + this.timeoutMs + 'ms',
this.id,
408
)
),
this.timeoutMs
);
signal?.addEventListener('abort', () => {
clearTimeout(timer);
reject(new AIProviderError('Aborted', this.id, 499));
});
});

try {
const result = await Promise.race([
this.client.models.generateContent({
model: this.model,
contents: userPrompt,
config: {
systemInstruction: systemPrompt,
temperature: this.options.temperature ?? 0.2,
maxOutputTokens: this.options.maxTokens,
topP: this.options.topP,
},
}),
timeoutPromise,
]);

const text = result.text;
if (!text) {
throw new AIProviderError('Resposta vazia do provider', this.id);
}

return {
content: text,
providerId: this.id,
model: this.model,
latencyMs: Date.now() - start,
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