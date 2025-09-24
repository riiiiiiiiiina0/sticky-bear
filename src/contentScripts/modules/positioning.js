// positioning.js - Module for note positioning, dragging, resizing, and viewport constraints

import { getShadowRoot, getUnifiedDpr } from './dom.js';
import { getNotes, debouncedSaveNotes } from './storage.js';

let isDragging = false;

// === Edge Alignment Functions ===

// Function to determine which edge a note should align to
export const determineEdgeAlignment = (x, width, viewportWidth) => {
  const noteRight = x + width;
  const distanceToLeft = x;
  const distanceToRight = viewportWidth - noteRight;

  return distanceToLeft <= distanceToRight ? 'left' : 'right';
};

// Function to convert absolute positioning to edge-based positioning
export const convertToEdgePosition = (noteElement, noteData) => {
  const rect = noteElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const noteWidth = rect.width;

  // Account for container scaling when converting positions
  const scale = getUnifiedDpr() / window.devicePixelRatio;
  const scaledLeft = rect.left / scale;
  const scaledRight = rect.right / scale;
  const scaledViewportWidth = viewportWidth / scale;

  const edge = determineEdgeAlignment(rect.left, noteWidth, viewportWidth);

  if (edge === 'left') {
    return {
      left: scaledLeft + 'px',
      right: null,
      edge: 'left',
    };
  } else {
    return {
      left: null,
      right: scaledViewportWidth - scaledRight + 'px',
      edge: 'right',
    };
  }
};

