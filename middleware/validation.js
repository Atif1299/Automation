const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// Input Validation Rules
const validateClientRegistration = [
    body('name')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        })
];

const validateClientLogin = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const validateAdminLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

const validateMessage = [
    body('message')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters')
        .escape() // Prevent XSS
];

const validateCredentials = [
    body('platform')
        .isIn(['account', 'linkedin', 'twitter', 'email', 'facebook', 'instagram'])
        .withMessage('Invalid platform selected'),
    
    body('username')
        .trim()
        .isLength({ min: 3, max: 100 })
        .withMessage('Username must be between 3 and 100 characters'),
    
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
];

// Rate Limiting Configurations
const createRateLimiter = (windowMs, max, message) => {
    return rateLimit({
        windowMs,
        max,
        message: {
            error: message,
            code: 'RATE_LIMIT_EXCEEDED'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Skip rate limiting for development
            return process.env.NODE_ENV === 'development';
        }
    });
};

// Different rate limits for different endpoints
const authRateLimit = createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    5, // 5 attempts
    'Too many authentication attempts, please try again after 15 minutes'
);

const apiRateLimit = createRateLimiter(
    1 * 60 * 1000, // 1 minute
    100, // 100 requests
    'Too many API requests, please try again after 1 minute'
);

const messageRateLimit = createRateLimiter(
    1 * 60 * 1000, // 1 minute
    10, // 10 messages
    'Too many messages sent, please try again after 1 minute'
);

const fileUploadRateLimit = createRateLimiter(
    1 * 60 * 1000, // 1 minute
    5, // 5 uploads
    'Too many file uploads, please try again after 1 minute'
);

// Validation Error Handler
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => ({
            field: error.param,
            message: error.msg,
            value: error.value
        }));

        return res.status(400).json({
            error: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: errorMessages
        });
    }
    
    next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
    // Remove any potentially dangerous properties
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    
    const sanitizeObject = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        for (const key of dangerousKeys) {
            delete obj[key];
        }
        
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'object') {
                sanitizeObject(value);
            }
        }
        
        return obj;
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);
    
    next();
};

module.exports = {
    // Validation rules
    validateClientRegistration,
    validateClientLogin,
    validateAdminLogin,
    validateMessage,
    validateCredentials,
    
    // Rate limiters
    authRateLimit,
    apiRateLimit,
    messageRateLimit,
    fileUploadRateLimit,
    
    // Middleware
    handleValidationErrors,
    sanitizeInput
};
