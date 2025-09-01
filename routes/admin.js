const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

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
        const { clientId, message } = req.body;
        
        if (!clientId || !message) {
            return res.status(400).json({ error: 'Client ID and message are required' });
        }

        // Check if database is connected
        if (mongoose.connection.readyState !== 1 || !Client) {
            return res.status(503).json({ error: 'Database not available. Please try again later.' });
        }

        // Find the client and add the message to their activity logs
        const client = await Client.findOne({ clientId: clientId }).maxTimeMS(5000);
        
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Add admin message to client's activity logs
        const adminMessage = {
            activity: 'Admin Message',
            details: message,
            status: 'info',
            timestamp: new Date(),
            type: 'admin_message'
        };

        client.activityLogs.push(adminMessage);
        await client.save();

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
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
