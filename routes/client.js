const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// Client dashboard route
router.get('/:id', async (req, res) => {
    try {
        const clientId = req.params.id;
        
        // Find or create client
        let client = await Client.findByClientId(clientId);
        
        if (!client) {
            // Create new client if doesn't exist
            client = new Client({
                clientId: clientId,
                name: `Client ${clientId}`,
                email: `client${clientId}@example.com`
            });
            await client.save();
            console.log(`✅ New client created: ${clientId}`);
        }
        
        res.render('client/dashboard', { 
            title: `Client ${clientId} Dashboard`, 
            clientId: clientId,
            client: client,
            layout: 'layouts/client-layout',
            isClientDashboard: true
        });
    } catch (error) {
        console.error('❌ Error loading client dashboard:', error);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Unable to load dashboard',
            layout: false
        });
    }
});

// Save credentials route
router.post('/:id/credentials', async (req, res) => {
    try {
        const clientId = req.params.id;
        const { platform, username, password } = req.body;
        
        const client = await Client.findByClientId(clientId);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Add new credentials
        client.credentials.push({
            platform,
            username,
            password,
            connectionStatus: 'pending'
        });
        
        await client.save();
        await client.addActivityLog('success', `Credentials saved for ${platform} - ${username}`);
        
        console.log(`✅ Credentials saved for client ${clientId}: ${platform}`);
        
        res.json({ 
            success: true, 
            message: 'Credentials saved successfully',
            credentialId: client.credentials[client.credentials.length - 1]._id
        });
    } catch (error) {
        console.error('❌ Error saving credentials:', error);
        res.status(500).json({ error: 'Failed to save credentials' });
    }
});

// Upload file route
router.post('/:id/upload', async (req, res) => {
    try {
        const clientId = req.params.id;
        const { fileName, fileSize, fileType } = req.body;
        
        const client = await Client.findByClientId(clientId);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Add file upload record
        client.uploadedFiles.push({
            fileName: fileName || `file_${Date.now()}`,
            originalName: fileName || 'uploaded_file.csv',
            fileSize: fileSize || 0,
            fileType: fileType || 'text/csv',
            status: 'uploaded'
        });
        
        await client.save();
        await client.addActivityLog('info', 'File uploaded and validated');
        
        console.log(`✅ File uploaded for client ${clientId}: ${fileName}`);
        
        res.json({ 
            success: true, 
            message: 'File uploaded successfully' 
        });
    } catch (error) {
        console.error('❌ Error uploading file:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Save configuration route
router.post('/:id/config', async (req, res) => {
    try {
        const clientId = req.params.id;
        const { campaignName, automationType, instructions } = req.body;
        
        const client = await Client.findByClientId(clientId);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Add campaign configuration
        client.campaigns.push({
            name: campaignName,
            automationType,
            instructions,
            status: 'draft'
        });
        
        await client.save();
        await client.addActivityLog('info', 'Configuration saved');
        
        console.log(`✅ Configuration saved for client ${clientId}: ${campaignName}`);
        
        res.json({ 
            success: true, 
            message: 'Configuration saved successfully' 
        });
    } catch (error) {
        console.error('❌ Error saving configuration:', error);
        res.status(500).json({ error: 'Failed to save configuration' });
    }
});

// Get activity logs
router.get('/:id/logs', async (req, res) => {
    try {
        const clientId = req.params.id;
        const client = await Client.findByClientId(clientId);
        
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        const logs = client.activityLogs
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 50); // Last 50 logs
        
        res.json({ success: true, logs });
    } catch (error) {
        console.error('❌ Error fetching logs:', error);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

// Messages page route
router.get('/:id/messages', async (req, res) => {
    try {
        const clientId = req.params.id;
        
        // Find client
        const client = await Client.findByClientId(clientId);
        
        if (!client) {
            return res.status(404).render('error', { 
                title: 'Error',
                message: 'Client not found',
                layout: false
            });
        }
        
        res.render('client/messages', { 
            title: 'Admin Messages', 
            clientId: clientId,
            client: client,
            layout: 'layouts/client-layout',
            isClientMessages: true
        });
    } catch (error) {
        console.error('❌ Error loading messages:', error);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Unable to load messages',
            layout: false
        });
    }
});

// AJAX endpoint for messages content only
router.get('/:id/messages-content', async (req, res) => {
    try {
        const clientId = req.params.id;
        
        // Find client
        const client = await Client.findByClientId(clientId);
        
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Render just the messages content without layout
        res.render('client/messages-content', { 
            clientId: clientId,
            client: client,
            layout: false
        });
    } catch (error) {
        console.error('❌ Error loading messages content:', error);
        res.status(500).json({ error: 'Unable to load messages content' });
    }
});

// Send message to admin route
router.post('/:id/send-message', async (req, res) => {
    try {
        const clientId = req.params.id;
        const { message } = req.body;
        
        console.log('📧 Send message request received:');
        console.log('Client ID:', clientId);
        console.log('Message:', message);
        
        if (!message || !message.trim()) {
            console.log('❌ Empty message received');
            return res.status(400).json({ error: 'Message cannot be empty' });
        }
        
        // Find client
        console.log('🔍 Looking for client with ID:', clientId);
        const client = await Client.findByClientId(clientId);
        
        if (!client) {
            console.log('❌ Client not found with ID:', clientId);
            return res.status(404).json({ error: 'Client not found' });
        }
        
        console.log('✅ Client found:', client.email);
        
        // Add client message to activity logs
        const clientMessage = {
            activity: 'Client Message',
            details: message.trim(),
            status: 'info',
            timestamp: new Date(),
            type: 'client_message'
        };
        
        client.activityLogs.push(clientMessage);
        await client.save();
        
        console.log('✅ Message saved successfully');
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('❌ Error sending message:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

module.exports = router;
