import type { LLMModelType } from './llmModel';
import type { UserSettings } from './userSettings';

// Content Script → Background Worker Messages
export type ContentToBackgroundMessage =
  | APIRequestMessage
  | GetSettingsMessage
  | SaveSettingsMessage;

export interface APIRequestMessage {
  type: 'API_REQUEST';
  payload: {
    chatRoomId: string;
    prompt: string;
    model: LLMModelType;
    conversationHistory: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  };
}

export interface GetSettingsMessage {
  type: 'GET_SETTINGS';
}

export interface SaveSettingsMessage {
  type: 'SAVE_SETTINGS';
  payload: UserSettings;
}

// Background Worker → Content Script Messages
export type BackgroundToContentMessage =
  | APIResponseMessage
  | APIErrorMessage
  | StreamChunkMessage
  | SettingsResponseMessage;

export interface APIResponseMessage {
  type: 'API_RESPONSE';
  payload: {
    chatRoomId: string;
    content: string;
    success: true;
  };
}

export interface APIErrorMessage {
  type: 'API_ERROR';
  payload: {
    chatRoomId: string;
    error: string;
    success: false;
  };
}

export interface StreamChunkMessage {
  type: 'STREAM_CHUNK';
  payload: {
    chatRoomId: string;
    chunk: string;
  };
}

export interface SettingsResponseMessage {
  type: 'SETTINGS_RESPONSE';
  payload: UserSettings;
}

// Union type for all messages
export type ExtensionMessage = ContentToBackgroundMessage | BackgroundToContentMessage;
