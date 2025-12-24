# Data Model: DocsHelper Chrome Extension

**Feature**: DocsHelper - LLM-Powered Documentation Assistant
**Date**: 2025-12-24
**Purpose**: Define data structures, relationships, and validation rules

---

## Entity Definitions

### 1. ChatRoom

Represents a conversation anchored to a specific text selection on a webpage.

**TypeScript Definition:**
```typescript
interface ChatRoom {
  // Unique identifier
  id: string; // Format: `${xpath}_${model}_${pageUrl}_${timestamp}`

  // Identity components
  xpath: string; // XPATH of element or common ancestor
  model: LLMModelType; // 'claude' | 'gemini'
  textIndices?: { start: number; end: number }; // Optional: for single-element selections

  // Context
  pageUrl: string; // URL of the page where chat room was created
  selectedText: string; // The text that was selected (for display/context)

  // State
  messages: Message[]; // Conversation history
  state: ChatRoomState; // 'expanded' | 'collapsed'
  isLoading: boolean; // True when waiting for LLM response

  // Metadata
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
  position: { vertical: number }; // Vertical position in viewport (pixels from top)
}

type LLMModelType = 'claude' | 'gemini';
type ChatRoomState = 'expanded' | 'collapsed';
```

**Validation Rules:**
- `id` MUST be unique across all chat rooms
- `xpath` MUST be a valid XPATH expression
- `model` MUST be one of supported LLM providers
- `textIndices` is required only when selection is within single HTML element
- `messages` array MUST maintain chronological order
- `pageUrl` MUST match current page URL for chat room to be restored
- `selectedText` MUST not exceed 10,000 characters (storage optimization)
- `position.vertical` MUST be >= 0

**Relationships:**
- Has many `Message` (one-to-many)
- References one `LLMModel` (many-to-one)
- Associated with one `TextSelection` (one-to-one)

**State Transitions:**
```
collapsed → expanded: User clicks chat room
expanded → collapsed: User clicks outside chat room OR user clicks different chat room
expanded → expanded: No change when user interacts within same chat room
```

**Storage Key Pattern:**
```typescript
// Stored in Chrome Storage as:
`chatRoom_${pageUrl}_${id}` → ChatRoom
```

---

### 2. Message

Represents a single message in a conversation.

**TypeScript Definition:**
```typescript
interface Message {
  // Identity
  id: string; // Format: `msg_${timestamp}_${randomId}`
  chatRoomId: string; // Foreign key to ChatRoom

  // Content
  role: MessageRole; // 'user' | 'assistant'
  content: string; // Message text (markdown for assistant)

  // Metadata
  timestamp: number; // Unix timestamp
  
  // For assistant message
  isStreaming?: boolean; // True if currently receiving streamed response
  
  // For user message
  error?: string; // Error message if API call failed
  status?: 'sent' | 'success' | 'failed'; // Initially 'sent' on user message created, 'success' on LLM API success response received, 'failed' on LLM API response failed
}

type MessageRole = 'user' | 'assistant';
```

**Validation Rules:**
- `id` MUST be unique within a ChatRoom
- `chatRoomId` MUST reference an existing ChatRoom
- `role` MUST be 'user' or 'assistant'
- `content` MUST not be empty string
- `content` length MUST not exceed 100,000 characters
- `timestamp` MUST be in chronological order within a ChatRoom
- User and assistant messages SHOULD alternate (not enforced, but expected pattern)

**Relationships:**
- Belongs to one `ChatRoom` (many-to-one)

**Rendering:**
- `role: 'user'`: Rendered as plain text
- `role: 'assistant'`: Rendered as markdown with react-markdown

---

### 3. TextSelection

Represents a range of text selected by the user.

**TypeScript Definition:**
```typescript
interface TextSelection {
  // Location
  xpath: string; // XPATH of element or nearest common ancestor
  indices?: { start: number; end: number }; // Character offsets (optional)

  // Content
  selectedText: string; // The actual text selected
  pageUrl: string; // URL where selection occurred

  // Position
  boundingRect: DOMRect; // Selection bounding box for positioning
}

// DOMRect structure (from browser API)
interface DOMRect {
  top: number;
  right: number;
  bottom: number;
  left: number;
  width: number;
  height: number;
}
```

**Validation Rules:**
- `xpath` MUST be computable from DOM
- `indices` present only when selection within single element
- `selectedText` MUST not be empty
- `selectedText` length SHOULD be between 1 and 5,000 characters (UX constraint)
- `boundingRect` MUST have positive width and height
- `pageUrl` MUST match current page

**Relationships:**
- Creates one `ChatRoom` (one-to-one on creation)

**Lifecycle:**
- Created when user completes text selection
- Used to initialize ChatRoom
- Not persisted (ephemeral, only used during chat room creation)

