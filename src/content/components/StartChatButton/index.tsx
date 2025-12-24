import React from 'react';

interface StartChatButtonProps {
  position: { top: number; left: number };
  onClick: () => void;
}

export const StartChatButton: React.FC<StartChatButtonProps> = ({
  position,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        padding: '6px 12px',
        backgroundColor: '#3182CE',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 9999,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      Start Chat
    </button>
  );
};
