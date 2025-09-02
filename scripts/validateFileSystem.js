const mongoose = require('mongoose');
const fs =require('fs');
const path = require('path');
const Client = require('../models/Client');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const validateFileSystem = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');

    const clients = await Client.find({ 'uploadedFiles.0': { $exists: true } });
    let missingFiles = [];

    for (const client of clients) {
      for (const file of client.uploadedFiles) {
        let filePath = null;
        let fileExists = false;

        if (file.diskPath && fs.existsSync(file.diskPath)) {
          fileExists = true;
        } else if (file.relativePath) {
          filePath = path.join(__dirname, '../uploads', file.relativePath);
          if (fs.existsSync(filePath)) {
            fileExists = true;
          }
        }

        if (!fileExists) {
          missingFiles.push({
            clientId: client.clientId,
            fileId: file._id,
            fileName: file.fileName,
            originalName: file.originalName,
            diskPath: file.diskPath,
            relativePath: file.relativePath,
          });
        }
      }
    }

    if (missingFiles.length > 0) {
      console.log('❌ Found missing files:');
      console.table(missingFiles);
    } else {
      console.log('✅ All file records are valid and exist on the file system.');
    }

  } catch (error) {
    console.error('❌ Error validating file system:', error);
  } finally {
    mongoose.disconnect();
    console.log('🔌 MongoDB Disconnected');
  }
};

validateFileSystem();
