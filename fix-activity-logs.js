const mongoose = require('mongoose');
require('dotenv').config();

async function fixInvalidActivityLogs() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
        
        const Client = require('./models/Client');
        const clients = await Client.find({});
        
        console.log(`Checking ${clients.length} clients for invalid activity logs...`);
        
        for (let client of clients) {
            let hasChanges = false;
            
            // Filter out invalid activity log types
            const validTypes = ['info', 'success', 'warning', 'error'];
            const originalCount = client.activityLogs.length;
            
            client.activityLogs = client.activityLogs.filter(log => {
                if (!validTypes.includes(log.type)) {
                    console.log(`❌ Removing invalid activity log type: "${log.type}" for client: ${client.name}`);
                    hasChanges = true;
                    return false;
                }
                return true;
            });
            
            if (hasChanges) {
                console.log(`🔧 Fixed ${client.name}: ${originalCount} -> ${client.activityLogs.length} activity logs`);
                // Use updateOne to bypass validation issues
                await Client.updateOne(
                    { _id: client._id },
                    { $set: { activityLogs: client.activityLogs } }
                );
                console.log(`✅ Updated ${client.name}`);
            }
        }
        
        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixInvalidActivityLogs();
