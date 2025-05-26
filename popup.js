// Store for scraped game data
let gameData = [];

// DOM elements
document.addEventListener('DOMContentLoaded', function() {
  const scrapeButton = document.getElementById('scrapeButton');
  const exportButton = document.getElementById('exportButton');
  const clearButton = document.getElementById('clearButton');
  const statusDiv = document.getElementById('status');
  const resultsDiv = document.getElementById('results');

  // Load any previously stored data
  chrome.storage.local.get(['gameData'], function(result) {
    if (result.gameData && result.gameData.length > 0) {
      gameData = result.gameData;
      updateResultsDisplay();
    }
  });

  // Scrape button click handler
  scrapeButton.addEventListener('click', function() {
    statusDiv.textContent = 'Scraping game information...';

    // Get the active tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      // Send a message to the content script
      chrome.tabs.sendMessage(tabs[0].id, {action: "scrapeGames"}, function(response) {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error: ' + chrome.runtime.lastError.message;
          return;
        }

        if (response && response.success) {
          // Add the new data to our existing data
          if (response.games && response.games.length > 0) {
            // Filter out duplicates based on game title
            const newGames = response.games.filter(newGame =>
              !gameData.some(existingGame => existingGame.title === newGame.title)
            );

            gameData = [...gameData, ...newGames];

            // Save to storage
            chrome.storage.local.set({gameData: gameData});

            statusDiv.textContent = `Scraped ${newGames.length} new games. Total: ${gameData.length}`;
            updateResultsDisplay();
          } else {
            statusDiv.textContent = 'No game information found on this page.';
          }
        } else {
          statusDiv.textContent = 'Failed to scrape game information.';
        }
      });
    });
  });

  // Export button click handler
  exportButton.addEventListener('click', function() {
    if (gameData.length === 0) {
      statusDiv.textContent = 'No data to export.';
      return;
    }

    // Create a data URL for the JSON file
    const dataStr = JSON.stringify(gameData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    // Create a link element and trigger a download
    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', 'game_data.json');
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);

    statusDiv.textContent = `Exported ${gameData.length} games to JSON.`;
  });

  // Clear button click handler
  clearButton.addEventListener('click', function() {
    gameData = [];
    chrome.storage.local.remove(['gameData']);
    resultsDiv.style.display = 'none';
    resultsDiv.innerHTML = '';
    statusDiv.textContent = 'All data cleared.';
  });

  // Function to update the results display
  function updateResultsDisplay() {
    if (gameData.length === 0) {
      resultsDiv.style.display = 'none';
      return;
    }

    resultsDiv.style.display = 'block';
    resultsDiv.innerHTML = '';

    // Display the most recent 10 games
    const recentGames = gameData.slice(-10).reverse();

    recentGames.forEach(game => {
      const gameElement = document.createElement('div');
      gameElement.className = 'game-item';

      let gameHtml = `<strong>${game.title || 'Unknown Title'}</strong>`;

      if (game.price) {
        gameHtml += `<br>Price: ${game.price}`;
      }

      if (game.platform) {
        gameHtml += `<br>Platform: ${game.platform}`;
      }

      if (game.rating) {
        gameHtml += `<br>Rating: ${game.rating}`;
      }

      gameElement.innerHTML = gameHtml;
      resultsDiv.appendChild(gameElement);
    });

    if (gameData.length > 10) {
      const moreText = document.createElement('div');
      moreText.textContent = `...and ${gameData.length - 10} more games`;
      resultsDiv.appendChild(moreText);
    }
  }
});
