// Enhanced todo.js with calendar integration and unified database
// Global state
let tasks = [];
let lists = [];


// Pomodoro navigation
const pomodoroLink = document.getElementById('pomodoro-link');
if (pomodoroLink) {
    pomodoroLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'Cal.html#pomodoro';
    });
}

// Wait for DOM to be fully loaded before executing any code
document.addEventListener("DOMContentLoaded", function() {
    // DOM Elements
    // Task creation elements
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

    // List management elements
    const listsContainer = document.getElementById("lists-container");
    const addListBtn = document.getElementById("add-list-btn");

    // Add sorting container to the DOM
    const taskListContainer = document.querySelector(".task-list-container");
    const taskListHeading = taskListContainer.querySelector("h2");
    const sortingContainer = document.createElement("div");
    sortingContainer.classList.add("sorting-container");
    taskListHeading.after(sortingContainer);

    // Create sort button with icon
    const sortButton = document.createElement("button");
    sortButton.classList.add("sort-button");
    sortButton.innerHTML = '<i class="fas fa-sort"></i> Sort';
    sortingContainer.appendChild(sortButton);

    // Create sort menu
    const sortMenu = document.createElement("div");
    sortMenu.classList.add("sort-menu");
    sortMenu.innerHTML = `
        <div class="sort-option" data-sort="date">Sort by date</div>
        <div class="sort-option" data-sort="priority">Sort by priority</div>
        <div class="sort-option" data-sort="list">Sort by list</div>
    `;
    document.body.appendChild(sortMenu);

    // Initialize the application
    initApp();

    // --------------------------
    // Application Initialization
    // --------------------------
    async function initApp() {
        console.log('🚀 Initializing Todo App...');

        // Initialize database first if available
        if (window.taskDB && !window.taskDB.isReady) {
            try {
                await window.taskDB.init();
                console.log('✅ Database initialized');
            } catch (error) {
                console.error('❌ Database initialization failed:', error);
            }
        }

        // Load saved data
        await loadLists();
        await loadTasks();

        // Set up event listeners
        setupTaskCreationEvents();
        setupSortingEvents();
        setupListManagementEvents();
        setupNavigationEvents();

        console.log(`📊 App initialized with ${tasks.length} tasks and ${lists.length} lists`);
    }

    // ----------------------
    // Event Setup Functions
    // ----------------------
    function setupTaskCreationEvents() {
        // Task creation box toggling
        const taskCreationHeader = taskCreationBox.querySelector("h3");

        // Click on header to toggle box
        taskCreationHeader.addEventListener("click", function () {
            taskCreationBox.classList.toggle("expanded");
            if (taskCreationBox.classList.contains("expanded")) {
                taskTitle.focus();
            }
        });

        // Focus on title expands the box
        taskTitle.addEventListener("focus", function () {
            taskCreationBox.classList.add("expanded");
        });

        // Clicking in task box keeps it expanded
        taskCreationBox.addEventListener("click", function (e) {
            if (e.target !== taskCreationHeader) {
                taskCreationBox.classList.add("expanded");
            }
        });

        // Click outside collapses box if title is empty
        document.addEventListener("click", function (e) {
            if (!taskCreationBox.contains(e.target) && taskTitle.value.trim() === '') {
                taskCreationBox.classList.remove("expanded");
            }
        });

        // Add task button click handler
        addTaskButton.addEventListener("click", addTask);

        // Cancel task button click handler
        cancelTaskButton.addEventListener("click", function () {
            // Reset form
            clearTaskForm();
            // Collapse box
            taskCreationBox.classList.remove("expanded");
        });

        // Auto-expand textareas when typing
        taskTitle.addEventListener('input', () => autoExpand(taskTitle));
        taskDescription.addEventListener('input', () => autoExpand(taskDescription));

        // Allow pressing Enter in task title to add task or expand box
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

        // Format date inputs on change (just for feedback)
        dueDate.addEventListener('change', function () {
            const dateValue = this.value;
            if (dateValue) {
                const formattedDate = formatDate(dateValue);
                console.log(`Date will be saved as: ${formattedDate}`);
            }
        });

        reminder.addEventListener('change', function () {
            const dateValue = this.value;
            if (dateValue) {
                const formattedDate = formatDate(dateValue);
                console.log(`Reminder will be saved as: ${formattedDate}`);
            }
        });

        // NEW: Habit creation functionality
        setupHabitCreationEvents();
    }

    // NEW: Setup habit creation events
    function setupHabitCreationEvents() {
        const makeHabitCheckbox = document.getElementById('make-habit-checkbox');
        const habitSettings = document.getElementById('habit-settings');
        const habitFrequencySelect = document.getElementById('habit-frequency-select');
        const habitTargetInput = document.getElementById('habit-target-input');
        const habitUnitSelect = document.getElementById('habit-unit-select');
        const habitCategorySelect = document.getElementById('habit-category-select');

        // Toggle habit settings visibility
        if (makeHabitCheckbox) {
            makeHabitCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    habitSettings.style.display = 'block';
                    habitSettings.classList.add('show');
                    taskCreationBox.classList.add('has-habit');

                    // Auto-set some smart defaults based on task content
                    autoSetHabitDefaults();
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

        // Smart defaults based on task title/description
        function autoSetHabitDefaults() {
            const title = taskTitle.value.toLowerCase();
            const description = taskDescription.value.toLowerCase();
            const content = title + ' ' + description;

            // Set category based on keywords
            if (content.includes('exercise') || content.includes('workout') || content.includes('run') ||
                content.includes('gym') || content.includes('water') || content.includes('sleep')) {
                habitCategorySelect.value = 'health';
            } else if (content.includes('read') || content.includes('study') || content.includes('learn') ||
                content.includes('course') || content.includes('book')) {
                habitCategorySelect.value = 'learning';
            } else if (content.includes('work') || content.includes('project') || content.includes('task') ||
                content.includes('meeting') || content.includes('email')) {
                habitCategorySelect.value = 'productivity';
            } else if (content.includes('call') || content.includes('friend') || content.includes('family') ||
                content.includes('social')) {
                habitCategorySelect.value = 'social';
            } else {
                habitCategorySelect.value = 'personal';
            }

            // Set unit based on keywords
            if (content.includes('minute') || content.includes('min')) {
                habitUnitSelect.value = 'minutes';
                const match = content.match(/(\d+)\s*min/);
                if (match) habitTargetInput.value = match[1];
            } else if (content.includes('hour') || content.includes('hr')) {
                habitUnitSelect.value = 'hours';
                const match = content.match(/(\d+)\s*hour/);
                if (match) habitTargetInput.value = match[1];
            } else if (content.includes('page') || content.includes('pages')) {
                habitUnitSelect.value = 'pages';
                const match = content.match(/(\d+)\s*page/);
                if (match) habitTargetInput.value = match[1];
            } else if (content.includes('glass') || content.includes('water') || content.includes('drink')) {
                habitUnitSelect.value = 'glasses';
                const match = content.match(/(\d+)\s*glass/);
                if (match) habitTargetInput.value = match[1];
            } else if (content.includes('step') || content.includes('walk')) {
                habitUnitSelect.value = 'steps';
                const match = content.match(/(\d+)\s*step/);
                if (match) habitTargetInput.value = match[1];
            }
        }

        // Update smart defaults when title changes
        taskTitle.addEventListener('input', function() {
            if (makeHabitCheckbox && makeHabitCheckbox.checked) {
                autoSetHabitDefaults();
            }
        });

        taskDescription.addEventListener('input', function() {
            if (makeHabitCheckbox && makeHabitCheckbox.checked) {
                autoSetHabitDefaults();
            }
        });
    }

    function setupSortingEvents() {
        // Toggle sort menu visibility when sort button is clicked
        sortButton.addEventListener("click", function (e) {
            e.stopPropagation();

            // Position the menu below the sort button
            const rect = sortButton.getBoundingClientRect();
            sortMenu.style.top = `${rect.bottom + window.scrollY}px`;
            sortMenu.style.left = `${rect.left + window.scrollX}px`;

            sortMenu.classList.toggle("visible");
        });

        // Hide sort menu when clicking outside
        document.addEventListener("click", function () {
            sortMenu.classList.remove("visible");
        });

        // Prevent menu from closing when clicking inside it
        sortMenu.addEventListener("click", function (e) {
            e.stopPropagation();
        });

        // Sorting functionality
        document.querySelectorAll(".sort-option").forEach(option => {
            option.addEventListener("click", function () {
                const sortType = this.dataset.sort;

                // Mark active sort option
                document.querySelectorAll(".sort-option").forEach(opt => {
                    opt.classList.remove("active");
                });
                this.classList.add("active");

                // Sort tasks
                sortTasks(sortType);

                // Hide menu after selection
                sortMenu.classList.remove("visible");
            });
        });
    }

    function setupListManagementEvents() {
        // Add a new list
        addListBtn.addEventListener("click", addNewList);
    }

    function setupNavigationEvents() {
        // Navigation between different views
        function updateActiveNavItem(viewName) {
            // Remove active class from all navigation items
            document.querySelectorAll(".menu a, .list-name").forEach(item => {
                item.classList.remove("active");
            });

            // Add active class to the current view
            if (viewName === "Today") {
                document.querySelector(".menu a:nth-child(3)").classList.add("active");
            } else if (viewName === "Next 7 Days") {
                document.querySelector(".menu a:nth-child(4)").classList.add("active");
            } else if (viewName === "Important") {
                document.querySelector(".menu a:nth-child(5)").classList.add("active");
            } else if (viewName === "Inbox") {
                document.querySelector(".menu a:nth-child(6)").classList.add("active");
            } else {
                // Check if it's a custom list
                document.querySelectorAll(".list-name").forEach(listItem => {
                    if (listItem.textContent === viewName) {
                        listItem.classList.add("active");
                    }
                });
            }
        }

        // Enhanced page title transition
        function updatePageTitle(newTitle) {
            const titleElement = document.querySelector(".today-title");

            // Add transition class
            titleElement.classList.add("changing");

            // After transition completes, update text and fade back in
            setTimeout(() => {
                titleElement.textContent = newTitle;
                titleElement.classList.remove("changing");

                // Update the active navigation item
                updateActiveNavItem(newTitle);
            }, 300);
        }

        // Filter functions with animations
        function filterTasksByDate(dateString, viewTitle) {
            updatePageTitle(viewTitle);

            const taskItems = document.querySelectorAll(".task-item");
            let hasVisibleTasks = false;
            let animationDelay = 0;

            // Apply animation to hide all tasks first
            taskItems.forEach(taskItem => {
                const parentLi = taskItem.closest('li');
                parentLi.classList.add("hiding");
            });

            // Allow time for the hide animation
            setTimeout(() => {
                taskItems.forEach(taskItem => {
                    const parentLi = taskItem.closest('li');
                    const dateElement = taskItem.querySelector("[data-field='date'] .display-text");

                    if (dateElement) {
                        const taskDateText = dateElement.textContent.replace("Date: ", "");

                        // Only check date for non-N/A values
                        if (taskDateText !== "N/A") {
                            // Convert the displayed date (dd/mm/yyyy) to yyyy-mm-dd for comparison
                            const dateParts = taskDateText.split('/');
                            if (dateParts.length === 3) {
                                const taskDateFormatted = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

                                if (taskDateFormatted === dateString) {
                                    // Show this task with sequential animation
                                    parentLi.style.display = "flex";
                                    parentLi.classList.remove("hiding");

                                    // Add sequential fade-in animation
                                    setTimeout(() => {
                                        parentLi.classList.add("showing");
                                        // Remove the class after animation completes
                                        setTimeout(() => {
                                            parentLi.classList.remove("showing");
                                        }, 400);
                                    }, animationDelay);

                                    animationDelay += 50; // Stagger the animations
                                    hasVisibleTasks = true;
                                } else {
                                    parentLi.style.display = "none";
                                    parentLi.classList.remove("hiding");
                                }
                            } else {
                                parentLi.style.display = "none";
                                parentLi.classList.remove("hiding");
                            }
                        } else {
                            parentLi.style.display = "none";
                            parentLi.classList.remove("hiding");
                        }
                    } else {
                        parentLi.style.display = "none";
                        parentLi.classList.remove("hiding");
                    }
                });

                // Show a message if no tasks are found
                if (!hasVisibleTasks) {
                    showNoTasksMessage(viewTitle);
                } else {
                    removeNoTasksMessage();
                }
            }, 300); // Match the CSS transition time
        }

        function filterTasksByDateRange(startDateString, endDateString, viewTitle) {
            const taskItems = document.querySelectorAll(".task-item");
            let hasVisibleTasks = false;

            taskItems.forEach(taskItem => {
                const parentLi = taskItem.closest('li');
                const dateElement = taskItem.querySelector("[data-field='date'] .display-text");

                if (dateElement) {
                    const taskDateText = dateElement.textContent.replace("Date: ", "");

                    // Only check date for non-N/A values
                    if (taskDateText !== "N/A") {
                        // Convert the displayed date (dd/mm/yyyy) to yyyy-mm-dd for comparison
                        const dateParts = taskDateText.split('/');
                        if (dateParts.length === 3) {
                            const taskDateFormatted = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;

                            // Check if the task date is within the range
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

            document.querySelector(".today-title").textContent = viewTitle;

            // Show a message if no tasks are found
            if (!hasVisibleTasks) {
                showNoTasksMessage(viewTitle);
            } else {
                removeNoTasksMessage();
            }
        }

        function filterTasksByPriority(priorityValue, viewTitle) {
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

            document.querySelector(".today-title").textContent = viewTitle;

            // Show a message if no tasks are found
            if (!hasVisibleTasks) {
                showNoTasksMessage(viewTitle);
            } else {
                removeNoTasksMessage();
            }
        }

        function filterTasksByList(listName) {
            updatePageTitle(listName);

            const taskItems = document.querySelectorAll(".task-item");
            let hasVisibleTasks = false;
            let animationDelay = 0;

            // Apply animation to hide all tasks first
            taskItems.forEach(taskItem => {
                const parentLi = taskItem.closest('li');
                parentLi.classList.add("hiding");
            });

            // Allow time for the hide animation
            setTimeout(() => {
                taskItems.forEach(taskItem => {
                    const parentLi = taskItem.closest('li');
                    const taskList = taskItem.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");

                    if (listName === taskList) {
                        // Show this task with sequential animation
                        parentLi.style.display = "flex";
                        parentLi.classList.remove("hiding");

                        // Add sequential fade-in animation
                        setTimeout(() => {
                            parentLi.classList.add("showing");
                            // Remove the class after animation completes
                            setTimeout(() => {
                                parentLi.classList.remove("showing");
                            }, 400);
                        }, animationDelay);

                        animationDelay += 50; // Stagger the animations
                        hasVisibleTasks = true;
                    } else {
                        parentLi.style.display = "none";
                        parentLi.classList.remove("hiding");
                    }
                });

                // Show a message if no tasks are found
                if (!hasVisibleTasks) {
                    showNoTasksMessage(listName);
                } else {
                    removeNoTasksMessage();
                }
            }, 300); // Match the CSS transition time
        }

        // Display a message when no tasks are found for a view
        function showNoTasksMessage(viewTitle) {
            // Remove any existing message first
            removeNoTasksMessage();

            const messageDiv = document.createElement("div");
            messageDiv.id = "no-tasks-message";
            messageDiv.style.cssText = "text-align: center; margin-top: 30px; color: #888; font-size: 16px;";
            messageDiv.innerHTML = `No tasks found for <strong>${viewTitle}</strong>.<br>Add a new task to get started.`;

            const taskList = document.getElementById("task-list");
            taskList.parentNode.appendChild(messageDiv);
        }

        // Remove the no tasks message if it exists
        function removeNoTasksMessage() {
            const existingMessage = document.getElementById("no-tasks-message");
            if (existingMessage) {
                existingMessage.remove();
            }
        }

        // Navigation event listeners
        // Today view - shows tasks due today
        document.querySelector(".menu a:nth-child(3)").addEventListener("click", function(e) {
            e.preventDefault();
            const today = new Date();
            const todayFormatted = formatDateForComparison(today);

            // Apply animation before filtering
            applyViewTransition(() => {
                filterTasksByDate(todayFormatted, "Today");
            });
        });

        // Next 7 Days view - shows tasks due in the next 7 days
        document.querySelector(".menu a:nth-child(4)").addEventListener("click", function(e) {
            e.preventDefault();
            const today = new Date();
            const next7Days = new Date(today);
            next7Days.setDate(today.getDate() + 7);

            // Get formatted dates for comparison
            const todayFormatted = formatDateForComparison(today);
            const next7DaysFormatted = formatDateForComparison(next7Days);

            // Apply animation before filtering
            applyViewTransition(() => {
                filterTasksByDateRange(todayFormatted, next7DaysFormatted, "Next 7 Days");
            });
        });

        // Important view - shows high priority tasks
        document.querySelector(".menu a:nth-child(5)").addEventListener("click", function(e) {
            e.preventDefault();
            // Apply animation before filtering
            applyViewTransition(() => {
                filterTasksByPriority("high", "Important");
            });
        });

        // Inbox view - shows all tasks
        document.querySelector(".menu a:nth-child(6)").addEventListener("click", function(e) {
            e.preventDefault();
            // Apply animation before filtering
            applyViewTransition(() => {
                // Show all tasks
                const taskItems = document.querySelectorAll(".task-item");
                taskItems.forEach(taskItem => {
                    const parentLi = taskItem.closest('li');
                    parentLi.style.display = "flex";
                });
                document.querySelector(".today-title").textContent = "Inbox";
                removeNoTasksMessage();
            });
        });

        // Initialize with Inbox view as active by default
        document.querySelector(".menu a:nth-child(6)").classList.add("active");
    }

    // Add this new function to apply the transition effect
    function applyViewTransition(callback) {
        // Get the task list container
        const taskListContainer = document.querySelector('.task-list-container');

        // Add a class for the fade-out animation
        taskListContainer.classList.add('view-transition-fade-out');

        // After the fade-out animation completes
        setTimeout(() => {
            // Execute the callback (filter function)
            callback();

            // Remove the fade-out class
            taskListContainer.classList.remove('view-transition-fade-out');

            // Add the fade-in class
            taskListContainer.classList.add('view-transition-fade-in');

            // After the fade-in animation completes, remove the class
            setTimeout(() => {
                taskListContainer.classList.remove('view-transition-fade-in');
            }, 300);
        }, 300);
    }

    // ----------------------
    // Task Management - ENHANCED VERSION WITH CALENDAR INTEGRATION
    // ----------------------

    async function addTask() {
        const taskTitle = document.getElementById("task-title");
        const titleValue = taskTitle.value.trim();

        if (!titleValue) {
            alert('Please enter a task title');
            return;
        }

        console.log('🔄 Adding new task...');

        // Get habit data if creating habit
        const makeHabitCheckbox = document.getElementById('make-habit-checkbox');
        const isCreatingHabit = makeHabitCheckbox && makeHabitCheckbox.checked;

        let habitData = null;
        if (isCreatingHabit) {
            habitData = {
                frequency: document.getElementById('habit-frequency-select')?.value || 'daily',
                target: parseInt(document.getElementById('habit-target-input')?.value) || 1,
                unit: document.getElementById('habit-unit-select')?.value || 'times',
                category: document.getElementById('habit-category-select')?.value || 'health'
            };
        }

        const newTask = {
            title: titleValue,
            description: document.getElementById("task-description").value.trim(),
            date: document.getElementById("due-date").value || null,
            reminder: document.getElementById("reminder").value || null,
            priority: document.getElementById("priority").value !== 'priority' ?
                document.getElementById("priority").value : 'medium',
            list: document.getElementById("list").value !== 'default' ?
                document.getElementById("list").value : 'N/A',
            completed: false,
            createdAt: new Date().toISOString(),
            subtasks: [],
            isHabit: isCreatingHabit
        };

        try {
            // Save to database first
            if (window.taskDB && window.taskDB.isReady) {
                const savedId = await window.taskDB.addTask(newTask);
                newTask.id = savedId;
                console.log('✅ Task saved to database with ID:', savedId);
                showTaskNotification('Task saved to database!', 'success');

                // ENHANCED: Also create calendar event if task has a date
                if (newTask.date) {
                    try {
                        await window.taskDB.createEventFromTask(newTask);
                        console.log('✅ Calendar event created from task');
                        showTaskNotification('Task saved and added to calendar!', 'success');
                    } catch (eventError) {
                        console.error('❌ Failed to create calendar event:', eventError);
                        showTaskNotification('Task saved, but failed to add to calendar', 'warning');
                    }
                }
            } else {
                // Fallback to generate ID and save to localStorage
                newTask.id = Date.now();
                console.log('📱 Database not available, using localStorage fallback');
                showTaskNotification('Task saved locally!', 'warning');

                // Create calendar event in localStorage if date exists
                if (newTask.date) {
                    try {
                        const calendarEvent = {
                            id: Date.now() + 1,
                            title: newTask.title,
                            description: newTask.description || '',
                            date: newTask.date,
                            time: newTask.reminder ? new Date(newTask.reminder).toTimeString().slice(0,5) : null,
                            list: newTask.list !== 'N/A' ? newTask.list : null,
                            priority: newTask.priority !== 'N/A' ? newTask.priority : null,
                            createdFromTask: true,
                            sourceTaskId: newTask.id,
                            createdAt: new Date().toISOString()
                        };

                        const existingEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]');
                        existingEvents.push(calendarEvent);
                        localStorage.setItem('calendar-events', JSON.stringify(existingEvents));
                        console.log('✅ Calendar event created in localStorage');
                        showTaskNotification('Task saved and added to calendar locally!', 'warning');
                    } catch (eventError) {
                        console.error('❌ Failed to create local calendar event:', eventError);
                    }
                }
            }

            // Add to local tasks array
            tasks.push(newTask);
            console.log(`📊 Total tasks now: ${tasks.length}`);

            // Create habit if requested
            if (isCreatingHabit && habitData) {
                createHabitFromTaskDirect(newTask, habitData);
                showHabitCreationSuccess();
            }

            // Update localStorage as backup
            localStorage.setItem("tasks", JSON.stringify(tasks));

            // Re-render all tasks to show the new one
            renderTasks();

            // Clear and collapse form
            clearTaskForm();
            taskCreationBox.classList.remove("expanded");

            console.log('✅ Task added successfully');

        } catch (error) {
            console.error('❌ Failed to save task:', error);

            // Still add the task locally as fallback
            newTask.id = Date.now();
            tasks.push(newTask);

            // Create habit if requested
            if (isCreatingHabit && habitData) {
                createHabitFromTaskDirect(newTask, habitData);
                showHabitCreationSuccess();
            }

            localStorage.setItem("tasks", JSON.stringify(tasks));
            renderTasks();

            clearTaskForm();
            taskCreationBox.classList.remove("expanded");

            showTaskNotification('Task saved locally (database error)', 'warning');
        }
    }

    // NEW: Create habit directly from task with habit data
    function createHabitFromTaskDirect(task, habitData) {
        const newHabit = {
            id: Date.now() + Math.random(), // Ensure unique ID
            title: task.title,
            description: task.description || '',
            category: habitData.category,
            frequency: habitData.frequency,
            target: habitData.target,
            unit: habitData.unit,
            createdAt: new Date().toISOString(),
            completions: {},
            streak: 0,
            bestStreak: 0,
            reminder: task.reminder || null,
            isActive: true,
            sourceTaskId: task.id
        };

        // Load existing habits
        const savedHabits = localStorage.getItem('habits');
        const existingHabits = savedHabits ? JSON.parse(savedHabits) : [];

        // Add new habit
        existingHabits.push(newHabit);
        localStorage.setItem('habits', JSON.stringify(existingHabits));

        console.log('✅ Habit created from task:', newHabit);
    }

    // NEW: Show habit creation success indicator
    function showHabitCreationSuccess() {
        const habitSettings = document.getElementById('habit-settings');
        if (!habitSettings) return;

        // Remove any existing success indicator
        const existingSuccess = habitSettings.querySelector('.habit-creation-success');
        if (existingSuccess) {
            existingSuccess.remove();
        }

        // Create success indicator
        const successIndicator = document.createElement('div');
        successIndicator.className = 'habit-creation-success';
        successIndicator.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Habit will be tracked on the Habits page!</span>
        `;

        habitSettings.appendChild(successIndicator);

        // Remove after 3 seconds
        setTimeout(() => {
            if (successIndicator.parentNode) {
                successIndicator.remove();
            }
        }, 3000);
    }

    function clearTaskForm() {
        taskTitle.value = '';
        taskDescription.value = '';
        dueDate.value = '';
        reminder.value = '';

        priority.value = 'priority';
        listSelect.value = 'default';

        // Reset habit creation form
        const makeHabitCheckbox = document.getElementById('make-habit-checkbox');
        const habitSettings = document.getElementById('habit-settings');
        const habitFrequencySelect = document.getElementById('habit-frequency-select');
        const habitTargetInput = document.getElementById('habit-target-input');
        const habitUnitSelect = document.getElementById('habit-unit-select');
        const habitCategorySelect = document.getElementById('habit-category-select');

        if (makeHabitCheckbox) {
            makeHabitCheckbox.checked = false;
        }

        if (habitSettings) {
            habitSettings.style.display = 'none';
            habitSettings.classList.remove('show', 'hide');
        }

        if (habitFrequencySelect) habitFrequencySelect.value = 'daily';
        if (habitTargetInput) habitTargetInput.value = '1';
        if (habitUnitSelect) habitUnitSelect.value = 'times';
        if (habitCategorySelect) habitCategorySelect.value = 'health';

        // Remove habit styling from creation box
        taskCreationBox.classList.remove('has-habit');

        // Reset heights
        taskTitle.style.height = 'auto';
        taskDescription.style.height = 'auto';
    }

    function createTaskElement(task) {
        const taskItem = document.createElement("li");

        // Set left border color based on priority
        const priorityColors = {
            high: '#ff5555',
            medium: '#ffa500',
            low: '#1e3a8a',
            'N/A': '#1e3a8a'
        };
        taskItem.style.borderLeftColor = priorityColors[task.priority] || '#1e3a8a';

        // Add opacity if task is completed
        if (task.completed) {
            taskItem.style.opacity = '0.6';
        }

        // Task item inner structure
        const taskItemInner = document.createElement("div");
        taskItemInner.className = "task-item";

        // Task completion ring
        const taskRing = document.createElement("div");
        taskRing.className = task.completed ? "task-ring completed" : "task-ring";
        taskRing.addEventListener("click", function () {
            toggleTaskCompletion(task, taskRing, taskItem);
        });

        // Task content container
        const taskContent = document.createElement("div");
        taskContent.style.width = "100%";

        // Format dates for display
        const formattedDueDate = formatDate(task.date);
        const formattedReminderDate = formatDate(task.reminder);

        // Title with inline editing
        const titleDiv = createEditableField('title', task.title, 'task-title', task);

        // Description with inline editing
        const descDiv = createEditableField('description', task.description, 'task-desc', task);

        // Metadata container
        const metadata = document.createElement("div");
        metadata.classList.add("task-metadata");

        // Date with inline editing
        const dateDiv = createEditableField('date', formattedDueDate, '', task, 'Date: ');

        // Reminder with inline editing
        const reminderDiv = createEditableField('reminder', formattedReminderDate, '', task, 'Reminder: ');

        // Priority with inline editing (select dropdown)
        const priorityDiv = createEditableSelectField('priority', task.priority, task, ['low', 'medium', 'high'], 'Priority: ');

        // List with inline editing (select dropdown)
        const listDiv = createEditableSelectField('list', task.list, task, ['N/A', ...lists], 'List: ');

        // Store task ID in the DOM element for reference
        taskItem.dataset.id = task.id;

        // Create new subtask button
        const subtaskButton = createAddSubtaskButton(task, taskContent);

        // Create habit button (NEW)
        const habitButton = createHabitButton(task);

        // Create calendar button (NEW)
        const calendarButton = createCalendarButton(task);

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.className = "delete-task";
        deleteButton.addEventListener("click", function () {
            deleteTask(task.id, taskItem);
        });

        // Assemble the task item
        metadata.append(dateDiv, reminderDiv, priorityDiv, listDiv);

        // Add habit indicator if task is a habit
        if (task.isHabit) {
            const habitIndicator = document.createElement("span");
            habitIndicator.className = "habit-indicator";
            habitIndicator.innerHTML = '<i class="fas fa-seedling"></i> Habit';
            habitIndicator.style.cssText = `
                color: #4caf50;
                font-size: 12px;
                background: rgba(76, 175, 80, 0.1);
                padding: 2px 6px;
                border-radius: 10px;
                margin-left: 10px;
            `;
            metadata.appendChild(habitIndicator);
        }

        // Add calendar indicator if task was created from calendar event
        if (task.createdFromEvent) {
            const calendarIndicator = document.createElement("span");
            calendarIndicator.className = "calendar-indicator";
            calendarIndicator.innerHTML = '<i class="fas fa-calendar"></i> From Calendar';
            calendarIndicator.style.cssText = `
                color: #3498db;
                font-size: 12px;
                background: rgba(52, 152, 219, 0.1);
                padding: 2px 6px;
                border-radius: 10px;
                margin-left: 10px;
            `;
            metadata.appendChild(calendarIndicator);
        }

        taskContent.append(titleDiv, descDiv, metadata, subtaskButton);

        // Add habit button if not already a habit
        if (!task.isHabit) {
            taskContent.appendChild(habitButton);
        }

        // Add calendar button if task has a date and wasn't created from calendar
        if (task.date && !task.createdFromEvent) {
            taskContent.appendChild(calendarButton);
        }

        // Render existing subtasks if any
        renderSubtasks(task, taskContent);

        taskItemInner.append(taskRing, taskContent);
        taskItem.append(taskItemInner, deleteButton);

        return taskItem;
    }

    // NEW: Create calendar button function
    function createCalendarButton(task) {
        const calendarButton = document.createElement("button");
        calendarButton.className = "calendar-button";
        calendarButton.innerHTML = '<i class="fas fa-calendar-plus"></i> Add to Calendar';
        calendarButton.style.cssText = `
            background: none;
            border: none;
            color: #3498db;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 3px 8px;
            border-radius: 4px;
            transition: background-color 0.2s;
            margin-top: 5px;
        `;

        calendarButton.addEventListener('click', function(e) {
            e.stopPropagation();
            addTaskToCalendar(task);
        });

        calendarButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e3f2fd';
        });

        calendarButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });

        return calendarButton;
    }

    // NEW: Create habit button function
    function createHabitButton(task) {
        const habitButton = document.createElement("button");
        habitButton.className = "habit-button";
        habitButton.innerHTML = '<i class="fas fa-seedling"></i> Make Habit';
        habitButton.style.cssText = `
            background: none;
            border: none;
            color: #4caf50;
            cursor: pointer;
            font-size: 13px;
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 3px 8px;
            border-radius: 4px;
            transition: background-color 0.2s;
            margin-top: 5px;
        `;

        habitButton.addEventListener('click', function(e) {
            e.stopPropagation();
            makeTaskHabit(task);
        });

        habitButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f1f8e9';
        });

        habitButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });

        return habitButton;
    }

    // NEW: Function to convert task to habit
    function makeTaskHabit(task) {
        if (task.isHabit) {
            showTaskNotification('This task is already a habit!', 'warning');
            return;
        }

        // Check if createHabitFromTask function exists (from habits.js)
        if (typeof window.createHabitFromTask === 'function') {
            const success = window.createHabitFromTask(task);

            if (success) {
                task.isHabit = true;

                // Update task in storage
                const taskIndex = tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    tasks[taskIndex] = task;
                    saveTasks();
                }

                // Re-render tasks to show habit indicator
                renderTasks();

                showTaskNotification('Task converted to habit successfully!', 'success');
            } else {
                showTaskNotification('Habit already exists for this task!', 'warning');
            }
        } else {
            // Fallback: just mark as habit locally
            task.isHabit = true;

            // Update task in storage
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex] = task;
                saveTasks();
            }

            // Re-render tasks to show habit indicator
            renderTasks();

            showTaskNotification('Task marked as habit! Visit the Habits page to track it.', 'success');
        }
    }

    // NEW: Task notification function
    function showTaskNotification(message, type = 'success') {
        // Create notification
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

        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function createEditableField(fieldName, value, className, task, prefix = '') {
        const containerDiv = document.createElement("div");
        if (className) containerDiv.classList.add(className);

        const editableContent = document.createElement("div");
        editableContent.className = "editable-content";
        editableContent.dataset.field = fieldName;

        // Display text element
        const displayText = document.createElement("div");
        displayText.className = "display-text";
        displayText.textContent = prefix + (value || 'N/A');

        // Edit element (input or textarea)
        const isTextArea = fieldName === 'description' || (value && value.length > 30);
        const editInput = isTextArea ?
            document.createElement("textarea") :
            document.createElement("input");

        editInput.className = isTextArea ? "expanding-input" : "edit-input";
        if (fieldName === 'title') {
            editInput.classList.add("task-title-edit");
        }

        // For date fields, set the type to date
        if (fieldName === 'date' || fieldName === 'reminder') {
            editInput.type = "date";
            // Convert formatted date back to yyyy-mm-dd for input
            editInput.value = convertToInputDateFormat(value);
        } else {
            editInput.value = value || '';
        }

        // Don't show initially
        editInput.style.display = "none";

        // Set up clicking functionality
        displayText.addEventListener("click", function (e) {
            e.stopPropagation(); // Stop propagation to prevent document click handler

            // Enter edit mode
            displayText.style.display = "none";
            editInput.style.display = "block";

            // Add animation class
            if (isTextArea) {
                setTimeout(() => {
                    editInput.classList.add("show");
                    autoExpand(editInput);
                    editInput.addEventListener('input', () => autoExpand(editInput));
                }, 10);
            }

            editInput.focus();

            // Set up one-time click away listener
            function handleClickAway(e) {
                if (e.target !== editInput && e.target !== displayText) {
                    // Save the edit and remove the edit field
                    saveFieldEdit(fieldName, editInput.value, task, displayText, prefix);
                    editInput.classList.remove("show");

                    // Only remove after transition completes for textareas
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

                    // Remove this event listener
                    document.removeEventListener("click", handleClickAway);
                }
            }

            // Add the click away handler after a small delay to avoid immediate triggering
            setTimeout(() => {
                document.addEventListener("click", handleClickAway);
            }, 10);
        });

        // Handle saving on Enter key or Escape
        editInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter" && !e.shiftKey && !isTextArea) {
                e.preventDefault();
                saveFieldEdit(fieldName, this.value, task, displayText, prefix);
                editInput.classList.remove("show");

                setTimeout(() => {
                    editInput.style.display = "none";
                    displayText.style.display = "block";
                }, isTextArea ? 300 : 0);

                // Remove any click away handlers
                document.removeEventListener("click", function () {});
            } else if (e.key === "Escape") {
                // Cancel edit and restore original value
                e.preventDefault();
                editInput.classList.remove("show");

                setTimeout(() => {
                    displayText.style.display = "block";
                    editInput.style.display = "none";
                    editInput.value = task[fieldName] || '';
                }, isTextArea ? 300 : 0);

                // Remove any click away handlers
                document.removeEventListener("click", function () {});
            }
        });

        // Assemble the editable field
        editableContent.append(displayText, editInput);
        containerDiv.appendChild(editableContent);

        return containerDiv;
    }

    function createEditableSelectField(fieldName, value, task, options, prefix = '') {
        const containerDiv = document.createElement("div");

        const editableContent = document.createElement("div");
        editableContent.className = "editable-content";
        editableContent.dataset.field = fieldName;

        // Display text element
        const displayText = document.createElement("div");
        displayText.className = "display-text";
        displayText.textContent = prefix + (value || 'N/A');

        // Create select element
        const selectInput = document.createElement("select");
        selectInput.className = "edit-input";
        selectInput.style.display = "none";

        // Add options with proper capitalization for priority
        if (fieldName === 'priority') {
            // Use capitalized options for priority
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
            // For non-priority fields, use regular options
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

        // Set up editing functionality
        displayText.addEventListener("click", function (e) {
            e.stopPropagation(); // Stop propagation to prevent document click handler

            // Enter edit mode
            displayText.style.display = "none";
            selectInput.style.display = "block";
            selectInput.focus();

            // Set up one-time click away listener
            function handleClickAway(e) {
                if (e.target !== selectInput && e.target !== displayText) {
                    const selectedValue = selectInput.options[selectInput.selectedIndex].value;
                    saveFieldEdit(fieldName, selectedValue, task, displayText, prefix);

                    // Remove this event listener
                    document.removeEventListener("click", handleClickAway);
                }
            }

            // Add the click away handler after a small delay to avoid immediate triggering
            setTimeout(() => {
                document.addEventListener("click", handleClickAway);
            }, 10);
        });

        // Handle saving on Enter key or Escape
        selectInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                const selectedValue = this.options[this.selectedIndex].value;
                saveFieldEdit(fieldName, selectedValue, task, displayText, prefix);

                // Remove any click away handlers
                document.removeEventListener("click", function () {});
            } else if (e.key === "Escape") {
                // Cancel edit
                e.preventDefault();
                displayText.style.display = "block";
                selectInput.style.display = "none";

                // Remove any click away handlers
                document.removeEventListener("click", function () {});
            }
        });

        // Assemble the editable field
        editableContent.append(displayText, selectInput);
        containerDiv.appendChild(editableContent);

        return containerDiv;
    }

    // This function needs to be updated to handle immediate date formatting
    async function saveFieldEdit(fieldName, value, task, displayElement, prefix = '') {
        // Get the original value
        const originalValue = task[fieldName];

        // Clean up value
        if (typeof value === 'string') {
            value = value.trim();
        }

        // Handle empty values
        if (value === '' || value === null || value === undefined) {
            if (fieldName === 'title') {
                value = 'Untitled'; // Don't allow empty titles
            } else {
                value = null;
            }
        }

        // Update task object
        task[fieldName] = value;

        // Format date fields for display
        if ((fieldName === 'date' || fieldName === 'reminder') && value) {
            // Format the date for display (convert from yyyy-mm-dd to dd/mm/yyyy)
            const formattedDate = formatDate(value);
            displayElement.textContent = prefix + formattedDate;
        } else if (fieldName === 'priority' && value) {
            // Update display with proper capitalization for priority
            const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            displayElement.textContent = prefix + (capitalizedValue || 'N/A');
        } else {
            displayElement.textContent = prefix + (value || 'N/A');
        }

        displayElement.style.display = "block";

        // Hide the edit input
        const editInput = displayElement.nextElementSibling;
        if (editInput) {
            editInput.style.display = "none";
        }

        // Update border color if priority changed
        if (fieldName === 'priority') {
            // Find the task element (li)
            const taskElement = displayElement.closest('li');
            if (taskElement) {
                // Update border color based on new priority
                const priorityColors = {
                    High: '#ff5555',
                    Medium: '#ffa500',
                    Low: '#1e3a8a',
                    'N/A': '#1e3a8a'
                };
                taskElement.style.borderLeftColor = priorityColors[value] || '#1e3a8a';
            }
        }

        // Only save if value actually changed
        if (originalValue !== value) {
            // Find task in global array and update it
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex][fieldName] = value;

                try {
                    // Save to database if available
                    if (window.taskDB && window.taskDB.isReady) {
                        await window.taskDB.updateTask(tasks[taskIndex]);
                        console.log('✅ Task updated in database');
                    }
                } catch (error) {
                    console.error('❌ Failed to update task in database:', error);
                }

                // Always save to localStorage as backup
                saveTasks();
            }

            // If the list was changed, check if we need to reapply the current filter
            if (fieldName === 'list') {
                // Get the current view/filter from the page title
                const currentView = document.querySelector(".today-title").textContent;

                // If we're viewing a specific list
                if (lists.includes(currentView)) {
                    // If task was changed to a different list than the current view
                    if (value !== currentView) {
                        // Hide this task since it no longer belongs in the current list view
                        const taskElement = displayElement.closest('li');
                        if (taskElement) {
                            // Add smooth transition
                            taskElement.style.transition = "opacity 0.3s ease, height 0.3s ease, margin 0.3s ease";
                            taskElement.style.opacity = "0";
                            taskElement.style.height = "0";
                            taskElement.style.margin = "0";
                            taskElement.style.overflow = "hidden";

                            // After transition completes, hide the element
                            setTimeout(() => {
                                taskElement.style.display = "none";
                            }, 300);
                        }
                    }
                }
            }
        }
    }

    async function toggleTaskCompletion(task, taskRingElement, taskItemElement) {
        // Calculate the new state (opposite of current state)
        const newCompletedState = !task.completed;

        // Add animation class
        taskRingElement.classList.add("completing");

        // Immediately update the visual state if it's being completed
        // This ensures the checkmark appears during the animation
        if (newCompletedState) {
            taskRingElement.classList.add("completed");
        } else {
            taskRingElement.classList.remove("completed");
        }

        // Listen for animation end to finalize changes
        taskRingElement.addEventListener("animationend", async function handler() {
            // Remove the animation class and the event listener
            taskRingElement.classList.remove("completing");
            taskRingElement.removeEventListener("animationend", handler);

            // Update the task's completed state in the data
            task.completed = newCompletedState;

            // Update UI
            if (newCompletedState) {
                // Add fading animation to the task item
                taskItemElement.classList.add("task-item-fading");
            } else {
                taskItemElement.style.opacity = "1";
                // Remove fading class if it exists
                taskItemElement.classList.remove("task-item-fading");
            }

            // Update task in global array
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = task.completed;

                // Save to both database and localStorage
                try {
                    if (window.taskDB && window.taskDB.isReady) {
                        await window.taskDB.updateTask(tasks[taskIndex]);
                        console.log('✅ Task completion updated in database');
                    }
                } catch (error) {
                    console.error('❌ Failed to update task in database:', error);
                }

                // Always save to localStorage as backup
                saveTasks();
            }
        }, { once: true });
    }
// Replace your existing deleteTask function with this enhanced version:

    async function deleteTask(taskId, taskElement) {
        if (confirm("Are you sure you want to delete this task?")) {
            console.log(`🗑️ TODO: Starting deletion of task ${taskId}...`);

            try {
                // ENHANCED DELETION LOGIC (same as our working console function)
                console.log('📱 TODO: Using enhanced localStorage deletion...');

                let localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                let localEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]');

                console.log(`TODO: Before deletion: ${localTasks.length} tasks, ${localEvents.length} events`);

                // Find the task to delete
                const taskToDelete = localTasks.find(t => t.id == taskId);
                if (!taskToDelete) {
                    console.log('❌ TODO: Task not found');
                    showTaskNotification('Task not found', 'error');
                    return;
                }

                console.log(`TODO: Found task to delete: "${taskToDelete.title}"`);

                // Find associated events to delete (EXACT SAME LOGIC AS WORKING FUNCTION)
                const eventsToDelete = localEvents.filter(event => {
                    return (
                        event.sourceTaskId == taskId ||
                        event.associatedTaskId == taskId ||
                        (event.createdFromTask && event.sourceTaskId == taskId) ||
                        (taskToDelete.associatedEventId && event.id == taskToDelete.associatedEventId)
                    );
                });

                console.log(`TODO: Found ${eventsToDelete.length} associated events to delete`);
                eventsToDelete.forEach(event => {
                    console.log(`TODO: Will delete event: "${event.title}" (ID: ${event.id})`);
                });

                // Remove the task
                localTasks = localTasks.filter(t => t.id != taskId);

                // Remove associated events
                localEvents = localEvents.filter(event => {
                    return !(
                        event.sourceTaskId == taskId ||
                        event.associatedTaskId == taskId ||
                        (event.createdFromTask && event.sourceTaskId == taskId) ||
                        (taskToDelete.associatedEventId && event.id == taskToDelete.associatedEventId)
                    );
                });

                // Save back to localStorage
                localStorage.setItem('tasks', JSON.stringify(localTasks));
                localStorage.setItem('calendar-events', JSON.stringify(localEvents));

                // Update global tasks array
                tasks = localTasks;

                console.log(`TODO: After deletion: ${localTasks.length} tasks, ${localEvents.length} events`);
                console.log(`✅ TODO: Deleted 1 task and ${eventsToDelete.length} associated events`);

                // Show appropriate notification
                if (eventsToDelete.length > 0) {
                    showTaskNotification(`Task and ${eventsToDelete.length} related calendar events deleted!`, 'success');
                } else {
                    showTaskNotification('Task deleted successfully!', 'success');
                }

                // Trigger storage events for real-time sync
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'tasks',
                    newValue: JSON.stringify(localTasks)
                }));

                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'calendar-events',
                    newValue: JSON.stringify(localEvents)
                }));

                // Remove from DOM with animation
                if (taskElement) {
                    taskElement.style.transition = 'all 0.3s ease';
                    taskElement.style.opacity = '0';
                    taskElement.style.transform = 'translateX(-100%)';

                    setTimeout(() => {
                        if (taskElement.parentNode) {
                            taskElement.remove();
                        }
                    }, 300);
                }

                console.log('✅ TODO: Task deletion completed successfully');

            } catch (error) {
                console.error('❌ TODO: Failed to delete task:', error);

                // Fallback: basic deletion
                const originalLength = tasks.length;
                tasks = tasks.filter(task => task.id != taskId);

                if (taskElement && taskElement.parentNode) {
                    taskElement.remove();
                }

                saveTasks();
                showTaskNotification('Task deleted (with errors)', 'warning');
                console.log(`📱 TODO: Fallback deletion completed. Tasks: ${originalLength} → ${tasks.length}`);
            }
        }
    }




    function sortTasks(sortType) {
        const taskElements = Array.from(taskList.querySelectorAll("li"));

        taskElements.sort((a, b) => {
            if (sortType === "date") {
                const dateA = a.querySelector("[data-field='date'] .display-text").textContent.replace("Date: ", "");
                const dateB = b.querySelector("[data-field='date'] .display-text").textContent.replace("Date: ", "");

                // Handle "N/A" values
                if (dateA === "N/A" && dateB === "N/A") return 0;
                if (dateA === "N/A") return 1;
                if (dateB === "N/A") return -1;

                // Parse dates properly
                return parseDateString(dateA) - parseDateString(dateB);

            } else if (sortType === "priority") {
                const priorityA = a.querySelector("[data-field='priority'] .display-text").textContent.replace("Priority: ", "");
                const priorityB = b.querySelector("[data-field='priority'] .display-text").textContent.replace("Priority: ", "");

                // Define priority order
                const priorityOrder = {"high": 1, "medium": 2, "low": 3, "N/A": 4};

                return priorityOrder[priorityA] - priorityOrder[priorityB];

            } else if (sortType === "list") {
                const listA = a.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");
                const listB = b.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");

                // Alphabetical sort
                return listA.localeCompare(listB);
            }

            return 0;
        });

        // Reorder the DOM elements
        taskElements.forEach(task => {
            taskList.appendChild(task);
        });
    }

    // ENHANCED DATA LOADING WITH DATABASE INTEGRATION
    async function loadTasks() {
        console.log('📂 Loading tasks...');

        try {
            // Try to load from database first
            if (window.taskDB && window.taskDB.isReady) {
                tasks = await window.taskDB.getTasks();
                console.log(`✅ Loaded ${tasks.length} tasks from database`);

                // Migrate from localStorage if no tasks in database
                if (tasks.length === 0) {
                    const savedTasks = localStorage.getItem("tasks");
                    if (savedTasks) {
                        const localTasks = JSON.parse(savedTasks);
                        if (localTasks.length > 0) {
                            console.log('🔄 Migrating tasks from localStorage...');
                            for (const task of localTasks) {
                                await window.taskDB.addTask(task);
                            }
                            tasks = await window.taskDB.getTasks();
                            console.log(`✅ Migrated ${tasks.length} tasks to database`);
                        }
                    }
                }
            } else {
                // Fallback to localStorage
                const savedTasks = localStorage.getItem("tasks");
                tasks = savedTasks ? JSON.parse(savedTasks) : [];
                console.log(`📱 Loaded ${tasks.length} tasks from localStorage (fallback)`);
            }
        } catch (error) {
            console.error('❌ Failed to load tasks from database:', error);
            // Fallback to localStorage
            const savedTasks = localStorage.getItem("tasks");
            tasks = savedTasks ? JSON.parse(savedTasks) : [];
            console.log(`📱 Loaded ${tasks.length} tasks from localStorage (error fallback)`);
        }

        // Render tasks to DOM
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
        console.log(`💾 Saved ${tasks.length} tasks to localStorage`);
    }

    function renderTasks() {
        console.log(`🎨 Rendering ${tasks.length} tasks...`);
        taskList.innerHTML = '';

        // Sort tasks: completed at bottom, then by date, then by priority
        const sortedTasks = [...tasks].sort((a, b) => {
            // Completed tasks at bottom
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }

            // Sort by date
            if (a.date && b.date) {
                return new Date(a.date) - new Date(b.date);
            } else if (a.date) {
                return -1;
            } else if (b.date) {
                return 1;
            }

            // Sort by priority
            const priorityOrder = {high: 0, medium: 1, low: 2, 'N/A': 3};
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        // Create task elements
        sortedTasks.forEach(task => {
            const taskItem = createTaskElement(task);
            taskList.appendChild(taskItem);
        });

        console.log(`✅ Rendered ${sortedTasks.length} task elements`);
    }

    async function loadLists() {
        const savedLists = localStorage.getItem("custom-lists");
        lists = savedLists ? JSON.parse(savedLists) : ["Personal", "Work", "Shopping"];

        // Update UI
        renderLists();
        updateListDropdown();
    }

    function saveLists() {
        localStorage.setItem("custom-lists", JSON.stringify(lists));
    }

    // SUBTASK FUNCTIONS
    function createAddSubtaskButton(task, taskContent) {
        const subtaskButton = document.createElement("button");
        subtaskButton.className = "subtask-button";
        subtaskButton.innerHTML = '<i class="fas fa-plus"></i> Add Subtask';
        subtaskButton.addEventListener("click", function (e) {
            e.stopPropagation();

            let subtasksContainer = taskContent.querySelector('.subtasks-container');
            if (!subtasksContainer) {
                subtasksContainer = document.createElement('div');
                subtasksContainer.className = 'subtasks-container';
                taskContent.appendChild(subtasksContainer);

                if (!task.subtasks) {
                    task.subtasks = [];
                }
            }

            const subtaskItem = document.createElement('div');
            subtaskItem.className = 'subtask-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'subtask-checkbox';

            const subtaskInput = document.createElement('textarea');
            subtaskInput.className = 'expanding-input';
            subtaskInput.placeholder = 'Enter subtask...';
            subtaskInput.style.display = 'block';

            subtaskItem.appendChild(checkbox);
            subtaskItem.appendChild(subtaskInput);
            subtasksContainer.appendChild(subtaskItem);

            const subtaskButtonRow = document.createElement('div');
            subtaskButtonRow.className = 'subtask-button-row';
            subtaskButtonRow.style.marginTop = '8px';

            const cancelSubtaskBtn = document.createElement('button');
            cancelSubtaskBtn.textContent = 'Cancel';
            cancelSubtaskBtn.className = 'cancel-subtask-btn';
            cancelSubtaskBtn.style.cssText = 'padding: 5px 10px; background: #ccc; color: #333; border: none; border-radius: 3px; cursor: pointer;';

            const addSubtaskBtn = document.createElement('button');
            addSubtaskBtn.textContent = 'Add';
            addSubtaskBtn.className = 'add-subtask-btn';
            addSubtaskBtn.style.cssText = 'padding: 5px 10px; background: #1e3a8a; color: white; border: none; border-radius: 3px; cursor: pointer; margin-left: 5px;';

            subtaskButtonRow.appendChild(cancelSubtaskBtn);
            subtaskButtonRow.appendChild(addSubtaskBtn);
            subtaskItem.appendChild(subtaskButtonRow);

            setTimeout(() => {
                subtaskInput.classList.add('show');
                subtaskInput.focus();
                autoExpand(subtaskInput);
                subtaskInput.addEventListener('input', () => autoExpand(subtaskInput));
            }, 10);

            cancelSubtaskBtn.addEventListener('click', function () {
                subtaskInput.classList.remove('show');
                setTimeout(() => {
                    subtaskItem.remove();
                    if (subtasksContainer.children.length === 0) {
                        subtasksContainer.remove();
                    }
                }, 300);
            });

            addSubtaskBtn.addEventListener('click', function () {
                saveNewSubtask(task, subtaskInput, subtaskItem, subtasksContainer);
            });

            subtaskInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveNewSubtask(task, subtaskInput, subtaskItem, subtasksContainer);
                } else if (e.key === 'Escape') {
                    subtaskInput.classList.remove('show');
                    setTimeout(() => {
                        subtaskItem.remove();
                        if (subtasksContainer.children.length === 0) {
                            subtasksContainer.remove();
                        }
                    }, 300);
                }
            });
        });

        return subtaskButton;
    }

    function saveNewSubtask(task, subtaskInput, subtaskItem, subtasksContainer) {
        const subtaskText = subtaskInput.value.trim();

        if (subtaskText) {
            const newSubtask = {
                id: Date.now(),
                text: subtaskText,
                completed: false
            };

            if (!task.subtasks) {
                task.subtasks = [];
            }

            task.subtasks.push(newSubtask);

            subtaskInput.classList.remove('show');

            setTimeout(() => {
                subtaskItem.innerHTML = '';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'subtask-checkbox';
                checkbox.addEventListener('change', function () {
                    newSubtask.completed = this.checked;

                    const subtaskText = subtaskItem.querySelector('.display-text');
                    if (this.checked) {
                        subtaskText.style.textDecoration = 'line-through';
                        subtaskText.style.color = '#888';
                    } else {
                        subtaskText.style.textDecoration = 'none';
                        subtaskText.style.color = '';
                    }

                    saveTask(task);
                });

                const editable = document.createElement('div');
                editable.className = 'editable-content';

                const displayText = document.createElement('div');
                displayText.className = 'display-text';
                displayText.textContent = newSubtask.text;

                displayText.addEventListener('click', function (e) {
                    e.stopPropagation();

                    const editInput = document.createElement('textarea');
                    editInput.className = 'expanding-input';
                    editInput.value = newSubtask.text;

                    displayText.style.display = 'none';
                    editable.appendChild(editInput);

                    setTimeout(() => {
                        editInput.classList.add('show');
                        editInput.focus();
                        autoExpand(editInput);
                        editInput.addEventListener('input', () => autoExpand(editInput));
                    }, 10);

                    function handleClickAway(e) {
                        if (e.target !== editInput && e.target !== displayText) {
                            saveSubtaskEdit(newSubtask, editInput, displayText, task);
                            document.removeEventListener("click", handleClickAway);
                        }
                    }

                    setTimeout(() => {
                        document.addEventListener("click", handleClickAway);
                    }, 10);

                    editInput.addEventListener('keydown', function (e) {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            saveSubtaskEdit(newSubtask, editInput, displayText, task);
                            document.removeEventListener("click", handleClickAway);
                        } else if (e.key === 'Escape') {
                            e.preventDefault();
                            editInput.classList.remove('show');
                            setTimeout(() => {
                                displayText.style.display = 'block';
                                editInput.remove();
                            }, 300);
                            document.removeEventListener("click", handleClickAway);
                        }
                    });
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-subtask';
                deleteBtn.innerHTML = '×';
                deleteBtn.addEventListener('click', function () {
                    task.subtasks = task.subtasks.filter(st => st.id !== newSubtask.id);

                    subtaskItem.style.opacity = '0';
                    subtaskItem.style.height = '0';
                    subtaskItem.style.margin = '0';
                    subtaskItem.style.transition = 'all 0.3s ease';

                    setTimeout(() => {
                        subtaskItem.remove();

                        if (task.subtasks.length === 0) {
                            subtasksContainer.remove();
                        }

                        saveTask(task);
                    }, 300);
                });

                editable.appendChild(displayText);
                subtaskItem.appendChild(checkbox);
                subtaskItem.appendChild(editable);
                subtaskItem.appendChild(deleteBtn);

                saveTask(task);
            }, 300);
        } else {
            subtaskInput.classList.remove('show');
            setTimeout(() => {
                subtaskItem.remove();

                if (subtasksContainer.children.length === 0) {
                    subtasksContainer.remove();
                }
            }, 300);
        }
    }

    function saveSubtaskEdit(subtask, editInput, displayText, task) {
        const newText = editInput.value.trim();

        if (newText) {
            subtask.text = newText;
            displayText.textContent = newText;
            saveTask(task);
        }

        editInput.classList.remove('show');
        setTimeout(() => {
            displayText.style.display = 'block';
            editInput.remove();
        }, 300);
    }

    async function saveTask(task) {
        const taskIndex = tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
            tasks[taskIndex] = task;

            try {
                if (window.taskDB && window.taskDB.isReady) {
                    await window.taskDB.updateTask(task);
                    console.log('✅ Task updated in database');
                }
            } catch (error) {
                console.error('❌ Failed to update task in database:', error);
            }

            saveTasks();
        }
    }

    function renderSubtasks(task, taskContent) {
        if (!task.subtasks || task.subtasks.length === 0) return;

        const subtasksContainer = document.createElement('div');
        subtasksContainer.className = 'subtasks-container';

        task.subtasks.forEach(subtask => {
            const subtaskItem = document.createElement('div');
            subtaskItem.className = 'subtask-item';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'subtask-checkbox';
            checkbox.checked = subtask.completed;
            checkbox.addEventListener('change', function () {
                subtask.completed = this.checked;

                const subtaskText = subtaskItem.querySelector('.display-text');
                if (this.checked) {
                    subtaskText.style.textDecoration = 'line-through';
                    subtaskText.style.color = '#888';
                } else {
                    subtaskText.style.textDecoration = 'none';
                    subtaskText.style.color = '';
                }

                saveTask(task);
            });

            const editable = document.createElement('div');
            editable.className = 'editable-content';

            const displayText = document.createElement('div');
            displayText.className = 'display-text';
            displayText.textContent = subtask.text;

            if (subtask.completed) {
                displayText.style.textDecoration = 'line-through';
                displayText.style.color = '#888';
            }

            displayText.addEventListener('click', function (e) {
                e.stopPropagation();

                const editInput = document.createElement('textarea');
                editInput.className = 'expanding-input';
                editInput.value = subtask.text;

                displayText.style.display = 'none';
                editable.appendChild(editInput);

                setTimeout(() => {
                    editInput.classList.add('show');
                    editInput.focus();
                    autoExpand(editInput);
                    editInput.addEventListener('input', () => autoExpand(editInput));
                }, 10);

                function handleClickAway(e) {
                    if (e.target !== editInput && e.target !== displayText) {
                        saveSubtaskEdit(subtask, editInput, displayText, task);
                        document.removeEventListener("click", handleClickAway);
                    }
                }

                setTimeout(() => {
                    document.addEventListener("click", handleClickAway);
                }, 10);

                editInput.addEventListener('keydown', function (e) {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        saveSubtaskEdit(subtask, editInput, displayText, task);
                        document.removeEventListener("click", handleClickAway);
                    } else if (e.key === 'Escape') {
                        e.preventDefault();
                        editInput.classList.remove('show');
                        setTimeout(() => {
                            displayText.style.display = 'block';
                            editInput.remove();
                        }, 300);
                        document.removeEventListener("click", handleClickAway);
                    }
                });
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-subtask';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', function () {
                task.subtasks = task.subtasks.filter(st => st.id !== subtask.id);

                subtaskItem.style.opacity = '0';
                subtaskItem.style.height = '0';
                subtaskItem.style.margin = '0';
                subtaskItem.style.transition = 'all 0.3s ease';

                setTimeout(() => {
                    subtaskItem.remove();

                    if (task.subtasks.length === 0) {
                        subtasksContainer.remove();
                    }

                    saveTask(task);
                }, 300);
            });

            editable.appendChild(displayText);
            subtaskItem.appendChild(checkbox);
            subtaskItem.appendChild(editable);
            subtaskItem.appendChild(deleteBtn);
            subtasksContainer.appendChild(subtaskItem);
        });

        taskContent.appendChild(subtasksContainer);
    }

    // ----------------------
    // List Management
    // ----------------------
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
        }
    }

    function renderLists() {
        listsContainer.innerHTML = '';

        lists.forEach((listName, index) => {
            const listItem = document.createElement("div");
            listItem.classList.add("list-item");

            const listName_el = document.createElement("span");
            listName_el.className = "list-name";
            listName_el.dataset.index = index;
            listName_el.textContent = listName;
            listName_el.addEventListener('click', function () {
                applyViewTransition(() => {
                    filterTasksByList(listName);
                });
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
            listItem.append(listName_el, listActions);
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

        document.querySelectorAll(".task-item").forEach(taskItem => {
            const listDisplay = taskItem.querySelector("[data-field='list'] .display-text");
            if (listDisplay && listDisplay.textContent === `List: ${oldName}`) {
                listDisplay.textContent = `List: ${newName}`;
            }
        });

        if (tasksUpdated) {
            saveTasks();
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

        document.querySelectorAll(".task-item").forEach(taskItem => {
            const listDisplay = taskItem.querySelector("[data-field='list'] .display-text");
            if (listDisplay && listDisplay.textContent === `List: ${deletedListName}`) {
                listDisplay.textContent = "List: N/A";
            }
        });

        if (tasksUpdated) {
            saveTasks();
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

    // Auto-expand textarea based on content
    window.autoExpand = function(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    };

    // Global export function for testing
    window.exportAllData = async function() {
        console.log('📤 Exporting all data...');

        const exportData = {
            tasks: tasks,
            lists: lists,
            timestamp: new Date().toISOString()
        };

        // Try to get data from database as well
        if (window.taskDB && window.taskDB.isReady) {
            try {
                const dbTasks = await window.taskDB.getTasks();
                const dbEvents = await window.taskDB.getEvents();
                exportData.databaseTasks = dbTasks;
                exportData.databaseEvents = dbEvents;
                exportData.databaseTasksCount = dbTasks.length;
                exportData.databaseEventsCount = dbEvents.length;
            } catch (error) {
                console.error('Failed to export database data:', error);
            }
        }

        console.log('Export data:', exportData);

        // Download as JSON file
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

        const exportFileDefaultName = `todo-data-${new Date().toISOString().split('T')[0]}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();

        alert(`Data exported! Tasks: ${tasks.length}, Lists: ${lists.length}`);
    };

    console.log('✅ Enhanced Todo app with calendar integration loaded successfully');
// Todo Integration with Enhanced Database Sync
    console.log('=== TODO WITH ENHANCED SYNC STARTING ===');

// Add this to your todo.js file - enhanced functions with proper sync

// ENHANCED TASK LOADING WITH PROPER SYNC
    async function loadTasks() {
        console.log('📂 Loading tasks with enhanced sync...');

        try {
            // Try to load from database first
            if (window.taskDB && window.taskDB.isReady) {
                tasks = await window.taskDB.getTasks();
                console.log(`✅ Loaded ${tasks.length} tasks from database`);

                // Migrate from localStorage if no tasks in database
                if (tasks.length === 0) {
                    const savedTasks = localStorage.getItem("tasks");
                    if (savedTasks) {
                        const localTasks = JSON.parse(savedTasks);
                        if (localTasks.length > 0) {
                            console.log('🔄 Migrating tasks from localStorage...');
                            for (const task of localTasks) {
                                try {
                                    await window.taskDB.addTask(task);
                                } catch (error) {
                                    console.error('Failed to migrate task:', error);
                                }
                            }
                            tasks = await window.taskDB.getTasks();
                            console.log(`✅ Migrated ${tasks.length} tasks to database`);
                        }
                    }
                }
            } else {
                // Fallback to localStorage
                const savedTasks = localStorage.getItem("tasks");
                tasks = savedTasks ? JSON.parse(savedTasks) : [];
                console.log(`📱 Loaded ${tasks.length} tasks from localStorage (fallback)`);
            }
        } catch (error) {
            console.error('❌ Failed to load tasks from database:', error);
            // Fallback to localStorage
            const savedTasks = localStorage.getItem("tasks");
            tasks = savedTasks ? JSON.parse(savedTasks) : [];
            console.log(`📱 Loaded ${tasks.length} tasks from localStorage (error fallback)`);
        }

        // Render tasks to DOM
        renderTasks();
    }

// ENHANCED ADD TASK WITH PROPER SYNC
    async function addTask() {
        const taskTitle = document.getElementById("task-title");
        const titleValue = taskTitle.value.trim();

        if (!titleValue) {
            alert('Please enter a task title');
            return;
        }

        console.log('🔄 Adding new task with enhanced sync...');

        // Get habit data if creating habit
        const makeHabitCheckbox = document.getElementById('make-habit-checkbox');
        const isCreatingHabit = makeHabitCheckbox && makeHabitCheckbox.checked;

        let habitData = null;
        if (isCreatingHabit) {
            habitData = {
                frequency: document.getElementById('habit-frequency-select')?.value || 'daily',
                target: parseInt(document.getElementById('habit-target-input')?.value) || 1,
                unit: document.getElementById('habit-unit-select')?.value || 'times',
                category: document.getElementById('habit-category-select')?.value || 'health'
            };
        }

        const newTask = {
            title: titleValue,
            description: document.getElementById("task-description").value.trim(),
            date: document.getElementById("due-date").value || null,
            reminder: document.getElementById("reminder").value || null,
            priority: document.getElementById("priority").value !== 'priority' ?
                document.getElementById("priority").value : 'medium',
            list: document.getElementById("list").value !== 'default' ?
                document.getElementById("list").value : 'N/A',
            completed: false,
            createdAt: new Date().toISOString(),
            subtasks: [],
            isHabit: isCreatingHabit
        };

        try {
            // Save to database first
            if (window.taskDB && window.taskDB.isReady) {
                const savedId = await window.taskDB.addTask(newTask);
                newTask.id = savedId;
                console.log('✅ Task saved to database with ID:', savedId);
                showTaskNotification('Task saved to database!', 'success');

                // ENHANCED: Also create calendar event if task has a date
                if (newTask.date) {
                    try {
                        await window.taskDB.createEventFromTask(newTask);
                        console.log('✅ Calendar event created from task');
                        showTaskNotification('Task saved and added to calendar!', 'success');
                    } catch (eventError) {
                        console.error('❌ Failed to create calendar event:', eventError);
                        showTaskNotification('Task saved, but failed to add to calendar', 'warning');
                    }
                }
            } else {
                // Fallback to generate ID and save to localStorage
                newTask.id = Date.now();
                console.log('📱 Database not available, using localStorage fallback');
                showTaskNotification('Task saved locally!', 'warning');

                // Create calendar event in localStorage if date exists
                if (newTask.date) {
                    try {
                        const calendarEvent = {
                            id: Date.now() + 1,
                            title: newTask.title,
                            description: newTask.description || '',
                            date: newTask.date,
                            time: newTask.reminder ? new Date(newTask.reminder).toTimeString().slice(0,5) : null,
                            list: newTask.list !== 'N/A' ? newTask.list : null,
                            priority: newTask.priority !== 'N/A' ? newTask.priority : null,
                            createdFromTask: true,
                            sourceTaskId: newTask.id,
                            createdAt: new Date().toISOString()
                        };

                        const existingEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]');
                        existingEvents.push(calendarEvent);
                        localStorage.setItem('calendar-events', JSON.stringify(existingEvents));
                        console.log('✅ Calendar event created in localStorage');
                        showTaskNotification('Task saved and added to calendar locally!', 'warning');
                    } catch (eventError) {
                        console.error('❌ Failed to create local calendar event:', eventError);
                    }
                }
            }

            // Add to local tasks array
            tasks.push(newTask);
            console.log(`📊 Total tasks now: ${tasks.length}`);

            // Create habit if requested
            if (isCreatingHabit && habitData) {
                createHabitFromTaskDirect(newTask, habitData);
                showHabitCreationSuccess();
            }

            // Update localStorage as backup
            localStorage.setItem("tasks", JSON.stringify(tasks));

            // Re-render all tasks to show the new one
            renderTasks();

            // Clear and collapse form
            clearTaskForm();
            taskCreationBox.classList.remove("expanded");

            console.log('✅ Task added successfully');

        } catch (error) {
            console.error('❌ Failed to save task:', error);

            // Still add the task locally as fallback
            newTask.id = Date.now();
            tasks.push(newTask);

            // Create habit if requested
            if (isCreatingHabit && habitData) {
                createHabitFromTaskDirect(newTask, habitData);
                showHabitCreationSuccess();
            }

            localStorage.setItem("tasks", JSON.stringify(tasks));
            renderTasks();

            clearTaskForm();
            taskCreationBox.classList.remove("expanded");

            showTaskNotification('Task saved locally (database error)', 'warning');
        }
    }

// ENHANCED DELETE TASK WITH PROPER SYNC
    async function deleteTask(taskId, taskElement) {
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                // Use enhanced delete that handles associated events
                if (window.taskDB && window.taskDB.isReady) {
                    await window.taskDB.deleteTaskAndAssociatedEvent(taskId);
                    console.log('✅ Task and associated event deleted from database');
                } else {
                    // Fallback for localStorage
                    // Check if there's an associated event
                    const task = tasks.find(t => t.id === taskId);
                    if (task && (task.associatedEventId || task.createdFromEvent)) {
                        const events = JSON.parse(localStorage.getItem('calendar-events') || '[]');
                        const updatedEvents = events.filter(event =>
                            event.id !== task.associatedEventId &&
                            event.sourceTaskId !== task.id
                        );
                        localStorage.setItem('calendar-events', JSON.stringify(updatedEvents));
                        console.log('✅ Associated event deleted from localStorage');
                    }
                }

                // Remove from global array
                tasks = tasks.filter(task => task.id !== taskId);

                // Remove from DOM
                taskElement.remove();

                // Save changes to localStorage as backup
                saveTasks();

                showTaskNotification('Task deleted successfully!', 'success');

            } catch (error) {
                console.error('❌ Failed to delete task from database:', error);

                // Still remove locally
                tasks = tasks.filter(task => task.id !== taskId);
                taskElement.remove();
                saveTasks();

                showTaskNotification('Task deleted locally (database error)', 'warning');
            }
        }
    }

// ENHANCED SAVE FIELD EDIT WITH PROPER SYNC
    async function saveFieldEdit(fieldName, value, task, displayElement, prefix = '') {
        // Get the original value
        const originalValue = task[fieldName];

        // Clean up value
        if (typeof value === 'string') {
            value = value.trim();
        }

        // Handle empty values
        if (value === '' || value === null || value === undefined) {
            if (fieldName === 'title') {
                value = 'Untitled'; // Don't allow empty titles
            } else {
                value = null;
            }
        }

        // Update task object
        task[fieldName] = value;

        // Format date fields for display
        if ((fieldName === 'date' || fieldName === 'reminder') && value) {
            // Format the date for display (convert from yyyy-mm-dd to dd/mm/yyyy)
            const formattedDate = formatDate(value);
            displayElement.textContent = prefix + formattedDate;
        } else if (fieldName === 'priority' && value) {
            // Update display with proper capitalization for priority
            const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
            displayElement.textContent = prefix + (capitalizedValue || 'N/A');
        } else {
            displayElement.textContent = prefix + (value || 'N/A');
        }

        displayElement.style.display = "block";

        // Hide the edit input
        const editInput = displayElement.nextElementSibling;
        if (editInput) {
            editInput.style.display = "none";
        }

        // Update border color if priority changed
        if (fieldName === 'priority') {
            // Find the task element (li)
            const taskElement = displayElement.closest('li');
            if (taskElement) {
                // Update border color based on new priority
                const priorityColors = {
                    High: '#ff5555',
                    Medium: '#ffa500',
                    Low: '#1e3a8a',
                    'N/A': '#1e3a8a'
                };
                taskElement.style.borderLeftColor = priorityColors[value] || '#1e3a8a';
            }
        }

        // Only save if value actually changed
        if (originalValue !== value) {
            // Find task in global array and update it
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex][fieldName] = value;

                try {
                    // Save to database if available
                    if (window.taskDB && window.taskDB.isReady) {
                        await window.taskDB.updateTask(tasks[taskIndex]);
                        console.log('✅ Task updated in database');

                        // If there's an associated event, update it too
                        if (tasks[taskIndex].associatedEventId && (fieldName === 'title' || fieldName === 'description' || fieldName === 'date' || fieldName === 'priority')) {
                            try {
                                const events = await window.taskDB.getEvents();
                                const associatedEvent = events.find(e => e.id === tasks[taskIndex].associatedEventId);
                                if (associatedEvent) {
                                    const updatedEvent = { ...associatedEvent };
                                    if (fieldName === 'title') updatedEvent.title = value;
                                    if (fieldName === 'description') updatedEvent.description = value;
                                    if (fieldName === 'date') updatedEvent.date = value;
                                    if (fieldName === 'priority') updatedEvent.priority = value;
                                    updatedEvent.updatedAt = new Date().toISOString();

                                    await window.taskDB.updateEvent(updatedEvent);
                                    console.log('✅ Associated event updated');
                                }
                            } catch (eventError) {
                                console.error('❌ Failed to update associated event:', eventError);
                            }
                        }
                    }
                } catch (error) {
                    console.error('❌ Failed to update task in database:', error);
                }

                // Always save to localStorage as backup
                saveTasks();
            }

            // If the list was changed, check if we need to reapply the current filter
            if (fieldName === 'list') {
                // Get the current view/filter from the page title
                const currentView = document.querySelector(".today-title").textContent;

                // If we're viewing a specific list
                if (lists.includes(currentView)) {
                    // If task was changed to a different list than the current view
                    if (value !== currentView) {
                        // Hide this task since it no longer belongs in the current list view
                        const taskElement = displayElement.closest('li');
                        if (taskElement) {
                            // Add smooth transition
                            taskElement.style.transition = "opacity 0.3s ease, height 0.3s ease, margin 0.3s ease";
                            taskElement.style.opacity = "0";
                            taskElement.style.height = "0";
                            taskElement.style.margin = "0";
                            taskElement.style.overflow = "hidden";

                            // After transition completes, hide the element
                            setTimeout(() => {
                                taskElement.style.display = "none";
                            }, 300);
                        }
                    }
                }
            }
        }
    }

// ENHANCED TASK COMPLETION TOGGLE WITH PROPER SYNC
    async function toggleTaskCompletion(task, taskRingElement, taskItemElement) {
        // Calculate the new state (opposite of current state)
        const newCompletedState = !task.completed;

        // Add animation class
        taskRingElement.classList.add("completing");

        // Immediately update the visual state if it's being completed
        // This ensures the checkmark appears during the animation
        if (newCompletedState) {
            taskRingElement.classList.add("completed");
        } else {
            taskRingElement.classList.remove("completed");
        }

        // Listen for animation end to finalize changes
        taskRingElement.addEventListener("animationend", async function handler() {
            // Remove the animation class and the event listener
            taskRingElement.classList.remove("completing");
            taskRingElement.removeEventListener("animationend", handler);

            // Update the task's completed state in the data
            task.completed = newCompletedState;

            // Update UI
            if (newCompletedState) {
                // Add fading animation to the task item
                taskItemElement.classList.add("task-item-fading");
            } else {
                taskItemElement.style.opacity = "1";
                // Remove fading class if it exists
                taskItemElement.classList.remove("task-item-fading");
            }

            // Update task in global array
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex].completed = task.completed;

                // Save to both database and localStorage
                try {
                    if (window.taskDB && window.taskDB.isReady) {
                        await window.taskDB.updateTask(tasks[taskIndex]);
                        console.log('✅ Task completion updated in database');
                    }
                } catch (error) {
                    console.error('❌ Failed to update task in database:', error);
                }

                // Always save to localStorage as backup
                saveTasks();
            }
        }, { once: true });
    }

