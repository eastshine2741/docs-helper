import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

/**
 * Content script entry point
 * Sets up Shadow DOM for style isolation and renders the App
 */

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Create container element for Shadow DOM
  const container = document.createElement('div');
  container.id = 'docschat-extension-root';

  // Position container to not interfere with page layout
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.pointerEvents = 'none';
  container.style.zIndex = '2147483647'; // Maximum z-index

  // Append to body
  document.body.appendChild(container);

  // Create Shadow DOM for style isolation
  const shadowRoot = container.attachShadow({ mode: 'open' });

  // Create app container inside shadow root
  const appContainer = document.createElement('div');
  appContainer.id = 'app';

  // Enable pointer events on app container
  appContainer.style.pointerEvents = 'auto';

  shadowRoot.appendChild(appContainer);

  // Inject Chakra UI styles into Shadow DOM
  // Note: Emotion (used by Chakra) will automatically inject styles into the shadow root
  // when we use the ChakraProvider with a custom emotionCache

  // Create emotion cache for shadow DOM
  // This ensures Chakra UI styles are injected into the shadow root
  const styleContainer = document.createElement('style');
  styleContainer.id = 'chakra-styles';
  shadowRoot.appendChild(styleContainer);

  // Render React app
  const root = ReactDOM.createRoot(appContainer);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log('[DocsChat] Extension loaded successfully');
}

// Export for cleanup if needed
export {};
