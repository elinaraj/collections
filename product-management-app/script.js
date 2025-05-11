// Global variables
let products = [];
let editedImages = {};
let uploadedFiles = {};

// DOM Elements
const productsTable = document.getElementById('products-table');
const productsBody = document.getElementById('products-body');
const addProductBtn = document.getElementById('add-product');
// Removed saveAllBtn declaration
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
        const response = await fetch(PATHS.PRODUCTS_JSON_PATH);
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
            // Use the image path as stored in the product data
            const imagePath = product.images[0];
            imageHtml = `<img src="${imagePath}" alt="${product.title}" class="product-image" onerror="this.onerror=null;this.src='${PATHS.IMAGES_PATH}placeholder.jpg';">`;
        } else {
            imageHtml = `<div class="image-placeholder">No Image</div>`;  // No path needed for placeholder div
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
    
    // Add new category button
    const addCategoryBtn = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('edit-new-category');
    const categorySelect = document.getElementById('edit-category');
    
    addCategoryBtn.addEventListener('click', () => {
        const newCategory = ProductMetadata.addNewCategory(products, newCategoryInput.value);
        
        if (newCategory) {
            // Create a new option in the category select
            const newOption = document.createElement('option');
            newOption.value = newCategory;
            newOption.textContent = newCategory;
            categorySelect.appendChild(newOption);
            
            // Select the new category
            categorySelect.value = newCategory;
            
            // Clear the input
            newCategoryInput.value = '';
            
            // Trigger category change to update tags
            categorySelect.dispatchEvent(new Event('change'));
        } else {
            alert('Category already exists or is invalid.');
        }
    });
    
    // Add new tag button
    const addTagBtn = document.getElementById('add-tag-btn');
    const newTagInput = document.getElementById('edit-new-tag');
    const tagsSelect = document.getElementById('edit-tags');
    
    addTagBtn.addEventListener('click', () => {
        const newTag = ProductMetadata.addNewTag(products, newTagInput.value);
        
        if (newTag) {
            // Create a new option in the tags select
            const newOption = document.createElement('option');
            newOption.value = newTag;
            newOption.textContent = newTag;
            tagsSelect.appendChild(newOption);
            
            // Select the new tag
            newOption.selected = true;
            
            // Clear the input
            newTagInput.value = '';
        } else {
            alert('Tag already exists or is invalid.');
        }
    });
    
    // Allow adding tags by pressing Enter
    newTagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTagBtn.click();
            e.preventDefault();
        }
    });
    
    // Allow adding category by pressing Enter
    newCategoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addCategoryBtn.click();
            e.preventDefault();
        }
    });
    
    // Save all changes button removed
    
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

// Populate category dropdown
function populateCategoryDropdown() {
    const categorySelect = document.getElementById('edit-category');
    const categories = ProductMetadata.extractUniqueCategories(products);
    
    // Clear existing options except the first one
    while (categorySelect.options.length > 1) {
        categorySelect.remove(1);
    }
    
    // Add categories
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categorySelect.appendChild(option);
    });
}

// Populate tags dropdown
function populateTagsDropdown(selectedCategory = null) {
    const tagsSelect = document.getElementById('edit-tags');
    let tags = [];
    
    // Clear existing options
    tagsSelect.innerHTML = '';
    
    // Get tags based on category selection
    if (selectedCategory) {
        tags = ProductMetadata.getTagsByCategory(products, selectedCategory);
    } else {
        tags = ProductMetadata.extractUniqueTags(products);
    }
    
    // Add tags
    tags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagsSelect.appendChild(option);
    });
}

