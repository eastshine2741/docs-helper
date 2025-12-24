# Message Passing Contract

**Feature**: DocsHelper Chrome Extension
**Purpose**: Define message passing protocol between extension contexts
**Date**: 2025-12-24

---

## Overview

Chrome extensions use message passing to communicate between isolated contexts:
- **Content Script** ↔ **Background Service Worker**
- **Options Page** ↔ **Background Service Worker**
- **Background Service Worker** → **Content Script** (broadcast)

All messages use a discriminated union pattern for type safety.

---

## Message Types

### Content Script → Background Worker

#### 1. API_REQUEST

Request LLM API call from background worker.

**Message:**
```typescript
{
  type: 'API_REQUEST';
  payload: {
    chatRoomId: string;
    prompt: string;
    model: 'claude' | 'gemini';
    conversationHistory: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  };
}
```

**Response:**
```typescript
{
  type: 'API_RESPONSE';
  payload: {
    chatRoomId: string;
    content: string;
    success: true;
  };
}
// OR
{
  type: 'API_ERROR';
  payload: {
    chatRoomId: string;
    error: string;
    success: false;
  };
}
```

**Validation:**
- `chatRoomId` must be non-empty string
- `prompt` must be non-empty string (max 10,000 chars)
- `model` must be 'claude' or 'gemini'
- `conversationHistory` must be chronological (user/assistant alternating pattern encouraged)

**Error Cases:**
- Missing API key for selected model → `API_ERROR` with message "API key not configured for {model}"
- API rate limit exceeded → `API_ERROR` with message "Rate limit exceeded, try again later"
- Invalid API key → `API_ERROR` with message "Invalid API key"
- Network error → `API_ERROR` with message "Network error: {details}"

---

#### 2. GET_SETTINGS

Request user settings from background worker.

**Message:**
```typescript
{
  type: 'GET_SETTINGS';
  payload: {};
}
```

**Response:**
```typescript
{
  type: 'SETTINGS_RESPONSE';
  payload: {
    apiKeys: {
      claude?: string;
      gemini?: string;
    };
    systemPrompt: string;
    defaultModel: 'claude' | 'gemini';
  };
}
```

**Validation:**
- No validation required for request
- Response must include systemPrompt (default if not set)

---

### Background Worker → Content Script

#### 3. STREAM_CHUNK

Stream LLM response chunks to content script (for real-time display).

**Message:**
```typescript
{
  type: 'STREAM_CHUNK';
  payload: {
    chatRoomId: string;
    chunk: string;
    isComplete: boolean;
  };
}
```

**Validation:**
- `chatRoomId` must match an active API request
- `chunk` is the incremental text from LLM
- `isComplete` signals end of streaming

**Usage:**
- Content script appends chunk to current assistant message
- UI updates in real-time
- When `isComplete: true`, finalize message and save to storage

---

#### 4. SETTINGS_UPDATED

Broadcast settings change to all content scripts.

**Message:**
```typescript
{
  type: 'SETTINGS_UPDATED';
  payload: {
    systemPrompt: string;
    defaultModel: 'claude' | 'gemini';
  };
}
```

**Validation:**
- Sent when user saves settings in options page
- Content scripts update local cache

---

### Options Page → Background Worker

#### 5. SAVE_SETTINGS

Save user settings.

**Message:**
```typescript
{
  type: 'SAVE_SETTINGS';
  payload: {
    apiKeys: {
      claude?: string;
      gemini?: string;
    };
    systemPrompt: string;
    defaultModel?: 'claude' | 'gemini';
  };
}
```

**Response:**
```typescript
{
  type: 'SAVE_SETTINGS_RESPONSE';
  payload: {
    success: boolean;
    error?: string;
  };
}
```

**Validation:**
- At least one API key must be provided
- `systemPrompt` max length: 2,000 chars
- `apiKeys.claude` must start with 'sk-ant-' if provided
- `apiKeys.gemini` must be valid format if provided

**Error Cases:**
- No API keys provided → `error: "At least one API key is required"`
- Invalid API key format → `error: "Invalid API key format"`
- Storage quota exceeded → `error: "Storage quota exceeded"`

