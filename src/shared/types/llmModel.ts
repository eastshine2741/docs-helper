export type LLMModelType = 'claude' | 'gemini';

export interface LLMModel {
  // Identity
  type: LLMModelType; // 'claude' | 'gemini'
  name: string; // Display name

  // Configuration
  apiEndpoint: string; // API URL
  modelId: string; // Specific model version

  // Capabilities
  supportsStreaming: boolean;
  maxTokens: number;
  contextWindow: number;
}
