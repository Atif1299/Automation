const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Configure multer for admin file uploads
const adminStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/admin-files');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'admin-' + uniqueSuffix + '-' + file.originalname);
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

// Import Client model only if database is connected
let Client;
try {
    Client = require('../models/Client');
} catch (error) {
    console.warn('⚠️ Client model not loaded - database may be unavailable');
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

        // Fetch all clients from database
        const clients = await Client.find({}).sort({ createdAt: -1 }).maxTimeMS(5000);
        
        // Calculate statistics
        const stats = {
            totalClients: clients.length,
            activeClients: clients.filter(c => c.status === 'active').length,
            totalMessages: clients.reduce((sum, c) => sum + (c.activityLogs?.length || 0), 0),
            newSignups: clients.filter(c => {
                const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                return c.createdAt > oneWeekAgo;
            }).length
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

        // Create file record for client
        const fileRecord = {
            fileName: file.filename,
            originalName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            uploadDate: new Date(),
            status: 'admin_sent',
            category: category || 'other',
            adminMessage: message || '',
            downloadPath: `/uploads/admin-files/${file.filename}`
        };

        // Add file to client's uploaded files
        client.uploadedFiles.push(fileRecord);

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

module.exports = router;
