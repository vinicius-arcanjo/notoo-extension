// content.js - Script that runs on Steam store pages

// Configuration (will be loaded from storage in the future)
let config = {
  enabled: true,
  notionToken: '',
  notionDatabaseId: '',
  sites: {
    steam: true
  }
};

// Load configuration from storage
chrome.storage.sync.get(['config'], function(result) {
  if (result.config) {
    config = result.config;
  }
});

// Only run on Steam store pages if enabled
if (window.location.href.includes('store.steampowered.com/app/') && config.sites.steam) {
  // Wait for the page to fully load
  window.addEventListener('load', function() {
    createFloatingButton();
  });
}

// Create the floating button
function createFloatingButton() {
  const button = document.createElement('div');
  button.id = 'notoo-button';
  button.innerHTML = `
    <div class="notoo-icon">N</div>
    <div class="notoo-tooltip">Save to Notion</div>
  `;

  // Get button position from config
  const buttonPosition = config.buttonPosition || 'bottom-right';

  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    #notoo-button {
      position: fixed;
      ${buttonPosition.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
      ${buttonPosition.includes('right') ? 'right: 20px;' : 'left: 20px;'}
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: #2e59ff;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 9999;
      transition: all 0.3s ease;
    }

    #notoo-button:hover {
      transform: scale(1.1);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

    .notoo-icon {
      font-size: 24px;
      font-weight: bold;
    }

    .notoo-tooltip {
      position: absolute;
      ${buttonPosition.includes('right') ? 'right: 60px;' : 'left: 60px;'}
      background-color: #333;
      color: white;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 14px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      white-space: nowrap;
    }

    #notoo-button:hover .notoo-tooltip {
      opacity: 1;
    }

    .notoo-saving {
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(button);

  // Add click event listener
  button.addEventListener('click', function() {
    saveToNotion();
  });
}

// Extract game data from the Steam page
function extractGameData() {
  const title = document.querySelector('.apphub_AppName')?.textContent.trim() || '';

  // Extract release date
  const releaseDateElement = document.querySelector('.release_date .date');
  const releaseDate = releaseDateElement ? releaseDateElement.textContent.trim() : '';

  // Extract description
  const descriptionElement = document.querySelector('.game_description_snippet');
  const description = descriptionElement ? descriptionElement.textContent.trim() : '';

  // Extract image
  const imageElement = document.querySelector('.game_header_image_full');
  const image = imageElement ? imageElement.src : '';

  // Extract genres
  const genreElements = document.querySelectorAll('.details_block a[href*="genre"]');
  const genres = Array.from(genreElements).map(el => el.textContent.trim());

  // Extract platforms
  const platforms = [];
  if (document.querySelector('.platform_img.win')) platforms.push('Windows');
  if (document.querySelector('.platform_img.mac')) platforms.push('Mac');
  if (document.querySelector('.platform_img.linux')) platforms.push('Linux');

  return {
    title,
    releaseDate,
    description,
    image,
    genres,
    platforms,
    slug: window.location.pathname.split('/')[2],
    rating: 0,
    completed: false,
    playAgain: false,
    played: false
  };
}

// Save game data to Notion
function saveToNotion() {
  const button = document.getElementById('notoo-button');

  // Check if configuration is set
  if (!config.notionToken || !config.notionDatabaseId) {
    button.innerHTML = `
      <div class="notoo-icon">!</div>
      <div class="notoo-tooltip">Please configure Notion API in extension settings</div>
    `;
    button.style.backgroundColor = '#ff4d4d';

    setTimeout(() => {
      button.innerHTML = `
        <div class="notoo-icon">N</div>
        <div class="notoo-tooltip">Save to Notion</div>
      `;
      button.style.backgroundColor = '#2e59ff';
    }, 3000);

    return;
  }

  // Show saving animation
  button.classList.add('notoo-saving');
  button.innerHTML = `
    <div class="notoo-icon">...</div>
    <div class="notoo-tooltip">Saving to Notion...</div>
  `;

  const gameData = extractGameData();

  // Send message to background script to handle the API call
  chrome.runtime.sendMessage({
    action: 'saveToNotion',
    data: gameData
  }, function(response) {
    if (response && response.success) {
      // Show success message
      button.classList.remove('notoo-saving');
      button.style.backgroundColor = '#4CAF50';
      button.innerHTML = `
        <div class="notoo-icon">✓</div>
        <div class="notoo-tooltip">Saved to Notion!</div>
      `;

      setTimeout(() => {
        button.style.backgroundColor = '#2e59ff';
        button.innerHTML = `
          <div class="notoo-icon">N</div>
          <div class="notoo-tooltip">Save to Notion</div>
        `;
      }, 3000);
    } else {
      // Show error message
      button.classList.remove('notoo-saving');
      button.style.backgroundColor = '#ff4d4d';
      button.innerHTML = `
        <div class="notoo-icon">!</div>
        <div class="notoo-tooltip">Error: ${response?.error || 'Failed to save'}</div>
      `;

      setTimeout(() => {
        button.style.backgroundColor = '#2e59ff';
        button.innerHTML = `
          <div class="notoo-icon">N</div>
          <div class="notoo-tooltip">Save to Notion</div>
        `;
      }, 3000);
    }
  });
}
