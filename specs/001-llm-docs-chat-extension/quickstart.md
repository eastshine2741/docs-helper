# DocsHelper Developer Quickstart

**Feature**: DocsHelper - LLM-Powered Documentation Assistant
**Audience**: Backend developers new to TypeScript/React/Chrome extensions
**Date**: 2025-12-24

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Key Concepts for Backend Developers](#key-concepts-for-backend-developers)
6. [Testing Guide](#testing-guide)
7. [Debugging Tips](#debugging-tips)
8. [Common Pitfalls](#common-pitfalls)

---

## Prerequisites

### Required Software

```bash
# Node.js 18+ (check version)
node --version  # Should be >= 18.0.0

# npm 9+ (check version)
npm --version  # Should be >= 9.0.0

# Git
git --version
```

### Recommended VSCode Extensions

- **ESLint**: Syntax checking
- **Prettier**: Code formatting
- **TypeScript**: Language support
- **Chrome Extension Tools**: Extension debugging

---

## Project Setup

### 1. Clone and Install

```bash
# Navigate to project directory
cd C:\Users\ehddu\CursorProjects\DocsChat

# Install dependencies
npm install
```

### 2. Configure Environment

Create `.env` file (not tracked in git):
```bash
# .env
# These are for development/testing only
# Real API keys stored in extension options page
VITE_CLAUDE_API_KEY=sk-ant-your-key-here
VITE_GEMINI_API_KEY=your-gemini-key-here
```

**Important**: API keys in `.env` are for testing only. Production keys are stored securely in Chrome Storage by users.

### 3. Install Dependencies

```bash
# Core dependencies
npm install react react-dom
npm install @chakra-ui/react @emotion/react @emotion/styled framer-motion
npm install react-markdown react-syntax-highlighter
npm install @anthropic-ai/sdk @google/generative-ai

# Development dependencies
npm install -D typescript @types/react @types/react-dom @types/chrome
npm install -D vite @vitejs/plugin-react @crxjs/vite-plugin
npm install -D vitest @vitest/ui jsdom
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D @types/react-syntax-highlighter
npm install -D eslint prettier
```

### 4. Verify Setup

```bash
# Type checking
npm run type-check

# Run tests
npm test

# Build extension
npm run build
```

---

## Project Structure

```
DocsChat/
├── src/
│   ├── content/              # Injected into web pages
│   │   ├── index.tsx         # Entry point: Shadow DOM setup
│   │   ├── App.tsx           # Main React app
│   │   ├── components/       # UI components
│   │   │   ├── ChatRoom/
│   │   │   ├── MessageList/
│   │   │   ├── TextHighlight/
│   │   │   └── StartChatButton/
│   │   ├── services/         # Business logic
│   │   │   ├── selectionManager.ts
│   │   │   ├── chatRoomManager.ts
│   │   │   ├── storageService.ts
│   │   │   └── messagingService.ts
│   │   └── hooks/            # React hooks
│   │       ├── useChatRooms.ts
│   │       ├── useTextSelection.ts
│   │       └── useLLMRequest.ts
│   │
│   ├── background/           # Background service worker
│   │   ├── index.ts          # Entry point
│   │   ├── messageHandler.ts # Message routing
│   │   └── services/
│   │       ├── llmFactory.ts
│   │       ├── claudeService.ts
│   │       └── geminiService.ts
│   │
│   ├── options/              # Options page
│   │   ├── index.html
│   │   ├── index.tsx
│   │   └── components/
│   │       ├── ApiKeySettings/
│   │       └── PromptSettings/
│   │
│   ├── shared/               # Shared utilities
│   │   ├── types/            # TypeScript types
│   │   │   ├── chatRoom.ts
│   │   │   ├── message.ts
│   │   │   ├── messaging.ts
│   │   │   └── llm.ts
│   │   ├── utils/
│   │   │   ├── storage.ts
│   │   │   └── xpath.ts
│   │   └── constants/
│   │       └── llmProviders.ts
│   │
│   └── manifest.json         # Chrome extension manifest
│
├── public/
│   └── icons/                # Extension icons
│
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── mocks/                # Test mocks
│
├── specs/                    # Feature specifications (this folder)
│   └── 001-llm-docs-chat-extension/
│       ├── spec.md
│       ├── plan.md
│       ├── research.md
│       ├── data-model.md
│       ├── quickstart.md     # This file
│       └── contracts/
│
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
├── vitest.config.ts          # Vitest configuration
└── package.json              # Dependencies
```

---

## Development Workflow

### Daily Development

```bash
# 1. Start development server (with HMR)
npm run dev

# 2. Load extension in Chrome
# - Open chrome://extensions/
# - Enable "Developer mode"
# - Click "Load unpacked"
# - Select dist/ folder

# 3. Make changes to source code
# - Vite auto-reloads on file changes
# - Reload extension in Chrome (click reload icon)

# 4. Run tests
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Visual test UI
```

### Build for Production

```bash
# Build optimized extension
npm run build

# Output in dist/ folder
# - manifest.json
# - content script bundle
# - background worker bundle
# - options page bundle
```

---

## Key Concepts for Backend Developers

### 1. Chrome Extension Architecture

Think of it like microservices:

```
Content Script        ←→  Background Worker  ←→  Options Page
(UI in web pages)         (API calls, logic)      (Settings UI)
     ↓                           ↓
Chrome Storage API        Chrome Storage API
```

**Key Differences from Backend:**
- No traditional HTTP server
- Communication via message passing (like event-driven architecture)
- Isolated contexts (like containers)
- Chrome Storage instead of database

### 2. React Components (Similar to Templates)

**Backend (Template):**
```python
def render_user(user):
    return f"<div>Hello {user.name}</div>"
```

**Frontend (React):**
```typescript
function UserGreeting({ user }: { user: User }) {
  return <div>Hello {user.name}</div>;
}
```

**Key Concepts:**
- Components are functions that return UI
- Props are like function parameters
- State is like instance variables
- Hooks are like lifecycle methods

### 3. TypeScript (Enhanced JavaScript)

**If you know Python/Java:**
```typescript
// TypeScript is like typed Python
interface User {          // Similar to dataclass
  name: string;
  age: number;
}

function greet(user: User): string {  // Type hints
  return `Hello ${user.name}`;
}

// Async/await (same as Python)
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${id}`);
  return response.json();
}
```

### 4. Promises vs Callbacks

**Backend (Synchronous):**
```python
user = db.get_user(123)
process_user(user)
```

**Frontend (Asynchronous):**
```typescript
// Old way (callbacks)
getUserFromStorage(123, (user) => {
  processUser(user);
});

// Modern way (async/await - like Python)
const user = await getUserFromStorage(123);
processUser(user);
```

### 5. Message Passing (Like RPC)

**Backend (Direct function call):**
```python
result = some_service.do_something(data)
```

**Chrome Extension (Message passing):**
```typescript
// Content script → Background worker
const result = await chrome.runtime.sendMessage({
  type: 'DO_SOMETHING',
  payload: data
});

// Background worker (handler)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'DO_SOMETHING') {
    const result = doSomething(message.payload);
    sendResponse(result);
  }
});
```

---

## Testing Guide

### Unit Tests (Like Backend Tests)

**Backend (Python):**
```python
def test_calculate_total():
    assert calculate_total([1, 2, 3]) == 6
