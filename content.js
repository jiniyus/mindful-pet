// Clean implementation - no old code references
(function () {
  // Prevent multiple instances
  if (window.mindfulPetActive) return;
  window.mindfulPetActive = true;

  console.log("Mindful Pet content script loaded");

  // Create pet container
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
      width: 80px;
      height: 90px;
      user-select: none;
      display: flex;
      flex-direction: column;
      align-items: center;
    `;
  });

  // Create donut progress wrapper
  const progressWrapper = document.createElement("div");
  progressWrapper.style.cssText = `
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 64px;
    height: 64px;
  `;

  // Create SVG for donut progress
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.style.cssText = `
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  `;

  // Background circle
  const bgCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  bgCircle.setAttribute("cx", "32");
  bgCircle.setAttribute("cy", "32");
  bgCircle.setAttribute("r", "28");
  bgCircle.setAttribute("fill", "none");
  bgCircle.setAttribute("stroke", "rgba(255, 255, 255, 0.3)");
  bgCircle.setAttribute("stroke-width", "4");

  // Progress circle
  const progressCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  progressCircle.setAttribute("cx", "32");
  progressCircle.setAttribute("cy", "32");
  progressCircle.setAttribute("r", "28");
  progressCircle.setAttribute("fill", "none");
  progressCircle.setAttribute("stroke", "#4ade80");
  progressCircle.setAttribute("stroke-width", "4");
  progressCircle.setAttribute("stroke-linecap", "round");
  progressCircle.setAttribute("stroke-dasharray", "0 176");
  progressCircle.style.transition = "stroke-dasharray 0.5s ease, stroke 0.3s ease";

  svg.appendChild(bgCircle);
  svg.appendChild(progressCircle);
  progressWrapper.appendChild(svg);

  // Create pet image
  const pet = document.createElement("img");
  pet.id = "mindful-pet";
  pet.style.cssText = `
    width: 48px;
    height: 48px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    filter: drop-shadow(0 0 5px rgba(0,0,0,0.3));
    transition: transform 0.3s ease;
    pointer-events: none;
    z-index: 2;
  `;
  pet.src = chrome.runtime.getURL("assets/pet_happy.png");

  progressWrapper.appendChild(pet);

  // Create usage display
  const usageDisplay = document.createElement("div");
  usageDisplay.style.cssText = `
    margin-top: 4px;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    font-weight: bold;
    color: #fff;
    text-align: center;
    background: rgba(0, 0, 0, 0.7);
    padding: 2px 4px;
    border-radius: 4px;
    min-width: 50px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  `;
  usageDisplay.textContent = "0m / 2h";

  container.appendChild(progressWrapper);
  container.appendChild(usageDisplay);
  document.body.appendChild(container);

  // Helper function to interpolate colors
  function interpolateColor(startColor, endColor, factor) {
    const start = {
      r: parseInt(startColor.slice(1, 3), 16),
      g: parseInt(startColor.slice(3, 5), 16),
      b: parseInt(startColor.slice(5, 7), 16)
    };
    const end = {
      r: parseInt(endColor.slice(1, 3), 16),
      g: parseInt(endColor.slice(3, 5), 16),
      b: parseInt(endColor.slice(5, 7), 16)
    };
    
    const r = Math.round(start.r + (end.r - start.r) * factor);
    const g = Math.round(start.g + (end.g - start.g) * factor);
    const b = Math.round(start.b + (end.b - start.b) * factor);
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  // Helper function to format time for usage display
  function formatTimeForDisplay(minutes) {
    if (minutes < 60) {
      return `${minutes}m`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${remainingMinutes}m`;
      }
    }
  }

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
      pet.style.transform = 'translate(-50%, -50%) scale(1.1)';
    }
  });
  container.addEventListener('mouseleave', () => {
    if (!isDragging) {
      pet.style.transform = 'translate(-50%, -50%) scale(1)';
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

  // Track time every second with error handling
  const trackingInterval = setInterval(() => {
    if (isPageVisible) {
      // Check if extension context is still valid
      if (!chrome.runtime?.id) {
        console.log("Extension context invalidated, stopping tracking");
        clearInterval(trackingInterval);
        return;
      }
      
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

  // Update pet appearance and progress based on usage with error handling
  function updatePetAppearance() {
    // Check if extension context is still valid
    if (!chrome.runtime?.id) {
      console.log("Extension context invalidated, stopping updates");
      return;
    }
    
    chrome.storage.local.get(['dailyUsage', 'screenLimit'], (result) => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
        return;
      }

      const usage = result.dailyUsage || 0; // in seconds
      const limit = (result.screenLimit || 0.5) * 3600; // convert hours to seconds
      const usageMinutes = Math.floor(usage / 60);
      const limitMinutes = Math.floor(limit / 60);
      
      console.log("Current usage:", usage, "seconds, Limit:", limit, "seconds");

      // Update pet image
      if (usage < limit * 0.7) {
        pet.src = chrome.runtime.getURL("assets/pet_happy.png");
      } else if (usage < limit) {
        pet.src = chrome.runtime.getURL("assets/pet_idle.png");
      } else {
        pet.src = chrome.runtime.getURL("assets/pet_sad.png");
      }

      // Update donut progress
      const percentage = Math.min(100, (usageMinutes / limitMinutes) * 100);
      const circumference = 2 * Math.PI * 28; // radius = 28
      const strokeDasharray = (percentage / 100) * circumference;
      
      progressCircle.setAttribute("stroke-dasharray", `${strokeDasharray} ${circumference}`);
      
      // Color interpolation from soft green to pink/red
      const factor = Math.min(1, percentage / 100);
      let color;
      if (factor <= 0.7) {
        // Green to yellow transition (0-70%)
        color = interpolateColor("#4ade80", "#fbbf24", factor / 0.7);
      } else {
        // Yellow to red transition (70-100%)
        color = interpolateColor("#fbbf24", "#ef4444", (factor - 0.7) / 0.3);
      }
      progressCircle.setAttribute("stroke", color);

      // Update usage display
      const usedFormatted = formatTimeForDisplay(usageMinutes);
      const limitFormatted = formatTimeForDisplay(limitMinutes);
      usageDisplay.textContent = `${usedFormatted} / ${limitFormatted}`;
    });
  }

  // Update pet every 5 seconds with error handling
  const updateInterval = setInterval(() => {
    if (!chrome.runtime?.id) {
      console.log("Extension context invalidated, stopping updates");
      clearInterval(updateInterval);
      return;
    }
    updatePetAppearance();
  }, 5000);
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
      