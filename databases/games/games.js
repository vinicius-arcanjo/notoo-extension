// games.js - Game-specific functionality for Notoo extension

// Import the convertToISODate function from background.js
import { convertToISODate } from '../../background/background.js';

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

// Prepare game properties for Notion
function prepareNotionProperties(data) {
  return {
    Title: {
      title: [
        {
          text: {
            content: data.title
          }
        }
      ]
    },
    ReleaseDate: data.releaseDate ? {
      date: {
        start: convertToISODate(data.releaseDate)
      }
    } : null,
    Description: {
      rich_text: [
        {
          text: {
            content: data.description.substring(0, 2000) // Notion has a 2000 character limit
          }
        }
      ]
    },
    Image: {
      url: data.image
    },
    Genres: {
      multi_select: data.genres.map(genre => ({ name: genre }))
    },
    Platforms: {
      multi_select: data.platforms.map(platform => ({ name: platform }))
    },
    Slug: {
      rich_text: [
        {
          text: {
            content: data.slug
          }
        }
      ]
    },
    Rating: {
      number: data.rating
    },
    Completed: {
      checkbox: data.completed
    },
    PlayAgain: {
      checkbox: data.playAgain
    },
    Played: {
      checkbox: data.played
    },
    Price: {
      number: data.price
    }
  };
}

// Export functions
export { extractGameData, prepareNotionProperties };
