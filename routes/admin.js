const express = require('express');
const router = express.Router();

// Simple middleware to check admin session
function checkAdminAuth(req, res, next) {
    if (req.session && req.session.isAdminLoggedIn) {
        return next();
    } else {
        return res.redirect('/admin/login');
    }
}

// Admin login page (public - no auth needed)
router.get('/login', (req, res) => {
    // If already logged in, redirect to dashboard
    if (req.session && req.session.isAdminLoggedIn) {
        return res.redirect('/admin/dashboard');
    }
    res.render('admin/login', { 
        title: 'Admin Login',
        error: null 
    });
});

// Admin login POST route
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    
    // Check credentials against environment variables
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        // Set session
        req.session.isAdminLoggedIn = true;
        req.session.adminEmail = email;
        
        // Redirect to dashboard
        res.redirect('/admin/dashboard');
    } else {
        // Invalid credentials
        res.render('admin/login', { 
            title: 'Admin Login',
            error: 'Invalid email or password' 
        });
    }
});

// Admin dashboard route (protected)
router.get('/dashboard', checkAdminAuth, (req, res) => {
    res.render('admin/dashboard', { 
        title: 'Admin Dashboard',
        adminEmail: req.session.adminEmail
    });
});

// Admin logout route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/admin/login');
    });
});

// Default admin route - redirect to login
router.get('/', (req, res) => {
    res.redirect('/admin/login');
});

module.exports = router;
