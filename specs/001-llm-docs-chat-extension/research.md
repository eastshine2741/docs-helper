# Research Report: DocsHelper Chrome Extension

**Feature**: DocsHelper - LLM-Powered Documentation Assistant
**Date**: 2025-12-24
**Purpose**: Resolve technical clarifications for implementation planning

---

## 1. UI Component Library Decision

### Decision: **Chakra UI** for content scripts, **shadcn/ui** optional for options/popup pages

### Rationale:

**Why Chakra UI for Content Scripts:**
- **Shadow DOM Compatible**: Uses CSS-in-JS (Emotion) which works perfectly in Shadow DOM without style conflicts
- **Beginner Friendly**: Excellent documentation, intuitive API, ideal for developers new to frontend
- **Complete Solution**: Batteries-included with all common components (Button, Card, Modal, etc.)
- **Zero Configuration**: No Tailwind setup, no class name conflicts
- **TypeScript First**: Excellent TypeScript support out of the box
- **Proven in Chrome Extensions**: Many production extensions use Chakra successfully

**Why shadcn/ui Has Issues:**
- Built on Radix UI primitives which have **portal issues in Shadow DOM** (dropdowns, modals break)
- Requires Tailwind CSS which can conflict with host page styles even with prefixing
- `preflight: false` mitigates but doesn't eliminate conflicts
- Larger bundle size (~40KB+ with Tailwind)

### Alternatives Considered:

| Library | Shadow DOM Support | Learning Curve | Bundle Size | Verdict |
|---------|-------------------|----------------|-------------|---------|
| Chakra UI | ⭐⭐⭐⭐⭐ Excellent | Low | Medium | **RECOMMENDED** |
| shadcn/ui | ⭐⭐ Poor (portals) | Low | Large | Options/popup only |
| Mantine | ⭐⭐⭐⭐⭐ Excellent | Low-Medium | Medium | Good alternative |
| Headless UI | ⭐⭐⭐⭐ Good | Low | Small | Lightweight option |

### Implementation:

```bash
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
```

```tsx
// src/content/App.tsx
import { ChakraProvider, Button, Box } from '@chakra-ui/react'

function App() {
  return (
    <ChakraProvider>
      <Box p={4} bg="white" borderRadius="md" boxShadow="lg">
        <Button colorScheme="blue">Start Chat</Button>
      </Box>
    </ChakraProvider>
  )
}
```

---

## 2. Markdown Rendering Library Decision

### Decision: **react-markdown**

### Rationale:

**Why react-markdown:**
- **Security First**: Renders to React elements, NOT raw HTML - eliminates XSS vulnerabilities by default
- **Beginner Friendly**: Single component import, minimal setup, extensive documentation
- **Chrome Extension Optimized**: Bundle size ~35-40KB gzipped is reasonable for extensions
- **Perfect for LLM Content**: Designed for dynamic markdown rendering (our exact use case)
- **TypeScript Native**: Excellent type definitions included
- **Active Maintenance**: Part of unified.js ecosystem (9M+ weekly downloads)

**Why NOT marked.js:**
- Produces raw HTML strings requiring `dangerouslySetInnerHTML`
- Needs additional DOMPurify library (~15KB) for XSS protection
- Total bundle size ends up similar (~35KB) with less safety
- More developer responsibility for security

**Why NOT remark/rehype directly:**
- Steeper learning curve (too complex for beginners)
- react-markdown IS built on remark/rehype, providing easier API with same power

### Implementation:

```bash
npm install react-markdown
npm install react-syntax-highlighter @types/react-syntax-highlighter  # for code blocks
```

```tsx
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

function ChatMessage({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        // Safe external links
        a: ({ node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" />
        ),
        // Syntax highlighted code blocks
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter language={match[1]} {...props}>
              {String(children)}
            </SyntaxHighlighter>
          ) : (
            <code {...props}>{children}</code>
          );
        }
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

---

## 3. Testing Framework Decision

### Decision: **Vitest + React Testing Library**

### Rationale:

**Why Vitest:**
- **Vite-Native Integration**: Shares same configuration and transformation pipeline - zero additional setup
- **10-20x Faster than Jest**: Critical for maintaining development momentum
- **Zero TypeScript Configuration**: Works instantly with our TS setup
- **HMR for Tests**: Instant test re-runs on file changes during development
- **Jest-Compatible API**: Familiar syntax (`describe`, `it`, `expect`) - easy migration if needed
- **Modern Architecture**: Built for ESM and modern JavaScript workflows

**Why NOT Jest:**
- Requires separate Babel/TypeScript transformation from Vite (configuration duplication)
- Poor ESM support (our project uses ESM imports)
- 5-10 second test suites vs sub-second with Vitest
- Fighting against Vite's design philosophy

### Chrome API Mocking Strategy:

**Manual Mocks (Recommended for Learning):**
```typescript
// tests/setup.ts
import { vi } from 'vitest';

