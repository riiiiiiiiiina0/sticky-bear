// badge.js - Module for handling badge count management

// Function to update the action badge with the current note count
export const updateBadge = () => {
  chrome.storage.sync.get({ notes: {}, showBadgeCount: true }, (data) => {
    if (chrome.runtime.lastError) {
      console.error(
        'Error reading notes for badge update:',
        chrome.runtime.lastError,
      );
      return;
    }

    const notes = data.notes;
    const showBadgeCount = data.showBadgeCount;
    const noteCount = Object.keys(notes).length;

    // Set badge text based on setting - show count if enabled and > 0, otherwise show nothing
    const badgeText =
      showBadgeCount && noteCount > 0 ? noteCount.toString() : '';
    chrome.action.setBadgeText({ text: badgeText });

    // Set badge background color to a nice blue
    chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });

    // console.log(
    //   `Badge updated: ${noteCount} notes, showing: ${showBadgeCount}`,
    // );
  });
};

// Initialize badge update listeners
export const initializeBadgeListeners = () => {
  // Update badge when extension starts up
  chrome.runtime.onStartup.addListener(() => {
    updateBadge();
  });

  // Update badge whenever notes storage changes or badge setting changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes.notes || changes.showBadgeCount)) {
      updateBadge();
    }
  });
};
