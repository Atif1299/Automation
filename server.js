const express = require('express');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
require('dotenv').config();

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

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Define a simple route for the homepage
app.get('/', (req, res) => {
    res.render('home', { title: 'Home Page', layout: false });
});

// Define routes for admin and client dashboards
const adminRoutes = require('./routes/admin');
const clientRoutes = require('./routes/client');

app.use('/admin', adminRoutes);
app.use('/client', clientRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