global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys, callback) => {
        callback?.({});
        return Promise.resolve({});
      }),
      set: vi.fn((items, callback) => {
        callback?.();
        return Promise.resolve();
      }),
    },
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: { addListener: vi.fn() },
  },
} as any;
```

**Benefits:**
- Full control over mock behavior
- Understand exactly what's being tested
- No "magic" - explicit and clear
- Perfect for backend developers learning frontend testing

### Installation:

```bash
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @types/chrome
```

### Configuration:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
```

---

## 4. Chrome Extension Architecture Best Practices

### 4.1 Vite Configuration

**Key Pattern: Use @crxjs/vite-plugin**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Disable code splitting (CSP compliance)
      }
    },
    cssCodeSplit: false, // Single CSS file (CSP compliance)
  },
});
```

**Benefits:**
- HMR (Hot Module Replacement) for development
- Automatic manifest processing
- Handles multiple entry points (content, background, options)
- CSP-compliant builds

### 4.2 State Management Pattern

**Architecture:**
```
Content Script <---> Background Service Worker <---> Options/Popup
       ^                      ^
       |                      |
   Injected UI          Chrome Storage API
```

**Type-Safe Message Passing:**
```typescript
// shared/types/messaging.ts
export interface Messages {
  GET_DATA: { type: 'GET_DATA'; payload: { key: string } };
  SET_DATA: { type: 'SET_DATA'; payload: { key: string; value: any } };
  API_REQUEST: { type: 'API_REQUEST'; payload: { prompt: string } };
}

export type Message = Messages[keyof Messages];
```

**Recommendations:**
- Use Chrome Storage API directly with type-safe wrappers (simple state)
- Consider Zustand with storage middleware if complex state needed (lighter than Redux)
- AVOID: Redux (too heavy), Context API across boundaries (doesn't work)

### 4.3 React in Content Script

**Critical Pattern: Shadow DOM Mounting**

```typescript
// src/content/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.createElement('div');
container.id = 'docshelper-root';

// Attach shadow DOM for style isolation
const shadowRoot = container.attachShadow({ mode: 'open' });

// Create React root inside shadow DOM
const reactRoot = document.createElement('div');
shadowRoot.appendChild(reactRoot);

document.body.appendChild(container);

// Mount React app
ReactDOM.createRoot(reactRoot).render(<App />);
```

**Why Shadow DOM:**
- Complete style isolation (host page can't affect extension UI)
- No CSS naming conflicts
- True encapsulation
- Required for clean UI injection

### 4.4 Chrome Storage API Pattern

**Type-Safe Storage Wrapper:**

```typescript
// shared/utils/storage.ts
interface StorageSchema {
  chatRooms: Array<ChatRoom>;
  apiKeys: { claude?: string; gemini?: string };
  systemPrompt: string;
}

class TypedStorage {
  async get<K extends keyof StorageSchema>(
    key: K
  ): Promise<StorageSchema[K] | undefined> {
    const result = await chrome.storage.local.get(key);
    return result[key];
  }

  async set<K extends keyof StorageSchema>(
    key: K,
    value: StorageSchema[K]
  ): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }
}

export const storage = new TypedStorage();
```

**React Hook:**
```typescript
// hooks/useStorage.ts
export function useStorage<K extends keyof StorageSchema>(
  key: K,
  defaultValue: StorageSchema[K]
) {
  const [value, setValue] = useState<StorageSchema[K]>(defaultValue);

  useEffect(() => {
    storage.get(key).then((stored) => setValue(stored ?? defaultValue));

    // Listen for changes
    chrome.storage.onChanged.addListener((changes) => {
      if (changes[key]) setValue(changes[key].newValue);
    });
  }, [key]);

  const updateValue = (newValue: StorageSchema[K]) => {
    storage.set(key, newValue);
    setValue(newValue);
  };

  return [value, updateValue] as const;
}
```

**Best Practices:**
- Use `chrome.storage.local` for most data (10MB quota)
- Use `chrome.storage.sync` only for settings that sync across devices (100KB quota)
- Always handle quota errors gracefully
- Implement change listeners for real-time updates

### 4.5 Content Security Policy (CSP)

**Manifest V3 CSP Rules:**
- ✅ No inline scripts (all JS in separate files)
- ✅ No `eval()` or `new Function()`
- ✅ No remote code execution
- ✅ No inline event handlers

**Vite CSP Compliance:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined, // Prevents dynamic imports
      }
    },
    cssCodeSplit: false, // Single CSS bundle
  },
  define: {
    'process.env': {}, // Replace process.env references
  }
});
```

### 4.6 API Calls Strategy

**Decision: Use Background Service Worker for LLM APIs**

**Rationale:**
- ✅ No CORS issues (service workers bypass CORS)
- ✅ Better security (API keys not exposed to page)
- ✅ Access to privileged Chrome APIs
- ✅ Centralized error handling
- ✅ Longer timeout for LLM streaming

