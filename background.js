// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Mindful Pet Extension Installed");
  
  // Set default screen time limit to 2 hours
  chrome.storage.local.set({ screenLimit: 2 });
  
  // Create alarm to reset daily usage at midnight
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight.getTime() - Date.now();
  
  chrome.alarms.create("resetDaily", {
    delayInMinutes: msUntilMidnight / 60000,
    periodInMinutes: 24 * 60 // Daily
  });
});

// Handle alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "resetDaily") {
    // Reset daily usage (we keep historical data by using dated keys)
    console.log("Daily reset triggered");
  }
});