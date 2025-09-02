const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const axios = require('axios');

// Configure multer for admin file uploads with enhanced organization
const adminStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Create organized directory structure
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const uploadDir = path.join(__dirname, '../uploads/admin-files', `${year}`, `${month}`);
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with better structure
        const timestamp = Date.now();
        const randomId = Math.round(Math.random() * 1E9);
        const fileExt = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, fileExt);
        
        // Clean filename for better compatibility
        const cleanBaseName = baseName.replace(/[^a-zA-Z0-9\-_\s]/g, '').substring(0, 50);
        const finalName = `admin-${timestamp}-${randomId}-${cleanBaseName}${fileExt}`;
        
        cb(null, finalName);
    }
});

const adminUpload = multer({ 
    storage: adminStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        // Allow most common file types
        const allowedTypes = /\.(jpg|jpeg|png|gif|pdf|doc|docx|xls|xlsx|txt|csv|zip|rar|mp4|avi|mov)$/i;
        if (allowedTypes.test(file.originalname)) {
            cb(null, true);
        } else {
            cb(new Error('File type not allowed'), false);
        }
    }
});

// Import models only if database is connected
let Client, Admin;
try {
    Client = require('../models/Client');
    Admin = require('../models/Admin');
} catch (error) {
    console.warn('⚠️ Models not loaded - database may be unavailable');
}

router.get('/', async (req, res) => {
    try {
        // Check if database is connected
        if (mongoose.connection.readyState !== 1 || !Client) {
            console.warn('⚠️ Database not connected, rendering with sample data');
            return res.render('admin/dashboard', { 
                title: 'Admin Dashboard', 
                layout: false,
                isAdminDashboard: true,
                clients: [],
                stats: {
                    totalClients: 0,
                    activeClients: 0,
                    totalMessages: 0,
                    newSignups: 0
                },
                databaseConnected: false
            });
        }

        // Fetch initial clients for display
        const clients = await Client.find({}).sort({ createdAt: -1 }).limit(50);

        // Optimized statistics calculation using aggregation
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const statsArr = await Client.aggregate([
            {
                $group: {
                    _id: null,
                    totalClients: { $sum: 1 },
                    activeClients: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
                    totalMessages: { $sum: { $size: "$activityLogs" } },
                    newSignups: { $sum: { $cond: [{ $gt: ["$createdAt", oneWeekAgo] }, 1, 0] } }
                }
            }
        ]);

        const stats = statsArr[0] || {
            totalClients: 0,
            activeClients: 0,
            totalMessages: 0,
            newSignups: 0
        };

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            layout: false,
            isAdminDashboard: true,
            clients: clients,
            stats: stats,
            databaseConnected: true
        });
    } catch (error) {
        console.error('❌ Error loading admin dashboard:', error);
        
        // Render with empty data if database operation fails
        res.render('admin/dashboard', { 
            title: 'Admin Dashboard', 
            layout: false,
            isAdminDashboard: true,
            clients: [],
            stats: {
                totalClients: 0,
                activeClients: 0,
                totalMessages: 0,
                newSignups: 0
            },
            databaseConnected: false,
            error: 'Database connection failed. Please check your connection settings.'
        });
    }
});

