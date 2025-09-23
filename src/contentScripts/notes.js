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
let isDragging = false;
let lastEditTimestamp = {}; // Track last edit time for each note
let isActivelyEditing = {}; // Track which notes are being actively edited

// === Device Pixel Ratio (DPR) handling ===
const localDpr = window.devicePixelRatio;
let unifiedDpr = localDpr; // Will be updated from background script

// Report current DPR to background (debounced for resize)
const reportDpr = () => {
  chrome.runtime.sendMessage({
    action: 'device_pixel_ratio',
    dpr: window.devicePixelRatio,
  });
};

// Debounce resize DPR reports
window.addEventListener('resize', debounce(reportDpr, 300));
// Initial report
reportDpr();

// Apply scale to the sticky notes container so that logical sizes match unified DPR
const applyContainerScale = () => {
  if (!stickyNotesContainer) return;
  const scale = unifiedDpr / window.devicePixelRatio;
  stickyNotesContainer.style.transformOrigin = '0 0';
  stickyNotesContainer.style.transform = `scale(${scale})`;
};

// Listen for DPR updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'update_dpr' && typeof message.dpr === 'number') {
    unifiedDpr = message.dpr;
    applyContainerScale();
  }
});

// Ensure scale is applied once the container exists
const initializeStickyNotesContainer = () => {
  if (!stickyNotesContainer) {
    stickyNotesContainer = document.createElement('div');
    stickyNotesContainer.classList.add('sticky-notes-container');
    document.body.appendChild(stickyNotesContainer);
    // Apply scaling based on unified DPR when container is first created
    applyContainerScale();
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
  noteElement.style.width = note.width || '200px';
  noteElement.style.height = note.height || '200px';
  noteElement.style.zIndex = note.zIndex || 1; // Default z-index

  // Set minimized state
  if (note.minimized) {
    noteElement.classList.add('minimized');
  }

  noteElement.addEventListener('mousedown', () => {
    bringToFront(id);
  });

  const noteHeader = document.createElement('div');
  noteHeader.classList.add('sticky-note-header');

  // Add double-click handler for minimize/maximize
  noteHeader.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleMinimize(id);
  });

  const headerText = document.createElement('span');
  headerText.classList.add('header-text');
  headerText.innerText =
    note.content.substring(0, 30) + (note.content.length > 30 ? '...' : '');

  const deleteButton = document.createElement('button');
  deleteButton.classList.add('delete-note');
  deleteButton.innerHTML = '&times;';
  deleteButton.addEventListener('click', () => deleteNote(id));

  noteHeader.appendChild(headerText);
  noteHeader.appendChild(deleteButton);

  const noteContent = document.createElement('div');
  noteContent.classList.add('sticky-note-content');
  noteContent.setAttribute('contenteditable', 'true');
  noteContent.innerText = note.content;
  noteContent.addEventListener('input', (e) => {
    const content = /** @type {HTMLDivElement} */ (e.target).innerText;
    lastEditTimestamp[id] = Date.now();
    isActivelyEditing[id] = true;
    updateNoteContent(id, content);

    // Clear the actively editing flag after a short delay
    setTimeout(() => {
      isActivelyEditing[id] = false;
    }, 1000);
  });

  // Prevent keyboard events from bubbling to the page
  noteContent.addEventListener('keydown', (e) => {
    e.stopPropagation();
  });

  noteContent.addEventListener('keyup', (e) => {
    e.stopPropagation();
  });

  noteContent.addEventListener('keypress', (e) => {
    e.stopPropagation();
  });

  // Maintain focus when clicking inside the content area
  noteContent.addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  noteContent.addEventListener('click', (e) => {
    e.stopPropagation();
    // Ensure the content area gets focus when clicked
    noteContent.focus();
  });

  // Prevent focus loss when interacting with the content
  noteContent.addEventListener('blur', (e) => {
    // Small delay to check if focus moved to another part of the same note
    setTimeout(() => {
      const activeElement = document.activeElement;
      if (activeElement && !noteElement.contains(activeElement)) {
        // Focus moved outside the note, this is expected behavior
        return;
      }
    }, 10);
  });

  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');

  noteElement.appendChild(noteHeader);
  noteElement.appendChild(noteContent);
  noteElement.appendChild(resizeHandle);
  initializeStickyNotesContainer();
  stickyNotesContainer.appendChild(noteElement);

  makeDraggable(noteElement);
  makeResizable(noteElement, resizeHandle);
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
    isDragging = true;
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
    isDragging = false;
    const id = element.getAttribute('data-id');
    if (notes[id]) {
      notes[id].left = element.style.left;
      notes[id].top = element.style.top;
      debouncedSaveNotes();
    }
  }
};

