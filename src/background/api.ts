/**
 * API utilities for background service worker
 * This file provides helper functions for the background worker
 */

import type { BackgroundToContentMessage } from '../shared/types/messaging';

/**
 * Send a message from background to content script
 * (For future use if needed for broadcasts)
 */
export async function sendToContentScript(
  tabId: number,
  message: BackgroundToContentMessage
): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (error) {
    console.error('Error sending message to content script:', error);
    throw error;
  }
}

/**
 * Broadcast a message to all tabs
 * (For future use if needed)
 */
export async function broadcast(message: BackgroundToContentMessage): Promise<void> {
  const tabs = await chrome.tabs.query({});

  await Promise.all(
    tabs.map(tab =>
      tab.id ? sendToContentScript(tab.id, message).catch(() => {
        // Ignore errors for tabs that don't have content script
      }) : Promise.resolve()
    )
  );
}

/**
 * Get active tab
 */
export async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}