// SET UP DATABASE CHANGE LISTENERS FOR REAL-TIME SYNC
    function setupDatabaseSync() {
        if (window.taskDB && window.taskDB.isReady) {
            // Listen for database changes
            window.taskDB.addEventListener(function(change) {
                console.log('🔄 Database change detected in todo:', change);

                if (change.type === 'task') {
                    // Reload tasks from database
                    loadTasks().then(() => {
                        console.log('✅ Tasks reloaded from database change');
                    });
                } else if (change.type === 'event' && change.action === 'added') {
                    // If a new event was added and it should create a task, handle it
                    const eventData = change.data;
                    if (eventData.createdFromTask === false && eventData.hasAssociatedTask) {
                        // This is a new event that should have a task - reload tasks
                        loadTasks().then(() => {
                            console.log('✅ Tasks reloaded due to new event');
                        });
                    }
                }
            });

            console.log('✅ Database sync listeners set up for todo');
        }
    }

// ENHANCED INITIALIZATION WITH SYNC
    async function initApp() {
        console.log('🚀 Initializing Todo App with enhanced sync...');

        // Initialize database first if available
        if (window.taskDB && !window.taskDB.isReady) {
            try {
                await window.taskDB.init();
                console.log('✅ Database initialized');
            } catch (error) {
                console.error('❌ Database initialization failed:', error);
            }
        }

        // Set up database sync listeners
        setupDatabaseSync();

        // Load saved data
        await loadLists();
        await loadTasks();

        // Set up event listeners
        setupTaskCreationEvents();
        setupSortingEvents();
        setupListManagementEvents();
        setupNavigationEvents();

        console.log(`📊 App initialized with ${tasks.length} tasks and ${lists.length} lists`);
    }

