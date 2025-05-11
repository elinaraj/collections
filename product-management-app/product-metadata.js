// Utility functions to extract unique categories and tags from products

function extractUniqueCategories(products) {
    return [...new Set(products.map(product => product.category))].sort();
}

function extractUniqueTags(products) {
    // Flatten all tags and get unique values
    const allTags = products.flatMap(product => product.tags);
    return [...new Set(allTags)].sort();
}

function getTagsByCategory(products, category) {
    // Find all tags for products in the specified category
    const categoryTags = products
        .filter(product => product.category === category)
        .flatMap(product => product.tags);
    return [...new Set(categoryTags)].sort();
}

function addNewCategory(products, newCategory) {
    // Trim and validate the new category
    const trimmedCategory = newCategory.trim();
    
    // Check if the category already exists (case-insensitive)
    const existingCategories = extractUniqueCategories(products);
    const categoryExists = existingCategories.some(
        cat => cat.toLowerCase() === trimmedCategory.toLowerCase()
    );
    
    // Return the new category if it's unique, otherwise return null
    return categoryExists ? null : trimmedCategory;
}

function addNewTag(products, newTag, selectedCategory = null) {
    // Trim and validate the new tag
    const trimmedTag = newTag.trim();
    
    // Check if the tag already exists (case-insensitive)
    const existingTags = extractUniqueTags(products);
    const tagExists = existingTags.some(
        tag => tag.toLowerCase() === trimmedTag.toLowerCase()
    );
    
    // Return the new tag if it's unique, otherwise return null
    return tagExists ? null : trimmedTag;
}

// Export functions for use in both client and server environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        extractUniqueCategories,
        extractUniqueTags,
        getTagsByCategory,
        addNewCategory,
        addNewTag
    };
} else {
    // Client-side export
    window.ProductMetadata = {
        extractUniqueCategories,
        extractUniqueTags,
        getTagsByCategory,
        addNewCategory,
        addNewTag
    };
}
