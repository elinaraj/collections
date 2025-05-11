/**
 * Constants for the product management application
 * Contains path definitions and other configuration constants
 */

// Path constants using Node.js path module for proper path handling
const path = require('path');

// Base directories
const PRODUCT_MANAGEMENT_DIR = path.resolve(__dirname);
const RESOURCES_DIR_PREFIX = path.join(PRODUCT_MANAGEMENT_DIR, 'data', 'er', 'v73');
const RESOURCES_DIR = path.join(RESOURCES_DIR_PREFIX, 'resources');
const DATA_DIR = path.join(RESOURCES_DIR, 'data');
const IMAGES_DIR = path.join(RESOURCES_DIR, 'images');
const IMAGES_ARCHIVED_DIR = path.join(IMAGES_DIR, 'archived');

// Relative paths for client-side use
const RELATIVE_RESOURCES_DIR_PREFIX = 'data/er/v73';
const RELATIVE_RESOURCES_DIR = 'data/er/v73/resources';
const RELATIVE_DATA_DIR = 'data/er/v73/resources/data';
const RELATIVE_IMAGES_DIR = 'data/er/v73/resources/images';
const RELATIVE_IMAGES_ARCHIVED_DIR = 'data/er/v73/resources/images/archived';

// File paths
const PRODUCTS_JSON_FILE = path.join(DATA_DIR, 'products.json');
const RELATIVE_PRODUCTS_JSON_PATH = 'resources/data/products.json';

// Export all constants
module.exports = {
    // Absolute paths (for server-side)
    PRODUCT_MANAGEMENT_DIR,
    RESOURCES_DIR_PREFIX,
    RESOURCES_DIR,
    DATA_DIR,
    IMAGES_DIR,
    IMAGES_ARCHIVED_DIR,
    PRODUCTS_JSON_FILE,
    
    // Relative paths (for client-side)
    RELATIVE_RESOURCES_DIR_PREFIX,
    RELATIVE_RESOURCES_DIR,
    RELATIVE_DATA_DIR,
    RELATIVE_IMAGES_DIR,
    RELATIVE_IMAGES_ARCHIVED_DIR,
    RELATIVE_PRODUCTS_JSON_PATH
};
