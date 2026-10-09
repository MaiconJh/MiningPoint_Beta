export interface ResolvedProviderConfig {
id: string;
label?: string;
type: 'openai-compatible' | 'google-generative';
enabled: boolean;
priority: number;
baseUrl?: string;
model: string;
apiKeyEnv: string;
maxRetries: number;
timeoutMs: number;
headers?: Record<string, string>;
options?: {
temperature?: number;
maxTokens?: number;
topP?: number;
};
}

export interface AIConfig {
version: number;
router: {
maxTotalRetries: number;
retryBackoffMs: number;
retryBackoffMultiplier: number;
circuitBreaker: {
failureThreshold: number;
resetTimeoutMs: number;
};
};
providers: ResolvedProviderConfig[];
}

export interface AIResponse {
content: string;
providerId: string;
model: string;
latencyMs: number;
tokensUsed?: number;
}

export class AIProviderError extends Error {
constructor(
message: string,
public readonly providerId: string,
public readonly statusCode?: number
) {
super(message);
this.name = 'AIProviderError';
}
}

export interface FeatureSpec {
title: string;
slug: string;
summary: string;
technical_approach: string;
affected_areas: string[];
acceptance_criteria: string[];
risks: string[];
estimated_complexity: 'low' | 'medium' | 'high';
linked_standards: string[];
}

export interface ReviewComment {
file: string;
line: number;
severity: 'blocker' | 'warning' | 'suggestion' | 'nitpick';
category: 'security' | 'performance' | 'readability' | 'standards' | 'architecture' | 'testing';
message: string;
}

export interface ReviewResult {
summary: string;
verdict: 'approve' | 'request_changes' | 'comment';
comments: ReviewComment[];
standards_violations: Array<{
standard: string;
file: string;
line: number;
explanation: string;
}>;
}

export interface AuditEntry {
timestamp: string;
action: 'feature_proposal' | 'code_review' | 'standards_check';
issueNumber?: number;
prNumber?: number;
providerId: string;
model: string;
success: boolean;
durationMs: number;
details: Record<string, unknown>;
}