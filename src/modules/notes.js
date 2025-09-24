// notes.js - Module for handling note creation and management

import { findNonOverlappingPosition } from './positioning.js';
import { updateBadge } from './badge.js';

// Function to create a new note
export const createNewNote = async (activeTab) => {
  const newNoteId = Date.now().toString();

  // Use a more reliable fallback approach
  const createNoteWithPosition = (viewportWidth = 1400) => {
    console.log('Creating note with viewport width:', viewportWidth);

    chrome.storage.sync.get({ notes: {} }, (data) => {
      if (chrome.runtime.lastError) {
        console.error('Error reading from storage:', chrome.runtime.lastError);
        return;
      }

      const notes = data.notes;
      console.log('Current notes in storage:', Object.keys(notes).length);
      console.log('Existing notes data:', notes);

      // Find a non-overlapping position
      const position = findNonOverlappingPosition(notes, viewportWidth);
      console.log('Calculated position for new note:', position);

      const newNote = {
        content: '',
        left: position.left,
        top: position.top,
      };

      notes[newNoteId] = newNote;
      console.log(
        'About to save note with ID:',
        newNoteId,
        'Note data:',
        newNote,
      );

      chrome.storage.sync.set({ notes }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving to storage:', chrome.runtime.lastError);
          return;
        }

        console.log('Note saved successfully to storage');

        // Update badge count after creating a new note
        updateBadge();

        // After saving, send a message to the active tab to focus the new note.
        // The note element will be created by the onChanged listener in all tabs.
        if (activeTab && activeTab.id) {
          console.log('Sending focus message to tab:', activeTab.id);
          chrome.tabs.sendMessage(
            activeTab.id,
            {
              action: 'focus_note',
              id: newNoteId,
            },
            (response) => {
              if (chrome.runtime.lastError) {
                // Ignore errors, e.g., if the content script isn't ready.
                console.log(
                  'Content script not ready:',
                  chrome.runtime.lastError.message,
                );
              } else {
                console.log(
                  'Focus message sent successfully, response:',
                  response,
                );
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

    // Use tab width if available, otherwise use default
    const viewportWidth = tab && tab.width ? tab.width : 1400;
    createNoteWithPosition(viewportWidth);
  } catch (error) {
    console.error('Error getting tab info:', error);
    // Fallback to default positioning if there's an error
    createNoteWithPosition(1400);
  }
};

// Fallback function for when tab width is not available
export const createNoteWithFallback = (newNoteId, activeTab) => {
  chrome.storage.sync.get({ notes: {} }, (data) => {
    const notes = data.notes;
    const position = findNonOverlappingPosition(notes, 1400); // Default fallback width

    const newNote = {
      content: '',
      left: position.left,
      top: position.top,
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