// ENHANCED UTILITY FUNCTIONS
    function showTaskNotification(message, type = 'success') {
        // Create notification
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

        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
        console.log(`💾 Saved ${tasks.length} tasks to localStorage`);
    }

// ENHANCED CALENDAR BUTTON FUNCTIONALITY
    function createCalendarButton(task) {
        const calendarButton = document.createElement("button");
        calendarButton.className = "calendar-button";
        calendarButton.innerHTML = '<i class="fas fa-calendar-plus"></i> Add to Calendar';
        calendarButton.style.cssText = `
        background: none;
        border: none;
        color: #3498db;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 3px 8px;
        border-radius: 4px;
        transition: background-color 0.2s;
        margin-top: 5px;
    `;

        calendarButton.addEventListener('click', function(e) {
            e.stopPropagation();
            addTaskToCalendar(task);
        });

        calendarButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#e3f2fd';
        });

        calendarButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });

        return calendarButton;
    }
// REPLACE your existing addTaskToCalendar function with this enhanced version
    async function addTaskToCalendar(task) {
        if (!task.date) {
            showTaskNotification('Task needs a date to be added to calendar', 'warning');
            return;
        }

        try {
            if (window.taskDB && window.taskDB.isReady) {
                await window.taskDB.createEventFromTask(task);
                showTaskNotification('Task added to calendar successfully!', 'success');
            } else {
                // Fallback: create calendar event in localStorage
                const calendarEvent = {
                    id: Date.now() + Math.random(),
                    title: task.title,
                    description: task.description || '',
                    date: task.date,
                    time: task.reminder ? new Date(task.reminder).toTimeString().slice(0,5) : null,
                    list: task.list !== 'N/A' ? task.list : null,
                    priority: task.priority !== 'N/A' ? task.priority : null,
                    createdFromTask: true,
                    sourceTaskId: task.id,
                    createdAt: new Date().toISOString()
                };

                const existingEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]');
                existingEvents.push(calendarEvent);
                localStorage.setItem('calendar-events', JSON.stringify(existingEvents));

                // 🔥 CRITICAL FIX: Update the task with the event ID
                task.associatedEventId = calendarEvent.id;
                const taskIndex = tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    tasks[taskIndex] = task;
                    saveTasks(); // Save the updated task
                }

                // 🔥 CRITICAL FIX: Notify calendar page of the change
                window.dispatchEvent(new StorageEvent('storage', {
                    key: 'calendar-events',
                    newValue: localStorage.getItem('calendar-events')
                }));

                showTaskNotification('Task added to calendar locally!', 'warning');
            }

            // Re-render to update the button visibility
            renderTasks();
        } catch (error) {
            console.error('❌ Failed to add task to calendar:', error);
            showTaskNotification('Failed to add task to calendar', 'error');
        }
    }


