// content.js - Script that runs on Steam store pages

// Configuration (will be loaded from storage in the future)
let config = {
  enabled: true,
  notionToken: '',
  databases: {
    games: {
      id: '',
      sites: {
        steam: true
      }
    },
    movies: {
      id: '',
      sites: {}
    },
    products: {
      id: '',
      sites: {}
    }
  }
};

// Load configuration from storage
chrome.storage.sync.get(['config'], function(result) {
  if (result.config) {
    config = result.config;

    // Initialize extension based on current page
    initializeExtension();
  }
});

// Initialize extension based on current page
function initializeExtension() {
  // Check if we're on a Steam store page
  if (window.location.href.includes('store.steampowered.com/app/')) {
    // Check if Steam is enabled in the games configuration
    const steamEnabled = config.databases?.games?.sites?.steam !== false;

    // If Steam is enabled and we have a games database ID, show the button
    if (steamEnabled && config.databases?.games?.id) {
      // Wait for the page to fully load
      window.addEventListener('load', function() {
        createFloatingButton();
      });
    }
  }
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
      background-color: #000000;
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

// Convert a string to a slug format
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/&/g, '-and-')          // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')       // Remove all non-word characters
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
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

  // Extract price
  const priceElement = document.querySelector('.game_purchase_price') ||
                       document.querySelector('.discount_final_price');
  let priceText = priceElement ? priceElement.textContent.trim() : '';

  // Convert price string to number (remove currency symbols and non-numeric characters)
  // Keep only digits, decimal point, and comma (which might be used as decimal separator in some locales)
  let priceValue = priceText.replace(/[^0-9.,]/g, '');

  // Replace comma with dot for decimal separator if needed
  priceValue = priceValue.replace(',', '.');

  // Convert to number, default to 0 if conversion fails
  const price = parseFloat(priceValue) || 0;

  // Extract genres
  const genreElements = document.querySelectorAll('.details_block a[href*="genre"]');
  const genres = Array.from(genreElements).map(el => el.textContent.trim());

  // Extract platforms
  const platforms = [];
  if (document.querySelector('.platform_img.win')) platforms.push('Windows');
  if (document.querySelector('.platform_img.mac')) platforms.push('Mac');
  if (document.querySelector('.platform_img.linux')) platforms.push('Linux');

  // Create slug from title
  const slug = slugify(title);

  return {
    title,
    releaseDate,
    description,
    image,
    price,
    genres,
    platforms,
    slug,
    rating: 0,
    completed: false,
    playAgain: false,
    played: false
  };
}

// Save game data to Notion
function saveToNotion() {
  const button = document.getElementById('notoo-button');

  // Determine the database type based on the current page
  let databaseType = 'games'; // Default to games
  let databaseId = '';

  // If we're on Steam, it's a game
  if (window.location.href.includes('store.steampowered.com')) {
    databaseType = 'games';
    databaseId = config.databases?.games?.id;
  }

  // Check if configuration is set
  if (!config.notionToken || !databaseId) {
    button.innerHTML = `
      <div class="notoo-icon">!</div>
      <div class="notoo-tooltip">Please configure Notion API for ${databaseType} in extension settings</div>
    `;
    button.style.backgroundColor = '#000000';

    setTimeout(() => {
      button.innerHTML = `
        <div class="notoo-icon">N</div>
        <div class="notoo-tooltip">Save to Notion</div>
      `;
      button.style.backgroundColor = '#000000';
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
    data: gameData,
    databaseType: databaseType
  }, function(response) {
    if (response && response.success) {
      // Show success message
      button.classList.remove('notoo-saving');
      button.style.backgroundColor = '#000000';
      button.innerHTML = `
        <div class="notoo-icon">✓</div>
        <div class="notoo-tooltip">Saved to Notion!</div>
      `;

      setTimeout(() => {
        button.style.backgroundColor = '#000000';
        button.innerHTML = `
          <div class="notoo-icon">N</div>
          <div class="notoo-tooltip">Save to Notion</div>
        `;
      }, 3000);
    } else {
      // Show error message
      button.classList.remove('notoo-saving');
      button.style.backgroundColor = '#000000';
      button.innerHTML = `
        <div class="notoo-icon">!</div>
        <div class="notoo-tooltip">Error: ${response?.error || 'Failed to save'}</div>
      `;

      setTimeout(() => {
        button.style.backgroundColor = '#000000';
        button.innerHTML = `
          <div class="notoo-icon">N</div>
          <div class="notoo-tooltip">Save to Notion</div>
        `;
      }, 3000);
    }
  });
}
