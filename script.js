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
    const limit = Number(input.value);
    if (limit > 0) {
      chrome.storage.local.set({ screenLimit: limit });
      statusText.textContent = "Limit saved!";
      statusText.style.opacity = "1";
      setTimeout(() => {
        statusText.style.opacity = "0";
      }, 2000);
    }
  });

  // Show current usage
  function getTodayKey() {
    const today = new Date().toISOString().split("T")[0];
    return `usage-${today}`;
  }

  function updateUsage() {
    chrome.storage.local.get([getTodayKey(), "screenLimit"], (data) => {
      const timeSpent = Math.floor((data[getTodayKey()] || 0) / 60); // convert to minutes
      const hours = Math.floor(timeSpent / 60);
      const minutes = timeSpent % 60;
      document.getElementById("usage").textContent = `${hours}h ${minutes}m`;
      
      const limit = (data.screenLimit || 2) * 60; // in minutes
      const percentage = Math.min(100, Math.round((timeSpent / limit) * 100));
      document.getElementById("progress-bar").style.width = `${percentage}%`;
      
      // Update pet image
      if (timeSpent < (limit - 60)) { // More than 1 hour before limit
        pet.src = "assets/pet_happy.png";
      } else if (timeSpent < limit) { // Less than 1 hour before limit
        pet.src = "assets/pet_idle.png";
      } else { // Over limit
        pet.src = "assets/pet_sad.png";
      }
    });
  }

  // Update usage on load and every few seconds
  updateUsage();
  setInterval(updateUsage, 5000);
});