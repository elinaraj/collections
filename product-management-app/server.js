const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const constants = require('./constants');
const app = express();
const port = 3000;

// We'll use multer's memory storage initially so we can process the files ourselves
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

// Middleware to parse JSON bodies and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve files from the data/er/v73 directory directly
app.use('/resources', express.static(path.join(__dirname, 'data/er/v73/resources')));

// API endpoint to save the products JSON
app.post('/api/save-products', (req, res) => {
    console.log('--- API: SAVE PRODUCTS - START ---');
    try {
        const productsData = req.body;
        console.log('Received data:', JSON.stringify(productsData).slice(0, 100) + '...');
        
        // Create the correct path
        const filePath = path.join(__dirname, 'data/er/v73/resources/data/products.json');
        console.log('Target file path:', filePath);
        
        // Ensure directory exists
        const dir = path.dirname(filePath);
        console.log('Target directory:', dir);
        
        if (!fs.existsSync(dir)) {
            console.log('Creating directory:', dir);
            fs.mkdirSync(dir, { recursive: true });
        } else {
            console.log('Directory already exists');
        }
        
        // Check for deleted images by comparing with the existing products
        let existingProducts = [];
        if (fs.existsSync(filePath)) {
            try {
                const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                existingProducts = existingData.products || [];
            } catch (err) {
                console.error('Error reading existing products file:', err);
                // Continue with empty array if file can't be read
            }
        }
        
        // Create a map of product images for quick lookup
        const newProductImages = new Map();
        productsData.products.forEach(product => {
            if (product.images && Array.isArray(product.images)) {
                product.images.forEach(img => {
                    newProductImages.set(img, true);
                });
            }
        });
        
        // Find deleted images
        const deletedImages = [];
        existingProducts.forEach(product => {
            if (product.images && Array.isArray(product.images)) {
                product.images.forEach(img => {
                    if (!newProductImages.has(img)) {
                        deletedImages.push(img);
                    }
                });
            }
        });
        
        // Move deleted images to archived folder
        if (deletedImages.length > 0) {
            console.log(`Found ${deletedImages.length} deleted images to archive`);
            
            // Ensure archived directory exists
            const archivedDir = path.join(__dirname, 'data/er/v73/resources/images/archived');
            if (!fs.existsSync(archivedDir)) {
                fs.mkdirSync(archivedDir, { recursive: true });
                console.log(`Created archived directory: ${archivedDir}`);
            }
            
            // Move each deleted image to archived folder
            deletedImages.forEach(imagePath => {
                try {
                    // The paths in the JSON are in format 'resources/images/filename.ext'
                    // Extract just the filename
                    const filename = path.basename(imagePath);
                    
                    // Get the source directory (images) and destination directory (archived)
                    const imagesDir = path.join(__dirname, 'data/er/v73/resources/images');
                    const sourceImagePath = path.join(imagesDir, filename);
                    
                    console.log(`Looking for image at: ${sourceImagePath}`);
                    
                    // Check if the source file exists
                    if (fs.existsSync(sourceImagePath)) {
                        // Copy the file to archived folder
                        fs.copyFileSync(sourceImagePath, path.join(archivedDir, filename));
                        console.log(`Copied image to archive: ${path.join(archivedDir, filename)}`);
                        
                        // Delete the original file
                        fs.unlinkSync(sourceImagePath);
                        console.log(`Deleted original image: ${sourceImagePath}`);
                    } else {
                        console.log(`Image not found at ${sourceImagePath}`);
                        
                        // Try an alternative path construction if the first one failed
                        const altSourcePath = path.join(__dirname, imagePath);
                        console.log(`Trying alternative path: ${altSourcePath}`);
                        
                        if (fs.existsSync(altSourcePath)) {
                            // Copy the file to archived folder
                            fs.copyFileSync(altSourcePath, path.join(archivedDir, filename));
                            console.log(`Copied image to archive: ${path.join(archivedDir, filename)}`);
                            
                            // Delete the original file
                            fs.unlinkSync(altSourcePath);
                            console.log(`Deleted original image: ${altSourcePath}`);
                        } else {
                            console.log(`Image not found at alternative path either: ${altSourcePath}`);
                        }
                    }
                } catch (moveErr) {
                    console.error(`Error archiving image ${imagePath}:`, moveErr);
                }
            });
        } else {
            console.log('No images to archive');
        }
        
        // Write the JSON data to the file
        console.log('Writing file...');
        fs.writeFileSync(filePath, JSON.stringify(productsData, null, 2));
        console.log('File write complete');
        
        // Verify file was written
        if (fs.existsSync(filePath)) {
            console.log('File exists after write');
            const stats = fs.statSync(filePath);
            console.log('File size:', stats.size, 'bytes');
        } else {
            console.log('File does not exist after write - this is an error');
        }
        
        console.log('--- API: SAVE PRODUCTS - SUCCESS ---');
        res.json({ 
            success: true, 
            message: 'Products saved successfully', 
            path: filePath,
            archivedImages: deletedImages.length
        });
    } catch (error) {
        console.error('--- API: SAVE PRODUCTS - ERROR ---');
        console.error('Error saving products:', error);
        res.status(500).json({ success: false, message: 'Failed to save products', error: error.toString() });
    }
});

