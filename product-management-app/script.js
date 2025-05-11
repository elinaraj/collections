// Global variables
let products = [];
let editedImages = {};
let uploadedFiles = {};

// DOM Elements
const productsTable = document.getElementById('products-table');
const productsBody = document.getElementById('products-body');
const addProductBtn = document.getElementById('add-product');
const saveAllBtn = document.getElementById('save-all');
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const closeModal = document.querySelector('.close');
const cancelEdit = document.getElementById('cancel-edit');
const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupEventListeners();
});

// Load products from JSON file
async function loadProducts() {
    try {
        const response = await fetch('data/er/v73/resources/data/products.json');
        const data = await response.json();
        products = data.products;
        renderProductsTable();
    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products. Please try again.');
    }
}

// Render products table
function renderProductsTable() {
    productsBody.innerHTML = '';
    
    products.forEach(product => {
        // Determine marketplace link display
        const marketplaceLinkHtml = product.marketplaceLink 
            ? `<a href="${product.marketplaceLink}" target="_blank">View Listing</a>` 
            : 'No Link';
        const row = document.createElement('tr');
        row.dataset.id = product.id;
        
        // Determine image source or placeholder
        let imageHtml = '';
        if (product.images && product.images.length > 0) {
            // Ensure the image path is correct for the browser
            const imagePath = product.images[0];
            imageHtml = `<img src="${imagePath}" alt="${product.title}" class="product-image" onerror="this.onerror=null;this.src='resources/images/placeholder.jpg';">`;
        } else {
            imageHtml = `<div class="image-placeholder">No Image</div>`;
        }
        
        // Format tags
        const tagsHtml = product.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        row.innerHTML = `
            <td>${product.id}</td>
            <td>${imageHtml}</td>
            <td>${product.title}</td>
            <td>${product.category}</td>
            <td>${product.status}</td>
            <td>${product.condition}</td>
            <td>$${product.price.toFixed(2)}</td>
            <td><div class="tags-display">${tagsHtml}</div></td>
            <td>${marketplaceLinkHtml}</td>
            <td>
                <div class="action-buttons">
                    <button class="edit-btn" data-id="${product.id}">Edit</button>
                    <button class="delete-btn" data-id="${product.id}">Delete</button>
                </div>
            </td>
            <td>${product.description}</td>
        `;
        
        productsBody.appendChild(row);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Add product button
    addProductBtn.addEventListener('click', () => {
        openEditModal();
    });
    
    // Save all changes button
    saveAllBtn.addEventListener('click', saveAllChanges);
    
    // Edit and delete buttons (using event delegation)
    productsBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const productId = e.target.dataset.id;
            openEditModal(productId);
        } else if (e.target.classList.contains('delete-btn')) {
            const productId = e.target.dataset.id;
            deleteProduct(productId);
        }
    });
    
    // Close modal on click
    closeModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });
    
    // Cancel edit button
    cancelEdit.addEventListener('click', () => {
        editModal.style.display = 'none';
    });
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.style.display = 'none';
        }
    });
    
    // Edit form submission
    editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveProductChanges();
    });
    
    // Image upload
    imageUpload.addEventListener('change', handleImageUpload);
}

// Open edit modal
function openEditModal(productId = null) {
    const isNewProduct = !productId;
    const product = isNewProduct ? createNewProduct() : products.find(p => p.id === productId);
    
    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-title').value = product.title;
    document.getElementById('edit-category').value = product.category;
    document.getElementById('edit-status').value = product.status;
    document.getElementById('edit-condition').value = product.condition;
    document.getElementById('edit-price').value = product.price;
    document.getElementById('edit-tags').value = product.tags.join(', ');
    document.getElementById('edit-marketplace-link').value = product.marketplaceLink || '';
    document.getElementById('edit-description').value = product.description;
    
    // Reset uploaded files for this product
    uploadedFiles[product.id] = [];
    
    // Display current images
    displayProductImages(product);
    
    // Show the modal
    editModal.style.display = 'block';
}

