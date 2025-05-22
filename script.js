// This script is for the popup UI
document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById("limit");
  const button = document.getElementById("save");
  const pet = document.getElementById("pet");
  const statusText = document.getElementById("status");

  // Load current limit and usage
  chrome.storage.local.get(["screenLimit"], (data) => {
    input.value = data.screenLimit || 2;
  });

  // Save new limit
  button.addEventListener("click", () => {
    const limit = parseFloat(input.value);
    if (limit > 0 && limit <= 24) {
      chrome.storage.local.set({ screenLimit: limit }, () => {
        statusText.textContent = "Limit saved!";
        statusText.style.opacity = "1";
        updateUsage(); // Refresh the display
        setTimeout(() => {
          statusText.style.opacity = "0";
        }, 2000);
      });
    } else {
      statusText.textContent = "Please enter a valid limit (1-24 hours)";
      statusText.style.color = "#ff4444";
      statusText.style.opacity = "1";
      setTimeout(() => {
        statusText.style.opacity = "0";
        statusText.style.color = "#4CAF50";
      }, 3000);
    }
  });

  // Allow saving with Enter key
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      button.click();
    }
  });

  // Show current usage
  function updateUsage() {
    chrome.storage.local.get(['dailyUsage', 'screenLimit'], (data) => {
      const timeSpent = Math.floor((data.dailyUsage || 0) / 60); // convert seconds to minutes
      const hours = Math.floor(timeSpent / 60);
      const minutes = timeSpent % 60;
      
      document.getElementById("usage").textContent = `${hours}h ${minutes}m`;
      
      const limit = (data.screenLimit || 2) * 60; // in minutes
      const percentage = Math.min(100, Math.round((timeSpent / limit) * 100));
      const progressBar = document.getElementById("progress-bar");
      progressBar.style.width = `${percentage}%`;
      
      // Update progress bar color based on usage
      if (percentage < 70) {
        progressBar.style.backgroundColor = "#4CAF50"; // Green
      } else if (percentage < 100) {
        progressBar.style.backgroundColor = "#FF9800"; // Orange
      } else {
        progressBar.style.backgroundColor = "#f44336"; // Red
      }
      
      // Update pet image
      if (timeSpent < (limit * 0.7)) { // Less than 70% of limit
        pet.src = "assets/pet_happy.png";
      } else if (timeSpent < limit) { // Between 70% and 100% of limit
        pet.src = "assets/pet_idle.png";
      } else { // Over limit
        pet.src = "assets/pet_sad.png";
      }
    });
  }

  // Update usage on load and every 2 seconds for real-time updates
  updateUsage();
  const updateInterval = setInterval(updateUsage, 2000);
  
  // Clean up interval when popup closes
  window.addEventListener('beforeunload', () => {
    clearInterval(updateInterval);
  });
});