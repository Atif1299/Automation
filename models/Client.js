const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const clientSchema = new mongoose.Schema({
    // Client Information
    clientId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    
    // Platform Credentials
    credentials: [{
        platform: {
            type: String,
            required: true,
            enum: ['account', 'linkedin', 'twitter', 'email', 'facebook', 'instagram']
        },
        username: {
            type: String,
            required: true,
            trim: true
        },
        password: {
            type: String,
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastTested: {
            type: Date
        },
        connectionStatus: {
            type: String,
            enum: ['pending', 'connected', 'failed', 'expired'],
            default: 'pending'
        }
    }],
    
    // Campaign Configuration
    campaigns: [{
        name: {
            type: String,
            required: true,
            trim: true
        },
        automationType: {
            type: String,
            required: true,
            enum: ['enrichment', 'outreach', 'scraping']
        },
        instructions: {
            type: String,
            trim: true
        },
        status: {
            type: String,
            enum: ['draft', 'active', 'paused', 'completed', 'failed'],
            default: 'draft'
        },
        createdAt: {
            type: Date,
            default: Date.now
        },
        lastRun: {
            type: Date
        }
    }],
    
    // File Uploads
    uploadedFiles: [{
        fileName: {
            type: String,
            required: true
        },
        originalName: {
            type: String,
            required: true
        },
        fileSize: {
            type: Number,
            required: true
        },
        fileType: {
            type: String,
            required: true
        },
        uploadDate: {
            type: Date,
            default: Date.now
        },
        processedRows: {
            type: Number,
            default: 0
        },
        validRows: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ['uploaded', 'processing', 'processed', 'failed', 'admin_sent'],
            default: 'uploaded'
        },
        // New fields for admin-sent files
        category: {
            type: String,
            enum: ['document', 'template', 'report', 'instruction', 'data', 'other'],
            default: 'other'
        },
        adminMessage: {
            type: String,
            default: ''
        },
        downloadPath: {
            type: String
        },
        source: {
            type: String,
            enum: ['client', 'admin'],
            default: 'client'
        }
    }],
    
    // Activity Logs
    activityLogs: [{
        type: {
            type: String,
            enum: ['info', 'success', 'warning', 'error'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        details: {
            type: String
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        // New fields for admin activities
        source: {
            type: String,
            enum: ['client', 'admin', 'system'],
            default: 'system'
        },
        fileInfo: {
            fileName: String,
            originalName: String,
            category: String,
            downloadPath: String
        }
    }],
    
    // Client Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended', 'pending_verification'],
        default: 'pending_verification'
    },
    
    // Subscription/Plan
    plan: {
        type: String,
        enum: ['basic', 'premium', 'enterprise'],
        default: 'basic'
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    
    // Authentication & Security
    lastLogin: {
        type: Date
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    
    // Subscription & Billing
    plan: {
        type: String,
        enum: ['free', 'basic', 'premium', 'enterprise'],
        default: 'free'
    },
    planExpiry: {
        type: Date
    },
    billingInfo: {
        customerId: String,
        subscriptionId: String,
        lastPayment: Date,
        nextPayment: Date
    }
}, {
    timestamps: true,
    versionKey: false
});

// Index for better query performance (only for fields that don't have unique: true)
clientSchema.index({ status: 1 });
clientSchema.index({ 'credentials.platform': 1 });

// Hash passwords before saving
clientSchema.pre('save', async function(next) {
    if (this.isModified('credentials')) {
        for (let cred of this.credentials) {
            // Only hash the main account password, not platform automation credentials
            if (cred.platform === 'account' && cred.password && !cred.password.startsWith('$2b$')) {
                console.log('🔒 Hashing account password for:', cred.username);
                cred.password = await bcrypt.hash(cred.password, 12);
                console.log('🔒 Password hashed successfully');
            }
            // For platform automation credentials (linkedin, twitter, etc.), keep passwords in plain text
            // These are needed for automation and are intentionally shared by clients
        }
    }
    this.updatedAt = Date.now();
    next();
});

// Instance method to add activity log
clientSchema.methods.addActivityLog = function(type, message, details = '') {
    this.activityLogs.push({
        type,
        message,
        details,
        timestamp: new Date()
    });
    return this.save();
};

// Static method to find client by ID
clientSchema.statics.findByClientId = function(clientId) {
    return this.findOne({ clientId });
};

module.exports = mongoose.model('Client', clientSchema);