---

## TypeScript Definitions

**Complete Message Union:**
```typescript
// Message types
type BackgroundMessage =
  | APIRequestMessage
  | APIResponseMessage
  | APIErrorMessage
  | GetSettingsMessage
  | SettingsResponseMessage
  | StreamChunkMessage
  | SettingsUpdatedMessage
  | SaveSettingsMessage
  | SaveSettingsResponseMessage;

// Individual message types
interface APIRequestMessage {
  type: 'API_REQUEST';
  payload: {
    chatRoomId: string;
    prompt: string;
    model: 'claude' | 'gemini';
    conversationHistory: Array<{
      role: 'user' | 'assistant';
      content: string;
    }>;
  };
}

interface APIResponseMessage {
  type: 'API_RESPONSE';
  payload: {
    chatRoomId: string;
    content: string;
    success: true;
  };
}

interface APIErrorMessage {
  type: 'API_ERROR';
  payload: {
    chatRoomId: string;
    error: string;
    success: false;
  };
}

interface GetSettingsMessage {
  type: 'GET_SETTINGS';
  payload: Record<string, never>; // Empty object
}

interface SettingsResponseMessage {
  type: 'SETTINGS_RESPONSE';
  payload: {
    apiKeys: {
      claude?: string;
      gemini?: string;
    };
    systemPrompt: string;
    defaultModel: 'claude' | 'gemini';
  };
}

interface StreamChunkMessage {
  type: 'STREAM_CHUNK';
  payload: {
    chatRoomId: string;
    chunk: string;
    isComplete: boolean;
  };
}

interface SettingsUpdatedMessage {
  type: 'SETTINGS_UPDATED';
  payload: {
    systemPrompt: string;
    defaultModel: 'claude' | 'gemini';
  };
}

interface SaveSettingsMessage {
  type: 'SAVE_SETTINGS';
  payload: {
    apiKeys: {
      claude?: string;
      gemini?: string;
    };
    systemPrompt: string;
    defaultModel?: 'claude' | 'gemini';
  };
}

interface SaveSettingsResponseMessage {
  type: 'SAVE_SETTINGS_RESPONSE';
  payload: {
    success: boolean;
    error?: string;
  };
}
```

---

## Message Handlers

### Background Worker Handler

```typescript
// background/messageHandler.ts
chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, sender, sendResponse) => {
    switch (message.type) {
      case 'API_REQUEST':
        handleAPIRequest(message.payload, sender.tab?.id)
          .then(sendResponse)
          .catch(error => sendResponse({
            type: 'API_ERROR',
            payload: {
              chatRoomId: message.payload.chatRoomId,
              error: error.message,
              success: false
            }
          }));
        return true; // Required for async sendResponse

      case 'GET_SETTINGS':
        handleGetSettings()
          .then(sendResponse);
        return true;

      case 'SAVE_SETTINGS':
        handleSaveSettings(message.payload)
          .then(sendResponse);
        return true;

      default:
        console.warn('Unknown message type:', message);
        return false;
    }
  }
);
```

### Content Script Handler

```typescript
// content/messageHandler.ts
chrome.runtime.onMessage.addListener(
  (message: BackgroundMessage, sender, sendResponse) => {
    switch (message.type) {
      case 'STREAM_CHUNK':
        handleStreamChunk(message.payload);
        break;

      case 'SETTINGS_UPDATED':
        handleSettingsUpdate(message.payload);
        break;

      default:
        console.warn('Unknown message type:', message);
    }
  }
);
```

---

## Sending Messages

### From Content Script

```typescript
// Send API request
chrome.runtime.sendMessage<APIRequestMessage, APIResponseMessage | APIErrorMessage>(
  {
    type: 'API_REQUEST',
    payload: {
      chatRoomId: 'room-123',
      prompt: 'Explain this code',
      model: 'claude',
      conversationHistory: []
    }
  },
  (response) => {
    if (response.success) {
      console.log('LLM response:', response.content);
    } else {
      console.error('API error:', response.error);
    }
  }
);
```

