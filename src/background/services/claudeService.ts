import { LLM_MODELS } from '../../shared/constants/llmProviders';

export interface LLMServiceOptions {
  apiKey: string;
  systemPrompt?: string;
  onChunk?: (chunk: string) => void;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ClaudeService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    messages: ConversationMessage[],
    options: { systemPrompt?: string; onChunk?: (chunk: string) => void } = {}
  ): Promise<string> {
    const model = LLM_MODELS.claude;

    const requestBody = {
      model: model.modelId,
      max_tokens: model.maxTokens,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      system: options.systemPrompt,
      stream: !!options.onChunk,
    };

    const response = await fetch(model.apiEndpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    // Handle streaming response
    if (options.onChunk && response.body) {
      return this.handleStreamingResponse(response.body, options.onChunk);
    }

    // Handle non-streaming response
    const data = await response.json();
    return data.content[0].text;
  }

  private async handleStreamingResponse(
    body: ReadableStream<Uint8Array>,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    try {
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
              const event = JSON.parse(data);

              // Extract text from content_block_delta events
              if (event.type === 'content_block_delta' && event.delta?.text) {
                const text = event.delta.text;
                fullResponse += text;
                onChunk(text);
              }
            } catch (e) {
              // Skip invalid JSON
              console.warn('Failed to parse SSE event:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullResponse;
  }
}
