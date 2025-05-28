// options.js - Script for the options page

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const notionTokenInput = document.getElementById('notionToken');
  const gamesDatabaseIdInput = document.getElementById('gamesDatabaseId');
  const moviesDatabaseIdInput = document.getElementById('moviesDatabaseId');
  const productsDatabaseIdInput = document.getElementById('productsDatabaseId');
  const steamToggle = document.getElementById('steamToggle');
  const steamToggleGlobal = document.getElementById('steamToggleGlobal');
  const buttonPositionSelect = document.getElementById('buttonPosition');
  const saveSettingsButton = document.getElementById('saveSettings');
  const resetSettingsButton = document.getElementById('resetSettings');
  const testConnectionButton = document.getElementById('testConnection');
  const statusMessage = document.getElementById('statusMessage');

  // Default configuration
  const defaultConfig = {
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
    },
    buttonPosition: 'bottom-right'
  };

  // Load configuration from storage
  loadConfig();

  // Add event listeners
  saveSettingsButton.addEventListener('click', saveConfig);
  resetSettingsButton.addEventListener('click', resetConfig);
  testConnectionButton.addEventListener('click', testNotionConnection);

  // Sync Steam toggles
  steamToggle.addEventListener('change', function() {
    steamToggleGlobal.checked = this.checked;
  });

  steamToggleGlobal.addEventListener('change', function() {
    steamToggle.checked = this.checked;
  });

  // Function to load configuration from storage
  function loadConfig() {
    chrome.storage.sync.get(['config'], function(result) {
      const config = result.config || defaultConfig;

      // Set input values
      notionTokenInput.value = config.notionToken || '';

      // Set database IDs
      if (config.databases) {
        gamesDatabaseIdInput.value = config.databases.games?.id || '';

        // Movies and products are disabled, but we'll still load their values
        // in case they're re-enabled in the future
        moviesDatabaseIdInput.value = config.databases.movies?.id || '';
        productsDatabaseIdInput.value = config.databases.products?.id || '';

        // Set toggle states for games sites
        if (config.databases.games?.sites) {
          steamToggle.checked = config.databases.games.sites.steam !== false; // Default to true if not set
          steamToggleGlobal.checked = steamToggle.checked; // Sync both toggles
        }
      } else if (config.notionDatabaseId) {
        // Handle migration from old config format
        gamesDatabaseIdInput.value = config.notionDatabaseId || '';

        if (config.sites) {
          steamToggle.checked = config.sites.steam !== false;
          steamToggleGlobal.checked = steamToggle.checked; // Sync both toggles
        }
      }

      // Set button position
      if (config.buttonPosition) {
        buttonPositionSelect.value = config.buttonPosition;
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
    const buttonPosition = buttonPositionSelect.value;

    // Validate inputs
    if (!notionToken) {
      showStatus('Por favor, insira o token da API do Notion.', 'error');
      return;
    }

    if (!gamesDatabaseId) {
      showStatus('Por favor, insira o ID do banco de dados de jogos do Notion.', 'error');
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
      },
      buttonPosition: buttonPosition
    };

    // Save configuration to storage
    chrome.storage.sync.set({ config: config }, function() {
      showStatus('Configurações salvas com sucesso!', 'success');
    });
  }

  // Function to reset configuration to defaults
  function resetConfig() {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      // Create a fresh copy of the default config
      const freshDefaultConfig = {
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
        },
        buttonPosition: 'bottom-right'
      };

      chrome.storage.sync.set({ config: freshDefaultConfig }, function() {
        loadConfig(); // Reload the form with default values
        showStatus('Configurações restauradas para os valores padrão.', 'success');
      });
    }
  }

  // Function to test Notion API connection
  async function testNotionConnection() {
    const notionToken = notionTokenInput.value.trim();
    const gamesDatabaseId = gamesDatabaseIdInput.value.trim();

    if (!notionToken || !gamesDatabaseId) {
      showStatus('Por favor, insira o token da API e o ID do banco de dados de jogos.', 'error');
      return;
    }

    showStatus('Testando conexão com o Notion...', '');
    testConnectionButton.disabled = true;

    try {
      // Test the connection by trying to retrieve the games database
      const response = await fetch(`https://api.notion.com/v1/databases/${gamesDatabaseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28'
        }
      });

      if (response.ok) {
        const data = await response.json();
        showStatus(`Conexão bem-sucedida! Banco de dados de jogos "${data.title[0]?.plain_text || 'Sem título'}" encontrado.`, 'success');
      } else {
        const errorData = await response.json();
        showStatus(`Erro: ${errorData.message || 'Falha na conexão com o Notion.'}`, 'error');
      }
    } catch (error) {
      showStatus(`Erro: ${error.message || 'Falha na conexão com o Notion.'}`, 'error');
    } finally {
      testConnectionButton.disabled = false;
    }
  }

  // Function to show status message
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.parentElement.className = 'status ' + type;

    if (type === 'success' || type === 'error') {
      // Clear status message after 5 seconds for success/error messages
      setTimeout(function() {
        statusMessage.textContent = '';
        statusMessage.parentElement.className = 'status';
      }, 5000);
    }
  }
});
