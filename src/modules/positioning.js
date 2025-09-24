// positioning.js - Module for handling note positioning and overlap detection

// Function to parse position string to number (e.g., "100px" -> 100)
export const parsePosition = (posStr) => {
  if (!posStr || posStr === null || posStr === undefined) {
    return 0;
  }
  if (typeof posStr === 'number') {
    return posStr;
  }
  return parseInt(String(posStr).replace('px', ''), 10) || 0;
};

// Function to check if two rectangles overlap
export const rectanglesOverlap = (rect1, rect2) => {
  return !(
    rect1.right <= rect2.left ||
    rect2.right <= rect1.left ||
    rect1.bottom <= rect2.top ||
    rect2.bottom <= rect1.top
  );
};

// Function to find a non-overlapping position for a new note
export const findNonOverlappingPosition = (
  existingNotes,
  viewportWidth = 1400,
) => {
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
