#!/usr/bin/env node

/**
 * File System Validation Tool
 * Validates file system integrity and generates reports
 */

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

// Import Client model
const Client = require('../models/Client');

class FileSystemValidator {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../uploads');
        this.errors = [];
        this.warnings = [];
        this.stats = {
            totalFiles: 0,
            validFiles: 0,
            missingFiles: 0,
            orphanedFiles: 0,
            duplicateFiles: 0
        };
    }

    async validate() {
        console.log('🔍 Starting file system validation...');
        
        try {
            // Connect to MongoDB
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB');
            
            // Step 1: Validate database records
            await this.validateDatabaseRecords();
            
            // Step 2: Find orphaned files
            await this.findOrphanedFiles();
            
            // Step 3: Check for duplicates
            await this.checkForDuplicates();
            
            // Step 4: Generate report
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Validation failed:', error);
        } finally {
            await mongoose.disconnect();
            console.log('📤 Disconnected from MongoDB');
        }
    }

    async validateDatabaseRecords() {
        console.log('\n📋 Validating database records...');
        
        const clients = await Client.find({ 'uploadedFiles.0': { $exists: true } });
        
        for (const client of clients) {
            for (const file of client.uploadedFiles) {
                this.stats.totalFiles++;
                
                let fileExists = false;
                let actualPath = null;
                
                // Check diskPath first
                if (file.diskPath && fs.existsSync(file.diskPath)) {
                    fileExists = true;
                    actualPath = file.diskPath;
                } 
                // Check relativePath
                else if (file.relativePath) {
                    const fullPath = path.join(this.uploadsDir, file.relativePath);
                    if (fs.existsSync(fullPath)) {
                        fileExists = true;
                        actualPath = fullPath;
                    }
                }
                // Check legacy path
                else if (file.fileName) {
                    const legacyPath = path.join(this.uploadsDir, 'admin-files', file.fileName);
                    if (fs.existsSync(legacyPath)) {
                        fileExists = true;
                        actualPath = legacyPath;
                        this.warnings.push({
                            type: 'legacy_path',
                            message: `File ${file.fileName} found in legacy location`,
                            clientId: client._id,
                            fileName: file.fileName
                        });
                    }
                }
                
                if (fileExists) {
                    this.stats.validFiles++;
                    
                    // Validate file metadata
                    const stat = fs.statSync(actualPath);
                    const dbSize = file.fileSize;
                    const actualSize = stat.size;
                    
                    if (dbSize && dbSize !== actualSize) {
                        this.warnings.push({
                            type: 'size_mismatch',
                            message: `Size mismatch for ${file.fileName}: DB=${dbSize}, Disk=${actualSize}`,
                            clientId: client._id,
                            fileName: file.fileName
                        });
                    }
                } else {
                    this.stats.missingFiles++;
                    this.errors.push({
                        type: 'missing_file',
                        message: `File not found: ${file.fileName}`,
                        clientId: client._id,
                        fileName: file.fileName,
                        expectedPaths: [
                            file.diskPath,
                            file.relativePath ? path.join(this.uploadsDir, file.relativePath) : null,
                            path.join(this.uploadsDir, 'admin-files', file.fileName)
                        ].filter(Boolean)
                    });
                }
            }
        }
    }

    async findOrphanedFiles() {
        console.log('\n👻 Checking for orphaned files...');
        
        const adminFilesDir = path.join(this.uploadsDir, 'admin-files');
        if (!fs.existsSync(adminFilesDir)) {
            console.log('⚠️ Admin files directory not found');
            return;
        }
        
        const allDiskFiles = this.getAllFiles(adminFilesDir);
        const dbFileNames = new Set();
        
        // Get all file names from database
        const clients = await Client.find({ 'uploadedFiles.0': { $exists: true } });
        for (const client of clients) {
            for (const file of client.uploadedFiles) {
                if (file.fileName) {
                    dbFileNames.add(file.fileName);
                }
            }
        }
        
        for (const diskFile of allDiskFiles) {
            const fileName = path.basename(diskFile);
            if (!dbFileNames.has(fileName)) {
                this.stats.orphanedFiles++;
                this.warnings.push({
                    type: 'orphaned_file',
                    message: `Orphaned file found: ${fileName}`,
                    filePath: diskFile
                });
            }
        }
    }

    async checkForDuplicates() {
        console.log('\n🔍 Checking for duplicate files...');
        
        const clients = await Client.find({ 'uploadedFiles.0': { $exists: true } });
        const fileMap = new Map();
        
        for (const client of clients) {
            for (const file of client.uploadedFiles) {
                if (file.fileName) {
                    if (fileMap.has(file.fileName)) {
                        this.stats.duplicateFiles++;
                        this.warnings.push({
                            type: 'duplicate_file',
                            message: `Duplicate file found: ${file.fileName}`,
                            clients: [fileMap.get(file.fileName), client._id]
                        });
                    } else {
                        fileMap.set(file.fileName, client._id);
                    }
                }
            }
        }
    }

    getAllFiles(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                this.getAllFiles(filePath, fileList);
            } else {
                fileList.push(filePath);
            }
        }
        
        return fileList;
    }

    generateReport() {
        console.log('\n📊 VALIDATION REPORT');
        console.log('='.repeat(50));
        
        // Statistics
        console.log('\n📈 STATISTICS:');
        console.log(`Total Files in DB: ${this.stats.totalFiles}`);
        console.log(`Valid Files: ${this.stats.validFiles}`);
        console.log(`Missing Files: ${this.stats.missingFiles}`);
        console.log(`Orphaned Files: ${this.stats.orphanedFiles}`);
        console.log(`Duplicate Files: ${this.stats.duplicateFiles}`);
        
        const healthScore = this.stats.totalFiles > 0 
            ? Math.round((this.stats.validFiles / this.stats.totalFiles) * 100)
            : 100;
        console.log(`\n🏥 Health Score: ${healthScore}%`);
        
        // Errors
        if (this.errors.length > 0) {
            console.log('\n❌ ERRORS:');
            this.errors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.message}`);
                if (error.expectedPaths) {
                    console.log(`   Expected paths:`);
                    error.expectedPaths.forEach(p => console.log(`     - ${p}`));
                }
            });
        }
        
        // Warnings
        if (this.warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            this.warnings.forEach((warning, index) => {
                console.log(`${index + 1}. ${warning.message}`);
            });
        }
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        if (this.stats.missingFiles > 0) {
            console.log('- Run file recovery to restore missing files from backups');
        }
        if (this.stats.orphanedFiles > 0) {
            console.log('- Clean up orphaned files to free disk space');
        }
        if (this.warnings.some(w => w.type === 'legacy_path')) {
            console.log('- Run migration script to organize legacy files');
        }
        if (healthScore < 95) {
            console.log('- Consider running integrity repair tools');
        }
        
        console.log('\n✅ Validation completed!');
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new FileSystemValidator();
    validator.validate().catch(console.error);
}

module.exports = FileSystemValidator;