### From Background Worker

```typescript
// Broadcast to all tabs
chrome.tabs.query({}, (tabs) => {
  tabs.forEach(tab => {
    if (tab.id) {
      chrome.tabs.sendMessage<StreamChunkMessage>(tab.id, {
        type: 'STREAM_CHUNK',
        payload: {
          chatRoomId: 'room-123',
          chunk: 'Here is ',
          isComplete: false
        }
      });
    }
  });
});

// Send to specific tab
chrome.tabs.sendMessage<StreamChunkMessage>(tabId, {
  type: 'STREAM_CHUNK',
  payload: {
    chatRoomId: 'room-123',
    chunk: 'the answer.',
    isComplete: true
  }
});
```

---

## Error Handling

### General Error Pattern

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  errorCode?: string; // Optional for specific error handling
}

// Error codes
enum MessageErrorCode {
  INVALID_API_KEY = 'INVALID_API_KEY',
  MISSING_API_KEY = 'MISSING_API_KEY',
  RATE_LIMIT = 'RATE_LIMIT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_QUOTA = 'STORAGE_QUOTA',
  INVALID_MESSAGE = 'INVALID_MESSAGE',
}
```

### Timeout Handling

```typescript
function sendMessageWithTimeout<T>(
  message: BackgroundMessage,
  timeout: number = 30000 // 30 seconds
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Message timeout'));
    }, timeout);

    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}
```

---

## Testing Contracts

### Mock Message Sender

```typescript
// tests/mocks/messaging.ts
import { vi } from 'vitest';

export const mockSendMessage = vi.fn();

global.chrome = {
  runtime: {
    sendMessage: mockSendMessage,
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
} as any;
```

### Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { sendAPIRequest } from '../services/messaging';

describe('Message Passing', () => {
  it('should send API_REQUEST message', async () => {
    const mockResponse = {
      type: 'API_RESPONSE',
      payload: {
        chatRoomId: 'test-room',
        content: 'LLM response',
        success: true,
      },
    };

    vi.mocked(chrome.runtime.sendMessage).mockImplementation((msg, callback) => {
      callback(mockResponse);
    });

    const response = await sendAPIRequest({
      chatRoomId: 'test-room',
      prompt: 'Test prompt',
      model: 'claude',
      conversationHistory: [],
    });

    expect(response.success).toBe(true);
    expect(response.content).toBe('LLM response');
  });
});
```

---

## Message Flow Diagrams

### API Request Flow

```
Content Script                Background Worker              LLM API
      |                              |                          |
      |-- API_REQUEST ------------->|                          |
      |                              |-- HTTP POST ----------->|
      |                              |                          |
      |                              |<-- Stream Chunk 1 ------|
      |<-- STREAM_CHUNK (partial) ---|                          |
      |                              |<-- Stream Chunk 2 ------|
      |<-- STREAM_CHUNK (partial) ---|                          |
      |                              |<-- Stream Complete -----|
      |<-- STREAM_CHUNK (complete) --|                          |
      |<-- API_RESPONSE --------------|                          |
```

### Settings Update Flow

```
Options Page              Background Worker           Content Scripts
      |                         |                           |
      |-- SAVE_SETTINGS ------->|                           |
      |                         |-- Save to Storage         |
      |<-- SAVE_SETTINGS_RSP ---|                           |
      |                         |-- SETTINGS_UPDATED ------>| (all tabs)
      |                         |                           |-- Update cache
```

---

## Security Considerations

1. **API Key Protection**: API keys never sent to content scripts, only stored in background worker
2. **Message Validation**: All messages validated before processing
3. **Origin Verification**: Verify sender origin for sensitive operations
4. **Rate Limiting**: Implement rate limiting on API requests to prevent abuse
5. **Content Sanitization**: Sanitize all user input before sending to LLM APIs

---

## Summary

This contract defines:
- ✅ All message types with TypeScript definitions
- ✅ Validation rules for each message
- ✅ Error handling patterns
- ✅ Message flow diagrams
- ✅ Testing patterns
- ✅ Security considerations

Ready for implementation.
