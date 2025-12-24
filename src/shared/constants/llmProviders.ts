import type { LLMModel, LLMModelType } from '../types/llmModel';

export const LLM_MODELS: Record<LLMModelType, LLMModel> = {
  claude: {
    type: 'claude',
    name: 'Claude (Anthropic)',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    modelId: 'claude-3-5-sonnet-20241022',
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 200000,
  },
  gemini: {
    type: 'gemini',
    name: 'Gemini (Google)',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    modelId: 'gemini-1.5-pro-latest',
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 1000000,
  },
};

export const MODEL_OPTIONS = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'gemini', label: 'Gemini (Google)' },
] as const;
