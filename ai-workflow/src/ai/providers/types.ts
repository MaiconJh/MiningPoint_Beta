import type { AIResponse } from '../../types/index.js';

export interface AIProvider {
readonly id: string;
readonly label: string;
readonly model: string;

complete(
systemPrompt: string,
userPrompt: string,
signal?: AbortSignal
): Promise<AIResponse>;
}