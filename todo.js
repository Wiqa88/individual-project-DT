// MODIFIED todo.js - Updated to work with user-specific storage
// This replaces your existing todo.js

// Global state
let tasks = [];
let lists = [];

let currentView = {
    type: 'inbox', // 'inbox', 'today', 'next7days', 'important', 'list'
    name: 'Inbox', // Display name
    listName: null  // For list views
};


// Wait for DOM to be fully loaded before executing any code
document.addEventListener("DOMContentLoaded", function() {
    console.log('🚀 Starting TODO app with user-specific storage...');

    // Wait for user data manager to be ready
    function waitForUserDataManager() {
        if (window.userDataManager && window.userDataManager.currentUser) {
            console.log(`👤 User data manager ready for: ${window.userDataManager.currentUser.email}`);
            initApp();
        } else {
            console.log('⏳ Waiting for user data manager...');
            setTimeout(waitForUserDataManager, 100);
        }
    }

    waitForUserDataManager();

    // DOM Elements
    const taskCreationBox = document.querySelector(".task-creation-box");
    const taskTitle = document.getElementById("task-title");
    const taskDescription = document.getElementById("task-description");
    const dueDate = document.getElementById("due-date");
    const priority = document.getElementById("priority");
    const reminder = document.getElementById("reminder");
    const listSelect = document.getElementById("list");
    const addTaskButton = document.getElementById("add-task");
    const cancelTaskButton = document.getElementById("cancel-task");
    const taskList = document.getElementById("task-list");
    const listsContainer = document.getElementById("lists-container");
    const addListBtn = document.getElementById("add-list-btn");

    // --------------------------
    // Application Initialization
    // --------------------------
    async function initApp() {
        console.log('🚀 Initializing TODO App with user isolation...');

        // Load user-specific data
        await loadLists();
        await loadTasks();

        // Set up event listeners
        setupTaskCreationEvents();
        setupSortingEvents();
        setupListManagementEvents();
        setupNavigationEvents();

        console.log(`📊 App initialized for ${window.userDataManager.currentUser.email}: ${tasks.length} tasks, ${lists.length} lists`);
    }

    // ----------------------
    // USER-SPECIFIC DATA LOADING
    // ----------------------
    function loadTasks() {
        console.log('📂 Loading user-specific tasks...');

        if (!window.userDataManager || !window.userDataManager.currentUser) {
            console.log('❌ No user data manager or user');
            tasks = [];
            renderTasks();
            return;
        }

        const userData = window.userDataManager.getUserData('tasks');
        tasks = userData || [];

        console.log(`✅ Loaded ${tasks.length} tasks for ${window.userDataManager.currentUser.email}`);
        renderTasks();
    }

    function saveTasks() {
        if (!window.userDataManager || !window.userDataManager.currentUser) {
            console.log('❌ Cannot save: No user data manager or user');
            return;
        }

        window.userDataManager.setUserData('tasks', tasks);
        console.log(`💾 Saved ${tasks.length} tasks for ${window.userDataManager.currentUser.email}`);
    }

    function loadLists() {
        console.log('📂 Loading user-specific lists...');

        if (!window.userDataManager || !window.userDataManager.currentUser) {
            console.log('❌ No user data manager or user');
            lists = ['Personal', 'Work', 'Shopping'];
            renderLists();
            updateListDropdown();
            return;
        }

        const userData = window.userDataManager.getUserData('custom-lists');
        lists = userData || ['Personal', 'Work', 'Shopping'];

        console.log(`✅ Loaded ${lists.length} lists for ${window.userDataManager.currentUser.email}`);
        renderLists();
        updateListDropdown();
    }

    function saveLists() {
        if (!window.userDataManager || !window.userDataManager.currentUser) {
            console.log('❌ Cannot save: No user data manager or user');
            return;
        }

        window.userDataManager.setUserData('custom-lists', lists);
        console.log(`💾 Saved ${lists.length} lists for ${window.userDataManager.currentUser.email}`);
    }

    // ----------------------
    // Event Setup Functions
    // ----------------------
    function setupTaskCreationEvents() {
        const taskCreationHeader = taskCreationBox.querySelector("h3");

        taskCreationHeader.addEventListener("click", function () {
            taskCreationBox.classList.toggle("expanded");
            if (taskCreationBox.classList.contains("expanded")) {
                taskTitle.focus();
            }
        });

        taskTitle.addEventListener("focus", function () {
            taskCreationBox.classList.add("expanded");
        });

        taskCreationBox.addEventListener("click", function (e) {
            if (e.target !== taskCreationHeader) {
                taskCreationBox.classList.add("expanded");
            }
        });

        document.addEventListener("click", function (e) {
            if (!taskCreationBox.contains(e.target) && taskTitle.value.trim() === '') {
                taskCreationBox.classList.remove("expanded");
            }
        });

        addTaskButton.addEventListener("click", addTask);
        cancelTaskButton.addEventListener("click", function () {
            clearTaskForm();
            taskCreationBox.classList.remove("expanded");
        });

        taskTitle.addEventListener('input', () => autoExpand(taskTitle));
        taskDescription.addEventListener('input', () => autoExpand(taskDescription));

        taskTitle.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (taskCreationBox.classList.contains("expanded")) {
                    addTask();
                } else {
                    taskCreationBox.classList.add("expanded");
                }
            }
        });

        setupHabitCreationEvents();
    }

    function setupHabitCreationEvents() {
        const makeHabitCheckbox = document.getElementById('make-habit-checkbox');
        const habitSettings = document.getElementById('habit-settings');

        if (makeHabitCheckbox) {
            makeHabitCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    habitSettings.style.display = 'block';
                    habitSettings.classList.add('show');
                    taskCreationBox.classList.add('has-habit');
                } else {
                    habitSettings.classList.add('hide');
                    taskCreationBox.classList.remove('has-habit');
                    setTimeout(() => {
                        habitSettings.style.display = 'none';
                        habitSettings.classList.remove('hide', 'show');
                    }, 300);
                }
            });
        }
    }

    // ----------------------
    // Task Management
    // ----------------------
    function addTask() {
        const titleValue = taskTitle.value.trim();

        if (!titleValue) {
            alert('Please enter a task title');
            return;
        }

        if (!window.userDataManager || !window.userDataManager.currentUser) {
            alert('Error: User not authenticated');
            return;
        }

        console.log(`🔄 Adding new task for ${window.userDataManager.currentUser.email}...`);

        const newTask = {
            id: Date.now(),
            title: titleValue,
            description: taskDescription.value.trim(),
            date: dueDate.value || null,
            reminder: reminder.value || null,
            priority: normalizeTaskPriority(priority.value),
            list: listSelect.value !== 'default' ? listSelect.value : 'N/A',
            completed: false,
            createdAt: new Date().toISOString(),
            subtasks: [],
            userId: window.userDataManager.currentUser.id || window.userDataManager.currentUser.email
        };

        // Add to tasks array
        tasks.push(newTask);

        // Save to user-specific storage
        saveTasks();

        // Refresh current view instead of just calling renderTasks
        refreshCurrentView();

        // Clear form
        clearTaskForm();
        taskCreationBox.classList.remove("expanded");

        console.log(`✅ Task added successfully for ${window.userDataManager.currentUser.email}`);
        showTaskNotification('Task added successfully!', 'success');
    }
    function deleteTask(taskId, taskElement) {
        if (confirm("Are you sure you want to delete this task?")) {
            console.log(`🗑️ Deleting task ${taskId} for ${window.userDataManager.currentUser.email}`);

            // Remove from tasks array
            const originalLength = tasks.length;
            tasks = tasks.filter(task => task.id !== taskId);

            // Save changes
            saveTasks();

            // Refresh current view instead of manipulating DOM
            refreshCurrentView();

            console.log(`✅ Task deleted. Tasks: ${originalLength} → ${tasks.length}`);
            showTaskNotification('Task deleted successfully!', 'success');
        }
    }

    function debugNavigationAfterSort() {
        console.log('🧪 Testing navigation after sorting...');
        console.log('Current view:', currentView);
        console.log('Total tasks:', tasks.length);

        // Test each navigation function
        const testFunctions = [
            { name: 'Today', func: () => filterTodayTasks() },
            { name: 'Next 7 Days', func: () => filterNext7DaysTasks() },
            { name: 'Important', func: () => filterImportantTasks() },
            { name: 'Inbox', func: () => showAllTasks('Inbox') }
        ];

        console.log('Testing navigation functions...');
        testFunctions.forEach(test => {
            try {
                test.func();
                console.log(`✅ ${test.name}: Working`);
            } catch (error) {
                console.log(`❌ ${test.name}: Error -`, error);
            }
        });

        // Test list navigation if lists exist
        if (lists && lists.length > 0) {
            try {
                filterTasksByList(lists[0]);
                console.log(`✅ List navigation (${lists[0]}): Working`);
            } catch (error) {
                console.log(`❌ List navigation: Error -`, error);
            }
        }

        return 'Navigation test complete. Check console for results.';
    }


    function refreshCurrentView() {
        console.log(`🔄 Refreshing current view: ${currentView.name}`);

        switch(currentView.type) {
            case 'today':
                filterTodayTasks();
                break;
            case 'next7days':
                filterNext7DaysTasks();
                break;
            case 'important':
                filterImportantTasks();
                break;
            case 'list':
                filterTasksByList(currentView.listName);
                break;
            case 'inbox':
            default:
                showAllTasks(currentView.name);
                break;
        }
    }




    function toggleTaskCompletion(task, taskRingElement, taskItemElement) {
        const newCompletedState = !task.completed;

        taskRingElement.classList.add("completing");

        if (newCompletedState) {
            taskRingElement.classList.add("completed");
        } else {
            taskRingElement.classList.remove("completed");
        }

        taskRingElement.addEventListener("animationend", function handler() {
            taskRingElement.classList.remove("completing");
            taskRingElement.removeEventListener("animationend", handler);

            task.completed = newCompletedState;

            if (newCompletedState) {
                taskItemElement.classList.add("task-item-fading");
            } else {
                taskItemElement.style.opacity = "1";
                taskItemElement.classList.remove("task-item-fading");
            }

            // Update task in array
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = task.completed;
                saveTasks();
            }
        }, { once: true });
    }

    function clearTaskForm() {
        taskTitle.value = '';
        taskDescription.value = '';
        dueDate.value = '';
        reminder.value = '';
        priority.value = 'priority';
        listSelect.value = 'default';

        const makeHabitCheckbox = document.getElementById('make-habit-checkbox');
        const habitSettings = document.getElementById('habit-settings');

        if (makeHabitCheckbox) {
            makeHabitCheckbox.checked = false;
        }

        if (habitSettings) {
            habitSettings.style.display = 'none';
            habitSettings.classList.remove('show', 'hide');
        }

        taskCreationBox.classList.remove('has-habit');

        taskTitle.style.height = 'auto';
        taskDescription.style.height = 'auto';
    }

