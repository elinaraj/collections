/**
 * Data Service for handling product data fetching and filtering
 */
class DataService {
    constructor() {
        this.baseResourceUrl = 'http://localhost:3000/data/er/v73';
        this.localResourcePath = 'product-management-app/data/er/v73'; // Empty string for relative path
        this.productsDataUrl = '/resources/data/products.json';
        this.products = [];
        // Initialize currentResourceBase with a default value
        this.currentResourceBase = this.localResourcePath;
        this.filters = {
            searchTerm: '',
            category: '',
            status: '',
            condition: '',
            priceMin: null,
            priceMax: null
        };
    }

    /**
     * Fetch products data from JSON file
     * @returns {Promise<Array>} Promise resolving to products array
     */
    async fetchProducts() {
        try {
            console.log('Fetching products data...');
            
            // First try to fetch from the remote server with CORS handling
            try {
                const remoteUrl = `${this.baseResourceUrl}${this.productsDataUrl}`;
                console.log('Trying remote URL:', remoteUrl);
                
                const response = await fetch(remoteUrl, {
                    mode: 'cors', // Try with standard CORS first
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Remote data received:', data);
                    this.products = data.products;
                    console.log('Successfully loaded products from remote server with CORS');
                    // Set the current resource base for images
                    this.currentResourceBase = this.baseResourceUrl;
                    return this.products;
                } else {
                    console.warn('Remote server returned error:', response.status, response.statusText);
                }
            } catch (corsError) {
                console.warn('CORS request failed, trying no-cors mode as fallback');
                console.error('CORS error details:', corsError);
                // CORS request failed - we can try proxying the request or using a different approach
                // For now, we'll use a special handling method
                try {
                    // Instead of using fetch directly, we could use a proxy service
                    // or set up a server-side proxy for development
                    // For now, we'll fall back to local resources
                    console.log('Falling back to local resources...');
                } catch (proxyError) {
                    console.warn('Proxy request failed:', proxyError);
                }
            }

            // Fallback to local resources
            const localUrl = `${this.localResourcePath}${this.productsDataUrl}`;
            console.log('Trying local URL:', localUrl);
            
            try {
                const response = await fetch(localUrl);
                if (!response.ok) {
                    console.error('Local fetch failed with status:', response.status, response.statusText);
                    throw new Error(`Failed to fetch products from local path. Status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Local data received:', data);
                
                if (!data.products || !Array.isArray(data.products)) {
                    console.error('Invalid data structure: products array not found');
                    throw new Error('Invalid data structure: products array not found');
                }
                
                this.products = data.products;
                console.log('Successfully loaded products from local resources');
                console.log('Number of products loaded:', this.products.length);
                
                // Set the current resource base for images
                this.currentResourceBase = this.localResourcePath;
                return this.products;
            } catch (localError) {
                console.error('Error loading local products:', localError);
                throw new Error(`Failed to fetch products data from both remote and local sources: ${localError.message}`);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    /**
     * Get the correct resource URL based on current configuration
     * @param {string} resourcePath - The resource path (e.g., 'resources/images/product.jpg')
     * @returns {string} The complete URL to the resource
     */
    getResourceUrl(resourcePath) {
        // If we're using remote resources and there's a CORS issue with images,
        // we might need a proxy or service worker to handle this
        // For now, we'll use the currentResourceBase to determine the path

        // CORS issues with images may still occur when using remote resources
        // If we're using remote resources, we'll handle this as needed
        
        // Check if resourcePath is defined before calling startsWith
        if (!resourcePath) {
            console.warn('Resource path is undefined or null');
            // Return placeholder image path
            return 'resources/images/placeholder.jpg';
        }
        
        console.log('Getting resource URL for:', resourcePath);
        console.log('Current resource base:', this.currentResourceBase);
        
        if (typeof resourcePath === 'string' && resourcePath.startsWith('resources/')) {
            // Remove the 'resources/' prefix as it's already in our URL structure
            const pathWithoutPrefix = resourcePath.replace('resources/', '');
            const fullUrl = `${this.currentResourceBase}/resources/${pathWithoutPrefix}`;
            console.log('Constructed URL:', fullUrl);
            return fullUrl;
        }
        
        // Local path
        console.log('Using original resource path:', resourcePath);
        return resourcePath;
    }

    /**
     * Get unique values for a specific field across all products
     * @param {string} field - The field to get unique values for
     * @returns {Array} Array of unique values
     */
    getUniqueValues(field) {
        if (!this.products.length) return [];
        
        const values = this.products.map(product => product[field]);
        return [...new Set(values)].sort();
    }

    /**
     * Filter products based on current filters
     * @returns {Array} Filtered products array
     */
    filterProducts() {
        return this.products.filter(product => {
            // Search term filter (title and description)
            if (this.filters.searchTerm) {
                const searchTermLower = this.filters.searchTerm.toLowerCase();
                const titleMatch = product.title.toLowerCase().includes(searchTermLower);
                const descMatch = product.description.toLowerCase().includes(searchTermLower);
                if (!titleMatch && !descMatch) return false;
            }
            
            // Category filter
            if (this.filters.category && product.category !== this.filters.category) {
                return false;
            }
            
            // Status filter
            if (this.filters.status && product.status !== this.filters.status) {
                return false;
            }
            
            // Condition filter
            if (this.filters.condition && product.condition !== this.filters.condition) {
                return false;
            }
            
            // Price range filter
            if (this.filters.priceMin !== null && product.price < this.filters.priceMin) {
                return false;
            }
            
            if (this.filters.priceMax !== null && product.price > this.filters.priceMax) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Set filter values
     * @param {Object} filters - Object containing filter values
     */
    setFilters(filters) {
        this.filters = { ...this.filters, ...filters };
    }

    /**
     * Reset all filters to default values
     */
    resetFilters() {
        this.filters = {
            searchTerm: '',
            category: '',
            status: '',
            condition: '',
            priceMin: null,
            priceMax: null
        };
    }

    /**
     * Get a product by ID
     * @param {string} id - Product ID
     * @returns {Object|null} Product object or null if not found
     */
    getProductById(id) {
        return this.products.find(product => product.id === id) || null;
    }
}

// Create a singleton instance
const dataService = new DataService();