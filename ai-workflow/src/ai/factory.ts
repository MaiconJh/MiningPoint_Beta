import type { AIProvider } from './providers/types.js';
import { OpenAICompatibleProvider } from './providers/openai-compatible.js';
import { GoogleGenerativeProvider } from './providers/google-generative.js';
import type { ResolvedProviderConfig } from '../types/index.js';

export function createProvider(config: ResolvedProviderConfig): AIProvider {
switch (config.type) {
case 'openai-compatible':
return new OpenAICompatibleProvider(config);

case 'google-generative':
return new GoogleGenerativeProvider(config);

default: {
const _exhaustive: never = config.type;
throw new Error(
'Tipo de provider desconhecido: "' +
String(_exhaustive) +
'". Verifique src/ai/config/schema.ts e src/ai/factory.ts.'
);
}
}
}