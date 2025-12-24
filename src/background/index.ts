import { MessageHandler } from './messageHandler';
import type { ContentToBackgroundMessage } from '../shared/types/messaging';

// Initialize message handler
const messageHandler = new MessageHandler();

// Listen for messages from content scripts and options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Validate message format
  if (!message || typeof message !== 'object' || !message.type) {
    sendResponse({ error: 'Invalid message format' });
    return false;
  }

  // Handle message asynchronously
  messageHandler
    .handleMessage(message as ContentToBackgroundMessage, sender)
    .then(response => {
      sendResponse(response);
    })
    .catch(error => {
      console.error('Error handling message:', error);
      sendResponse({
        type: 'API_ERROR',
        payload: {
          chatRoomId: (message as any).payload?.chatRoomId || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        },
      });
    });

  // Return true to indicate async response
  return true;
});

// Log when background service worker is initialized
console.log('DocsHelper background service worker initialized');
