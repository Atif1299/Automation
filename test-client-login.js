const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function testClientLogin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const Client = require('./models/Client');
        
        // Find the client that was just registered
        const testEmail = 'atif@gmail.com';
        const client = await Client.findOne({ email: testEmail });
        
        if (!client) {
            console.log('❌ Client not found with email:', testEmail);
            return;
        }
        
        console.log('✅ Client found:', {
            name: client.name,
            email: client.email,
            clientId: client.clientId,
            status: client.status,
            credentialsCount: client.credentials.length
        });
        
        // Check account credentials
        const accountCred = client.credentials.find(c => c.platform === 'account');
        if (accountCred) {
            console.log('✅ Account credentials found:', {
                username: accountCred.username,
                passwordHash: accountCred.password.substring(0, 10) + '...',
                isHashed: accountCred.password.startsWith('$2b$'),
                isActive: accountCred.isActive,
                connectionStatus: accountCred.connectionStatus
            });
            
            // Test password comparison with a sample password
            const testPassword = 'your_test_password_here'; // Replace with actual password
            console.log('🔍 Testing password comparison...');
            // Uncomment the line below and replace with actual password to test
            // const isValid = await bcrypt.compare(testPassword, accountCred.password);
            // console.log('🔒 Password valid:', isValid);
        } else {
            console.log('❌ No account credentials found');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testClientLogin();
