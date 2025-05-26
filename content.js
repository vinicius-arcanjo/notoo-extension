/**
 * Game Info Scraper - Content Script
 * This script runs in the context of web pages and extracts game information.
 */

// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "scrapeGames") {
    const games = scrapeGameInfo();
    sendResponse({success: true, games: games});
  }
  return true; // Required to use sendResponse asynchronously
});

/**
 * Main function to scrape game information from the current page
 * This function attempts to identify and extract game information using
 * various selectors and patterns that are common across gaming websites.
 */
function scrapeGameInfo() {
  const games = [];

  // Try to detect what kind of page we're on
  const pageType = detectPageType();

  switch(pageType) {
    case 'steam':
      return scrapeSteamGames();
    case 'epic':
      return scrapeEpicGames();
    case 'gog':
      return scrapeGOGGames();
    case 'psn':
      return scrapePSNGames();
    case 'xbox':
      return scrapeXboxGames();
    case 'nintendo':
      return scrapeNintendoGames();
    case 'generic-store':
      return scrapeGenericStoreGames();
    case 'review-site':
      return scrapeReviewSiteGames();
    default:
      // If we can't determine the page type, try generic scraping methods
      return scrapeGenericGames();
  }
}

/**
 * Detects the type of page we're on based on URL and page structure
 */
function detectPageType() {
  const url = window.location.href.toLowerCase();

  if (url.includes('store.steampowered.com')) {
    return 'steam';
  } else if (url.includes('epicgames.com/store')) {
    return 'epic';
  } else if (url.includes('gog.com')) {
    return 'gog';
  } else if (url.includes('playstation.com') || url.includes('store.playstation.com')) {
    return 'psn';
  } else if (url.includes('xbox.com') || url.includes('microsoft.com/games')) {
    return 'xbox';
  } else if (url.includes('nintendo.com') || url.includes('nintendo.com/store')) {
    return 'nintendo';
  } else if (detectIfGameStore()) {
    return 'generic-store';
  } else if (detectIfReviewSite()) {
    return 'review-site';
  }

  return 'unknown';
}

/**
 * Detects if the current page is likely a game store
 */
function detectIfGameStore() {
  // Look for common elements that indicate a game store
  const hasPrice = document.body.innerText.match(/\$\d+\.\d+|\€\d+\.\d+|\£\d+\.\d+/g);
  const hasAddToCart = document.body.innerText.includes('Add to Cart') ||
                       document.body.innerText.includes('Buy Now') ||
                       document.body.innerText.includes('Purchase');

  return hasPrice && hasAddToCart;
}

/**
 * Detects if the current page is likely a game review site
 */
function detectIfReviewSite() {
  // Look for common elements that indicate a review site
  const hasRating = document.body.innerText.match(/\d+\/10|\d+\.\d+\/10|\d+ out of 10/g);
  const hasReview = document.body.innerText.includes('Review') ||
                    document.body.innerText.includes('Rating') ||
                    document.body.innerText.includes('Score');

  return hasRating && hasReview;
}

/**
 * Scrapes game information from Steam pages
 */
function scrapeSteamGames() {
  const games = [];

  // Single game page
  if (document.querySelector('.apphub_AppName')) {
    const game = {
      title: document.querySelector('.apphub_AppName')?.textContent.trim(),
      price: document.querySelector('.game_purchase_price')?.textContent.trim() ||
             document.querySelector('.discount_final_price')?.textContent.trim(),
      platform: 'PC',
      rating: document.querySelector('.game_review_summary')?.textContent.trim(),
      url: window.location.href,
      source: 'Steam',
      scrapedAt: new Date().toISOString()
    };

    games.push(game);
  }
  // List page
  else {
    const gameElements = document.querySelectorAll('.search_result_row, .tab_item');

    gameElements.forEach(element => {
      const game = {
        title: element.querySelector('.title')?.textContent.trim() ||
               element.querySelector('.tab_item_name')?.textContent.trim(),
        price: element.querySelector('.search_price')?.textContent.trim() ||
               element.querySelector('.discount_final_price')?.textContent.trim(),
        platform: 'PC',
        url: element.href,
        source: 'Steam',
        scrapedAt: new Date().toISOString()
      };

      if (game.title) {
        games.push(game);
      }
    });
  }

  return games;
}

/**
 * Scrapes game information from Epic Games Store
 */
function scrapeEpicGames() {
  const games = [];

  // Implementation would be similar to Steam but with Epic-specific selectors
  // This is a simplified placeholder

  return games;
}

/**
 * Scrapes game information from GOG
 */
function scrapeGOGGames() {
  const games = [];

  // Implementation would be similar to Steam but with GOG-specific selectors
  // This is a simplified placeholder

  return games;
}

/**
 * Scrapes game information from PlayStation Store
 */
function scrapePSNGames() {
  const games = [];

  // Implementation would be similar to Steam but with PSN-specific selectors
  // This is a simplified placeholder

  return games;
}

/**
 * Scrapes game information from Xbox/Microsoft Store
 */
function scrapeXboxGames() {
  const games = [];

  // Implementation would be similar to Steam but with Xbox-specific selectors
  // This is a simplified placeholder

  return games;
}

/**
 * Scrapes game information from Nintendo Store
 */
function scrapeNintendoGames() {
  const games = [];

  // Implementation would be similar to Steam but with Nintendo-specific selectors
  // This is a simplified placeholder

  return games;
}

/**
 * Generic scraper for game stores
 */
