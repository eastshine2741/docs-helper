# Chrome Storage API Contract

**Feature**: DocsHelper Chrome Extension
**Purpose**: Define Chrome Storage API usage patterns and schema
**Date**: 2025-12-24

---

## Overview

DocsHelper uses `chrome.storage.local` for all data persistence. This contract defines:
- Storage schema
- Access patterns
- Validation rules
- Quota management
- Type-safe wrapper API

---

## Storage Schema

### Storage Keys

```typescript
interface StorageKeys {
  // User settings (singleton)
  'userSettings': UserSettings;

  // Chat rooms per page URL
  [`chatRooms_${string}`]: ChatRoom[]; // Key format: chatRooms_https://example.com/docs
}
```

### Data Structures

**UserSettings:**
```typescript
interface UserSettings {
  apiKeys: {
    claude?: string;
    gemini?: string;
  };
  systemPrompt: string;
  defaultModel: 'claude' | 'gemini';
  updatedAt: number; // Unix timestamp
}
```

**ChatRoom[] (per page):**
```typescript
interface ChatRoom {
  id: string;
  xpath: string;
  model: 'claude' | 'gemini';
  textIndices?: { start: number; end: number };
  pageUrl: string;
  selectedText: string;
  messages: Message[];
  state: 'expanded' | 'collapsed';
  isLoading: boolean;
  createdAt: number;
  updatedAt: number;
  position: { vertical: number };
}

interface Message {
  id: string;
  chatRoomId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
```

---

## Storage API Wrapper

### TypedStorage Class

**Implementation:**
```typescript
// shared/utils/storage.ts

type StorageKey = 'userSettings' | `chatRooms_${string}`;

class TypedStorage {
  /**
   * Get value from storage
   */
  async get<K extends StorageKey>(
    key: K
  ): Promise<K extends 'userSettings' ? UserSettings : ChatRoom[] | undefined> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(result[key]);
        }
      });
    });
  }

  /**
   * Set value in storage
   */
  async set<K extends StorageKey>(
    key: K,
    value: K extends 'userSettings' ? UserSettings : ChatRoom[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Remove value from storage
   */
  async remove(key: StorageKey): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(key, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Get storage usage info
   */
  async getBytesInUse(keys?: StorageKey | StorageKey[]): Promise<number> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.getBytesInUse(keys || null, (bytes) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(bytes);
        }
      });
    });
  }

  /**
   * Listen for storage changes
   */
  onChange(
    callback: (changes: chrome.storage.StorageChange, areaName: string) => void
  ): () => void {
    chrome.storage.onChanged.addListener(callback);
    return () => chrome.storage.onChanged.removeListener(callback);
  }
}

export const storage = new TypedStorage();
```

---

## Access Patterns

### 1. User Settings

**Read:**
```typescript
const settings = await storage.get('userSettings');
if (!settings) {
  // First-time user, return defaults
  return {
    apiKeys: {},
    systemPrompt: 'You are a helpful assistant explaining documentation.',
    defaultModel: 'claude',
    updatedAt: Date.now()
  };
}
```

**Write:**
```typescript
await storage.set('userSettings', {
  apiKeys: { claude: 'sk-ant-xxx' },
  systemPrompt: 'Custom prompt',
  defaultModel: 'claude',
  updatedAt: Date.now()
});
```

**Update (partial):**
```typescript
const current = await storage.get('userSettings') || getDefaultSettings();
await storage.set('userSettings', {
  ...current,
  systemPrompt: 'New prompt',
  updatedAt: Date.now()
});
```

---

### 2. Chat Rooms

**Read all for current page:**
```typescript
const pageUrl = window.location.href;
const chatRooms = await storage.get(`chatRooms_${pageUrl}`) || [];
```

