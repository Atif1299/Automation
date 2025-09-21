require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    try {
        const db = mongoose.connection.db;
        const clients = await db.collection('clients').find({}).toArray();
        
        console.log('=== CLIENT FILES ANALYSIS ===');
        
        clients.forEach((client, idx) => {
            console.log(`\nClient ${idx + 1}: ${client.name} (ID: ${client.clientId})`);
            
            if (client.uploadedFiles && client.uploadedFiles.length > 0) {
                client.uploadedFiles.forEach((file, fidx) => {
                    console.log(`  File ${fidx + 1}: ${file.originalName || file.fileName}`);
                    console.log(`    ID: ${file._id}`);
                    console.log(`    diskPath: ${file.diskPath || 'MISSING'}`);
                    console.log(`    relativePath: ${file.relativePath || 'MISSING'}`);
                    console.log(`    status: ${file.status}`);
                    console.log(`    uploadDate: ${file.uploadDate}`);
                    console.log(`    ---`);
                });
            } else {
                console.log('  No files');
            }
        });
        
        mongoose.disconnect();
        console.log('\n✅ Analysis complete');
        
    } catch (error) {
        console.error('❌ Error:', error);
        mongoose.disconnect();
    }
});
