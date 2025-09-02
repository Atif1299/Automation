const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    phantombusterApiKey: {
        type: String,
        trim: true
    }
});

module.exports = mongoose.model('Admin', adminSchema);