**Add new chat room:**
```typescript
const pageUrl = window.location.href;
const chatRooms = await storage.get(`chatRooms_${pageUrl}`) || [];

const newRoom: ChatRoom = {
  id: generateId(),
  xpath: '//div[@id="content"]',
  model: 'claude',
  pageUrl,
  selectedText: 'Selected text',
  messages: [],
  state: 'expanded',
  isLoading: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  position: { vertical: 100 }
};

chatRooms.push(newRoom);
await storage.set(`chatRooms_${pageUrl}`, chatRooms);
```

**Update existing chat room:**
```typescript
const pageUrl = window.location.href;
const chatRooms = await storage.get(`chatRooms_${pageUrl}`) || [];

const index = chatRooms.findIndex(room => room.id === roomId);
if (index !== -1) {
  chatRooms[index] = {
    ...chatRooms[index],
    messages: [...chatRooms[index].messages, newMessage],
    updatedAt: Date.now()
  };
  await storage.set(`chatRooms_${pageUrl}`, chatRooms);
}
```

**Delete chat room:**
```typescript
const pageUrl = window.location.href;
const chatRooms = await storage.get(`chatRooms_${pageUrl}`) || [];

const filtered = chatRooms.filter(room => room.id !== roomId);
await storage.set(`chatRooms_${pageUrl}`, filtered);
```

---

### 3. Storage Change Listeners

**Listen for settings changes (options page):**
```typescript
const unsubscribe = storage.onChange((changes, areaName) => {
  if (areaName === 'local' && changes.userSettings) {
    const newSettings = changes.userSettings.newValue as UserSettings;
    console.log('Settings updated:', newSettings);
    // Update UI or state
  }
});

// Cleanup
unsubscribe();
```

**Listen for chat room changes (content script):**
```typescript
const pageUrl = window.location.href;
const unsubscribe = storage.onChange((changes, areaName) => {
  if (areaName === 'local' && changes[`chatRooms_${pageUrl}`]) {
    const newRooms = changes[`chatRooms_${pageUrl}`].newValue as ChatRoom[];
    console.log('Chat rooms updated:', newRooms);
    // Re-render UI
  }
});
```

---

## React Hook Integration

### useStorage Hook

```typescript
// hooks/useStorage.ts
import { useState, useEffect } from 'react';
import { storage } from '@/shared/utils/storage';

export function useStorage<K extends StorageKey>(
  key: K,
  defaultValue: K extends 'userSettings' ? UserSettings : ChatRoom[]
) {
  type ValueType = K extends 'userSettings' ? UserSettings : ChatRoom[];

  const [value, setValue] = useState<ValueType>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Initial load
    storage.get(key)
      .then((stored) => {
        setValue((stored as ValueType) || defaultValue);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });

    // Listen for changes
    const unsubscribe = storage.onChange((changes, areaName) => {
      if (areaName === 'local' && changes[key]) {
        setValue(changes[key].newValue as ValueType);
      }
    });

    return unsubscribe;
  }, [key]);

  const updateValue = async (newValue: ValueType | ((prev: ValueType) => ValueType)) => {
    try {
      const valueToSet = typeof newValue === 'function'
        ? (newValue as (prev: ValueType) => ValueType)(value)
        : newValue;

      await storage.set(key, valueToSet as any);
      setValue(valueToSet);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return { value, loading, error, updateValue } as const;
}
```

**Usage:**
```typescript
function ChatRoomManager() {
  const pageUrl = window.location.href;
  const { value: chatRooms, loading, updateValue } = useStorage(
    `chatRooms_${pageUrl}`,
    []
  );

  const addChatRoom = (newRoom: ChatRoom) => {
    updateValue(rooms => [...rooms, newRoom]);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {chatRooms.map(room => (
        <ChatRoomComponent key={room.id} room={room} />
      ))}
    </div>
  );
}
```

---

## Quota Management

### Quota Limits

**Chrome Storage Local:**
- Total: ~10MB (QUOTA_BYTES)
- Per item: No specific limit, but total must be under 10MB

**Estimated Usage:**
- UserSettings: ~1KB
- ChatRoom (empty): ~0.5KB
- Message: ~2KB (average)
- ChatRoom with 10 messages: ~20KB

