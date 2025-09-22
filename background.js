chrome.action.onClicked.addListener(() => {
  const newNoteId = Date.now().toString();
  const newNote = {
    content: "New note",
    left: "100px",
    top: "100px",
  };

  // Get all tabs and send the message to each of them
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      // We can't send messages to chrome:// URLs, so we need to check
      if (tab.url && !tab.url.startsWith("chrome://")) {
        chrome.tabs.sendMessage(tab.id, {
          action: "create_note",
          id: newNoteId,
          note: newNote,
        }, (response) => {
          // This callback is used to avoid an error message in the console
          // about an unhandled response.
          if (chrome.runtime.lastError) {
            // Ignore errors, which can happen if the content script isn't injected yet
          }
        });
      }
    });
  });
});
