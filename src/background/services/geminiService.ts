import { LLM_MODELS } from '../../shared/constants/llmProviders';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class GeminiService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendMessage(
    messages: ConversationMessage[],
    options: { systemPrompt?: string; onChunk?: (chunk: string) => void } = {}
  ): Promise<string> {
    const model = LLM_MODELS.gemini;

    // Convert messages to Gemini format (role: 'user' | 'model')
    const contents = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : msg.role,
      parts: [{ text: msg.content }],
    }));

    const requestBody: any = {
      contents,
      generationConfig: {
        maxOutputTokens: model.maxTokens,
        temperature: 0.7,
      },
    };

    // Add system instruction if provided
    if (options.systemPrompt) {
      requestBody.systemInstruction = {
        parts: [{ text: options.systemPrompt }],
      };
    }

    const url = `${model.apiEndpoint}/${model.modelId}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Extract text from response
    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text;

      // If streaming callback provided, send the full text as one chunk
      // (Gemini doesn't support true streaming via REST API in the same way)
      if (options.onChunk) {
        options.onChunk(text);
      }

      return text;
    }

    throw new Error('Invalid response format from Gemini API');
  }
}
