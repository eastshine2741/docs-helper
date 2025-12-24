import type { LLMModelType } from '../../shared/types/llmModel';
import type { UserSettings } from '../../shared/types/userSettings';
import { ClaudeService, type ConversationMessage } from './claudeService';
import { GeminiService } from './geminiService';

export class LLMFactory {
  static async sendMessage(
    model: LLMModelType,
    messages: ConversationMessage[],
    settings: UserSettings,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    // Get API key for the selected model
    const apiKey = settings.apiKeys[model];

    if (!apiKey) {
      throw new Error(`API key not configured for ${model}`);
    }

    // Create service instance based on model type
    const service = model === 'claude'
      ? new ClaudeService(apiKey)
      : new GeminiService(apiKey);

    // Send message with system prompt
    return service.sendMessage(messages, {
      systemPrompt: settings.systemPrompt,
      onChunk,
    });
  }
}
