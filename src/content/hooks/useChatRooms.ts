import { useState, useCallback, useEffect } from 'react';
import type { ChatRoom } from '../../shared/types/chatRoom';
import type { Message } from '../../shared/types/message';
import type { TextSelection } from '../../shared/types/textSelection';
import type { LLMModelType } from '../../shared/types/llmModel';
import { ChatRoomManager } from '../services/chatRoomManager';
import { Storage } from '../../shared/utils/storage';

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
 * Provides CRUD operations and state management with persistence
 */
export function useChatRooms(): UseChatRoomsReturn {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const pageUrl = window.location.href;

  // Load chat rooms from storage on mount
  useEffect(() => {
    const loadChatRooms = async () => {
      try {
        const stored = await Storage.getChatRooms(pageUrl);

        // Validate XPATH still exists in DOM
        const validRooms = stored.filter((room) => {
          try {
            const result = document.evaluate(
              room.xpath,
              document,
              null,
              XPathResult.FIRST_ORDERED_NODE_TYPE,
              null
            );
            return result.singleNodeValue !== null;
          } catch {
            return false;
          }
        });

        setChatRooms(validRooms);
        setIsInitialized(true);

        // Clean up invalid rooms from storage
        if (validRooms.length !== stored.length) {
          await Storage.saveChatRooms(pageUrl, validRooms);
        }
      } catch (error) {
        console.error('[DocsChat] Failed to load chat rooms:', error);
        setIsInitialized(true);
      }
    };

    loadChatRooms();
  }, [pageUrl]);

  // Persist chat rooms to storage whenever they change
  useEffect(() => {
    if (!isInitialized) return;

    const saveChatRooms = async () => {
      try {
        await Storage.saveChatRooms(pageUrl, chatRooms);
      } catch (error) {
        console.error('[DocsChat] Failed to save chat rooms:', error);
      }
    };

    saveChatRooms();
  }, [chatRooms, pageUrl, isInitialized]);

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
