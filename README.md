# Game Info Scraper - Chrome Extension

A Chrome extension that scrapes and collects information about games from various websites.

## Features

- Automatically detects and extracts game information from web pages
- Works with popular game stores (Steam, Epic Games Store, GOG, etc.)
- Also works with game review sites and generic web pages
- Stores collected data locally in your browser
- Export data to JSON format
- Simple and intuitive user interface
- Context menu integration for quick access

## Installation

### From Source Code (Developer Mode)

1. Clone or download this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top-right corner
4. Click "Load unpacked" and select the directory containing this extension
5. The extension should now be installed and visible in your Chrome toolbar

### Icon Setup

Before using the extension, you need to add icon files:
1. Create or obtain three PNG icons of sizes 16x16, 48x48, and 128x128 pixels
2. Name them `icon16.png`, `icon48.png`, and `icon128.png` respectively
3. Place them in the `images` directory
4. See `images/README.md` for more details on icon requirements

## Usage

### Basic Usage

1. Navigate to a website containing game information (e.g., Steam, Epic Games Store, game review sites)
2. Click the Game Info Scraper icon in your Chrome toolbar
3. Click the "Scrape Game Information" button in the popup
4. The extension will analyze the current page and extract game information
5. Scraped data will be displayed in the popup and stored locally

### Exporting Data

1. Click the Game Info Scraper icon in your Chrome toolbar
2. Click the "Export Data (JSON)" button
3. A JSON file containing all scraped game data will be downloaded to your computer

### Clearing Data

1. Click the Game Info Scraper icon in your Chrome toolbar
2. Click the "Clear Data" button
3. All stored game information will be deleted

### Context Menu

You can also right-click on any web page and select "Scrape Game Information" from the context menu to quickly scrape the current page.

## Supported Websites

The extension is designed to work with:

- Steam
- Epic Games Store
- GOG
- PlayStation Store
- Xbox/Microsoft Store
- Nintendo Store
- Generic game stores
- Game review sites
- Any website that contains game information in a structured format

For websites that don't match any known pattern, the extension will attempt to use generic scraping methods to identify game information.

## Privacy

All scraped data is stored locally in your browser using Chrome's storage API. No data is sent to any external servers.

## Development

### Project Structure

- `manifest.json` - Extension configuration
- `popup.html` - User interface
- `popup.js` - UI functionality
- `content.js` - Scraping functionality
- `background.js` - Background tasks and context menu integration
- `images/` - Directory for extension icons

### Adding Support for New Websites

To add support for a new website:

1. Add a new case in the `detectPageType()` function in `content.js`
2. Create a new scraper function for the website
3. Add the new scraper to the switch statement in `scrapeGameInfo()`

## License

This project is open source and available for anyone to use and modify.

## Contributing

Contributions are welcome! Feel free to submit pull requests or open issues to improve the extension.
