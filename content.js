let notes = {};

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
    notes[id].left = element.style.left;
    notes[id].top = element.style.top;
    saveNotes();
  }
};

const updateNoteContent = (id, content) => {
  notes[id].content = content;
  saveNotes();
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
  if (message.action === "create_note") {
    const { id, note } = message;
    notes[id] = note;
    createNoteElement(id, note);
    saveNotes();
    const newNoteElement = document.querySelector(`.sticky-note[data-id='${id}']`);
    if (newNoteElement) {
      newNoteElement.querySelector('.sticky-note-content').focus();
    }
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.notes) {
    notes = changes.notes.newValue;
    renderNotes();
  }
});

loadNotes();
