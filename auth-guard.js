// ENHANCED auth-guard.js - Complete replacement with user data isolation
// This ensures proper user authentication and data separation

class AuthGuard {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.checkAuthState();
        this.setupSessionManagement();
        this.setupUserDisplay();
    }

    checkAuthState() {
        const isAuthenticated = sessionStorage.getItem('isAuthenticated');
        const currentUser = sessionStorage.getItem('currentUser');
        const loginTime = sessionStorage.getItem('loginTime');

        if (!isAuthenticated || !currentUser) {
            this.redirectToLogin('Please sign in to continue');
            return false;
        }

        // Check session expiry (24 hours)
        if (loginTime) {
            const loginDate = new Date(loginTime);
            const now = new Date();
            const hoursSinceLogin = (now - loginDate) / (1000 * 60 * 60);

            if (hoursSinceLogin > 24) {
                this.logout('Session expired. Please sign in again.');
                return false;
            }
        }

        try {
            this.currentUser = JSON.parse(currentUser);
            this.isAuthenticated = true;
            console.log(`👤 User authenticated: ${this.currentUser.name} (${this.currentUser.email})`);

            // CRITICAL: Initialize user data context immediately
            this.initializeUserDataContext();
            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            this.redirectToLogin('Authentication error. Please sign in again.');
            return false;
        }
    }

    // CRITICAL: Initialize user-specific data context
    initializeUserDataContext() {
        console.log(`🔄 Initializing data context for: ${this.currentUser.email}`);

        // Wait for user data manager and initialize
        const initUserData = () => {
            if (window.userDataManager) {
                window.userDataManager.switchUser(this.currentUser);
                console.log(`✅ User data context initialized for ${this.currentUser.email}`);

                // Show welcome message
                setTimeout(() => {
                    this.showNotification(`Welcome back, ${this.currentUser.name}!`, 'success');
                }, 500);
            } else {
                setTimeout(initUserData, 100);
            }
        };

        setTimeout(initUserData, 100);
    }

    setupSessionManagement() {
        // Update last activity time
        this.updateLastActivity();

        // Track user activity
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            document.addEventListener(event, () => this.updateLastActivity(), true);
        });

        // Check for session expiry every 5 minutes
        setInterval(() => this.checkSessionExpiry(), 5 * 60 * 1000);

        // Listen for logout from another tab
        window.addEventListener('storage', (e) => {
            if (e.key === 'userLoggedOut') {
                this.logout('Logged out from another tab');
            }
        });
    }

    updateLastActivity() {
        sessionStorage.setItem('lastActivity', new Date().toISOString());
    }

    checkSessionExpiry() {
        const lastActivity = sessionStorage.getItem('lastActivity');
        if (!lastActivity) return;

        const lastActivityDate = new Date(lastActivity);
        const now = new Date();
        const minutesSinceActivity = (now - lastActivityDate) / (1000 * 60);

        // Auto-logout after 30 minutes of inactivity
        if (minutesSinceActivity > 30) {
            this.logout('Session expired due to inactivity');
        }
    }

    setupUserDisplay() {
        if (!this.currentUser) return;

        // Update user name displays
        const userNameElements = document.querySelectorAll('[data-user-name]');
        userNameElements.forEach(el => {
            el.textContent = this.currentUser.name;
        });

        // Update user email displays
        const userEmailElements = document.querySelectorAll('[data-user-email]');
        userEmailElements.forEach(el => {
            el.textContent = this.currentUser.email;
        });

        // Update user initials
        const userInitialElements = document.querySelectorAll('[data-user-initials]');
        userInitialElements.forEach(el => {
            const initials = this.currentUser.name
                .split(' ')
                .map(name => name.charAt(0))
                .join('')
                .toUpperCase()
                .slice(0, 2);
            el.textContent = initials;
        });

        console.log(`✅ User display updated for ${this.currentUser.name}`);
    }

    redirectToLogin(message = 'Please sign in to continue') {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        this.showNotification(message, 'warning');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    logout(message = 'Logged out successfully') {
        if (!message.includes('expired') && !message.includes('another tab')) {
            if (!confirm('Are you sure you want to sign out?')) {
                return;
            }
        }

        console.log(`👋 Logging out ${this.currentUser?.email || 'user'}...`);

        // CRITICAL: Save current user data before logout
        if (window.userDataManager && this.currentUser) {
            window.userDataManager.saveCurrentUserData();
            console.log('💾 User data saved before logout');
        }

        // Clear session data
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('loginTime');
        sessionStorage.removeItem('lastActivity');
        sessionStorage.removeItem('redirectAfterLogin');

        // CRITICAL: Clear current user's data from global storage
        if (window.userDataManager) {
            window.userDataManager.clearGlobalStorageForUserSwitch();
            console.log('🧹 Global storage cleared for logout');
        }

        // Signal logout to other tabs
        localStorage.setItem('userLoggedOut', Date.now().toString());
        setTimeout(() => localStorage.removeItem('userLoggedOut'), 1000);

        this.currentUser = null;
        this.isAuthenticated = false;

        this.showNotification(message, 'success');

        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1001;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Export user data
    exportData() {
        if (!this.currentUser) return;

        try {
            let userData;

            if (window.userDataManager) {
                userData = window.userDataManager.exportUserData();
            } else {
                // Fallback export
                userData = {
                    profile: {
                        name: this.currentUser.name,
                        email: this.currentUser.email,
                        createdAt: this.currentUser.createdAt
                    },
                    tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
                    events: JSON.parse(localStorage.getItem('calendar-events') || '[]'),
                    habits: JSON.parse(localStorage.getItem('habits') || '[]'),
                    lists: JSON.parse(localStorage.getItem('custom-lists') || '[]'),
                    exportDate: new Date().toISOString(),
                    version: '2.0'
                };
            }

            const dataStr = JSON.stringify(userData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${this.currentUser.name.replace(/\s+/g, '-')}-data-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            this.showNotification('Your data exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Failed to export data', 'error');
        }
    }

    // Utility methods
    getCurrentUser() {
        return this.currentUser;
    }

    isUserAuthenticated() {
        return this.isAuthenticated;
    }

    // CRITICAL: Method to handle user switching (when different user logs in)
    switchUser(newUser) {
        if (this.currentUser && this.currentUser.email !== newUser.email) {
            console.log(`🔄 Switching user from ${this.currentUser.email} to ${newUser.email}`);

            // Save current user's data
            if (window.userDataManager) {
                window.userDataManager.saveCurrentUserData();
            }
        }

        this.currentUser = newUser;
        this.isAuthenticated = true;

        // Update session storage
        sessionStorage.setItem('currentUser', JSON.stringify(newUser));
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('loginTime', new Date().toISOString());

        // Initialize user data context
        this.initializeUserDataContext();
        this.setupUserDisplay();

        console.log(`✅ User switched to ${newUser.email}`);
    }
}

// Initialize auth guard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authGuard = new AuthGuard();
    console.log('🛡️ Auth Guard initialized');
});

