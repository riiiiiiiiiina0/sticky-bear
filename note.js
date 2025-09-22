const noteTextarea = document.getElementById('note');
let noteId;

function init() {
  const urlParams = new URLSearchParams(window.location.search);
  noteId = urlParams.get('noteId');

  if (noteId) {
      // Load content from storage
      chrome.storage.sync.get(noteId, (items) => {
          if(items[noteId]) {
              noteTextarea.value = items[noteId];
          }
      });

      noteTextarea.addEventListener('input', () => {
        chrome.runtime.sendMessage({
          action: 'saveNote',
          noteId: noteId,
          content: noteTextarea.value
        });
      });
  } else {
      console.error("Note ID not found in URL");
  }
}

init();
