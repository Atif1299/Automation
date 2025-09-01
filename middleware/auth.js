const jwt = require('jsonwebtoken');
const Client = require('../models/Client');

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            error: 'Access token required',
            code: 'NO_TOKEN'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }
        req.user = user;
        next();
    });
};

// Admin Authentication Middleware
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    
    // For web routes, also check cookies
    if (!token && req.cookies && req.cookies.adminToken) {
        token = req.cookies.adminToken;
    }

    if (!token) {
        // For web routes, redirect to login
        if (req.path.startsWith('/admin') && req.method === 'GET') {
            return res.redirect('/auth/admin-login');
        }
        return res.status(401).json({ 
            error: 'Admin access required',
            code: 'NO_ADMIN_TOKEN'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, admin) => {
        if (err || admin.role !== 'admin') {
            if (req.path.startsWith('/admin') && req.method === 'GET') {
                return res.redirect('/auth/admin-login');
            }
            return res.status(403).json({ 
                error: 'Admin access denied',
                code: 'INVALID_ADMIN_TOKEN'
            });
        }
        req.admin = admin;
        next();
    });
};

// Client Authentication Middleware
const authenticateClient = async (req, res, next) => {
    try {
        const clientId = req.params.id || req.body.clientId;
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        // For development, allow access without token if clientId matches
        if (process.env.NODE_ENV === 'development' && clientId) {
            const client = await Client.findByClientId(clientId);
            if (client) {
                req.client = client;
                req.clientId = clientId;
                return next();
            }
        }

        if (!token) {
            return res.status(401).json({ 
                error: 'Client authentication required',
                code: 'NO_CLIENT_TOKEN'
            });
        }

        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ 
                    error: 'Invalid client token',
                    code: 'INVALID_CLIENT_TOKEN'
                });
            }

            // Verify client exists and token matches
            const client = await Client.findByClientId(decoded.clientId);
            if (!client || decoded.clientId !== clientId) {
                return res.status(403).json({ 
                    error: 'Client access denied',
                    code: 'CLIENT_ACCESS_DENIED'
                });
            }

            req.client = client;
            req.clientId = decoded.clientId;
            next();
        });
    } catch (error) {
        console.error('❌ Client authentication error:', error);
        res.status(500).json({ 
            error: 'Authentication error',
            code: 'AUTH_ERROR'
        });
    }
};

// Generate JWT Token
const generateToken = (payload, expiresIn = '24h') => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

// Generate Admin Token
const generateAdminToken = (adminData) => {
    return generateToken({
        id: adminData.id || 'admin',
        role: 'admin',
        permissions: adminData.permissions || ['read', 'write', 'delete']
    }, '8h'); // Admin tokens expire in 8 hours
};

// Generate Client Token
const generateClientToken = (client) => {
    return generateToken({
        clientId: client.clientId,
        role: 'client',
        email: client.email
    }, '7d'); // Client tokens expire in 7 days
};

module.exports = {
    authenticateToken,
    authenticateAdmin,
    authenticateClient,
    generateToken,
    generateAdminToken,
    generateClientToken
};
