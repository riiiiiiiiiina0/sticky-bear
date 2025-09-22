const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

let notes = {};
const debouncedSaveNotes = debounce(() => saveNotes(), 300);
let stickyNotesContainer = null;

const initializeStickyNotesContainer = () => {
  if (!stickyNotesContainer) {
    stickyNotesContainer = document.createElement('div');
    stickyNotesContainer.classList.add('sticky-notes-container');
    document.body.appendChild(stickyNotesContainer);
  }
};

const loadNotes = () => {
  initializeStickyNotesContainer();
  chrome.storage.local.get('notes', (data) => {
    if (data.notes) {
      notes = data.notes;
      renderNotes();
    }
  });
};

const renderNotes = () => {
  initializeStickyNotesContainer();
  const existingNotes = document.querySelectorAll('.sticky-note');
  existingNotes.forEach((note) => note.remove());

  for (const id in notes) {
    createNoteElement(id, notes[id]);
  }
};

const createNoteElement = (id, note) => {
  const noteElement = document.createElement('div');
  noteElement.classList.add('sticky-note');
  noteElement.setAttribute('data-id', id);
  noteElement.style.left = note.left;
  noteElement.style.top = note.top;
  noteElement.style.zIndex = note.zIndex || 1; // Default z-index

  noteElement.addEventListener('mousedown', () => {
    bringToFront(id);
  });

  const noteHeader = document.createElement('div');
  noteHeader.classList.add('sticky-note-header');

  const deleteButton = document.createElement('button');
  deleteButton.classList.add('delete-note');
  deleteButton.innerHTML = '&times;';
  deleteButton.addEventListener('click', () => deleteNote(id));

  noteHeader.appendChild(deleteButton);

  const noteContent = document.createElement('div');
  noteContent.classList.add('sticky-note-content');
  noteContent.setAttribute('contenteditable', 'true');
  noteContent.innerText = note.content;
  noteContent.addEventListener('input', (e) =>
    updateNoteContent(id, /** @type {HTMLDivElement} */ (e.target).innerText),
  );

  noteElement.appendChild(noteHeader);
  noteElement.appendChild(noteContent);
  initializeStickyNotesContainer();
  stickyNotesContainer.appendChild(noteElement);

  makeDraggable(noteElement);
};

const bringToFront = (id) => {
  const noteElements = document.querySelectorAll('.sticky-note');
  let maxZ = 0;
  noteElements.forEach((el) => {
    // zIndex can be 'auto', so we parse it and default to 0 if it's not a number.
    const z =
      parseInt(/** @type {HTMLDivElement} */ (el).style.zIndex, 10) || 0;
    if (z > maxZ) {
      maxZ = z;
    }
  });

  const newZIndex = maxZ + 1;

  if (notes[id]) {
    notes[id].zIndex = newZIndex;
    const noteElement = /** @type {HTMLDivElement} */ (
      document.querySelector(`.sticky-note[data-id='${id}']`)
    );
    if (noteElement) {
      noteElement.style.zIndex = newZIndex.toString();
    }
    debouncedSaveNotes();
  }
};

const makeDraggable = (element) => {
  let pos1 = 0,
    pos2 = 0,
    pos3 = 0,
    pos4 = 0;
  const header = element.querySelector('.sticky-note-header');

  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    element.style.top = element.offsetTop - pos2 + 'px';
    element.style.left = element.offsetLeft - pos1 + 'px';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    const id = element.getAttribute('data-id');
    if (notes[id]) {
      notes[id].left = element.style.left;
      notes[id].top = element.style.top;
      debouncedSaveNotes();
    }
  }
};

const updateNoteContent = (id, content) => {
  if (notes[id]) {
    notes[id].content = content;
    debouncedSaveNotes();
  }
};

const deleteNote = (id) => {
  delete notes[id];
  saveNotes();
  const noteElement = document.querySelector(`.sticky-note[data-id='${id}']`);
  if (noteElement) {
    noteElement.remove();
  }
};

const saveNotes = () => {
  chrome.storage.local.set({ notes });
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'focus_note') {
    const noteElement = document.querySelector(
      `.sticky-note[data-id='${message.id}']`,
    );
    if (noteElement) {
      /** @type {HTMLDivElement} */ (
        noteElement.querySelector('.sticky-note-content')
      ).focus();
    }
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.notes) {
    const oldNotes = changes.notes.oldValue || {};
    const newNotes = changes.notes.newValue || {};
    notes = newNotes; // Keep local notes object in sync

    // Handle deleted notes
    for (const id in oldNotes) {
      if (!newNotes[id]) {
        const noteElement = document.querySelector(
          `.sticky-note[data-id='${id}']`,
        );
        if (noteElement) {
          noteElement.remove();
        }
      }
    }

    // Handle added or updated notes
    for (const id in newNotes) {
      const noteData = newNotes[id];
      let noteElement = /** @type {HTMLDivElement} */ (
        document.querySelector(`.sticky-note[data-id='${id}']`)
      );

      if (!noteElement) {
        // Note was added
        initializeStickyNotesContainer();
        createNoteElement(id, noteData);
      } else {
        // Note was updated, update position and z-index
        noteElement.style.left = noteData.left;
        noteElement.style.top = noteData.top;
        noteElement.style.zIndex = noteData.zIndex || 1;

        // Update content only if the element is not focused
        const contentElement = /** @type {HTMLDivElement} */ (
          noteElement.querySelector('.sticky-note-content')
        );
        if (document.activeElement !== contentElement) {
          if (contentElement.innerText !== noteData.content) {
            contentElement.innerText = noteData.content;
          }
        }
      }
    }
  }
});

loadNotes();
