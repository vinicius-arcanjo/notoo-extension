// popup.js - Script for the popup interface

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const notionTokenInput = document.getElementById('notionToken');
  const notionDatabaseIdInput = document.getElementById('notionDatabaseId');
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
        notionDatabaseIdInput.value = config.notionDatabaseId || '';

        // Set toggle states
        if (config.sites) {
          steamToggle.checked = config.sites.steam !== false; // Default to true if not set
        }
      }
    });
  }

  // Function to save configuration to storage
  function saveConfig() {
    // Get values from inputs
    const notionToken = notionTokenInput.value.trim();
    const notionDatabaseId = notionDatabaseIdInput.value.trim();
    const steamEnabled = steamToggle.checked;

    // Validate inputs
    if (!notionToken) {
      showStatus('Por favor, insira o token da API do Notion.', 'error');
      return;
    }

    if (!notionDatabaseId) {
      showStatus('Por favor, insira o ID do banco de dados do Notion.', 'error');
      return;
    }

    // Create configuration object
    const config = {
      enabled: true,
      notionToken: notionToken,
      notionDatabaseId: notionDatabaseId,
      sites: {
        steam: steamEnabled
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