**Capacity Estimates:**
- ~500 chat rooms (empty)
- ~2,500 messages total
- ~250 chat rooms with 10 messages each

### Quota Monitoring

```typescript
async function getQuotaInfo() {
  const total = await storage.getBytesInUse();
  const QUOTA_BYTES = 10 * 1024 * 1024; // 10MB
  const percentUsed = (total / QUOTA_BYTES) * 100;

  return {
    bytesUsed: total,
    bytesAvailable: QUOTA_BYTES - total,
    percentUsed,
    isNearLimit: percentUsed > 80
  };
}
```

### Quota Enforcement

**Cleanup Strategy:**
```typescript
async function enforceQuotaLimits(pageUrl: string) {
  const chatRooms = await storage.get(`chatRooms_${pageUrl}`) || [];

  // Limit: 50 chat rooms per page
  if (chatRooms.length > 50) {
    const sorted = chatRooms.sort((a, b) => b.updatedAt - a.updatedAt);
    const kept = sorted.slice(0, 50);
    await storage.set(`chatRooms_${pageUrl}`, kept);
  }

  // Limit: 100 messages per chat room
  const cleaned = chatRooms.map(room => {
    if (room.messages.length > 100) {
      return {
        ...room,
        messages: room.messages.slice(-100) // Keep last 100
      };
    }
    return room;
  });

  await storage.set(`chatRooms_${pageUrl}`, cleaned);
}
```

**Delete Old Data:**
```typescript
async function deleteOldChatRooms(daysOld: number = 30) {
  const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

  // Get all storage keys
  const allKeys = await new Promise<string[]>((resolve) => {
    chrome.storage.local.get(null, (items) => {
      resolve(Object.keys(items));
    });
  });

  // Filter for chatRooms_ keys
  const roomKeys = allKeys.filter(key => key.startsWith('chatRooms_'));

  for (const key of roomKeys) {
    const rooms = await storage.get(key as `chatRooms_${string}`);
    if (!rooms) continue;

    const filtered = rooms.filter(room =>
      room.updatedAt > cutoff || room.messages.length > 0
    );

    if (filtered.length === 0) {
      await storage.remove(key as `chatRooms_${string}`);
    } else if (filtered.length !== rooms.length) {
      await storage.set(key as `chatRooms_${string}`, filtered);
    }
  }
}
```

---

## Validation Rules

### Validate Before Write

```typescript
function validateUserSettings(settings: UserSettings): void {
  if (!settings.apiKeys.claude && !settings.apiKeys.gemini) {
    throw new Error('At least one API key required');
  }

  if (settings.apiKeys.claude && !settings.apiKeys.claude.startsWith('sk-ant-')) {
    throw new Error('Invalid Claude API key format');
  }

  if (settings.systemPrompt.length > 2000) {
    throw new Error('System prompt too long (max 2000 chars)');
  }

  if (!['claude', 'gemini'].includes(settings.defaultModel)) {
    throw new Error('Invalid default model');
  }
}

function validateChatRoom(room: ChatRoom): void {
  if (!room.id || room.id.length === 0) {
    throw new Error('Chat room ID required');
  }

  if (!room.xpath.startsWith('//')) {
    throw new Error('Invalid XPATH format');
  }

  if (room.selectedText.length > 10000) {
    throw new Error('Selected text too long (max 10000 chars)');
  }

  if (room.messages.some(msg => msg.content.length > 100000)) {
    throw new Error('Message content too long (max 100000 chars)');
  }
}

// Usage
async function saveChatRooms(pageUrl: string, rooms: ChatRoom[]) {
  rooms.forEach(validateChatRoom);
  await storage.set(`chatRooms_${pageUrl}`, rooms);
}
```

---

## Error Handling

### Storage Errors

