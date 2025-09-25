// events.js - Module for event handlers, focus management, and user interactions

import { getShadowRoot, getStickyNotesContainer } from './dom.js';
import {
  getNotes,
  deleteNote,
  clearEditingData,
  setActivelyEditing,
  debouncedSaveNotes,
} from './storage.js';
import { removeNoteElement, updateHeaderText, clearHeaderText } from './ui.js';
import { getFirstLineForHeader } from './utils.js';
import { showEditor, showRendered } from './rendering.js';
import { getIsDragging } from './positioning.js';

// Focus management
export const focusNote = (id) => {
  const shadowRoot = getShadowRoot();
  const noteElement = shadowRoot.querySelector(`.sticky-note[data-id='${id}']`);

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

  // Strategy 2: Focus any focusable element in the note content
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

  // Strategy 3: Simulate click on the editor area to activate it
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

  return focused;
};

// Get the currently focused note ID
export const getFocusedNoteId = () => {
  const shadowRoot = getShadowRoot();

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
  const focusedContent = shadowRoot.querySelector('.sticky-note-content:focus');
  if (focusedContent) {
    const noteElement = focusedContent.closest('.sticky-note');
    if (noteElement) {
      return noteElement.getAttribute('data-id');
    }
  }

  return null;
};

// Blur all focused sticky notes and clear editing flags
export const blurAllStickyNotes = () => {
  const shadowRoot = getShadowRoot();

  // Blur any focused contenteditable editors
  const focusedEditors = shadowRoot.querySelectorAll(
    '.sticky-note-content .sticky-note-editor:focus',
  );
  focusedEditors.forEach((editor) => {
    /** @type {HTMLElement} */ (editor).blur();
  });

  // Clear actively editing flags for all notes
  const notes = getNotes();
  for (const id in notes) {
    setActivelyEditing(id, false);
  }
};

// Toggle minimize/maximize state
export const toggleMinimize = (id) => {
  const shadowRoot = getShadowRoot();
  const notes = getNotes();
  const noteElement = shadowRoot.querySelector(`.sticky-note[data-id='${id}']`);
  if (!noteElement || !notes[id]) return;

  const isMinimized = noteElement.classList.contains('minimized');

  if (isMinimized) {
    // Expand the note
    noteElement.classList.remove('minimized');
    notes[id].minimized = false;

    // Clear header text when expanding
    clearHeaderText(noteElement);
  } else {
    // Minimize the note
    noteElement.classList.add('minimized');
    notes[id].minimized = true;

    // Update header text with current content (first line only)
    const content = notes[id].content || '';
    updateHeaderText(noteElement, content);
  }

  debouncedSaveNotes();
};