// Updated renderTasks function to use the new system when no specific view is set
    function renderTasks() {
        console.log(`🎨 Rendering ${tasks.length} tasks (default view)...`);

        // If we're in a specific view, use that rendering
        if (currentView.type !== 'inbox') {
            const filteredTasks = filterTasksByCurrentView(tasks);
            renderTasksInCurrentView(filteredTasks);
            return;
        }

        // Default inbox view with default sorting
        const taskList = document.getElementById("task-list");
        taskList.innerHTML = '';

        if (tasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#888';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.padding = '20px';
            emptyMessage.textContent = 'No tasks yet. Create your first task above!';
            taskList.appendChild(emptyMessage);
            return;
        }

        // Sort tasks: completed at bottom, then by date, then by priority (default behavior)
        const sortedTasks = [...tasks].sort((a, b) => {
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            if (a.date && b.date) {
                return new Date(a.date) - new Date(b.date);
            } else if (a.date) {
                return -1;
            } else if (b.date) {
                return 1;
            }

            const priorityOrder = {high: 0, medium: 1, low: 2, 'N/A': 3};
            return (priorityOrder[a.priority] || 3) - (priorityOrder[b.priority] || 3);
        });

        sortedTasks.forEach(task => {
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
        });

        console.log(`✅ Rendered ${sortedTasks.length} task elements (default view)`);
    }

    function createTaskElement(task) {
        const taskItem = document.createElement("li");

        // Fixed priority colors - using lowercase keys to match stored values
        const priorityColors = {
            'high': '#ff5555',    // Red for high priority
            'medium': '#ffa500',  // Orange for medium priority
            'low': '#1e3a8a',     // Blue for low priority
            'N/A': '#1e3a8a'      // Blue for no priority
        };

        // Use task.priority directly (it's stored in lowercase)
        taskItem.style.borderLeftColor = priorityColors[task.priority] || '#1e3a8a';

        if (task.completed) {
            taskItem.style.opacity = '0.6';
        }

        const taskItemInner = document.createElement("div");
        taskItemInner.className = "task-item";

        const taskRing = document.createElement("div");
        taskRing.className = task.completed ? "task-ring completed" : "task-ring";
        taskRing.addEventListener("click", function () {
            toggleTaskCompletion(task, taskRing, taskItem);
        });

        const taskContent = document.createElement("div");
        taskContent.style.width = "100%";

        const formattedDueDate = formatDate(task.date);
        const formattedReminderDate = formatDate(task.reminder);

        const titleDiv = createEditableField('title', task.title, 'task-title', task);
        const descDiv = createEditableField('description', task.description, 'task-desc', task);

        const metadata = document.createElement("div");
        metadata.classList.add("task-metadata");

        const dateDiv = createEditableField('date', formattedDueDate, '', task, 'Date: ');
        const reminderDiv = createEditableField('reminder', formattedReminderDate, '', task, 'Reminder: ');
        const priorityDiv = createEditableSelectField('priority', task.priority, task, ['low', 'medium', 'high'], 'Priority: ');
        const listDiv = createEditableSelectField('list', task.list, task, ['N/A', ...lists], 'List: ');

        taskItem.dataset.id = task.id;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.className = "delete-task";
        deleteButton.addEventListener("click", function () {
            deleteTask(task.id, taskItem);
        });

        metadata.append(dateDiv, reminderDiv, priorityDiv, listDiv);
        taskContent.append(titleDiv, descDiv, metadata);

        taskItemInner.append(taskRing, taskContent);
        taskItem.append(taskItemInner, deleteButton);

        return taskItem;
    }

    // ----------------------
    // List Management
    // ----------------------
    function setupListManagementEvents() {
        addListBtn.addEventListener("click", addNewList);
    }

    function addNewList() {
        const newListName = prompt("Enter a name for the new list:");

        if (newListName && newListName.trim()) {
            if (lists.includes(newListName.trim())) {
                alert("A list with this name already exists");
                return;
            }

            lists.push(newListName.trim());
            saveLists();
            renderLists();
            updateListDropdown();

            console.log(`✅ Added new list "${newListName}" for ${window.userDataManager.currentUser.email}`);
        }
    }

    function renderLists() {
        listsContainer.innerHTML = '';

        lists.forEach((listName, index) => {
            const listItem = document.createElement("div");
            listItem.classList.add("list-item");

            const listNameEl = document.createElement("span");
            listNameEl.className = "list-name";
            listNameEl.dataset.index = index;
            listNameEl.textContent = listName;
            listNameEl.addEventListener('click', function () {
                filterTasksByList(listName);
            });

            const listActions = document.createElement("div");
            listActions.className = "list-actions";

            const editBtn = document.createElement("button");
            editBtn.className = "list-edit-btn";
            editBtn.dataset.index = index;
            editBtn.textContent = "Edit";
            editBtn.addEventListener('click', function () {
                editList(index, listItem);
            });

            const deleteBtn = document.createElement("button");
            deleteBtn.className = "list-delete-btn";
            deleteBtn.dataset.index = index;
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener('click', function () {
                deleteList(index, listName);
            });

            listActions.append(editBtn, deleteBtn);
            listItem.append(listNameEl, listActions);
            listsContainer.appendChild(listItem);
        });
    }

    function editList(index, listItem) {
        const listNameEl = listItem.querySelector('.list-name');
        const currentName = lists[index];

        const editInput = document.createElement("input");
        editInput.className = "list-edit-input";
        editInput.value = currentName;

        listNameEl.style.display = 'none';
        listItem.insertBefore(editInput, listNameEl);
        editInput.focus();

        editInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                saveListEdit(index, editInput.value, listItem, listNameEl, editInput);
            } else if (e.key === 'Escape') {
                cancelListEdit(listItem, listNameEl, editInput);
            }
        });

        editInput.addEventListener('blur', function () {
            saveListEdit(index, editInput.value, listItem, listNameEl, editInput);
        });
    }

    function saveListEdit(index, newName, listItem, listNameEl, editInput) {
        newName = newName.trim();

        if (newName && newName !== lists[index]) {
            if (lists.includes(newName)) {
                alert("A list with this name already exists");
                cancelListEdit(listItem, listNameEl, editInput);
                return;
            }

            const oldName = lists[index];
            lists[index] = newName;

            updateTasksWithNewListName(oldName, newName);
            saveLists();
            updateListDropdown();

            console.log(`✅ Renamed list "${oldName}" to "${newName}" for ${window.userDataManager.currentUser.email}`);
        }

        listNameEl.textContent = lists[index];
        listNameEl.style.display = '';
        editInput.remove();
    }

    function cancelListEdit(listItem, listNameEl, editInput) {
        listNameEl.style.display = '';
        editInput.remove();
    }

    function deleteList(index, listName) {
        if (['Personal', 'Work', 'Shopping'].includes(listName)) {
            alert('Cannot delete default lists');
            return;
        }

        if (confirm(`Are you sure you want to delete the list "${listName}"?`)) {
            lists.splice(index, 1);
            updateTasksWithDeletedList(listName);
            saveLists();
            renderLists();
            updateListDropdown();

            console.log(`✅ Deleted list "${listName}" for ${window.userDataManager.currentUser.email}`);
        }
    }

    function updateTasksWithNewListName(oldName, newName) {
        let tasksUpdated = false;

        tasks.forEach(task => {
            if (task.list === oldName) {
                task.list = newName;
                tasksUpdated = true;
            }
        });

        if (tasksUpdated) {
            saveTasks();
            renderTasks();
        }
    }

    function updateTasksWithDeletedList(deletedListName) {
        let tasksUpdated = false;

        tasks.forEach(task => {
            if (task.list === deletedListName) {
                task.list = 'N/A';
                tasksUpdated = true;
            }
        });

        if (tasksUpdated) {
            saveTasks();
            renderTasks();
        }
    }

    function updateListDropdown() {
        while (listSelect.options.length > 1) {
            listSelect.remove(1);
        }

        lists.forEach(listName => {
            const option = document.createElement("option");
            option.value = listName;
            option.textContent = listName;
            listSelect.appendChild(option);
        });
    }

    // ----------------------
    // Navigation and Filtering
    // ----------------------




    function setupNavigationEvents() {
        // Today view - first link (nth-child(1))
        document.querySelector(".menu a:nth-child(1)").addEventListener("click", function(e) {
            e.preventDefault();
            currentView = { type: 'today', name: 'Today', listName: null };
            filterTodayTasks();
        });

        // Next 7 Days view - second link (nth-child(2))
        document.querySelector(".menu a:nth-child(2)").addEventListener("click", function(e) {
            e.preventDefault();
            currentView = { type: 'next7days', name: 'Next 7 Days', listName: null };
            filterNext7DaysTasks();
        });

        // Important view - third link (nth-child(3))
        document.querySelector(".menu a:nth-child(3)").addEventListener("click", function(e) {
            e.preventDefault();
            currentView = { type: 'important', name: 'Important', listName: null };
            filterImportantTasks();
        });

        // Inbox view (All tasks) - fourth link (nth-child(4))
        document.querySelector(".menu a:nth-child(4)").addEventListener("click", function(e) {
            e.preventDefault();
            currentView = { type: 'inbox', name: 'Inbox', listName: null };
            showAllTasks("Inbox");
        });
    }



