/* ==========================================================================
   AUTH JAVASCRIPT MODULE
   Modular JavaScript for authentication pages
   ========================================================================== */

class AuthManager {
    constructor() {
        this.apiEndpoints = {
            clientLogin: '/auth/client/login',
            clientRegister: '/auth/client/register',
            adminLogin: '/auth/admin/login',
            logout: '/auth/logout',
            verify: '/auth/verify'
        };
        
        this.init();
    }

    init() {
        this.setupFormHandlers();
        this.setupValidation();
    }

    setupFormHandlers() {
        // Handle all auth forms
        const authForms = document.querySelectorAll('#login-form, #register-form, #forgot-password-form, #reset-password-form');
        authForms.forEach(form => {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        });
    }

    setupValidation() {
        // Real-time validation
        const inputs = document.querySelectorAll('.form-group input');
        inputs.forEach(input => {
            input.addEventListener('blur', (e) => this.validateField(e.target));
            input.addEventListener('input', (e) => this.clearFieldError(e.target));
        });
    }

    async handleFormSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const formType = this.getFormType(form);
        const submitButton = form.querySelector('button[type="submit"]');
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');
        
        // Validate form
        if (!this.validateForm(form)) {
            return;
        }
        
        // Prepare data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        try {
            // Set loading state
            this.setLoadingState(submitButton, true);
            this.hideMessages();
            
            // Make API call
            const result = await this.makeAuthRequest(formType, data);
            
            if (result.success) {
                this.handleSuccess(result, formType, successMessage, submitButton);
            } else {
                this.showError(errorMessage, result.error || 'Authentication failed');
            }
            
        } catch (error) {
            console.error(`${formType} error:`, error);
            this.showError(errorMessage, 'Authentication failed. Please try again.');
        } finally {
            this.setLoadingState(submitButton, false);
        }
    }

    getFormType(form) {
        const formId = form.id;
        const currentPath = window.location.pathname;
        
        if (formId === 'register-form') return 'register';
        if (formId === 'forgot-password-form') return 'forgot-password';
        if (formId === 'reset-password-form') return 'reset-password';
        if (currentPath.includes('admin')) return 'admin';
        return 'client';
    }

    async makeAuthRequest(formType, data) {
        let endpoint;
        
        switch (formType) {
            case 'client':
                endpoint = this.apiEndpoints.clientLogin;
                break;
            case 'admin':
                endpoint = this.apiEndpoints.adminLogin;
                break;
            case 'register':
                endpoint = this.apiEndpoints.clientRegister;
                break;
            case 'forgot-password':
                endpoint = '/auth/forgot-password';
                break;
            case 'reset-password':
                const token = document.getElementById('token').value;
                endpoint = `/auth/reset-password/${token}`;
                break;
            default:
                throw new Error('Unknown form type');
        }
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        return await response.json();
    }

    handleSuccess(result, formType, successMessage, submitButton) {
        if (formType === 'forgot-password') {
            this.showSuccess(successMessage, result.message);
            return;
        }

        if (formType === 'reset-password') {
            this.showSuccess(successMessage, result.message + ' Redirecting to login...');
            setTimeout(() => {
                window.location.href = '/auth/client-login';
            }, 2000);
            return;
        }

        // Store authentication data
        localStorage.setItem('authToken', result.data.token);
        
        if (formType === 'admin') {
            localStorage.setItem('adminId', result.data.adminId || 'admin');
        } else {
            localStorage.setItem('clientId', result.data.clientId);
        }
        
        // Change button text to show success
        submitButton.textContent = 'Redirecting...';
        
        // Redirect after delay
        setTimeout(() => {
            const redirectUrl = formType === 'admin' ? '/admin' : `/client/${result.data.clientId}`;
            window.location.href = redirectUrl;
        }, 1500);
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('input[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        // Special validation for registration
        if (form.id === 'register-form') {
            const password = form.querySelector('#password');
            const confirmPassword = form.querySelector('#confirm-password');
            
            if (password && confirmPassword && password.value !== confirmPassword.value) {
                this.showFieldError(confirmPassword, 'Passwords do not match');
                isValid = false;
            }
        }
        
        return isValid;
    }

    validateField(field) {
        const value = field.value.trim();
        const type = field.type;
        const name = field.name;
        
        // Clear previous errors
        this.clearFieldError(field);
        
        // Required field validation
        if (field.required && !value) {
            this.showFieldError(field, 'This field is required');
            return false;
        }
        
        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Please enter a valid email address');
                return false;
            }
        }
        
        // Password validation
        if (name === 'password' && value) {
            if (value.length < 8) {
                this.showFieldError(field, 'Password must be at least 8 characters long');
                return false;
            }
            
            // Strong password check for registration
            if (document.getElementById('register-form')) {
                const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
                if (!strongPasswordRegex.test(value)) {
                    this.showFieldError(field, 'Password must contain uppercase, lowercase, number, and special character');
                    return false;
                }
            }
        }
        
        return true;
    }

    showFieldError(field, message) {
        const formGroup = field.closest('.form-group');
        this.clearFieldError(field);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            color: #ff4757;
            font-size: 0.8rem;
            margin-top: 0.5rem;
            display: block;
        `;
        
        formGroup.appendChild(errorDiv);
        field.style.borderBottomColor = '#ff4757';
    }

    clearFieldError(field) {
        const formGroup = field.closest('.form-group');
        const existingError = formGroup.querySelector('.field-error');
        if (existingError) {
            existingError.remove();
        }
        field.style.borderBottomColor = '';
    }

    setLoadingState(button, isLoading) {
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = 'Please wait...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || 'Submit';
        }
    }

    showError(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    showSuccess(element, message) {
        element.textContent = message;
        element.style.display = 'block';
    }

    hideMessages() {
        const messages = document.querySelectorAll('.error-message, .success-message');
        messages.forEach(msg => msg.style.display = 'none');
    }

    // Utility method to check if user is authenticated
    static isAuthenticated() {
        return !!localStorage.getItem('authToken');
    }

    // Utility method to get current user data
    static getCurrentUser() {
        const token = localStorage.getItem('authToken');
        const clientId = localStorage.getItem('clientId');
        const adminId = localStorage.getItem('adminId');
        
        return {
            token,
            clientId,
            adminId,
            isAdmin: !!adminId,
            isClient: !!clientId
        };
    }

    // Logout method
    static logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('clientId');
        localStorage.removeItem('adminId');
        window.location.href = '/';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    new AuthManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
} else {
    window.AuthManager = AuthManager;
}