```

**Frontend (Vitest):**
```typescript
import { describe, it, expect } from 'vitest';

describe('calculateTotal', () => {
  it('should sum numbers', () => {
    expect(calculateTotal([1, 2, 3])).toBe(6);
  });
});
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react';
import { ChatRoom } from './ChatRoom';

describe('ChatRoom', () => {
  it('should render message', () => {
    render(<ChatRoom message="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Mocking Chrome APIs

```typescript
import { vi } from 'vitest';

// Mock Chrome Storage
global.chrome = {
  storage: {
    local: {
      get: vi.fn((keys, callback) => {
        callback({ userSettings: { apiKey: 'test' } });
      }),
      set: vi.fn(),
    },
  },
} as any;

// Use in test
await chrome.storage.local.get('userSettings');
expect(chrome.storage.local.get).toHaveBeenCalled();
```

### Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- chatRoom.test.ts

# Watch mode (re-run on changes)
npm run test:watch

# Coverage report
npm run test:coverage

# Visual UI
npm run test:ui
```

---

## Debugging Tips

### 1. Chrome DevTools

**Content Script:**
- Right-click on page → "Inspect"
- Find content script in Sources tab
- Set breakpoints, inspect variables

**Background Worker:**
- Go to chrome://extensions/
- Click "Service worker" under your extension
- Opens DevTools for background worker

**Options Page:**
- Right-click on options page → "Inspect"

### 2. Console Logging

```typescript
// Add detailed logs
console.log('ChatRoom state:', chatRoom);
console.table(messages); // Pretty table format
console.group('API Request');
console.log('Request:', request);
console.log('Response:', response);
console.groupEnd();
```

### 3. React DevTools

- Install React DevTools Chrome extension
- Inspect component tree
- View props and state
- Track re-renders

### 4. Network Inspection

```typescript
// Log all fetch requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  console.log('Fetch:', args[0]);
  const response = await originalFetch(...args);
  console.log('Response:', response.status);
  return response;
};
```

### 5. Storage Inspection

```typescript
// View all storage
chrome.storage.local.get(null, (items) => {
  console.log('All storage:', items);
});

// In DevTools Console
chrome.storage.local.get(null, console.log);
```

---

## Common Pitfalls

### 1. Async/Await in Message Handlers

**❌ Wrong:**
```typescript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  asyncFunction().then(sendResponse);
  // Returns undefined - callback already executed
});
```

**✅ Correct:**
```typescript
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  asyncFunction().then(sendResponse);
  return true; // Keep channel open for async response
});
```

### 2. React State Updates

**❌ Wrong:**
```typescript
const [count, setCount] = useState(0);
setCount(count + 1);
setCount(count + 1);  // Still 1, not 2!
```

**✅ Correct:**
```typescript
setCount(prev => prev + 1);
setCount(prev => prev + 1);  // Now it's 2
```

### 3. Shadow DOM CSS

**❌ Wrong:**
```css
/* styles.css - Won't work in shadow DOM */
body { background: blue; }
```

**✅ Correct:**
```typescript
// Inject styles into shadow root
const styles = document.createElement('style');
styles.textContent = `
  :host { /* shadow host styles */ }
  div { background: blue; }
`;
shadowRoot.appendChild(styles);
```

### 4. Chrome Storage Quota

**❌ Wrong:**
```typescript
// Saving huge data without checks
await chrome.storage.local.set({ hugeData: veryLargeArray });
// Quota exceeded!
```

**✅ Correct:**
```typescript
// Check quota first
const bytesInUse = await chrome.storage.local.getBytesInUse();
const QUOTA = 10 * 1024 * 1024; // 10MB

