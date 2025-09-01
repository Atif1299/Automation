const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create client-specific folder
        const clientId = req.params.id || req.clientId || 'unknown';
        const clientUploadDir = path.join(uploadDir, clientId);
        
        if (!fs.existsSync(clientUploadDir)) {
            fs.mkdirSync(clientUploadDir, { recursive: true });
        }
        
        cb(null, clientUploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and random string
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const extension = path.extname(file.originalname);
        const basename = path.basename(file.originalname, extension);
        
        // Sanitize filename
        const sanitizedBasename = basename.replace(/[^a-zA-Z0-9-_]/g, '_');
        const filename = `${sanitizedBasename}-${uniqueSuffix}${extension}`;
        
        cb(null, filename);
    }
});

// File filter for security
const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'text/csv': '.csv',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'text/plain': '.txt',
        'application/pdf': '.pdf',
        'application/json': '.json'
    };

    // Check file type
    if (allowedTypes[file.mimetype]) {
        // Additional check for file extension
        const extension = path.extname(file.originalname).toLowerCase();
        if (Object.values(allowedTypes).includes(extension)) {
            cb(null, true);
        } else {
            cb(new Error(`File extension ${extension} not allowed`), false);
        }
    } else {
        cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
        files: 5, // Maximum 5 files per request
        fields: 10, // Maximum 10 form fields
        fieldSize: 1024 * 1024 // 1MB per field
    }
});

// Middleware for single file upload
const uploadSingle = (fieldName = 'file') => {
    return (req, res, next) => {
        upload.single(fieldName)(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({
                            error: 'File too large. Maximum size is 10MB',
                            code: 'FILE_TOO_LARGE'
                        });
                    }
                    if (err.code === 'LIMIT_FILE_COUNT') {
                        return res.status(400).json({
                            error: 'Too many files. Maximum is 5 files',
                            code: 'TOO_MANY_FILES'
                        });
                    }
                    return res.status(400).json({
                        error: 'File upload error: ' + err.message,
                        code: 'UPLOAD_ERROR'
                    });
                }
                return res.status(400).json({
                    error: err.message,
                    code: 'FILE_VALIDATION_ERROR'
                });
            }
            next();
        });
    };
};

// Middleware for multiple file upload
const uploadMultiple = (fieldName = 'files', maxCount = 5) => {
    return (req, res, next) => {
        upload.array(fieldName, maxCount)(req, res, (err) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(400).json({
                            error: 'One or more files are too large. Maximum size is 10MB per file',
                            code: 'FILE_TOO_LARGE'
                        });
                    }
                    if (err.code === 'LIMIT_FILE_COUNT') {
                        return res.status(400).json({
                            error: `Too many files. Maximum is ${maxCount} files`,
                            code: 'TOO_MANY_FILES'
                        });
                    }
                    return res.status(400).json({
                        error: 'File upload error: ' + err.message,
                        code: 'UPLOAD_ERROR'
                    });
                }
                return res.status(400).json({
                    error: err.message,
                    code: 'FILE_VALIDATION_ERROR'
                });
            }
            next();
        });
    };
};

// File cleanup utility
const cleanupFile = (filePath) => {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Cleaned up file: ${filePath}`);
        }
    } catch (error) {
        console.error(`❌ Error cleaning up file ${filePath}:`, error);
    }
};

// Security scan for uploaded files
const scanUploadedFile = async (req, res, next) => {
    if (!req.file && !req.files) {
        return next();
    }

    const files = req.file ? [req.file] : req.files;
    
    for (const file of files) {
        try {
            // Check file size again (redundant check for security)
            const stats = fs.statSync(file.path);
            if (stats.size > 10 * 1024 * 1024) {
                cleanupFile(file.path);
                return res.status(400).json({
                    error: 'File size exceeds limit',
                    code: 'FILE_TOO_LARGE'
                });
            }

            // Basic virus scanning (check for suspicious patterns)
            if (file.mimetype.startsWith('text/') || file.mimetype === 'application/json') {
                const content = fs.readFileSync(file.path, 'utf8');
                
                // Check for potentially malicious patterns
                const suspiciousPatterns = [
                    /<script/i,
                    /javascript:/i,
                    /vbscript:/i,
                    /onload=/i,
                    /onerror=/i,
                    /eval\(/i,
                    /exec\(/i
                ];

                for (const pattern of suspiciousPatterns) {
                    if (pattern.test(content)) {
                        cleanupFile(file.path);
                        return res.status(400).json({
                            error: 'File contains potentially malicious content',
                            code: 'MALICIOUS_FILE'
                        });
                    }
                }
            }

        } catch (error) {
            console.error('❌ Error scanning file:', error);
            cleanupFile(file.path);
            return res.status(500).json({
                error: 'File security scan failed',
                code: 'SCAN_ERROR'
            });
        }
    }

    next();
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    scanUploadedFile,
    cleanupFile
};
