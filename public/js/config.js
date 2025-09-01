/* ==========================================================================
   APPLICATION CONFIGURATION
   Centralized configuration for routes, API endpoints, and app settings
   ========================================================================== */

const AppConfig = {
    // Application Information
    app: {
        name: 'LinkedIn Automation Platform',
        version: '1.0.0',
        description: 'Intelligent automation for LinkedIn outreach and contact enrichment'
    },
    
    // API Configuration
    api: {
        baseUrl: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000',
        timeout: 10000,
        retryAttempts: 3,
        
        endpoints: {
            // Authentication
            auth: {
                clientLogin: '/auth/client/login',
                clientRegister: '/auth/client/register',
                adminLogin: '/auth/admin/login',
                logout: '/auth/logout',
                verify: '/auth/verify'
            },
            
            // Client operations
            client: {
                dashboard: (id) => `/client/${id}`,
                credentials: (id) => `/client/${id}/credentials`,
                upload: (id) => `/client/${id}/upload`,
                campaigns: (id) => `/client/${id}/campaigns`,
                activity: (id) => `/client/${id}/activity`,
                messages: (id) => `/client/${id}/send-message`,
                messagesContent: (id) => `/client/${id}/messages-content`
            },
            
            // Admin operations
            admin: {
                dashboard: '/admin',
                message: '/admin/message',
                clients: '/admin/clients',
                analytics: '/admin/analytics'
            }
        }
    },
    
    // Frontend Routes
    routes: {
        public: {
            home: '/',
            about: '/about',
            contact: '/contact'
        },
        
        auth: {
            clientLogin: '/auth/client-login',
            clientRegister: '/auth/client-register',
            adminLogin: '/auth/admin-login'
        },
        
        dashboard: {
            admin: '/admin',
            client: (id) => `/client/${id}`
        }
    },
    
    // UI Configuration
    ui: {
        themes: {
            client: {
                primary: '#8B5CF6',
                secondary: '#A855F7',
                gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)'
            },
            admin: {
                primary: '#FF6B6B',
                secondary: '#FF8E53',
                gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
            },
            register: {
                primary: '#10B981',
                secondary: '#059669',
                gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
            }
        },
        
        animations: {
            duration: {
                fast: '0.2s',
                normal: '0.3s',
                slow: '0.5s'
            },
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
        },
        
        breakpoints: {
            mobile: '768px',
            tablet: '1024px',
            desktop: '1200px'
        }
    },
    
    // Validation Rules
    validation: {
        password: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true
        },
        
        email: {
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        
        username: {
            minLength: 3,
            maxLength: 50,
            pattern: /^[a-zA-Z0-9_-]+$/
        }
    },
    
    // Feature Flags
    features: {
        enableParticleAnimation: true,
        enableTerminalAnimation: true,
        enableRealTimeNotifications: false,
        enableAdvancedAnalytics: false,
        enableFileUpload: true,
        enableEmailCampaigns: true
    },
    
    // Storage Keys
    storage: {
        authToken: 'authToken',
        clientId: 'clientId',
        adminId: 'adminId',
        userPreferences: 'userPreferences',
        lastRoute: 'lastRoute'
    },
    
    // Messages and Text
    messages: {
        auth: {
            loginSuccess: 'Login successful! Redirecting...',
            loginError: 'Invalid credentials. Please try again.',
            registerSuccess: 'Account created successfully! Please log in.',
            registerError: 'Registration failed. Please check your information.',
            logoutSuccess: 'You have been logged out successfully.',
            sessionExpired: 'Your session has expired. Please log in again.'
        },
        
        validation: {
            emailRequired: 'Email address is required',
            emailInvalid: 'Please enter a valid email address',
            passwordRequired: 'Password is required',
            passwordWeak: 'Password must contain uppercase, lowercase, number, and special character',
            passwordMismatch: 'Passwords do not match',
            nameRequired: 'Full name is required'
        },
        
        general: {
            loading: 'Loading...',
            saving: 'Saving...',
            error: 'An error occurred. Please try again.',
            success: 'Operation completed successfully!',
            confirmDelete: 'Are you sure you want to delete this item?',
            unsavedChanges: 'You have unsaved changes. Are you sure you want to leave?'
        }
    },
    
    // Platform Configuration
    platforms: {
        supported: [
            { 
                id: 'linkedin', 
                name: 'LinkedIn', 
                icon: '💼',
                color: '#0077B5'
            },
            { 
                id: 'twitter', 
                name: 'Twitter', 
                icon: '🐦',
                color: '#1DA1F2'
            },
            { 
                id: 'email', 
                name: 'Email', 
                icon: '📧',
                color: '#EA4335'
            },
            { 
                id: 'facebook', 
                name: 'Facebook', 
                icon: '📘',
                color: '#1877F2'
            },
            { 
                id: 'instagram', 
                name: 'Instagram', 
                icon: '📷',
                color: '#E4405F'
            }
        ]
    },
    
    // Development Configuration
    dev: {
        enableDebugMode: process.env.NODE_ENV === 'development',
        enableMockData: false,
        enablePerformanceLogging: true,
        logLevel: 'info' // error, warn, info, debug
    }
};

// Utility functions for configuration access
const ConfigUtils = {
    // Get nested configuration value
    get(path, defaultValue = null) {
        return path.split('.').reduce((obj, key) => {
            return obj && obj[key] !== undefined ? obj[key] : defaultValue;
        }, AppConfig);
    },
    
    // Get API endpoint with base URL
    getApiUrl(endpoint) {
        const baseUrl = this.get('api.baseUrl');
        return `${baseUrl}${endpoint}`;
    },
    
    // Get theme configuration
    getTheme(themeName) {
        return this.get(`ui.themes.${themeName}`, this.get('ui.themes.client'));
    },
    
    // Check if feature is enabled
    isFeatureEnabled(featureName) {
        return this.get(`features.${featureName}`, false);
    },
    
    // Get validation rule
    getValidationRule(rulePath) {
        return this.get(`validation.${rulePath}`);
    },
    
    // Get message text
    getMessage(messagePath) {
        return this.get(`messages.${messagePath}`, 'Message not found');
    },
    
    // Get storage key
    getStorageKey(keyName) {
        return this.get(`storage.${keyName}`, keyName);
    }
};

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AppConfig, ConfigUtils };
} else {
    window.AppConfig = AppConfig;
    window.ConfigUtils = ConfigUtils;
}
