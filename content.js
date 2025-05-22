// Clean implementation - no old code references
(function () {
  // Prevent multiple instances
  if (window.mindfulPetActive) return;
  window.mindfulPetActive = true;

  console.log("Mindful Pet content script loaded");

  // Create pet container and image
  const container = document.createElement("div");
  container.id = "mindful-pet-container";
  container.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 9999;
    cursor: pointer;
    width: 40px;
    height: 40px;
  `;

  const pet = document.createElement("img");
  pet.id = "mindful-pet";
  pet.style.cssText = `
    width: 40px;
    height: 40px;
    filter: drop-shadow(0 0 3px rgba(0,0,0,0.2));
    transition: transform 0.3s ease;
  `;
  pet.src = chrome.runtime.getURL("assets/pet_happy.png");

  container.appendChild(pet);
  document.body.appendChild(container);

  // Hover effect
  container.addEventListener('mouseenter', () => {
    pet.style.transform = 'scale(1.1)';
  });
  container.addEventListener('mouseleave', () => {
    pet.style.transform = 'scale(1)';
  });

  // Time tracking variables
  let lastUpdateTime = Date.now();
  let isPageVisible = !document.hidden;

  // Listen for page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isPageVisible = false;
      console.log("Page hidden - pausing tracking");
    } else {
      isPageVisible = true;
      lastUpdateTime = Date.now();
      console.log("Page visible - resuming tracking");
    }
  });

  // Track time every second
  setInterval(() => {
    if (isPageVisible) {
      chrome.storage.local.get(['dailyUsage'], (result) => {
        if (chrome.runtime.lastError) {
          console.error("Storage error:", chrome.runtime.lastError);
          return;
        }
        
        const currentUsage = result.dailyUsage || 0;
        const newUsage = currentUsage + 1; // Add 1 second
        
        chrome.storage.local.set({ dailyUsage: newUsage }, () => {
          if (chrome.runtime.lastError) {
            console.error("Storage set error:", chrome.runtime.lastError);
          } else {
            console.log("Usage updated:", newUsage, "seconds");
          }
        });
      });
    }
  }, 1000);

  // Update pet appearance based on usage
  function updatePetAppearance() {
    chrome.storage.local.get(['dailyUsage', 'screenLimit'], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
        return;
      }

      const usage = result.dailyUsage || 0; // in seconds
      const limit = (result.screenLimit || 0.5) * 3600; // convert hours to seconds
      
      console.log("Current usage:", usage, "seconds, Limit:", limit, "seconds");

      if (usage < limit * 0.7) {
        pet.src = chrome.runtime.getURL("assets/pet_happy.png");
      } else if (usage < limit) {
        pet.src = chrome.runtime.getURL("assets/pet_idle.png");
      } else {
        pet.src = chrome.runtime.getURL("assets/pet_sad.png");
      }
    });
  }

  // Update pet every 5 seconds
  setInterval(updatePetAppearance, 5000);
  updatePetAppearance(); // Initial update

  // Click handler for popup
  container.addEventListener('click', (e) => {
    e.stopPropagation();
    
    // Remove existing popup
    const existingPopup = document.getElementById("mindful-pet-popup");
    if (existingPopup) {
      existingPopup.remove();
      return;
    }

    // Create new popup
    const popup = document.createElement("div");
    popup.id = "mindful-pet-popup";
    popup.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      background: white;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 9998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      border: 1px solid #e1e5e9;
      min-width: 140px;
    `;

    chrome.storage.local.get(['dailyUsage', 'screenLimit'], (result) => {
      const usage = result.dailyUsage || 0;
      const limit = result.screenLimit || 0.5;
      
      const minutes = Math.floor(usage / 60);
      const seconds = usage % 60;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      const percentage = Math.min(100, (minutes / (limit * 60)) * 100);

      popup.innerHTML = `
        <div style="text-align: left;">
          <p style="margin: 8px 0; color: #333;"><strong>Today's Usage:</strong><br>${hours}h ${remainingMinutes}m</p>
          <p style="margin: 8px 0; color: #333;"><strong>Daily Limit:</strong><br>${limit}h</p>
          <div style="width: 100%; height: 6px; background-color: #f0f0f0; border-radius: 6px; overflow: hidden; margin-top: 10px;">
            <div style="height: 100%; background: linear-gradient(90deg, #4CAF50, #81C784); border-radius: 6px; width: ${percentage}%; transition: width 0.3s ease;"></div>
          </div>
        </div>
      `;

      document.body.appendChild(popup);

      // Close popup when clicking elsewhere
      setTimeout(() => {
        const closeHandler = (event) => {
          if (!popup.contains(event.target) && !container.contains(event.target)) {
            popup.remove();
            document.removeEventListener('click', closeHandler);
          }
        };
        document.addEventListener('click', closeHandler);
      }, 100);
    });
  });

  console.log("Mindful Pet setup complete");
})();