// ENHANCED HABIT BUTTON FUNCTIONALITY
    function createHabitButton(task) {
        const habitButton = document.createElement("button");
        habitButton.className = "habit-button";
        habitButton.innerHTML = '<i class="fas fa-seedling"></i> Make Habit';
        habitButton.style.cssText = `
        background: none;
        border: none;
        color: #4caf50;
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 3px 8px;
        border-radius: 4px;
        transition: background-color 0.2s;
        margin-top: 5px;
    `;

        habitButton.addEventListener('click', function(e) {
            e.stopPropagation();
            makeTaskHabit(task);
        });

        habitButton.addEventListener('mouseenter', function() {
            this.style.backgroundColor = '#f1f8e9';
        });

        habitButton.addEventListener('mouseleave', function() {
            this.style.backgroundColor = 'transparent';
        });

        return habitButton;
    }

// ENHANCED MAKE TASK HABIT FUNCTION
    function makeTaskHabit(task) {
        if (task.isHabit) {
            showTaskNotification('This task is already a habit!', 'warning');
            return;
        }

        // Check if createHabitFromTask function exists (from habits.js)
        if (typeof window.createHabitFromTask === 'function') {
            const success = window.createHabitFromTask(task);

            if (success) {
                task.isHabit = true;

                // Update task in storage
                const taskIndex = tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    tasks[taskIndex] = task;
                    saveTasks();

                    // Also update in database if available
                    if (window.taskDB && window.taskDB.isReady) {
                        window.taskDB.updateTask(task).catch(error => {
                            console.error('Failed to update task in database:', error);
                        });
                    }
                }

                // Re-render tasks to show habit indicator
                renderTasks();

                showTaskNotification('Task converted to habit successfully!', 'success');
            } else {
                showTaskNotification('Habit already exists for this task!', 'warning');
            }
        } else {
            // Fallback: just mark as habit locally
            task.isHabit = true;

            // Update task in storage
            const taskIndex = tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
                tasks[taskIndex] = task;
                saveTasks();

                // Also update in database if available
                if (window.taskDB && window.taskDB.isReady) {
                    window.taskDB.updateTask(task).catch(error => {
                        console.error('Failed to update task in database:', error);
                    });
                }
            }

            // Re-render tasks to show habit indicator
            renderTasks();

            showTaskNotification('Task marked as habit! Visit the Habits page to track it.', 'success');
        }
    }