// Function to apply edge-based positioning to a note element
export const applyEdgePosition = (noteElement, noteData) => {
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
export const updateNotesOnResize = () => {
  const shadowRoot = getShadowRoot();
  if (!shadowRoot) return;

  const noteElements = shadowRoot.querySelectorAll('.sticky-note');
  const notes = getNotes();
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

  // Constrain all notes to new viewport boundaries
  constrainNotesToViewport();

  if (hasChanges) {
    debouncedSaveNotes();
  }
};

// Function to constrain note positions within viewport boundaries
export const constrainNotesToViewport = () => {
  const notes = getNotes();
  let hasChanges = false;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  for (const id in notes) {
    const note = notes[id];
    const noteWidth = parseInt(note.width) || 200;
    const noteHeight = parseInt(note.height) || 200;

    // Constrain top position
    const topValue = parseInt(note.top) || 0;
    const constrainedTop = Math.max(
      0,
      Math.min(topValue, viewportHeight - noteHeight),
    );
    if (constrainedTop !== topValue) {
      note.top = constrainedTop + 'px';
      hasChanges = true;
    }

    // Constrain horizontal position based on edge alignment
    if (note.edge === 'right' && note.right) {
      const rightValue = parseInt(note.right) || 0;
      const constrainedRight = Math.max(
        0,
        Math.min(rightValue, viewportWidth - noteWidth),
      );
      if (constrainedRight !== rightValue) {
        note.right = constrainedRight + 'px';
        hasChanges = true;
      }
    } else if (note.left) {
      const leftValue = parseInt(note.left) || 0;
      const constrainedLeft = Math.max(
        0,
        Math.min(leftValue, viewportWidth - noteWidth),
      );
      if (constrainedLeft !== leftValue) {
        note.left = constrainedLeft + 'px';
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    debouncedSaveNotes();
  }
};

// Function to migrate existing notes to edge-based positioning
export const migrateNotesToEdgePositioning = () => {
  const notes = getNotes();
  let hasChanges = false;

  for (const id in notes) {
    const note = notes[id];

    // If note doesn't have edge property, migrate it
    if (!note.edge && note.left) {
      const leftValue = parseInt(note.left);
      const viewportWidth = window.innerWidth;
      const noteWidth = parseInt(note.width) || 200;

      const edge = determineEdgeAlignment(leftValue, noteWidth, viewportWidth);

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

    // Also fix notes that might have been incorrectly saved as 'left' but should be 'right'
    else if (note.edge === 'left' && note.left && !note.right) {
      const leftValue = parseInt(note.left);
      const viewportWidth = window.innerWidth;
      const noteWidth = parseInt(note.width) || 200;

      // Re-evaluate edge alignment
      const correctEdge = determineEdgeAlignment(
        leftValue,
        noteWidth,
        viewportWidth,
      );

      if (correctEdge === 'right' && note.edge === 'left') {
        // Convert from left to right alignment
        note.edge = 'right';
        note.right = viewportWidth - leftValue - noteWidth + 'px';
        note.left = null;
        hasChanges = true;
      }
    }
  }

  if (hasChanges) {
    debouncedSaveNotes();
  }
};

// Make element draggable
export const makeDraggable = (element) => {
  let offsetX = 0;
  let offsetY = 0;
  const header = element.querySelector('.sticky-note-header');

  header.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    isDragging = true;

    // Get scale factor for coordinate calculations
    const scale = getUnifiedDpr() / window.devicePixelRatio;

    // During drag, ensure we use left positioning for smooth dragging
    // If the element is currently positioned using 'right', convert to 'left' without jumping
    if (element.style.right !== 'auto' && element.style.right !== '') {
      const rect = element.getBoundingClientRect();
      // Use the actual current position from getBoundingClientRect for accurate conversion
      element.style.left = rect.left / scale + 'px';
      element.style.right = 'auto';
    }

    // Calculate offset between mouse and element's top-left corner
    const rect = element.getBoundingClientRect();
    offsetX = (e.clientX - rect.left) / scale;
    offsetY = (e.clientY - rect.top) / scale;

    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();

    // Account for container scaling
    const scale = getUnifiedDpr() / window.devicePixelRatio;

    // Calculate new position based on mouse position minus offset, accounting for scale
    let newLeft = (e.clientX - offsetX) / scale;
    let newTop = (e.clientY - offsetY) / scale;

    // Get viewport dimensions and element dimensions for boundary checking
    const viewportWidth = window.innerWidth / scale;
    const viewportHeight = window.innerHeight / scale;
    const elementRect = element.getBoundingClientRect();
    const elementWidth = elementRect.width / scale;
    const elementHeight = elementRect.height / scale;

    // Apply viewport boundary constraints
    newLeft = Math.max(0, Math.min(newLeft, viewportWidth - elementWidth));
    newTop = Math.max(0, Math.min(newTop, viewportHeight - elementHeight));

    element.style.left = newLeft + 'px';
    element.style.top = newTop + 'px';
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
    isDragging = false;
    const id = element.getAttribute('data-id');
    const notes = getNotes();
    if (notes[id]) {
      // Determine which edge this note should be aligned to based on its final position
      const rect = element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const noteWidth = rect.width;

      // Determine if note is closer to left or right edge
      const edge = determineEdgeAlignment(rect.left, noteWidth, viewportWidth);

      if (edge === 'left') {
        // Save as left-aligned
        notes[id].left = element.style.left;
        notes[id].right = null;
        notes[id].edge = 'left';
        element.style.right = 'auto';
      } else {
        // Convert to right-aligned positioning
        const scale = getUnifiedDpr() / window.devicePixelRatio;
        const rightDistance = (viewportWidth - rect.right) / scale;
        notes[id].left = null;
        notes[id].right = rightDistance + 'px';
        notes[id].edge = 'right';
        element.style.left = 'auto';
        element.style.right = rightDistance + 'px';
      }

      notes[id].top = element.style.top;
      debouncedSaveNotes();
    }
  }
};

// Make element resizable
export const makeResizable = (element, resizeHandle) => {
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

    // Account for container scaling when calculating resize
    const scale = getUnifiedDpr() / window.devicePixelRatio;
    const scaledDeltaX = (e.clientX - startX) / scale;
    const scaledDeltaY = (e.clientY - startY) / scale;

    const newWidth = startWidth + scaledDeltaX;
    const newHeight = startHeight + scaledDeltaY;

    // Set minimum dimensions
    const minWidth = 150;
    const minHeight = 100;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get current element position
    const elementRect = element.getBoundingClientRect();
    // Account for container scaling when calculating boundaries
    const scaledElementLeft = elementRect.left / scale;
    const scaledElementTop = elementRect.top / scale;
    const scaledViewportWidth = viewportWidth / scale;
    const scaledViewportHeight = viewportHeight / scale;

    // Calculate maximum allowed dimensions based on viewport boundaries
    const maxWidth = scaledViewportWidth - scaledElementLeft;
    const maxHeight = scaledViewportHeight - scaledElementTop;

    // Apply constraints: minimum dimensions and viewport boundaries
    const constrainedWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
    const constrainedHeight = Math.max(
      minHeight,
      Math.min(newHeight, maxHeight),
    );

    if (constrainedWidth >= minWidth) {
      element.style.width = constrainedWidth + 'px';
    }
    if (constrainedHeight >= minHeight) {
      element.style.height = constrainedHeight + 'px';
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
    const notes = getNotes();
    if (notes[id]) {
      notes[id].width = element.style.width;
      notes[id].height = element.style.height;
      debouncedSaveNotes();
    }
  }
};

// Get dragging state
export const getIsDragging = () => isDragging;