// Open edit modal
function openEditModal(productId = null) {
    const isNewProduct = !productId;
    const product = isNewProduct ? createNewProduct() : products.find(p => p.id === productId);
    
    // Populate dropdowns first
    populateCategoryDropdown();
    populateTagsDropdown();
    
    const categorySelect = document.getElementById('edit-category');
    const tagsSelect = document.getElementById('edit-tags');
    
    document.getElementById('edit-id').value = product.id;
    document.getElementById('edit-title').value = product.title;
    categorySelect.value = product.category || '';
    document.getElementById('edit-status').value = product.status;
    document.getElementById('edit-condition').value = product.condition;
    document.getElementById('edit-price').value = product.price;
    
    // Set selected tags
    if (product.category) {
        populateTagsDropdown(product.category);
    }
    
    // Select the tags for this product
    if (product.tags) {
        Array.from(tagsSelect.options).forEach(option => {
            option.selected = product.tags.includes(option.value);
        });
    }
    
    document.getElementById('edit-marketplace-link').value = product.marketplaceLink || '';
    document.getElementById('edit-description').value = product.description;
    
    // Reset uploaded files for this product
    uploadedFiles[product.id] = [];
    
    // Display current images
    displayProductImages(product);
    
    // Add event listener for category change to update tags
    categorySelect.addEventListener('change', function() {
        populateTagsDropdown(this.value);
    });
    
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
                <img src="${image}" alt="Product image" onerror="this.onerror=null;this.src='${PATHS.IMAGES_PATH}placeholder.jpg';">
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
            const imagePath = `${PATHS.IMAGES_PATH}${newFilename}`;
            
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
        tags: Array.from(document.getElementById('edit-tags').selectedOptions).map(option => option.value),
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
    
    // Save changes to server immediately
    saveProductsToServer(products);
    
    // Close modal and re-render table
    editModal.style.display = 'none';
    renderProductsTable();
}

// Save products to server
function saveProductsToServer(productsToSave) {
    fetch('/api/save-products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: productsToSave })
    })
    .then(response => response.json())
    .then(result => {
        console.log('Save result:', result);
        if (result.path) {
            console.log('Saved to path:', result.path);
        }
        
        // Show message about archived images if any
        if (result.archivedImages && result.archivedImages > 0) {
            NotificationManager.success(`${result.archivedImages} deleted image(s) moved to archive folder.`);
        } else if (!result.silentSave) {
            NotificationManager.success('Changes saved successfully!');
        }
    })
    .catch(error => {
        console.error('Error saving products:', error);
        NotificationManager.error('Failed to save changes. Please try again.');
    });
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
        NotificationManager.success('Images uploaded successfully!');
    })
    .catch(error => {
        console.error('Error uploading images:', error);
        NotificationManager.error(`Failed to upload images: ${error.message}`);
    });
    
    // Clear the uploaded files after attempting upload
    uploadedFiles[productId] = [];
}

// Delete a product
function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
        // Remove the product from the array
        const deletedProduct = products.splice(index, 1)[0];
        
        // Save changes to server
        saveProductsToServer(products);
        
        // Archive images if any
        if (deletedProduct.images && deletedProduct.images.length > 0) {
            archiveProductImages(deletedProduct.images);
        }
        
        // Re-render the table
        renderProductsTable();
    }
}

// Archive images of a deleted product
function archiveProductImages(images) {
    // Validate input
    if (!images || images.length === 0) {
        console.log('No images to archive');
        return;
    }
    
    // Create a FormData object to send images to archive
    const formData = new FormData();
    
    // Add each image path to the form data
    images.forEach(imagePath => {
        console.log('Preparing to archive image:', imagePath);
        formData.append('imagePaths', imagePath);
    });
    
    // Send the images to the server for archiving
    fetch('/api/archive-images', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        // Check if the response is OK
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(result => {
        console.log('Images archiving result:', result);
        
        // Notify user about archived images
        if (result.archivedCount > 0) {
            NotificationManager.success(`${result.archivedCount} image(s) moved to archive folder.`);
        } else {
            NotificationManager.info('No images were archived.');
        }
    })
    .catch(error => {
        console.error('Detailed error archiving images:', error);
        
        // More informative error message
        NotificationManager.error(`Failed to archive product images: ${error.message}`);
    });
}

// Removed saveAllChanges function

// End of script.js
