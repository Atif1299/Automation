const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
    // Admin Information
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    
    // Admin Role & Permissions
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'moderator'],
        default: 'admin'
    },
    permissions: [{
        type: String,
        enum: [
            'view_clients',
            'manage_clients', 
            'view_campaigns',
            'manage_campaigns',
            'view_analytics',
            'manage_settings',
            'manage_admins'
        ]
    }],
    
    // Admin Status
    isActive: {
        type: Boolean,
        default: true
    },
    
    // Login tracking
    lastLogin: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    
    // Activity tracking
    activityLogs: [{
        action: {
            type: String,
            required: true
        },
        targetType: {
            type: String,
            enum: ['client', 'campaign', 'file', 'system']
        },
        targetId: {
            type: String
        },
        details: {
            type: String
        },
        ipAddress: {
            type: String
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes
adminSchema.index({ isActive: 1 });

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Password hashing middleware
adminSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        this.password = await bcrypt.hash(this.password, 12);
        this.updatedAt = Date.now();
        next();
    } catch (error) {
        next(error);
    }
});

// Instance methods
adminSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

adminSchema.methods.incLoginAttempts = function() {
    // Max 5 attempts before lock
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        this.lockUntil = Date.now() + 2 * 60 * 60 * 1000; // Lock for 2 hours
    }
    this.loginAttempts += 1;
    return this.save();
};

adminSchema.methods.resetLoginAttempts = function() {
    this.loginAttempts = 0;
    this.lockUntil = undefined;
    this.lastLogin = Date.now();
    return this.save();
};

adminSchema.methods.addActivityLog = function(action, targetType = null, targetId = null, details = '', ipAddress = '') {
    this.activityLogs.push({
        action,
        targetType,
        targetId,
        details,
        ipAddress,
        timestamp: new Date()
    });
    return this.save();
};

// Static methods
adminSchema.statics.findByUsername = function(username) {
    return this.findOne({ username, isActive: true });
};

adminSchema.statics.findByEmail = function(email) {
    return this.findOne({ email, isActive: true });
};

module.exports = mongoose.model('Admin', adminSchema);
