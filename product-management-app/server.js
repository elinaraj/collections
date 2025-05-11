const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// We'll use multer's memory storage initially so we can process the files ourselves
const storage = multer.memoryStorage();

const upload = multer({ storage: storage });

// Middleware to parse JSON bodies
app.use(express.json());

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
        res.json({ success: true, message: 'Products saved successfully', path: filePath });
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
        const imagesDir = path.join(__dirname, 'data/er/v73/resources/images');
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
                const fullDestPath = path.join(__dirname, 'data/er/v73/resources/images', filename);
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

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Images directory: ${path.join(__dirname, 'data/er/v73/resources/images')}`);
});
