const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // MongoDB connection options (removed deprecated options)
        const options = {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
           
        };

        const conn = await mongoose.connect(process.env.MONGODB_URI, options);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('❌ MongoDB connection error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });

        // Graceful shutdown
        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            console.log('🔒 MongoDB connection closed due to app termination');
            process.exit(0);
        });

        return conn;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        
        // For development, continue without database
        if (process.env.NODE_ENV === 'development') {
            console.log('⚠️ Running in development mode without database');
            return null;
        }
        
        process.exit(1);
    }
};

module.exports = connectDB;
