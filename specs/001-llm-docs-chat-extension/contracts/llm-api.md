# LLM API Contract

**Feature**: DocsHelper Chrome Extension
**Purpose**: Define LLM API integration patterns for Claude and Gemini
**Date**: 2025-12-24

---

## Overview

DocsHelper integrates with two LLM providers:
1. **Claude (Anthropic)** - Primary provider
2. **Gemini (Google AI)** - Secondary provider

All API calls are made from the background service worker to avoid CORS issues and protect API keys.

---

## Provider Configurations

### Claude (Anthropic)

**API Endpoint**: `https://api.anthropic.com/v1/messages`

**Model**: `claude-3-5-sonnet-20241022`

**Authentication**: API key in `x-api-key` header

**Required Headers:**
```typescript
{
  'x-api-key': string; // API key (starts with sk-ant-)
  'anthropic-version': '2023-06-01';
  'content-type': 'application/json';
}
```

**API Key Format**: `sk-ant-api03-...` (starts with `sk-ant-`)

---

### Gemini (Google AI)

**API Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent`

**Model**: `gemini-1.5-pro-latest`

**Authentication**: API key as query parameter

**Required Headers:**
```typescript
{
  'content-type': 'application/json';
}
```

**API Key Format**: String (no specific prefix requirement)

---

## Request/Response Schemas

### Claude API

**Request:**
```typescript
interface ClaudeRequest {
  model: string; // 'claude-3-5-sonnet-20241022'
  max_tokens: number; // Default: 4096
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  system?: string; // System prompt (optional)
  stream?: boolean; // Enable streaming (default: false)
}
```

**Example Request:**
```typescript
const request: ClaudeRequest = {
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 4096,
  messages: [
    {
      role: 'user',
      content: 'Explain what this function does'
    }
  ],
  system: 'You are a helpful assistant explaining documentation.',
  stream: true
};
```

**Response (Non-Streaming):**
```typescript
interface ClaudeResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}
```

**Response (Streaming):**
Server-Sent Events (SSE) format with events:
```typescript
// Event types:
type ClaudeStreamEvent =
  | { type: 'message_start'; message: Partial<ClaudeResponse> }
  | { type: 'content_block_start'; index: number; content_block: { type: 'text'; text: string } }
  | { type: 'content_block_delta'; index: number; delta: { type: 'text_delta'; text: string } }
  | { type: 'content_block_stop'; index: number }
  | { type: 'message_delta'; delta: { stop_reason: string; stop_sequence: string | null } }
  | { type: 'message_stop' };
```

---

### Gemini API

**Request:**
```typescript
interface GeminiRequest {
  contents: Array<{
    role: 'user' | 'model'; // Note: 'model' instead of 'assistant'
    parts: Array<{
      text: string;
    }>;
  }>;
  systemInstruction?: {
    parts: Array<{
      text: string;
    }>;
  };
  generationConfig?: {
    maxOutputTokens?: number;
    temperature?: number;
  };
}
```

**Example Request:**
```typescript
const request: GeminiRequest = {
  contents: [
    {
      role: 'user',
      parts: [{ text: 'Explain what this function does' }]
    }
  ],
  systemInstruction: {
    parts: [{ text: 'You are a helpful assistant explaining documentation.' }]
  },
  generationConfig: {
    maxOutputTokens: 4096,
    temperature: 0.7
  }
};
```

**Response:**
```typescript
interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: 'model';
    };
    finishReason: 'STOP' | 'MAX_TOKENS' | 'SAFETY' | 'RECITATION' | 'OTHER';
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}
```

---

## Implementation Patterns

### LLM Service Interface

**Abstract Interface:**
```typescript
// shared/types/llm.ts
export interface LLMService {
  sendMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string>;
}
```

### Claude Service Implementation

```typescript
// background/services/claudeService.ts
export class ClaudeService implements LLMService {
  constructor(private apiKey: string) {}

