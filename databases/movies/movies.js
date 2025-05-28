// movies.js - Movie-specific functionality for Notoo extension

// Extract movie data from the page
function extractMovieData() {
  // Placeholder for movie data extraction
  // This will be implemented when movie sites are supported
  return {
    title: '',
    releaseDate: '',
    description: '',
    image: '',
    director: '',
    cast: [],
    genres: [],
    duration: 0,
    rating: 0,
    watched: false,
    watchAgain: false
  };
}

// Prepare movie properties for Notion
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
    Director: {
      rich_text: [
        {
          text: {
            content: data.director
          }
        }
      ]
    },
    Cast: {
      multi_select: data.cast.map(actor => ({ name: actor }))
    },
    Genres: {
      multi_select: data.genres.map(genre => ({ name: genre }))
    },
    Duration: {
      number: data.duration
    },
    Rating: {
      number: data.rating
    },
    Watched: {
      checkbox: data.watched
    },
    WatchAgain: {
      checkbox: data.watchAgain
    }
  };
}

// Export functions
export { extractMovieData, prepareNotionProperties };
