// MODIFIED todo.js - Updated to work with user-specific storage
// This replaces your existing todo.js

// Global state
let tasks = [];
let lists = [];

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
            priority: priority.value !== 'priority' ? priority.value : 'medium',
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

        // Re-render tasks
        renderTasks();

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

            // Remove from DOM
            if (taskElement && taskElement.parentNode) {
                taskElement.style.transition = 'all 0.3s ease';
                taskElement.style.opacity = '0';
                taskElement.style.transform = 'translateX(-100%)';

                setTimeout(() => {
                    if (taskElement.parentNode) {
                        taskElement.remove();
                    }
                }, 300);
            }

            // Save changes
            saveTasks();

            console.log(`✅ Task deleted. Tasks: ${originalLength} → ${tasks.length}`);
            showTaskNotification('Task deleted successfully!', 'success');
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

    function renderTasks() {
        console.log(`🎨 Rendering ${tasks.length} tasks...`);
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

        // Sort tasks: completed at bottom, then by date, then by priority
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
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        sortedTasks.forEach(task => {
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
        });

        console.log(`✅ Rendered ${sortedTasks.length} task elements`);
    }

    function createTaskElement(task) {
        const taskItem = document.createElement("li");

        const priorityColors = {
            high: '#ff5555',
            medium: '#ffa500',
            low: '#1e3a8a',
            'N/A': '#1e3a8a'
        };
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
        // Today view
        document.querySelector(".menu a:nth-child(2)").addEventListener("click", function(e) {
            e.preventDefault();
            filterTodayTasks();
        });

        // Next 7 Days view
        document.querySelector(".menu a:nth-child(3)").addEventListener("click", function(e) {
            e.preventDefault();
            filterNext7DaysTasks();
        });

        // Important view
        document.querySelector(".menu a:nth-child(4)").addEventListener("click", function(e) {
            e.preventDefault();
            filterImportantTasks();
        });

        // Inbox view (All tasks)
        document.querySelector(".menu a:nth-child(5)").addEventListener("click", function(e) {
            e.preventDefault();
            showAllTasks("Inbox");
        });

        // Add task link
        document.querySelector(".menu a:nth-child(1)").addEventListener("click", function(e) {
            e.preventDefault();
            taskCreationBox.classList.add("expanded");
            taskTitle.focus();
        });
    }
    function filterTodayTasks() {
        updatePageTitle("Today");

        const today = new Date();
        const todayString = formatDateForComparison(today);

        console.log('Filtering for today:', todayString);

        let hasVisibleTasks = false;

        tasks.forEach(task => {
            const taskElement = document.querySelector(`li[data-id="${task.id}"]`);
            if (!taskElement) return;

            let shouldShow = false;

            if (task.date) {
                // Convert task date to comparison format
                let taskDateString;

                if (task.date.includes('/')) {
                    // Format: DD/MM/YYYY -> YYYY-MM-DD
                    const parts = task.date.split('/');
                    if (parts.length === 3) {
                        taskDateString = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                } else if (task.date.includes('-')) {
                    // Already in YYYY-MM-DD format
                    taskDateString = task.date;
                }

                if (taskDateString === todayString) {
                    shouldShow = true;
                }
            }

            if (shouldShow) {
                taskElement.style.display = "flex";
                hasVisibleTasks = true;
            } else {
                taskElement.style.display = "none";
            }
        });

        if (!hasVisibleTasks) {
            showNoTasksMessage("Today");
        } else {
            removeNoTasksMessage();
        }
    }



    function filterNext7DaysTasks() {
        updatePageTitle("Next 7 Days");

        const today = new Date();
        const next7Days = new Date(today);
        next7Days.setDate(today.getDate() + 7);

        const todayString = formatDateForComparison(today);
        const next7DaysString = formatDateForComparison(next7Days);

        console.log('Filtering for next 7 days:', todayString, 'to', next7DaysString);

        let hasVisibleTasks = false;

        tasks.forEach(task => {
            const taskElement = document.querySelector(`li[data-id="${task.id}"]`);
            if (!taskElement) return;

            let shouldShow = false;

            if (task.date) {
                // Convert task date to comparison format
                let taskDateString;

                if (task.date.includes('/')) {
                    // Format: DD/MM/YYYY -> YYYY-MM-DD
                    const parts = task.date.split('/');
                    if (parts.length === 3) {
                        taskDateString = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                    }
                } else if (task.date.includes('-')) {
                    // Already in YYYY-MM-DD format
                    taskDateString = task.date;
                }

                if (taskDateString && taskDateString >= todayString && taskDateString <= next7DaysString) {
                    shouldShow = true;
                }
            }

            if (shouldShow) {
                taskElement.style.display = "flex";
                hasVisibleTasks = true;
            } else {
                taskElement.style.display = "none";
            }
        });

        if (!hasVisibleTasks) {
            showNoTasksMessage("Next 7 Days");
        } else {
            removeNoTasksMessage();
        }
    }



    function filterImportantTasks() {
        updatePageTitle("Important");

        let hasVisibleTasks = false;

        tasks.forEach(task => {
            const taskElement = document.querySelector(`li[data-id="${task.id}"]`);
            if (!taskElement) return;

            // Check if task has high priority (case insensitive)
            const taskPriority = (task.priority || '').toLowerCase();
            const shouldShow = taskPriority === 'high';

            if (shouldShow) {
                taskElement.style.display = "flex";
                hasVisibleTasks = true;
            } else {
                taskElement.style.display = "none";
            }
        });

        if (!hasVisibleTasks) {
            showNoTasksMessage("Important");
        } else {
            removeNoTasksMessage();
        }
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

        let hasVisibleTasks = false;

        tasks.forEach(task => {
            const taskElement = document.querySelector(`li[data-id="${task.id}"]`);
            if (!taskElement) return;

            const shouldShow = task.list === listName;

            if (shouldShow) {
                taskElement.style.display = "flex";
                hasVisibleTasks = true;
            } else {
                taskElement.style.display = "none";
            }
        });

        if (!hasVisibleTasks) {
            showNoTasksMessage(listName);
        } else {
            removeNoTasksMessage();
        }
    }

    function showAllTasks(viewTitle) {
        updatePageTitle(viewTitle);

        // Show all task elements
        tasks.forEach(task => {
            const taskElement = document.querySelector(`li[data-id="${task.id}"]`);
            if (taskElement) {
                taskElement.style.display = "flex";
            }
        });

        removeNoTasksMessage();
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
        const sortingContainer = document.createElement("div");
        sortingContainer.classList.add("sorting-container");
        taskListHeading.after(sortingContainer);

        const sortButton = document.createElement("button");
        sortButton.classList.add("sort-button");
        sortButton.innerHTML = '<i class="fas fa-sort"></i> Sort';
        sortingContainer.appendChild(sortButton);

        const sortMenu = document.createElement("div");
        sortMenu.classList.add("sort-menu");
        sortMenu.innerHTML = `
            <div class="sort-option" data-sort="date">Sort by date</div>
            <div class="sort-option" data-sort="priority">Sort by priority</div>
            <div class="sort-option" data-sort="list">Sort by list</div>
        `;
        document.body.appendChild(sortMenu);

        sortButton.addEventListener("click", function (e) {
            e.stopPropagation();
            const rect = sortButton.getBoundingClientRect();
            sortMenu.style.top = `${rect.bottom + window.scrollY}px`;
            sortMenu.style.left = `${rect.left + window.scrollX}px`;
            sortMenu.classList.toggle("visible");
        });

        document.addEventListener("click", function () {
            sortMenu.classList.remove("visible");
        });

        sortMenu.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        document.querySelectorAll(".sort-option").forEach(option => {
            option.addEventListener("click", function () {
                const sortType = this.dataset.sort;
                document.querySelectorAll(".sort-option").forEach(opt => {
                    opt.classList.remove("active");
                });
                this.classList.add("active");
                sortTasks(sortType);
                sortMenu.classList.remove("visible");
            });
        });
    }

    function sortTasks(sortType) {
        const taskElements = Array.from(taskList.querySelectorAll("li"));

        taskElements.sort((a, b) => {
            if (sortType === "date") {
                const dateA = a.querySelector("[data-field='date'] .display-text").textContent.replace("Date: ", "");
                const dateB = b.querySelector("[data-field='date'] .display-text").textContent.replace("Date: ", "");

                if (dateA === "N/A" && dateB === "N/A") return 0;
                if (dateA === "N/A") return 1;
                if (dateB === "N/A") return -1;

                return parseDateString(dateA) - parseDateString(dateB);
            } else if (sortType === "priority") {
                const priorityA = a.querySelector("[data-field='priority'] .display-text").textContent.replace("Priority: ", "");
                const priorityB = b.querySelector("[data-field='priority'] .display-text").textContent.replace("Priority: ", "");

                const priorityOrder = {"high": 1, "medium": 2, "low": 3, "N/A": 4};
                return priorityOrder[priorityA] - priorityOrder[priorityB];
            } else if (sortType === "list") {
                const listA = a.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");
                const listB = b.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");
                return listA.localeCompare(listB);
            }
            return 0;
        });

        taskElements.forEach(task => {
            taskList.appendChild(task);
        });
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
        displayText.textContent = prefix + (value || 'N/A');

        const selectInput = document.createElement("select");
        selectInput.className = "edit-input";
        selectInput.style.display = "none";

        if (fieldName === 'priority') {
            const capitalizedOptions = [
                {value: 'Low', text: 'Low'},
                {value: 'Medium', text: 'Medium'},
                {value: 'High', text: 'High'}
            ];

            capitalizedOptions.forEach(opt => {
                const option = document.createElement("option");
                option.value = opt.value;
                option.textContent = opt.text;
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

        task[fieldName] = value;

        if ((fieldName === 'date' || fieldName === 'reminder') && value) {
            const formattedDate = formatDate(value);
            displayElement.textContent = prefix + formattedDate;
        } else if (fieldName === 'priority' && value) {
            const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            displayElement.textContent = prefix + (capitalizedValue || 'N/A');
        } else {
            displayElement.textContent = prefix + (value || 'N/A');
        }

        displayElement.style.display = "block";

        const editInput = displayElement.nextElementSibling;
        if (editInput) {
            editInput.style.display = "none";
        }

        if (fieldName === 'priority') {
            const taskElement = displayElement.closest('li');
            if (taskElement) {
                const priorityColors = {
                    High: '#ff5555',
                    Medium: '#ffa500',
                    Low: '#1e3a8a',
                    'N/A': '#1e3a8a'
                };
                taskElement.style.borderLeftColor = priorityColors[value] || '#1e3a8a';
            }
        }

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