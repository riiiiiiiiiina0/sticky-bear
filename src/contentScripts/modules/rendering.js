// rendering.js - Module for markdown rendering and editor/view switching

import { collapseMultipleNewlines } from './utils.js';
import {
  getNotes,
  updateNoteContent,
  setLastEditTimestamp,
  setActivelyEditing,
} from './storage.js';

// Create note content area with editor and rendered views
export const createNoteContent = (id, note, onContentChange) => {
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

  // Setup editor event handlers
  setupEditorEvents(editor, rendered, id, onContentChange);

  // Setup rendered view events
  setupRenderedEvents(rendered, editor);

  return { noteContent, editor, rendered };
};

// Setup editor event handlers
const setupEditorEvents = (editor, rendered, id, onContentChange) => {
  const handleEditorChange = () => {
    const content = editor.innerText;
    setLastEditTimestamp(id, Date.now());
    setActivelyEditing(id, true);
    updateNoteContent(id, content);
    if (onContentChange) {
      onContentChange(id, content);
    }
    setTimeout(() => {
      setActivelyEditing(id, false);
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

  // Toggle rendered view when editor loses focus
  editor.addEventListener('blur', () => {
    setTimeout(() => {
      const active = document.activeElement;
      const noteElement = editor.closest('.sticky-note');
      const noteHeader = noteElement?.querySelector('.sticky-note-header');
      const stillInThisNote = active && noteElement?.contains(active);
      const isHeaderButton = active && noteHeader?.contains(active);
      if (!stillInThisNote || isHeaderButton) {
        showRendered(editor, rendered);
      }
    }, 0);
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
};

// Setup rendered view event handlers
const setupRenderedEvents = (rendered, editor) => {
  // Open links in rendered view in a new tab
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
};

// Show rendered markdown view
export const showRendered = (editor, rendered) => {
  // Collapse multiple newlines when leaving edit mode
  const currentContent = editor.textContent || '';
  const collapsedContent = collapseMultipleNewlines(currentContent);
  if (collapsedContent !== currentContent) {
    editor.textContent = collapsedContent;
    // Update the note content in storage
    const noteElement = editor.closest('.sticky-note');
    const id = noteElement?.getAttribute('data-id');
    if (id) {
      updateNoteContent(id, collapsedContent);
    }
  }

  try {
    const noteElement = editor.closest('.sticky-note');
    const id = noteElement?.getAttribute('data-id');
    const notes = getNotes();
    const md = notes[id]?.content ?? editor.innerText ?? '';

    // Use bundled marked library if present on globalThis
    const g = /** @type {any} */ (globalThis);
    const html = g?.BundledCode?.marked ? g.BundledCode.marked.parse(md) : md;
    rendered.innerHTML = html;
  } catch {
    const noteElement = editor.closest('.sticky-note');
    const id = noteElement?.getAttribute('data-id');
    const notes = getNotes();
    rendered.textContent = notes[id]?.content ?? editor.innerText ?? '';
  }
  rendered.style.display = 'block';
  editor.style.display = 'none';
};

// Show plain editor
export const showEditor = (editor, rendered) => {
  // Collapse multiple newlines when entering edit mode
  const currentContent = editor.textContent || '';
  const collapsedContent = collapseMultipleNewlines(currentContent);
  if (collapsedContent !== currentContent) {
    editor.textContent = collapsedContent;
    // Update the note content in storage
    const noteElement = editor.closest('.sticky-note');
    const id = noteElement?.getAttribute('data-id');
    if (id) {
      updateNoteContent(id, collapsedContent);
    }
  }

  rendered.style.display = 'none';
  editor.style.display = 'block';
};

// Setup note content click handler for switching between views
export const setupNoteContentEvents = (
  noteElement,
  noteContent,
  editor,
  rendered,
  noteHeader,
) => {
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
    showEditor(editor, rendered);
    // Focus editor after switching
    try {
      /** @type {HTMLElement} */ (editor).focus();
    } catch {}
  });
};
