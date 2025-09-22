const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

let notes = {};
const debouncedSaveNotes = debounce(() => saveNotes(), 300);

const loadNotes = () => {
  chrome.storage.local.get("notes", (data) => {
    if (data.notes) {
      notes = data.notes;
      renderNotes();
    }
  });
};

const renderNotes = () => {
  const existingNotes = document.querySelectorAll(".sticky-note");
  existingNotes.forEach(note => note.remove());

  for (const id in notes) {
    createNoteElement(id, notes[id]);
  }
};

const createNoteElement = (id, note) => {
  const noteElement = document.createElement("div");
  noteElement.classList.add("sticky-note");
  noteElement.setAttribute("data-id", id);
  noteElement.style.left = note.left;
  noteElement.style.top = note.top;

  const noteHeader = document.createElement("div");
  noteHeader.classList.add("sticky-note-header");

  const deleteButton = document.createElement("button");
  deleteButton.classList.add("delete-note");
  deleteButton.innerHTML = "&times;";
  deleteButton.addEventListener("click", () => deleteNote(id));

  noteHeader.appendChild(deleteButton);

  const noteContent = document.createElement("div");
  noteContent.classList.add("sticky-note-content");
  noteContent.setAttribute("contenteditable", "true");
  noteContent.innerText = note.content;
  noteContent.addEventListener("input", (e) => updateNoteContent(id, e.target.innerText));

  noteElement.appendChild(noteHeader);
  noteElement.appendChild(noteContent);
  document.body.appendChild(noteElement);

  makeDraggable(noteElement);
};

const makeDraggable = (element) => {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  const header = element.querySelector(".sticky-note-header");

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
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    const id = element.getAttribute("data-id");
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
  if (message.action === "focus_note") {
    const noteElement = document.querySelector(`.sticky-note[data-id='${message.id}']`);
    if (noteElement) {
      noteElement.querySelector('.sticky-note-content').focus();
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
        const noteElement = document.querySelector(`.sticky-note[data-id='${id}']`);
        if (noteElement) {
          noteElement.remove();
        }
      }
    }

    // Handle added or updated notes
    for (const id in newNotes) {
      const noteData = newNotes[id];
      let noteElement = document.querySelector(`.sticky-note[data-id='${id}']`);

      if (!noteElement) {
        // Note was added
        createNoteElement(id, noteData);
      } else {
        // Note was updated, update position
        noteElement.style.left = noteData.left;
        noteElement.style.top = noteData.top;

        // Update content only if the element is not focused
        const contentElement = noteElement.querySelector('.sticky-note-content');
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
