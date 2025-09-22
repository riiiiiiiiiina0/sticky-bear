const WINDOW_ID_TO_NOTE_ID_MAP_KEY = 'windowIdToNoteIdMap';

async function getWindowIdMap() {
    const result = await chrome.storage.session.get(WINDOW_ID_TO_NOTE_ID_MAP_KEY);
    return result[WINDOW_ID_TO_NOTE_ID_MAP_KEY] || {};
}

async function setWindowIdMap(map) {
    await chrome.storage.session.set({ [WINDOW_ID_TO_NOTE_ID_MAP_KEY]: map });
}

async function createNoteWindow(noteId) {
  const url = `note.html?noteId=${noteId}`;
  const win = await chrome.windows.create({
    url: url,
    type: 'popup',
    width: 300,
    height: 300
  });
  // Set the window to be always on top after creation
  await chrome.windows.update(win.id, { alwaysOnTop: true });

  const map = await getWindowIdMap();
  map[win.id] = noteId;
  await setWindowIdMap(map);
}

// On action click, create a new note
chrome.action.onClicked.addListener(() => {
  const noteId = Date.now().toString();
  chrome.storage.sync.set({ [noteId]: '' }, () => {
      createNoteWindow(noteId);
  });
});

// On window close, remove the note
chrome.windows.onRemoved.addListener(async (windowId) => {
  const map = await getWindowIdMap();
  const noteId = map[windowId];
  if (noteId) {
    await chrome.storage.sync.remove(noteId);
    delete map[windowId];
    await setWindowIdMap(map);
  }
});

async function restoreNotes() {
    // Clear the session map on restore, as all window IDs will be new
    await setWindowIdMap({});
    const items = await chrome.storage.sync.get(null);
    for (const noteId in items) {
      await createNoteWindow(noteId);
    }
}

// On startup, restore notes
chrome.runtime.onStartup.addListener(restoreNotes);
// On install, also restore notes
chrome.runtime.onInstalled.addListener(restoreNotes);

// Listener for saving notes from note.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'saveNote') {
    chrome.storage.sync.set({ [message.noteId]: message.content });
  }
});
