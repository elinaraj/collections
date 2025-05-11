/**
 * Product detail page script
 */
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const productDetailContainer = document.getElementById('product-detail-container');
    const productDetailTemplate = document.getElementById('product-detail-template');
    const resourceStatusIndicator = document.getElementById('resource-status').querySelector('.status-indicator');
    const resourceStatusText = document.getElementById('resource-status').querySelector('.status-text');

    // Initialize
    init();

    /**
     * Initialize the page
     */
    async function init() {
        try {
            // Show loading state for resource status
            updateResourceStatus('loading', 'Checking resource availability...');
            
            // Get product ID from URL
            const productId = getProductIdFromUrl();
            
            if (!productId) {
                showError('Product ID not found in URL');
                updateResourceStatus('error', 'Product ID not found');
                return;
            }
            
            // Fetch products data
            await dataService.fetchProducts();
            
            // Update resource status based on which source was used
            if (dataService.currentResourceBase === dataService.baseResourceUrl) {
                updateResourceStatus('success', 'Using remote resources');
            } else {
                updateResourceStatus('success', 'Using local resources');
            }
            
            // Get product by ID
            const product = dataService.getProductById(productId);
            
            if (!product) {
                showError('Product not found');
                updateResourceStatus('error', 'Product not found');
                return;
            }
            
            // Display product details
            displayProductDetails(product);
            
            // Update page title with product name
            document.title = `${product.title} - Elina Tracker`;
        } catch (error) {
            console.error('Initialization error:', error);
            updateResourceStatus('error', 'Failed to load resources');
            showError('Failed to load product details. Please try again later.');
        }
    }

    /**
     * Update resource status indicator
     * @param {string} status - Status type: 'loading', 'success', or 'error'
     * @param {string} message - Status message to display
     */
    function updateResourceStatus(status, message) {
        // Remove all status classes
        resourceStatusIndicator.classList.remove('success', 'error');
        
        // Add appropriate status class
        if (status === 'success') {
            resourceStatusIndicator.classList.add('success');
        } else if (status === 'error') {
            resourceStatusIndicator.classList.add('error');
        }
        
        // Update status text
        resourceStatusText.textContent = message;
    }

    /**
     * Get product ID from URL query parameter
     * @returns {string|null} Product ID or null if not found
     */
    function getProductIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Display product details
     * @param {Object} product - Product data
     */
    function displayProductDetails(product) {
        // Clear loading state
        productDetailContainer.innerHTML = '';
        
        // Clone template
        const productDetailElement = productDetailTemplate.content.cloneNode(true);
        
        // Set product data
        // Main image
        const mainImageElement = productDetailElement.querySelector('.main-image img');
        if (product.images && product.images.length > 0) {
            console.log('Setting main image:', product.images[0]);
            mainImageElement.src = dataService.getResourceUrl(product.images[0]);
        } else {
            console.log('No images available, using placeholder for main image');
            mainImageElement.src = dataService.getResourceUrl('resources/images/placeholder.jpg');
        }
        mainImageElement.alt = product.title;
        
        // Product info
        productDetailElement.querySelector('.product-title').textContent = product.title;
        productDetailElement.querySelector('.product-category').textContent = capitalizeFirstLetter(product.category);
        
        const statusElement = productDetailElement.querySelector('.product-status');
        statusElement.textContent = product.status;
        statusElement.classList.add(product.status);
        
        productDetailElement.querySelector('.product-condition').textContent = product.condition;
        productDetailElement.querySelector('.product-price').textContent = formatPrice(product.price);
        productDetailElement.querySelector('.product-description').textContent = product.description;
        
        // Image thumbnails
        const thumbnailsContainer = productDetailElement.querySelector('.image-thumbnails');
        
        // Check if product has images
        if (product.images && product.images.length > 0) {
            console.log('Setting up image thumbnails:', product.images.length, 'images');
            product.images.forEach((image, index) => {
                const thumbnailElement = document.createElement('div');
                thumbnailElement.classList.add('image-thumbnail');
                if (index === 0) thumbnailElement.classList.add('active');
                
                const imgElement = document.createElement('img');
                imgElement.src = dataService.getResourceUrl(image);
                imgElement.alt = `${product.title} - Image ${index + 1}`;
                
                thumbnailElement.appendChild(imgElement);
                thumbnailsContainer.appendChild(thumbnailElement);
                
                // Add click event to switch main image
                thumbnailElement.addEventListener('click', () => {
                    // Update main image
                    mainImageElement.src = dataService.getResourceUrl(image);
                    mainImageElement.alt = `${product.title} - Image ${index + 1}`;
                    
                    // Update active thumbnail
                    document.querySelectorAll('.image-thumbnail').forEach(thumb => {
                        thumb.classList.remove('active');
                    });
                    thumbnailElement.classList.add('active');
                });
            });
        } else {
            console.log('No images available for thumbnails');
            // Add a single placeholder thumbnail
            const thumbnailElement = document.createElement('div');
            thumbnailElement.classList.add('image-thumbnail', 'active');
            
            const imgElement = document.createElement('img');
            imgElement.src = dataService.getResourceUrl('resources/images/placeholder.jpg');
            imgElement.alt = `${product.title} - Placeholder Image`;
            
            thumbnailElement.appendChild(imgElement);
            thumbnailsContainer.appendChild(thumbnailElement);
        }
        
        // Tags
        const tagsContainer = productDetailElement.querySelector('.product-tags');
        product.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.classList.add('tag');
            tagElement.textContent = tag;
            tagsContainer.appendChild(tagElement);
        });
        
        // Append to container
        productDetailContainer.appendChild(productDetailElement);
    }

    /**
     * Show error message in product detail container
     * @param {string} message - Error message to display
     */
    function showError(message) {
        productDetailContainer.innerHTML = '';
        const errorElement = document.createElement('div');
        errorElement.classList.add('error-message');
        errorElement.textContent = message;
        productDetailContainer.appendChild(errorElement);
    }

    /**
     * Capitalize first letter of a string
     * @param {string} string - Input string
     * @returns {string} String with first letter capitalized
     */
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Format price as currency
     * @param {number} price - Price to format
     * @returns {string} Formatted price
     */
    function formatPrice(price) {
        return `$${price.toFixed(2)}`;
    }
});