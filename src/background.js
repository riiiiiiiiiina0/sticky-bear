// Function to parse position string to number (e.g., "100px" -> 100)
const parsePosition = (posStr) => {
  return parseInt(posStr.replace('px', ''), 10) || 0;
};

// Function to check if two rectangles overlap
const rectanglesOverlap = (rect1, rect2) => {
  return !(
    rect1.right <= rect2.left ||
    rect2.right <= rect1.left ||
    rect1.bottom <= rect2.top ||
    rect2.bottom <= rect1.top
  );
};

// Function to find a non-overlapping position for a new note
const findNonOverlappingPosition = (existingNotes, viewportWidth = 1400) => {
  const defaultPosition = { left: 100, top: 100 };
  const noteWidth = 200; // Default note width
  const noteHeight = 200; // Default note height
  const horizontalSpacing = 20; // Space between notes
  const verticalSpacing = 20; // Space between rows
  const rightMargin = 50; // Keep some margin from the right edge

  // If no existing notes, use default position
  if (Object.keys(existingNotes).length === 0) {
    return {
      left: `${defaultPosition.left}px`,
      top: `${defaultPosition.top}px`,
    };
  }

  // Create list of existing note rectangles
  const existingRects = Object.values(existingNotes).map((note) => ({
    left: parsePosition(note.left),
    top: parsePosition(note.top),
    right: parsePosition(note.left) + parsePosition(note.width || '200px'),
    bottom: parsePosition(note.top) + parsePosition(note.height || '200px'),
  }));

  // Start from default position and search for a non-overlapping spot
  let candidatePosition = { ...defaultPosition };
  let maxAttempts = 50; // Increased to handle multiple rows
  let attempts = 0;
  let currentRow = 0;

  while (attempts < maxAttempts) {
    // Check if this position would exceed the viewport width BEFORE creating the rect
    if (candidatePosition.left + noteWidth > viewportWidth - rightMargin) {
      // Wrap to next row
      currentRow++;
      candidatePosition.left = defaultPosition.left;
      candidatePosition.top =
        defaultPosition.top + currentRow * (noteHeight + verticalSpacing);
      attempts++; // Increment attempts to prevent infinite loop
      continue; // Try again with the new row position
    }

    const candidateRect = {
      left: candidatePosition.left,
      top: candidatePosition.top,
      right: candidatePosition.left + noteWidth,
      bottom: candidatePosition.top + noteHeight,
    };

    // Check if this position overlaps with any existing note
    const hasOverlap = existingRects.some((existingRect) =>
      rectanglesOverlap(candidateRect, existingRect),
    );

    if (!hasOverlap) {
      // Found a non-overlapping position
      return {
        left: `${candidatePosition.left}px`,
        top: `${candidatePosition.top}px`,
      };
    }

    // Move to the right for next attempt
    candidatePosition.left += noteWidth + horizontalSpacing;
    attempts++;
  }

  // If we couldn't find a spot after many attempts, place it in a new row far down
  const fallbackRow = currentRow + 1;
  return {
    left: `${defaultPosition.left}px`,
    top: `${
      defaultPosition.top + fallbackRow * (noteHeight + verticalSpacing)
    }px`,
  };
};

// Function to create a new note
const createNewNote = async (activeTab) => {
  const newNoteId = Date.now().toString();

  try {
    // Get the actual tab width using Chrome tabs API
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    const viewportWidth = tab.width || 1400; // Fallback to 1400 if width not available

    // Get existing notes to determine optimal position
    chrome.storage.sync.get({ notes: {} }, (data) => {
      const notes = data.notes;

      // Find a non-overlapping position using actual tab width
      const position = findNonOverlappingPosition(notes, viewportWidth);

      const newNote = {
        content: '',
        left: position.left,
        top: position.top,
      };

      notes[newNoteId] = newNote;
      chrome.storage.sync.set({ notes }, () => {
        // After saving, send a message to the active tab to focus the new note.
        // The note element will be created by the onChanged listener in all tabs.
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
  } catch (error) {
    console.error('Error getting tab width:', error);
    // Fallback to default positioning if there's an error
    createNoteWithFallback(newNoteId, activeTab);
  }
};

// Fallback function for when tab width is not available
const createNoteWithFallback = (newNoteId, activeTab) => {
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

chrome.action.onClicked.addListener(createNewNote);

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) return;

    switch (command) {
      case 'create-new-note':
        createNewNote(activeTab);
        break;
      case 'delete-focused-note':
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
        break;
    }
  });
});

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install' || details.reason === 'update') {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (
          tab.id &&
          tab.url &&
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('edge://')
        ) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  }
});

// Device pixel ratio management
let maxDevicePixelRatio = 1;

// Listen for DPR reports from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.action === 'device_pixel_ratio' &&
    typeof message.dpr === 'number'
  ) {
    const newDpr = message.dpr;
    if (newDpr > maxDevicePixelRatio) {
      maxDevicePixelRatio = newDpr;
      // Broadcast the updated DPR to all tabs
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'update_dpr',
              dpr: maxDevicePixelRatio,
            });
          }
        });
      });
    } else {
      // Reply current max DPR to the sender so it can sync if needed
      if (sender.tab && sender.tab.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'update_dpr',
          dpr: maxDevicePixelRatio,
        });
      }
    }
  }
});