// API endpoint to upload images
app.post('/api/upload-images', upload.array('files'), (req, res) => {
    try {
        const paths = Array.isArray(req.body.paths) ? req.body.paths : [req.body.paths].filter(Boolean);
        console.log('Received paths:', paths);
        console.log('Received files:', req.files.map(f => f.originalname));

        // Create directory if it doesn't exist
        const imagesDir = constants.IMAGES_DIR;
        if (!fs.existsSync(imagesDir)) {
            fs.mkdirSync(imagesDir, { recursive: true });
        }

        const uploadedFiles = [];

        // Process each file using its corresponding path
        req.files.forEach((file, index) => {
            const filePath = paths[index];
            
            if (filePath) {
                // Extract the filename portion from the path
                const filename = path.basename(filePath);
                const fullDestPath = path.join(constants.IMAGES_DIR, filename);
                const destDir = path.dirname(fullDestPath);
                
                // Ensure the destination directory exists
                if (!fs.existsSync(destDir)) {
                    fs.mkdirSync(destDir, { recursive: true });
                }
                
                // Write the file to the destination
                fs.writeFileSync(fullDestPath, file.buffer);
                
                uploadedFiles.push({
                    originalName: file.originalname,
                    newName: filename,
                    path: `resources/images/${filename}`
                });
                
                console.log(`File saved: ${fullDestPath}`);
            } else {
                // Fallback to using original filename in default location
                const filename = file.originalname;
                const destPath = path.join(imagesDir, filename);
                
                fs.writeFileSync(destPath, file.buffer);
                
                uploadedFiles.push({
                    originalName: file.originalname,
                    newName: filename,
                    path: `resources/images/${filename}`
                });
                
                console.log(`File saved (fallback): ${destPath}`);
            }
        });
        
        console.log('Successfully processed files:', uploadedFiles);
        res.json({ success: true, message: 'Files uploaded successfully', files: uploadedFiles });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to upload files', 
            error: error.toString() 
        });
    }
});

// API endpoint to archive images
app.post('/api/archive-images', (req, res) => {
    // Log incoming request details
    console.log('--- API: ARCHIVE IMAGES - START ---');
    console.log('Received request body:', req.body);
    console.log('Received image paths:', req.body.imagePaths);
    
    try {
        // Validate input
        const imagePaths = req.body.imagePaths;
        if (!imagePaths) {
            console.warn('No image paths provided in request');
            return res.status(400).json({
                success: false,
                message: 'No image paths provided'
            });
        }
        
        // Ensure imagePaths is an array
        const pathsToArchive = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
        
        // Ensure archived directory exists
        const archivedDir = path.join(__dirname, 'data/er/v73/resources/images/archived');
        if (!fs.existsSync(archivedDir)) {
            fs.mkdirSync(archivedDir, { recursive: true });
            console.log(`Created archived directory: ${archivedDir}`);
        }
        
        // Track archived images
        let archivedCount = 0;
        const archiveErrors = [];
        
        // Archive each image
        pathsToArchive.forEach(imagePath => {
            try {
                // Construct full path to the image
                const fullImagePath = path.join(__dirname, imagePath);
                const filename = path.basename(fullImagePath);
                const destPath = path.join(archivedDir, filename);
                
                console.log(`Attempting to archive: ${fullImagePath}`);
                
                // Check if the source file exists
                if (fs.existsSync(fullImagePath)) {
                    // Copy the file to archived folder
                    fs.copyFileSync(fullImagePath, destPath);
                    
                    // Delete the original file
                    fs.unlinkSync(fullImagePath);
                    
                    archivedCount++;
                    console.log(`Successfully archived image: ${imagePath}`);
                } else {
                    console.warn(`Image not found, skipping: ${imagePath}`);
                    archiveErrors.push(`File not found: ${imagePath}`);
                }
            } catch (archiveErr) {
                console.error(`Error archiving image ${imagePath}:`, archiveErr);
                archiveErrors.push(`Error archiving ${imagePath}: ${archiveErr.message}`);
            }
        });
        
        // Respond with archiving results
        console.log('--- API: ARCHIVE IMAGES - RESULT ---');
        console.log(`Archived ${archivedCount} images`);
        
        if (archiveErrors.length > 0) {
            console.warn('Archive errors:', archiveErrors);
        }
        
        // Detailed response with archiving results
        res.json({
            success: true,
            message: 'Images archived process completed',
            archivedCount: archivedCount,
            errors: archiveErrors,
            requestBody: req.body  // Include original request body for debugging
        });
    } catch (error) {
        console.error('--- API: ARCHIVE IMAGES - ERROR ---');
        console.error('Error archiving images:', error);
        
        res.status(500).json({
            success: false,
            message: 'Failed to archive images',
            error: error.toString()
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Images directory: ${constants.IMAGES_DIR}`);
});
