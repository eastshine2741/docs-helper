import type { ChatRoom } from '../types/chatRoom';
import type { UserSettings } from '../types/userSettings';
import { DEFAULT_SYSTEM_PROMPT } from '../types/userSettings';

// Type-safe Chrome Storage wrapper
export class Storage {
  // Get user settings
  static async getUserSettings(): Promise<UserSettings> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get('userSettings', (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const defaultSettings: UserSettings = {
          apiKeys: {},
          systemPrompt: DEFAULT_SYSTEM_PROMPT,
          updatedAt: Date.now(),
        };

        const settings: UserSettings = result.userSettings
          ? (result.userSettings as UserSettings)
          : defaultSettings;

        resolve(settings);
      });
    });
  }

  // Save user settings
  static async saveUserSettings(settings: UserSettings): Promise<void> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ userSettings: settings }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });
  }

  // Get chat rooms for a page URL
  static async getChatRooms(pageUrl: string): Promise<ChatRoom[]> {
    const key = `chatRooms_${pageUrl}`;
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        const chatRooms: ChatRoom[] = result[key]
          ? (result[key] as ChatRoom[])
          : [];
        resolve(chatRooms);
      });
    });
  }

  // Save chat rooms for a page URL
  static async saveChatRooms(pageUrl: string, chatRooms: ChatRoom[]): Promise<void> {
    const key = `chatRooms_${pageUrl}`;
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [key]: chatRooms }, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });
  }

  // Delete a specific chat room
  static async deleteChatRoom(pageUrl: string, chatRoomId: string): Promise<void> {
    const chatRooms = await this.getChatRooms(pageUrl);
    const filtered = chatRooms.filter(room => room.id !== chatRoomId);
    await this.saveChatRooms(pageUrl, filtered);
  }

  // Check storage quota
  static async checkQuota(): Promise<{ used: number; quota: number; percentUsed: number }> {
    return new Promise((resolve, reject) => {
      chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        // Chrome storage quota is typically ~10MB
        const quota = 10 * 1024 * 1024;
        const percentUsed = (bytesInUse / quota) * 100;

        resolve({
          used: bytesInUse,
          quota,
          percentUsed,
        });
      });
    });
  }
}
