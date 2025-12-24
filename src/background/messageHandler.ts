import type {
  ContentToBackgroundMessage,
  BackgroundToContentMessage,
  APIResponseMessage,
  APIErrorMessage,
  SettingsResponseMessage,
} from '../shared/types/messaging';
import { Storage } from '../shared/utils/storage';
import { LLMFactory } from './services/llmFactory';

export class MessageHandler {
  async handleMessage(
    message: ContentToBackgroundMessage,
    _sender: chrome.runtime.MessageSender
  ): Promise<BackgroundToContentMessage> {
    switch (message.type) {
      case 'API_REQUEST':
        return this.handleAPIRequest(message.payload);

      case 'GET_SETTINGS':
        return this.handleGetSettings();

      case 'SAVE_SETTINGS':
        return this.handleSaveSettings(message.payload);

      default:
        throw new Error(`Unknown message type: ${(message as any).type}`);
    }
  }

  private async handleAPIRequest(payload: {
    chatRoomId: string;
    prompt: string;
    model: 'claude' | 'gemini';
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): Promise<APIResponseMessage | APIErrorMessage> {
    try {
      // Get user settings
      const settings = await Storage.getUserSettings();

      // Validate API key exists
      if (!settings.apiKeys[payload.model]) {
        return {
          type: 'API_ERROR',
          payload: {
            chatRoomId: payload.chatRoomId,
            error: `API key not configured for ${payload.model}`,
            success: false,
          },
        };
      }

      // Send request to LLM
      const response = await LLMFactory.sendMessage(
        payload.model,
        payload.conversationHistory,
        settings
      );

      return {
        type: 'API_RESPONSE',
        payload: {
          chatRoomId: payload.chatRoomId,
          content: response,
          success: true,
        },
      };
    } catch (error) {
      return {
        type: 'API_ERROR',
        payload: {
          chatRoomId: payload.chatRoomId,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          success: false,
        },
      };
    }
  }

  private async handleGetSettings(): Promise<SettingsResponseMessage> {
    const settings = await Storage.getUserSettings();
    return {
      type: 'SETTINGS_RESPONSE',
      payload: settings,
    };
  }

  private async handleSaveSettings(settings: any): Promise<SettingsResponseMessage> {
    await Storage.saveUserSettings(settings);
    return {
      type: 'SETTINGS_RESPONSE',
      payload: settings,
    };
  }
}