// Create a new product template
function createNewProduct() {
    // Generate a new ID (pXXX format)
    const maxId = Math.max(...products.map(p => parseInt(p.id.substring(1))), 0);
    const newId = `p${String(maxId + 1).padStart(3, '0')}`;
    
    return {
        id: newId,
        title: '',
        category: '',
        description: '',
        status: 'Available',
        condition: 'New',
        price: 0.00,
        images: [],
        tags: [],
        marketplaceLink: ''
    };
}

// Display product images in the edit form
function displayProductImages(product) {
    imagePreview.innerHTML = '';
    
    if (product.images && product.images.length > 0) {
        product.images.forEach((image, index) => {
            const previewDiv = document.createElement('div');
            previewDiv.className = 'preview-image';
            previewDiv.innerHTML = `
                <img src="${image}" alt="Product image" onerror="this.onerror=null;this.src='resources/images/placeholder.jpg';">
                <span class="remove-image" data-index="${index}">×</span>
            `;
            imagePreview.appendChild(previewDiv);
            
            // Add event listener to remove button
            const removeBtn = previewDiv.querySelector('.remove-image');
            removeBtn.addEventListener('click', () => {
                // Mark the image for deletion or remove it from newly uploaded
                if (!editedImages[product.id]) {
                    editedImages[product.id] = [...product.images];
                }
                editedImages[product.id].splice(index, 1);
                displayProductImages({...product, images: editedImages[product.id]});
            });
        });
    }
}

// Helper function to sanitize product title for filename
function sanitizeFilename(title) {
    // Remove special characters and replace spaces with hyphens
    return title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-');         // Replace spaces with hyphens
}

// Helper function to extract marketplace item ID from URL
function extractMarketplaceItemId(url) {
    if (!url) return 'no-marketplace-link';
    
    try {
        // Match the item ID in Facebook Marketplace URLs
        const match = url.match(/marketplace\/item\/(\d+)/i);
        return match ? match[1] : 'no-marketplace-link';
    } catch (error) {
        console.error('Error extracting marketplace item ID:', error);
        return 'no-marketplace-link';
    }
}

// Handle image upload
function handleImageUpload(e) {
    const files = e.target.files;
    const productId = document.getElementById('edit-id').value;
    const productTitle = document.getElementById('edit-title').value;
    const marketplaceLink = document.getElementById('edit-marketplace-link').value;
    
    if (!files || files.length === 0) return;
    
    // Initialize uploads for this product if not already
    if (!uploadedFiles[productId]) {
        uploadedFiles[productId] = [];
    }
    
    // Create a copy of the current images array
    if (!editedImages[productId]) {
        const product = products.find(p => p.id === productId);
        editedImages[productId] = product ? [...product.images] : [];
    }
    
    // Get the current image count for this product
    const currentImageCount = editedImages[productId].length;
    
    // Extract marketplace item ID
    const marketplaceItemId = extractMarketplaceItemId(marketplaceLink);
    
    // Process each uploaded file
    Array.from(files).forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(event) {
            // Create a preview of the uploaded image
            const previewDiv = document.createElement('div');
            previewDiv.className = 'preview-image';
            
            // Generate dynamic filename based on product title, marketplace item ID, image count, and timestamp
            const sanitizedTitle = sanitizeFilename(productTitle);
            const timestamp = Math.floor(Date.now() / 1000); // Current timestamp in seconds
            const imageIndex = currentImageCount + index;
            
            // Get file extension from original file
            const fileExtension = file.name.split('.').pop().toLowerCase();
            
            // Construct the new filename
            const newFilename = `${sanitizedTitle}-${marketplaceItemId}-${imageIndex}-${timestamp}.${fileExtension}`;
            const imagePath = `resources/images/${newFilename}`;
            
            previewDiv.innerHTML = `
                <img src="${event.target.result}" alt="New product image">
                <span class="remove-image" data-index="${editedImages[productId].length}">×</span>
            `;
            
            imagePreview.appendChild(previewDiv);
            
            // Add the file to the uploaded files and the image path to the edited images
            uploadedFiles[productId].push({
                file: file,
                path: imagePath
            });
            
            editedImages[productId].push(imagePath);
            
            // Add event listener to remove button
            const removeBtn = previewDiv.querySelector('.remove-image');
            removeBtn.addEventListener('click', () => {
                const index = parseInt(removeBtn.dataset.index);
                editedImages[productId].splice(index, 1);
                
                // Find the corresponding file in uploadedFiles and remove it
                const fileIndex = uploadedFiles[productId].findIndex(f => f.path === imagePath);
                if (fileIndex !== -1) {
                    uploadedFiles[productId].splice(fileIndex, 1);
                }
                
                // Redisplay the images
                const product = products.find(p => p.id === productId) || { id: productId, images: [] };
                displayProductImages({...product, images: editedImages[productId]});
            });
        };
        
        reader.readAsDataURL(file);
    });
    
    // Reset the file input
    e.target.value = '';
}

