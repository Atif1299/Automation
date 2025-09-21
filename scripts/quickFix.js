#!/usr/bin/env node

/**
 * Quick Fix for Specific File Record
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Client = require('../models/Client');

async function fixSpecificFile() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const fileId = '68b6c03e435530ff7461d269';
        const uploadsDir = path.join(__dirname, '../uploads/admin-files/2025/09');
        
        // Find the client with this file
        const client = await Client.findOne({
            'uploadedFiles._id': fileId
        });
        
        if (!client) {
            console.log('❌ File not found in database');
            return;
        }
        
        const fileRecord = client.uploadedFiles.find(f => f._id.toString() === fileId);
        console.log('📄 Current file record:', {
            fileName: fileRecord.fileName,
            originalName: fileRecord.originalName,
            diskPath: fileRecord.diskPath,
            relativePath: fileRecord.relativePath
        });
        
        // List all files in the upload directory
        const files = fs.readdirSync(uploadsDir);
        console.log('📁 Files on disk:', files);
        
        // Try to match the file
        let matchedFile = null;
        
        // Try exact match first
        if (files.includes(fileRecord.fileName)) {
            matchedFile = fileRecord.fileName;
        } else {
            // Try fuzzy match
            for (const file of files) {
                if (file.includes('automation-logs') && fileRecord.originalName?.includes('automation-logs')) {
                    matchedFile = file;
                    break;
                }
            }
        }
        
        if (matchedFile) {
            console.log('✅ Found matching file:', matchedFile);
            
            const diskPath = path.join(uploadsDir, matchedFile);
            const relativePath = `admin-files/2025/09/${matchedFile}`;
            const stats = fs.statSync(diskPath);
            
            // Update the file record
            await Client.updateOne(
                { 'uploadedFiles._id': fileId },
                {
                    $set: {
                        'uploadedFiles.$.fileName': matchedFile,
                        'uploadedFiles.$.diskPath': diskPath,
                        'uploadedFiles.$.relativePath': relativePath,
                        'uploadedFiles.$.downloadPath': `/uploads/${relativePath}`,
                        'uploadedFiles.$.fileSize': stats.size,
                        'uploadedFiles.$.mimeType': getMimeType(matchedFile)
                    }
                }
            );
            
            console.log('🔧 Updated file record with correct paths');
            console.log('✅ File should now download successfully!');
        } else {
            console.log('❌ No matching file found on disk');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

function getMimeType(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
        '.pdf': 'application/pdf',
        '.csv': 'text/csv',
        '.txt': 'text/plain'
    };
    return mimeTypes[ext] || 'application/octet-stream';
}

fixSpecificFile();
