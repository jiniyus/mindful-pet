(function () {
  // Create pet element
  const pet = document.createElement("img");
  pet.id = "mindful-pet";
  pet.src = chrome.runtime.getURL("assets/pet_happy.png");
  
  // Create container for positioning
  const container = document.createElement("div");
  container.id = "mindful-pet-container";
  container.appendChild(pet);
  document.body.appendChild(container);

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    #mindful-pet-container {
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    #mindful-pet {
      width: 40px;
      height: 40px;
      filter: drop-shadow(0 0 3px rgba(0,0,0,0.2));
    }
    #mindful-pet:hover {
      transform: scale(1.1);
    }
  `;
  document.head.appendChild(style);

  // Default time limit is 2 hours
  const defaultLimitHours = 2;

  function getTodayKey() {
    const today = new Date().toISOString().split("T")[0];
    return `usage-${today}`;
  }

  // Track time spent (in seconds)
  setInterval(() => {
    const key = getTodayKey();
    chrome.storage.local.get([key, "screenLimit"], (data) => {
      let time = data[key] || 0;
      const limit = (data.screenLimit || defaultLimitHours) * 3600;

      time += 5; // 5 seconds at a time
      chrome.storage.local.set({ [key]: time });

      // Update pet mood
      if (time < limit - 3600) {
        pet.src = chrome.runtime.getURL("assets/pet_happy.png");
      } else if (time < limit) {
        pet.src = chrome.runtime.getURL("assets/pet_idle.png");
      } else {
        pet.src = chrome.runtime.getURL("assets/pet_sad.png");
      }
    });
  }, 5000);

  // Add interaction
  container.addEventListener("click", () => {
    const popup = document.createElement("div");
    popup.id = "mindful-pet-popup";
    
    chrome.storage.local.get([getTodayKey(), "screenLimit"], (data) => {
      const timeSpent = Math.floor((data[getTodayKey()] || 0) / 60); // convert to minutes
      const limit = data.screenLimit || defaultLimitHours;
      
      popup.innerHTML = `
        <div class="pet-popup-content">
          <p>Screen time today: ${Math.floor(timeSpent/60)}h ${timeSpent%60}m</p>
          <p>Daily limit: ${limit}h</p>
        </div>
      `;
      
      const popupStyle = document.createElement("style");
      popupStyle.textContent = `
        #mindful-pet-popup {
          position: fixed;
          top: 60px;
          right: 10px;
          background: white;
          border-radius: 8px;
          padding: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.2);
          z-index: 9998;
          font-family: Arial, sans-serif;
          font-size: 12px;
        }
        .pet-popup-content {
          min-width: 120px;
        }
      `;
      
      document.head.appendChild(popupStyle);
      document.body.appendChild(popup);
      
      // Close popup when clicking elsewhere
      setTimeout(() => {
        const closePopup = (e) => {
          if (!popup.contains(e.target) && e.target !== container && e.target !== pet) {
            document.body.removeChild(popup);
            document.head.removeChild(popupStyle);
            document.removeEventListener("click", closePopup);
          }
        };
        document.addEventListener("click", closePopup);
      }, 100);
    });
  });
})();