function scrapeGenericStoreGames() {
  const games = [];

  // Look for common patterns in game stores
  // Game cards/items often have a consistent structure
  const possibleGameElements = [
    ...document.querySelectorAll('.product-card, .game-card, .item, .product, .game'),
    ...document.querySelectorAll('[class*="game"], [class*="product"]'),
    ...document.querySelectorAll('[id*="game"], [id*="product"]')
  ];

  const uniqueElements = [...new Set(possibleGameElements)];

  uniqueElements.forEach(element => {
    // Try to extract title
    let title = null;
    const titleElement =
      element.querySelector('h1, h2, h3, .title, .name, [class*="title"], [class*="name"]');

    if (titleElement) {
      title = titleElement.textContent.trim();
    }

    if (!title) return;

    // Try to extract price
    let price = null;
    const priceRegex = /\$\d+\.\d+|\€\d+\.\d+|\£\d+\.\d+/;
    const priceElement =
      element.querySelector('.price, [class*="price"]');

    if (priceElement) {
      const priceMatch = priceElement.textContent.match(priceRegex);
      if (priceMatch) {
        price = priceMatch[0];
      } else {
        price = priceElement.textContent.trim();
      }
    }

    // Try to extract platform
    let platform = null;
    const platformElement =
      element.querySelector('.platform, [class*="platform"]');

    if (platformElement) {
      platform = platformElement.textContent.trim();
    }

    // Create game object
    const game = {
      title,
      price,
      platform,
      url: window.location.href,
      source: 'Generic Store',
      scrapedAt: new Date().toISOString()
    };

    games.push(game);
  });

  return games;
}

/**
 * Scrapes game information from review sites
 */
function scrapeReviewSiteGames() {
  const games = [];

  // Look for review articles or cards
  const reviewElements = [
    ...document.querySelectorAll('article, .review, [class*="review"]'),
    ...document.querySelectorAll('h1, h2, h3').filter(h =>
      h.textContent.includes('Review') ||
      h.parentElement.textContent.includes('Review')
    )
  ];

  reviewElements.forEach(element => {
    // Try to find the game title
    let title = null;
    let rating = null;

    // Check if this element itself is a heading with the game title
    if (['H1', 'H2', 'H3'].includes(element.tagName)) {
      const text = element.textContent;
      // Often review titles are in format "Game Name Review" or "Game Name - Review"
      if (text.includes('Review')) {
        title = text.replace(/Review|review|\-|\:|\|/g, '').trim();
      }
    } else {
      // Otherwise look for headings within this element
      const heading = element.querySelector('h1, h2, h3');
      if (heading) {
        const text = heading.textContent;
        if (text.includes('Review')) {
          title = text.replace(/Review|review|\-|\:|\|/g, '').trim();
        } else {
          title = text.trim();
        }
      }
    }

    // Try to find rating
    const ratingRegex = /(\d+(\.\d+)?)\s*\/\s*10|(\d+(\.\d+)?)\s*out of\s*10/i;
    const elementText = element.textContent;
    const ratingMatch = elementText.match(ratingRegex);

    if (ratingMatch) {
      rating = ratingMatch[0];
    }

    if (title) {
      const game = {
        title,
        rating,
        url: window.location.href,
        source: 'Review Site',
        scrapedAt: new Date().toISOString()
      };

      games.push(game);
    }
  });

  return games;
}

/**
 * Generic fallback scraper that tries various methods to find game information
 */
function scrapeGenericGames() {
  const games = [];

  // Try to find game titles in headings
  const headings = document.querySelectorAll('h1, h2, h3');

  headings.forEach(heading => {
    const text = heading.textContent.trim();

    // Skip very short or very long headings
    if (text.length < 3 || text.length > 100) return;

    // Skip headings that are likely not game titles
    if (text.includes('Login') ||
        text.includes('Sign up') ||
        text.includes('Menu') ||
        text.includes('Search')) return;

    // Look for price near the heading
    let price = null;
    let priceElement = null;

    // Check siblings and nearby elements for price
    const siblings = [...heading.parentElement.children];
    for (const sibling of siblings) {
      if (sibling === heading) continue;

      const priceRegex = /\$\d+\.\d+|\€\d+\.\d+|\£\d+\.\d+/;
      const match = sibling.textContent.match(priceRegex);

      if (match) {
        price = match[0];
        priceElement = sibling;
        break;
      }
    }

    // If we found a price, this is likely a game
    if (price || isLikelyGameTitle(text)) {
      const game = {
        title: text,
        price: price,
        url: window.location.href,
        source: 'Generic',
        scrapedAt: new Date().toISOString()
      };

      games.push(game);
    }
  });

  return games;
}

/**
 * Checks if a string is likely to be a game title
 */
function isLikelyGameTitle(text) {
  // Common words/phrases found in game titles
  const gameKeywords = [
    'game', 'play', 'adventure', 'rpg', 'shooter', 'racing', 'puzzle',
    'strategy', 'simulation', 'sports', 'action', 'fps', 'mmorpg',
    'edition', 'remastered', 'deluxe', 'ultimate', 'complete',
    'chronicles', 'legends', 'warriors', 'heroes', 'quest', 'saga',
    'world', 'land', 'fantasy', 'star', 'space', 'war', 'battle',
    'fight', 'combat', 'arena', 'league', 'tournament'
  ];

  // Check if the text contains any game keywords
  return gameKeywords.some(keyword =>
    text.toLowerCase().includes(keyword.toLowerCase())
  );
}
