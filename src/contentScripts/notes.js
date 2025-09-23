const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), delay);
  };
};

// Function to strip markdown formatting and return plain text
const stripMarkdown = (text) => {
  if (!text) return '';

  return (
    text
      // Remove headers (# ## ### etc.)
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold (**text** or __text__)
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      // Remove italic (*text* or _text_)
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      // Remove strikethrough (~~text~~)
      .replace(/~~(.*?)~~/g, '$1')
      // Remove inline code (`text`)
      .replace(/`(.*?)`/g, '$1')
      // Remove links [text](url) -> text
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Remove images ![alt](url) -> alt
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
      // Remove blockquotes (> text)
      .replace(/^>\s+/gm, '')
      // Remove list markers (- * + 1. 2. etc.)
      .replace(/^[\s]*[-*+]\s+/gm, '')
      .replace(/^[\s]*\d+\.\s+/gm, '')
      // Remove horizontal rules (--- or ***)
      .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, '')
      // Remove code blocks (```code```)
      .replace(/```[\s\S]*?```/g, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, '\n')
      .replace(/^\s+|\s+$/g, '')
      // Replace multiple spaces with single space
      .replace(/\s+/g, ' ')
      .trim()
  );
};

let notes = {};
const debouncedSaveNotes = debounce(() => saveNotes(), 300);
let stickyNotesContainer = null;
let isDragging = false;
let lastEditTimestamp = {}; // Track last edit time for each note
let isActivelyEditing = {}; // Track which notes are being actively edited
let tinyMdeInstances = {}; // Track TinyMDE editor instances for each note

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