// Expand note to fit content
export const expandNoteToContent = (id) => {
  const shadowRoot = getShadowRoot();
  const notes = getNotes();
  const noteElement = shadowRoot.querySelector(`.sticky-note[data-id='${id}']`);
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

// Delete note handler
export const handleDeleteNote = (id) => {
  try {
    const shadowRoot = getShadowRoot();
    let nextId = null;

    if (shadowRoot) {
      const noteElements = Array.from(
        shadowRoot.querySelectorAll('.sticky-note'),
      );
      const currentEl = shadowRoot.querySelector(
        `.sticky-note[data-id='${id}']`,
      );
      const currentIndex = currentEl ? noteElements.indexOf(currentEl) : -1;

      if (noteElements.length > 1 && currentIndex !== -1) {
        const nextIndex = (currentIndex + 1) % noteElements.length;
        const candidate = /** @type {HTMLElement} */ (noteElements[nextIndex]);
        const candidateId = candidate.getAttribute('data-id');
        if (candidateId && candidateId !== id) {
          nextId = candidateId;
        } else if (noteElements.length > 2) {
          // Fallback: try previous if wrap selects the same
          const prevIndex =
            (currentIndex - 1 + noteElements.length) % noteElements.length;
          const prev = /** @type {HTMLElement} */ (noteElements[prevIndex]);
          const prevId = prev.getAttribute('data-id');
          if (prevId && prevId !== id) {
            nextId = prevId;
          }
        }
      }
    }

    deleteNote(id);
    removeNoteElement(id);

    if (nextId) {
      // Slight delay to ensure DOM updates settle
      setTimeout(() => {
        try {
          focusNote(nextId);
        } catch {}
      }, 10);
    }
  } catch {
    deleteNote(id);
    removeNoteElement(id);
  }
};

// Setup global event listeners
export const setupGlobalEvents = () => {
  // Close color dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    const shadowRoot = getShadowRoot();
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

  // Keyboard navigation inside editor: Tab cycles notes, Escape blurs editor
  const handleEditorKeyNavigation = (e) => {
    try {
      const sr = getShadowRoot();
      if (!sr) return;
      const activeEl = /** @type {HTMLElement} */ (
        /** @type {any} */ (sr).activeElement
      );
      if (
        !activeEl ||
        !activeEl.classList ||
        !activeEl.classList.contains('sticky-note-editor')
      ) {
        return;
      }

      if (e.key === 'Tab') {
        // Move focus to next/previous sticky note editor
        e.preventDefault();
        e.stopPropagation();

        const notes = Array.from(sr.querySelectorAll('.sticky-note'));
        if (!notes.length) return;
        const currentNote = activeEl.closest('.sticky-note');
        if (!currentNote) return;
        const currentIndex = notes.indexOf(currentNote);
        if (currentIndex === -1) return;
        const direction = e.shiftKey ? -1 : 1;
        const nextIndex =
          (currentIndex + direction + notes.length) % notes.length;
        const targetNote = /** @type {HTMLElement} */ (notes[nextIndex]);
        const targetId = targetNote.getAttribute('data-id');

        if (targetId) {
          focusNote(targetId);
        }
        return;
      }

      if (e.key === 'Escape') {
        // Blur editor and let other Escape handlers run
        e.preventDefault();
        /** @type {HTMLElement} */ (activeEl).blur();
        return;
      }
    } catch {}
  };

  // Use capture so page-level handlers don't steal Tab navigation
  document.addEventListener('keydown', handleEditorKeyNavigation, true);

  // Capture-phase keyboard and clipboard guards to isolate editor from page handlers
  // Allow default browser behavior (copy/cut/select-all/etc.), but stop propagation
  // so page-level listeners (especially capture-phase) cannot cancel them.
  const stopIfInEditor = (e) => {
    try {
      const sr = getShadowRoot();
      if (!sr) return;

      // Determine if focus is currently inside the sticky note editor
      const activeEl = /** @type {any} */ (sr).activeElement;
      const isInEditor =
        activeEl &&
        activeEl.classList &&
        activeEl.classList.contains('sticky-note-editor');

      if (!isInEditor) return;

      // Do not interfere with Escape so existing handlers (e.g., closing menus) still run
      if (/** @type {KeyboardEvent} */ (e).key === 'Escape') return;

      // Only guard for common shortcut combos and clipboard events
      const ev = /** @type {KeyboardEvent} */ (e);
      const isShortcutCombo = !!(ev && (ev.metaKey || ev.ctrlKey));
      const isClipboardEvent = e.type === 'copy' || e.type === 'cut';

      if (isShortcutCombo || isClipboardEvent) {
        e.stopPropagation();
      }
    } catch {}
  };

  // Use capture to run before page-level listeners
  document.addEventListener('keydown', stopIfInEditor, true);
  document.addEventListener('keyup', stopIfInEditor, true);
  document.addEventListener('keypress', stopIfInEditor, true);
  document.addEventListener('copy', stopIfInEditor, true);
  document.addEventListener('cut', stopIfInEditor, true);

  // Also close dropdowns on escape key
  document.addEventListener('keydown', (e) => {
    const shadowRoot = getShadowRoot();
    if (e.key === 'Escape' && shadowRoot) {
      const dropdowns = shadowRoot.querySelectorAll(
        '.color-dropdown-menu.show',
      );
      dropdowns.forEach((dropdown) => {
        dropdown.classList.remove('show');
      });
    }
  });

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
};

// Mouse edge detection for toggling sticky notes collapse
let isNearLeftEdge = false; // Track if mouse is currently near left edge
let isNearRightEdge = false; // Track if mouse is currently near right edge

export const setupMouseEdgeDetection = () => {
  const handleMouseMove = (e) => {
    // Don't trigger collapsing during dragging or resizing
    if (getIsDragging()) {
      return;
    }

    const mouseX = e.clientX;
    const viewportWidth = window.innerWidth;
    const stickyNotesContainer = getStickyNotesContainer();

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
};
