chrome.action.onClicked.addListener((activeTab) => {
  const newNoteId = Date.now().toString();
  const newNote = {
    content: "New note",
    left: "100px",
    top: "100px",
  };

  // First, save the new note to storage. This is the source of truth.
  chrome.storage.local.get({ notes: {} }, (data) => {
    const notes = data.notes;
    notes[newNoteId] = newNote;
    chrome.storage.local.set({ notes }, () => {
      // After saving, send a message to the active tab to focus the new note.
      // The note element will be created by the onChanged listener in all tabs.
      if (activeTab.id) {
         chrome.tabs.sendMessage(activeTab.id, {
          action: "focus_note",
          id: newNoteId,
        }, (response) => {
          if (chrome.runtime.lastError) {
            // Ignore errors, e.g., if the content script isn't ready.
          }
        });
      }
    });
  });
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  }
});