const createColorDropdown = (noteId, currentColor) => {
  const colors = [
    { name: 'yellow', color: '#ffff99' },
    { name: 'green', color: '#90ee90' },
    { name: 'blue', color: '#99ccff' },
    { name: 'red', color: '#ff9999' },
    { name: 'gray', color: '#cccccc' },
  ];

  const dropdown = document.createElement('div');
  dropdown.classList.add('color-dropdown');

  const button = document.createElement('button');
  button.classList.add('color-dropdown-button');
  button.style.backgroundColor =
    colors.find((c) => c.name === currentColor)?.color || '#ffff99';
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const menu = dropdown.querySelector('.color-dropdown-menu');
    if (menu) {
      menu.classList.toggle('show');
    }
  });

  const menu = document.createElement('div');
  menu.classList.add('color-dropdown-menu');

  colors.forEach((colorInfo) => {
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

const changeNoteColor = (noteId, newColor) => {
  if (!notes[noteId]) return;

  // Update the note data
  notes[noteId].backgroundColor = newColor;

  // Update the note element classes
  const noteElement = document.querySelector(
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
      const colors = {
        yellow: '#ffff99',
        green: '#90ee90',
        blue: '#99ccff',
        red: '#ff9999',
        gray: '#cccccc',
      };
      button.style.backgroundColor = colors[newColor];
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

const createNoteElement = (id, note) => {
  const noteElement = document.createElement('div');
  noteElement.classList.add('sticky-note');
  noteElement.classList.add(`color-${note.backgroundColor || 'yellow'}`);
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
  // Start with empty content - only show when minimized
  headerText.innerText = '';

  // Create color dropdown
  const colorDropdown = createColorDropdown(
    id,
    note.backgroundColor || 'yellow',
  );

  const deleteButton = document.createElement('button');
  deleteButton.classList.add('delete-note');
  deleteButton.innerHTML = '&times;';
  deleteButton.addEventListener('click', () => deleteNote(id));

  noteHeader.appendChild(headerText);
  noteHeader.appendChild(colorDropdown);
  noteHeader.appendChild(deleteButton);

  // Create container for TinyMDE editor
  const noteContent = document.createElement('div');
  noteContent.classList.add('sticky-note-content');
  noteContent.setAttribute('tabindex', '0'); // Make it focusable

  // Create textarea for TinyMDE
  const textarea = document.createElement('textarea');
  textarea.value = note.content || '';
  noteContent.appendChild(textarea);

  // Initialize TinyMDE editor with error handling
  let tinyMde = null;
  try {
    // @ts-ignore - TinyMDE is loaded via script tag
    if (typeof TinyMDE !== 'undefined' && TinyMDE.Editor) {
      console.log(`Initializing TinyMDE for note ${id}`);
      // @ts-ignore - TinyMDE is loaded via script tag
      tinyMde = new TinyMDE.Editor({
        element: textarea,
      });

      console.log(`TinyMDE initialized for note ${id}`, tinyMde);
      console.log(`TinyMDE editor element:`, tinyMde.e);
      console.log(`TinyMDE focus method:`, typeof tinyMde.focus);

      // Initialize the instance object
      tinyMdeInstances[id] = {
        editor: tinyMde,
        syncInterval: null,
      };

      // Function to handle content changes
      const handleContentChange = () => {
        const content = tinyMde.getContent();
        lastEditTimestamp[id] = Date.now();
        isActivelyEditing[id] = true;
        updateNoteContent(id, content);

        // Clear the actively editing flag after a short delay
        setTimeout(() => {
          isActivelyEditing[id] = false;
        }, 1000);
      };

      // Listen for multiple types of content changes
      tinyMde.addEventListener('change', handleContentChange);
      tinyMde.addEventListener('input', handleContentChange);
      tinyMde.addEventListener('selection', handleContentChange);

      // Add periodic sync for TinyMDE to catch any missed changes
      const syncInterval = setInterval(() => {
        if (tinyMde && tinyMde.getContent) {
          const currentContent = tinyMde.getContent();
          if (notes[id] && notes[id].content !== currentContent) {
            handleContentChange();
          }
        }
      }, 500); // Check every 500ms

      // Store the interval ID for cleanup
      tinyMdeInstances[id].syncInterval = syncInterval;

      // Get the editor element for event handling
      const editorElement = tinyMde.e || textarea;

      // Add additional event listeners to catch list operations and other changes
      editorElement.addEventListener('keydown', (e) => {
        e.stopPropagation();

        // Check for list-related keyboard shortcuts that might not trigger change events
        if (e.ctrlKey || e.metaKey) {
          // Delay check for content changes after keyboard shortcuts
          setTimeout(handleContentChange, 100);
        }
      });

      editorElement.addEventListener('keyup', (e) => {
        e.stopPropagation();

        // Check for Enter key (list item creation) and other keys that might change content
        if (e.key === 'Enter' || e.key === 'Backspace' || e.key === 'Delete') {
          setTimeout(handleContentChange, 50);
        }
      });

      editorElement.addEventListener('keypress', (e) => {
        e.stopPropagation();
      });

      // Maintain focus when clicking inside the content area
      editorElement.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        bringToFront(id);
      });

      editorElement.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      // Listen for paste events which might not trigger change events immediately
      editorElement.addEventListener('paste', (e) => {
        setTimeout(handleContentChange, 100);
      });
    } else {
      console.warn('TinyMDE not available, falling back to textarea');
      // Fallback to regular textarea if TinyMDE is not available
      textarea.style.width = '100%';
      textarea.style.height = '100%';
      textarea.style.border = 'none';
      textarea.style.resize = 'none';
      textarea.style.outline = 'none';
      textarea.style.fontFamily = 'inherit';
      textarea.style.fontSize = 'inherit';

      textarea.addEventListener('input', (e) => {
        const content = /** @type {HTMLTextAreaElement} */ (e.target).value;
        lastEditTimestamp[id] = Date.now();
        isActivelyEditing[id] = true;
        updateNoteContent(id, content);

        // Clear the actively editing flag after a short delay
        setTimeout(() => {
          isActivelyEditing[id] = false;
        }, 1000);
      });

      // Prevent keyboard events from bubbling to the page
      textarea.addEventListener('keydown', (e) => {
        e.stopPropagation();
      });

      textarea.addEventListener('keyup', (e) => {
        e.stopPropagation();
      });

      textarea.addEventListener('keypress', (e) => {
        e.stopPropagation();
      });

      // Maintain focus when clicking inside the content area
      textarea.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        bringToFront(id);
      });

      textarea.addEventListener('click', (e) => {
        e.stopPropagation();
        textarea.focus();
      });
    }
  } catch (error) {
    console.error('Error initializing TinyMDE:', error);
    // Fallback handled above
  }

  const resizeHandle = document.createElement('div');
  resizeHandle.classList.add('resize-handle');

  noteElement.appendChild(noteHeader);
  noteElement.appendChild(noteContent);
  noteElement.appendChild(resizeHandle);
  initializeStickyNotesContainer();
  stickyNotesContainer.appendChild(noteElement);

  makeDraggable(noteElement);
  makeResizable(noteElement, resizeHandle);

  // Ensure the note is ready for focusing
  // Small delay to allow TinyMDE or textarea to be fully initialized
  setTimeout(() => {
    // Mark this note as ready for focus
    noteElement.setAttribute('data-ready', 'true');
  }, 10);
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

    // Clear header text when expanding
    const headerText = /** @type {HTMLSpanElement} */ (
      noteElement.querySelector('.header-text')
    );
    if (headerText) {
      headerText.innerText = '';
    }
  } else {
    // Minimize the note
    noteElement.classList.add('minimized');
    notes[id].minimized = true;

    // Update header text with current content (plain text)
    const headerText = /** @type {HTMLSpanElement} */ (
      noteElement.querySelector('.header-text')
    );
    const content = notes[id].content || '';
    const plainText = stripMarkdown(content);
    headerText.innerText =
      plainText.substring(0, 30) + (plainText.length > 30 ? '...' : '');
  }

  debouncedSaveNotes();
};