// Send message to client
router.post('/message', async (req, res) => {
    try {
        console.log('Message request received:', req.body);
        const { clientId, message } = req.body;
        
        if (!clientId || !message) {
            console.log('Missing clientId or message:', { clientId, message });
            return res.status(400).json({ error: 'Client ID and message are required' });
        }

        // Check if database is connected
        if (mongoose.connection.readyState !== 1 || !Client) {
            console.log('Database not available');
            return res.status(503).json({ error: 'Database not available. Please try again later.' });
        }

        console.log('Looking for client with ID:', clientId);
        // Find the client and add the message to their activity logs
        const client = await Client.findOne({ clientId: clientId }).maxTimeMS(5000);
        
        if (!client) {
            console.log('Client not found:', clientId);
            return res.status(404).json({ error: 'Client not found' });
        }

        console.log('Client found:', client.name);
        // Add admin message to client's activity logs
        const adminMessage = {
            type: 'info',  // Use valid enum value
            message: message,  // Use message field (required)
            details: 'Message from Admin Panel',  // Use details for additional info
            timestamp: new Date(),
            source: 'admin'  // Indicate this came from admin
        };

        client.activityLogs.push(adminMessage);
        await client.save();

        console.log('Message saved successfully');
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// POST route to send file to client
router.post('/send-file', adminUpload.single('file'), async (req, res) => {
    try {
        const { clientId, message, category } = req.body;
        const file = req.file;
        
        if (!clientId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Client ID is required' 
            });
        }
        
        if (!file) {
            return res.status(400).json({ 
                success: false, 
                message: 'File is required' 
            });
        }

        // Check if database is connected
        if (mongoose.connection.readyState !== 1 || !Client) {
            return res.status(503).json({ 
                success: false, 
                message: 'Database not available' 
            });
        }

        // Find the client
        const client = await Client.findOne({ clientId }).maxTimeMS(5000);
        
        if (!client) {
            // Delete uploaded file if client not found
            fs.unlinkSync(file.path);
            return res.status(404).json({ 
                success: false, 
                message: 'Client not found' 
            });
        }

        // Create enhanced file record for client
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const relativePath = `admin-files/${year}/${month}/${file.filename}`;
        
        const fileRecord = {
            fileName: file.filename, // Actual disk filename
            originalName: file.originalname, // Original uploaded name
            fileSize: file.size,
            fileType: file.mimetype,
            uploadDate: new Date(),
            status: 'admin_sent',
            category: category || 'other',
            adminMessage: message || '',
            downloadPath: `/uploads/${relativePath}`,
            relativePath: relativePath, // For cloud migration
            diskPath: path.join(__dirname, '../uploads', relativePath),
            fileHash: null, // For future integrity checking
            isActive: true,
            downloadCount: 0,
            lastAccessed: null
        };

        // Add file to client's uploaded files and get the new sub-document
        const newFile = client.uploadedFiles.create(fileRecord);
        client.uploadedFiles.push(newFile);

        // Add activity log entry
        const activityMessage = message ? 
            `Admin sent file: ${file.originalname} - ${message}` : 
            `Admin sent file: ${file.originalname}`;
            
        client.activityLogs.push({
            type: 'info',
            message: activityMessage,
            details: `File: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`,
            timestamp: new Date(),
            source: 'admin',
            fileInfo: {
                fileId: newFile._id, // Add the fileId to the log
                fileName: file.filename,
                originalName: file.originalname,
                category: category || 'other',
                downloadPath: `/uploads/admin-files/${file.filename}`
            }
        });

        await client.save();

        console.log(`✅ File sent to client ${clientId}:`, {
            originalName: file.originalname,
            size: file.size,
            category: category,
            message: message
        });

        res.json({ 
            success: true, 
            message: `File "${file.originalname}" sent successfully to ${client.name}`,
            fileInfo: {
                originalName: file.originalname,
                size: file.size,
                category: category
            }
        });

    } catch (error) {
        console.error('❌ Error sending file to client:', error);
        
        // Clean up uploaded file on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while sending file',
            error: error.message 
        });
    }
});

// GET route to search and filter clients
router.get('/clients', async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { clientId: { $regex: search, $options: 'i' } }
            ];
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const clients = await Client.find(query).sort({ createdAt: -1 });
        res.json({ success: true, clients });

    } catch (error) {
        console.error('❌ Error searching clients:', error);
        res.status(500).json({ success: false, message: 'Failed to search clients' });
    }
});

