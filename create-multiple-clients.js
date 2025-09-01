const mongoose = require('mongoose');
require('dotenv').config();

async function createMultipleTestClients() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        const Client = require('./models/Client');
        
        // Delete existing test clients
        await Client.deleteMany({ clientId: { $in: ['test001', 'umar001', 'atif001'] } });
        
        // Create Test Client 1
        const testClient1 = new Client({
            clientId: 'test001',
            name: 'Test Client',
            email: 'test@example.com',
            status: 'active',
            plan: 'premium',
            emailVerified: true,
            credentials: [
                {
                    platform: 'facebook',
                    username: 'test.facebook@example.com',
                    password: 'facebook_pass123',
                    isActive: true,
                    connectionStatus: 'connected',
                    lastTested: new Date()
                }
            ],
            activityLogs: [
                {
                    type: 'info',
                    message: 'Admin sent file: Welcome_Package.pdf - Welcome to our platform!',
                    details: 'File: Welcome_Package.pdf (2.5 MB)',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    source: 'admin',
                    fileInfo: {
                        fileName: 'admin-1725198765432-Welcome_Package.pdf',
                        originalName: 'Welcome_Package.pdf',
                        category: 'instruction',
                        downloadPath: '/uploads/admin-files/admin-1725198765432-Welcome_Package.pdf'
                    }
                }
            ],
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000)
        });
        
        // Create Umar Client
        const umarClient = new Client({
            clientId: 'umar001',
            name: 'Umar',
            email: 'umar@example.com',
            status: 'active',
            plan: 'basic',
            emailVerified: true,
            credentials: [
                {
                    platform: 'linkedin',
                    username: 'umar.linkedin@example.com',
                    password: 'linkedin_pass456',
                    isActive: true,
                    connectionStatus: 'connected',
                    lastTested: new Date()
                }
            ],
            activityLogs: [
                {
                    type: 'info',
                    message: 'Account created',
                    details: 'New client account created successfully',
                    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    source: 'system'
                },
                {
                    type: 'info',
                    message: 'Admin sent file: Atif_CV.pdf - Here is the CV you requested',
                    details: 'File: Atif_CV.pdf (1.2 MB)',
                    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
                    source: 'admin',
                    fileInfo: {
                        fileName: 'admin-1725198765433-Atif_CV.pdf',
                        originalName: 'Atif_CV.pdf',
                        category: 'document',
                        downloadPath: '/uploads/admin-files/admin-1725198765433-Atif_CV.pdf'
                    }
                },
                {
                    type: 'info',
                    message: 'Admin message: Your LinkedIn campaign has been optimized for better reach.',
                    details: 'Campaign optimization completed',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000),
                    source: 'admin'
                }
            ],
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000)
        });
        
        // Create Muhammad Atif Client
        const atifClient = new Client({
            clientId: 'atif001',
            name: 'Muhammad Atif',
            email: 'atif@example.com',
            status: 'inactive',
            plan: 'free',
            emailVerified: true,
            credentials: [],
            activityLogs: [
                {
                    type: 'info',
                    message: 'Account created',
                    details: 'Client account created successfully',
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    source: 'system'
                },
                {
                    type: 'success',
                    message: 'Admin message: Welcome to the platform! Please complete your profile setup.',
                    details: 'Onboarding assistance message',
                    timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000),
                    source: 'admin'
                }
            ],
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            lastLogin: new Date(Date.now() - 20 * 60 * 60 * 1000)
        });
        
        await testClient1.save();
        await umarClient.save();
        await atifClient.save();
        
        console.log('✅ Multiple test clients created successfully!');
        console.log('Clients created:');
        console.log('1. Test Client (test001) - Active, Premium');
        console.log('2. Umar (umar001) - Active, Basic');
        console.log('3. Muhammad Atif (atif001) - Inactive, Free');
        console.log('');
        console.log('🎯 Test the client switching at: http://localhost:4000/admin');
        console.log('Go to Messages tab and click on different clients to see their individual chat history!');
        
        mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error creating test clients:', error);
        mongoose.disconnect();
    }
}

createMultipleTestClients();
