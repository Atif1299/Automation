// Quick client creator for testing
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

async function createTestClient() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        const Client = require('./models/Client');
        
        // Delete existing test client if any
        await Client.deleteOne({ clientId: 'test001' });
        
        // Create new test client
        const testClient = new Client({
            clientId: 'test001',
            name: 'Test Client',
            email: 'test@example.com',
            status: 'active',
            plan: 'premium',
            emailVerified: true,
            credentials: [
                {
                    platform: 'facebook',
                    username: 'test.facebook@example.com',
                    password: 'facebook_pass123',
                    isActive: true,
                    connectionStatus: 'connected',
                    lastTested: new Date()
                },
                {
                    platform: 'linkedin',
                    username: 'test.linkedin@example.com',
                    password: 'linkedin_pass456',
                    isActive: true,
                    connectionStatus: 'pending',
                    lastTested: new Date()
                },
                {
                    platform: 'twitter',
                    username: 'test_twitter',
                    password: 'twitter_pass789',
                    isActive: false,
                    connectionStatus: 'failed'
                },
                {
                    platform: 'account',
                    username: 'ranaatif1299@gmail.com',
                    password: 'account_password123',
                    isActive: true,
                    connectionStatus: 'connected',
                    lastTested: new Date()
                }
            ],
            campaigns: [
                {
                    name: 'Social Media Outreach',
                    automationType: 'outreach',
                    instructions: 'Connect with potential leads in the tech industry',
                    status: 'active',
                    createdAt: new Date(),
                    lastRun: new Date()
                },
                {
                    name: 'Lead Enrichment',
                    automationType: 'enrichment',
                    instructions: 'Enrich existing leads with additional contact information',
                    status: 'completed',
                    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                },
                {
                    name: 'Data Scraping Project',
                    automationType: 'scraping',
                    instructions: 'Scrape competitor pricing and product information',
                    status: 'paused',
                    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
                }
            ],
            uploadedFiles: [
                {
                    fileName: 'leads_2024_001.csv',
                    originalName: 'leads_january_2024.csv',
                    fileSize: 45600,
                    fileType: 'text/csv',
                    uploadDate: new Date(),
                    processedRows: 250,
                    validRows: 247,
                    status: 'processed'
                },
                {
                    fileName: 'prospects_002.xlsx',
                    originalName: 'prospect_list.xlsx',
                    fileSize: 128000,
                    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    processedRows: 500,
                    validRows: 485,
                    status: 'processed'
                }
            ],
            activityLogs: [
                {
                    type: 'info',
                    message: 'Account created',
                    details: 'New client account created successfully',
                    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                    source: 'system'
                },
                {
                    type: 'success',
                    message: 'Facebook credentials connected',
                    details: 'Successfully connected Facebook Business account',
                    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
                    source: 'client'
                },
                {
                    type: 'info',
                    message: 'File uploaded',
                    details: 'leads_january_2024.csv uploaded and processed',
                    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                    source: 'client'
                },
                {
                    type: 'success',
                    message: 'Campaign launched',
                    details: 'Social Media Outreach campaign started',
                    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                    source: 'client'
                },
                {
                    type: 'warning',
                    message: 'Twitter connection failed',
                    details: 'Unable to authenticate Twitter credentials',
                    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                    source: 'system'
                },
                {
                    type: 'info',
                    message: 'Admin sent file: Welcome_Package.pdf - Welcome to our platform! Here is your getting started guide.',
                    details: 'File: Welcome_Package.pdf (2.5 MB)',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    source: 'admin',
                    fileInfo: {
                        fileName: 'admin-1725198765432-Welcome_Package.pdf',
                        originalName: 'Welcome_Package.pdf',
                        category: 'instruction',
                        downloadPath: '/uploads/admin-files/admin-1725198765432-Welcome_Package.pdf'
                    }
                },
                {
                    type: 'info',
                    message: 'Admin sent file: Campaign_Template.xlsx - Use this template for your next campaign',
                    details: 'File: Campaign_Template.xlsx (156 KB)',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000),
                    source: 'admin',
                    fileInfo: {
                        fileName: 'admin-1725198765433-Campaign_Template.xlsx',
                        originalName: 'Campaign_Template.xlsx',
                        category: 'template',
                        downloadPath: '/uploads/admin-files/admin-1725198765433-Campaign_Template.xlsx'
                    }
                },
                {
                    type: 'success',
                    message: 'Admin message: Your account has been upgraded to Premium. Enjoy the new features!',
                    details: 'Account upgrade notification from admin',
                    timestamp: new Date(),
                    source: 'admin'
                }
            ],
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000)
        });
        
        await testClient.save();
        console.log('✅ Test client created successfully!');
        console.log('Client ID: test001');
        console.log('Name: Test Client');
        console.log('Email: test@example.com');
        console.log('');
        console.log('🎯 You can now test the modal functionality at:');
        console.log('http://localhost:4000/admin');
        console.log('');
        console.log('Click the "View" button on the test client card to see real data!');
        
        mongoose.disconnect();
        
    } catch (error) {
        console.error('❌ Error creating test client:', error);
        mongoose.disconnect();
    }
}

createTestClient();