if (bytesInUse > QUOTA * 0.8) {
  await cleanupOldData();
}
await chrome.storage.local.set({ data });
```

### 5. CORS in Content Scripts

**❌ Wrong:**
```typescript
// Content script - Subject to CORS
await fetch('https://api.example.com/data');
// CORS error!
```

**✅ Correct:**
```typescript
// Send to background worker
const response = await chrome.runtime.sendMessage({
  type: 'API_REQUEST',
  payload: { url: 'https://api.example.com/data' }
});
```

---

## Quick Reference

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run type-check       # TypeScript checking

# Testing
npm test                 # Run tests once
npm run test:watch       # Watch mode
npm run test:ui          # Visual test runner
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # ESLint
npm run format           # Prettier
```

### Keyboard Shortcuts (VSCode)

- `Ctrl + Space`: Autocomplete
- `F12`: Go to definition
- `Shift + F12`: Find references
- `Ctrl + .`: Quick fix
- `F2`: Rename symbol

### Chrome Extension Shortcuts

- `chrome://extensions/`: Extension management
- `Ctrl + Shift + J`: Open console
- `Ctrl + Shift + I`: Open DevTools

---

## Next Steps

1. **Read the spec**: `specs/001-llm-docs-chat-extension/spec.md`
2. **Review contracts**: `specs/001-llm-docs-chat-extension/contracts/`
3. **Start coding**: Begin with shared types, then services, then components
4. **Write tests**: Test as you go (TDD encouraged)
5. **Iterate**: Build → Test → Debug → Refine

---

## Getting Help

### Documentation Links

- **React**: https://react.dev/learn
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Chrome Extensions**: https://developer.chrome.com/docs/extensions/
- **Vitest**: https://vitest.dev/
- **Chakra UI**: https://chakra-ui.com/

### Common Questions

**Q: How do I debug TypeScript errors?**
A: Read error messages carefully, use VSCode's inline errors (red squiggles), hover for details.

**Q: Why isn't my component re-rendering?**
A: Check if you're mutating state directly. Always create new objects/arrays with spread operator.

**Q: How do I pass data between components?**
A: Props (parent → child) or Context (global state) or Chrome Storage (persistent).

**Q: Extension not loading?**
A: Check manifest.json, build output, Chrome extension errors in chrome://extensions/.

---

## Summary

You're now ready to start development! Key takeaways:

1. ✅ Chrome extensions are like microservices
2. ✅ React components are like templates
3. ✅ TypeScript adds type safety (like typed Python)
4. ✅ Use async/await for asynchronous operations
5. ✅ Test as you go with Vitest
6. ✅ Debug with Chrome DevTools

Happy coding! 🚀