// New unified rendering function that always creates fresh elements
    function renderTasksInCurrentView(tasksToRender) {
        console.log(`🎨 Rendering ${tasksToRender.length} tasks in ${currentView.name} view...`);

        const taskList = document.getElementById("task-list");
        taskList.innerHTML = '';

        if (tasksToRender.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#888';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.padding = '20px';
            emptyMessage.textContent = `No tasks found for ${currentView.name}. Add a new task to get started.`;
            taskList.appendChild(emptyMessage);
            return;
        }

        // Create fresh task elements
        tasksToRender.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });

        console.log(`✅ Rendered ${tasksToRender.length} task elements in ${currentView.name} view`);
        removeNoTasksMessage();
    }


    // Updated filter functions to set current view
    function filterTodayTasks() {
        updatePageTitle("Today");
        currentView = { type: 'today', name: 'Today', listName: null };

        const today = new Date();
        const todayString = formatDateForComparison(today);

        console.log('Filtering for today:', todayString);

        // Filter from the tasks array instead of DOM manipulation
        const todayTasks = tasks.filter(task => {
            if (!task.date) return false;

            let taskDateString;
            if (task.date.includes('/')) {
                const parts = task.date.split('/');
                if (parts.length === 3) {
                    taskDateString = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            } else if (task.date.includes('-')) {
                taskDateString = task.date;
            }

            return taskDateString === todayString;
        });

        // Re-render with filtered tasks
        renderTasksInCurrentView(todayTasks);

        if (todayTasks.length === 0) {
            showNoTasksMessage("Today");
        } else {
            removeNoTasksMessage();
        }
    }



    function filterNext7DaysTasks() {
        updatePageTitle("Next 7 Days");
        currentView = { type: 'next7days', name: 'Next 7 Days', listName: null };

        const today = new Date();
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);

        const todayString = formatDateForComparison(today);
        const next7DaysString = formatDateForComparison(next7Days);

        console.log('Filtering for next 7 days:', todayString, 'to', next7DaysString);

        // Filter from the tasks array instead of DOM manipulation
        const next7DaysTasks = tasks.filter(task => {
            if (!task.date) return false;

            let taskDateString;
            if (task.date.includes('/')) {
                const parts = task.date.split('/');
                if (parts.length === 3) {
                    taskDateString = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                }
            } else if (task.date.includes('-')) {
                taskDateString = task.date;
            }

            return taskDateString && taskDateString >= todayString && taskDateString <= next7DaysString;
        });

        // Re-render with filtered tasks
        renderTasksInCurrentView(next7DaysTasks);

        if (next7DaysTasks.length === 0) {
            showNoTasksMessage("Next 7 Days");
        } else {
            removeNoTasksMessage();
        }
    }

    function filterImportantTasks() {
        updatePageTitle("Important");
        currentView = { type: 'important', name: 'Important', listName: null };

        // Filter from the tasks array instead of DOM manipulation
        const importantTasks = tasks.filter(task => {
            const taskPriority = (task.priority || '').toLowerCase();
            return taskPriority === 'high';
        });

        // Re-render with filtered tasks
        renderTasksInCurrentView(importantTasks);

        if (importantTasks.length === 0) {
            showNoTasksMessage("Important");
        } else {
            removeNoTasksMessage();
        }
    }


    // Debug function to check current view
    function debugCurrentView() {
        console.log('🔍 Current View State:');
        console.log('Type:', currentView.type);
        console.log('Name:', currentView.name);
        console.log('List Name:', currentView.listName);
        console.log('Total tasks:', tasks.length);

        // Check how many tasks would be shown in current view
        const filteredTasks = filterTasksByCurrentView(tasks);
        console.log(`Tasks that should show in ${currentView.name}:`, filteredTasks.length);

        return {
            currentView,
            totalTasks: tasks.length,
            filteredTasks: filteredTasks.length,
            filteredTaskTitles: filteredTasks.map(t => t.title)
        };
    }


    function filterTasksByDate(dateString, viewTitle) {
        updatePageTitle(viewTitle);

        const taskItems = document.querySelectorAll(".task-item");
        let hasVisibleTasks = false;

        taskItems.forEach(taskItem => {
            const parentLi = taskItem.closest('li');
            const dateElement = taskItem.querySelector("[data-field='date'] .display-text");

            if (dateElement) {
                const taskDateText = dateElement.textContent.replace("Date: ", "");

                if (taskDateText !== "N/A") {
                    const dateParts = taskDateText.split('/');
                    if (dateParts.length === 3) {
                        const taskDateFormatted = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

                        if (taskDateFormatted === dateString) {
                            parentLi.style.display = "flex";
                            hasVisibleTasks = true;
                        } else {
                            parentLi.style.display = "none";
                        }
                    } else {
                        parentLi.style.display = "none";
                    }
                } else {
                    parentLi.style.display = "none";
                }
            } else {
                parentLi.style.display = "none";
            }
        });

        if (!hasVisibleTasks) {
            showNoTasksMessage(viewTitle);
        } else {
            removeNoTasksMessage();
        }
    }

    function filterTasksByDateRange(startDateString, endDateString, viewTitle) {
        updatePageTitle(viewTitle);

        const taskItems = document.querySelectorAll(".task-item");
        let hasVisibleTasks = false;

        taskItems.forEach(taskItem => {
            const parentLi = taskItem.closest('li');
            const dateElement = taskItem.querySelector("[data-field='date'] .display-text");

            if (dateElement) {
                const taskDateText = dateElement.textContent.replace("Date: ", "");

                if (taskDateText !== "N/A") {
                    const dateParts = taskDateText.split('/');
                    if (dateParts.length === 3) {
                        const taskDateFormatted = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

                        if (taskDateFormatted >= startDateString && taskDateFormatted <= endDateString) {
                            parentLi.style.display = "flex";
                            hasVisibleTasks = true;
                        } else {
                            parentLi.style.display = "none";
                        }
                    } else {
                        parentLi.style.display = "none";
                    }
                } else {
                    parentLi.style.display = "none";
                }
            } else {
                parentLi.style.display = "none";
            }
        });

        if (!hasVisibleTasks) {
            showNoTasksMessage(viewTitle);
        } else {
            removeNoTasksMessage();
        }
    }

    function filterTasksByPriority(priorityValue, viewTitle) {
        updatePageTitle(viewTitle);

        const taskItems = document.querySelectorAll(".task-item");
        let hasVisibleTasks = false;

        taskItems.forEach(taskItem => {
            const parentLi = taskItem.closest('li');
            const priorityElement = taskItem.querySelector("[data-field='priority'] .display-text");

            if (priorityElement) {
                const taskPriority = priorityElement.textContent.replace("Priority: ", "").toLowerCase();

                if (taskPriority === priorityValue) {
                    parentLi.style.display = "flex";
                    hasVisibleTasks = true;
                } else {
                    parentLi.style.display = "none";
                }
            } else {
                parentLi.style.display = "none";
            }
        });

        if (!hasVisibleTasks) {
            showNoTasksMessage(viewTitle);
        } else {
            removeNoTasksMessage();
        }
    }

    function filterTasksByList(listName) {
        updatePageTitle(listName);
        currentView = { type: 'list', name: listName, listName: listName };

        // Clear active states from all list names
        document.querySelectorAll('.list-name').forEach(el => {
            el.classList.remove('active');
        });

        // Set active state for clicked list
        document.querySelectorAll('.list-name').forEach(el => {
            if (el.textContent === listName) {
                el.classList.add('active');
            }
        });

        // Filter from the tasks array instead of DOM manipulation
        const listTasks = tasks.filter(task => task.list === listName);

        // Re-render with filtered tasks
        renderTasksInCurrentView(listTasks);

        if (listTasks.length === 0) {
            showNoTasksMessage(listName);
        } else {
            removeNoTasksMessage();
        }
    }


    function showAllTasks(viewTitle) {
        updatePageTitle(viewTitle);
        currentView = { type: 'inbox', name: 'Inbox', listName: null };

        console.log(`📥 Showing all tasks for ${viewTitle}. Total tasks: ${tasks.length}`);

        // Clear any existing active states
        document.querySelectorAll('.list-name').forEach(el => {
            el.classList.remove('active');
        });

        // Re-render with all tasks
        renderTasksInCurrentView(tasks);

        if (tasks.length === 0) {
            showNoTasksMessage(viewTitle);
        } else {
            removeNoTasksMessage();
        }
    }
