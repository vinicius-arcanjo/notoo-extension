// popup.js - Script for the popup interface

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const notionTokenInput = document.getElementById('notionToken');
  const gamesDatabaseIdInput = document.getElementById('gamesDatabaseId');
  const moviesDatabaseIdInput = document.getElementById('moviesDatabaseId');
  const productsDatabaseIdInput = document.getElementById('productsDatabaseId');
  const steamToggle = document.getElementById('steamToggle');
  const saveSettingsButton = document.getElementById('saveSettings');
  const statusMessage = document.getElementById('statusMessage');
  const openOptionsLink = document.getElementById('openOptions');

  // Load configuration from storage
  loadConfig();

  // Add event listeners
  saveSettingsButton.addEventListener('click', saveConfig);
  openOptionsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Function to load configuration from storage
  function loadConfig() {
    chrome.storage.sync.get(['config'], function(result) {
      if (result.config) {
        const config = result.config;

        // Set input values
        notionTokenInput.value = config.notionToken || '';

        // Set database IDs
        if (config.databases) {
          gamesDatabaseIdInput.value = config.databases.games?.id || '';
          moviesDatabaseIdInput.value = config.databases.movies?.id || '';
          productsDatabaseIdInput.value = config.databases.products?.id || '';

          // Set toggle states for games sites
          if (config.databases.games?.sites) {
            steamToggle.checked = config.databases.games.sites.steam !== false; // Default to true if not set
          }
        } else if (config.notionDatabaseId) {
          // Handle migration from old config format
          gamesDatabaseIdInput.value = config.notionDatabaseId || '';

          if (config.sites) {
            steamToggle.checked = config.sites.steam !== false;
          }
        }
      }
    });
  }

  // Function to save configuration to storage
  function saveConfig() {
    // Get values from inputs
    const notionToken = notionTokenInput.value.trim();
    const gamesDatabaseId = gamesDatabaseIdInput.value.trim();
    const moviesDatabaseId = moviesDatabaseIdInput.value.trim();
    const productsDatabaseId = productsDatabaseIdInput.value.trim();
    const steamEnabled = steamToggle.checked;

    // Validate inputs
    if (!notionToken) {
      showStatus('Por favor, insira o token da API do Notion.', 'error');
      return;
    }

    // At least one database ID should be provided
    if (!gamesDatabaseId && !moviesDatabaseId && !productsDatabaseId) {
      showStatus('Por favor, insira pelo menos um ID de banco de dados do Notion.', 'error');
      return;
    }

    // Create configuration object
    const config = {
      enabled: true,
      notionToken: notionToken,
      databases: {
        games: {
          id: gamesDatabaseId,
          sites: {
            steam: steamEnabled
          }
        },
        movies: {
          id: moviesDatabaseId,
          sites: {}
        },
        products: {
          id: productsDatabaseId,
          sites: {}
        }
      }
    };

    // Save configuration to storage
    chrome.storage.sync.set({ config: config }, function() {
      showStatus('Configurações salvas com sucesso!', 'success');
    });
  }

  // Function to show status message
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.parentElement.className = 'status ' + type;

    // Clear status message after 3 seconds
    setTimeout(function() {
      statusMessage.textContent = '';
      statusMessage.parentElement.className = 'status';
    }, 3000);
  }
});
