// storage.js - Module for note data management and synchronization

import { debounce } from './utils.js';

let notes = {};
let lastEditTimestamp = {}; // Track last edit time for each note
let isActivelyEditing = {}; // Track which notes are being actively edited

// Debounced save function
export const debouncedSaveNotes = debounce(() => saveNotes(), 300);

// Get current notes
export const getNotes = () => notes;

// Set notes data
export const setNotes = (newNotes) => {
  notes = newNotes;
};

// Get last edit timestamp for a note
export const getLastEditTimestamp = (id) => lastEditTimestamp[id];

// Set last edit timestamp for a note
export const setLastEditTimestamp = (id, timestamp) => {
  lastEditTimestamp[id] = timestamp;
};

// Check if a note is being actively edited
export const isNoteActivelyEditing = (id) => isActivelyEditing[id];

// Set actively editing status for a note
export const setActivelyEditing = (id, status) => {
  isActivelyEditing[id] = status;
};

// Clear editing data for a note
export const clearEditingData = (id) => {
  delete lastEditTimestamp[id];
  delete isActivelyEditing[id];
};

// Update note content
export const updateNoteContent = (id, content) => {
  if (notes[id]) {
    notes[id].content = content;
    notes[id].lastEditTimestamp = lastEditTimestamp[id] || Date.now();
    debouncedSaveNotes();
  }
};

// Delete a note
export const deleteNote = (id) => {
  delete notes[id];
  clearEditingData(id);
  saveNotes();
};

// Save notes to storage
export const saveNotes = () => {
  chrome.storage.sync.set({ notes });
};

// Load notes from storage
export const loadNotes = () => {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get('notes', (data) => {
        if (chrome.runtime.lastError) {
          console.error(
            'Error loading notes from storage:',
            chrome.runtime.lastError,
          );
          reject(chrome.runtime.lastError);
          return;
        }

        if (data.notes) {
          notes = data.notes;
          console.log('Loaded', Object.keys(notes).length, 'sticky notes');
          resolve(notes);
        } else {
          console.log('No existing sticky notes found');
          resolve({});
        }
      });
    } catch (error) {
      console.error('Error in loadNotes:', error);
      reject(error);
    }
  });
};
