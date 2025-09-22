chrome.action.onClicked.addListener((tab) => {
  const newNoteId = Date.now().toString();
  const newNote = {
    content: "New note",
    left: "100px",
    top: "100px",
  };

  chrome.tabs.sendMessage(tab.id, {
    action: "create_note",
    id: newNoteId,
    note: newNote,
  });
});
