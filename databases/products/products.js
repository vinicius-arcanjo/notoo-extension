// products.js - Product-specific functionality for Notoo extension

// Extract product data from the page
function extractProductData() {
  // Placeholder for product data extraction
  // This will be implemented when product sites are supported
  return {
    title: '',
    description: '',
    image: '',
    price: 0,
    brand: '',
    categories: [],
    rating: 0,
    purchased: false,
    wishlist: false
  };
}

// Prepare product properties for Notion
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
    Price: {
      number: data.price
    },
    Brand: {
      rich_text: [
        {
          text: {
            content: data.brand
          }
        }
      ]
    },
    Categories: {
      multi_select: data.categories.map(category => ({ name: category }))
    },
    Rating: {
      number: data.rating
    },
    Purchased: {
      checkbox: data.purchased
    },
    Wishlist: {
      checkbox: data.wishlist
    }
  };
}

// Export functions
export { extractProductData, prepareNotionProperties };
