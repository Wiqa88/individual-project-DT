// Enhanced Database System with Real-time Synchronization
console.log('🚀 Loading Enhanced Database System with Real-time Sync...');

window.taskDB = {
    db: null,
    isReady: false,
    eventListeners: new Set(),

    init: async function() {
        console.log('📊 Initializing TaskDB...');

        return new Promise((resolve, reject) => {
            const request = indexedDB.open("taskDB", 2);

            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                console.log('🔄 Database upgrade needed, creating object stores...');

                // Create tasks store
                if (!db.objectStoreNames.contains("tasks")) {
                    const taskStore = db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
                    console.log('✅ Tasks store created');
                }

                // Create events store
                if (!db.objectStoreNames.contains("events")) {
                    const eventStore = db.createObjectStore("events", { keyPath: "id", autoIncrement: true });
                    console.log('✅ Events store created');
                }

                // Create lists store
                if (!db.objectStoreNames.contains("lists")) {
                    const listStore = db.createObjectStore("lists", { keyPath: "id", autoIncrement: true });
                    console.log('✅ Lists store created');
                }

                // Create habits store
                if (!db.objectStoreNames.contains("habits")) {
                    const habitStore = db.createObjectStore("habits", { keyPath: "id", autoIncrement: true });
                    console.log('✅ Habits store created');
                }
            };

            request.onsuccess = function(event) {
                taskDB.db = event.target.result;
                taskDB.isReady = true;
                console.log('✅ Database initialized successfully');
                resolve();
            };

            request.onerror = function(event) {
                console.error('❌ Database failed to open:', event.target.error);
                reject("Database failed to open: " + event.target.error);
            };
        });
    },

    // Event system for real-time updates
    addEventListener: function(callback) {
        this.eventListeners.add(callback);
    },

    removeEventListener: function(callback) {
        this.eventListeners.delete(callback);
    },

    notifyChange: function(type, action, data) {
        console.log(`🔄 Broadcasting change: ${type} ${action}`, data);
        this.eventListeners.forEach(callback => {
            try {
                callback({ type, action, data });
            } catch (error) {
                console.error('Error in event listener:', error);
            }
        });
    },

    // === TASK OPERATIONS ===
    addTask: async function(task) {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("tasks", "readwrite");
        const store = tx.objectStore("tasks");

        return new Promise((resolve, reject) => {
            const taskToAdd = {
                ...task,
                createdAt: task.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const req = store.add(taskToAdd);

            req.onsuccess = () => {
                const newTask = { ...taskToAdd, id: req.result };
                console.log('✅ Task added to database with ID:', req.result);

                // Update localStorage backup
                this.updateLocalStorageBackup('tasks');

                // Notify listeners
                this.notifyChange('task', 'added', newTask);

                resolve(req.result);
            };
            req.onerror = () => {
                console.error('❌ Failed to add task:', req.error);
                reject(req.error);
            };
        });
    },

    getTasks: async function() {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("tasks", "readonly");
        const store = tx.objectStore("tasks");

        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => {
                console.log(`📋 Retrieved ${req.result.length} tasks from database`);
                resolve(req.result);
            };
            req.onerror = () => {
                console.error('❌ Failed to get tasks:', req.error);
                reject(req.error);
            };
        });
    },

    updateTask: async function(task) {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("tasks", "readwrite");
        const store = tx.objectStore("tasks");

        return new Promise((resolve, reject) => {
            const updatedTask = {
                ...task,
                updatedAt: new Date().toISOString()
            };

            const req = store.put(updatedTask);

            req.onsuccess = () => {
                console.log('✅ Task updated in database');

                // Update localStorage backup
                this.updateLocalStorageBackup('tasks');

                // Notify listeners
                this.notifyChange('task', 'updated', updatedTask);

                resolve(updatedTask);
            };
            req.onerror = () => {
                console.error('❌ Failed to update task:', req.error);
                reject(req.error);
            };
        });
    },

    deleteTask: async function(id) {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("tasks", "readwrite");
        const store = tx.objectStore("tasks");

        return new Promise((resolve, reject) => {
            const req = store.delete(id);
            req.onsuccess = () => {
                console.log('✅ Task deleted from database');

                // Update localStorage backup
                this.updateLocalStorageBackup('tasks');

                // Notify listeners
                this.notifyChange('task', 'deleted', { id });

                resolve();
            };
            req.onerror = () => {
                console.error('❌ Failed to delete task:', req.error);
                reject(req.error);
            };
        });
    },

    // === EVENT OPERATIONS ===
    addEvent: async function(event) {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("events", "readwrite");
        const store = tx.objectStore("events");

        return new Promise((resolve, reject) => {
            const eventToAdd = {
                ...event,
                createdAt: event.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const req = store.add(eventToAdd);

            req.onsuccess = () => {
                const newEvent = { ...eventToAdd, id: req.result };
                console.log('✅ Event added to database with ID:', req.result);

                // Update localStorage backup
                this.updateLocalStorageBackup('events');

                // Notify listeners
                this.notifyChange('event', 'added', newEvent);

                resolve(req.result);
            };
            req.onerror = () => {
                console.error('❌ Failed to add event:', req.error);
                reject(req.error);
            };
        });
    },

    getEvents: async function() {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("events", "readonly");
        const store = tx.objectStore("events");

        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => {
                console.log(`📅 Retrieved ${req.result.length} events from database`);
                resolve(req.result);
            };
            req.onerror = () => {
                console.error('❌ Failed to get events:', req.error);
                reject(req.error);
            };
        });
    },

    updateEvent: async function(event) {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("events", "readwrite");
        const store = tx.objectStore("events");

        return new Promise((resolve, reject) => {
            const updatedEvent = {
                ...event,
                updatedAt: new Date().toISOString()
            };

            const req = store.put(updatedEvent);

            req.onsuccess = () => {
                console.log('✅ Event updated in database');

                // Update localStorage backup
                this.updateLocalStorageBackup('events');

                // Notify listeners
                this.notifyChange('event', 'updated', updatedEvent);

                resolve(updatedEvent);
            };
            req.onerror = () => {
                console.error('❌ Failed to update event:', req.error);
                reject(req.error);
            };
        });
    },

    deleteEvent: async function(id) {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("events", "readwrite");
        const store = tx.objectStore("events");

        return new Promise((resolve, reject) => {
            const req = store.delete(id);
            req.onsuccess = () => {
                console.log('✅ Event deleted from database');

                // Update localStorage backup
                this.updateLocalStorageBackup('events');

                // Notify listeners
                this.notifyChange('event', 'deleted', { id });

                resolve();
            };
            req.onerror = () => {
                console.error('❌ Failed to delete event:', req.error);
                reject(req.error);
            };
        });
    },

    // === CROSS-PLATFORM OPERATIONS ===
    createEventFromTask: async function(task) {
        const event = {
            title: task.title,
            description: task.description || '',
            date: task.date || new Date().toISOString().split('T')[0],
            time: task.reminder ? new Date(task.reminder).toTimeString().slice(0,5) : null,
            list: task.list !== 'N/A' ? task.list : null,
            priority: task.priority !== 'N/A' ? task.priority : null,
            sourceTaskId: task.id,
            createdFromTask: true
        };

        try {
            const eventId = await this.addEvent(event);
            console.log('✅ Event created from task');

            // Also update the task to mark it as having an associated event
            const updatedTask = { ...task, hasAssociatedEvent: true, associatedEventId: eventId };
            await this.updateTask(updatedTask);

            return eventId;
        } catch (error) {
            console.error('❌ Failed to create event from task:', error);
            throw error;
        }
    },

    createTaskFromEvent: async function(event) {
        const task = {
            title: event.title,
            description: event.description || '',
            date: event.date,
            reminder: event.date,
            priority: event.priority || 'medium',
            list: event.list || 'N/A',
            completed: false,
            subtasks: [],
            sourceEventId: event.id,
            createdFromEvent: true
        };

        try {
            const taskId = await this.addTask(task);
            console.log('✅ Task created from event');

            // Also update the event to mark it as having an associated task
            const updatedEvent = { ...event, hasAssociatedTask: true, associatedTaskId: taskId };
            await this.updateEvent(updatedEvent);

            return taskId;
        } catch (error) {
            console.error('❌ Failed to create task from event:', error);
            throw error;
        }
    },

    // Delete associated items when one is deleted
    deleteTaskAndAssociatedEvent: async function(taskId) {
        try {
            // Get the task to find associated event
            const tasks = await this.getTasks();
            const task = tasks.find(t => t.id === taskId);

            if (task && task.associatedEventId) {
                // Delete associated event
                await this.deleteEvent(task.associatedEventId);
                console.log('✅ Associated event deleted');
            }

            // Delete the task
            await this.deleteTask(taskId);
            console.log('✅ Task and associated event deleted');

        } catch (error) {
            console.error('❌ Failed to delete task and associated event:', error);
            throw error;
        }
    },

    deleteEventAndAssociatedTask: async function(eventId) {
        try {
            // Get the event to find associated task
            const events = await this.getEvents();
            const event = events.find(e => e.id === eventId);

            if (event && event.associatedTaskId) {
                // Delete associated task
                await this.deleteTask(event.associatedTaskId);
                console.log('✅ Associated task deleted');
            }

            // Delete the event
            await this.deleteEvent(eventId);
            console.log('✅ Event and associated task deleted');

        } catch (error) {
            console.error('❌ Failed to delete event and associated task:', error);
            throw error;
        }
    },

    // === UTILITY OPERATIONS ===
    updateLocalStorageBackup: async function(type) {
        try {
            if (type === 'tasks') {
                const tasks = await this.getTasks();
                localStorage.setItem('tasks', JSON.stringify(tasks));
            } else if (type === 'events') {
                const events = await this.getEvents();
                localStorage.setItem('calendar-events', JSON.stringify(events));
            }
        } catch (error) {
            console.error('Failed to update localStorage backup:', error);
        }
    },

    // Sync localStorage with database
    syncFromLocalStorage: async function() {
        try {
            // Sync tasks
            const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const dbTasks = await this.getTasks();

            // Find tasks that exist in localStorage but not in database
            for (const task of localTasks) {
                if (!dbTasks.find(t => t.id === task.id)) {
                    await this.addTask(task);
                    console.log('✅ Synced task from localStorage to database');
                }
            }

            // Sync events
            const localEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]');
            const dbEvents = await this.getEvents();

            // Find events that exist in localStorage but not in database
            for (const event of localEvents) {
                if (!dbEvents.find(e => e.id === event.id)) {
                    await this.addEvent(event);
                    console.log('✅ Synced event from localStorage to database');
                }
            }

        } catch (error) {
            console.error('❌ Failed to sync from localStorage:', error);
        }
    },

    exportData: async function() {
        try {
            const [tasks, events, lists, habits] = await Promise.all([
                this.getTasks(),
                this.getEvents(),
                this.getLists(),
                this.getHabits()
            ]);

            const exportData = {
                tasks,
                events,
                lists,
                habits,
                exportDate: new Date().toISOString(),
                version: "2.0"
            };

            console.log('📤 Data exported:', exportData);
            return exportData;
        } catch (error) {
            console.error('❌ Failed to export data:', error);
            throw error;
        }
    },

    // === LIST OPERATIONS ===
    addList: async function(list) {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("lists", "readwrite");
        const store = tx.objectStore("lists");

        return new Promise((resolve, reject) => {
            const req = store.add({
                ...list,
                createdAt: new Date().toISOString()
            });

            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    getLists: async function() {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("lists", "readonly");
        const store = tx.objectStore("lists");

        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    deleteList: async function(id) {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("lists", "readwrite");
        const store = tx.objectStore("lists");

        return new Promise((resolve, reject) => {
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    // === HABIT OPERATIONS ===
    addHabit: async function(habit) {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("habits", "readwrite");
        const store = tx.objectStore("habits");

        return new Promise((resolve, reject) => {
            const req = store.add({
                ...habit,
                createdAt: habit.createdAt || new Date().toISOString()
            });

            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    getHabits: async function() {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction("habits", "readonly");
        const store = tx.objectStore("habits");

        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    // === ADDITIONAL UTILITY FUNCTIONS ===
    getCompletedTasks: async function() {
        const tasks = await this.getTasks();
        return tasks.filter(task => task.completed);
    },

    getPendingTasks: async function() {
        const tasks = await this.getTasks();
        return tasks.filter(task => !task.completed);
    },

    clearAllData: async function() {
        if (!this.isReady) {
            await this.init();
        }

        const stores = ['tasks', 'events', 'lists', 'habits'];

        for (const storeName of stores) {
            const tx = this.db.transaction(storeName, "readwrite");
            const store = tx.objectStore(storeName);
            await new Promise((resolve, reject) => {
                const req = store.clear();
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        }

        console.log('✅ All data cleared from database');
    },

    migrateFromLocalStorage: async function() {
        try {
            let migrated = false;

            // Migrate tasks
            const localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            for (const task of localTasks) {
                await this.addTask(task);
                migrated = true;
            }

            // Migrate events
            const localEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]');
            for (const event of localEvents) {
                await this.addEvent(event);
                migrated = true;
            }

            // Migrate habits
            const localHabits = JSON.parse(localStorage.getItem('habits') || '[]');
            for (const habit of localHabits) {
                await this.addHabit(habit);
                migrated = true;
            }

            return migrated;
        } catch (error) {
            console.error('Migration failed:', error);
            return false;
        }
    },

    bulkAdd: async function(storeName, items) {
        if (!this.isReady) {
            await this.init();
        }

        const tx = this.db.transaction(storeName, "readwrite");
        const store = tx.objectStore(storeName);

        for (const item of items) {
            await new Promise((resolve, reject) => {
                const req = store.add(item);
                req.onsuccess = () => {
                    item.id = req.result;
                    resolve();
                };
                req.onerror = () => reject(req.error);
            });
        }

        console.log(`✅ Bulk added ${items.length} items to ${storeName}`);
    }
};

// ENHANCED FUNCTIONS - Override existing functions with cascading delete capabilities

// Override deleteTask with enhanced version
window.taskDB.deleteTask = async function(id) {
    if (!this.isReady) {
        await this.init();
    }

    console.log(`🗑️ Enhanced deleteTask called for ID: ${id}`);

    // First find and delete any associated events
    try {
        const events = await this.getEvents();
        const associatedEvents = events.filter(event => {
            return (
                event.sourceTaskId == id ||
                event.associatedTaskId == id ||
                (event.createdFromTask && event.sourceTaskId == id)
            );
        });

        console.log(`Found ${associatedEvents.length} associated events to delete`);

        // Delete each associated event
        for (const event of associatedEvents) {
            console.log(`Deleting associated event: ${event.title} (ID: ${event.id})`);
            const tx = this.db.transaction("events", "readwrite");
            const store = tx.objectStore("events");

            await new Promise((resolve, reject) => {
                const req = store.delete(event.id);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        }

        if (associatedEvents.length > 0) {
            console.log(`✅ Deleted ${associatedEvents.length} associated events`);
            // Update localStorage backup for events
            this.updateLocalStorageBackup('events');
        }

    } catch (error) {
        console.error('❌ Error deleting associated events:', error);
    }

    // Now delete the task itself
    const tx = this.db.transaction("tasks", "readwrite");
    const store = tx.objectStore("tasks");

    return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => {
            console.log('✅ Task deleted from database');

            // Update localStorage backup
            this.updateLocalStorageBackup('tasks');

            // Notify listeners
            this.notifyChange('task', 'deleted', { id });

            resolve();
        };
        req.onerror = () => {
            console.error('❌ Failed to delete task:', req.error);
            reject(req.error);
        };
    });
};

// Override deleteEvent with enhanced version
window.taskDB.deleteEvent = async function(id) {
    if (!this.isReady) {
        await this.init();
    }

    console.log(`🗑️ Enhanced deleteEvent called for ID: ${id}`);

    // First find and delete any associated tasks
    try {
        const tasks = await this.getTasks();
        const associatedTasks = tasks.filter(task => {
            return (
                task.sourceEventId == id ||
                task.associatedEventId == id ||
                (task.createdFromEvent && task.sourceEventId == id)
            );
        });

        console.log(`Found ${associatedTasks.length} associated tasks to delete`);

        // Delete each associated task
        for (const task of associatedTasks) {
            console.log(`Deleting associated task: ${task.title} (ID: ${task.id})`);
            const tx = this.db.transaction("tasks", "readwrite");
            const store = tx.objectStore("tasks");

            await new Promise((resolve, reject) => {
                const req = store.delete(task.id);
                req.onsuccess = () => resolve();
                req.onerror = () => reject(req.error);
            });
        }

        if (associatedTasks.length > 0) {
            console.log(`✅ Deleted ${associatedTasks.length} associated tasks`);
            // Update localStorage backup for tasks
            this.updateLocalStorageBackup('tasks');
        }

    } catch (error) {
        console.error('❌ Error deleting associated tasks:', error);
    }

    // Now delete the event itself
    const tx = this.db.transaction("events", "readwrite");
    const store = tx.objectStore("events");

    return new Promise((resolve, reject) => {
        const req = store.delete(id);
        req.onsuccess = () => {
            console.log('✅ Event deleted from database');

            // Update localStorage backup
            this.updateLocalStorageBackup('events');

            // Notify listeners
            this.notifyChange('event', 'deleted', { id });

            resolve();
        };
        req.onerror = () => {
            console.error('❌ Failed to delete event:', req.error);
            reject(req.error);
        };
    });
};

// Enhanced createEventFromTask that properly links items
window.taskDB.createEventFromTask = async function(task) {
    console.log('📅 Creating event from task:', task.title);

    const event = {
        title: task.title,
        description: task.description || '',
        date: task.date || new Date().toISOString().split('T')[0],
        time: task.reminder ? new Date(task.reminder).toTimeString().slice(0,5) : null,
        list: task.list !== 'N/A' ? task.list : null,
        priority: task.priority !== 'N/A' ? task.priority : null,
        sourceTaskId: task.id,
        associatedTaskId: task.id,
        createdFromTask: true,
        hasAssociatedTask: true
    };

    try {
        const eventId = await this.addEvent(event);
        console.log('✅ Event created from task with ID:', eventId);

        // Update the task to link back to the event
        const updatedTask = {
            ...task,
            hasAssociatedEvent: true,
            associatedEventId: eventId
        };
        await this.updateTask(updatedTask);

        console.log(`🔗 Linked task ${task.id} with event ${eventId}`);
        return eventId;
    } catch (error) {
        console.error('❌ Failed to create event from task:', error);
        throw error;
    }
};

// Add debugging function
window.taskDB.debugRelationships = async function() {
    const tasks = await this.getTasks();
    const events = await this.getEvents();

    console.log('=== RELATIONSHIP DEBUG ===');
    console.log('Tasks with associated events:');
    tasks.filter(t => t.hasAssociatedEvent || t.associatedEventId).forEach(task => {
        console.log(`Task "${task.title}" (ID: ${task.id}) -> Event ID: ${task.associatedEventId}`);
    });

    console.log('Events with associated tasks:');
    events.filter(e => e.hasAssociatedTask || e.associatedTaskId).forEach(event => {
        console.log(`Event "${event.title}" (ID: ${event.id}) -> Task ID: ${event.associatedTaskId}`);
    });

    console.log('Events created from tasks:');
    events.filter(e => e.createdFromTask).forEach(event => {
        console.log(`Event "${event.title}" (ID: ${event.id}) from Task ID: ${event.sourceTaskId}`);
    });

    console.log('Tasks created from events:');
    tasks.filter(t => t.createdFromEvent).forEach(task => {
        console.log(`Task "${task.title}" (ID: ${task.id}) from Event ID: ${task.sourceEventId}`);
    });
    console.log('=== END DEBUG ===');
};

// Add to window for debugging
window.debugTaskDB = window.taskDB.debugRelationships;

// Initialize database on load and set up sync
document.addEventListener("DOMContentLoaded", async function() {
    try {
        if (!taskDB.isReady) {
            await taskDB.init();
            await taskDB.syncFromLocalStorage();
            console.log('✅ Database auto-initialized and synced on DOM load');
        }
    } catch (error) {
        console.error('❌ Failed to auto-initialize database:', error);
    }
});

// Global sync functions
window.syncAllData = async function() {
    try {
        await taskDB.syncFromLocalStorage();
        await taskDB.updateLocalStorageBackup('tasks');
        await taskDB.updateLocalStorageBackup('events');
        console.log('✅ All data synced successfully');
    } catch (error) {
        console.error('❌ Failed to sync data:', error);
    }
};

// Listen for storage changes from other tabs
window.addEventListener('storage', function(e) {
    if (e.key === 'tasks' || e.key === 'calendar-events') {
        console.log('🔄 Storage changed in another tab, syncing...');
        window.syncAllData();
    }
});

console.log('✅ Enhanced Database System with Real-time Sync and Cascading Deletes loaded successfully');

// ADD THESE FUNCTIONS TO THE END OF YOUR DB.JS FILE

// Fixed debug function (replace the existing one)
window.taskDB.debugRelationships = async function() {
    try {
        const tasks = await window.taskDB.getTasks();
        const events = await window.taskDB.getEvents();

        console.log('=== RELATIONSHIP DEBUG ===');
        console.log('Tasks with associated events:');
        tasks.filter(t => t.hasAssociatedEvent || t.associatedEventId).forEach(task => {
            console.log(`Task "${task.title}" (ID: ${task.id}) -> Event ID: ${task.associatedEventId}`);
        });

        console.log('Events with associated tasks:');
        events.filter(e => e.hasAssociatedTask || e.associatedTaskId).forEach(event => {
            console.log(`Event "${event.title}" (ID: ${event.id}) -> Task ID: ${event.associatedTaskId}`);
        });

        console.log('Events created from tasks:');
        events.filter(e => e.createdFromTask).forEach(event => {
            console.log(`Event "${event.title}" (ID: ${event.id}) from Task ID: ${event.sourceTaskId}`);
        });

        console.log('Tasks created from events:');
        tasks.filter(t => t.createdFromEvent).forEach(task => {
            console.log(`Task "${task.title}" (ID: ${task.id}) from Event ID: ${task.sourceEventId}`);
        });
        console.log('=== END DEBUG ===');

        return {
            totalTasks: tasks.length,
            totalEvents: events.length,
            tasksWithEvents: tasks.filter(t => t.hasAssociatedEvent || t.associatedEventId).length,
            eventsWithTasks: events.filter(e => e.hasAssociatedTask || e.associatedTaskId).length,
            eventsFromTasks: events.filter(e => e.createdFromTask).length,
            tasksFromEvents: tasks.filter(t => t.createdFromEvent).length
        };
    } catch (error) {
        console.error('❌ Debug failed:', error);
        return null;
    }
};
// COPY THIS ENTIRE BLOCK AND PASTE IT AT THE VERY END OF YOUR db.js FILE
// (After the last line of your existing db.js)

// Better debug commands
window.debugDB = async function() {
    console.log('🔍 Running Database Debug...');
    try {
        const tasks = await window.taskDB.getTasks();
        const events = await window.taskDB.getEvents();

        console.log('=== RELATIONSHIP DEBUG ===');
        console.log('Tasks with associated events:');
        tasks.filter(t => t.hasAssociatedEvent || t.associatedEventId).forEach(task => {
            console.log(`Task "${task.title}" (ID: ${task.id}) -> Event ID: ${task.associatedEventId}`);
        });

        console.log('Events with associated tasks:');
        events.filter(e => e.hasAssociatedTask || e.associatedTaskId).forEach(event => {
            console.log(`Event "${event.title}" (ID: ${event.id}) -> Task ID: ${event.associatedTaskId}`);
        });

        console.log('Events created from tasks:');
        events.filter(e => e.createdFromTask).forEach(event => {
            console.log(`Event "${event.title}" (ID: ${event.id}) from Task ID: ${event.sourceTaskId}`);
        });

        console.log('Tasks created from events:');
        tasks.filter(t => t.createdFromEvent).forEach(task => {
            console.log(`Task "${task.title}" (ID: ${task.id}) from Event ID: ${task.sourceEventId}`);
        });
        console.log('=== END DEBUG ===');

        return {
            totalTasks: tasks.length,
            totalEvents: events.length,
            tasksWithEvents: tasks.filter(t => t.hasAssociatedEvent || t.associatedEventId).length,
            eventsWithTasks: events.filter(e => e.hasAssociatedTask || e.associatedTaskId).length,
            eventsFromTasks: events.filter(e => e.createdFromTask).length,
            tasksFromEvents: tasks.filter(t => t.createdFromEvent).length
        };
    } catch (error) {
        console.error('❌ Debug failed:', error);
        return null;
    }
};

// Show tasks in a table
window.showTasks = async function() {
    try {
        const tasks = await window.taskDB.getTasks();
        console.log('📋 TASKS TABLE:');
        console.table(tasks.map(t => ({
            id: t.id,
            title: t.title,
            completed: t.completed,
            hasEvent: !!t.hasAssociatedEvent,
            eventId: t.associatedEventId || 'none',
            fromEvent: !!t.createdFromEvent,
            sourceEventId: t.sourceEventId || 'none'
        })));
        return tasks;
    } catch (error) {
        console.error('❌ Failed to show tasks:', error);
    }
};

// Show events in a table
window.showEvents = async function() {
    try {
        const events = await window.taskDB.getEvents();
        console.log('📅 EVENTS TABLE:');
        console.table(events.map(e => ({
            id: e.id,
            title: e.title,
            date: e.date,
            hasTask: !!e.hasAssociatedTask,
            taskId: e.associatedTaskId || 'none',
            fromTask: !!e.createdFromTask,
            sourceTaskId: e.sourceTaskId || 'none'
        })));
        return events;
    } catch (error) {
        console.error('❌ Failed to show events:', error);
    }
};

// Test integration function
window.testIntegration = async function() {
    console.log('🧪 Testing Integration...');

    try {
        if (window.taskDB && window.taskDB.isReady) {
            console.log('✅ Database is ready');

            const tasks = await window.taskDB.getTasks();
            const events = await window.taskDB.getEvents();
            console.log(`✅ Database queries work: ${tasks.length} tasks, ${events.length} events`);

            const summary = await window.debugDB();
            console.log('✅ Debug function works:', summary);

            if (typeof window.taskDB.deleteTask === 'function' &&
                typeof window.taskDB.deleteEvent === 'function') {
                console.log('✅ Enhanced delete functions exist');
            } else {
                console.log('❌ Enhanced delete functions missing');
            }

            console.log('🎉 Integration test passed!');
            return {
                success: true,
                tasks: tasks.length,
                events: events.length,
                summary: summary
            };
        } else {
            console.log('❌ Database not ready');
            return { success: false, reason: 'Database not ready' };
        }
    } catch (error) {
        console.error('❌ Integration test failed:', error);
        return { success: false, error: error.message };
    }
};

// Test the deletion cascade
window.testDeletion = async function() {
    console.log('🗑️ Testing Deletion Cascade...');

    try {
        const testTask = {
            title: "🧪 Test Task for Deletion",
            description: "This is a test task to verify cascading deletion",
            date: "2025-06-08",
            list: "Test",
            priority: "medium"
        };

        console.log('📝 Creating test task...');
        const taskId = await window.taskDB.addTask(testTask);
        console.log(`✅ Created test task with ID: ${taskId}`);

        const tasks = await window.taskDB.getTasks();
        const fullTask = tasks.find(t => t.id === taskId);

        console.log('📅 Creating event from task...');
        const eventId = await window.taskDB.createEventFromTask(fullTask);
        console.log(`✅ Created event with ID: ${eventId}`);

        const updatedTasks = await window.taskDB.getTasks();
        const linkedTask = updatedTasks.find(t => t.id === taskId);

        if (linkedTask.associatedEventId === eventId) {
            console.log('✅ Task-Event relationship verified');
        } else {
            console.log('❌ Task-Event relationship failed');
            return { success: false, reason: 'Relationship not created' };
        }

        console.log('🗑️ Deleting task (should also delete event)...');
        await window.taskDB.deleteTask(taskId);
        console.log('✅ Task deleted');

        const finalTasks = await window.taskDB.getTasks();
        const finalEvents = await window.taskDB.getEvents();

        const taskExists = finalTasks.find(t => t.id === taskId);
        const eventExists = finalEvents.find(e => e.id === eventId);

        if (!taskExists && !eventExists) {
            console.log('🎉 SUCCESS: Cascading deletion works! Both task and event deleted.');
            return {
                success: true,
                message: 'Cascading deletion working correctly',
                deletedTaskId: taskId,
                deletedEventId: eventId
            };
        } else {
            console.log('❌ FAILED: Cascading deletion not working');
            console.log('Task exists:', !!taskExists);
            console.log('Event exists:', !!eventExists);
            return {
                success: false,
                reason: 'Cascading deletion failed',
                taskExists: !!taskExists,
                eventExists: !!eventExists
            };
        }

    } catch (error) {
        console.error('❌ Deletion test failed:', error);
        return { success: false, error: error.message };
    }
};

/ Quick status check
window.dbStatus = async function() {
    console.log('📊 Database Status:');

    if (!window.taskDB) {
        console.log('❌ taskDB not found');
        return { error: 'taskDB not found' };
    }

    console.log('Database ready:', window.taskDB.isReady);
    console.log('Database object exists:', !!window.taskDB.db);

    if (window.taskDB.isReady) {
        try {
            const tasks = await window.taskDB.getTasks();
            const events = await window.taskDB.getEvents();

            console.log(`Tasks: ${tasks.length}`);
            console.log(`Events: ${events.length}`);

            const tasksWithEvents = tasks.filter(t => t.hasAssociatedEvent || t.associatedEventId);
            const eventsWithTasks = events.filter(e => e.hasAssociatedTask || e.associatedTaskId);
            const eventsFromTasks = events.filter(e => e.createdFromTask);
            const tasksFromEvents = tasks.filter(t => t.createdFromEvent);

            console.log(`Tasks with events: ${tasksWithEvents.length}`);
            console.log(`Events with tasks: ${eventsWithTasks.length}`);
            console.log(`Events from tasks: ${eventsFromTasks.length}`);
            console.log(`Tasks from events: ${tasksFromEvents.length}`);

            return {
                ready: true,
                tasks: tasks.length,
                events: events.length,
                relationships: {
                    tasksWithEvents: tasksWithEvents.length,
                    eventsWithTasks: eventsWithTasks.length,
                    eventsFromTasks: eventsFromTasks.length,
                    tasksFromEvents: tasksFromEvents.length
                }
            };

        } catch (error) {
            console.log('❌ Error querying database:', error);
            return { error: error.message };
        }
    } else {
        console.log('❌ Database not ready - trying to initialize...');
        try {
            await window.taskDB.init();
            console.log('✅ Database initialized successfully');
            return await window.dbStatus(); // Retry
        } catch (error) {
            console.log('❌ Database initialization failed:', error);
            return { error: 'Database initialization failed: ' + error.message };
        }
    }
};

// Check why database isn't working
window.checkDB = function() {
    console.log('🔍 Checking Database Issues...');

    console.log('1. taskDB exists:', !!window.taskDB);
    console.log('2. taskDB.isReady:', window.taskDB?.isReady);
    console.log('3. taskDB.db exists:', !!window.taskDB?.db);
    console.log('4. IndexedDB supported:', !!window.indexedDB);

    if (window.taskDB) {
        console.log('5. taskDB methods:');
        console.log('   - init:', typeof window.taskDB.init);
        console.log('   - getTasks:', typeof window.taskDB.getTasks);
        console.log('   - getEvents:', typeof window.taskDB.getEvents);
        console.log('   - deleteTask:', typeof window.taskDB.deleteTask);
        console.log('   - deleteEvent:', typeof window.taskDB.deleteEvent);
    }

    return {
        taskDBExists: !!window.taskDB,
        isReady: window.taskDB?.isReady,
        dbExists: !!window.taskDB?.db,
        indexedDBSupported: !!window.indexedDB
    };
};

// Force database initialization
window.initDB = async function() {
    console.log('🔄 Force initializing database...');

    if (!window.taskDB) {
        console.log('❌ taskDB not found - database script not loaded?');
        return false;
    }

    try {
        await window.taskDB.init();
        console.log('✅ Database initialized successfully');

        // Test basic operations
        const tasks = await window.taskDB.getTasks();
        const events = await window.taskDB.getEvents();

        console.log(`📊 Database working: ${tasks.length} tasks, ${events.length} events`);
        return true;
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        return false;
    }
};

// Test localStorage fallback deletion
window.testLocalStorageDeletion = function() {
    console.log('🧪 Testing localStorage deletion logic...');

    // Get current data
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const events = JSON.parse(localStorage.getItem('calendar-events') || '[]');

    console.log(`Current data: ${tasks.length} tasks, ${events.length} events`);

    // Find tasks with associated events
    const tasksWithEvents = tasks.filter(t => t.hasAssociatedEvent || t.associatedEventId);
    console.log(`Tasks with events: ${tasksWithEvents.length}`);

    tasksWithEvents.forEach(task => {
        console.log(`Task "${task.title}" (ID: ${task.id}) -> Event ID: ${task.associatedEventId}`);

        // Check if associated event exists
        const associatedEvent = events.find(e => e.id == task.associatedEventId);
        if (associatedEvent) {
            console.log(`  ✅ Associated event found: "${associatedEvent.title}"`);
        } else {
            console.log(`  ❌ Associated event NOT found`);
        }
    });

    // Find events with associated tasks
    const eventsWithTasks = events.filter(e => e.hasAssociatedTask || e.associatedTaskId);
    console.log(`Events with tasks: ${eventsWithTasks.length}`);

    eventsWithTasks.forEach(event => {
        console.log(`Event "${event.title}" (ID: ${event.id}) -> Task ID: ${event.associatedTaskId}`);

        // Check if associated task exists
        const associatedTask = tasks.find(t => t.id == event.associatedTaskId);
        if (associatedTask) {
            console.log(`  ✅ Associated task found: "${associatedTask.title}"`);
        } else {
            console.log(`  ❌ Associated task NOT found`);
        }
    });

    return {
        tasks: tasks.length,
        events: events.length,
        tasksWithEvents: tasksWithEvents.length,
        eventsWithTasks: eventsWithTasks.length
    };
};

console.log('✅ Debug functions loaded directly. Available commands:');
console.log('- checkDB() - Check database issues');
console.log('- dbStatus() - Full database status');
console.log('- initDB() - Force database initialization');
console.log('- testLocalStorageDeletion() - Test localStorage relationships');