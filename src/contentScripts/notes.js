/* global BundledCode */

// Main content script with dynamic module loading
(async () => {
  try {
    // Dynamically import all modules
    const [
      { debounce },
      {
        initializeStickyNotesContainer,
        reportDpr,
        setUnifiedDpr,
        applyContainerScale,
        getShadowRoot,
      },
      {
        loadNotes,
        setNotes,
        getNotes,
        clearEditingData,
        isNoteActivelyEditing,
        getLastEditTimestamp,
        setLastEditTimestamp,
      },
      {
        constrainNotesToViewport,
        migrateNotesToEdgePositioning,
        updateNotesOnResize,
      },
      { renderNotes, updateNoteElement },
      {
        setupGlobalEvents,
        setupMouseEdgeDetection,
        focusNote,
        getFocusedNoteId,
        handleDeleteNote,
        blurAllStickyNotes,
      },
    ] = await Promise.all([
      import(chrome.runtime.getURL('src/contentScripts/modules/utils.js')),
      import(chrome.runtime.getURL('src/contentScripts/modules/dom.js')),
      import(chrome.runtime.getURL('src/contentScripts/modules/storage.js')),
      import(
        chrome.runtime.getURL('src/contentScripts/modules/positioning.js')
      ),
      import(
        chrome.runtime.getURL('src/contentScripts/modules/noteManager.js')
      ),
      import(chrome.runtime.getURL('src/contentScripts/modules/events.js')),
    ]);

    // Initialize and load notes
    const initializeApp = async () => {
      try {
        initializeStickyNotesContainer();
        const loadedNotes = await loadNotes();
        setNotes(loadedNotes);
        migrateNotesToEdgePositioning();
        constrainNotesToViewport();
        renderNotes();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    // === Device Pixel Ratio (DPR) handling ===

    // Debounce resize DPR reports and note position updates
    window.addEventListener(
      'resize',
      debounce(() => {
        reportDpr();
        updateNotesOnResize();
      }, 300),
    );

    // Initial report
    reportDpr();

    // Handle messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      // Listen for DPR updates from background script
      if (message.action === 'update_dpr' && typeof message.dpr === 'number') {
        setUnifiedDpr(message.dpr);
        applyContainerScale();
      } else if (message.action === 'focus_note') {
        // console.log(`Received focus_note message for note: ${message.id}`);

        const attemptMessageFocus = (attempt = 1) => {
          // console.log(
          //   `Message focus attempt ${attempt} for note ${message.id}`,
          // );

          const shadowRoot = getShadowRoot();
          const noteElement = shadowRoot.querySelector(
            `.sticky-note[data-id='${message.id}']`,
          );

          // Check if note is ready for focus
          if (noteElement && !noteElement.hasAttribute('data-ready')) {
            // console.log(
            //   `Note ${message.id} not ready yet, marking for pending focus`,
            // );
            noteElement.setAttribute('data-pending-focus', 'true');
            return;
          }

          if (focusNote(message.id)) {
            // console.log(
            //   `Message focus successful on attempt ${attempt} for note ${message.id}`,
            // );
            return;
          }

          // Retry with increasing delays if focus failed
          if (attempt < 3) {
            const delay = attempt * 100; // 100ms, 200ms
            // console.log(
            //   `Message focus failed, retrying in ${delay}ms for note ${message.id}`,
            // );
            setTimeout(() => attemptMessageFocus(attempt + 1), delay);
          } else {
            // console.log(
            //   `Message focus failed after ${attempt} attempts for note ${message.id}`,
            // );
          }
        };

        // Start focus attempts immediately
        attemptMessageFocus();
      } else if (message.action === 'delete_focused_note') {
        const focusedNoteId = getFocusedNoteId();
        if (focusedNoteId) {
          handleDeleteNote(focusedNoteId);
          sendResponse({ success: true, deletedNoteId: focusedNoteId });
        } else {
          sendResponse({
            success: false,
            error: 'No note is currently focused',
          });
        }
      }
    });

    // Handle storage changes and sync notes across tabs
    chrome.storage.onChanged.addListener((changes, namespace) => {
      try {
        // console.log(
        //   'Storage change event received, namespace:',
        //   namespace,
        //   'changes:',
        //   changes,
        // );
        if (changes.notes) {
          // console.log('Storage changed - notes updated');
          const oldNotes = changes.notes.oldValue || {};
          const newNotes = changes.notes.newValue || {};
          // console.log('Old notes count:', Object.keys(oldNotes).length);
          // console.log('New notes count:', Object.keys(newNotes).length);

          // Update local notes and sync state
          setNotes(newNotes);

          // Handle deleted notes
          for (const id in oldNotes) {
            if (!newNotes[id]) {
              clearEditingData(id);
              const shadowRoot = getShadowRoot();
              const noteElement = shadowRoot.querySelector(
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
            const oldNoteData = oldNotes[id];
            // console.log('Processing note:', id, 'data:', noteData);
            updateNoteElement(id, noteData, oldNoteData);
          }
        }
      } catch (error) {
        console.error('Error in storage change listener:', error);
      }
    });

    // Handle visibility changes and tab switching
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is now hidden (user switched tabs, minimized window, etc.)
        blurAllStickyNotes();
      } else {
        // Tab became visible: refresh notes from storage and re-render
        chrome.storage.sync.get('notes', (data) => {
          setNotes(data.notes || {});
          renderNotes();
        });
      }
    });

    // Setup global event listeners
    setupGlobalEvents();

    // Setup mouse edge detection for collapsing notes
    setupMouseEdgeDetection();

    // Add some debugging info
    // console.log('Sticky Bear content script loaded');
    // console.log('Chrome runtime available:', !!chrome.runtime);
    // console.log('Chrome storage available:', !!chrome.storage);

    // Initialize the application
    initializeApp();
  } catch (error) {
    console.error('Failed to load content script modules:', error);
  }
})();
