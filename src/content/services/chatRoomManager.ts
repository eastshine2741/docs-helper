import type { ChatRoom, ChatRoomState } from '../../shared/types/chatRoom';
import type { TextSelection } from '../../shared/types/textSelection';
import type { LLMModelType } from '../../shared/types/llmModel';
import type { Message } from '../../shared/types/message';

/**
 * Service for managing multiple chat rooms on a page
 * Handles creation, positioning, state management
 */
export class ChatRoomManager {
  /**
   * Calculate vertical position for a new chat room
   * Stacks newest at bottom, pushes older rooms up
   */
  static calculatePosition(
    existingRooms: ChatRoom[],
    selectionRect: { top: number; right: number; bottom: number; left: number; width: number; height: number }
  ): number {
    if (existingRooms.length === 0) {
      // First chat room - position at bottom of selection
      return selectionRect.bottom + window.scrollY;
    }

    // Find the lowest chat room position
    const lowestPosition = Math.max(
      ...existingRooms.map((room) => room.position.vertical)
    );

    // Stack new room below the lowest one
    // Assume each collapsed room is ~120px, expanded is ~80vh
    const roomHeight = 120;
    return lowestPosition + roomHeight + 10; // 10px gap
  }

  /**
   * Generate unique identifier for a chat room
   * Format: xpath_model_timestamp
   */
  static generateId(
    xpath: string,
    model: LLMModelType
  ): string {
    const timestamp = Date.now();
    const xpathHash = xpath.replace(/[^a-zA-Z0-9]/g, '_');
    return `${xpathHash}_${model}_${timestamp}`;
  }

  /**
   * Create a new chat room from text selection
   */
  static createChatRoom(
    selection: TextSelection,
    model: LLMModelType,
    existingRooms: ChatRoom[]
  ): ChatRoom {
    const id = this.generateId(selection.xpath, model);
    const position = this.calculatePosition(existingRooms, selection.boundingRect);

    return {
      id,
      xpath: selection.xpath,
      model,
      textIndices: selection.indices,
      pageUrl: selection.pageUrl,
      selectedText: selection.selectedText,
      messages: [],
      state: 'expanded' as ChatRoomState,
      isLoading: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: {
        vertical: position,
      },
    };
  }

  /**
   * Check if a chat room already exists for this selection and model
   */
  static findDuplicate(
    selection: TextSelection,
    model: LLMModelType,
    existingRooms: ChatRoom[]
  ): ChatRoom | undefined {
    return existingRooms.find(
      (room) =>
        room.xpath === selection.xpath &&
        room.model === model &&
        room.pageUrl === selection.pageUrl &&
        JSON.stringify(room.textIndices) === JSON.stringify(selection.indices)
    );
  }

  /**
   * Update positions of all chat rooms when one is deleted
   * Re-stack remaining rooms from top to bottom
   */
  static recomputePositions(rooms: ChatRoom[]): ChatRoom[] {
    if (rooms.length === 0) return rooms;

    // Sort by creation time (oldest first)
    const sorted = [...rooms].sort((a, b) => a.createdAt - b.createdAt);

    let currentTop = window.scrollY + 100; // Start 100px from top of viewport
    const roomHeight = 120;
    const gap = 10;

    return sorted.map((room) => {
      const newRoom = {
        ...room,
        position: {
          vertical: currentTop,
        },
      };
      currentTop += roomHeight + gap;
      return newRoom;
    });
  }

  /**
   * Ensure only one chat room is expanded at a time
   */
  static enforceOneExpanded(
    rooms: ChatRoom[],
    expandedId: string
  ): ChatRoom[] {
    return rooms.map((room) => ({
      ...room,
      state: room.id === expandedId ? 'expanded' : 'collapsed',
    }));
  }

  /**
   * Add a message to a chat room
   */
  static addMessage(
    rooms: ChatRoom[],
    chatRoomId: string,
    message: Message
  ): ChatRoom[] {
    return rooms.map((room) =>
      room.id === chatRoomId
        ? {
            ...room,
            messages: [...room.messages, message],
            updatedAt: Date.now(),
          }
        : room
    );
  }

  /**
   * Update a message in a chat room (for streaming updates)
   */
  static updateMessage(
    rooms: ChatRoom[],
    chatRoomId: string,
    messageId: string,
    updates: Partial<Message>
  ): ChatRoom[] {
    return rooms.map((room) =>
      room.id === chatRoomId
        ? {
            ...room,
            messages: room.messages.map((msg) =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
            updatedAt: Date.now(),
          }
        : room
    );
  }

  /**
   * Set loading state for a chat room
   */
  static setLoading(
    rooms: ChatRoom[],
    chatRoomId: string,
    isLoading: boolean
  ): ChatRoom[] {
    return rooms.map((room) =>
      room.id === chatRoomId
        ? {
            ...room,
            isLoading,
            updatedAt: Date.now(),
          }
        : room
    );
  }
}
