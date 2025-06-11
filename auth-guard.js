// auth-guard.js - Authentication Guard for Protected Pages
// Add this script to all your protected pages (todo.html, Cal.html, Matrix.html, Habits.html, Settings.html)

class AuthGuard {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        this.checkAuthState();
        this.setupSessionManagement();
        this.setupLogoutHandlers();
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
            console.log(`👤 User authenticated: ${this.currentUser.name}`);
            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            this.redirectToLogin('Authentication error. Please sign in again.');
            return false;
        }
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

        // Listen for storage changes (logout from another tab)
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

    setupLogoutHandlers() {
        // Add logout functionality to existing elements
        const logoutButtons = document.querySelectorAll('[data-logout]');
        logoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });

        // Handle browser close/refresh
        window.addEventListener('beforeunload', () => {
            // Update last seen time
            sessionStorage.setItem('lastSeen', new Date().toISOString());
        });
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

        // Add user menu if it doesn't exist
        this.addUserMenu();
    }

    addUserMenu() {
        // Check if user menu already exists
        if (document.getElementById('userMenu')) return;

        // Find the settings icon or suitable location
        const settingsIcon = document.querySelector('.settings-li a');
        if (!settingsIcon) return;

        // Create user menu
        const userMenu = document.createElement('div');
        userMenu.id = 'userMenu';
        userMenu.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            padding: 10px;
            z-index: 1000;
            min-width: 200px;
            border: 1px solid #e5e7eb;
        `;

        userMenu.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid #e5e7eb; margin-bottom: 10px;">
                <div style="font-weight: bold; color: #1e3a8a;">${this.currentUser.name}</div>
                <div style="font-size: 12px; color: #6b7280;">${this.currentUser.email}</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 5px;">
                <button onclick="authGuard.exportData()" style="padding: 8px 12px; text-align: left; border: none; background: none; cursor: pointer; border-radius: 6px; transition: background 0.2s;" onmouseover="this.style.background='#f3f4f6'" onmouseout="this.style.background='none'">
                    <i class="fas fa-download" style="margin-right: 8px; color: #6b7280;"></i>
                    Export Data
                </button>
                <button onclick="authGuard.logout()" style="padding: 8px 12px; text-align: left; border: none; background: none; cursor: pointer; border-radius: 6px; color: #dc2626; transition: background 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='none'">
                    <i class="fas fa-sign-out-alt" style="margin-right: 8px;"></i>
                    Sign Out
                </button>
            </div>
        `;

        document.body.appendChild(userMenu);

        // Toggle menu visibility
        let menuVisible = false;
        settingsIcon.addEventListener('click', (e) => {
            e.preventDefault();
            menuVisible = !menuVisible;
            userMenu.style.display = menuVisible ? 'block' : 'none';
        });

        // Hide menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!userMenu.contains(e.target) && !settingsIcon.contains(e.target)) {
                menuVisible = false;
                userMenu.style.display = 'none';
            }
        });

        // Initially hide the menu
        userMenu.style.display = 'none';
    }

    redirectToLogin(message = 'Please sign in to continue') {
        // Store the current page to redirect back after login
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);

        // Show notification if possible
        if (typeof this.showNotification === 'function') {
            this.showNotification(message, 'warning');
        } else {
            alert(message);
        }

        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    logout(message = 'Logged out successfully') {
        // Confirm logout
        if (!message.includes('expired') && !message.includes('another tab')) {
            if (!confirm('Are you sure you want to sign out?')) {
                return;
            }
        }

        // Clear session data
        sessionStorage.removeItem('currentUser');
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('loginTime');
        sessionStorage.removeItem('lastActivity');
        sessionStorage.removeItem('redirectAfterLogin');

        // Signal logout to other tabs
        localStorage.setItem('userLoggedOut', Date.now().toString());
        setTimeout(() => localStorage.removeItem('userLoggedOut'), 1000);

        // Show notification
        this.showNotification(message, 'success');

        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }

    showNotification(message, type = 'info') {
        // Create notification if it doesn't exist
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

        // Show notification
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(-50%) translateY(0)';
        }, 100);

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(-50%) translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    exportData() {
        if (!this.currentUser) return;

        try {
            const userData = {
                profile: {
                    name: this.currentUser.name,
                    email: this.currentUser.email,
                    createdAt: this.currentUser.createdAt,
                    preferences: this.currentUser.preferences
                },
                tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
                events: JSON.parse(localStorage.getItem('calendar-events') || '[]'),
                habits: JSON.parse(localStorage.getItem('habits') || '[]'),
                lists: JSON.parse(localStorage.getItem('custom-lists') || '[]'),
                settings: JSON.parse(localStorage.getItem('app-settings') || '{}'),
                exportDate: new Date().toISOString(),
                version: '1.0'
            };

            const dataStr = JSON.stringify(userData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `task-manager-backup-${this.currentUser.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);

            this.showNotification('Data exported successfully!', 'success');
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

    updateUserSession(updates) {
        if (!this.currentUser) return false;

        this.currentUser = { ...this.currentUser, ...updates };
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.setupUserDisplay();
        return true;
    }

    // Check if user has specific permissions (for future use)
    hasPermission(permission) {
        if (!this.currentUser) return false;

        // For now, all authenticated users have all permissions
        // This can be expanded for role-based access control
        return true;
    }

    // Get user preferences
    getUserPreference(key, defaultValue = null) {
        if (!this.currentUser || !this.currentUser.preferences) return defaultValue;
        return this.currentUser.preferences[key] || defaultValue;
    }

    // Set user preference
    setUserPreference(key, value) {
        if (!this.currentUser) return false;

        if (!this.currentUser.preferences) {
            this.currentUser.preferences = {};
        }

        this.currentUser.preferences[key] = value;
        sessionStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        // Also update in localStorage users array if available
        try {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            if (userIndex !== -1) {
                users[userIndex].preferences = this.currentUser.preferences;
                localStorage.setItem('users', JSON.stringify(users));
            }
        } catch (error) {
            console.error('Error updating user preferences:', error);
        }

        return true;
    }
}

// Initialize auth guard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authGuard = new AuthGuard();
});

// Handle redirect after login
window.addEventListener('load', () => {
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    if (redirectPath && redirectPath !== window.location.pathname) {
        sessionStorage.removeItem('redirectAfterLogin');
        // If user was redirected here after login, show welcome message
        if (window.authGuard && window.authGuard.getCurrentUser()) {
            setTimeout(() => {
                window.authGuard.showNotification(`Welcome back, ${window.authGuard.getCurrentUser().name}!`, 'success');
            }, 500);
        }
    }
});

console.log('🛡️ Authentication Guard loaded');