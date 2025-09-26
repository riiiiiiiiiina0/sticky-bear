// constants.js - Shared constants and CSS for content script modules

export const CSS_CONTENT = `.sticky-notes-container {
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
  /* Liquid glass effect will be applied via JavaScript */
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

/* Color variants - liquid glass effect applied via JavaScript */
/* Header colors for different note variants */
.sticky-note.color-yellow .sticky-note-header {
  background-color: rgba(240, 240, 180, 0.95);
}

.sticky-note.color-green .sticky-note-header {
  background-color: rgba(120, 200, 120, 0.95);
}

.sticky-note.color-blue .sticky-note-header {
  background-color: rgba(180, 210, 240, 0.95);
}

.sticky-note.color-red .sticky-note-header {
  background-color: rgba(240, 180, 180, 0.95);
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

.sticky-note.minimized .color-dropdown {
  display: none;
}

.sticky-note.minimized .expand-note {
  display: none;
}

.sticky-note.minimized .header-text {
  font-weight: bold;
}

/* Dark Mode Styles */
@media (prefers-color-scheme: dark) {
  .sticky-note {
    /* Liquid glass effect applied via JavaScript */
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

  /* Dark mode color variants - liquid glass effect applied via JavaScript */
  .sticky-note.color-yellow {
    color: #000;
  }

  .sticky-note.color-yellow .sticky-note-header {
    background-color: rgba(255, 213, 79, 0.95);
  }

  .sticky-note.color-yellow .header-text {
    color: #333;
  }

  .sticky-note.color-yellow .sticky-note-content .sticky-note-editor {
    color: #000;
  }

  .sticky-note.color-yellow .sticky-note-content .sticky-note-rendered {
    color: #000;
  }

  .sticky-note.color-green .sticky-note-header {
    background-color: rgba(44, 88, 44, 0.95);
  }

  .sticky-note.color-blue .sticky-note-header {
    background-color: rgba(50, 75, 100, 0.95);
  }

  .sticky-note.color-red .sticky-note-header {
    background-color: rgba(100, 50, 50, 0.95);
  }

  .sticky-note.color-gray .sticky-note-header {
    background-color: rgba(80, 80, 80, 0.95);
  }
}`;

export const HEROICONS = {
  close: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
</svg>`,
  expand: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
  <path stroke-linecap="round" stroke-linejoin="round" d="M3 7.5 7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
</svg>`,
};

export const COLORS = [
  { name: 'yellow', color: '#ffff99' },
  { name: 'green', color: '#90ee90' },
  { name: 'blue', color: '#99ccff' },
  { name: 'red', color: '#ff9999' },
  { name: 'gray', color: '#cccccc' },
];

export const COLOR_MAP = {
  yellow: '#ffff99',
  green: '#90ee90',
  blue: '#99ccff',
  red: '#ff9999',
  gray: '#cccccc',
};
