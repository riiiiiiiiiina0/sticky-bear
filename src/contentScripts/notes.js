/* global BundledCode */
(() => {
  // CSS content to be injected into Shadow DOM
  const CSS_CONTENT = `.sticky-notes-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica,
    Arial, sans-serif;
  font-size: 12px;
  z-index: 2147483647; /* Highest possible z-index */
}

.sticky-notes-container.collapsed .sticky-note {
  transition: all 0.3s ease-in-out;
}

/* Notes aligned to left edge collapse to the left */
.sticky-notes-container.collapsed .sticky-note:not([style*="right:"]),
.sticky-notes-container.collapsed .sticky-note[style*="right: auto"] {
  left: 0 !important;
  right: auto !important;
  transform: translateX(calc(-100% + 15px));
}

/* Notes aligned to right edge collapse to the right */
.sticky-notes-container.collapsed .sticky-note[style*="right:"][style*="left: auto"] {
  right: 0 !important;
  left: auto !important;
  transform: translateX(calc(100% - 15px));
}
.sticky-notes-container.collapsing .sticky-note {
  transition: all 0.3s ease-in-out;
}

.sticky-note {
  position: absolute;
  width: 200px;
  height: 200px;
  color: #000;
  background-color: rgba(255, 255, 204, 0.85);
  backdrop-filter: blur(4px);
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  border-radius: 10px;
  overflow: visible;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
  min-width: 150px;
  min-height: 100px;
}

.sticky-note-header {
  height: 20px;
  background-color: #f0f0f0;
  cursor: move;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 4px;
  padding: 0 4px;
  position: relative;
  z-index: 1000;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

.header-text {
  flex-grow: 1;
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 4px;
  line-height: 20px;
}

/* In minimized state, change layout to space-between */
.sticky-note.minimized .sticky-note-header {
  justify-content: space-between;
  border-radius: 10px;
}

.sticky-note-header-button {
  font-size: 10px;
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1;
  margin: 0;
  padding: 0;
  border-radius: 3px;
  transition: background 0.2s;
}
.sticky-note-header-button:hover {
  background: rgba(0, 0, 0, 0.3);
}

.sticky-note-header-button svg {
  width: 12px;
  height: 12px;
  display: block;
}

.color-dropdown {
  position: relative;
  display: inline-block;
  z-index: 1001;
  width: 14px;
  height: 14px;
}

.color-dropdown-button {
  background: none;
  border: 1px solid #999;
  font-size: 12px;
  cursor: pointer;
  line-height: 1;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  margin: 0;
  padding: 0;
}

.color-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 2147483647;
  display: none;
  padding: 4px;
}

.color-dropdown-menu::after {
  content: '';
  display: table;
  clear: both;
}

.color-dropdown-menu.show {
  display: block;
}

.color-option {
  display: block;
  width: 20px;
  height: 20px;
  margin: 2px;
  border: 1px solid #999;
  border-radius: 3px;
  cursor: pointer;
  float: left;
}

.color-option:hover {
  border-color: #333;
  transform: scale(1.1);
}

.color-option.selected {
  border: 2px solid #333;
  border-width: 2px;
}

/* Background color variants */
.sticky-note.color-yellow {
  background-color: rgba(255, 255, 204, 0.85);
}

.sticky-note.color-yellow .sticky-note-header {
  background-color: rgba(240, 240, 180, 0.95);
}

.sticky-note.color-green {
  background-color: rgba(144, 238, 144, 0.85);
}

.sticky-note.color-green .sticky-note-header {
  background-color: rgba(120, 200, 120, 0.95);
}

.sticky-note.color-blue {
  background-color: rgba(204, 229, 255, 0.85);
}

.sticky-note.color-blue .sticky-note-header {
  background-color: rgba(180, 210, 240, 0.95);
}

.sticky-note.color-red {
  background-color: rgba(255, 204, 204, 0.85);
}

.sticky-note.color-red .sticky-note-header {
  background-color: rgba(240, 180, 180, 0.95);
}

.sticky-note.color-gray {
  background-color: rgba(230, 230, 230, 0.85);
}

.sticky-note.color-gray .sticky-note-header {
  background-color: rgba(200, 200, 200, 0.95);
}

.sticky-note-content {
  flex-grow: 1;
  padding: 6px 10px;
  outline: none;
  overflow: auto;
  line-height: 1.4;
  cursor: text;
}

/* Plain text contenteditable editor */
.sticky-note-content .sticky-note-editor {
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 12px;
  line-height: 1.4;
  padding: 0;
  margin: 0;
  resize: none;
  font-family: inherit;
  white-space: pre-wrap;
}

/* Rendered markdown view */
.sticky-note-content .sticky-note-rendered {
  width: 100%;
  height: 100%;
  overflow: auto;
  font-size: 12px;
  line-height: 1.4;
  color: inherit;
}
.sticky-note-content .sticky-note-rendered h1 {
  margin: 0.3em 0 0.2em;
  font-weight: 700;
  font-size: 1.5em;
}
.sticky-note-content .sticky-note-rendered h2 {
  margin: 0.3em 0 0.2em;
  font-weight: 600;
  font-size: 1.3em;
}
.sticky-note-content .sticky-note-rendered h3 {
  margin: 0.3em 0 0.2em;
  font-weight: 600;
  font-size: 1.15em;
}
.sticky-note-content .sticky-note-rendered h4,
.sticky-note-content .sticky-note-rendered h5,
.sticky-note-content .sticky-note-rendered h6 {
  margin: 0.3em 0 0.2em;
  font-weight: 600;
  font-size: 1em;
}
.sticky-note-content .sticky-note-rendered p {
  margin: 0.2em 0;
}
.sticky-note-content .sticky-note-rendered img {
  max-width: 100%;
  border-radius: 8px;
}
.sticky-note-content .sticky-note-rendered ul,
.sticky-note-content .sticky-note-rendered ol {
  margin: 0.2em 0 0.2em 1.2em;
  padding: 0;
}
.sticky-note-content .sticky-note-rendered code,
.sticky-note-content .sticky-note-rendered pre {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: 11px;
}
.sticky-note-content .sticky-note-rendered pre {
  padding: 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  overflow: auto;
}

.sticky-note-content:focus {
  background-color: rgba(255, 255, 255, 0.1);
}

.resize-handle {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 15px;
  height: 15px;
  cursor: nw-resize;
  background: transparent;
}

.resize-handle::after {
  content: '';
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-bottom: 8px solid #999;
}

/* Minimized state styles */
.sticky-note.minimized {
  height: 20px !important;
  min-height: 20px;
}

.sticky-note.minimized .sticky-note-content {
  display: none;
}

.sticky-note.minimized .resize-handle {
  display: none;
}

.sticky-note.minimized .header-text {
  font-weight: bold;
}

/* Dark Mode Styles */
@media (prefers-color-scheme: dark) {
  .sticky-note {
    background-color: rgba(42, 42, 42, 0.85);
    backdrop-filter: blur(4px);
    color: #eee;
  }

  .sticky-note-header {
    background-color: #333;
  }

  .delete-note {
    color: #eee;
  }

  .resize-handle::after {
    border-bottom-color: #666;
  }

  .header-text {
    color: #ccc;
  }

  .sticky-note-content:focus {
    background-color: rgba(0, 0, 0, 0.1);
  }

  /* Dark mode styles for editor */
  .sticky-note-content .sticky-note-editor {
    color: #eee;
  }

  /* Improve anchor readability in rendered markdown */
  .sticky-note-content .sticky-note-rendered a {
    color: #8ab4f8;
    text-decoration: underline;
  }
  .sticky-note-content .sticky-note-rendered a:visited {
    color: #c58af9;
  }
  .sticky-note-content .sticky-note-rendered a:hover {
    text-decoration: underline;
    filter: brightness(1.1);
  }

  /* Dark mode color dropdown styles */
  .color-dropdown-button {
    border-color: #666;
  }

  .color-dropdown-menu {
    background: #333;
    border-color: #555;
  }

  .color-option {
    border-color: #666;
  }

  .color-option:hover {
    border-color: #999;
  }

  .color-option.selected {
    border-color: #ccc;
  }

  /* Dark mode background color variants */
  .sticky-note.color-yellow {
    background-color: rgba(80, 80, 40, 0.85);
  }

  .sticky-note.color-yellow .sticky-note-header {
    background-color: rgba(100, 100, 50, 0.95);
  }

  .sticky-note.color-green {
    background-color: rgba(34, 68, 34, 0.85);
  }

  .sticky-note.color-green .sticky-note-header {
    background-color: rgba(44, 88, 44, 0.95);
  }

  .sticky-note.color-blue {
    background-color: rgba(40, 60, 80, 0.85);
  }

  .sticky-note.color-blue .sticky-note-header {
    background-color: rgba(50, 75, 100, 0.95);
  }

  .sticky-note.color-red {
    background-color: rgba(80, 40, 40, 0.85);
  }

  .sticky-note.color-red .sticky-note-header {
    background-color: rgba(100, 50, 50, 0.95);
  }

  .sticky-note.color-gray {
    background-color: rgba(60, 60, 60, 0.85);
  }

  .sticky-note.color-gray .sticky-note-header {
    background-color: rgba(80, 80, 80, 0.95);
  }
}`;

  const heroicons = {
    close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>`,
    expand: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
</svg>`,
  };

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

  // Function to collapse multiple consecutive newlines into single newlines
  const collapseMultipleNewlines = (text) => {
    if (!text) return '';

    // Replace multiple consecutive newlines (3 or more) with two newlines
    return text.replace(/\n{3,}/g, '\n\n');
  };

  let notes = {};
  const debouncedSaveNotes = debounce(() => saveNotes(), 300);
  let stickyNotesContainer = null;
  let shadowRoot = null; // Shadow DOM root
  let shadowHost = null; // Shadow DOM host element
  let isDragging = false;
  let lastEditTimestamp = {}; // Track last edit time for each note
  let isActivelyEditing = {}; // Track which notes are being actively edited
  // Plain text contenteditable editor; no TinyMDE instances needed

  // === Edge Alignment Functions ===

  // Function to determine which edge a note should align to
  const determineEdgeAlignment = (x, width, viewportWidth) => {
    const noteRight = x + width;
    const distanceToLeft = x;
    const distanceToRight = viewportWidth - noteRight;

    return distanceToLeft <= distanceToRight ? 'left' : 'right';
  };

  // Function to convert absolute positioning to edge-based positioning
  const convertToEdgePosition = (noteElement, noteData) => {
    const rect = noteElement.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const noteWidth = rect.width;

    const edge = determineEdgeAlignment(rect.left, noteWidth, viewportWidth);

    if (edge === 'left') {
      return {
        left: rect.left + 'px',
        right: null,
        edge: 'left',
      };
    } else {
      return {
        left: null,
        right: viewportWidth - rect.right + 'px',
        edge: 'right',
      };
    }
  };

  // Function to apply edge-based positioning to a note element
  const applyEdgePosition = (noteElement, noteData) => {
    if (
      noteData.edge === 'right' &&
      noteData.right !== null &&
      noteData.right !== undefined
    ) {
      noteElement.style.left = 'auto';
      noteElement.style.right = noteData.right;
    } else {
      noteElement.style.left = noteData.left || '0px';
      noteElement.style.right = 'auto';
    }
    noteElement.style.top = noteData.top || '0px';
  };

  // Function to update all notes positions on window resize
  const updateNotesOnResize = () => {
    if (!shadowRoot) return;

    const noteElements = shadowRoot.querySelectorAll('.sticky-note');
    let hasChanges = false;

    noteElements.forEach((noteElement) => {
      const id = noteElement.getAttribute('data-id');
      if (!notes[id]) return;

      const currentRect = noteElement.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const noteWidth = currentRect.width;

      const newEdge = determineEdgeAlignment(
        currentRect.left,
        noteWidth,
        viewportWidth,
      );
      const currentEdge = notes[id].edge || 'left';

      // If edge alignment should change, update the note
      if (newEdge !== currentEdge) {
        const newPosition = convertToEdgePosition(noteElement, notes[id]);

        // Update note data
        notes[id].left = newPosition.left;
        notes[id].right = newPosition.right;
        notes[id].edge = newPosition.edge;

        // Apply new positioning
        applyEdgePosition(noteElement, notes[id]);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      debouncedSaveNotes();
    }
  };

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
      console.log('Initializing sticky notes container');

      // Create Shadow DOM host element
      shadowHost = document.createElement('div');
      shadowHost.classList.add('sunny-bear-excluded');
      shadowHost.style.cssText =
        'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483647;';

      // Create Shadow DOM
      shadowRoot = shadowHost.attachShadow({ mode: 'closed' });

      // Inject CSS into Shadow DOM
      const style = document.createElement('style');
      style.textContent = CSS_CONTENT;
      shadowRoot.appendChild(style);

      // Create the sticky notes container inside Shadow DOM
      stickyNotesContainer = document.createElement('div');
      stickyNotesContainer.classList.add(
        'sticky-notes-container',
        'sunny-bear-excluded',
      );
      shadowRoot.appendChild(stickyNotesContainer);

      // Append shadow host to document body
      document.body.appendChild(shadowHost);

      // Apply scaling based on unified DPR when container is first created
      applyContainerScale();

      console.log('Sticky notes container initialized successfully');
    }
  };

  // Function to migrate existing notes to edge-based positioning
  const migrateNotesToEdgePositioning = () => {
    let hasChanges = false;

    for (const id in notes) {
      const note = notes[id];

      // If note doesn't have edge property, migrate it
      if (!note.edge && note.left) {
        const leftValue = parseInt(note.left);
        const viewportWidth = window.innerWidth;
        const noteWidth = parseInt(note.width) || 200;

        const edge = determineEdgeAlignment(
          leftValue,
          noteWidth,
          viewportWidth,
        );

        if (edge === 'left') {
          note.edge = 'left';
          note.right = null;
        } else {
          note.edge = 'right';
          note.right = viewportWidth - leftValue - noteWidth + 'px';
          note.left = null;
        }

        hasChanges = true;
      }
    }

    if (hasChanges) {
      saveNotes();
    }
  };

  const loadNotes = () => {
    try {
      initializeStickyNotesContainer();
      chrome.storage.sync.get('notes', (data) => {
        if (chrome.runtime.lastError) {
          console.error(
            'Error loading notes from storage:',
            chrome.runtime.lastError,
          );
          return;
        }

        if (data.notes) {
          notes = data.notes;
          migrateNotesToEdgePositioning();
          renderNotes();
          console.log('Loaded', Object.keys(notes).length, 'sticky notes');
        } else {
          console.log('No existing sticky notes found');
        }
      });
    } catch (error) {
      console.error('Error in loadNotes:', error);
    }
  };

  const renderNotes = () => {
    initializeStickyNotesContainer();
    const existingNotes = shadowRoot.querySelectorAll('.sticky-note');
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
    console.log('createNoteElement called with ID:', id, 'note:', note);

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

    console.log(
      'Note element created with classes:',
      noteElement.classList.toString(),
    );

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

    // If note starts minimized, initialize header text with content preview
    if (note.minimized) {
      const content = note.content || '';
      const plainText = stripMarkdown(content);
      headerText.innerText =
        plainText.substring(0, 30) + (plainText.length > 30 ? '...' : '');
    }

    // Create color dropdown
    const colorDropdown = createColorDropdown(
      id,
      note.backgroundColor || 'yellow',
    );

    const expandButton = document.createElement('button');
    expandButton.classList.add('expand-note', 'sticky-note-header-button');
    expandButton.innerHTML = heroicons.expand;
    expandButton.addEventListener('click', () => expandNoteToContent(id));

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-note', 'sticky-note-header-button');
    deleteButton.innerHTML = heroicons.close;
    deleteButton.addEventListener('click', () => deleteNote(id));

    noteHeader.appendChild(headerText);
    noteHeader.appendChild(colorDropdown);
    noteHeader.appendChild(expandButton);
    noteHeader.appendChild(deleteButton);

    // Create content container
    const noteContent = document.createElement('div');
    noteContent.classList.add('sticky-note-content');
    noteContent.setAttribute('tabindex', '0'); // Make it focusable

    // Create plain text contenteditable editor
    const editor = document.createElement('div');
    editor.classList.add('sticky-note-editor');
    editor.setAttribute('contenteditable', 'true');
    editor.textContent = note.content || '';
    noteContent.appendChild(editor);

    // Create rendered markdown view (hidden by default)
    const rendered = document.createElement('div');
    rendered.classList.add('sticky-note-rendered');
    rendered.style.display = 'none';
    noteContent.appendChild(rendered);

    // Open links in rendered view in a new tab and prevent entering edit mode
    rendered.addEventListener('click', (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      const anchor = target?.closest('a');
      if (anchor) {
        e.preventDefault();
        e.stopPropagation();
        let href = anchor.getAttribute('href');
        if (href) {
          if (!href.startsWith('http')) {
            href = 'https://' + href;
          }
          window.open(href, '_blank');
        }
      }
    });

    // Helper to render markdown and show rendered view
    const showRendered = () => {
      // Collapse multiple newlines when leaving edit mode
      const currentContent = editor.textContent || '';
      const collapsedContent = collapseMultipleNewlines(currentContent);
      if (collapsedContent !== currentContent) {
        editor.textContent = collapsedContent;
        // Update the note content in storage
        updateNoteContent(id, collapsedContent);
      }

      try {
        const md = notes[id]?.content ?? editor.innerText ?? '';
        // Use bundled marked library if present on globalThis
        const g = /** @type {any} */ (globalThis);
        const html = g?.BundledCode?.marked
          ? g.BundledCode.marked.parse(md)
          : md;
        rendered.innerHTML = html;
      } catch {
        rendered.textContent = notes[id]?.content ?? editor.innerText ?? '';
      }
      rendered.style.display = 'block';
      editor.style.display = 'none';
    };

    // Helper to show plain editor
    const showEditor = () => {
      // Collapse multiple newlines when entering edit mode
      const currentContent = editor.textContent || '';
      const collapsedContent = collapseMultipleNewlines(currentContent);
      if (collapsedContent !== currentContent) {
        editor.textContent = collapsedContent;
        // Update the note content in storage
        updateNoteContent(id, collapsedContent);
      }

      rendered.style.display = 'none';
      editor.style.display = 'block';
    };

    const handleEditorChange = () => {
      const content = editor.innerText;
      lastEditTimestamp[id] = Date.now();
      isActivelyEditing[id] = true;
      updateNoteContent(id, content);
      setTimeout(() => {
        isActivelyEditing[id] = false;
      }, 1000);
    };

    // Input events
    editor.addEventListener('input', () => handleEditorChange());

    // Prevent events from bubbling to the page
    editor.addEventListener('keydown', (e) => {
      e.stopPropagation();
    });
    editor.addEventListener('keyup', (e) => {
      e.stopPropagation();
    });
    editor.addEventListener('keypress', (e) => {
      e.stopPropagation();
    });

    // Maintain focus and z-order
    editor.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      bringToFront(id);
    });
    editor.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Toggle rendered view when editor loses focus
    // When the editor loses focus, schedule a render. Using a small timeout
    // avoids races with immediate focus shifts within the note (e.g., header buttons)
    editor.addEventListener('blur', () => {
      setTimeout(() => {
        const active = document.activeElement;
        const stillInThisNote = active && noteElement.contains(active);
        const isHeaderButton = active && noteHeader.contains(active);
        if (!stillInThisNote || isHeaderButton) {
          showRendered();
        }
      }, 0);
    });

    // When the note is showing rendered markdown, clicking on the content area
    // (except on anchors inside rendered view) switches back to editor
    noteElement.addEventListener('click', (e) => {
      const isRenderedVisible = rendered.style.display !== 'none';
      if (!isRenderedVisible) return;
      const t = /** @type {HTMLElement} */ (e.target);

      // Don't focus editor if click is on the header
      if (t && noteHeader.contains(t)) {
        return;
      }

      if (t && rendered.contains(t) && t.closest('a')) {
        // Anchor click handled separately
        return;
      }
      showEditor();
      // Focus editor after switching
      try {
        /** @type {HTMLElement} */ (editor).focus();
      } catch {}
    });

    // Paste as plain text only
    editor.addEventListener('paste', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const text = (
        e.clipboardData || /** @type {any} */ (window).clipboardData
      ).getData('text');
      try {
        if (
          document.queryCommandSupported &&
          document.queryCommandSupported('insertText')
        ) {
          document.execCommand('insertText', false, text);
        } else {
          const selection = window.getSelection();
          if (!selection || selection.rangeCount === 0) return;
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(text));
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } catch {}
      // Trigger save after paste
      handleEditorChange();
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
    showRendered();

    console.log('✅ createNoteElement completed successfully for ID:', id);
  };

  const bringToFront = (id) => {
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

      // During drag, ensure we use left positioning for smooth dragging
      // If the element is currently positioned using 'right', convert to 'left' without jumping
      if (element.style.right !== 'auto' && element.style.right !== '') {
        const rect = element.getBoundingClientRect();
        element.style.left = rect.left + 'px';
      }
      element.style.right = 'auto';

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
        // Convert current position to edge-based positioning
        const newPosition = convertToEdgePosition(element, notes[id]);
        notes[id].left = newPosition.left;
        notes[id].right = newPosition.right;
        notes[id].edge = newPosition.edge;
        notes[id].top = element.style.top;

        // Apply the edge-based positioning
        applyEdgePosition(element, notes[id]);

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
    const noteElement = shadowRoot.querySelector(
      `.sticky-note[data-id='${id}']`,
    );
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
      const noteElement = shadowRoot.querySelector(
        `.sticky-note[data-id='${id}']`,
      );
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

  const expandNoteToContent = (id) => {
    const noteElement = shadowRoot.querySelector(
      `.sticky-note[data-id='${id}']`,
    );
    if (!noteElement || !notes[id]) return;

    // Get the content area
    const noteContent = noteElement.querySelector('.sticky-note-content');
    if (!noteContent) return;

    // Measure content height of the visible view (editor or rendered)
    const editor = /** @type {HTMLDivElement} */ (
      noteContent.querySelector('.sticky-note-editor')
    );
    const rendered = /** @type {HTMLDivElement} */ (
      noteContent.querySelector('.sticky-note-rendered')
    );
    const editorVisible =
      editor && window.getComputedStyle(editor).display !== 'none';
    const target = editorVisible && editor ? editor : rendered || editor;
    let contentHeight = target ? target.scrollHeight : 0;

    if (contentHeight > 0) {
      // Add some padding for the header and a bit of extra space
      const headerHeight = 20; // Height of the sticky note header
      const padding = 20; // Extra padding for better visual appearance
      const newHeight = Math.max(contentHeight + headerHeight + padding, 100); // Minimum height of 100px

      // Update the note element height
      /** @type {HTMLElement} */ (noteElement).style.height = newHeight + 'px';

      // Update the stored height
      if (notes[id]) {
        notes[id].height = newHeight + 'px';
        debouncedSaveNotes();
      }
    }
  };

  const deleteNote = (id) => {
    delete notes[id];
    delete lastEditTimestamp[id];
    delete isActivelyEditing[id];
    saveNotes();
    const noteElement = shadowRoot.querySelector(
      `.sticky-note[data-id='${id}']`,
    );
    if (noteElement) {
      noteElement.remove();
    }
  };

  const saveNotes = () => {
    chrome.storage.sync.set({ notes });
  };

  // Function to get the currently focused note ID
  const getFocusedNoteId = () => {
    // Check for focused contenteditable editor
    const focusedEditor = shadowRoot.querySelector(
      '.sticky-note-content .sticky-note-editor:focus',
    );
    if (focusedEditor) {
      const noteElement = focusedEditor.closest('.sticky-note');
      if (noteElement) {
        return noteElement.getAttribute('data-id');
      }
    }

    // Check for any focused content container
    const focusedContent = shadowRoot.querySelector(
      '.sticky-note-content:focus',
    );
    if (focusedContent) {
      const noteElement = focusedContent.closest('.sticky-note');
      if (noteElement) {
        return noteElement.getAttribute('data-id');
      }
    }

    return null;
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'focus_note') {
      console.log(`Received focus_note message for note: ${message.id}`);

      const attemptMessageFocus = (attempt = 1) => {
        console.log(`Message focus attempt ${attempt} for note ${message.id}`);

        const noteElement = shadowRoot.querySelector(
          `.sticky-note[data-id='${message.id}']`,
        );

        // Check if note is ready for focus
        if (noteElement && !noteElement.hasAttribute('data-ready')) {
          console.log(
            `Note ${message.id} not ready yet, marking for pending focus`,
          );
          noteElement.setAttribute('data-pending-focus', 'true');
          return;
        }

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
    } else if (message.action === 'delete_focused_note') {
      const focusedNoteId = getFocusedNoteId();
      if (focusedNoteId) {
        deleteNote(focusedNoteId);
        sendResponse({ success: true, deletedNoteId: focusedNoteId });
      } else {
        sendResponse({ success: false, error: 'No note is currently focused' });
      }
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    try {
      console.log(
        'Storage change event received, namespace:',
        namespace,
        'changes:',
        changes,
      );
      if (changes.notes) {
        console.log('Storage changed - notes updated');
        const oldNotes = changes.notes.oldValue || {};
        const newNotes = changes.notes.newValue || {};
        console.log('Old notes count:', Object.keys(oldNotes).length);
        console.log('New notes count:', Object.keys(newNotes).length);
        notes = newNotes; // Keep local notes object in sync

        // Handle deleted notes
        for (const id in oldNotes) {
          if (!newNotes[id]) {
            // No editor instances to clean up with contenteditable
            delete lastEditTimestamp[id];
            delete isActivelyEditing[id];

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
          console.log('Processing note:', id, 'data:', noteData);
          let noteElement = /** @type {HTMLDivElement} */ (
            shadowRoot.querySelector(`.sticky-note[data-id='${id}']`)
          );

          if (!noteElement) {
            // Note was added
            console.log('Creating new note element for ID:', id);
            initializeStickyNotesContainer();
            createNoteElement(id, noteData);
            console.log(
              'Note element created, checking if it exists in DOM...',
            );

            // Verify the note was actually created
            const createdElement = shadowRoot.querySelector(
              `.sticky-note[data-id='${id}']`,
            );
            if (createdElement) {
              console.log(
                '✅ Note element successfully created and found in DOM',
              );
            } else {
              console.error(
                '❌ Note element was not found in DOM after creation',
              );
            }

            // Auto-focus newly created notes - wait for the note to be ready

            // Check if the note element is ready for focus
            const noteElement = shadowRoot.querySelector(
              `.sticky-note[data-id='${id}']`,
            );
            if (noteElement && noteElement.hasAttribute('data-ready')) {
              // Note is ready, focus immediately
              setTimeout(() => focusNote(id), 10);
            } else if (noteElement) {
              // Note is not ready yet, mark it for pending focus
              noteElement.setAttribute('data-pending-focus', 'true');
            } else {
              // Note element doesn't exist yet, retry
              setTimeout(() => {
                const retryNoteElement = shadowRoot.querySelector(
                  `.sticky-note[data-id='${id}']`,
                );
                if (retryNoteElement) {
                  if (retryNoteElement.hasAttribute('data-ready')) {
                    setTimeout(() => focusNote(id), 10);
                  } else {
                    retryNoteElement.setAttribute('data-pending-focus', 'true');
                  }
                }
              }, 50);
            }
          } else {
            // Note was updated, update position and z-index only if not currently dragging
            if (!isDragging) {
              applyEdgePosition(noteElement, noteData);
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
            const currentNoteElement = shadowRoot.querySelector(
              `.sticky-note[data-id='${id}']`,
            );
            const editor = currentNoteElement
              ? currentNoteElement.querySelector('.sticky-note-editor')
              : null;

            // Check if we should update the content
            const shouldUpdate =
              !isActivelyEditing[id] &&
              noteData.lastEditTimestamp &&
              noteData.lastEditTimestamp > (lastEditTimestamp[id] || 0);

            if (
              shouldUpdate &&
              editor &&
              editor.textContent !== noteData.content
            ) {
              const wasFocused = document.activeElement === editor;
              let selectionOffset = 0;
              if (wasFocused) {
                const selection = window.getSelection();
                if (selection && selection.anchorNode) {
                  selectionOffset = selection.anchorOffset;
                }
              }
              editor.textContent = noteData.content || '';
              lastEditTimestamp[id] = noteData.lastEditTimestamp || Date.now();
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
          }
        }
      }
    } catch (error) {
      console.error('Error in storage change listener:', error);
    }
  });

  // Function to focus a specific note by ID
  const focusNote = (id) => {
    const noteElement = shadowRoot.querySelector(
      `.sticky-note[data-id='${id}']`,
    );

    if (document.visibilityState !== 'visible') {
      console.log(`Document is not visible, skipping focus for note ${id}`);
      return false;
    }

    if (!noteElement) {
      console.log(`Note element not found for id: ${id}`);
      return false;
    }

    // Check if the note is ready for focus
    if (!noteElement.hasAttribute('data-ready')) {
      console.log(`Note ${id} not ready for focus yet`);
      return false;
    }

    // Ensure the editor view is visible before attempting to focus
    try {
      const editorEl = noteElement.querySelector('.sticky-note-editor');
      const renderedEl = noteElement.querySelector('.sticky-note-rendered');
      if (editorEl && renderedEl) {
        const isRenderedVisible =
          window.getComputedStyle(/** @type {HTMLElement} */ (renderedEl))
            .display !== 'none';
        if (isRenderedVisible) {
          /** @type {HTMLElement} */ (renderedEl).style.display = 'none';
          /** @type {HTMLElement} */ (editorEl).style.display = 'block';
        }
      }
    } catch {}

    // Try multiple focus strategies
    let focused = false;

    // Strategy 1: Focus contenteditable editor directly
    if (!focused) {
      const editor = noteElement.querySelector('.sticky-note-editor');
      if (editor) {
        try {
          /** @type {HTMLElement} */ (editor).focus();
          const range = document.createRange();
          range.selectNodeContents(editor);
          range.collapse(false);
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          focused = true;
        } catch (error) {}
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

    // Strategy 5: Simulate click on the editor area to activate it
    if (!focused) {
      const clickTarget =
        noteElement.querySelector('.sticky-note-editor') ||
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
          if (/** @type {any} */ (clickTarget).focus) {
            /** @type {any} */ (clickTarget).focus();
          }

          focused = true;
          console.log(`Simulated click and focus worked for note ${id}`);
        } catch (error) {
          console.log(`Simulated click failed for note ${id}:`, error);
        }
      }
    }

    // Strategy 6: Force focus with selection manipulation on editor
    if (!focused) {
      const editor = noteElement.querySelector('.sticky-note-editor');
      if (editor) {
        try {
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(editor);
          range.collapse(false);
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
          }
          /** @type {HTMLElement} */ (editor).focus();
          focused = true;
        } catch (error) {}
      }
    }

    return focused;
  };

  // Function to blur all focused sticky notes and clear editing flags
  const blurAllStickyNotes = () => {
    // Blur any focused contenteditable editors
    const focusedEditors = shadowRoot.querySelectorAll(
      '.sticky-note-content .sticky-note-editor:focus',
    );
    focusedEditors.forEach((editor) => {
      /** @type {HTMLElement} */ (editor).blur();
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
    } else {
      // Tab became visible: refresh notes from storage and re-render
      chrome.storage.sync.get('notes', (data) => {
        notes = data.notes || {};
        renderNotes();
      });
    }
  });

  // Additional safeguard for window blur events
  window.addEventListener('blur', () => {
    blurAllStickyNotes();
  });

  // Close color dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!shadowRoot) return;
    const dropdowns = shadowRoot.querySelectorAll('.color-dropdown-menu.show');
    dropdowns.forEach((dropdown) => {
      const colorDropdown = dropdown.closest('.color-dropdown');
      const target = /** @type {Node} */ (e.target);
      // Check if click is outside shadow DOM or outside the dropdown
      if (colorDropdown && target && !colorDropdown.contains(target)) {
        dropdown.classList.remove('show');
      }
    });
  });

  // Also close dropdowns on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shadowRoot) {
      const dropdowns = shadowRoot.querySelectorAll(
        '.color-dropdown-menu.show',
      );
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove('show');
      });
    }
  });

  // Mouse edge detection for toggling sticky notes collapse
  let isNearLeftEdge = false; // Track if mouse is currently near left edge
  let isNearRightEdge = false; // Track if mouse is currently near right edge

  const handleMouseMove = (e) => {
    const mouseX = e.clientX;
    const viewportWidth = window.innerWidth;

    const isCurrentlyNearLeftEdge = mouseX < 20; // Within 20px of left edge
    const isCurrentlyNearRightEdge = mouseX > viewportWidth - 20; // Within 20px of right edge

    // Handle left edge
    if (isCurrentlyNearLeftEdge && !isNearLeftEdge) {
      isNearLeftEdge = true;

      if (stickyNotesContainer) {
        if (stickyNotesContainer.classList.contains('collapsed')) {
          stickyNotesContainer.classList.remove('collapsed');
          setTimeout(
            () => stickyNotesContainer.classList.remove('collapsing'),
            300,
          );
        } else {
          stickyNotesContainer.classList.add('collapsed');
          stickyNotesContainer.classList.add('collapsing');
        }
      }
    } else if (!isCurrentlyNearLeftEdge && isNearLeftEdge) {
      isNearLeftEdge = false;
    }

    // Handle right edge
    if (isCurrentlyNearRightEdge && !isNearRightEdge) {
      isNearRightEdge = true;

      if (stickyNotesContainer) {
        if (stickyNotesContainer.classList.contains('collapsed')) {
          stickyNotesContainer.classList.remove('collapsed');
          setTimeout(
            () => stickyNotesContainer.classList.remove('collapsing'),
            300,
          );
        } else {
          stickyNotesContainer.classList.add('collapsed');
          stickyNotesContainer.classList.add('collapsing');
        }
      }
    } else if (!isCurrentlyNearRightEdge && isNearRightEdge) {
      isNearRightEdge = false;
    }
  };

  // Add mouse move listener to document
  document.addEventListener('mousemove', handleMouseMove);

  // Add some debugging info
  console.log('Sticky Bear content script loaded');
  console.log('Chrome runtime available:', !!chrome.runtime);
  console.log('Chrome storage available:', !!chrome.storage);

  loadNotes();
})();
