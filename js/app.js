/**
 * Main application script for the product navigation app
 */
document.addEventListener('DOMContentLoaded', async () => {
    // DOM Elements
    const productsContainer = document.getElementById('products-container');
    const productCountElement = document.getElementById('product-count').querySelector('span');
    const searchTermInput = document.getElementById('search-term');
    const categoryFilterSelect = document.getElementById('category-filter');
    const statusFilterSelect = document.getElementById('status-filter');
    const conditionFilterSelect = document.getElementById('condition-filter');
    const priceMinInput = document.getElementById('price-min');
    const priceMaxInput = document.getElementById('price-max');
    const searchButton = document.getElementById('search-button');
    const resetButton = document.getElementById('reset-button');
    const productCardTemplate = document.getElementById('product-card-template');
    
    // Lazy loading configuration
    const PRODUCTS_PER_BATCH = 12;  // Number of products to load per batch
    let currentProducts = [];       // Array of currently filtered products
    let loadedProductCount = 0;     // Counter for loaded products
    let isLoading = false;          // Flag to prevent multiple load operations

    // Initialize
    init();

    /**
     * Initialize the app
     */
    async function init() {
        try {
            // Fetch products
            await dataService.fetchProducts();
            
            // Populate filter dropdowns
            populateFilterDropdowns();
            
            // Display products
            displayProducts(dataService.products);
            
            // Add event listeners
            setupEventListeners();
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to load products. Please try again later.');
        }
    }

    /**
     * Populate filter dropdown options
     */
    function populateFilterDropdowns() {
        // Categories
        const categories = dataService.getUniqueValues('category');
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = capitalizeFirstLetter(category);
            categoryFilterSelect.appendChild(option);
        });
        
        // Statuses
        const statuses = dataService.getUniqueValues('status');
        const statusGroup = statusFilterSelect.closest('.search-group');
        
        // Conditions
        const conditions = dataService.getUniqueValues('condition');
        const conditionGroup = conditionFilterSelect.closest('.search-group');
        
        // Get the search row that contains both status and condition
        const statusConditionRow = statusGroup.closest('.search-row');
        
        // Check if both status and condition have only one option each
        if (statuses.length <= 1 && conditions.length <= 1) {
            // Hide the entire row if both dropdowns would be hidden
            statusConditionRow.style.display = 'none';
        } else {
            // Otherwise show the row
            statusConditionRow.style.display = '';
            
            // Handle Status dropdown
            if (statuses.length > 1) {
                // Show the status filter dropdown and populate it
                statusGroup.style.display = '';
                statuses.forEach(status => {
                    const option = document.createElement('option');
                    option.value = status;
                    option.textContent = status;
                    statusFilterSelect.appendChild(option);
                });
            } else {
                // Hide the status filter dropdown if there's only one option
                statusGroup.style.display = 'none';
            }
            
            // Handle Condition dropdown
            if (conditions.length > 1) {
                // Show the condition filter dropdown and populate it
                conditionGroup.style.display = '';
                conditions.forEach(condition => {
                    const option = document.createElement('option');
                    option.value = condition;
                    option.textContent = condition;
                    conditionFilterSelect.appendChild(option);
                });
            } else {
                // Hide the condition filter dropdown if there's only one option
                conditionGroup.style.display = 'none';
            }
        }
    }

    /**
     * Set up event listeners
     */
    function setupEventListeners() {
        // Search container toggle button
        const searchContainer = document.querySelector('.search-container');
        const toggleSearchButton = document.getElementById('toggle-search');
        
        toggleSearchButton.addEventListener('click', () => {
            searchContainer.classList.toggle('collapsed');
            
            // Update button text
            const isCollapsed = searchContainer.classList.contains('collapsed');
            toggleSearchButton.innerHTML = isCollapsed 
                ? '<i class="fas fa-search"></i> Show Search Filters' 
                : '<i class="fas fa-times"></i> Hide Search Filters';
        });

        // Collapse search container on initial load
        searchContainer.classList.add('collapsed');
        toggleSearchButton.innerHTML = '<i class="fas fa-search"></i> Show Search Filters';
        // Search button
        searchButton.addEventListener('click', handleSearch);
        
        // Reset button
        resetButton.addEventListener('click', handleReset);
        
        // Enter key in search input
        searchTermInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSearch();
        });
        
        // Price inputs validation (only allow numbers)
        priceMinInput.addEventListener('input', validateNumberInput);
        priceMaxInput.addEventListener('input', validateNumberInput);
    }

    /**
     * Handle search action
     */
    function handleSearch() {
        // Get filter values
        const filters = {
            searchTerm: searchTermInput.value.trim(),
            category: categoryFilterSelect.value,
            status: statusFilterSelect.value,
            condition: conditionFilterSelect.value,
            priceMin: priceMinInput.value ? parseFloat(priceMinInput.value) : null,
            priceMax: priceMaxInput.value ? parseFloat(priceMaxInput.value) : null
        };
        
        // Set filters in data service
        dataService.setFilters(filters);
        
        // Get filtered products
        const filteredProducts = dataService.filterProducts();
        
        // Display filtered products
        displayProducts(filteredProducts);
    }

    /**
     * Handle reset filters action
     */
    function handleReset() {
        // Reset form inputs
        searchTermInput.value = '';
        categoryFilterSelect.value = '';
        statusFilterSelect.value = '';
        conditionFilterSelect.value = '';
        priceMinInput.value = '';
        priceMaxInput.value = '';
        
        // Reset filters in data service
        dataService.resetFilters();
        
        // Display all products
        displayProducts(dataService.products);
    }

    /**
     * Display products in the grid
     * @param {Array} products - Products to display
     */
    function displayProducts(products) {
        // Update product count
        productCountElement.textContent = products.length;
        
        // Clear existing products
        productsContainer.innerHTML = '';
        
        // Reset lazy loading state
        currentProducts = [...products]; // Make a copy of the products array
        loadedProductCount = 0;
        isLoading = false;
        
        // Show message if no products found
        if (products.length === 0) {
            const noProductsElement = document.createElement('div');
            noProductsElement.classList.add('no-products');
            noProductsElement.textContent = 'No products found. Try different filters.';
            productsContainer.appendChild(noProductsElement);
            return;
        }
        
        // Create loading indicator
        const loadingIndicator = createLoadingIndicator();
        productsContainer.appendChild(loadingIndicator);
        
        // Load first batch of products
        loadMoreProducts();
        
        // Set up intersection observer for infinite scrolling
        setupIntersectionObserver();
    }

    /**
     * Create a product card element
     * @param {Object} product - Product data
     * @returns {HTMLElement} Product card element
     */
    function createProductCard(product) {
        // Clone the template
        const productCard = productCardTemplate.content.cloneNode(true).querySelector('.product-card');
        
        // Set product data
        const imgElement = productCard.querySelector('.product-image img');
        // Use the resource URL helper to get the correct image path
        // Check if the product has images
        if (product.images && product.images.length > 0) {
            const imagePath = product.images[0];
            console.log('Original image path:', imagePath);
            const imageUrl = dataService.getResourceUrl(imagePath); // Use first image as preview
            console.log('Resolved image URL:', imageUrl);
            imgElement.src = imageUrl;
        } else {
            // Use a placeholder image if no images are available
            console.log('No images available, using placeholder');
            imgElement.src = dataService.getResourceUrl('resources/images/placeholder.jpg');
        }
        imgElement.alt = product.title;
        
        productCard.querySelector('.product-title').textContent = product.title;
        productCard.querySelector('.product-category').textContent = capitalizeFirstLetter(product.category);
        
        const statusElement = productCard.querySelector('.product-status');
        statusElement.textContent = product.status;
        statusElement.classList.add(product.status);
        
        productCard.querySelector('.product-condition').textContent = product.condition;
        productCard.querySelector('.product-price').textContent = formatPrice(product.price);
        
        // Create tags
        const tagsContainer = productCard.querySelector('.product-tags');
        product.tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.classList.add('tag');
            tagElement.textContent = formatTag(tag);
            tagsContainer.appendChild(tagElement);
        });
        
        // Create Marketplace Link button
        const marketplaceButton = document.createElement('a');
        marketplaceButton.classList.add('marketplace-link');
        marketplaceButton.href = product.marketplaceLink || 'https://www.facebook.com/marketplace/profile/100071955871730';
        marketplaceButton.target = '_blank';
        marketplaceButton.innerHTML = '<i class="fab fa-facebook"></i> View on Marketplace';
        
        // Prevent card click when Marketplace button is clicked
        marketplaceButton.addEventListener('click', (e) => {
            e.stopPropagation();
        });
        
        productCard.querySelector('.product-info').appendChild(marketplaceButton);
        
        // Add click event to open product detail popup
        productCard.addEventListener('click', () => {
            openProductPopup(product.id);
        });
        
        return productCard;
    }

    /**
     * Show error message in products container
     * @param {string} message - Error message to display
     */
    function showError(message) {
        productsContainer.innerHTML = '';
        const errorElement = document.createElement('div');
        errorElement.classList.add('error-message');
        errorElement.textContent = message;
        productsContainer.appendChild(errorElement);
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
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    }

    /**
     * Format tag by removing square-bracketed prefix
     * @param {string} tag - Original tag text (e.g. "[1] Bedsheet Set")
     * @returns {string} Formatted tag (e.g. "Bedsheet Set")
     */
    function formatTag(tag) {
        // Remove anything between square brackets at the start of the tag, including the brackets and any space after
        return tag.replace(/^\[.*?\]\s*/, '');
    }

    /**
     * Validate number input (allow only numbers)
     * @param {Event} e - Input event
     */
    function validateNumberInput(e) {
        if (!/^\d*\.?\d*$/.test(e.target.value)) {
            // Remove any non-numeric characters except for decimal point
            e.target.value = e.target.value.replace(/[^\d.]/g, '');
            // Ensure only one decimal point
            e.target.value = e.target.value.replace(/(\..*)\./g, '$1');
        }
    }

    /**
     * Open product popup with details
     * @param {string} productId - ID of the product to display
     */
    async function openProductPopup(productId) {
        try {
            // Find the product by ID
            const product = dataService.products.find(p => p.id === productId);
            if (!product) {
                console.error('Product not found:', productId);
                return;
            }

            // Clone the popup template
            const popupTemplate = document.getElementById('product-popup-template');
            const popup = popupTemplate.content.cloneNode(true);
            const popupOverlay = popup.querySelector('.product-popup-overlay');
            const popupContent = popup.querySelector('.product-popup-content');
            
            // Populate product details
            const imgElement = popup.querySelector('.main-image img');
            if (product.images && product.images.length > 0) {
                const imageUrl = dataService.getResourceUrl(product.images[0]);
                imgElement.src = imageUrl;
                imgElement.alt = product.title;
                
                // Add thumbnails if there are multiple images
                const thumbnailsContainer = popup.querySelector('.image-thumbnails');
                if (product.images.length > 1) {
                    product.images.forEach((imagePath, index) => {
                        const thumbnail = document.createElement('div');
                        thumbnail.classList.add('image-thumbnail');
                        if (index === 0) thumbnail.classList.add('active');
                        
                        const thumbImg = document.createElement('img');
                        thumbImg.src = dataService.getResourceUrl(imagePath);
                        thumbImg.alt = `${product.title} - Image ${index + 1}`;
                        
                        thumbnail.appendChild(thumbImg);
                        thumbnailsContainer.appendChild(thumbnail);
                        
                        // Add click event to switch main image
                        thumbnail.addEventListener('click', () => {
                            // Update main image
                            imgElement.src = dataService.getResourceUrl(imagePath);
                            
                            // Update active thumbnail
                            thumbnailsContainer.querySelectorAll('.image-thumbnail').forEach(thumb => {
                                thumb.classList.remove('active');
                            });
                            thumbnail.classList.add('active');
                        });
                    });
                }
            } else {
                imgElement.src = dataService.getResourceUrl('resources/images/placeholder.jpg');
                imgElement.alt = 'No image available';
            }
            
            // Populate text content
            popup.querySelector('.product-title').textContent = product.title;
            
            // Style category, status, and condition as pills
            const categoryElement = popup.querySelector('.product-category');
            categoryElement.textContent = capitalizeFirstLetter(product.category);
            categoryElement.classList.add('pill');
            
            const statusElement = popup.querySelector('.product-status');
            statusElement.textContent = product.status;
            statusElement.classList.add('pill', product.status.toLowerCase());
            
            const conditionElement = popup.querySelector('.product-condition');
            conditionElement.textContent = product.condition;
            conditionElement.classList.add('pill');
            
            popup.querySelector('.product-price').textContent = formatPrice(product.price);
            
            // Add description if available
            const descriptionElement = popup.querySelector('.product-description');
            if (product.description) {
                descriptionElement.textContent = product.description;
            } else {
                descriptionElement.textContent = 'No description available.';
            }
            
            // Create Marketplace Link button (same as in product cards)
            const marketplaceButton = document.createElement('a');
            marketplaceButton.classList.add('marketplace-link');
            marketplaceButton.href = product.marketplaceLink || 'https://www.facebook.com/marketplace/profile/100071955871730';
            marketplaceButton.target = '_blank';
            marketplaceButton.innerHTML = '<i class="fab fa-facebook"></i> View on Marketplace';
            
            // Add marketplace button after description
            descriptionElement.insertAdjacentElement('afterend', marketplaceButton);
            
            // Add tags
            const tagsContainer = popup.querySelector('.product-tags');
            product.tags.forEach(tag => {
                const tagElement = document.createElement('span');
                tagElement.classList.add('tag');
                tagElement.textContent = formatTag(tag);
                tagsContainer.appendChild(tagElement);
            });
            
            // Close button event
            const closeBtn = popup.querySelector('.popup-close-btn');
            closeBtn.addEventListener('click', () => {
                closeProductPopup(popupOverlay);
            });
            
            // Close on click outside of content
            popupOverlay.addEventListener('click', (e) => {
                if (e.target === popupOverlay) {
                    closeProductPopup(popupOverlay);
                }
            });
            
            // Add the popup to the document
            document.body.appendChild(popup);
            
            // Show the popup with a small delay for the transition to work
            setTimeout(() => {
                popupOverlay.classList.add('active');
            }, 10);
            
        } catch (error) {
            console.error('Error opening product popup:', error);
        }
    }

