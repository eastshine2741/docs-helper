import type { LLMModelType } from './llmModel';

export interface UserSettings {
  // API Keys
  apiKeys: {
    claude?: string; // Anthropic API key
    gemini?: string; // Google AI API key
  };

  // Customization
  systemPrompt: string; // Custom instructions for all LLM requests

  // UI Preferences
  theme?: 'light' | 'dark'; // Future: theme preference
  defaultModel?: LLMModelType; // Default model for new chat rooms

  // Metadata
  updatedAt: number; // Unix timestamp of last save
}

export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful assistant explaining documentation. Be concise and clear.';