const makeResizable = (element, resizeHandle) => {
  let isResizing = false;
  let startX, startY, startWidth, startHeight;

  resizeHandle.onmousedown = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering the note's mousedown event
    isResizing = true;
    isDragging = true; // Prevent storage updates during resize
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(window.getComputedStyle(element).width, 10);
    startHeight = parseInt(window.getComputedStyle(element).height, 10);

    document.onmousemove = doResize;
    document.onmouseup = stopResize;
  };

  function doResize(e) {
    if (!isResizing) return;

    const newWidth = startWidth + e.clientX - startX;
    const newHeight = startHeight + e.clientY - startY;

    // Set minimum dimensions
    const minWidth = 150;
    const minHeight = 100;

    if (newWidth >= minWidth) {
      element.style.width = newWidth + 'px';
    }
    if (newHeight >= minHeight) {
      element.style.height = newHeight + 'px';
    }
  }

  function stopResize() {
    if (!isResizing) return;

    isResizing = false;
    isDragging = false;
    document.onmousemove = null;
    document.onmouseup = null;

    // Save the new dimensions
    const id = element.getAttribute('data-id');
    if (notes[id]) {
      notes[id].width = element.style.width;
      notes[id].height = element.style.height;
      debouncedSaveNotes();
    }
  }
};

const toggleMinimize = (id) => {
  const noteElement = document.querySelector(`.sticky-note[data-id='${id}']`);
  if (!noteElement || !notes[id]) return;

  const isMinimized = noteElement.classList.contains('minimized');

  if (isMinimized) {
    // Expand the note
    noteElement.classList.remove('minimized');
    notes[id].minimized = false;
  } else {
    // Minimize the note
    noteElement.classList.add('minimized');
    notes[id].minimized = true;

    // Update header text with current content
    const headerText = /** @type {HTMLSpanElement} */ (
      noteElement.querySelector('.header-text')
    );
    const content = notes[id].content || '';
    headerText.innerText =
      content.substring(0, 30) + (content.length > 30 ? '...' : '');
  }

  debouncedSaveNotes();
};

const updateNoteContent = (id, content) => {
  if (notes[id]) {
    notes[id].content = content;
    notes[id].lastEditTimestamp = lastEditTimestamp[id] || Date.now();

    // Update header text if note is minimized
    const noteElement = document.querySelector(`.sticky-note[data-id='${id}']`);
    if (noteElement && noteElement.classList.contains('minimized')) {
      const headerText = /** @type {HTMLSpanElement} */ (
        noteElement.querySelector('.header-text')
      );
      if (headerText) {
        headerText.innerText =
          content.substring(0, 30) + (content.length > 30 ? '...' : '');
      }
    }

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
        // Note was updated, update position and z-index only if not currently dragging
        if (!isDragging) {
          noteElement.style.left = noteData.left;
          noteElement.style.top = noteData.top;
          noteElement.style.width = noteData.width || '200px';
          noteElement.style.height = noteData.height || '200px';
        }
        noteElement.style.zIndex = noteData.zIndex || 1;

        // Update minimized state
        if (noteData.minimized) {
          if (!noteElement.classList.contains('minimized')) {
            noteElement.classList.add('minimized');
            // Update header text
            const headerText = /** @type {HTMLSpanElement} */ (
              noteElement.querySelector('.header-text')
            );
            if (headerText) {
              const content = noteData.content || '';
              headerText.innerText =
                content.substring(0, 30) + (content.length > 30 ? '...' : '');
            }
          }
        } else {
          noteElement.classList.remove('minimized');
        }

        // Update content only if this page is not actively editing the note
        const contentElement = /** @type {HTMLDivElement} */ (
          noteElement.querySelector('.sticky-note-content')
        );

        // Check if we should update the content
        const shouldUpdate =
          !isActivelyEditing[id] &&
          (document.activeElement !== contentElement ||
            (noteData.lastEditTimestamp &&
              noteData.lastEditTimestamp > (lastEditTimestamp[id] || 0)));

        if (shouldUpdate && contentElement.innerText !== noteData.content) {
          // Store cursor position if element is focused
          let cursorPosition = 0;
          const wasFocused = document.activeElement === contentElement;
          if (wasFocused) {
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              cursorPosition = range.startOffset;
            }
          }

          contentElement.innerText = noteData.content;
          lastEditTimestamp[id] = noteData.lastEditTimestamp || Date.now();

          // Restore cursor position if element was focused
          if (wasFocused) {
            contentElement.focus();
            const range = document.createRange();
            const textNode = contentElement.firstChild;
            if (textNode && textNode.textContent) {
              const maxOffset = Math.min(
                cursorPosition,
                textNode.textContent.length,
              );
              range.setStart(textNode, maxOffset);
              range.setEnd(textNode, maxOffset);
              const selection = window.getSelection();
              if (selection) {
                selection.removeAllRanges();
                selection.addRange(range);
              }
            }
          }
        }
      }
    }
  }
});

// Function to blur all focused sticky notes and clear editing flags
const blurAllStickyNotes = () => {
  const focusedContents = document.querySelectorAll(
    '.sticky-note-content:focus',
  );
  focusedContents.forEach((content) => {
    /** @type {HTMLDivElement} */ (content).blur();
  });

  // Clear actively editing flags for all notes
  for (const id in isActivelyEditing) {
    isActivelyEditing[id] = false;
  }
};

// Blur all focused sticky notes when page becomes invisible
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Page is now hidden (user switched tabs, minimized window, etc.)
    blurAllStickyNotes();
  }
});

// Additional safeguard for window blur events
window.addEventListener('blur', () => {
  blurAllStickyNotes();
});

loadNotes();