/**
 * Close product popup
 * @param {HTMLElement} popupOverlay - The popup overlay element to close
 */
function closeProductPopup(popupOverlay) {
    if (!popupOverlay) return;
    
    // Add closing animation class
    popupOverlay.classList.add('closing');
    
    // Remove after animation completes
    setTimeout(() => {
        popupOverlay.remove();
    }, 300);
}

/**
 * Create a loading indicator element
 * @returns {HTMLElement} Loading indicator element
 */
function createLoadingIndicator() {
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('loading-indicator');
    loadingElement.innerHTML = '<div class="spinner"></div><p>Loading more products...</p>';
    loadingElement.id = 'loading-indicator';
    return loadingElement;
}

/**
 * Set up intersection observer for infinite scrolling
 */
function setupIntersectionObserver() {
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (!loadingIndicator) return;
    
    const options = {
        root: null, // Use viewport as root
        rootMargin: '0px',
        threshold: 0.1 // Trigger when 10% of the element is visible
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !isLoading && loadedProductCount < currentProducts.length) {
                loadMoreProducts();
            }
        });
    }, options);
    
    observer.observe(loadingIndicator);
}

/**
 * Load more products
 */
function loadMoreProducts() {
    if (isLoading || loadedProductCount >= currentProducts.length) return;
    
    isLoading = true;
    
    const start = loadedProductCount;
    const end = Math.min(loadedProductCount + PRODUCTS_PER_BATCH, currentProducts.length);
    const batch = currentProducts.slice(start, end);
    
    // Add a small delay to simulate loading (remove in production if not needed)
    setTimeout(() => {
        // Create product cards for this batch
        batch.forEach(product => {
            const productCard = createProductCard(product);
            // Insert before the loading indicator
            const loadingIndicator = document.getElementById('loading-indicator');
            productsContainer.insertBefore(productCard, loadingIndicator);
        });
        
        loadedProductCount += batch.length;
        isLoading = false;
        
        // Hide loading indicator when all products are loaded
        if (loadedProductCount >= currentProducts.length) {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    }, 300); // Small delay for smoother loading experience
}
});