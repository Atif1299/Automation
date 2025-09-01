const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log('Connected to MongoDB');
    
    try {
        const Client = require('./models/Client');
        
        // Check if test client already exists
        const existingClient = await Client.findOne({ clientId: 'test123' });
        
        if (existingClient) {
            console.log('Test client already exists:');
            console.log(`- ID: ${existingClient.clientId}`);
            console.log(`- Name: ${existingClient.name}`);
            console.log(`- Email: ${existingClient.email}`);
            console.log(`- Status: ${existingClient.status}`);
        } else {
            // Create test client
            const testClient = new Client({
                clientId: 'test123',
                name: 'John Smith',
                email: 'john.smith@testclient.com',
                status: 'active',
                plan: 'premium',
                credentials: [
                    {
                        platform: 'facebook',
                        username: 'john.smith.facebook',
                        password: 'hashed_password_123',
                        isActive: true,
                        connectionStatus: 'connected'
                    },
                    {
                        platform: 'linkedin',
                        username: 'john.smith.linkedin',
                        password: 'hashed_password_456',
                        isActive: true,
                        connectionStatus: 'pending'
                    }
                ],
                campaigns: [
                    {
                        name: 'Lead Generation Campaign',
                        automationType: 'outreach',
                        instructions: 'Target business professionals in tech industry',
                        status: 'active'
                    },
                    {
                        name: 'Content Scraping Project',
                        automationType: 'scraping',
                        instructions: 'Collect competitor pricing data',
                        status: 'completed'
                    }
                ],
                uploadedFiles: [
                    {
                        fileName: 'leads_data_001.csv',
                        originalName: 'leads_data.csv',
                        fileSize: 25600,
                        fileType: 'text/csv',
                        processedRows: 150,
                        validRows: 148,
                        status: 'processed'
                    }
                ],
                activityLogs: [
                    {
                        type: 'info',
                        message: 'Client account created',
                        details: 'New client registration completed successfully'
                    },
                    {
                        type: 'success',
                        message: 'Campaign launched',
                        details: 'Lead Generation Campaign started successfully'
                    },
                    {
                        type: 'info',
                        message: 'File uploaded',
                        details: 'leads_data.csv uploaded and processed'
                    }
                ]
            });
            
            await testClient.save();
            console.log('✅ Test client created successfully!');
            console.log(`- ID: ${testClient.clientId}`);
            console.log(`- Name: ${testClient.name}`);
            console.log(`- Email: ${testClient.email}`);
            console.log(`- Status: ${testClient.status}`);
            console.log(`- Credentials: ${testClient.credentials.length}`);
            console.log(`- Campaigns: ${testClient.campaigns.length}`);
            console.log(`- Files: ${testClient.uploadedFiles.length}`);
            console.log(`- Activity Logs: ${testClient.activityLogs.length}`);
        }
        
        console.log('\n✅ You can now test the modal at: http://localhost:4000/admin');
        console.log('Click the "View" button on the test client card to see real data!');
        
    } catch (error) {
        console.error('Error:', error);
    }
    
    mongoose.disconnect();
}).catch(error => {
    console.error('Database connection error:', error);
});
