import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Message } from '../../../shared/types/message';

interface MessageListProps {
  messages: Message[];
  isCollapsed?: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  isCollapsed = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!isCollapsed) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isCollapsed]);

  // Show only first and last message when collapsed
  const displayMessages =
    isCollapsed && messages.length > 2
      ? [messages[0], messages[messages.length - 1]]
      : messages;

  const showEllipsis = isCollapsed && messages.length > 2;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: '100%',
      }}
    >
      {displayMessages.map((message, index) => (
        <React.Fragment key={message.id}>
          {/* Show ellipsis between first and last message when collapsed */}
          {showEllipsis && index === 1 && (
            <div
              style={{
                fontSize: '14px',
                color: '#A0AEC0',
                textAlign: 'center',
                padding: '4px 0',
              }}
            >
              ...
            </div>
          )}

          <div
            style={{
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
            }}
          >
            <div
              style={{
                backgroundColor: message.role === 'user' ? '#BEE3F8' : '#EDF2F7',
                borderRadius: '6px',
                padding: '12px',
                position: 'relative',
              }}
            >
              {/* Message content with markdown rendering */}
              {message.role === 'assistant' ? (
                <div
                  className="markdown-content"
                  style={{
                    fontSize: '14px',
                  }}
                >
                  <ReactMarkdown
                    components={{
                      code({ children, ...props }) {
                        const isInline = !props.className;
                        return isInline ? (
                          <code
                            style={{
                              backgroundColor: '#E2E8F0',
                              padding: '2px 4px',
                              borderRadius: '3px',
                              fontSize: '0.9em',
                            }}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            style={{
                              display: 'block',
                              backgroundColor: '#2D3748',
                              color: 'white',
                              padding: '12px',
                              borderRadius: '6px',
                              overflowX: 'auto',
                              marginTop: '8px',
                              marginBottom: '8px',
                            }}
                          >
                            {children}
                          </code>
                        );
                      },
                      p({ children }) {
                        return (
                          <p style={{ marginBottom: '8px', lineHeight: 1.5 }}>
                            {children}
                          </p>
                        );
                      },
                      ul({ children }) {
                        return (
                          <ul
                            style={{
                              marginLeft: '16px',
                              marginTop: '8px',
                              marginBottom: '8px',
                            }}
                          >
                            {children}
                          </ul>
                        );
                      },
                      ol({ children }) {
                        return (
                          <ol
                            style={{
                              marginLeft: '16px',
                              marginTop: '8px',
                              marginBottom: '8px',
                            }}
                          >
                            {children}
                          </ol>
                        );
                      },
                      li({ children }) {
                        return <li style={{ marginTop: '4px' }}>{children}</li>;
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <div
                  style={{
                    fontSize: '14px',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {message.content}
                </div>
              )}

              {/* Streaming indicator */}
              {message.isStreaming && (
                <span
                  style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '14px',
                    backgroundColor: '#3182CE',
                    marginLeft: '4px',
                    animation: 'blink 1s infinite',
                  }}
                />
              )}

              {/* Error indicator */}
              {message.error && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#E53E3E',
                    marginTop: '4px',
                  }}
                >
                  Error: {message.error}
                </div>
              )}

              {/* Failed status indicator */}
              {message.status === 'failed' && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#E53E3E',
                    marginTop: '4px',
                  }}
                >
                  Failed to send
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div
              style={{
                fontSize: '12px',
                color: '#718096',
                marginTop: '4px',
                paddingLeft: '4px',
                paddingRight: '4px',
              }}
            >
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </React.Fragment>
      ))}

      {/* Scroll anchor */}
      <div ref={bottomRef} />

      {/* CSS for blinking cursor */}
      <style>{`
        @keyframes blink {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
