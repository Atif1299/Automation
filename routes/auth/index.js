const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();
const ejs = require('ejs');
const path = require('path');
const Client = require('../../models/Client');
const { sendEmail } = require('../../config/email');
const { 
    generateClientToken, 
    generateAdminToken 
} = require('../../middleware/auth');
const { 
    validateClientRegistration, 
    validateClientLogin, 
    validateAdminLogin,
    handleValidationErrors,
    authRateLimit 
} = require('../../middleware/validation');

// Page rendering routes
router.get('/client-login', (req, res) => res.render('auth/client-login', { title: 'Client Login', layout: false }));
router.get('/client-register', (req, res) => res.render('auth/client-register', { title: 'Client Registration', layout: false }));
router.get('/admin-login', (req, res) => res.render('auth/admin-login', { title: 'Admin Login', layout: false }));
router.get('/forgot-password', (req, res) => res.render('auth/forgot-password', { title: 'Forgot Password', layout: false }));
router.get('/reset-password/:token', (req, res) => res.render('auth/reset-password', { title: 'Reset Password', layout: false, token: req.params.token }));

// Client Registration
router.post('/client/register', 
    authRateLimit,
    validateClientRegistration,
    handleValidationErrors,
    async (req, res) => {
        try {
            console.log('📝 Client registration attempt:', {
                body: req.body,
                headers: req.headers['content-type']
            });
            
            const { name, email, password } = req.body;

            // Check if client already exists
            const existingClient = await Client.findOne({ email });
            if (existingClient) {
                return res.status(409).json({
                    error: 'Client with this email already exists',
                    code: 'CLIENT_EXISTS'
                });
            }

            // Generate unique client ID
            const clientId = 'CLT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();

            // Create new client (password will be hashed by pre-save hook)
            const client = new Client({
                clientId,
                name,
                email,
                credentials: [{
                    platform: 'account',
                    username: email,
                    password: password, // Don't hash here - let pre-save hook handle it
                    isActive: true,
                    connectionStatus: 'connected'
                }],
                status: 'active', // Changed from 'pending_verification' to 'active'
                plan: 'free'
            });

            await client.save();
            
            console.log('🔍 Registration debug - after save:', {
                clientId: client.clientId,
                hashedPasswordLength: client.credentials[0].password.length,
                hashedPasswordSample: client.credentials[0].password.substring(0, 10) + '...'
            });

            // Generate token
            const token = generateClientToken(client);

            // Log registration
            await client.addActivityLog(
                'success',
                'Client account created successfully',
                `New client registered with email: ${email}`
            );

            res.status(201).json({
                success: true,
                message: 'Client registered successfully. Please verify your email to activate your account.',
                data: {
                    clientId: client.clientId,
                    name: client.name,
                    email: client.email,
                    status: client.status,
                    verificationUrl: `${req.protocol}://${req.get('host')}/auth/verify-email/${client.clientId}`,
                    token
                }
            });

        } catch (error) {
            console.error('❌ Client registration error:', error);
            res.status(500).json({
                error: 'Registration failed',
                code: 'REGISTRATION_ERROR'
            });
        }
    }
);

// Forgot Password - Step 1: Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const client = await Client.findOne({ email });

        if (!client) {
            // Don't reveal that the user does not exist
            return res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });
        }

        // Generate a reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        client.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        client.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await client.save();

        // Send the email
        const resetUrl = `${req.protocol}://${req.get('host')}/auth/reset-password/${resetToken}`;
        const subject = 'Your Password Reset Request';
        
        const emailTemplate = path.join(__dirname, '../../views/emails/passwordReset.ejs');
        const html = await ejs.renderFile(emailTemplate, { name: client.name, resetUrl });

        await sendEmail(client.email, subject, html);

        res.json({ success: true, message: 'If an account with that email exists, a password reset link has been sent.' });

    } catch (error) {
        console.error('❌ Forgot password error:', error);
        res.status(500).json({ error: 'An error occurred while sending the password reset email.' });
    }
});