// GET route to fetch client messages (must come before the general /clients/:clientId route)
router.get('/clients/:clientId/messages', async (req, res) => {
    try {
        const { clientId } = req.params;
        console.log('Fetching messages for client:', clientId);
        
        if (!clientId) {
            return res.status(400).json({ error: 'Client ID is required' });
        }

        // Check if database is connected
        if (mongoose.connection.readyState !== 1 || !Client) {
            return res.status(503).json({ error: 'Database not available. Please try again later.' });
        }

        // Find the client and get their activity logs
        const client = await Client.findOne({ clientId: clientId }).maxTimeMS(5000);
        
        if (!client) {
            console.log('Client not found:', clientId);
            return res.status(404).json({ error: 'Client not found' });
        }

        // Filter activity logs to get admin messages and format them for chat display
        const messages = client.activityLogs
            .filter(log => log.source === 'admin')  // Filter by source instead of type
            .map(log => ({
                type: 'admin',
                message: log.message,  // Use message field
                details: log.details,
                time: log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Unknown',
                timestamp: log.timestamp
            }))
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        console.log(`Found ${messages.length} messages for client ${clientId}`);
        res.json(messages);
    } catch (error) {
        console.error('Error fetching client messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// GET route to fetch individual client details
router.get('/clients/:clientId', async (req, res) => {
    try {
        const { clientId } = req.params;
        
        // Check if database is connected
        if (mongoose.connection.readyState !== 1 || !Client) {
            return res.status(503).json({ 
                success: false, 
                message: 'Database not available' 
            });
        }

        // Find the client by clientId
        const client = await Client.findOne({ clientId }).maxTimeMS(5000);
        
        if (!client) {
            return res.status(404).json({ 
                success: false, 
                message: 'Client not found' 
            });
        }

        // Format the response data for the modal
        const clientData = {
            name: client.name || 'Unknown',
            email: client.email || 'No email provided',
            clientId: client.clientId,
            joined: client.createdAt ? new Date(client.createdAt).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            }) : 'Unknown',
            status: client.status || 'inactive',
            platforms: client.platforms || [],
            credentials: client.credentials || [],
            configurations: client.configurations || [],
            activityLogs: client.activityLogs || [],
            campaigns: client.campaigns || [],
            uploadedFiles: client.uploadedFiles || []
        };

        res.json({ 
            success: true, 
            client: clientData 
        });

    } catch (error) {
        console.error('❌ Error fetching client details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while fetching client details',
            error: error.message 
        });
    }
});

// DELETE route to remove a client and all associated data
router.delete('/clients/:clientId', async (req, res) => {
    console.log('🎯 DELETE route hit - URL:', req.originalUrl);
    console.log('🎯 Method:', req.method);
    console.log('🎯 Params:', req.params);
    console.log('🎯 Headers:', req.headers);
    
    try {
        const { clientId } = req.params;
        
        // Check if database is connected
        if (mongoose.connection.readyState !== 1 || !Client) {
            return res.status(503).json({ 
                success: false, 
                message: 'Database not available' 
            });
        }

        console.log(`🗑️ Attempting to delete client: ${clientId}`);

        // Find the client first to make sure it exists
        const client = await Client.findOne({ clientId });
        
        if (!client) {
            return res.status(404).json({ 
                success: false, 
                message: 'Client not found' 
            });
        }

        // Store client info for logging
        const clientInfo = {
            clientId: client.clientId,
            name: client.name,
            email: client.email,
            credentialsCount: client.credentials?.length || 0,
            campaignsCount: client.campaigns?.length || 0,
            filesCount: client.uploadedFiles?.length || 0,
            messagesCount: client.activityLogs?.length || 0
        };

        // Delete all client data from database
        const deleteResult = await Client.deleteOne({ clientId });

        if (deleteResult.deletedCount === 0) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to delete client from database' 
            });
        }

        // Delete uploaded files from filesystem
        if (client.uploadedFiles && client.uploadedFiles.length > 0) {
            const uploadsDir = path.join(__dirname, '../uploads', clientId);
            
            if (fs.existsSync(uploadsDir)) {
                try {
                    // Delete all files in client directory
                    const files = fs.readdirSync(uploadsDir);
                    for (const file of files) {
                        const filePath = path.join(uploadsDir, file);
                        fs.unlinkSync(filePath);
                    }
                    
                    // Remove the client directory
                    fs.rmdirSync(uploadsDir);
                    console.log(`🗂️ Deleted ${files.length} files and client directory: ${uploadsDir}`);
                } catch (fileError) {
                    console.warn(`⚠️ Could not delete client files directory: ${uploadsDir}`, fileError.message);
                }
            }
        }

        // Log successful deletion
        console.log(`✅ Client deleted successfully:`, {
            clientId: clientInfo.clientId,
            name: clientInfo.name,
            email: clientInfo.email,
            deletedData: {
                credentials: clientInfo.credentialsCount,
                campaigns: clientInfo.campaignsCount,
                files: clientInfo.filesCount,
                messages: clientInfo.messagesCount
            }
        });

        res.setHeader('Content-Type', 'application/json');
        res.json({ 
            success: true, 
            message: `Client "${clientInfo.name}" and all associated data have been permanently deleted`,
            deletedData: {
                clientId: clientInfo.clientId,
                name: clientInfo.name,
                email: clientInfo.email,
                credentials: clientInfo.credentialsCount,
                campaigns: clientInfo.campaignsCount,
                files: clientInfo.filesCount,
                messages: clientInfo.messagesCount
            }
        });

    } catch (error) {
        console.error('❌ Error deleting client:', error);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while deleting client',
            error: error.message 
        });
    }
});

