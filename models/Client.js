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
            enum: ['linkedin', 'twitter', 'email', 'facebook', 'instagram']
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
            enum: ['uploaded', 'processing', 'processed', 'failed'],
            default: 'uploaded'
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
        }
    }],
    
    // Client Status
    status: {
        type: String,
        enum: ['active', 'inactive', 'suspended'],
        default: 'active'
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
    lastLogin: {
        type: Date
    },
    updatedAt: {
        type: Date,
        default: Date.now
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
            if (cred.isModified('password') || cred.isNew) {
                cred.password = await bcrypt.hash(cred.password, 12);
            }
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
