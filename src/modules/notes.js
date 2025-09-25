// notes.js - Module for handling note creation and management

import { updateBadge } from './badge.js';

// Function to create a new note
export const createNewNote = async (activeTab) => {
  const newNoteId = Date.now().toString();

  // Create a note at a fixed initial position and bring it to front
  const createNoteWithPosition = () => {
    // console.log('Creating note at fixed initial position (20px, 20px)');

    chrome.storage.sync.get({ notes: {} }, (data) => {
      if (chrome.runtime.lastError) {
        console.error('Error reading from storage:', chrome.runtime.lastError);
        return;
      }

      const notes = data.notes;
      // console.log('Current notes in storage:', Object.keys(notes).length);
      // console.log('Existing notes data:', notes);

      // Compute z-index so the new note appears on top
      const maxZ = Object.values(notes).reduce((m, n) => {
        const z = n && n.zIndex !== undefined ? parseInt(n.zIndex, 10) : 0;
        return isNaN(z) ? m : Math.max(m, z);
      }, 0);
      const nextZ = maxZ + 1;

      const newNote = {
        content: '',
        left: '20px',
        top: '20px',
        right: null,
        edge: 'left',
        zIndex: nextZ,
      };

      notes[newNoteId] = newNote;
      // console.log(
      //   'About to save note with ID:',
      //   newNoteId,
      //   'Note data:',
      //   newNote,
      // );

      chrome.storage.sync.set({ notes }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving to storage:', chrome.runtime.lastError);
          return;
        }

        // console.log('Note saved successfully to storage');

        // Update badge count after creating a new note
        updateBadge();

        // After saving, send a message to the active tab to focus the new note.
        // The note element will be created by the onChanged listener in all tabs.
        if (activeTab && activeTab.id) {
          // console.log('Sending focus message to tab:', activeTab.id);
          chrome.tabs.sendMessage(
            activeTab.id,
            {
              action: 'focus_note',
              id: newNoteId,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                // Ignore errors, e.g., if the content script isn't ready.
                // console.log(
                //   'Content script not ready:',
                //   chrome.runtime.lastError.message,
                // );
              } else {
                // console.log(
                //   'Focus message sent successfully, response:',
                //   response,
                // );
              }
            },
          );
        } else {
          console.error('No active tab available for focus message');
        }
      });
    });
  };

  try {
    // Try to get the actual tab width using Chrome tabs API
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    // Create at fixed initial position regardless of tab width
    createNoteWithPosition();
  } catch (error) {
    console.error('Error getting tab info:', error);
    // Fallback to fixed position if there's an error
    createNoteWithPosition();
  }
};

// Fallback function for when tab width is not available
export const createNoteWithFallback = (newNoteId, activeTab) => {
  chrome.storage.sync.get({ notes: {} }, (data) => {
    const notes = data.notes;
    // Compute z-index so the new note appears on top
    const maxZ = Object.values(notes).reduce((m, n) => {
      const z = n && n.zIndex !== undefined ? parseInt(n.zIndex, 10) : 0;
      return isNaN(z) ? m : Math.max(m, z);
    }, 0);
    const nextZ = maxZ + 1;

    const newNote = {
      content: '',
      left: '20px',
      top: '20px',
      right: null,
      edge: 'left',
      zIndex: nextZ,
    };

    notes[newNoteId] = newNote;
    chrome.storage.sync.set({ notes }, () => {
      if (activeTab.id) {
        chrome.tabs.sendMessage(
          activeTab.id,
          {
            action: 'focus_note',
            id: newNoteId,
          },
          (response) => {
            if (chrome.runtime.lastError) {
              // Ignore errors, e.g., if the content script isn't ready.
            }
          },
        );
      }
    });
  });
};

// Handle delete focused note command
export const deleteFocusedNote = (activeTab) => {
  if (activeTab.id) {
    chrome.tabs.sendMessage(
      activeTab.id,
      { action: 'delete_focused_note' },
      (response) => {
        if (chrome.runtime.lastError) {
          // Ignore errors, e.g., if the content script isn't ready.
        }
      },
    );
  }
};
