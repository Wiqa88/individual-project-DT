// Corrected Database Test - Paste this into your browser console
// This defines taskDB — MUST go first
window.taskDB = {
    init: async function () {
        const request = indexedDB.open("taskDB", 1);
        return new Promise((resolve, reject) => {
            request.onupgradeneeded = function (event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains("tasks")) {
                    db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
                }
                if (!db.objectStoreNames.contains("lists")) {
                    db.createObjectStore("lists", { keyPath: "id", autoIncrement: true });
                }
            };
            request.onsuccess = function (event) {
                taskDB.db = event.target.result;
                taskDB.isReady = true;
                resolve();
            };
            request.onerror = function () {
                reject("Database failed to open");
            };
        });
    },

    isReady: false,

    addTask: async function (task) {
        const tx = this.db.transaction("tasks", "readwrite");
        const store = tx.objectStore("tasks");
        return new Promise((resolve, reject) => {
            const req = store.add(task);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    getTasks: async function () {
        const tx = this.db.transaction("tasks", "readonly");
        const store = tx.objectStore("tasks");
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    updateTask: async function (task) {
        const tx = this.db.transaction("tasks", "readwrite");
        const store = tx.objectStore("tasks");
        return new Promise((resolve, reject) => {
            const req = store.put(task);
            req.onsuccess = () => resolve(task);
            req.onerror = () => reject(req.error);
        });
    },

    deleteTask: async function (id) {
        const tx = this.db.transaction("tasks", "readwrite");
        const store = tx.objectStore("tasks");
        return new Promise((resolve, reject) => {
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    },

    getCompletedTasks: async function () {
        const tasks = await this.getTasks();
        return tasks.filter(task => task.completed);
    },

    addList: async function (list) {
        const tx = this.db.transaction("lists", "readwrite");
        const store = tx.objectStore("lists");
        return new Promise((resolve, reject) => {
            const req = store.add(list);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    getLists: async function () {
        const tx = this.db.transaction("lists", "readonly");
        const store = tx.objectStore("lists");
        return new Promise((resolve, reject) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    },

    deleteList: async function (id) {
        const tx = this.db.transaction("lists", "readwrite");
        const store = tx.objectStore("lists");
        return new Promise((resolve, reject) => {
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
    }
};





async function testDatabase() {
    try {
        console.log('🚀 Starting database test...');

        // Check if database is available
        if (!window.taskDB) {
            throw new Error('taskDB is not available. Make sure db.js is loaded.');
        }

        console.log('✅ taskDB is available');

        // Wait for database to initialize
        if (!taskDB.isReady) {
            console.log('⏳ Initializing database...');
            await taskDB.init();
        }

        console.log('✅ Database initialized');

        // Test adding a task
        console.log('📝 Testing task creation...');
        const testTask = {
            title: "Test Task " + Date.now(),
            description: "This is a test task created at " + new Date().toLocaleTimeString(),
            priority: "medium",
            completed: false
        };

        const savedTaskId = await taskDB.addTask(testTask);
        console.log('✅ Test task saved with ID:', savedTaskId);

        // Test getting all tasks
        console.log('📋 Testing task retrieval...');
        const allTasks = await taskDB.getTasks();
        console.log('✅ Retrieved tasks:', allTasks.length);
        console.log('Tasks:', allTasks);

        // Find our test task
        const ourTask = allTasks.find(task => task.id === savedTaskId);
        if (ourTask) {
            console.log('✅ Found our test task:', ourTask);
        } else {
            console.log('❌ Could not find our test task');
        }

        // Test updating the task
        console.log('✏️ Testing task update...');
        if (ourTask) {
            ourTask.completed = true;
            ourTask.description = "Updated test task";
            await taskDB.updateTask(ourTask);
            console.log('✅ Task updated successfully');
        }

        // Test getting completed tasks
        console.log('✅ Testing completed tasks filter...');
        const completedTasks = await taskDB.getCompletedTasks();
        console.log('Completed tasks:', completedTasks.length);

        // Test deleting the test task
        console.log('🗑️ Testing task deletion...');
        await taskDB.deleteTask(savedTaskId);
        console.log('✅ Test task deleted');

        // Verify deletion
        const tasksAfterDelete = await taskDB.getTasks();
        const deletedTask = tasksAfterDelete.find(task => task.id === savedTaskId);
        if (!deletedTask) {
            console.log('✅ Task successfully deleted');
        } else {
            console.log('❌ Task was not deleted properly');
        }

        // Test list operations
        console.log('📋 Testing list operations...');
        const testList = {
            name: "Test List " + Date.now(),
            color: "#ff6b6b"
        };

        const listId = await taskDB.addList(testList);
        console.log('✅ Test list created with ID:', listId);

        const allLists = await taskDB.getLists();
        console.log('✅ Retrieved lists:', allLists.length);

        // Clean up test list
        await taskDB.deleteList(listId);
        console.log('✅ Test list deleted');

        console.log('🎉 Database test completed successfully!');
        console.log('📊 Final stats:');

        const finalTasks = await taskDB.getTasks();
        const finalLists = await taskDB.getLists();

        console.log(`   Tasks: ${finalTasks.length}`);
        console.log(`   Lists: ${finalLists.length}`);

        return {
            success: true,
            tasksCount: finalTasks.length,
            listsCount: finalLists.length
        };

    } catch (error) {
        console.error('❌ Database test failed:', error);
        console.error('Error details:', error.message);

        // Additional debugging info
        console.log('🔍 Debugging info:');
        console.log('   taskDB available:', !!window.taskDB);
        console.log('   taskDB ready:', window.taskDB ? window.taskDB.isReady : 'N/A');
        console.log('   Browser IndexedDB support:', !!window.indexedDB);

        return {
            success: false,
            error: error.message
        };
    }
}

// Alternative simple test if the above fails
async function simpleTest() {
    try {
        console.log('🔧 Running simple database test...');

        if (!window.taskDB) {
            console.log('❌ taskDB not found. Is db.js loaded?');
            return false;
        }

        console.log('✅ taskDB found');

        // Try to get tasks (this will initialize the database)
        const tasks = await taskDB.getTasks();
        console.log('✅ Database working! Tasks:', tasks.length);

        return true;
    } catch (error) {
        console.error('❌ Simple test failed:', error);
        return false;
    }
}

// Run the tests
console.log('🧪 Starting database tests...');
testDatabase().then(result => {
    if (result.success) {
        console.log('🎊 All tests passed!');
    } else {
        console.log('⚠️ Tests had issues. Trying simple test...');
        simpleTest();
    }
});

// Also provide some helpful commands for manual testing
console.log(`
📋 Manual Test Commands (copy and paste these one by one):

// Check if database exists:
window.taskDB

// Get all tasks:
taskDB.getTasks().then(tasks => console.log('Tasks:', tasks))

// Add a test task:
taskDB.addTask({title: 'Manual Test Task', completed: false}).then(id => console.log('Added task ID:', id))

// Clear all data (be careful!):
// taskDB.clearAllData().then(() => console.log('All data cleared'))

// Export data:
taskDB.exportData().then(data => console.log('Export:', data))
`);