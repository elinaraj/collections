# Elina's Collections

A responsive product navigation web application for managing and displaying product information.

## Overview

Elina's Collections is a lightweight, responsive web application designed to display and filter product information. The application supports less than 1000 products and provides search and filtering capabilities based on various product attributes.

![Elina's Collections Screenshot]

## Features

- **Product Listings**: Display products in a clean, responsive card format
- **Advanced Filtering**: Filter products by name, description, category, status, condition, and price range
- **Dynamic Dropdowns**: Filter options are populated dynamically from available data
- **Responsive Design**: Optimized for all devices (desktop, tablet, mobile)
- **Product Details**: Dedicated page for product details with image gallery
- **Modular Architecture**: Easy to upgrade to different data sources (S3, database, etc.)

## Directory Structure

```
/
├── index.html                  # Main page with product listings
├── product-detail.html         # Product detail page
├── css/
│   ├── styles.css              # Main styles for both pages
│   └── product-detail.css      # Additional styles for product detail page
├── js/
│   ├── app.js                  # Main page functionality
│   ├── data-service.js         # Shared data service (fetching, filtering)
│   └── product-detail.js       # Product detail page functionality
└── resources/
    ├── data/
    │   └── products.json       # Product data
    └── images/                 # Product images
```

## Getting Started

### Prerequisites

- A web browser (Chrome, Firefox, Safari, Edge)
- For development: A code editor like VS Code, Sublime Text, etc.

### Running Locally

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd elina_collections
   ```

2. Open the `index.html` file in your web browser:
   - Double-click the file
   - Or use a local development server

### Deployment

This application consists of static files that can be hosted on any web server or static site hosting service:

1. **GitHub Pages**:
   - Push the code to a GitHub repository
   - Enable GitHub Pages in the repository settings
   - Your site will be available at `https://<username>.github.io/<repository-name>/`

2. **Other Hosting Options**:
   - Any static site hosting service (Netlify, Vercel, etc.)
   - Traditional web hosting with FTP access

## Product Data Structure

Products are stored in a JSON file at `resources/data/products.json`. Each product has the following structure:

```json
{
  "id": "p001",
  "title": "Product Title",
  "category": "category",
  "description": "Product description",
  "status": "Available",
  "condition": "New",
  "price": 99.99,
  "images": ["resources/images/image1.jpg", "resources/images/image2.jpg"],
  "tags": ["tag1", "tag2", "tag3"]
}
```

## Customization

### Adding New Products

1. Add the product data to `resources/data/products.json`
2. Add product images to `resources/images/`

### Changing Data Source

The application is designed to be easily migrated to a different data source:

1. Modify the `fetchProducts()` method in `js/data-service.js` to fetch data from your preferred source (API, database, etc.)
2. Ensure the data structure matches the expected format

### Styling

- Edit `css/styles.css` for general styling
- Edit `css/product-detail.css` for product detail page styling

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- User authentication
- Shopping cart functionality
- Product ratings and reviews
- Admin panel for product management
- Integration with payment gateways

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Font Awesome for icons
- Google Fonts for typography
