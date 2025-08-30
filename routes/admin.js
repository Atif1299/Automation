const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

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

module.exports = router;