const updateNoteContent = (id, content) => {
  if (notes[id]) {
    notes[id].content = content;
    notes[id].lastEditTimestamp = lastEditTimestamp[id] || Date.now();

    // Update header text if note is minimized (use plain text)
    const noteElement = document.querySelector(`.sticky-note[data-id='${id}']`);
    if (noteElement && noteElement.classList.contains('minimized')) {
      const headerText = /** @type {HTMLSpanElement} */ (
        noteElement.querySelector('.header-text')
      );
      if (headerText) {
        const plainText = stripMarkdown(content);
        headerText.innerText =
          plainText.substring(0, 30) + (plainText.length > 30 ? '...' : '');
      }
    }

    debouncedSaveNotes();
  }
};

const deleteNote = (id) => {
  // Clean up TinyMDE instance and intervals
  if (tinyMdeInstances[id]) {
    if (tinyMdeInstances[id].editor && tinyMdeInstances[id].editor.destroy) {
      tinyMdeInstances[id].editor.destroy();
    }
    if (tinyMdeInstances[id].syncInterval) {
      clearInterval(tinyMdeInstances[id].syncInterval);
    }
    delete tinyMdeInstances[id];
  }

  delete notes[id];
  delete lastEditTimestamp[id];
  delete isActivelyEditing[id];
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
    console.log(`Received focus_note message for note: ${message.id}`);

    const attemptMessageFocus = (attempt = 1) => {
      console.log(`Message focus attempt ${attempt} for note ${message.id}`);

      if (focusNote(message.id)) {
        console.log(
          `Message focus successful on attempt ${attempt} for note ${message.id}`,
        );
        return;
      }

      // Retry with increasing delays if focus failed
      if (attempt < 3) {
        const delay = attempt * 100; // 100ms, 200ms
        console.log(
          `Message focus failed, retrying in ${delay}ms for note ${message.id}`,
        );
        setTimeout(() => attemptMessageFocus(attempt + 1), delay);
      } else {
        console.log(
          `Message focus failed after ${attempt} attempts for note ${message.id}`,
        );
      }
    };

    // Start focus attempts immediately
    attemptMessageFocus();
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
        // Clean up TinyMDE instance and intervals
        if (tinyMdeInstances[id]) {
          if (
            tinyMdeInstances[id].editor &&
            tinyMdeInstances[id].editor.destroy
          ) {
            tinyMdeInstances[id].editor.destroy();
          }
          if (tinyMdeInstances[id].syncInterval) {
            clearInterval(tinyMdeInstances[id].syncInterval);
          }
          delete tinyMdeInstances[id];
        }
        delete lastEditTimestamp[id];
        delete isActivelyEditing[id];

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

        // Auto-focus newly created notes with multiple attempts
        console.log(`Auto-focusing new note: ${id}`);

        const attemptAutoFocus = (attempt = 1) => {
          console.log(`Auto-focus attempt ${attempt} for note ${id}`);

          if (focusNote(id)) {
            console.log(
              `Auto-focus successful on attempt ${attempt} for note ${id}`,
            );
            return;
          }

          // Retry with increasing delays if focus failed
          if (attempt < 5) {
            const delay = attempt * 100; // 100ms, 200ms, 300ms, 400ms
            console.log(
              `Auto-focus failed, retrying in ${delay}ms for note ${id}`,
            );
            setTimeout(() => attemptAutoFocus(attempt + 1), delay);
          } else {
            console.log(
              `Auto-focus failed after ${attempt} attempts for note ${id}`,
            );
          }
        };

        // Start auto-focus attempts after a small initial delay
        setTimeout(() => attemptAutoFocus(), 50);
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
            // Update header text (use plain text)
            const headerText = /** @type {HTMLSpanElement} */ (
              noteElement.querySelector('.header-text')
            );
            if (headerText) {
              const content = noteData.content || '';
              const plainText = stripMarkdown(content);
              headerText.innerText =
                plainText.substring(0, 30) +
                (plainText.length > 30 ? '...' : '');
            }
          }
        } else {
          noteElement.classList.remove('minimized');
          // Clear header text when not minimized
          const headerText = /** @type {HTMLSpanElement} */ (
            noteElement.querySelector('.header-text')
          );
          if (headerText) {
            headerText.innerText = '';
          }
        }

        // Update background color if changed
        const currentColorClass = Array.from(noteElement.classList).find(
          (cls) => cls.startsWith('color-'),
        );
        const expectedColorClass = `color-${
          noteData.backgroundColor || 'yellow'
        }`;
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
            if (
              optionElement.title === (noteData.backgroundColor || 'yellow')
            ) {
              optionElement.classList.add('selected');
            }
          });
        }

        // Update content only if this page is not actively editing the note
        const instance = tinyMdeInstances[id];
        const tinyMde = instance ? instance.editor || instance : null;
        const currentNoteElement = document.querySelector(
          `.sticky-note[data-id='${id}']`,
        );
        const textarea = currentNoteElement
          ? currentNoteElement.querySelector('textarea')
          : null;

        // Check if we should update the content
        const shouldUpdate =
          !isActivelyEditing[id] &&
          noteData.lastEditTimestamp &&
          noteData.lastEditTimestamp > (lastEditTimestamp[id] || 0);

        if (shouldUpdate) {
          if (
            tinyMde &&
            tinyMde.getContent &&
            tinyMde.getContent() !== noteData.content
          ) {
            // TinyMDE is available
            let cursorPosition = 0;
            const wasFocused =
              tinyMde.hasFocus ||
              (tinyMde.e && document.activeElement === tinyMde.e);
            if (wasFocused && tinyMde.getSelection) {
              cursorPosition = tinyMde.getSelection();
            }

            if (tinyMde.setContent) {
              tinyMde.setContent(noteData.content);
            }
            lastEditTimestamp[id] = noteData.lastEditTimestamp || Date.now();

            // Restore cursor position if editor was focused
            if (wasFocused && tinyMde.setSelection) {
              tinyMde.focus();
              tinyMde.setSelection(cursorPosition);
            }
          } else if (textarea && textarea.value !== noteData.content) {
            // Fallback to textarea
            const wasFocused = document.activeElement === textarea;
            let cursorPosition = 0;
            if (wasFocused) {
              cursorPosition = textarea.selectionStart;
            }

            textarea.value = noteData.content;
            lastEditTimestamp[id] = noteData.lastEditTimestamp || Date.now();

            // Restore cursor position if textarea was focused
            if (wasFocused) {
              textarea.focus();
              textarea.setSelectionRange(cursorPosition, cursorPosition);
            }
          }
        }
      }
    }
  }
});

