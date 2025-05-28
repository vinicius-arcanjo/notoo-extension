// options.js - Script for the options page

document.addEventListener('DOMContentLoaded', function() {
  // Get DOM elements
  const notionTokenInput = document.getElementById('notionToken');
  const notionDatabaseIdInput = document.getElementById('notionDatabaseId');
  const steamToggle = document.getElementById('steamToggle');
  const buttonPositionSelect = document.getElementById('buttonPosition');
  const saveSettingsButton = document.getElementById('saveSettings');
  const resetSettingsButton = document.getElementById('resetSettings');
  const testConnectionButton = document.getElementById('testConnection');
  const statusMessage = document.getElementById('statusMessage');

  // Default configuration
  const defaultConfig = {
    enabled: true,
    notionToken: '',
    notionDatabaseId: '',
    sites: {
      steam: true
    },
    buttonPosition: 'bottom-right'
  };

  // Load configuration from storage
  loadConfig();

  // Add event listeners
  saveSettingsButton.addEventListener('click', saveConfig);
  resetSettingsButton.addEventListener('click', resetConfig);
  testConnectionButton.addEventListener('click', testNotionConnection);

  // Function to load configuration from storage
  function loadConfig() {
    chrome.storage.sync.get(['config'], function(result) {
      const config = result.config || defaultConfig;

      // Set input values
      notionTokenInput.value = config.notionToken || '';
      notionDatabaseIdInput.value = config.notionDatabaseId || '';

      // Set toggle states
      if (config.sites) {
        steamToggle.checked = config.sites.steam !== false; // Default to true if not set
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
    const notionDatabaseId = notionDatabaseIdInput.value.trim();
    const steamEnabled = steamToggle.checked;
    const buttonPosition = buttonPositionSelect.value;

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
      chrome.storage.sync.set({ config: defaultConfig }, function() {
        loadConfig(); // Reload the form with default values
        showStatus('Configurações restauradas para os valores padrão.', 'success');
      });
    }
  }

  // Function to test Notion API connection
  async function testNotionConnection() {
    const notionToken = notionTokenInput.value.trim();
    const notionDatabaseId = notionDatabaseIdInput.value.trim();

    if (!notionToken || !notionDatabaseId) {
      showStatus('Por favor, insira o token da API e o ID do banco de dados.', 'error');
      return;
    }

    showStatus('Testando conexão com o Notion...', '');
    testConnectionButton.disabled = true;

    try {
      // Test the connection by trying to retrieve the database
      const response = await fetch(`https://api.notion.com/v1/databases/${notionDatabaseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${notionToken}`,
          'Notion-Version': '2022-06-28'
        }
      });

      if (response.ok) {
        const data = await response.json();
        showStatus(`Conexão bem-sucedida! Banco de dados "${data.title[0]?.plain_text || 'Sem título'}" encontrado.`, 'success');
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
