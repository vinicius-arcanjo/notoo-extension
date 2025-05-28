// background.js - Background script for Notoo extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'saveToNotion') {
    saveToNotion(request.data, sendResponse);
    return true; // Required for async sendResponse
  }
});

// Convert localized date to ISO 8601 format
function convertToISODate(dateString) {
  if (!dateString) return null;

  console.log('Converting date:', dateString);

  try {
    // Handle Portuguese date format like "21/ago./2012"
    if (dateString.includes('/')) {
      // Replace abbreviated month names with numbers
      const monthMap = {
        // Portuguese month names
        'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04', 'mai': '05', 'jun': '06',
        'jul': '07', 'ago': '08', 'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
        // English month names
        'feb': '02', 'apr': '04', 'may': '05', 'aug': '08', 'sep': '09', 'oct': '10', 'dec': '12',
        // Spanish month names
        'ene': '01', 'abr': '04', 'ago': '08', 'dic': '12',
        // French month names
        'janv': '01', 'févr': '02', 'mars': '03', 'avr': '04', 'mai': '05', 'juin': '06',
        'juil': '07', 'août': '08', 'sept': '09', 'oct': '10', 'nov': '11', 'déc': '12',
        // German month names
        'jan': '01', 'feb': '02', 'mär': '03', 'apr': '04', 'mai': '05', 'jun': '06',
        'jul': '07', 'aug': '08', 'sep': '09', 'okt': '10', 'nov': '11', 'dez': '12',
        // Italian month names
        'gen': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'mag': '05', 'giu': '06',
        'lug': '07', 'ago': '08', 'set': '09', 'ott': '10', 'nov': '11', 'dic': '12'
      };

      // Remove any dots from abbreviated month names
      let cleanDateString = dateString.replace(/\./g, '');

      // Split the date string
      const parts = cleanDateString.split('/');
      if (parts.length === 3) {
        const day = parts[0].trim().padStart(2, '0');
        let month = parts[1].trim().toLowerCase();
        const year = parts[2].trim();

        // Convert month name to number if it's not already a number
        if (isNaN(month)) {
          // Try with the first three characters (for abbreviations)
          const monthAbbr = month.substring(0, 3);

          // Try with the first four characters (for some languages like French)
          const monthAbbr4 = month.substring(0, 4);

          // Use the mapping or default to January if not found
          month = monthMap[monthAbbr] || monthMap[monthAbbr4] || '01';
        }

        // Format as YYYY-MM-DD
        const isoDate = `${year}-${month}-${day}`;
        console.log('Converted date to ISO format:', isoDate);
        return isoDate;
      }
    }

    // Handle other date formats like MM/DD/YYYY or YYYY-MM-DD
    if (dateString.includes('-') || dateString.includes('/')) {
      const parts = dateString.split(/[-\/]/);

      // Check if we have a valid date format
      if (parts.length === 3) {
        // Try to determine the format based on the values
        let year, month, day;

        // If first part is a 4-digit number, assume YYYY-MM-DD
        if (parts[0].length === 4 && !isNaN(parts[0])) {
          year = parts[0];
          month = parts[1].padStart(2, '0');
          day = parts[2].padStart(2, '0');
        }
        // If last part is a 4-digit number, assume either MM/DD/YYYY or DD/MM/YYYY
        else if (parts[2].length === 4 && !isNaN(parts[2])) {
          year = parts[2];

          // Try to determine if it's MM/DD or DD/MM based on values
          const firstNum = parseInt(parts[0], 10);
          const secondNum = parseInt(parts[1], 10);

          // If first number is > 12, it must be a day
          if (firstNum > 12 && secondNum <= 12) {
            day = parts[0].padStart(2, '0');
            month = parts[1].padStart(2, '0');
          }
          // If second number is > 12, first must be a month
          else if (secondNum > 12 && firstNum <= 12) {
            month = parts[0].padStart(2, '0');
            day = parts[1].padStart(2, '0');
          }
          // If both are <= 12, assume DD/MM format (most common internationally)
          else {
            day = parts[0].padStart(2, '0');
            month = parts[1].padStart(2, '0');
          }
        }

        // If we successfully parsed the date parts, return ISO format
        if (year && month && day) {
          const isoDate = `${year}-${month}-${day}`;
          console.log('Converted date to ISO format:', isoDate);
          return isoDate;
        }
      }
    }

    // Try to parse as a Date object and format as ISO
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const isoDate = date.toISOString().split('T')[0];
      console.log('Converted date using Date object:', isoDate);
      return isoDate;
    }

    // If all else fails, return null
    console.log('Failed to convert date:', dateString);
    return null;
  } catch (error) {
    console.error('Error converting date:', error);
    return null;
  }
}

// Save data to Notion
async function saveToNotion(data, sendResponse) {
  try {
    // Get configuration from storage
    const result = await chrome.storage.sync.get(['config']);
    const config = result.config || { notionToken: '', notionDatabaseId: '' };

    if (!config.notionToken || !config.notionDatabaseId) {
      sendResponse({ success: false, error: 'Notion API not configured' });
      return;
    }

    // Prepare the request to Notion API
    const response = await fetch(`https://api.notion.com/v1/pages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: config.notionDatabaseId },
        properties: {
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
          }
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Notion API error:', errorData);
      sendResponse({ success: false, error: errorData.message || 'API error' });
      return;
    }

    const responseData = await response.json();
    sendResponse({ success: true, data: responseData });
  } catch (error) {
    console.error('Error saving to Notion:', error);
    sendResponse({ success: false, error: error.message });
  }
}

// Initialize default configuration if not set
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.get(['config'], function(result) {
    if (!result.config) {
      chrome.storage.sync.set({
        config: {
          enabled: true,
          notionToken: '',
          notionDatabaseId: '',
          sites: {
            steam: true
          }
        }
      });
    }
  });
});