// Function to focus a specific note by ID
const focusNote = (id) => {
  const instance = tinyMdeInstances[id];
  const tinyMde = instance ? instance.editor || instance : null;
  const noteElement = document.querySelector(`.sticky-note[data-id='${id}']`);

  if (!noteElement) {
    console.log(`Note element not found for id: ${id}`);
    return false;
  }

  // Try multiple focus strategies
  let focused = false;

  // Strategy 1: Focus TinyMDE editor element directly
  if (tinyMde && tinyMde.e) {
    try {
      tinyMde.e.focus();
      // Set cursor at the end of content
      const selection = window.getSelection();
      if (selection) {
        selection.selectAllChildren(tinyMde.e);
        selection.collapseToEnd();
      }
      focused = true;
      console.log(`TinyMDE editor focused for note ${id}`);
    } catch (error) {
      console.log(`TinyMDE focus failed for note ${id}:`, error);
    }
  }

  // Strategy 2: Focus textarea directly
  if (!focused) {
    const textarea = noteElement.querySelector('textarea');
    if (textarea) {
      try {
        textarea.focus();
        // Set cursor at the end
        textarea.setSelectionRange(
          textarea.value.length,
          textarea.value.length,
        );
        focused = true;
        console.log(`Textarea focused for note ${id}`);
      } catch (error) {
        console.log(`Textarea focus failed for note ${id}:`, error);
      }
    }
  }

  // Strategy 3: Focus any focusable element in the note content
  if (!focused) {
    const contentDiv = /** @type {HTMLDivElement} */ (
      noteElement.querySelector('.sticky-note-content')
    );
    if (contentDiv) {
      try {
        contentDiv.focus();
        focused = true;
        console.log(`Content div focused for note ${id}`);
      } catch (error) {
        console.log(`Content div focus failed for note ${id}:`, error);
      }
    }
  }

  // Strategy 4: Try TinyMDE focus method if available
  if (!focused && tinyMde && typeof tinyMde.focus === 'function') {
    try {
      tinyMde.focus();
      focused = true;
      console.log(`TinyMDE focus() method worked for note ${id}`);
    } catch (error) {
      console.log(`TinyMDE focus() method failed for note ${id}:`, error);
    }
  }

  // Strategy 5: Simulate click on the editor area to activate it
  if (!focused) {
    const clickTarget =
      (tinyMde && tinyMde.e) ||
      noteElement.querySelector('textarea') ||
      noteElement.querySelector('.sticky-note-content');

    if (clickTarget) {
      try {
        // Create and dispatch a click event
        const clickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        clickTarget.dispatchEvent(clickEvent);

        // Then try to focus again
        if (clickTarget.focus) {
          clickTarget.focus();
        }

        focused = true;
        console.log(`Simulated click and focus worked for note ${id}`);
      } catch (error) {
        console.log(`Simulated click failed for note ${id}:`, error);
      }
    }
  }

  // Strategy 6: Force focus with selection manipulation
  if (!focused && tinyMde && tinyMde.e) {
    try {
      // Force focus by manipulating the selection
      const range = document.createRange();
      const selection = window.getSelection();

      if (tinyMde.e.firstChild) {
        range.setStart(tinyMde.e.firstChild, 0);
        range.setEnd(tinyMde.e.firstChild, 0);
      } else {
        range.selectNodeContents(tinyMde.e);
        range.collapse(true);
      }

      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      tinyMde.e.focus();
      focused = true;
      console.log(`Force focus with selection worked for note ${id}`);
    } catch (error) {
      console.log(`Force focus with selection failed for note ${id}:`, error);
    }
  }

  return focused;
};

