// devicePixelRatio.js - Module for handling device pixel ratio management

// Device pixel ratio management
let maxDevicePixelRatio = 1;
const DEVICE_PIXEL_RATIO_MAX = 2;

// Handle device pixel ratio updates
export const handleDevicePixelRatio = (message, sender) => {
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
    return true; // Indicates this message was handled
  }
  return false; // Indicates this message was not handled
};

// Get current max device pixel ratio
export const getMaxDevicePixelRatio = () => maxDevicePixelRatio;