**XPATH Calculation Rules:**
1. If selection within single element → Use element's XPATH + character indices
2. If selection spans multiple elements → Use nearest common ancestor's XPATH (no indices)
3. Prefer IDs in XPATH when available: `//div[@id="content"]` over `/html/body/div[3]`

---

### 4. LLMModel

Represents an available language model provider.

**TypeScript Definition:**
```typescript
interface LLMModel {
  // Identity
  type: LLMModelType; // 'claude' | 'gemini'
  name: string; // Display name

  // Configuration
  apiEndpoint: string; // API URL
  modelId: string; // Specific model version

  // Capabilities
  supportsStreaming: boolean;
  maxTokens: number;
  contextWindow: number;
}

// Predefined models
const LLM_MODELS: Record<LLMModelType, LLMModel> = {
  claude: {
    type: 'claude',
    name: 'Claude (Anthropic)',
    apiEndpoint: 'https://api.anthropic.com/v1/messages',
    modelId: 'claude-3-5-sonnet-20241022',
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 200000,
  },
  gemini: {
    type: 'gemini',
    name: 'Gemini (Google)',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    modelId: 'gemini-1.5-pro-latest',
    supportsStreaming: true,
    maxTokens: 8192,
    contextWindow: 1000000,
  },
};
```

**Validation Rules:**
- `type` MUST match one of the supported providers
- `apiEndpoint` MUST be valid HTTPS URL
- `modelId` MUST match provider's API specification
- `maxTokens` MUST be > 0
- `contextWindow` MUST be >= maxTokens

**Relationships:**
- Used by many `ChatRoom` (one-to-many)
- Associated with `UserSettings` for API keys

---

### 5. UserSettings

Represents user configuration.

**TypeScript Definition:**
```typescript
interface UserSettings {
  // API Keys
  apiKeys: {
    claude?: string; // Anthropic API key
    gemini?: string; // Google AI API key
  };

  // Customization
  systemPrompt: string; // Custom instructions for all LLM requests

  // UI Preferences
  theme?: 'light' | 'dark'; // Future: theme preference
  defaultModel?: LLMModelType; // Default model for new chat rooms

  // Metadata
  updatedAt: number; // Unix timestamp of last save
}
```

**Validation Rules:**
- `apiKeys.claude` MUST start with 'sk-ant-' if present
- `apiKeys.gemini` MUST be valid API key format if present
- At least one API key MUST be configured for extension to function
- `systemPrompt` length MUST not exceed 2,000 characters
- `systemPrompt` default: `"You are a helpful assistant explaining documentation. Be concise and clear."`

**Relationships:**
- Shared across all `ChatRoom` instances
- Referenced by `LLMModel` for API authentication

**Storage:**
```typescript
// Stored in Chrome Storage as:
'userSettings' → UserSettings
```

---

## Derived Types

### API Request/Response Types

**LLM API Request:**
```typescript
interface LLMRequest {
  model: string; // Model ID
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  system?: string; // System prompt from settings
  max_tokens: number;
  stream?: boolean;
}
```

**LLM API Response:**
```typescript
interface LLMResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: Array<{
    type: 'text';
    text: string;
  }>;
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
}
```

### Message Passing Types

**Inter-Component Messages:**
```typescript
type BackgroundMessage =
  | { type: 'API_REQUEST'; payload: { chatRoomId: string; prompt: string; model: LLMModelType } }
  | { type: 'API_RESPONSE'; payload: { chatRoomId: string; content: string } }
  | { type: 'API_ERROR'; payload: { chatRoomId: string; error: string } }
  | { type: 'STREAM_CHUNK'; payload: { chatRoomId: string; chunk: string } };

type ContentMessage =
  | { type: 'CHAT_CREATED'; payload: { chatRoomId: string } }
  | { type: 'MESSAGE_SENT'; payload: { chatRoomId: string; messageId: string } };
```

---

## Storage Schema

### Chrome Storage Layout

```typescript
interface StorageSchema {
  // User settings (singleton)
  userSettings: UserSettings;

  // Chat rooms (one entry per page URL)
  [key: `chatRooms_${pageUrl}`]: ChatRoom[];
}

// Example:
{
  "userSettings": {
    "apiKeys": { "claude": "sk-ant-xxx" },
    "systemPrompt": "Be concise",
    "updatedAt": 1735084800000
  },
  "chatRooms_https://docs.python.org/3/library/os.html": [
    {
      "id": "chat_001",
      "xpath": "//div[@id='module-os']",
      "model": "claude",
      "messages": [...],
      ...
    }
  ]
}
```

**Storage Optimization:**
- Group chat rooms by page URL to minimize storage reads
- Limit chat rooms per page to 50 (delete oldest if exceeded)
- Limit messages per chat room to 100 (delete oldest if exceeded)
- Archive old chat rooms (>30 days) to separate storage key

