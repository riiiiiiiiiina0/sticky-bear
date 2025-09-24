// ui.js - Module for note element creation and UI components

import { HEROICONS, COLORS, COLOR_MAP } from './constants.js';
import { getFirstLineForHeader } from './utils.js';
import {
  getShadowRoot,
  getStickyNotesContainer,
  initializeStickyNotesContainer,
} from './dom.js';
import { getNotes, updateNoteContent, debouncedSaveNotes } from './storage.js';

// Create color dropdown component
export const createColorDropdown = (noteId, currentColor) => {
  const dropdown = document.createElement('div');
  dropdown.classList.add('color-dropdown');

  const button = document.createElement('button');
  button.classList.add('color-dropdown-button');
  button.style.backgroundColor =
    COLORS.find((c) => c.name === currentColor)?.color || '#ffff99';
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = dropdown.querySelector('.color-dropdown-menu');
    if (menu) {
      menu.classList.toggle('show');
    }
  });

  const menu = document.createElement('div');
  menu.classList.add('color-dropdown-menu');

  COLORS.forEach((colorInfo) => {
    const option = document.createElement('div');
    option.classList.add('color-option');
    option.style.backgroundColor = colorInfo.color;
    option.title = colorInfo.name;

    if (colorInfo.name === currentColor) {
      option.classList.add('selected');
    }

    option.addEventListener('click', (e) => {
      e.stopPropagation();
      changeNoteColor(noteId, colorInfo.name);
      menu.classList.remove('show');
    });

    menu.appendChild(option);
  });

  dropdown.appendChild(button);
  dropdown.appendChild(menu);

  return dropdown;
};

// Change note color
export const changeNoteColor = (noteId, newColor) => {
  const notes = getNotes();
  if (!notes[noteId]) return;

  // Update the note data
  notes[noteId].backgroundColor = newColor;

  // Update the note element classes
  const shadowRoot = getShadowRoot();
  const noteElement = shadowRoot.querySelector(
    `.sticky-note[data-id='${noteId}']`,
  );
  if (noteElement) {
    // Remove all color classes
    noteElement.classList.remove(
      'color-yellow',
      'color-green',
      'color-blue',
      'color-red',
      'color-gray',
    );
    // Add the new color class
    noteElement.classList.add(`color-${newColor}`);

    // Update the dropdown button color
    const button = /** @type {HTMLButtonElement} */ (
      noteElement.querySelector('.color-dropdown-button')
    );
    if (button) {
      button.style.backgroundColor = COLOR_MAP[newColor];
    }

    // Update selected option in dropdown
    const options = noteElement.querySelectorAll('.color-option');
    options.forEach((option) => {
      const optionElement = /** @type {HTMLDivElement} */ (option);
      optionElement.classList.remove('selected');
      if (optionElement.title === newColor) {
        optionElement.classList.add('selected');
      }
    });
  }

  // Save the changes
  debouncedSaveNotes();
};

// Create note header
export const createNoteHeader = (id, note, onMinimize, onExpand, onDelete) => {
  const noteHeader = document.createElement('div');
  noteHeader.classList.add('sticky-note-header');

  // Add double-click handler for minimize/maximize
  noteHeader.addEventListener('dblclick', (e) => {
    e.preventDefault();
    e.stopPropagation();
    onMinimize(id);
  });

  const headerText = document.createElement('span');
  headerText.classList.add('header-text');
  // Start with empty content - only show when minimized
  headerText.innerText = '';

  // If note starts minimized, initialize header text with content preview
  if (note.minimized) {
    const content = note.content || '';
    headerText.innerText = getFirstLineForHeader(content);
  }

  // Create color dropdown
  const colorDropdown = createColorDropdown(
    id,
    note.backgroundColor || 'yellow',
  );

  const expandButton = document.createElement('button');
  expandButton.classList.add('expand-note', 'sticky-note-header-button');
  expandButton.innerHTML = HEROICONS.expand;
  expandButton.addEventListener('click', () => onExpand(id));

  const deleteButton = document.createElement('button');
  deleteButton.classList.add('delete-note', 'sticky-note-header-button');
  deleteButton.innerHTML = HEROICONS.close;
  deleteButton.addEventListener('click', () => onDelete(id));

  noteHeader.appendChild(headerText);
  noteHeader.appendChild(colorDropdown);
  noteHeader.appendChild(expandButton);
  noteHeader.appendChild(deleteButton);

  return noteHeader;
};

// Create resize handle
export const createResizeHandle = () => {
  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');
  return resizeHandle;
};

// Update header text for minimized notes
export const updateHeaderText = (noteElement, content) => {
  if (noteElement && noteElement.classList.contains('minimized')) {
    const headerText = /** @type {HTMLSpanElement} */ (
      noteElement.querySelector('.header-text')
    );
    if (headerText) {
      headerText.innerText = getFirstLineForHeader(content);
    }
  }
};

// Clear header text for expanded notes
export const clearHeaderText = (noteElement) => {
  const headerText = /** @type {HTMLSpanElement} */ (
    noteElement.querySelector('.header-text')
  );
  if (headerText) {
    headerText.innerText = '';
  }
};

// Bring note to front (z-index management)
export const bringToFront = (id) => {
  const shadowRoot = getShadowRoot();
  const notes = getNotes();
  const noteElements = shadowRoot.querySelectorAll('.sticky-note');
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
      shadowRoot.querySelector(`.sticky-note[data-id='${id}']`)
    );
    if (noteElement) {
      noteElement.style.zIndex = newZIndex.toString();
    }
    debouncedSaveNotes();
  }
};

// Remove note element from DOM
export const removeNoteElement = (id) => {
  const shadowRoot = getShadowRoot();
  const noteElement = shadowRoot.querySelector(`.sticky-note[data-id='${id}']`);
  if (noteElement) {
    noteElement.remove();
  }
};

// Clear all note elements from DOM
export const clearAllNoteElements = () => {
  const shadowRoot = getShadowRoot();
  const existingNotes = shadowRoot.querySelectorAll('.sticky-note');
  existingNotes.forEach((note) => note.remove());
};
