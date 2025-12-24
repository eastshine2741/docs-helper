import { useState, useCallback } from 'react';
import type {
  ContentToBackgroundMessage,
  BackgroundToContentMessage,
} from '../../shared/types/messaging';
import type { LLMModelType } from '../../shared/types/llmModel';
import type { Message } from '../../shared/types/message';

interface UseLLMRequestReturn {
  sendMessage: (
    chatRoomId: string,
    prompt: string,
    model: LLMModelType,
    conversationHistory: Message[]
  ) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for sending messages to LLM via background service worker
 * Handles message passing and error states
 */
export function useLLMRequest(): UseLLMRequestReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (
      chatRoomId: string,
      prompt: string,
      model: LLMModelType,
      conversationHistory: Message[]
    ): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        // Convert Message[] to format expected by background
        const history = conversationHistory.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

        const message: ContentToBackgroundMessage = {
          type: 'API_REQUEST',
          payload: {
            chatRoomId,
            prompt,
            model,
            conversationHistory: history,
          },
        };

        // Send message to background service worker
        const response = await chrome.runtime.sendMessage(message);

        const bgResponse = response as BackgroundToContentMessage;

        if (bgResponse.type === 'API_ERROR') {
          throw new Error(bgResponse.payload.error);
        }

        if (bgResponse.type === 'API_RESPONSE') {
          setIsLoading(false);
          return bgResponse.payload.content;
        }

        throw new Error('Unexpected response type from background');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsLoading(false);
        throw err;
      }
    },
    []
  );

  return {
    sendMessage,
    isLoading,
    error,
  };
}
