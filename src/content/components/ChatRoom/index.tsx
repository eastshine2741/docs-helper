import React, { useState } from 'react';
import type { ChatRoom as ChatRoomType } from '../../../shared/types/chatRoom';
import type { LLMModelType } from '../../../shared/types/llmModel';
import { LLM_MODELS } from '../../../shared/constants/llmProviders';
import { MessageList } from '../MessageList';

interface ChatRoomProps {
  chatRoom: ChatRoomType;
  onModelChange: (model: LLMModelType) => void;
  onSendMessage: (content: string) => void;
  onDelete: () => void;
  onExpand: () => void;
  isExpanded: boolean;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({
  chatRoom,
  onModelChange,
  onSendMessage,
  onDelete,
  onExpand,
  isExpanded,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      onClick={!isExpanded ? onExpand : undefined}
      style={{
        position: 'fixed',
        right: '0',
        top: `${chatRoom.position.vertical}px`,
        width: '400px',
        maxHeight: isExpanded ? '80vh' : '120px',
        backgroundColor: 'white',
        borderLeft: '1px solid #E2E8F0',
        borderTop: '1px solid #E2E8F0',
        boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
        zIndex: 9998,
        transition: 'all 0.3s',
        cursor: !isExpanded ? 'pointer' : 'default',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#F7FAFC',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <select
          value={chatRoom.model}
          onChange={(e) => onModelChange(e.target.value as LLMModelType)}
          disabled={!isExpanded}
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: '14px',
            border: '1px solid #E2E8F0',
            borderRadius: '4px',
            backgroundColor: 'white',
          }}
        >
          {Object.entries(LLM_MODELS).map(([key, model]) => (
            <option key={key} value={key}>
              {model.name}
            </option>
          ))}
        </select>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: '4px 8px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#718096',
          }}
          aria-label="Delete chat"
        >
          ✕
        </button>
      </div>

      {/* Selected Text Preview (collapsed) */}
      {!isExpanded && (
        <div
          style={{
            padding: '8px',
            fontSize: '14px',
            color: '#4A5568',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {chatRoom.selectedText}
        </div>
      )}

      {/* Messages Area (expanded) */}
      {isExpanded && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px',
          }}
        >
          <div
            style={{
              fontSize: '14px',
              color: '#718096',
              fontStyle: 'italic',
              marginBottom: '12px',
            }}
          >
            Selected: {chatRoom.selectedText}
          </div>
          <MessageList messages={chatRoom.messages} isCollapsed={false} />
        </div>
      )}

      {/* Collapsed Messages Preview */}
      {!isExpanded && chatRoom.messages.length > 0 && (
        <div style={{ padding: '8px', fontSize: '12px' }}>
          <MessageList messages={chatRoom.messages} isCollapsed={true} />
        </div>
      )}

      {/* Input Area (expanded) */}
      {isExpanded && (
        <div
          style={{
            padding: '8px',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            gap: '8px',
          }}
        >
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            disabled={chatRoom.isLoading}
            style={{
              flex: 1,
              padding: '8px',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              fontSize: '14px',
              minHeight: '60px',
              maxHeight: '120px',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleSend}
            disabled={chatRoom.isLoading || !inputValue.trim()}
            style={{
              padding: '8px 16px',
              backgroundColor:
                chatRoom.isLoading || !inputValue.trim() ? '#E2E8F0' : '#3182CE',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor:
                chatRoom.isLoading || !inputValue.trim() ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Send
          </button>
        </div>
      )}
    </div>
  );
};