// Load the file index
const fileIndexPath = path.join(__dirname, '../config/file-index.json');
let fileIndex = {};
try {
    if (fs.existsSync(fileIndexPath)) {
        fileIndex = JSON.parse(fs.readFileSync(fileIndexPath, 'utf-8'));
    }
} catch (error) {
    console.error('Error loading file index:', error);
}

// Enhanced download file route with analytics and cloud-ready structure
router.get('/download-file/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        console.log('🔍 Download request for fileId:', fileId);

        const clientWithFile = await Client.findOne({ 'uploadedFiles._id': fileId });
        if (!clientWithFile) {
            return res.status(404).json({ success: false, message: 'File record not found in any client.' });
        }
        const fileRecord = clientWithFile.uploadedFiles.id(fileId);

        let filePath = null;
        const projectRoot = path.join(__dirname, '..');

        // Method 1: Use the pre-built file index (fastest and most reliable)
        if (fileIndex[fileRecord.fileName]) {
            const relativePath = fileIndex[fileRecord.fileName];
            const absolutePath = path.join(projectRoot, relativePath);
            if (fs.existsSync(absolutePath)) {
                filePath = absolutePath;
                console.log(`✅ Found file using index: ${filePath}`);
            }
        }

        // Method 2: Try database paths if index fails
        if (!filePath && fileRecord.diskPath && fs.existsSync(fileRecord.diskPath)) {
            filePath = fileRecord.diskPath;
            console.log(`✅ Found file using diskPath: ${filePath}`);
        }
        if (!filePath && fileRecord.relativePath && fs.existsSync(path.join(__dirname, '../uploads', fileRecord.relativePath))) {
            filePath = path.join(__dirname, '../uploads', fileRecord.relativePath);
            console.log(`✅ Found file using relativePath: ${filePath}`);
        }

        if (!filePath) {
            console.error(`❌ Critical: Could not find file ${fileRecord.fileName} on disk.`);
            return res.status(404).json({ success: false, message: 'File not found on server storage.' });
        }
        
        // Get file stats
        const stats = fs.statSync(filePath);
        const originalName = fileRecord ? fileRecord.originalName : fileName.replace(/^admin-\d+-\d+-/, '');
        
        // Update download analytics if database is available
        if (fileRecord && Client) {
            try {
                await Client.updateOne(
                    { 'uploadedFiles._id': fileRecord._id },
                    { 
                        $inc: { 'uploadedFiles.$.downloadCount': 1 },
                        $set: { 'uploadedFiles.$.lastAccessed': new Date() }
                    }
                );
                console.log('📊 Updated download analytics');
            } catch (dbError) {
                console.warn('⚠️ Failed to update analytics:', dbError.message);
            }
        }
        
        // Set enhanced headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Cache-Control', 'private, no-cache');
        
        // Stream the file efficiently
        const fileStream = fs.createReadStream(filePath);
        
        fileStream.on('error', (streamError) => {
            console.error('❌ Stream error:', streamError);
            if (!res.headersSent) {
                res.status(500).json({ 
                    success: false, 
                    message: 'Error streaming file' 
                });
            }
        });
        
        fileStream.pipe(res);
        
        console.log('📥 File download initiated:', originalName, `(${(stats.size / 1024).toFixed(2)} KB)`);
        
    } catch (error) {
        console.error('❌ Error downloading file:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error downloading file',
            error: error.message 
        });
    }
});

