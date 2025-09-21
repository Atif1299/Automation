const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Database configuration
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        console.log(`📊 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
};

// Client schema (minimal version for repair)
const clientSchema = new mongoose.Schema({
    clientId: String,
    name: String,
    uploadedFiles: [{
        fileName: String,
        originalName: String,
        fileSize: Number,
        fileType: String,
        uploadDate: Date,
        status: String,
        category: String,
        adminMessage: String,
        downloadPath: String,
        relativePath: String,
        diskPath: String,
        fileHash: String,
        isActive: Boolean,
        downloadCount: Number,
        lastAccessed: Date
    }]
}, { collection: 'clients' });

const Client = mongoose.model('Client', clientSchema);

async function repairClientUploadedFiles() {
    try {
        console.log('🔧 Starting repair of client-uploaded files...');
        
        // Find all clients with uploaded files
        const clients = await Client.find({ 'uploadedFiles.0': { $exists: true } });
        console.log(`📁 Found ${clients.length} clients with uploaded files`);
        
        let totalRepaired = 0;
        
        for (const client of clients) {
            let clientRepaired = 0;
            
            for (let i = 0; i < client.uploadedFiles.length; i++) {
                const file = client.uploadedFiles[i];
                
                // Skip if already has proper path information
                if (file.diskPath && file.relativePath) {
                    continue;
                }
                
                console.log(`🔍 Repairing file: ${file.originalName || file.fileName} for client ${client.clientId}`);
                
                // Generate proper path information
                const year = new Date().getFullYear();
                const month = String(new Date().getMonth() + 1).padStart(2, '0');
                const fileName = file.fileName || file.originalName || `file_${Date.now()}`;
                const relativePath = `admin-files/${year}/${month}/${fileName}`;
                
                // Update the file record
                client.uploadedFiles[i].downloadPath = `/uploads/${relativePath}`;
                client.uploadedFiles[i].relativePath = relativePath;
                client.uploadedFiles[i].diskPath = path.join(__dirname, '../uploads', relativePath);
                client.uploadedFiles[i].uploadDate = client.uploadedFiles[i].uploadDate || new Date();
                client.uploadedFiles[i].isActive = client.uploadedFiles[i].isActive !== undefined ? client.uploadedFiles[i].isActive : true;
                client.uploadedFiles[i].downloadCount = client.uploadedFiles[i].downloadCount || 0;
                client.uploadedFiles[i].category = client.uploadedFiles[i].category || 'client_upload';
                
                clientRepaired++;
                totalRepaired++;
                
                console.log(`✅ Repaired: ${fileName}`);
                console.log(`   - relativePath: ${relativePath}`);
                console.log(`   - diskPath: ${client.uploadedFiles[i].diskPath}`);
            }
            
            if (clientRepaired > 0) {
                await client.save();
                console.log(`💾 Saved ${clientRepaired} repaired files for client ${client.clientId}`);
            }
        }
        
        console.log(`🎉 Repair completed! Total files repaired: ${totalRepaired}`);
        
    } catch (error) {
        console.error('❌ Error during repair:', error);
    }
}

async function main() {
    await connectDB();
    await repairClientUploadedFiles();
    await mongoose.disconnect();
    console.log('📝 Repair script completed');
}

main().catch(console.error);