```typescript
enum StorageError {
  QUOTA_EXCEEDED = 'QuotaExceededError',
  INVALID_KEY = 'InvalidKeyError',
  RUNTIME_ERROR = 'RuntimeError',
}

async function safeSave<K extends StorageKey>(
  key: K,
  value: any
): Promise<{ success: boolean; error?: string }> {
  try {
    await storage.set(key, value);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('QUOTA_EXCEEDED')) {
        // Attempt cleanup and retry
        await deleteOldChatRooms(7); // Delete rooms older than 7 days
        try {
          await storage.set(key, value);
          return { success: true };
        } catch (retryError) {
          return {
            success: false,
            error: 'Storage quota exceeded even after cleanup'
          };
        }
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Unknown error' };
  }
}
```

---

## Testing

### Mock Chrome Storage

```typescript
// tests/mocks/storage.ts
import { vi } from 'vitest';

const mockStorage: Record<string, any> = {};

export const mockChromeStorage = {
  local: {
    get: vi.fn((keys: string | string[], callback) => {
      const result: Record<string, any> = {};
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => {
        if (key in mockStorage) {
          result[key] = mockStorage[key];
        }
      });
      callback?.(result);
      return Promise.resolve(result);
    }),
    set: vi.fn((items: Record<string, any>, callback) => {
      Object.assign(mockStorage, items);
      callback?.();
      return Promise.resolve();
    }),
    remove: vi.fn((keys: string | string[], callback) => {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      keyArray.forEach(key => delete mockStorage[key]);
      callback?.();
      return Promise.resolve();
    }),
    clear: vi.fn((callback) => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      callback?.();
      return Promise.resolve();
    }),
  },
  onChanged: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

global.chrome = {
  storage: mockChromeStorage,
  runtime: { lastError: null },
} as any;
```

### Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '@/shared/utils/storage';
import { mockChromeStorage } from './mocks/storage';

describe('Storage Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should save and retrieve user settings', async () => {
    const settings: UserSettings = {
      apiKeys: { claude: 'sk-ant-test' },
      systemPrompt: 'Test prompt',
      defaultModel: 'claude',
      updatedAt: Date.now(),
    };

    await storage.set('userSettings', settings);
    const retrieved = await storage.get('userSettings');

    expect(retrieved).toEqual(settings);
  });

  it('should save and retrieve chat rooms', async () => {
    const pageUrl = 'https://example.com';
    const chatRooms: ChatRoom[] = [{
      id: 'room-1',
      xpath: '//div',
      model: 'claude',
      pageUrl,
      selectedText: 'test',
      messages: [],
      state: 'expanded',
      isLoading: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: { vertical: 100 },
    }];

    await storage.set(`chatRooms_${pageUrl}`, chatRooms);
    const retrieved = await storage.get(`chatRooms_${pageUrl}`);

    expect(retrieved).toEqual(chatRooms);
  });
});
```

---

## Performance Considerations

### Batching Writes

```typescript
// Bad: Multiple writes in quick succession
for (const room of chatRooms) {
  room.updatedAt = Date.now();
  await storage.set(`chatRooms_${pageUrl}`, chatRooms);
}

// Good: Single write after all updates
chatRooms.forEach(room => {
  room.updatedAt = Date.now();
});
await storage.set(`chatRooms_${pageUrl}`, chatRooms);
```

### Debouncing Writes

```typescript
let writeTimer: number | null = null;

function debouncedSave(pageUrl: string, chatRooms: ChatRoom[]) {
  if (writeTimer) clearTimeout(writeTimer);

  writeTimer = setTimeout(() => {
    storage.set(`chatRooms_${pageUrl}`, chatRooms);
  }, 500) as unknown as number;
}
```

---

## Summary

This contract defines:
- ✅ Complete storage schema with TypeScript types
- ✅ Type-safe storage wrapper class
- ✅ All CRUD operations with validation
- ✅ React hook integration pattern
- ✅ Quota management and cleanup strategies
- ✅ Error handling patterns
- ✅ Testing mocks and examples
- ✅ Performance optimization strategies

Ready for implementation.