// Function to blur all focused sticky notes and clear editing flags
const blurAllStickyNotes = () => {
  // Blur all TinyMDE editors and textareas
  for (const id in tinyMdeInstances) {
    const instance = tinyMdeInstances[id];
    const tinyMde = instance ? instance.editor || instance : null;
    if (tinyMde && tinyMde.blur) {
      tinyMde.blur();
    }
  }

  // Also blur any focused textareas (fallback case)
  const focusedTextareas = document.querySelectorAll(
    '.sticky-note-content textarea:focus',
  );
  focusedTextareas.forEach((textarea) => {
    /** @type {HTMLTextAreaElement} */ (textarea).blur();
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

// Close color dropdowns when clicking outside
document.addEventListener('click', (e) => {
  const dropdowns = document.querySelectorAll('.color-dropdown-menu.show');
  dropdowns.forEach((dropdown) => {
    const colorDropdown = dropdown.closest('.color-dropdown');
    const target = /** @type {Node} */ (e.target);
    if (colorDropdown && target && !colorDropdown.contains(target)) {
      dropdown.classList.remove('show');
    }
  });
});

// Also close dropdowns on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const dropdowns = document.querySelectorAll('.color-dropdown-menu.show');
    dropdowns.forEach((dropdown) => {
      dropdown.classList.remove('show');
    });
  }
});

loadNotes();
