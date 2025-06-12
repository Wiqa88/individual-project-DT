// FIXED user-data-manager.js - Complete replacement for proper user isolation
// This ensures each user has completely separate data

class UserDataManager {
    constructor() {
        this.currentUser = null;
        this.userDataPrefix = 'user_data_';
        this.init();
    }

    init() {
        // Wait for auth guard to initialize
        if (window.authGuard && window.authGuard.getCurrentUser()) {
            this.currentUser = window.authGuard.getCurrentUser();
            this.setupUserStorage();
        } else {
            // Wait for auth guard to load
            setTimeout(() => this.init(), 100);
        }
    }

    setupUserStorage() {
        if (!this.currentUser) return;

        console.log(`🗂️ Setting up user-specific storage for: ${this.currentUser.email}`);

        // Clear any existing global data when switching users
        this.clearGlobalStorageForUserSwitch();

        // Load user-specific data
        this.loadUserSpecificData();

        // Override global storage functions
        this.overrideGlobalStorageFunctions();

        console.log(`✅ User storage setup complete for ${this.currentUser.email}`);
    }

    getUserStorageKey(dataType) {
        if (!this.currentUser) return dataType;
        // Create user-specific key using user email hash
        const userId = this.currentUser.id || this.currentUser.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `${this.userDataPrefix}${userId}_${dataType}`;
    }

    // CRITICAL: Clear global storage when switching users
    clearGlobalStorageForUserSwitch() {
        const globalKeys = ['tasks', 'calendar-events', 'habits', 'custom-lists'];
        globalKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('🧹 Cleared global storage for user switch');
    }

    // Load user-specific data into global localStorage keys
    loadUserSpecificData() {
        const dataTypes = ['tasks', 'calendar-events', 'habits', 'custom-lists'];

        dataTypes.forEach(dataType => {
            const userKey = this.getUserStorageKey(dataType);
            const userData = localStorage.getItem(userKey);

            if (userData) {
                // Load user data into global key
                localStorage.setItem(dataType, userData);
                console.log(`📂 Loaded ${dataType} for ${this.currentUser.email}`);
            } else {
                // Initialize with default data
                this.initializeDefaultData(dataType);
            }
        });
    }

    initializeDefaultData(dataType) {
        const defaults = {
            'tasks': [],
            'calendar-events': [],
            'habits': [],
            'custom-lists': ['Personal', 'Work', 'Shopping']
        };

        const defaultData = JSON.stringify(defaults[dataType] || []);
        localStorage.setItem(dataType, defaultData);

        // Also save to user-specific storage
        const userKey = this.getUserStorageKey(dataType);
        localStorage.setItem(userKey, defaultData);

        console.log(`📝 Initialized default ${dataType} for new user`);
    }

    // Override global storage functions to automatically save to user-specific storage
    overrideGlobalStorageFunctions() {
        if (!this.currentUser) return;

        const originalSetItem = localStorage.setItem;
        const self = this;

        // Override localStorage.setItem to automatically create user-specific backups
        localStorage.setItem = function(key, value) {
            // Call original setItem
            originalSetItem.call(this, key, value);

            // If it's a data type we manage, also save to user-specific storage
            const managedKeys = ['tasks', 'calendar-events', 'habits', 'custom-lists'];
            if (managedKeys.includes(key) && self.currentUser) {
                const userKey = self.getUserStorageKey(key);
                originalSetItem.call(this, userKey, value);
                console.log(`💾 Auto-saved ${key} to user-specific storage for ${self.currentUser.email}`);
            }
        };

        console.log('🔄 Global storage functions overridden');
    }

    // Method to switch user context (called when user logs in)
    switchUser(newUser) {
        if (!newUser) return false;

        console.log(`🔄 Switching from ${this.currentUser?.email || 'none'} to ${newUser.email}`);

        // Save current user's data before switching
        if (this.currentUser) {
            this.saveCurrentUserData();
        }

        // Update current user
        this.currentUser = newUser;

        // Set up storage for new user
        this.setupUserStorage();

        return true;
    }

    // Save current user's data to their specific storage
    saveCurrentUserData() {
        if (!this.currentUser) return;

        const dataTypes = ['tasks', 'calendar-events', 'habits', 'custom-lists'];

        dataTypes.forEach(dataType => {
            const globalData = localStorage.getItem(dataType);
            if (globalData) {
                const userKey = this.getUserStorageKey(dataType);
                localStorage.setItem(userKey, globalData);
            }
        });

        console.log(`💾 Saved data for ${this.currentUser.email}`);
    }

