const mongoose = require('mongoose');
const Client = require('./models/Client');

async function testMessage() {
    try {
        await mongoose.connect('mongodb://localhost:27017/automation_platform');
        console.log('✅ Connected to MongoDB');
        
        // Get a client to test with
        const clients = await Client.find({}).limit(1);
        console.log('Available clients:', clients.length);
        
        if (clients.length > 0) {
            console.log('Test client:', {
                clientId: clients[0].clientId,
                name: clients[0].name
            });
            
            // Test sending a message
            const fetch = require('node-fetch');
            const response = await fetch('http://localhost:4000/admin/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    clientId: clients[0].clientId,
                    message: 'Test message from script'
                })
            });
            
            const result = await response.json();
            console.log('Response:', result);
        } else {
            console.log('No clients found in database');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testMessage();