// Debug function to check navigation setup
    function debugNavigation() {
        console.log('🔍 Debug Navigation Setup:');

        const firstMenuSection = document.querySelector(".menu");
        const menuLinks = firstMenuSection.querySelectorAll("a");

        console.log(`Found ${menuLinks.length} navigation links:`);

        menuLinks.forEach((link, index) => {
            const text = link.textContent.trim();
            const icon = link.querySelector('i');
            const iconClass = icon ? icon.className : 'No icon';

            console.log(`${index + 1}. "${text}" - Icon: ${iconClass}`);
        });

        console.log('Total tasks in array:', tasks.length);
        console.log('Tasks:', tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
    }

// Updated utility functions that were causing issues
    function updatePageTitle(newTitle) {
        const titleElement = document.querySelector(".today-title");
        if (titleElement) {
            titleElement.textContent = newTitle;
        }
    }

    function showNoTasksMessage(viewTitle) {
        removeNoTasksMessage();

        const messageDiv = document.createElement("div");
        messageDiv.id = "no-tasks-message";
        messageDiv.style.cssText = "text-align: center; margin-top: 30px; color: #888; font-size: 16px; padding: 20px;";
        messageDiv.innerHTML = `No tasks found for <strong>${viewTitle}</strong>.<br>Add a new task to get started.`;

        const taskListContainer = document.querySelector(".task-list-container");
        if (taskListContainer) {
            taskListContainer.appendChild(messageDiv);
        }
    }

    function removeNoTasksMessage() {
        const existingMessage = document.getElementById("no-tasks-message");
        if (existingMessage) {
            existingMessage.remove();
        }
    }

    // ----------------------
    // Sorting
    // ----------------------
    function setupSortingEvents() {
        // Add sorting container to the DOM
        const taskListContainer = document.querySelector(".task-list-container");
        const taskListHeading = taskListContainer.querySelector("h2");

        // Check if sorting container already exists
        let sortingContainer = taskListContainer.querySelector(".sorting-container");
        if (!sortingContainer) {
            sortingContainer = document.createElement("div");
            sortingContainer.classList.add("sorting-container");
            taskListHeading.after(sortingContainer);
        }

        const sortButton = document.createElement("button");
        sortButton.classList.add("sort-button");
        sortButton.innerHTML = '<i class="fas fa-sort"></i> Sort';
        sortingContainer.appendChild(sortButton);

        // Remove any existing sort menu
        const existingSortMenu = document.querySelector(".sort-menu");
        if (existingSortMenu) {
            existingSortMenu.remove();
        }

        const sortMenu = document.createElement("div");
        sortMenu.classList.add("sort-menu");
        sortMenu.innerHTML = `
        <div class="sort-option" data-sort="date">Sort by Date</div>
        <div class="sort-option" data-sort="priority">Sort by Priority</div>
        <div class="sort-option" data-sort="list">Sort by List</div>
    `;
        document.body.appendChild(sortMenu);

        sortButton.addEventListener("click", function (e) {
            e.stopPropagation();
            const rect = sortButton.getBoundingClientRect();
            sortMenu.style.top = `${rect.bottom + window.scrollY + 5}px`;
            sortMenu.style.left = `${rect.left + window.scrollX}px`;
            sortMenu.classList.toggle("visible");
        });

        document.addEventListener("click", function (e) {
            if (!sortMenu.contains(e.target) && !sortButton.contains(e.target)) {
                sortMenu.classList.remove("visible");
            }
        });

        sortMenu.addEventListener("click", function (e) {
            e.stopPropagation();
            if (e.target.classList.contains("sort-option")) {
                const sortType = e.target.dataset.sort;

                // Update active state
                document.querySelectorAll(".sort-option").forEach(opt => {
                    opt.classList.remove("active");
                });
                e.target.classList.add("active");

                // Perform sort
                sortTasks(sortType);
                sortMenu.classList.remove("visible");

                console.log(`Sorted tasks by: ${sortType}`);
            }
        });
    }

    function sortTasks(sortType) {
        console.log(`Sorting ${tasks.length} tasks by: ${sortType} in view: ${currentView.name}`);

        // Get tasks for current view first
        const currentViewTasks = filterTasksByCurrentView(tasks);

        // Then sort them
        let sortedTasks = [...currentViewTasks];

        switch(sortType) {
            case "date":
                sortedTasks.sort((a, b) => {
                    if (!a.date && !b.date) return 0;
                    if (!a.date) return 1;
                    if (!b.date) return -1;

                    const dateA = convertDateForSorting(a.date);
                    const dateB = convertDateForSorting(b.date);
                    return dateA - dateB;
                });
                break;

            case "priority":
                sortedTasks.sort((a, b) => {
                    const priorityOrder = {
                        "high": 1, "High": 1,
                        "medium": 2, "Medium": 2,
                        "low": 3, "Low": 3
                    };

                    const priorityA = priorityOrder[a.priority] || 4;
                    const priorityB = priorityOrder[b.priority] || 4;
                    return priorityA - priorityB;
                });
                break;

            case "list":
                sortedTasks.sort((a, b) => {
                    const listA = a.list || "Z";
                    const listB = b.list || "Z";
                    return listA.localeCompare(listB);
                });
                break;

            default:
                console.log("Unknown sort type:", sortType);
                return;
        }

        console.log(`Sorted and filtered tasks: ${sortedTasks.length} tasks for ${currentView.name}`);

        // Re-render with sorted tasks
        renderTasksInCurrentView(sortedTasks);
    }

// Function to filter tasks based on current view
    function filterTasksByCurrentView(tasksToFilter) {
        switch(currentView.type) {
            case 'today':
                const today = new Date();
                const todayString = formatDateForComparison(today);
                return tasksToFilter.filter(task => {
                    if (!task.date) return false;

                    let taskDateString;
                    if (task.date.includes('/')) {
                        const parts = task.date.split('/');
                        if (parts.length === 3) {
                            taskDateString = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        }
                    } else if (task.date.includes('-')) {
                        taskDateString = task.date;
                    }

                    return taskDateString === todayString;
                });

            case 'next7days':
                const startDate = new Date();
                const endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 7);

                const startDateString = formatDateForComparison(startDate);
                const endDateString = formatDateForComparison(endDate);

                return tasksToFilter.filter(task => {
                    if (!task.date) return false;

                    let taskDateString;
                    if (task.date.includes('/')) {
                        const parts = task.date.split('/');
                        if (parts.length === 3) {
                            taskDateString = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                        }
                    } else if (task.date.includes('-')) {
                        taskDateString = task.date;
                    }

                    return taskDateString && taskDateString >= startDateString && taskDateString <= endDateString;
                });

            case 'important':
                return tasksToFilter.filter(task => {
                    const taskPriority = (task.priority || '').toLowerCase();
                    return taskPriority === 'high';
                });

            case 'list':
                return tasksToFilter.filter(task => task.list === currentView.listName);

            case 'inbox':
            default:
                return tasksToFilter; // Show all tasks
        }
    }


    // Enhanced renderSortedTasks that respects current view
    function renderSortedTasksInCurrentView(sortedTasks) {
        const taskList = document.getElementById("task-list");
        taskList.innerHTML = '';

        if (sortedTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#888';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.padding = '20px';
            emptyMessage.textContent = `No tasks found for ${currentView.name}. Add a new task to get started.`;
            taskList.appendChild(emptyMessage);
            return;
        }

        // Create task elements in the sorted order
        sortedTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });

        console.log(`✅ Rendered ${sortedTasks.length} sorted tasks in ${currentView.name} view`);

        // Remove any existing "no tasks" messages
        removeNoTasksMessage();
    }


    function renderSortedTasks(sortedTasks) {
        const taskList = document.getElementById("task-list");
        taskList.innerHTML = '';

        if (sortedTasks.length === 0) {
            const emptyMessage = document.createElement('li');
            emptyMessage.className = 'empty-message';
            emptyMessage.style.textAlign = 'center';
            emptyMessage.style.color = '#888';
            emptyMessage.style.fontStyle = 'italic';
            emptyMessage.style.padding = '20px';
            emptyMessage.textContent = 'No tasks yet. Create your first task above!';
            taskList.appendChild(emptyMessage);
            return;
        }

        // Create task elements in the sorted order
        sortedTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            taskList.appendChild(taskElement);
        });

        console.log(`Rendered ${sortedTasks.length} sorted tasks`);
    }

    function convertDateForSorting(dateString) {
        if (!dateString || dateString === 'N/A') {
            return new Date('9999-12-31'); // Far future date for sorting
        }

        let date;

        // Handle DD/MM/YYYY format
        if (dateString.includes('/')) {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                // Convert DD/MM/YYYY to MM/DD/YYYY for Date constructor
                date = new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }
        // Handle YYYY-MM-DD format
        else if (dateString.includes('-')) {
            date = new Date(dateString);
        }
        // Handle other formats
        else {
            date = new Date(dateString);
        }

        // Return timestamp, or far future if invalid
        return isNaN(date.getTime()) ? new Date('9999-12-31').getTime() : date.getTime();
    }