// Handle redirect after login
window.addEventListener('load', () => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath && redirectPath !== window.location.pathname) {
        sessionStorage.removeItem('redirectAfterLogin');
        if (window.authGuard && window.authGuard.getCurrentUser()) {
            setTimeout(() => {
                window.authGuard.showNotification(`Welcome back! Your personal data is ready.`, 'success');
            }, 500);
        }
    }
});

// Listen for user login events from authentication page
window.addEventListener('message', (event) => {
    if (event.data.type === 'USER_LOGGED_IN' && event.data.user) {
        if (window.authGuard) {
            window.authGuard.switchUser(event.data.user);
        }
    }
});

// CRITICAL: Override any existing auth functions to ensure data isolation
window.addEventListener('load', () => {
    // If there's an existing auth system, enhance it
    if (window.authSystem) {
        const originalHandleLogin = window.authSystem.handleLogin;

        if (originalHandleLogin) {
            window.authSystem.handleLogin = async function(e) {
                const result = await originalHandleLogin.call(this, e);

                // After successful login, ensure auth guard knows about the user
                if (this.currentUser && window.authGuard) {
                    window.authGuard.switchUser(this.currentUser);
                }

                return result;
            };
        }
    }
});

console.log('🛡️ Enhanced Auth Guard with User Data Integration loaded');

// Debug function to check current user and data
window.debugAuth = function() {
    console.log('=== AUTH DEBUG ===');
    console.log('Current User:', window.authGuard?.getCurrentUser());
    console.log('Is Authenticated:', window.authGuard?.isUserAuthenticated());
    console.log('Session Storage:', {
        isAuthenticated: sessionStorage.getItem('isAuthenticated'),
        currentUser: sessionStorage.getItem('currentUser'),
        loginTime: sessionStorage.getItem('loginTime')
    });

    if (window.userDataManager) {
        console.log('User Data Stats:', window.userDataManager.getStorageStats());
    }
};