// noteManager.js - Module for creating and managing individual note elements

import {
  getShadowRoot,
  getStickyNotesContainer,
  initializeStickyNotesContainer,
} from './dom.js';
import {
  getNotes,
  updateNoteContent,
  setLastEditTimestamp,
  setActivelyEditing,
  debouncedSaveNotes,
  isNoteActivelyEditing,
  getLastEditTimestamp,
} from './storage.js';
import {
  createNoteHeader,
  createResizeHandle,
  bringToFront,
  clearAllNoteElements,
  updateHeaderText,
  clearHeaderText,
} from './ui.js';
import {
  createNoteContent,
  showRendered,
  setupNoteContentEvents,
} from './rendering.js';
import {
  applyEdgePosition,
  makeDraggable,
  makeResizable,
} from './positioning.js';
import {
  toggleMinimize,
  expandNoteToContent,
  handleDeleteNote,
  focusNote,
} from './events.js';
import {
  applyLiquidGlassEffect,
  updateLiquidGlassOnResize,
} from './liquidGlass.js';

// Create a complete note element
export const createNoteElement = (id, note) => {
  // console.log('createNoteElement called with ID:', id, 'note:', note);

  const shadowRoot = getShadowRoot();
  const stickyNotesContainer = getStickyNotesContainer();

  if (!shadowRoot) {
    console.error('❌ shadowRoot is null, cannot create note element');
    return;
  }

  if (!stickyNotesContainer) {
    console.error(
      '❌ stickyNotesContainer is null, cannot create note element',
    );
    return;
  }

  const noteElement = document.createElement('div');
  noteElement.classList.add('sticky-note');
  noteElement.classList.add(`color-${note.backgroundColor || 'yellow'}`);
  noteElement.setAttribute('data-id', id);

  // console.log(
  //   'Note element created with classes:',
  //   noteElement.classList.toString(),
  // );

  // Apply edge-based positioning
  applyEdgePosition(noteElement, note);

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

  // Create note header
  const noteHeader = createNoteHeader(
    id,
    note,
    toggleMinimize,
    expandNoteToContent,
    handleDeleteNote,
  );

  // Create note content with editor and rendered views
  const { noteContent, editor, rendered } = createNoteContent(
    id,
    note,
    (noteId, content) => {
      // Handle content changes - update header if minimized
      const noteElement = shadowRoot.querySelector(
        `.sticky-note[data-id='${noteId}']`,
      );
      if (noteElement && noteElement.classList.contains('minimized')) {
        updateHeaderText(noteElement, content);
      }
    },
  );

  // Create resize handle
  const resizeHandle = createResizeHandle();

  // Assemble the note
  noteElement.appendChild(noteHeader);
  noteElement.appendChild(noteContent);
  noteElement.appendChild(resizeHandle);

  // Setup content events for view switching
  setupNoteContentEvents(
    noteElement,
    noteContent,
    editor,
    rendered,
    noteHeader,
  );

  // Add to container
  initializeStickyNotesContainer();
  stickyNotesContainer.appendChild(noteElement);

  // Make draggable and resizable
  makeDraggable(noteElement);
  makeResizable(noteElement, resizeHandle);

  // Ensure the note is ready for focusing
  // Delay to allow contenteditable to be fully initialized with all event listeners
  setTimeout(() => {
    // Mark this note as ready for focus
    noteElement.setAttribute('data-ready', 'true');

    // If this note has a pending auto-focus, execute it now
    if (noteElement.hasAttribute('data-pending-focus')) {
      noteElement.removeAttribute('data-pending-focus');
      setTimeout(() => focusNote(id), 10);
    }
  }, 100);

  // Initial state: show rendered if editor is not focused
  // Note: document.activeElement won't work with shadow DOM, so we'll default to rendered view
  showRendered(editor, rendered);

  // Apply liquid glass effect
  applyLiquidGlassEffect(noteElement, note.backgroundColor || 'yellow');

  // console.log('✅ createNoteElement completed successfully for ID:', id);
};