// View file route
router.get('/view-file/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        
        // Find file by database ID
        let client;
        let fileRecord;
        
        try {
            client = await Client.findOne({
                'uploadedFiles._id': fileId
            });
            
            if (client) {
                fileRecord = client.uploadedFiles.find(f => f._id.toString() === fileId);
            }
        } catch (dbError) {
            console.error('❌ Database lookup failed:', dbError);
            return res.status(500).json({
                success: false,
                message: 'Database error'
            });
        }
        
        if (!fileRecord) {
            return res.status(404).json({ 
                success: false, 
                message: 'File not found in database' 
            });
        }
        
        // Get file path
        let filePath;
        if (fileRecord.diskPath && fs.existsSync(fileRecord.diskPath)) {
            filePath = fileRecord.diskPath;
        } else if (fileRecord.relativePath) {
            filePath = path.join(__dirname, '../uploads', fileRecord.relativePath);
            if (!fs.existsSync(filePath)) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'File missing from storage' 
                });
            }
        } else {
            return res.status(500).json({ 
                success: false, 
                message: 'Invalid file record' 
            });
        }
        
        // Set content type
        const contentType = fileRecord.mimeType || 'application/octet-stream';
        
        // Set headers for viewing
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        console.log('👁️ File view initiated:', fileRecord.originalName);
        
    } catch (error) {
        console.error('❌ Error viewing file:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error viewing file',
            error: error.message 
        });
    }
});

// File maintenance and cleanup routes
router.post('/cleanup-files', async (req, res) => {
    try {
        console.log('🧹 Starting file cleanup process...');
        
        const results = {
            orphanedFiles: [],
            missingFiles: [],
            fixedRecords: 0,
            errors: []
        };
        
        if (!Client) {
            return res.status(503).json({
                success: false,
                message: 'Database not available for cleanup'
            });
        }
        
        // Get all clients with files
        const clients = await Client.find({ 'uploadedFiles.0': { $exists: true } });
        
        for (const client of clients) {
            for (let i = 0; i < client.uploadedFiles.length; i++) {
                const file = client.uploadedFiles[i];
                
                // Check if file exists on disk
                let filePath = null;
                let exists = false;
                
                // Try database path first
                if (file.diskPath && fs.existsSync(file.diskPath)) {
                    exists = true;
                    filePath = file.diskPath;
                } else if (file.relativePath) {
                    filePath = path.join(__dirname, '../uploads', file.relativePath);
                    exists = fs.existsSync(filePath);
                } else {
                    // Try to find file
                    const searchResult = await searchFileInDirectories(
                        path.join(__dirname, '../uploads/admin-files'), 
                        file.fileName
                    );
                    if (searchResult) {
                        exists = true;
                        filePath = searchResult;
                        
                        // Update database record with correct path
                        const relativePath = path.relative(path.join(__dirname, '../uploads'), searchResult);
                        client.uploadedFiles[i].diskPath = searchResult;
                        client.uploadedFiles[i].relativePath = relativePath;
                        results.fixedRecords++;
                    }
                }
                
                if (!exists) {
                    results.missingFiles.push({
                        clientId: client.clientId,
                        fileName: file.fileName,
                        originalName: file.originalName
                    });
                    
                    // Mark file as inactive instead of deleting
                    client.uploadedFiles[i].isActive = false;
                }
            }
            
            // Save updated client record
            if (results.fixedRecords > 0) {
                await client.save();
            }
        }
        
        // Find orphaned files (files on disk but not in database)
        const allDiskFiles = await listAllFiles(path.join(__dirname, '../uploads/admin-files'));
        const allDbFiles = [];
        
        for (const client of clients) {
            for (const file of client.uploadedFiles) {
                allDbFiles.push(file.fileName);
            }
        }
        
        for (const diskFile of allDiskFiles) {
            if (!allDbFiles.includes(diskFile)) {
                results.orphanedFiles.push(diskFile);
            }
        }
        
        console.log('✅ File cleanup completed:', results);
        
        res.json({
            success: true,
            message: 'File cleanup completed',
            results: results
        });
        
    } catch (error) {
        console.error('❌ Error during file cleanup:', error);
        res.status(500).json({
            success: false,
            message: 'Error during file cleanup',
            error: error.message
        });
    }
});