  async sendMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages,
        system: systemPrompt,
        stream: !!onChunk,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Claude API error');
    }

    if (onChunk) {
      return this.handleStreamResponse(response, onChunk);
    } else {
      return this.handleNonStreamResponse(response);
    }
  }

  private async handleNonStreamResponse(response: Response): Promise<string> {
    const data: ClaudeResponse = await response.json();
    return data.content[0].text;
  }

  private async handleStreamResponse(
    response: Response,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const event: ClaudeStreamEvent = JSON.parse(data);

            if (event.type === 'content_block_delta') {
              const text = event.delta.text;
              fullText += text;
              onChunk(text);
            }
          } catch (e) {
            console.error('Failed to parse SSE event:', e);
          }
        }
      }
    }

    return fullText;
  }
}
```

### Gemini Service Implementation

```typescript
// background/services/geminiService.ts
export class GeminiService implements LLMService {
  constructor(private apiKey: string) {}

  async sendMessage(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    systemPrompt?: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    // Convert messages to Gemini format
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const requestBody: GeminiRequest = {
      contents,
      generationConfig: {
        maxOutputTokens: 4096,
      },
    };

    if (systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: systemPrompt }],
      };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Gemini API error');
    }

    const data: GeminiResponse = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response from Gemini');
    }

    const text = data.candidates[0].content.parts[0].text;

    // Gemini doesn't support streaming in the same way, so simulate chunks
    if (onChunk) {
      const words = text.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate delay
      }
    }

    return text;
  }
}
```

---

## Factory Pattern

**LLM Service Factory:**
```typescript
// background/services/llmFactory.ts
import { ClaudeService } from './claudeService';
import { GeminiService } from './geminiService';

export function createLLMService(
  model: 'claude' | 'gemini',
  apiKey: string
): LLMService {
  switch (model) {
    case 'claude':
      return new ClaudeService(apiKey);
    case 'gemini':
      return new GeminiService(apiKey);
    default:
      throw new Error(`Unknown model: ${model}`);
  }
}
```

---

## Background Worker Integration

**Message Handler:**
```typescript
// background/api.ts
import { createLLMService } from './services/llmFactory';
import { storage } from '@/shared/utils/storage';

export async function handleAPIRequest(
  payload: {
    chatRoomId: string;
    prompt: string;
    model: 'claude' | 'gemini';
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  },
  tabId?: number
): Promise<APIResponseMessage | APIErrorMessage> {
  try {
    // Get API keys and system prompt from storage
    const settings = await storage.get('userSettings');
    if (!settings) {
      throw new Error('Settings not configured');
    }

    const apiKey = settings.apiKeys[payload.model];
    if (!apiKey) {
      throw new Error(`API key not configured for ${payload.model}`);
    }

    // Create LLM service
    const llmService = createLLMService(payload.model, apiKey);

    // Build messages array
    const messages = [
      ...payload.conversationHistory,
      { role: 'user' as const, content: payload.prompt },
    ];

    // Send request with streaming
    const fullResponse = await llmService.sendMessage(
      messages,
      settings.systemPrompt,
      (chunk) => {
        // Send chunk to content script
        if (tabId) {
          chrome.tabs.sendMessage(tabId, {
            type: 'STREAM_CHUNK',
            payload: {
              chatRoomId: payload.chatRoomId,
              chunk,
              isComplete: false,
            },
          });
        }
      }
    );

    // Send completion message
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'STREAM_CHUNK',
        payload: {
          chatRoomId: payload.chatRoomId,
          chunk: '',
          isComplete: true,
        },
      });
    }

    return {
      type: 'API_RESPONSE',
      payload: {
        chatRoomId: payload.chatRoomId,
        content: fullResponse,
        success: true,
      },
    };
  } catch (error) {
    return {
      type: 'API_ERROR',
      payload: {
        chatRoomId: payload.chatRoomId,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
    };
  }
}
```

---

## Error Handling

### Error Types

```typescript
export enum LLMErrorType {
  INVALID_API_KEY = 'invalid_api_key',
  RATE_LIMIT = 'rate_limit_exceeded',
  NETWORK_ERROR = 'network_error',
  INVALID_REQUEST = 'invalid_request',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  CONTEXT_LENGTH_EXCEEDED = 'context_length_exceeded',
}

