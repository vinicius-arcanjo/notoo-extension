/**
 * Game Info Scraper - Background Script
 * This script runs in the background and manages the extension's state.
 */

// Initialize when the extension is installed or updated
chrome.runtime.onInstalled.addListener(function() {
  console.log('Game Info Scraper extension installed or updated');

  // Initialize storage with empty game data if it doesn't exist
  chrome.storage.local.get(['gameData'], function(result) {
    if (!result.gameData) {
      chrome.storage.local.set({gameData: []});
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // Handle any background-specific actions here
  if (request.action === "getStats") {
    chrome.storage.local.get(['gameData'], function(result) {
      const gameData = result.gameData || [];

      // Calculate some basic stats
      const stats = {
        totalGames: gameData.length,
        platforms: {},
        sources: {},
        lastScraped: gameData.length > 0 ? gameData[gameData.length - 1].scrapedAt : null
      };

      // Count games by platform and source
      gameData.forEach(game => {
        if (game.platform) {
          stats.platforms[game.platform] = (stats.platforms[game.platform] || 0) + 1;
        }

        if (game.source) {
          stats.sources[game.source] = (stats.sources[game.source] || 0) + 1;
        }
      });

      sendResponse({success: true, stats: stats});
    });

    return true; // Required for async response
  }
});

// Optional: Add context menu for quick access to scraping
chrome.contextMenus.create({
  id: "scrapeGameInfo",
  title: "Scrape Game Information",
  contexts: ["page"]
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "scrapeGameInfo") {
    // Send message to content script to start scraping
    chrome.tabs.sendMessage(tab.id, {action: "scrapeGames"}, function(response) {
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError.message);
        return;
      }

      if (response && response.success) {
        // Show notification with results
        chrome.notifications.create({
          type: "basic",
          iconUrl: "images/icon128.png",
          title: "Game Info Scraper",
          message: `Scraped ${response.games.length} games from the current page.`
        });

        // Store the scraped data
        chrome.storage.local.get(['gameData'], function(result) {
          let gameData = result.gameData || [];

          // Filter out duplicates
          const newGames = response.games.filter(newGame =>
            !gameData.some(existingGame => existingGame.title === newGame.title)
          );

          gameData = [...gameData, ...newGames];
          chrome.storage.local.set({gameData: gameData});
        });
      }
    });
  }
});
