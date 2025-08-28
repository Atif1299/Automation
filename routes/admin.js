const express = require('express');
const router = express.Router();

// Admin dashboard route
router.get('/', (req, res) => {
    res.render('admin/dashboard', { title: 'Admin Dashboard' });
});

module.exports = router;