// Save product changes
function saveProductChanges() {
    const productId = document.getElementById('edit-id').value;
    const existingProduct = products.find(p => p.id === productId);
    
    const updatedProduct = {
        id: productId,
        title: document.getElementById('edit-title').value,
        category: document.getElementById('edit-category').value,
        status: document.getElementById('edit-status').value,
        condition: document.getElementById('edit-condition').value,
        price: parseFloat(document.getElementById('edit-price').value),
        tags: document.getElementById('edit-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        marketplaceLink: document.getElementById('edit-marketplace-link').value.trim() || null,
        description: document.getElementById('edit-description').value,
        images: [] // Will be populated below
    };

    // Determine images to save
    if (editedImages[productId] && editedImages[productId].length > 0) {
        // Use edited images if available
        updatedProduct.images = editedImages[productId];
    } else if (existingProduct && existingProduct.images && existingProduct.images.length > 0) {
        // Preserve existing images if no new images are added
        updatedProduct.images = existingProduct.images;
    }

    // Add or update the product
    const existingProductIndex = products.findIndex(p => p.id === productId);
    if (existingProductIndex === -1) {
        products.push(updatedProduct);
    } else {
        products[existingProductIndex] = updatedProduct;
    }
    
    // Upload any new images
    uploadProductImages(productId);
    
    // Close modal and re-render table
    editModal.style.display = 'none';
    renderProductsTable();
}

// Upload product images to the server
function uploadProductImages(productId) {
    if (!uploadedFiles[productId] || uploadedFiles[productId].length === 0) return;
    
    console.log(`Uploading ${uploadedFiles[productId].length} images for product ${productId}`);
    
    // In a browser environment, we need to use a server-side endpoint to handle file saving
    // as browsers cannot directly write to the filesystem for security reasons
    
    // Create a FormData object to send files to the server
    const formData = new FormData();
    
    // Add each file and its target path to the form data
    uploadedFiles[productId].forEach(upload => {
        formData.append('files', upload.file);
        formData.append('paths', upload.path);
    });
    
    // Send the files to the server
    fetch('/api/upload-images', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Upload successful:', data);
        alert('Images uploaded successfully!');
    })
    .catch(error => {
        console.error('Error uploading images:', error);
        alert(`Failed to upload images: ${error.message}`);
    });
    
    // Clear the uploaded files after attempting upload
    uploadedFiles[productId] = [];
}

// Delete a product
function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
        products.splice(index, 1);
        renderProductsTable();
    }
}

// Save all changes to the JSON file
async function saveAllChanges() {
    // Prepare the data with the current products array
    const data = { products };
    console.log('Saving products data:', data);
    console.log('Server endpoint: /api/save-products');
    
    // Send the data to the server
    fetch('/api/save-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        console.log('Save result:', result);
        if (result.path) {
            console.log('Saved to path:', result.path);
        }
        
        // Show message about archived images if any
        let message = 'Products saved successfully!';
        if (result.archivedImages && result.archivedImages > 0) {
            message += ` ${result.archivedImages} deleted image(s) moved to archive folder.`;
        }
        
        alert(message);
    })
    .catch(error => {
        console.error('Error saving products:', error);
        alert('Failed to save products. Please try again.');
    });
}

// End of script.js
