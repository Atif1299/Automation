const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Client = require('../models/Client');
const { uploadFileToGCS, getSignedUrl } = require('../config/gcs');

// Configure multer to use memory storage, as files will be streamed to GCS
const clientUpload = multer({ storage: multer.memoryStorage() });

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
        
        client.activityLogs.push({
            type: 'success',
            message: `Platform credentials saved: ${platform}`,
            details: `Username: ${username}`,
            source: 'client',
            timestamp: new Date()
        });

        await client.save();
        
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
router.post('/:id/upload', clientUpload.single('file'), async (req, res) => {
    try {
        const clientId = req.params.id;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ error: 'File is required' });
        }

        const client = await Client.findByClientId(clientId);
        if (!client) {
            return res.status(404).json({ error: 'Client not found' });
        }

        // Create a unique filename for GCS
        const gcsFileName = `${clientId}/${Date.now()}-${file.originalname}`;

        // Upload the file to GCS
        const gcsUrl = await uploadFileToGCS(file.buffer, gcsFileName);

        const newFile = client.uploadedFiles.create({
            fileName: gcsFileName,
            originalName: file.originalname,
            fileSize: file.size,
            fileType: file.mimetype,
            uploadDate: new Date(),
            status: 'uploaded',
            category: 'data',
            cloudProvider: 'google-cloud',
            cloudPath: gcsFileName,
            cloudUrl: gcsUrl,
            isActive: true,
        });
        client.uploadedFiles.push(newFile);

        client.activityLogs.push({
            type: 'info',
            message: `File uploaded: ${file.originalname}`,
            details: `File Size: ${(file.size / 1024).toFixed(2)} KB`,
            source: 'client',
            timestamp: new Date(),
            fileInfo: {
                fileId: newFile._id,
                fileName: gcsFileName,
                originalName: file.originalname,
                category: 'data'
            }
        });

        await client.save();

        console.log(`✅ File uploaded to GCS for client ${clientId}: ${file.originalname}`);

        res.json({
            success: true,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('❌ Detailed GCS Upload Error (Client):', error.message);
        console.error(error.stack);
        res.status(500).json({ 
            error: 'Failed to upload file due to a server configuration issue.',
            details: error.message
        });
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
        
        client.activityLogs.push({
            type: 'info',
            message: `Campaign configuration saved: ${campaignName}`,
            details: `Type: ${automationType}`,
            source: 'client',
            timestamp: new Date()
        });

        await client.save();
        
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

// Download file route for client
router.get('/download-file/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const clientWithFile = await Client.findOne({ 'uploadedFiles._id': fileId });

        if (!clientWithFile) {
            return res.status(404).json({ success: false, message: 'File record not found.' });
        }
        const fileRecord = clientWithFile.uploadedFiles.id(fileId);

        if (fileRecord.cloudProvider === 'google-cloud' && fileRecord.fileName) {
            const signedUrl = await getSignedUrl(fileRecord.fileName);
            res.redirect(signedUrl);
        } else {
            // Fallback for local files
            const localPath = fileRecord.diskPath || path.join(__dirname, '../uploads', fileRecord.relativePath);
            if (fs.existsSync(localPath)) {
                res.download(localPath, fileRecord.originalName);
            } else {
                return res.status(404).json({ success: false, message: 'File not found on server.' });
            }
        }
    } catch (error) {
        console.error('❌ Error downloading file for client:', error);
        res.status(500).json({ success: false, message: 'Error downloading file' });
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
            type: 'info',
            message: message.trim(),
            details: 'Message from Client Dashboard',
            timestamp: new Date(),
            source: 'client'
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
