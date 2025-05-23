# Mindful Pet

**Mindful Pet** is a Chrome extension that encourages mindful screen time through a pixel-style companion. The pet reacts to your daily usage with visual feedback and a circular progress meter.

---

## Features

- 🐾 Floating pixel pet overlay on all websites  
- 🕒 Donut-style circular progress bar for time tracking  
- 🎭 Pet expressions change based on usage (happy, idle, sad)  
- 🖱️ Draggable and repositionable UI  
- ⚙️ Popup with usage stats and limit settings  
- 🔄 Daily usage resets automatically at midnight  

---

## Installation (Developer Mode)

1. Download or clone this repository.  
2. Open Chrome and go to `chrome://extensions/`.  
3. Enable **Developer mode** (top right).  
4. Click **“Load unpacked”** and select the project folder.  

---

## How It Works

- The pet appears automatically on every page (excluding Chrome internal pages).  
- Usage time is tracked while the tab is visible and the browser window is focused.  
- A donut progress ring fills up as usage increases, changing color from green to red.  
- Clicking the pet opens a popup to adjust the daily screen time limit and view stats.  
- Your settings and usage data are saved locally.

---

## Tech Stack

- HTML, CSS, JavaScript  
- Chrome Extensions API  
- SVG for animated circular progress  

---