export class LLMError extends Error {
  constructor(
    public type: LLMErrorType,
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
```

### Error Detection

```typescript
function parseLLMError(response: Response, errorBody: any): LLMError {
  const status = response.status;

  // Claude errors
  if (errorBody.error?.type === 'authentication_error') {
    return new LLMError(
      LLMErrorType.INVALID_API_KEY,
      'Invalid API key',
      status
    );
  }

  if (errorBody.error?.type === 'rate_limit_error') {
    return new LLMError(
      LLMErrorType.RATE_LIMIT,
      'Rate limit exceeded. Please try again later.',
      status
    );
  }

  if (errorBody.error?.type === 'invalid_request_error') {
    return new LLMError(
      LLMErrorType.INVALID_REQUEST,
      errorBody.error.message,
      status
    );
  }

  // Gemini errors
  if (errorBody.error?.code === 'UNAUTHENTICATED') {
    return new LLMError(
      LLMErrorType.INVALID_API_KEY,
      'Invalid API key',
      status
    );
  }

  if (errorBody.error?.code === 'RESOURCE_EXHAUSTED') {
    return new LLMError(
      LLMErrorType.RATE_LIMIT,
      'Rate limit exceeded',
      status
    );
  }

  // Generic errors
  if (status >= 500) {
    return new LLMError(
      LLMErrorType.SERVICE_UNAVAILABLE,
      'Service temporarily unavailable',
      status
    );
  }

  return new LLMError(
    LLMErrorType.NETWORK_ERROR,
    errorBody.error?.message || 'Unknown error',
    status
  );
}
```

---

## Rate Limiting

### Client-Side Rate Limiting

```typescript
class RateLimiter {
  private lastRequest: number = 0;
  private minInterval: number = 1000; // 1 second between requests

  async throttle(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;

    if (timeSinceLastRequest < this.minInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minInterval - timeSinceLastRequest)
      );
    }

    this.lastRequest = Date.now();
  }
}

const rateLimiter = new RateLimiter();

// Usage
await rateLimiter.throttle();
const response = await llmService.sendMessage(messages);
```

---

## Testing

### Mock LLM Service

```typescript
// tests/mocks/llmService.ts
import { vi } from 'vitest';
import type { LLMService } from '@/shared/types/llm';

export class MockLLMService implements LLMService {
  sendMessage = vi.fn(async (
    messages,
    systemPrompt?,
    onChunk?
  ) => {
    const response = 'Mock LLM response';

    if (onChunk) {
      const words = response.split(' ');
      for (const word of words) {
        onChunk(word + ' ');
      }
    }

    return response;
  });
}
```

### Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ClaudeService } from '@/background/services/claudeService';

describe('ClaudeService', () => {
  it('should send message and return response', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          content: [{ text: 'Test response' }],
        }),
      } as Response)
    );

    const service = new ClaudeService('sk-ant-test-key');
    const response = await service.sendMessage([
      { role: 'user', content: 'Test prompt' },
    ]);

    expect(response).toBe('Test response');
    expect(fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-test-key',
        }),
      })
    );
  });

  it('should handle streaming responses', async () => {
    const chunks: string[] = [];

    // Mock streaming response
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(
          'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n\n'
        ));
        controller.enqueue(new TextEncoder().encode(
          'data: {"type":"content_block_delta","delta":{"text":" world"}}\n\n'
        ));
        controller.close();
      },
    });

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        body: mockStream,
      } as unknown as Response)
    );

    const service = new ClaudeService('sk-ant-test-key');
    const response = await service.sendMessage(
      [{ role: 'user', content: 'Test' }],
      undefined,
      (chunk) => chunks.push(chunk)
    );

    expect(response).toBe('Hello world');
    expect(chunks).toEqual(['Hello', ' world']);
  });
});
```

---

## Security Considerations

1. **API Key Protection**:
   - Store in `chrome.storage.local` (encrypted by Chrome)
   - Never expose in content script
   - Validate format before storage

2. **Request Validation**:
   - Sanitize all user input before sending to LLM
   - Limit message length (prevent token abuse)
   - Validate conversation history structure

3. **Response Handling**:
   - Treat all LLM output as untrusted
   - Render with react-markdown (safe by default)
   - Never use `dangerouslySetInnerHTML`

4. **Rate Limiting**:
   - Implement client-side throttling
   - Handle API rate limit errors gracefully
   - Provide user feedback on rate limits

---

## Summary

This contract defines:
- ✅ Complete API schemas for Claude and Gemini
- ✅ Service implementation patterns with streaming support
- ✅ Factory pattern for multi-provider support
- ✅ Error handling and rate limiting strategies
- ✅ Testing patterns with mocks
- ✅ Security considerations

Ready for implementation.
