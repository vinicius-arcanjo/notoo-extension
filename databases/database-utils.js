// database-utils.js - Common utilities for database operations

// Import database-specific modules
import * as gamesModule from './games/games.js';
import * as moviesModule from './movies/movies.js';
import * as productsModule from './products/products.js';

// Get the appropriate module for a database type
function getModuleForType(databaseType) {
  switch (databaseType) {
    case 'games':
      return gamesModule;
    case 'movies':
      return moviesModule;
    case 'products':
      return productsModule;
    default:
      return gamesModule; // Default to games
  }
}

// Prepare properties for Notion based on database type
function prepareNotionProperties(data, databaseType) {
  const module = getModuleForType(databaseType);
  return module.prepareNotionProperties(data);
}

// Export functions
export { getModuleForType, prepareNotionProperties };
