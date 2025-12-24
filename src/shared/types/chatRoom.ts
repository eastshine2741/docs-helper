import type { Message } from './message';
import type { LLMModelType } from './llmModel';

export type ChatRoomState = 'expanded' | 'collapsed';

export interface ChatRoom {
  // Unique identifier
  id: string; // Format: `${xpath}_${model}_${pageUrl}_${timestamp}`

  // Identity components
  xpath: string; // XPATH of element or common ancestor
  model: LLMModelType; // 'claude' | 'gemini'
  textIndices?: { start: number; end: number }; // Optional: for single-element selections

  // Context
  pageUrl: string; // URL of the page where chat room was created
  selectedText: string; // The text that was selected (for display/context)

  // State
  messages: Message[]; // Conversation history
  state: ChatRoomState; // 'expanded' | 'collapsed'
  isLoading: boolean; // True when waiting for LLM response

  // Metadata
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  position: { vertical: number }; // Vertical position in viewport (pixels from top)
}