    // Get user-specific data
    getUserData(dataType) {
        if (!this.currentUser) return null;

        const userKey = this.getUserStorageKey(dataType);
        const data = localStorage.getItem(userKey);

        try {
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error parsing user data for ${dataType}:`, error);
            return null;
        }
    }

    // Set user-specific data
    setUserData(dataType, value) {
        if (!this.currentUser) return false;

        const userKey = this.getUserStorageKey(dataType);

        try {
            localStorage.setItem(userKey, JSON.stringify(value));
            // Also update global storage for current session
            localStorage.setItem(dataType, JSON.stringify(value));
            console.log(`💾 Saved ${dataType} for ${this.currentUser.email}`);
            return true;
        } catch (error) {
            console.error(`Error saving user data for ${dataType}:`, error);
            return false;
        }
    }

    // Clear all data for current user
    clearUserData() {
        if (!this.currentUser) return false;

        const dataTypes = ['tasks', 'calendar-events', 'habits', 'custom-lists'];

        dataTypes.forEach(dataType => {
            const userKey = this.getUserStorageKey(dataType);
            localStorage.removeItem(userKey);
            localStorage.removeItem(dataType); // Also clear global
        });

        console.log(`🗑️ Cleared all data for ${this.currentUser.email}`);
        return true;
    }

    // Get storage statistics for current user
    getStorageStats() {
        if (!this.currentUser) return null;

        const stats = {
            user: this.currentUser.email,
            data: {}
        };

        const dataTypes = ['tasks', 'calendar-events', 'habits', 'custom-lists'];

        dataTypes.forEach(dataType => {
            const data = this.getUserData(dataType);
            stats.data[dataType] = {
                count: Array.isArray(data) ? data.length : (data ? 1 : 0),
                size: JSON.stringify(data || []).length
            };
        });

        return stats;
    }

    // Export user data
    exportUserData() {
        if (!this.currentUser) return null;

        const exportData = {
            user: {
                name: this.currentUser.name,
                email: this.currentUser.email,
                id: this.currentUser.id
            },
            data: {},
            exportDate: new Date().toISOString()
        };

        const dataTypes = ['tasks', 'calendar-events', 'habits', 'custom-lists'];

        dataTypes.forEach(dataType => {
            exportData.data[dataType] = this.getUserData(dataType) || [];
        });

        return exportData;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.userDataManager = new UserDataManager();
    console.log('🗂️ User Data Manager initialized');
});

// CRITICAL: Update auth guard to use user data manager
// Add this to your auth-guard.js or create this as an additional script

function enhanceAuthGuardWithUserData() {
    if (!window.authGuard || !window.userDataManager) {
        setTimeout(enhanceAuthGuardWithUserData, 100);
        return;
    }

    // Override the checkAuthState method to include user data switching
    const originalCheckAuthState = window.authGuard.checkAuthState.bind(window.authGuard);

    window.authGuard.checkAuthState = function() {
        const result = originalCheckAuthState();

        if (result && this.currentUser) {
            // Switch user data context
            window.userDataManager.switchUser(this.currentUser);

            // Trigger reload of tasks and other components
            setTimeout(() => {
                if (window.loadTasks) {
                    window.loadTasks();
                }
                if (window.loadLists) {
                    window.loadLists();
                }
                console.log(`✅ User data context switched to ${this.currentUser.email}`);
            }, 100);
        }

        return result;
    };

    // Override the logout method to clear user data
    const originalLogout = window.authGuard.logout.bind(window.authGuard);

    window.authGuard.logout = function(message) {
        // Save current user data before logout
        if (window.userDataManager && this.currentUser) {
            window.userDataManager.saveCurrentUserData();
            window.userDataManager.clearGlobalStorageForUserSwitch();
        }

        return originalLogout(message);
    };

    console.log('🔒 Auth Guard enhanced with user data management');
}

// Initialize the enhancement
setTimeout(enhanceAuthGuardWithUserData, 500);

// CRITICAL: Override todo.js functions to use user-specific storage
function enhanceToDoWithUserData() {
    if (!window.userDataManager) {
        setTimeout(enhanceToDoWithUserData, 100);
        return;
    }

    // Override saveTasks function if it exists
    if (typeof window.saveTasks === 'function') {
        window.originalSaveTasks = window.saveTasks;
        window.saveTasks = function() {
            if (window.tasks && window.userDataManager.currentUser) {
                window.userDataManager.setUserData('tasks', window.tasks);
                console.log(`💾 Saved ${window.tasks.length} tasks for ${window.userDataManager.currentUser.email}`);
            }
        };
    }

    // Override loadTasks function if it exists
    if (typeof window.loadTasks === 'function') {
        window.originalLoadTasks = window.loadTasks;
        window.loadTasks = function() {
            if (window.userDataManager.currentUser) {
                const userData = window.userDataManager.getUserData('tasks');
                window.tasks = userData || [];
                console.log(`📂 Loaded ${window.tasks.length} tasks for ${window.userDataManager.currentUser.email}`);

                if (typeof window.renderTasks === 'function') {
                    window.renderTasks();
                }
            }
        };
    }

    // Override loadLists function if it exists
    if (typeof window.loadLists === 'function') {
        window.originalLoadLists = window.loadLists;
        window.loadLists = function() {
            if (window.userDataManager.currentUser) {
                const userData = window.userDataManager.getUserData('custom-lists');
                window.lists = userData || ['Personal', 'Work', 'Shopping'];
                console.log(`📂 Loaded ${window.lists.length} lists for ${window.userDataManager.currentUser.email}`);

                if (typeof window.renderLists === 'function') {
                    window.renderLists();
                }
                if (typeof window.updateListDropdown === 'function') {
                    window.updateListDropdown();
                }
            }
        };
    }

    console.log('📝 Todo functions enhanced with user data management');
}

// Initialize todo enhancement
setTimeout(enhanceToDoWithUserData, 1000);

console.log('🗂️ User-specific storage system loaded');

// TESTING FUNCTIONS (remove in production)
window.testUserData = function() {
    if (!window.userDataManager || !window.userDataManager.currentUser) {
        console.log('❌ No user logged in');
        return;
    }

    const stats = window.userDataManager.getStorageStats();
    console.log('📊 User Data Statistics:', stats);

    // Test data isolation
    const taskData = window.userDataManager.getUserData('tasks');
    console.log(`📋 User has ${taskData ? taskData.length : 0} tasks`);
};

window.clearCurrentUserData = function() {
    if (confirm('Clear all data for current user? This cannot be undone!')) {
        window.userDataManager.clearUserData();
        location.reload();
    }
};