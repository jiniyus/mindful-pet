// Clean implementation - no old code references
(function () {
  // Prevent multiple instances
  if (window.mindfulPetActive) return;
  window.mindfulPetActive = true;

  console.log("Mindful Pet content script loaded");

  // Create pet container and image
  const container = document.createElement("div");
  container.id = "mindful-pet-container";
  
  // Get saved position or use default (bottom right)
  chrome.storage.local.get(['petPosition'], (result) => {
    const savedPosition = result.petPosition || { bottom: '20px', right: '20px' };
    
    container.style.cssText = `
      position: fixed;
      ${savedPosition.top ? `top: ${savedPosition.top};` : ''}
      ${savedPosition.bottom ? `bottom: ${savedPosition.bottom};` : ''}
      ${savedPosition.left ? `left: ${savedPosition.left};` : ''}
      ${savedPosition.right ? `right: ${savedPosition.right};` : ''}
      z-index: 9999;
      cursor: grab;
      width: 50px;
      height: 50px;
      user-select: none;
    `;
  });

  const pet = document.createElement("img");
  pet.id = "mindful-pet";
  pet.style.cssText = `
    width: 50px;
    height: 50px;
    filter: drop-shadow(0 0 5px rgba(0,0,0,0.3));
    transition: transform 0.3s ease;
    pointer-events: none;
  `;
  pet.src = chrome.runtime.getURL("assets/pet_happy.png");

  container.appendChild(pet);
  document.body.appendChild(container);

  // Make pet draggable
  let isDragging = false;
  let startX, startY, startLeft, startTop;

  container.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only left mouse button
    
    isDragging = true;
    container.style.cursor = 'grabbing';
    
    startX = e.clientX;
    startY = e.clientY;
    
    const rect = container.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;
    
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;
    
    // Keep pet within viewport bounds
    const maxLeft = window.innerWidth - container.offsetWidth;
    const maxTop = window.innerHeight - container.offsetHeight;
    
    newLeft = Math.max(0, Math.min(newLeft, maxLeft));
    newTop = Math.max(0, Math.min(newTop, maxTop));
    
    // Update position
    container.style.left = newLeft + 'px';
    container.style.top = newTop + 'px';
    container.style.right = 'auto';
    container.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      container.style.cursor = 'grab';
      
      // Save new position
      const rect = container.getBoundingClientRect();
      const position = {
        top: rect.top + 'px',
        left: rect.left + 'px'
      };
      
      chrome.storage.local.set({ petPosition: position });
    }
  });

  // Hover effect (only when not dragging)
  container.addEventListener('mouseenter', () => {
    if (!isDragging) {
      pet.style.transform = 'scale(1.1)';
    }
  });
  container.addEventListener('mouseleave', () => {
    if (!isDragging) {
      pet.style.transform = 'scale(1)';
    }
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

  // Click handler for popup (only if not dragging)
  let clickStartTime = 0;
  
  container.addEventListener('mousedown', (e) => {
    clickStartTime = Date.now();
  });
  
  container.addEventListener('click', (e) => {
    // Only show popup if it was a quick click (not a drag)
    const clickDuration = Date.now() - clickStartTime;
    if (clickDuration > 200) return; // Was probably a drag
    
    e.stopPropagation();
    
    // Remove existing popup
    const existingPopup = document.getElementById("mindful-pet-popup");
    if (existingPopup) {
      existingPopup.remove();
      return;
    }

    // Create new popup positioned near pet
    const popup = document.createElement("div");
    popup.id = "mindful-pet-popup";
    
    const petRect = container.getBoundingClientRect();
    let popupTop = petRect.top - 120; // Above pet by default
    let popupLeft = petRect.left;
    
    // Adjust if popup would go off-screen
    if (popupTop < 10) {
      popupTop = petRect.bottom + 10; // Below pet instead
    }
    if (popupLeft + 180 > window.innerWidth) {
      popupLeft = window.innerWidth - 190; // Move left
    }
    
    popup.style.cssText = `
      position: fixed;
      top: ${popupTop}px;
      left: ${popupLeft}px;
      background: white;
      border-radius: 12px;
      padding: 15px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 9998;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 13px;
      border: 1px solid #e1e5e9;
      min-width: 160px;
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