// Render all notes
export const renderNotes = () => {
  initializeStickyNotesContainer();
  clearAllNoteElements();

  const notes = getNotes();
  for (const id in notes) {
    createNoteElement(id, notes[id]);
  }
};

// Update existing note element from data changes
export const updateNoteElement = (id, noteData, oldNoteData = {}) => {
  const shadowRoot = getShadowRoot();
  let noteElement = /** @type {HTMLDivElement} */ (
    shadowRoot.querySelector(`.sticky-note[data-id='${id}']`)
  );

  if (!noteElement) {
    // Note was added - create new element
    // console.log('Creating new note element for ID:', id);
    createNoteElement(id, noteData);

    // Auto-focus newly created notes
    setTimeout(() => {
      const newNoteElement = shadowRoot.querySelector(
        `.sticky-note[data-id='${id}']`,
      );
      if (newNoteElement && newNoteElement.hasAttribute('data-ready')) {
        setTimeout(() => focusNote(id), 10);
      } else if (newNoteElement) {
        newNoteElement.setAttribute('data-pending-focus', 'true');
      }
    }, 50);
    return;
  }

  // Note was updated - apply changes
  // Update position and dimensions
  applyEdgePosition(noteElement, noteData);
  noteElement.style.width = noteData.width || '200px';
  noteElement.style.height = noteData.height || '200px';
  noteElement.style.zIndex = noteData.zIndex || 1;

  // Update minimized state
  if (noteData.minimized) {
    if (!noteElement.classList.contains('minimized')) {
      noteElement.classList.add('minimized');
      updateHeaderText(noteElement, noteData.content || '');
    }
  } else {
    noteElement.classList.remove('minimized');
    clearHeaderText(noteElement);
  }

  // Update background color if changed
  const currentColorClass = Array.from(noteElement.classList).find((cls) =>
    cls.startsWith('color-'),
  );
  const expectedColorClass = `color-${noteData.backgroundColor || 'yellow'}`;

  if (currentColorClass !== expectedColorClass) {
    // Remove all color classes
    noteElement.classList.remove(
      'color-yellow',
      'color-green',
      'color-blue',
      'color-red',
      'color-gray',
    );
    // Add the new color class
    noteElement.classList.add(expectedColorClass);

    // Update the dropdown button color
    const button = /** @type {HTMLButtonElement} */ (
      noteElement.querySelector('.color-dropdown-button')
    );
    if (button) {
      const colors = {
        yellow: '#ffff99',
        green: '#90ee90',
        blue: '#99ccff',
        red: '#ff9999',
        gray: '#cccccc',
      };
      button.style.backgroundColor =
        colors[noteData.backgroundColor || 'yellow'];
    }

    // Update selected option in dropdown
    const options = noteElement.querySelectorAll('.color-option');
    options.forEach((option) => {
      const optionElement = /** @type {HTMLDivElement} */ (option);
      optionElement.classList.remove('selected');
      if (optionElement.title === (noteData.backgroundColor || 'yellow')) {
        optionElement.classList.add('selected');
      }
    });

    // Apply liquid glass effect with new color
    applyLiquidGlassEffect(noteElement, noteData.backgroundColor || 'yellow');
  }

  // Update content if needed (avoid conflicts with active editing)
  const editor = noteElement.querySelector('.sticky-note-editor');
  const shouldUpdate =
    !isNoteActivelyEditing(id) &&
    noteData.lastEditTimestamp &&
    noteData.lastEditTimestamp > (getLastEditTimestamp(id) || 0);

  if (shouldUpdate && editor && editor.textContent !== noteData.content) {
    const wasFocused = document.activeElement === editor;
    let selectionOffset = 0;
    if (wasFocused) {
      const selection = window.getSelection();
      if (selection && selection.anchorNode) {
        selectionOffset = selection.anchorOffset;
      }
    }
    editor.textContent = noteData.content || '';
    setLastEditTimestamp(id, noteData.lastEditTimestamp || Date.now());
    if (wasFocused) {
      // Restore cursor to end
      const range = document.createRange();
      range.selectNodeContents(editor);
      range.collapse(false);
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }
};
