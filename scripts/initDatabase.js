const mongoose = require('mongoose');
const Client = require('../models/Client');
require('dotenv').config();

const initializeDatabase = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Create sample client (optional for testing)
        const existingClient = await Client.findByClientId('1');
        if (!existingClient) {
            const sampleClient = new Client({
                clientId: '1',
                name: 'Demo Client',
                email: 'demo@client.com',
                status: 'active',
                plan: 'premium'
            });
            
            await sampleClient.save();
            await sampleClient.addActivityLog('info', 'Demo client account created');
            console.log('✅ Sample client created');
        } else {
            console.log('ℹ️  Client already exists');
        }

        console.log('🎉 Database initialization completed!');
        
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔒 Database connection closed');
    }
};

// Run initialization
if (require.main === module) {
    initializeDatabase();
}

module.exports = initializeDatabase;
