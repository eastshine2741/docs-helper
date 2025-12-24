import { useState, useCallback } from 'react';
import type { ChatRoom } from '../../shared/types/chatRoom';
import type { Message } from '../../shared/types/message';
import type { TextSelection } from '../../shared/types/textSelection';
import type { LLMModelType } from '../../shared/types/llmModel';
import { ChatRoomManager } from '../services/chatRoomManager';

interface UseChatRoomsReturn {
  chatRooms: ChatRoom[];
  createChatRoom: (selection: TextSelection, model: LLMModelType) => ChatRoom | null;
  deleteChatRoom: (id: string) => void;
  expandChatRoom: (id: string) => void;
  addMessage: (chatRoomId: string, message: Message) => void;
  updateMessage: (chatRoomId: string, messageId: string, updates: Partial<Message>) => void;
  setLoading: (chatRoomId: string, isLoading: boolean) => void;
  changeModel: (chatRoomId: string, model: LLMModelType) => void;
}

/**
 * Hook for managing multiple chat rooms
 * Provides CRUD operations and state management
 */
export function useChatRooms(): UseChatRoomsReturn {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);

  const createChatRoom = useCallback(
    (selection: TextSelection, model: LLMModelType): ChatRoom | null => {
      // Check for duplicates
      const duplicate = ChatRoomManager.findDuplicate(selection, model, chatRooms);
      if (duplicate) {
        // If duplicate exists, expand it instead of creating new
        setChatRooms((prev) => ChatRoomManager.enforceOneExpanded(prev, duplicate.id));
        return null;
      }

      // Create new chat room
      const newRoom = ChatRoomManager.createChatRoom(selection, model, chatRooms);

      // Add to state and ensure it's the only expanded one
      setChatRooms((prev) => {
        const withNewRoom = [...prev, newRoom];
        return ChatRoomManager.enforceOneExpanded(withNewRoom, newRoom.id);
      });

      return newRoom;
    },
    [chatRooms]
  );

  const deleteChatRoom = useCallback((id: string) => {
    setChatRooms((prev) => {
      const filtered = prev.filter((room) => room.id !== id);
      return ChatRoomManager.recomputePositions(filtered);
    });
  }, []);

  const expandChatRoom = useCallback((id: string) => {
    setChatRooms((prev) => ChatRoomManager.enforceOneExpanded(prev, id));
  }, []);

  const addMessage = useCallback((chatRoomId: string, message: Message) => {
    setChatRooms((prev) => ChatRoomManager.addMessage(prev, chatRoomId, message));
  }, []);

  const updateMessage = useCallback(
    (chatRoomId: string, messageId: string, updates: Partial<Message>) => {
      setChatRooms((prev) =>
        ChatRoomManager.updateMessage(prev, chatRoomId, messageId, updates)
      );
    },
    []
  );

  const setLoading = useCallback((chatRoomId: string, isLoading: boolean) => {
    setChatRooms((prev) => ChatRoomManager.setLoading(prev, chatRoomId, isLoading));
  }, []);

  const changeModel = useCallback((chatRoomId: string, model: LLMModelType) => {
    setChatRooms((prev) =>
      prev.map((room) =>
        room.id === chatRoomId
          ? { ...room, model, updatedAt: Date.now() }
          : room
      )
    );
  }, []);

  return {
    chatRooms,
    createChatRoom,
    deleteChatRoom,
    expandChatRoom,
    addMessage,
    updateMessage,
    setLoading,
    changeModel,
  };
}
