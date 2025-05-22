console.log("Mindful Pet background script starting");

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Mindful Pet Extension Installed");
  
  // Initialize storage with default values
  chrome.storage.local.set({ 
    screenLimit: 0.5, // 30 minutes for testing
    dailyUsage: 0,
    lastResetDate: new Date().toDateString(),
    petPosition: { bottom: '20px', right: '20px' } // Default position
  }, () => {
    console.log("Default settings initialized");
  });
});

// Track window focus to coordinate across tabs
let isWindowFocused = true;

chrome.windows.onFocusChanged.addListener((windowId) => {
  isWindowFocused = windowId !== chrome.windows.WINDOW_ID_NONE;
  console.log("Window focus changed:", isWindowFocused);
});

// Reset daily usage at midnight
chrome.alarms.create("dailyReset", {
  delayInMinutes: 1,
  periodInMinutes: 60 // Check every hour
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "dailyReset") {
    const today = new Date().toDateString();
    
    chrome.storage.local.get(['lastResetDate'], (result) => {
      if (result.lastResetDate !== today) {
        chrome.storage.local.set({
          dailyUsage: 0,
          lastResetDate: today
        }, () => {
          console.log("Daily usage reset for new day:", today);
        });
      }
    });
  }
});

console.log("Background script initialized");