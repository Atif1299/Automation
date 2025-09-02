require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Client = require('../models/Client');
const connectDB = require('../config/database');
const { uploadFileToGCS } = require('../config/gcs');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

async function migrateFilesToGCS() {
    console.log('🚀 Starting migration of local files to GCS...');
    
    try {
        await connectDB();
        console.log('✅ MongoDB Connected for migration');

        const clients = await Client.find({ 'uploadedFiles.cloudProvider': 'local' });
        console.log(`🔍 Found ${clients.length} clients with local files to migrate.`);

        let migratedFilesCount = 0;

        for (const client of clients) {
            let changesMade = false;
            for (const fileRecord of client.uploadedFiles) {
                if (fileRecord.cloudProvider === 'local') {
                    const localPath = fileRecord.diskPath || path.join(__dirname, '..', fileRecord.relativePath);
                    
                    if (fs.existsSync(localPath)) {
                        const gcsFileName = fileRecord.fileName; // Use the existing unique filename
                        
                        console.log(`  Uploading ${localPath} to GCS as ${gcsFileName}...`);
                        const gcsUrl = await uploadFileToGCS(localPath, gcsFileName);

                        // Update the file record
                        fileRecord.cloudProvider = 'google-cloud';
                        fileRecord.cloudPath = gcsFileName;
                        fileRecord.cloudUrl = gcsUrl;
                        fileRecord.diskPath = null; // No longer stored on local disk
                        fileRecord.relativePath = null;

                        migratedFilesCount++;
                        changesMade = true;
                    } else {
                        console.warn(`  ⚠️  Skipping file ${fileRecord.originalName} for client ${client.clientId} - local file not found at ${localPath}`);
                    }
                }
            }

            if (changesMade) {
                await client.save();
                console.log(`  💾 Saved GCS updates for client ${client.clientId}`);
            }
        }

        console.log('✅ Migration complete.');
        console.log(`   Successfully migrated ${migratedFilesCount} files to GCS.`);

    } catch (error) {
        console.error('❌ Error during file migration:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 MongoDB Disconnected');
    }
}

migrateFilesToGCS();
