export type MessageRole = 'user' | 'assistant';

export interface Message {
  // Identity
  id: string; // Format: `msg_${timestamp}_${randomId}`
  chatRoomId: string; // Foreign key to ChatRoom

  // Content
  role: MessageRole; // 'user' | 'assistant'
  content: string; // Message text (markdown for assistant)

  // Metadata
  timestamp: number; // Unix timestamp

  // For assistant message
  isStreaming?: boolean; // True if currently receiving streamed response

  // For user message
  error?: string; // Error message if API call failed
  status?: 'sent' | 'failed'; // 'sent' = waiting for response, 'failed' = API error
}
