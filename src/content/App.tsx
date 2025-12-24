import React, { useState, useCallback, useEffect } from 'react';
import { useTextSelection } from './hooks/useTextSelection';
import { useChatRooms } from './hooks/useChatRooms';
import { useLLMRequest } from './hooks/useLLMRequest';
import { StartChatButton } from './components/StartChatButton';
import { TextHighlight } from './components/TextHighlight';
import { ChatRoom } from './components/ChatRoom';
import type { LLMModelType } from '../shared/types/llmModel';
import type { Message } from '../shared/types/message';

/**
 * Main App component for content script
 * Manages text selection, chat rooms, and LLM interactions
 */
export const App: React.FC = () => {
  const { selection, clearSelection } = useTextSelection();
  const {
    chatRooms,
    createChatRoom,
    deleteChatRoom,
    expandChatRoom,
    addMessage,
    updateMessage,
    setLoading,
    changeModel,
  } = useChatRooms();
  const { sendMessage: sendLLMMessage } = useLLMRequest();

  const [selectedModel] = useState<LLMModelType>('claude');
  const [showButton, setShowButton] = useState(false);

  // Show start chat button when there's a selection
  useEffect(() => {
    if (selection && selection.boundingRect) {
      setShowButton(true);
    } else {
      setShowButton(false);
    }
  }, [selection]);

  // Handle start chat button click
  const handleStartChat = useCallback(() => {
    if (!selection) return;

    // Create chat room with selected model
    createChatRoom(selection, selectedModel);

    // Clear selection and hide button
    clearSelection();
    setShowButton(false);
  }, [selection, selectedModel, createChatRoom, clearSelection]);

  // Handle sending a message in a chat room
  const handleSendMessage = useCallback(
    async (chatRoomId: string, content: string) => {
      const room = chatRooms.find((r) => r.id === chatRoomId);
      if (!room) return;

      // Create user message
      const userMessage: Message = {
        id: `msg_${Date.now()}_user`,
        chatRoomId,
        role: 'user',
        content,
        timestamp: Date.now(),
        status: 'sent',
      };

      addMessage(chatRoomId, userMessage);

      // Create assistant message placeholder
      const assistantMessageId = `msg_${Date.now()}_assistant`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        chatRoomId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };

      addMessage(chatRoomId, assistantMessage);
      setLoading(chatRoomId, true);

      try {
        // Send to LLM via background service worker
        const response = await sendLLMMessage(
          chatRoomId,
          content,
          room.model,
          room.messages
        );

        // Update assistant message with response
        updateMessage(chatRoomId, assistantMessageId, {
          content: response,
          isStreaming: false,
        });
      } catch (error) {
        // Handle errors
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Check if it's an API key error
        if (errorMessage.includes('API key not configured')) {
          // Show error and delete chat room
          updateMessage(chatRoomId, assistantMessageId, {
            content: 'Error: API key not configured. Please set your API key in the extension options.',
            error: errorMessage,
            isStreaming: false,
          });

          // Optional: Could auto-delete the chat room after a delay
          // setTimeout(() => deleteChatRoom(chatRoomId), 5000);
        } else {
          // Other errors - mark message as failed
          updateMessage(chatRoomId, assistantMessageId, {
            content: 'Failed to get response from LLM.',
            error: errorMessage,
            isStreaming: false,
            status: 'failed',
          });
        }
      } finally {
        setLoading(chatRoomId, false);
      }
    },
    [chatRooms, addMessage, updateMessage, setLoading, sendLLMMessage]
  );

  // Handle model change in a chat room
  const handleModelChange = useCallback(
    (chatRoomId: string, model: LLMModelType) => {
      changeModel(chatRoomId, model);
    },
    [changeModel]
  );

  // Handle chat room deletion with confirmation
  const handleDeleteChatRoom = useCallback(
    (chatRoomId: string) => {
      // Simple confirmation
      if (window.confirm('Delete this chat?')) {
        deleteChatRoom(chatRoomId);
      }
    },
    [deleteChatRoom]
  );

  // Click outside handler to collapse expanded chat room
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside all chat rooms
      const clickedInsideChatRoom = chatRooms.some((room) => {
        // Simple check - in real implementation, would use refs
        return target.closest(`[data-chat-room-id="${room.id}"]`);
      });

      if (!clickedInsideChatRoom) {
        // Collapse all chat rooms
        const expandedRoom = chatRooms.find((room) => room.state === 'expanded');
        if (expandedRoom) {
          expandChatRoom(expandedRoom.id); // This will collapse it due to toggle logic
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [chatRooms, expandChatRoom]);

  return (
    <div>
      {/* Text highlight overlays */}
      {chatRooms.map((room) => (
        <TextHighlight
          key={`highlight_${room.id}`}
          xpath={room.xpath}
          indices={room.textIndices}
          isExpanded={room.state === 'expanded'}
        />
      ))}

      {/* Start chat button */}
      {showButton && selection?.boundingRect && (
        <StartChatButton
          position={{
            top: selection.boundingRect.bottom + window.scrollY + 5,
            left: selection.boundingRect.right + window.scrollX - 100,
          }}
          onClick={handleStartChat}
        />
      )}

      {/* Chat rooms */}
      {chatRooms.map((room) => (
        <div key={room.id} data-chat-room-id={room.id}>
          <ChatRoom
            chatRoom={room}
            onModelChange={(model) => handleModelChange(room.id, model)}
            onSendMessage={(content) => handleSendMessage(room.id, content)}
            onDelete={() => handleDeleteChatRoom(room.id)}
            onExpand={() => expandChatRoom(room.id)}
            isExpanded={room.state === 'expanded'}
          />
        </div>
      ))}
    </div>
  );
};
