// Function to parse position string to number (e.g., "100px" -> 100)
const parsePosition = (posStr) => {
  if (!posStr || posStr === null || posStr === undefined) {
    return 0;
  }
  if (typeof posStr === 'number') {
    return posStr;
  }
  return parseInt(String(posStr).replace('px', ''), 10) || 0;
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
  const existingRects = Object.values(existingNotes).map((note) => {
    const left = parsePosition(note.left);
    const top = parsePosition(note.top);
    const width = parsePosition(note.width || '200px');
    const height = parsePosition(note.height || '200px');

    return {
      left: left,
      top: top,
      right: left + width,
      bottom: top + height,
    };
  });

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

chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked, creating new note for tab:', tab.id);
  createNewNote(tab);
});

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

// Update badge when extension starts up
chrome.runtime.onStartup.addListener(() => {
  updateBadge();
});

// Update badge whenever notes storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.notes) {
    updateBadge();
  }
});

chrome.runtime.onInstalled.addListener((details) => {
  // Update badge on install/update
  updateBadge();

  if (details.reason === 'install' || details.reason === 'update') {
    // Helper that determines whether a tab should be reloaded
    const shouldReloadTab = async (tab) => {
      // Skip internal browser pages
      if (
        !tab.url ||
        tab.url.startsWith('chrome://') ||
        tab.url.startsWith('edge://')
      ) {
        return false;
      }

      // Do not reload if the tab is currently producing audio
      if (tab.audible) {
        return false;
      }

      return true;
    };

    (async () => {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        if (tab.id && (await shouldReloadTab(tab))) {
          chrome.tabs.reload(tab.id);
        }
      }
    })();
  }
});

// Function to update the action badge with the current note count
const updateBadge = () => {
  chrome.storage.sync.get({ notes: {} }, (data) => {
    if (chrome.runtime.lastError) {
      console.error(
        'Error reading notes for badge update:',
        chrome.runtime.lastError,
      );
      return;
    }

    const notes = data.notes;
    const noteCount = Object.keys(notes).length;

    // Set badge text - show count if > 0, otherwise show nothing
    const badgeText = noteCount > 0 ? noteCount.toString() : '';
    chrome.action.setBadgeText({ text: badgeText });

    // Set badge background color to a nice blue
    chrome.action.setBadgeBackgroundColor({ color: '#4285f4' });

    console.log(`Badge updated: ${noteCount} notes`);
  });
};

// Device pixel ratio management
let maxDevicePixelRatio = 1;
const DEVICE_PIXEL_RATIO_MAX = 2;

// Listen for DPR reports from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message.action === 'device_pixel_ratio' &&
    typeof message.dpr === 'number'
  ) {
    const newDpr = message.dpr;
    if (newDpr > maxDevicePixelRatio && newDpr <= DEVICE_PIXEL_RATIO_MAX) {
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
