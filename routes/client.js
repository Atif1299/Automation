const express = require('express');
const router = express.Router();

// Client dashboard route
router.get('/:id', (req, res) => {
    const clientId = req.params.id;
    res.render('client/dashboard', { 
        title: `Client ${clientId} Dashboard`, 
        clientId: clientId,
        layout: 'layouts/client-layout',
        isDashboard: true
    });
});

module.exports = router;
