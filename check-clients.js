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
        const clients = await Client.find({});
        
        console.log(`Found ${clients.length} clients in database:`);
        clients.forEach(client => {
            console.log(`- ID: ${client.clientId}, Name: ${client.name}, Email: ${client.email}, Status: ${client.status}`);
        });
        
        if (clients.length === 0) {
            console.log('\nNo clients found. You can test the modal functionality by:');
            console.log('1. Registering a new client at: http://localhost:4000/auth/client/register');
            console.log('2. Or creating a test client through the client dashboard');
        }
        
    } catch (error) {
        console.error('Error fetching clients:', error);
    }
    
    mongoose.disconnect();
}).catch(error => {
    console.error('Database connection error:', error);
});