**Pattern:**
```typescript
// In content script
chrome.runtime.sendMessage(
  { type: 'API_REQUEST', payload: { prompt: 'Explain this code' } },
  (response) => {
    if (response.success) {
      updateChatMessage(response.data);
    }
  }
);

// In background/api.ts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'API_REQUEST') {
    (async () => {
      const apiKey = await storage.get('apiKeys');
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey.claude,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          messages: [{ role: 'user', content: message.payload.prompt }],
        }),
      });
      const data = await response.json();
      sendResponse({ success: true, data });
    })();
    return true; // Required for async sendResponse
  }
});
```

### 4.7 CSS Isolation Strategy

**Decision: Shadow DOM + Emotion (via Chakra UI)**

**Why:**
- Emotion (CSS-in-JS) works perfectly in Shadow DOM
- No global style conflicts
- No need for Tailwind prefix configuration
- Dynamic theming support built-in

**For custom styles:**
```typescript
// Inject custom CSS into shadow root
import customStyles from './custom.css?inline';

const styleEl = document.createElement('style');
styleEl.textContent = customStyles;
shadowRoot.appendChild(styleEl);
```

---

## 5. Technology Stack Summary

### Final Stack:

| Category | Technology | Reason |
|----------|-----------|--------|
| **Build Tool** | Vite + @crxjs/vite-plugin | Native Chrome extension support, HMR, zero config |
| **UI Framework** | React 18 + TypeScript 5 | Type safety, component reusability, familiar to most |
| **UI Components** | Chakra UI | Shadow DOM compatible, beginner friendly, complete |
| **Markdown** | react-markdown | Secure (React elements), beginner friendly, LLM-optimized |
| **Testing** | Vitest + React Testing Library | Vite-native, fast, Jest-compatible API |
| **Storage** | Chrome Storage API + TypeScript wrapper | Built-in, type-safe, quota-aware |
| **State** | React hooks + Chrome Storage listeners | Simple, effective, no heavy libraries |
| **API Calls** | Background service worker | Secure, CORS-free, privileged access |
| **CSS** | Shadow DOM + Emotion (Chakra) | Complete isolation, no conflicts |

### Dependencies:

**Core:**
```bash
npm install react react-dom
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
npm install react-markdown react-syntax-highlighter
npm install @anthropic-ai/sdk @google/generative-ai
```

**Development:**
```bash
npm install -D typescript @types/react @types/react-dom @types/chrome
npm install -D vite @vitejs/plugin-react @crxjs/vite-plugin
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @types/react-syntax-highlighter
```

---

## 6. Key Architectural Decisions

### 6.1 Content Script Injection
- **Mount Point**: Shadow DOM attached to `document.body`
- **Style Isolation**: Shadow DOM + Chakra UI (Emotion CSS-in-JS)
- **Positioning**: Fixed positioning with viewport-relative coordinates
- **Z-Index**: High value (9999) to overlay host content

### 6.2 State Synchronization
- **Storage Layer**: Chrome Storage API as single source of truth
- **Content Script**: Listens to storage changes for real-time updates
- **Options Page**: Direct storage read/write
- **Background Worker**: Mediates API calls, stores results

### 6.3 Message Flow
```
User selects text
  → Content script creates chat room
  → Stores in Chrome Storage
  → User sends message
  → Content script sends to background worker
  → Background worker calls LLM API
  → Background worker sends response to content script
  → Content script updates UI and storage
```

### 6.4 Performance Optimizations
- Lazy load chat rooms (render only visible ones)
- Debounce storage writes
- Use React.memo for message components
- Virtualize long message lists if needed
- Cache API responses in storage

---

## 7. Learning Resources

**For Backend Developers New to Frontend:**

1. **React Basics**:
   - Official React docs: https://react.dev/learn
   - Focus on: Components, Hooks (useState, useEffect), Props

2. **TypeScript with React**:
   - React TypeScript Cheatsheet: https://react-typescript-cheatsheet.netlify.app/

3. **Chrome Extensions**:
   - Official Chrome Extension docs: https://developer.chrome.com/docs/extensions/
   - Manifest V3 migration guide: https://developer.chrome.com/docs/extensions/develop/migrate

4. **Testing**:
   - Vitest docs: https://vitest.dev/
   - React Testing Library: https://testing-library.com/docs/react-testing-library/intro/

5. **Chakra UI**:
   - Component docs: https://chakra-ui.com/docs/components

---

## Conclusion

All technical clarifications have been resolved. The chosen stack prioritizes:
1. **Low learning curve** (backend developer friendly)
2. **Security** (XSS prevention, CSP compliance)
3. **Developer experience** (fast builds, HMR, type safety)
4. **Production readiness** (proven libraries, active maintenance)

Ready to proceed to Phase 1: Data Model and Contracts design.
