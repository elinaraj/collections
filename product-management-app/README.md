# Product Manager Web Application

A simple web application to manage product data and images. This application allows users to:

- View all products in a tabular format
- Edit product details directly through the UI
- Upload and manage multiple images for each product
- Save all data to a JSON file structure

## Project Structure

```
elina_tracker2/
├── data/
│   └── er/
│       └── v73/
│           └── resources/
│               └── images/              # Directory for product images
│               └── data/products.json   # Product data in JSON format
├── index.html                           # Main application page
├── styles.css                           # CSS styles
├── script.js                            # Frontend JavaScript
├── server.js                            # Express server for handling API requests
└── package.json                         # Node.js dependencies
```

## Installation

1. Make sure you have Node.js installed (https://nodejs.org/).
2. Clone or download this repository.
3. Navigate to the project directory.
4. Install dependencies:

```bash
npm install
```

## Running the Application

1. Start the server:

```bash
npm start
```

2. Open your browser and go to: `http://localhost:3000`

## Features

### Product Table
- Displays all products with their details
- Shows the first image for each product
- Edit and delete buttons for each product

### Add/Edit Product
- Form for adding new products or editing existing ones
- Upload multiple images
- Preview and remove images before saving

### Data Management
- Automatically saves product data to `data/er/v73/resources/data/products.json`
- Uploads images to `data/er/v73/resources/images/`
- Updates JSON structure to match the format requirements

## API Endpoints

The application provides the following API endpoints:

- `POST /api/save-products` - Save the product data to the JSON file
- `POST /api/upload-images` - Upload product images to the server

## Technologies Used

- HTML, CSS, and JavaScript for the frontend
- Node.js and Express for the backend server
- Multer for handling file uploads
