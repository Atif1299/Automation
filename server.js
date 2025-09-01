const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

// Security Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

// CORS Configuration
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') 
        : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Compression for better performance
app.use(compression());

// Import validation middleware
const { sanitizeInput, apiRateLimit } = require('./middleware/validation');

// Database connection
const connectDB = require('./config/database');
connectDB();

// Set the view engine to ejs
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
// No default layout - each route will specify its own

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse URL-encoded bodies and JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// Security middleware
app.use(sanitizeInput);

// API Rate limiting (only for API routes)
app.use('/api', apiRateLimit);

// Define a simple route for the homepage
app.get('/', (req, res) => {
    res.render('home', { title: 'Home Page', layout: false });
});

// Authentication page routes
app.get('/auth/client-login', (req, res) => {
    res.render('auth/client-login', { title: 'Client Login', layout: false });
});

app.get('/auth/client-register', (req, res) => {
    res.render('auth/client-register', { title: 'Client Registration', layout: false });
});

app.get('/auth/admin-login', (req, res) => {
    res.render('auth/admin-login', { title: 'Admin Login', layout: false });
});

// Define routes
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');
const authRoutes = require('./routes/auth/index');

// Authentication routes
app.use('/auth', authRoutes);

// Protected routes (will be protected after authentication is fully implemented)
app.use('/admin', adminRoutes);
app.use('/client', clientRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Unhandled error:', error);
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(error.status || 500).json({
        error: isDevelopment ? error.message : 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        ...(isDevelopment && { stack: error.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).render('error', {
        title: '404 - Page Not Found',
        message: 'The page you are looking for does not exist.',
        layout: false
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