### Storage Quota Management

**Quotas:**
- `chrome.storage.local`: ~10MB typical
- Estimated usage: ~2KB per message, ~10KB per chat room
- Max capacity: ~1,000 chat rooms or ~5,000 messages

**Cleanup Strategy:**
1. Delete chat rooms with no messages older than 7 days
2. Delete chat rooms from pages not visited in 30 days
3. Limit to 50 chat rooms per page
4. Limit to 100 messages per chat room

---

## Indexes and Queries

### Common Query Patterns

**Get all chat rooms for current page:**
```typescript
const pageUrl = window.location.href;
const chatRooms = await storage.get(`chatRooms_${pageUrl}`);
```

**Find chat room by identifier:**
```typescript
const chatRoom = chatRooms.find(room =>
  room.xpath === xpath &&
  room.model === model &&
  JSON.stringify(room.textIndices) === JSON.stringify(textIndices)
);
```

**Get expanded chat room:**
```typescript
const expanded = chatRooms.find(room => room.state === 'expanded');
```

**Get recent chat rooms (for cleanup):**
```typescript
const recent = chatRooms
  .filter(room => room.messages.length > 0)
  .sort((a, b) => b.updatedAt - a.updatedAt)
  .slice(0, 50);
```

---

## Data Flow Diagrams

### Chat Room Creation Flow

```
1. User selects text
   ↓
2. selectionManager calculates TextSelection
   ↓
3. Check if ChatRoom with same identifier exists
   ├─ Yes: Load existing ChatRoom from storage
   ├─ No: Create new ChatRoom
   ↓
4. Save ChatRoom to storage (chatRooms_${pageUrl})
   ↓
5. Render ChatRoom UI in expanded state
```

### Message Send Flow

```
1. User types message and clicks send
   ↓
2. Create Message with role='user'
   ↓
3. Add Message to ChatRoom.messages
   ↓
4. Save ChatRoom to storage
   ↓
5. Send API_REQUEST to background worker
   ↓
6. Background worker calls LLM API
   ↓
7. Receive response chunks (streaming)
   ↓
8. For each chunk:
   ├─ Send STREAM_CHUNK to content script
   ├─ Append to assistant Message.content
   ├─ Update UI
   ↓
9. On completion:
   ├─ Create Message with role='assistant'
   ├─ Add to ChatRoom.messages
   ├─ Save ChatRoom to storage
```

### Chat Room Restoration Flow

```
1. Page loads
   ↓
2. Content script initializes
   ↓
3. Read chatRooms_${pageUrl} from storage
   ↓
4. For each ChatRoom:
   ├─ Verify XPATH still exists in DOM
   ├─ If yes: Render in collapsed state
   ├─ If no: Mark for deletion
   ↓
5. Delete invalid chat rooms from storage
```

---

## Validation Functions

### ChatRoom Validation

```typescript
function isValidChatRoom(room: ChatRoom): boolean {
  return (
    room.id.length > 0 &&
    room.xpath.startsWith('//') &&
    ['claude', 'gemini'].includes(room.model) &&
    room.selectedText.length > 0 &&
    room.selectedText.length <= 10000 &&
    room.pageUrl.startsWith('http') &&
    Array.isArray(room.messages) &&
    ['expanded', 'collapsed'].includes(room.state) &&
    room.createdAt > 0 &&
    room.position.vertical >= 0
  );
}
```

### Message Validation

```typescript
function isValidMessage(msg: Message): boolean {
  return (
    msg.id.startsWith('msg_') &&
    msg.chatRoomId.length > 0 &&
    ['user', 'assistant'].includes(msg.role) &&
    msg.content.length > 0 &&
    msg.content.length <= 100000 &&
    msg.timestamp > 0
  );
}
```

### UserSettings Validation

```typescript
function isValidUserSettings(settings: UserSettings): boolean {
  const hasClaudeKey = settings.apiKeys.claude?.startsWith('sk-ant-');
  const hasGeminiKey = settings.apiKeys.gemini && settings.apiKeys.gemini.length > 0;

  return (
    (hasClaudeKey || hasGeminiKey) && // At least one API key
    settings.systemPrompt.length > 0 &&
    settings.systemPrompt.length <= 2000 &&
    settings.updatedAt > 0
  );
}
```

---

## Summary

This data model provides:
1. **Type Safety**: All entities have TypeScript definitions
2. **Validation**: Clear rules for data integrity
3. **Relationships**: Explicit foreign key patterns
4. **Storage Optimization**: Grouped by page URL, quota-aware
5. **Query Patterns**: Common access patterns defined
6. **State Management**: Clear state transitions
7. **Extensibility**: Easy to add new LLM providers or fields

Ready for contract generation and implementation.
