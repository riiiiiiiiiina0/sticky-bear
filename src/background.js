// Import modules
import { createNewNote, deleteFocusedNote } from './modules/notes.js';
import { updateBadge, initializeBadgeListeners } from './modules/badge.js';
import { handleDevicePixelRatio } from './modules/devicePixelRatio.js';

// Initialize badge listeners
initializeBadgeListeners();

chrome.action.onClicked.addListener((tab) => {
  // console.log('Extension icon clicked, creating new note for tab:', tab.id);
  createNewNote(tab);
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) return;

    switch (command) {
      case 'create-new-note':
        createNewNote(activeTab);
        break;
      case 'delete-focused-note':
        deleteFocusedNote(activeTab);
        break;
    }
  });
});

chrome.runtime.onInstalled.addListener((details) => {
  // Update badge on install/update
  updateBadge();

  if (details.reason === 'install' || details.reason === 'update') {
    (async () => {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.reload(tab.id);
        }
      }
    })();
  }
});

// Listen for DPR reports from content scripts and settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle device pixel ratio messages
  if (handleDevicePixelRatio(message, sender)) {
    return; // Message was handled by DPR module
  }

  // Handle badge setting update from options page
  if (message.action === 'update_badge_setting') {
    // console.log(
    //   'Badge setting updated from options page:',
    //   message.showBadgeCount,
    // );
    updateBadge();
  }
});
