// dom.js - Module for Shadow DOM setup and container management

import { CSS_CONTENT } from './constants.js';

let stickyNotesContainer = null;
let shadowRoot = null; // Shadow DOM root
let shadowHost = null; // Shadow DOM host element

// Device pixel ratio management
const localDpr = window.devicePixelRatio;
let unifiedDpr = localDpr; // Will be updated from background script

// Get DOM references
export const getStickyNotesContainer = () => stickyNotesContainer;
export const getShadowRoot = () => shadowRoot;
export const getShadowHost = () => shadowHost;
export const getUnifiedDpr = () => unifiedDpr;

// Set unified DPR
export const setUnifiedDpr = (dpr) => {
  unifiedDpr = dpr;
};

// Apply scale to the sticky notes container so that logical sizes match unified DPR
export const applyContainerScale = () => {
  if (!stickyNotesContainer) return;
  const scale = unifiedDpr / window.devicePixelRatio;
  // console.log(
  //   'Applying container scale',
  //   scale,
  //   unifiedDpr,
  //   window.devicePixelRatio,
  // );
  stickyNotesContainer.style.transformOrigin = '0 0';
  stickyNotesContainer.style.transform = `scale(${scale})`;
  stickyNotesContainer.style.width = `${100 / scale}%`;
  stickyNotesContainer.style.height = `${100 / scale}%`;
};

// Initialize sticky notes container with Shadow DOM
export const initializeStickyNotesContainer = () => {
  if (!stickyNotesContainer) {
    // console.log('Initializing sticky notes container');

    // Create Shadow DOM host element
    shadowHost = document.createElement('div');
    shadowHost.classList.add('sunny-bear-excluded');
    shadowHost.style.cssText =
      'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483647; overflow: hidden;';

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

    // console.log('Sticky notes container initialized successfully');
  }
};

// Report current DPR to background (debounced for resize)
export const reportDpr = () => {
  chrome.runtime.sendMessage({
    action: 'device_pixel_ratio',
    dpr: window.devicePixelRatio,
  });
};