// AUTOMATIC SYNC CHECK ON PAGE VISIBILITY
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // Page became visible, check for sync
            console.log('📱 Page became visible, checking for sync...');
            if (window.taskDB && window.taskDB.isReady) {
                loadTasks().then(() => {
                    console.log('✅ Tasks synced on page visibility');
                });
            }
        }
    });

// PERIODIC SYNC CHECK (every 30 seconds)
    setInterval(function() {
        if (window.taskDB && window.taskDB.isReady && !document.hidden) {
            window.taskDB.updateLocalStorageBackup('tasks');
            window.taskDB.updateLocalStorageBackup('events');
        }
    }, 30000);

// ENHANCED GLOBAL EXPORT FUNCTION
    window.exportAllData = async function() {
        console.log('📤 Exporting all data with enhanced sync...');

        try {
            let exportData;

            if (window.taskDB && window.taskDB.isReady) {
                // Export from database
                exportData = await window.taskDB.exportData();
                exportData.source = 'database';
            } else {
                // Fallback to localStorage
                exportData = {
                    tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
                    events: JSON.parse(localStorage.getItem('calendar-events') || '[]'),
                    lists: JSON.parse(localStorage.getItem('custom-lists') || '[]'),
                    habits: JSON.parse(localStorage.getItem('habits') || '[]'),
                    timestamp: new Date().toISOString(),
                    source: 'localStorage'
                };
            }

            console.log('Export data:', exportData);

            // Download as JSON file
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

            const exportFileDefaultName = `todo-data-${new Date().toISOString().split('T')[0]}.json`;

            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();

            const totalItems = (exportData.tasks?.length || 0) + (exportData.events?.length || 0) + (exportData.habits?.length || 0);
            showTaskNotification(`Data exported! ${totalItems} total items from ${exportData.source}`, 'success');

        } catch (error) {
            console.error('❌ Failed to export data:', error);
            showTaskNotification('Failed to export data', 'error');
        }
    };

