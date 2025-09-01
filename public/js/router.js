/* ==========================================================================
   ROUTING UTILITIES MODULE
   Centralized route management and navigation helpers
   ========================================================================== */

class RouteManager {
    constructor() {
        this.routes = {
            // Public routes
            home: '/',
            
            // Authentication routes
            clientLogin: '/auth/client-login',
            clientRegister: '/auth/client-register',
            adminLogin: '/auth/admin-login',
            
            // API endpoints
            api: {
                clientLogin: '/auth/client/login',
                clientRegister: '/auth/client/register',
                adminLogin: '/auth/admin/login',
                logout: '/auth/logout',
                verify: '/auth/verify'
            },
            
            // Dashboard routes
            admin: '/admin',
            client: (clientId) => `/client/${clientId}`,
            
            // Client dashboard sections
            clientSections: {
                credentials: (clientId) => `/client/${clientId}#credentials`,
                upload: (clientId) => `/client/${clientId}#upload`,
                activity: (clientId) => `/client/${clientId}#activity`,
                messages: (clientId) => `/client/${clientId}#messages`
            }
        };
        
        this.init();
    }
    
    init() {
        // Handle navigation events
        this.setupNavigationHandlers();
        
        // Handle authentication redirects
        this.handleAuthRedirects();
    }
    
    setupNavigationHandlers() {
        // Handle back buttons and navigation
        window.addEventListener('popstate', (event) => {
            this.handlePopState(event);
        });
        
        // Handle programmatic navigation
        document.addEventListener('click', (event) => {
            if (event.target.matches('[data-route]')) {
                event.preventDefault();
                this.navigateTo(event.target.dataset.route);
            }
        });
    }
    
    navigateTo(route, data = {}) {
        // Handle different route types
        if (typeof route === 'function') {
            route = route(data.clientId || data.id);
        }
        
        // Add to history
        history.pushState(data, '', route);
        
        // Trigger navigation
        window.location.href = route;
    }
    
    redirect(route, data = {}) {
        if (typeof route === 'function') {
            route = route(data.clientId || data.id);
        }
        
        window.location.replace(route);
    }
    
    handleAuthRedirects() {
        const currentPath = window.location.pathname;
        const user = this.getCurrentUser();
        
        // Redirect authenticated users away from auth pages
        if (user.isAuthenticated && this.isAuthPage(currentPath)) {
            if (user.isAdmin) {
                this.redirect(this.routes.admin);
            } else if (user.clientId) {
                this.redirect(this.routes.client(user.clientId));
            }
        }
        
        // Redirect unauthenticated users from protected pages
        if (!user.isAuthenticated && this.isProtectedPage(currentPath)) {
            this.redirect(this.routes.clientLogin);
        }
    }
    
    isAuthPage(path) {
        const authPaths = [
            this.routes.clientLogin,
            this.routes.clientRegister,
            this.routes.adminLogin
        ];
        return authPaths.includes(path);
    }
    
    isProtectedPage(path) {
        return path.startsWith('/admin') || path.startsWith('/client');
    }
    
    getCurrentUser() {
        const token = localStorage.getItem('authToken');
        const clientId = localStorage.getItem('clientId');
        const adminId = localStorage.getItem('adminId');
        
        return {
            token,
            clientId,
            adminId,
            isAuthenticated: !!token,
            isAdmin: !!adminId,
            isClient: !!clientId
        };
    }
    
    handlePopState(event) {
        // Handle browser back/forward navigation
        const path = window.location.pathname;
        console.log('Navigated to:', path);
        
        // Could add additional handling here
    }
    
    // Utility methods for common navigation patterns
    goHome() {
        this.navigateTo(this.routes.home);
    }
    
    goToClientDashboard(clientId) {
        this.navigateTo(this.routes.client(clientId));
    }
    
    goToAdminDashboard() {
        this.navigateTo(this.routes.admin);
    }
    
    goToLogin(type = 'client') {
        const route = type === 'admin' ? this.routes.adminLogin : this.routes.clientLogin;
        this.navigateTo(route);
    }
    
    logout() {
        // Clear authentication data
        localStorage.removeItem('authToken');
        localStorage.removeItem('clientId');
        localStorage.removeItem('adminId');
        
        // Make logout API call
        fetch(this.routes.api.logout, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }).catch(console.error);
        
        // Redirect to home
        this.redirect(this.routes.home);
    }
    
    // Get route with parameters
    getRoute(routeName, params = {}) {
        const route = this.routes[routeName];
        
        if (typeof route === 'function') {
            return route(params.clientId || params.id);
        }
        
        return route;
    }
    
    // Check if current page matches route
    isCurrentRoute(routeName, params = {}) {
        const expectedRoute = this.getRoute(routeName, params);
        return window.location.pathname === expectedRoute;
    }
}

// Navigation helpers for easy access
class NavigationHelpers {
    static showLoading(element) {
        if (element) {
            element.innerHTML = '<div class="loading-spinner">Loading...</div>';
        }
    }
    
    static hideLoading(element) {
        if (element) {
            const loader = element.querySelector('.loading-spinner');
            if (loader) loader.remove();
        }
    }
    
    static showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // Set background color based on type
        const colors = {
            success: '#10B981',
            error: '#EF4444',
            warning: '#F59E0B',
            info: '#3B82F6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.style.opacity = '1', 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    static confirmNavigation(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }
}

// Initialize route manager globally
const routeManager = new RouteManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RouteManager, NavigationHelpers };
} else {
    window.RouteManager = RouteManager;
    window.NavigationHelpers = NavigationHelpers;
    window.routeManager = routeManager;
}