// Forgot Password - Step 2: Reset the password
router.post('/reset-password/:token', async (req, res) => {
    try {
        // Get hashed token
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const client = await Client.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!client) {
            return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
        }

        // Set the new password
        const accountCredential = client.credentials.find(cred => cred.platform === 'account');
        if (accountCredential) {
            accountCredential.password = req.body.password;
        } else {
            // This case should ideally not happen if the client exists
            return res.status(500).json({ error: 'Could not find account credentials to update.' });
        }
        
        client.passwordResetToken = undefined;
        client.passwordResetExpires = undefined;
        await client.save();

        res.json({ success: true, message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('❌ Reset password error:', error);
        res.status(500).json({ error: 'An error occurred while resetting the password.' });
    }
});

// Client Login
router.post('/client/login',
    authRateLimit,
    validateClientLogin,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { email, password } = req.body;

            // Find client by email
            const client = await Client.findOne({ email });
            console.log('🔍 Client lookup:', { email, found: !!client });
            
            if (!client) {
                console.log('❌ No client found with email:', email);
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Check if client has account credentials
            const accountCredential = client.credentials.find(
                cred => cred.platform === 'account'
            );
            
            console.log('🔍 Account credentials check:', {
                hasCredentials: !!accountCredential,
                credentialsCount: client.credentials.length,
                platforms: client.credentials.map(c => c.platform)
            });

            if (!accountCredential) {
                console.log('❌ No account credential found');
                return res.status(401).json({
                    error: 'Account not properly configured',
                    code: 'ACCOUNT_ERROR'
                });
            }

            // Verify password
            console.log('🔍 Login attempt debug:', {
                email,
                passwordProvided: password,
                storedPasswordHash: accountCredential.password,
                storedPasswordLength: accountCredential.password.length
            });
            
            const isValidPassword = await bcrypt.compare(password, accountCredential.password);
            console.log('🔒 Password comparison result:', isValidPassword);
            
            if (!isValidPassword) {
                return res.status(401).json({
                    error: 'Invalid credentials',
                    code: 'INVALID_CREDENTIALS'
                });
            }

            // Check if account is active
            if (client.status === 'suspended') {
                return res.status(403).json({
                    error: 'Account is suspended',
                    code: 'ACCOUNT_SUSPENDED'
                });
            }

            if (client.status === 'pending_verification') {
                return res.status(403).json({
                    error: 'Account is pending verification. Please verify your email first.',
                    code: 'ACCOUNT_PENDING_VERIFICATION'
                });
            }

            // Generate token
            const token = generateClientToken(client);

            // Update last login
            client.lastLogin = new Date();
            await client.save();

            // Log login
            await client.addActivityLog(
                'success',
                'Client logged in successfully',
                `Login from IP: ${req.ip}`
            );

            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    clientId: client.clientId,
                    name: client.name,
                    email: client.email,
                    status: client.status,
                    token
                }
            });

        } catch (error) {
            console.error('❌ Client login error:', error);
            res.status(500).json({
                error: 'Login failed',
                code: 'LOGIN_ERROR'
            });
        }
    }
);

// Admin Login
router.post('/admin/login',
    authRateLimit,
    validateAdminLogin,
    handleValidationErrors,
    async (req, res) => {
        try {
            const { username, password } = req.body;

            // Check admin credentials (hardcoded for now, should be in database)
            const adminCredentials = {
                username: process.env.ADMIN_USERNAME || 'admin',
                password: process.env.ADMIN_PASSWORD || 'admin123'
            };

            if (username !== adminCredentials.username || password !== adminCredentials.password) {
                return res.status(401).json({
                    error: 'Invalid admin credentials',
                    code: 'INVALID_ADMIN_CREDENTIALS'
                });
            }

            // Generate admin token
            const token = generateAdminToken({
                id: 'admin',
                username: username,
                permissions: ['read', 'write', 'delete', 'manage_clients']
            });

            // Set secure HTTP-only cookie for web authentication
            res.cookie('adminToken', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 8 * 60 * 60 * 1000 // 8 hours
            });

            res.json({
                success: true,
                message: 'Admin login successful',
                data: {
                    username: username,
                    role: 'admin',
                    token,
                    permissions: ['read', 'write', 'delete', 'manage_clients']
                }
            });

        } catch (error) {
            console.error('❌ Admin login error:', error);
            res.status(500).json({
                error: 'Admin login failed',
                code: 'ADMIN_LOGIN_ERROR'
            });
        }
    }
);

// Logout (Token invalidation would require a blacklist in production)
router.post('/logout', (req, res) => {
    // In a production environment, you would add the token to a blacklist
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Token verification endpoint
router.get('/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            error: 'No token provided',
            code: 'NO_TOKEN'
        });
    }

    const jwt = require('jsonwebtoken');
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({
                error: 'Invalid token',
                code: 'INVALID_TOKEN'
            });
        }

        res.json({
            success: true,
            data: {
                valid: true,
                user: decoded
            }
        });
    });
});

// Email Verification
router.get('/verify-email/:token',
    async (req, res) => {
        try {
            const { token } = req.params;
            
            // For now, we'll verify using the clientId as token
            // In production, you'd want to use JWT tokens with expiration
            const client = await Client.findOne({ clientId: token });
            
            if (!client) {
                return res.status(404).json({
                    error: 'Invalid verification token',
                    code: 'INVALID_TOKEN'
                });
            }

            if (client.status !== 'pending_verification') {
                return res.status(400).json({
                    error: 'Account is already verified or has different status',
                    code: 'ALREADY_VERIFIED'
                });
            }

            // Update status to active
            client.status = 'active';
            await client.save();

            // Log verification
            await client.addActivityLog(
                'verification',
                'Email verified successfully',
                `Email verification completed for: ${client.email}`
            );

            res.json({
                success: true,
                message: 'Email verified successfully. You can now log in.',
                data: {
                    clientId: client.clientId,
                    status: client.status
                }
            });

        } catch (error) {
            console.error('❌ Email verification error:', error);
            res.status(500).json({
                error: 'Verification failed',
                code: 'VERIFICATION_ERROR'
            });
        }
    }
);

module.exports = router;