// Get file system statistics
router.get('/file-stats', async (req, res) => {
    try {
        const stats = {
            totalFiles: 0,
            totalSize: 0,
            filesByType: {},
            uploadsByMonth: {},
            storageLocations: {
                local: 0,
                cloud: 0
            }
        };
        
        if (Client) {
            const clients = await Client.find({ 'uploadedFiles.0': { $exists: true } });
            
            for (const client of clients) {
                for (const file of client.uploadedFiles) {
                    if (file.isActive !== false) {
                        stats.totalFiles++;
                        stats.totalSize += file.fileSize || 0;
                        
                        // Count by file type
                        const ext = path.extname(file.originalName).toLowerCase();
                        stats.filesByType[ext] = (stats.filesByType[ext] || 0) + 1;
                        
                        // Count by upload month
                        const month = new Date(file.uploadDate).toISOString().substring(0, 7);
                        stats.uploadsByMonth[month] = (stats.uploadsByMonth[month] || 0) + 1;
                        
                        // Count storage locations
                        if (file.cloudProvider === 'local') {
                            stats.storageLocations.local++;
                        } else {
                            stats.storageLocations.cloud++;
                        }
                    }
                }
            }
        }
        
        res.json({
            success: true,
            stats: stats
        });
        
    } catch (error) {
        console.error('❌ Error getting file stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting file statistics',
            error: error.message
        });
    }
});

// Route to handle activity updates from the admin panel
router.post('/activity-update', async (req, res) => {
    try {
        const { clientId, status, progress, message } = req.body;

        if (!clientId || !message) {
            return res.status(400).json({ success: false, message: 'Client ID and message are required' });
        }

        const client = await Client.findOne({ clientId });
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        const activityLog = {
            type: 'info',
            message: message,
            details: `Status: ${status}, Progress: ${progress}%`,
            source: 'admin',
            timestamp: new Date(),
        };

        client.activityLogs.push(activityLog);
        await client.save();

        res.json({ success: true, message: 'Activity updated successfully' });
    } catch (error) {
        console.error('❌ Error updating client activity:', error);
        res.status(500).json({ success: false, message: 'Failed to update activity' });
    }
});

// Route to handle PhantomBuster performance data updates
router.post('/campaign-performance', async (req, res) => {
    try {
        const { clientId, campaignId, phantomBusterData } = req.body;

        if (!clientId || !campaignId || !phantomBusterData) {
            return res.status(400).json({ success: false, message: 'Client ID, Campaign ID, and PhantomBuster data are required' });
        }

        const client = await Client.findOne({ clientId });
        if (!client) {
            return res.status(404).json({ success: false, message: 'Client not found' });
        }

        const campaign = client.campaigns.id(campaignId);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }

        campaign.performanceData = {
            collectedProfiles: phantomBusterData.collectedProfiles,
            sentInvites: phantomBusterData.sentInvites,
            acceptedRequests: phantomBusterData.acceptedRequests,
            timeSaved: phantomBusterData.timeSaved,
            lastUpdated: new Date()
        };

        await client.save();

        res.json({ success: true, message: 'Campaign performance data updated successfully' });
    } catch (error) {
        console.error('❌ Error updating campaign performance:', error);
        res.status(500).json({ success: false, message: 'Failed to update campaign performance' });
    }
});

// API Settings page
router.get('/api-settings', (req, res) => {
    res.render('admin/api-settings', { title: 'API Settings', layout: false });
});

// Save API key
router.post('/api-key', async (req, res) => {
    try {
        const { apiKey } = req.body;
        if (!apiKey) {
            return res.status(400).json({ success: false, message: 'API key is required' });
        }

        // Use updateOne with upsert to create or update the admin settings
        await Admin.updateOne({}, { phantombusterApiKey: apiKey }, { upsert: true });

        res.json({ success: true, message: 'API key saved successfully' });
    } catch (error) {
        console.error('❌ Error saving API key:', error);
        res.status(500).json({ success: false, message: 'Failed to save API key' });
    }
});

// Fetch PhantomBuster results
router.post('/fetch-phantombuster-results', async (req, res) => {
    try {
        const { agentId } = req.body;
        if (!agentId) {
            return res.status(400).json({ success: false, message: 'Agent ID is required' });
        }

        const admin = await Admin.findOne({});
        if (!admin || !admin.phantombusterApiKey) {
            return res.status(400).json({ success: false, message: 'API key not configured' });
        }

        const response = await axios.get(`https://api.phantombuster.com/api/v2/agents/fetch?id=${agentId}`, {
            headers: {
                'X-Phantombuster-Key': admin.phantombusterApiKey,
                'Accept': 'application/json'
            }
        });

        res.json({ success: true, data: response.data });
    } catch (error) {
        console.error('❌ Error fetching PhantomBuster results:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch PhantomBuster results' });
    }
});

module.exports = router;
