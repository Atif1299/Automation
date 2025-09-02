#!/usr/bin/env node

/**
 * File System Migration Script
 * Migrates existing files to the new organized structure
 * Updates database records with correct paths
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import Client model
const Client = require('../models/Client');

async function migrateFileSystem() {
    console.log('🚀 Starting file system migration...');
    
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        const oldUploadDir = path.join(__dirname, '../uploads/admin-files');
        const newUploadBase = path.join(__dirname, '../uploads/admin-files');
        
        // Create organized directory structure
        const currentYear = new Date().getFullYear();
        const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
        const organizedDir = path.join(newUploadBase, `${currentYear}`, `${currentMonth}`);
        
        if (!fs.existsSync(organizedDir)) {
            fs.mkdirSync(organizedDir, { recursive: true });
            console.log(`📁 Created directory: ${organizedDir}`);
        }
        
        // Get all files from old structure
        if (!fs.existsSync(oldUploadDir)) {
            console.log('❌ Old upload directory not found');
            return;
        }
        
        const files = fs.readdirSync(oldUploadDir);
        const migratedFiles = [];
        const errors = [];
        
        for (const fileName of files) {
            const oldPath = path.join(oldUploadDir, fileName);
            const stat = fs.statSync(oldPath);
            
            // Skip directories
            if (stat.isDirectory()) continue;
            
            try {
                // Check if file is already in a year/month subdirectory
                if (oldPath.includes(`${currentYear}`) && oldPath.includes(`${currentMonth}`)) {
                    console.log(`⏭️ File already organized: ${fileName}`);
                    continue;
                }
                
                const newPath = path.join(organizedDir, fileName);
                
                // Move file to organized structure
                fs.renameSync(oldPath, newPath);
                console.log(`📦 Moved: ${fileName}`);
                
                // Update database record
                const relativePath = `admin-files/${currentYear}/${currentMonth}/${fileName}`;
                
                const updateResult = await Client.updateMany(
                    { 'uploadedFiles.fileName': fileName },
                    {
                        $set: {
                            'uploadedFiles.$.relativePath': relativePath,
                            'uploadedFiles.$.diskPath': newPath,
                            'uploadedFiles.$.downloadPath': `/uploads/${relativePath}`
                        }
                    }
                );
                
                if (updateResult.modifiedCount > 0) {
                    console.log(`💾 Updated ${updateResult.modifiedCount} database record(s) for ${fileName}`);
                }
                
                migratedFiles.push({
                    fileName,
                    oldPath,
                    newPath,
                    dbUpdates: updateResult.modifiedCount
                });
                
            } catch (error) {
                console.error(`❌ Error migrating ${fileName}:`, error.message);
                errors.push({ fileName, error: error.message });
            }
        }
        
        console.log('\n📊 Migration Summary:');
        console.log(`✅ Successfully migrated: ${migratedFiles.length} files`);
        console.log(`❌ Errors: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n🚨 Errors encountered:');
            errors.forEach(err => console.log(`  - ${err.fileName}: ${err.error}`));
        }
        
        // Verify migration
        console.log('\n🔍 Verifying migration...');
        const clients = await Client.find({ 'uploadedFiles.0': { $exists: true } });
        let verifiedFiles = 0;
        let missingFiles = 0;
        
        for (const client of clients) {
            for (const file of client.uploadedFiles) {
                if (file.diskPath && fs.existsSync(file.diskPath)) {
                    verifiedFiles++;
                } else if (file.relativePath) {
                    const fullPath = path.join(__dirname, '../uploads', file.relativePath);
                    if (fs.existsSync(fullPath)) {
                        verifiedFiles++;
                    } else {
                        missingFiles++;
                        console.log(`⚠️ Missing file: ${file.fileName}`);
                    }
                } else {
                    missingFiles++;
                    console.log(`⚠️ No path info for file: ${file.fileName}`);
                }
            }
        }
        
        console.log(`✅ Verified files: ${verifiedFiles}`);
        console.log(`❌ Missing files: ${missingFiles}`);
        
        console.log('\n🎉 Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run migration if called directly
if (require.main === module) {
    migrateFileSystem().catch(console.error);
}

module.exports = migrateFileSystem;
