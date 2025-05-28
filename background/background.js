// background.js - Background script for Notoo extension

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'saveToNotion') {
    saveToNotion(request.data, sendResponse);
    return true; // Required for async sendResponse
  }
});

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
              start: data.releaseDate
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