// CROSS-PAGE INTEGRATION FUNCTIONS
    window.createEventFromTask = async function(task) {
        try {
            if (window.taskDB && window.taskDB.isReady) {
                return await window.taskDB.createEventFromTask(task);
            } else {
                // Fallback for localStorage
                const newEvent = {
                    id: Date.now(),
                    title: task.title,
                    description: task.description || '',
                    date: task.date || new Date().toISOString().split('T')[0],
                    time: task.reminder ? new Date(task.reminder).toTimeString().slice(0,5) : null,
                    list: task.list !== 'N/A' ? task.list : null,
                    priority: task.priority !== 'N/A' ? task.priority : null,
                    createdFromTask: true,
                    sourceTaskId: task.id,
                    createdAt: new Date().toISOString()
                };

                const existingEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]');
                existingEvents.push(newEvent);
                localStorage.setItem('calendar-events', JSON.stringify(existingEvents));
                return newEvent.id;
            }
        } catch (error) {
            console.error('❌ Failed to create event from task:', error);
            return false;
        }
    };

    window.createTaskFromEvent = async function(event) {
        try {
            if (window.taskDB && window.taskDB.isReady) {
                return await window.taskDB.createTaskFromEvent(event);
            } else {
                // Fallback for localStorage
                const newTask = {
                    id: Date.now(),
                    title: event.title,
                    description: event.description || '',
                    date: event.date,
                    reminder: event.date,
                    priority: event.priority || 'medium',
                    list: event.list || 'N/A',
                    completed: false,
                    subtasks: [],
                    createdFromEvent: true,
                    sourceEventId: event.id,
                    createdAt: new Date().toISOString()
                };

                const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                existingTasks.push(newTask);
                localStorage.setItem('tasks', JSON.stringify(existingTasks));
                return newTask.id;
            }
        } catch (error) {
            console.error('❌ Failed to create task from event:', error);
            return false;
        }
    };

// LISTEN FOR STORAGE CHANGES FROM OTHER TABS
    window.addEventListener('storage', function(e) {
        if (e.key === 'tasks' || e.key === 'calendar-events') {
            console.log('🔄 Storage changed in another tab, reloading tasks...');
            loadTasks();
        }
    });

    console.log('✅ Enhanced Todo Integration with Database Sync loaded successfully');


});

