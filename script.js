// This script is for the popup UI
document.addEventListener('DOMContentLoaded', function() {
  const input = document.getElementById("limit");
  const button = document.getElementById("save");
  const pet = document.getElementById("pet");
  const statusText = document.getElementById("status");
  const donutCircle = document.getElementById("donut-progress-circle");
  const usageDisplay = document.getElementById("usage-display");

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
      
      // Update donut progress bar
      const circumference = 2 * Math.PI * 28; // radius = 28
      const strokeDasharray = (percentage / 100) * circumference;
      const strokeDashoffset = circumference - strokeDasharray;
      
      donutCircle.style.strokeDasharray = `${strokeDasharray} ${circumference}`;
      
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
      donutCircle.style.stroke = color;
      
      // Update usage display with used/limit format
      const usedFormatted = formatTimeForDisplay(timeSpent);
      const limitFormatted = formatTimeForDisplay(limit);
      usageDisplay.textContent = `${usedFormatted} / ${limitFormatted}`;
      
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