// Enhanced addTask function to ensure consistent priority values
    function normalizeTaskPriority(priority) {
        if (!priority || priority === 'priority') return 'medium';

        // Normalize to lowercase for consistency in storage
        const normalized = priority.toLowerCase();

        // Ensure it's a valid priority
        if (['low', 'medium', 'high'].includes(normalized)) {
            return normalized;
        }

        return 'medium'; // Default fallback
    }

    // ----------------------
    // Field Editing
    // ----------------------
    function createEditableField(fieldName, value, className, task, prefix = '') {
        const containerDiv = document.createElement("div");
        if (className) containerDiv.classList.add(className);

        const editableContent = document.createElement("div");
        editableContent.className = "editable-content";
        editableContent.dataset.field = fieldName;

        const displayText = document.createElement("div");
        displayText.className = "display-text";
        displayText.textContent = prefix + (value || 'N/A');

        const isTextArea = fieldName === 'description' || (value && value.length > 30);
        const editInput = isTextArea ?
            document.createElement("textarea") :
            document.createElement("input");

        editInput.className = isTextArea ? "expanding-input" : "edit-input";
        if (fieldName === 'title') {
            editInput.classList.add("task-title-edit");
        }

        if (fieldName === 'date' || fieldName === 'reminder') {
            editInput.type = "date";
            editInput.value = convertToInputDateFormat(value);
        } else {
            editInput.value = value || '';
        }

        editInput.style.display = "none";

        displayText.addEventListener("click", function (e) {
            e.stopPropagation();
            displayText.style.display = "none";
            editInput.style.display = "block";

            if (isTextArea) {
                setTimeout(() => {
                    editInput.classList.add("show");
                    autoExpand(editInput);
                    editInput.addEventListener('input', () => autoExpand(editInput));
                }, 10);
            }

            editInput.focus();

            function handleClickAway(e) {
                if (e.target !== editInput && e.target !== displayText) {
                    saveFieldEdit(fieldName, editInput.value, task, displayText, prefix);
                    editInput.classList.remove("show");

                    if (isTextArea) {
                        setTimeout(() => {
                            if (editInput.parentNode) {
                                editInput.style.display = "none";
                                displayText.style.display = "block";
                            }
                        }, 300);
                    } else {
                        editInput.style.display = "none";
                        displayText.style.display = "block";
                    }

                    document.removeEventListener("click", handleClickAway);
                }
            }

            setTimeout(() => {
                document.addEventListener("click", handleClickAway);
            }, 10);
        });

        editInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey && !isTextArea) {
                e.preventDefault();
                saveFieldEdit(fieldName, this.value, task, displayText, prefix);
                editInput.classList.remove("show");

                setTimeout(() => {
                    editInput.style.display = "none";
                    displayText.style.display = "block";
                }, isTextArea ? 300 : 0);

                document.removeEventListener("click", function () {});
            } else if (e.key === "Escape") {
                e.preventDefault();
                editInput.classList.remove("show");

                setTimeout(() => {
                    displayText.style.display = "block";
                    editInput.style.display = "none";
                    editInput.value = task[fieldName] || '';
                }, isTextArea ? 300 : 0);

                document.removeEventListener("click", function () {});
            }
        });

        editableContent.append(displayText, editInput);
        containerDiv.appendChild(editableContent);

        return containerDiv;
    }

    function createEditableSelectField(fieldName, value, task, options, prefix = '') {
        const containerDiv = document.createElement("div");

        const editableContent = document.createElement("div");
        editableContent.className = "editable-content";
        editableContent.dataset.field = fieldName;

        const displayText = document.createElement("div");
        displayText.className = "display-text";

        // Display capitalized version but keep lowercase in data
        if (fieldName === 'priority' && value) {
            const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            displayText.textContent = prefix + capitalizedValue;
        } else {
            displayText.textContent = prefix + (value || 'N/A');
        }

        const selectInput = document.createElement("select");
        selectInput.className = "edit-input";
        selectInput.style.display = "none";

        if (fieldName === 'priority') {
            const priorityOptions = [
                {value: 'low', text: 'Low'},
                {value: 'medium', text: 'Medium'},
                {value: 'high', text: 'High'}
            ];

            priorityOptions.forEach(opt => {
                const option = document.createElement("option");
                option.value = opt.value;  // Store lowercase value
                option.textContent = opt.text;  // Display capitalized text
                if (value === opt.value) {
                    option.selected = true;
                }
                selectInput.appendChild(option);
            });
        } else {
            options.forEach(optionValue => {
                const option = document.createElement("option");
                option.value = optionValue;
                option.textContent = optionValue;
                if (value === optionValue) {
                    option.selected = true;
                }
                selectInput.appendChild(option);
            });
        }

        displayText.addEventListener("click", function (e) {
            e.stopPropagation();
            displayText.style.display = "none";
            selectInput.style.display = "block";
            selectInput.focus();

            function handleClickAway(e) {
                if (e.target !== selectInput && e.target !== displayText) {
                    const selectedValue = selectInput.options[selectInput.selectedIndex].value;
                    saveFieldEdit(fieldName, selectedValue, task, displayText, prefix);
                    document.removeEventListener("click", handleClickAway);
                }
            }

            setTimeout(() => {
                document.addEventListener("click", handleClickAway);
            }, 10);
        });

        selectInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                const selectedValue = this.options[this.selectedIndex].value;
                saveFieldEdit(fieldName, selectedValue, task, displayText, prefix);
                document.removeEventListener("click", function () {});
            } else if (e.key === "Escape") {
                e.preventDefault();
                displayText.style.display = "block";
                selectInput.style.display = "none";
                document.removeEventListener("click", function () {});
            }
        });

        editableContent.append(displayText, selectInput);
        containerDiv.appendChild(editableContent);

        return containerDiv;
    }
    function saveFieldEdit(fieldName, value, task, displayElement, prefix = '') {
        const originalValue = task[fieldName];

        if (typeof value === 'string') {
            value = value.trim();
        }

        if (value === '' || value === null || value === undefined) {
            if (fieldName === 'title') {
                value = 'Untitled';
            } else {
                value = null;
            }
        }

        // Normalize priority values to lowercase for storage
        if (fieldName === 'priority' && value) {
            value = normalizeTaskPriority(value);
        }

        task[fieldName] = value;

        // Update display text
        if ((fieldName === 'date' || fieldName === 'reminder') && value) {
            const formattedDate = formatDate(value);
            displayElement.textContent = prefix + formattedDate;
        } else if (fieldName === 'priority' && value) {
            // Display capitalized version
            const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            displayElement.textContent = prefix + capitalizedValue;
        } else {
            displayElement.textContent = prefix + (value || 'N/A');
        }

        displayElement.style.display = "block";

        const editInput = displayElement.nextElementSibling;
        if (editInput) {
            editInput.style.display = "none";
        }

        // Update task border color when priority changes
        if (fieldName === 'priority') {
            const taskElement = displayElement.closest('li');
            if (taskElement) {
                const priorityColors = {
                    'high': '#ff5555',    // Red for high priority
                    'medium': '#ffa500',  // Orange for medium priority
                    'low': '#1e3a8a',     // Blue for low priority
                    'N/A': '#1e3a8a'      // Blue for no priority
                };
                taskElement.style.borderLeftColor = priorityColors[value] || '#1e3a8a';
            }
        }

        // Save changes if value actually changed
        if (originalValue !== value) {
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex][fieldName] = value;
                saveTasks();
            }
        }
    }

    // ----------------------
    // Utility Functions
    // ----------------------
    function formatDate(dateString) {
        if (!dateString) return 'N/A';

        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            return dateString;
        }

        try {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return `${parts[2]}/${parts[1]}/${parts[0]}`;
            }
        } catch (e) {
            // If any error occurs, return the original string
        }

        return dateString;
    }

    function convertToInputDateFormat(dateString) {
        if (!dateString || dateString === 'N/A') return '';

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        try {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                return `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        } catch (e) {
            // If any error occurs, return empty string
        }

        return '';
    }


// Helper function to format date for comparison (YYYY-MM-DD)
    function formatDateForComparison(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function parseDateString(dateString) {
        if (dateString === 'N/A') return Number.MAX_SAFE_INTEGER;

        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return new Date(year, month - 1, day).getTime();
        }

        return new Date(dateString).getTime();
    }

    function showTaskNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#f44336'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            max-width: 300px;
        `;
        notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'warning' ? 'exclamation-triangle' : 'times'}"></i> ${message}`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Auto-expand textarea based on content
    window.autoExpand = function(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    };

    // Make functions globally available for testing
    window.loadTasks = loadTasks;
    window.saveTasks = saveTasks;
    window.loadLists = loadLists;
    window.saveLists = saveLists;
    window.renderTasks = renderTasks;
    window.renderLists = renderLists;
    window.updateListDropdown = updateListDropdown;

    // Export function for current user
    window.exportUserData = function() {
        if (!window.userDataManager || !window.userDataManager.currentUser) {
            alert('No user logged in');
            return;
        }

        const exportData = window.userDataManager.exportUserData();
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${window.userDataManager.currentUser.name.replace(/\s+/g, '-')}-tasks-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
        showTaskNotification('Data exported successfully!', 'success');
    };

    console.log('✅ Todo app with user-specific storage loaded successfully');
});