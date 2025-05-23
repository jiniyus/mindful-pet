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

// Listen for tab updates to ensure pet appears on new pages
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // When a tab finishes loading, inject the content script if needed
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    // Small delay to ensure page is ready
    setTimeout(() => {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        function: checkAndInjectPet
      }).catch(err => {
        // Ignore errors for pages where we can't inject (like chrome:// pages)
        console.log("Could not inject into tab:", err.message);
      });
    }, 1000);
  }
});

// Function to check if pet exists and inject if needed
function checkAndInjectPet() {
  // Only run if pet doesn't already exist
  if (!document.getElementById('mindful-pet-container')) {
    // Re-run the content script
    if (!window.mindfulPetActive) {
      // This will be injected inline, so we need to load the actual content script
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('content.js');
      document.head.appendChild(script);
    }
  }
}

// Listen for tab activation (switching between tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log("Tab activated:", activeInfo.tabId);
  
  // Ensure pet is visible on the newly activated tab
  setTimeout(() => {
    chrome.scripting.executeScript({
      target: { tabId: activeInfo.tabId },
      function: checkAndInjectPet
    }).catch(err => {
      console.log("Could not inject into activated tab:", err.message);
    });
  }, 500);
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