import { z } from 'zod';

const ID_PATTERN = /^[a-z0-9][a-z0-9_-]*/;
const ENV_NAME_PATTERN = /^[A-Z][A-Z0-9_]*/;

function matchesFull(input: string, pattern: RegExp): boolean {
const m = input.match(pattern);
return m !== null && m[0] === input;
}

export const ProviderTypeSchema = z.enum([
'openai-compatible',
'google-generative',
]);

export const ProviderConfigSchema = z.object({
id: z
.string()
.min(1)
.max(64)
.refine((v) => matchesFull(v, ID_PATTERN), {
message: 'Provider id deve ser lowercase kebab-case ou snake_case',
}),
label: z.string().max(120).optional(),
type: ProviderTypeSchema,
enabled: z.boolean().default(true),
priority: z.number().int().min(0).max(999),
baseUrl: z.string().url().optional(),
model: z.string().min(1).max(200),
apiKeyEnv: z
.string()
.min(1)
.max(128)
.refine((v) => matchesFull(v, ENV_NAME_PATTERN), {
message: 'apiKeyEnv deve ser UPPER_SNAKE_CASE',
}),
maxRetries: z.number().int().min(1).max(10).default(3),
timeoutMs: z.number().int().min(1000).max(300000).default(60000),
headers: z.record(z.string()).optional(),
options: z
.object({
temperature: z.number().min(0).max(2).optional(),
maxTokens: z.number().int().min(1).max(200000).optional(),
topP: z.number().min(0).max(1).optional(),
})
.optional(),
});

export const AIConfigSchema = z.object({
version: z.number().int().min(1).default(1),
router: z
.object({
maxTotalRetries: z.number().int().min(1).max(50).default(10),
retryBackoffMs: z.number().int().min(0).max(60000).default(1000),
retryBackoffMultiplier: z.number().min(1).max(10).default(2),
circuitBreaker: z
.object({
failureThreshold: z.number().int().min(1).max(100).default(5),
resetTimeoutMs: z.number().int().min(1000).max(3600000).default(120000),
})
.default({}),
})
.default({}),
providers: z.array(ProviderConfigSchema).min(1),
});

export type ValidatedProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type ValidatedAIConfig = z.infer<typeof AIConfigSchema>;

export function formatZodErrors(error: z.ZodError): string {
const lines: string[] = [];
for (const e of error.errors) {
lines.push('  - ' + e.path.join('.') + ': ' + e.message);
}
return lines.join('\n');
}