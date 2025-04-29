// Global state
let tasks = [];
let lists = [];

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
    function initApp() {
        // Load saved data from localStorage
        loadLists();
        loadTasks();

        // Set up event listeners
        setupTaskCreationEvents();
        setupSortingEvents();
        setupListManagementEvents();
        setupNavigationEvents();
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
// Add this function to your JavaScript file to handle the different navigation views
// Add this to your todo.js file, within the setupNavigationEvents function

// Add this to your todo.js file to enhance the navigation system

// Add this within your setupNavigationEvents function
    function setupNavigationEvents() {
        // ... existing code ...

        // Add visual active state for navigation
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

        // Enhance the page title transition
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

        // Modify the filter functions to use the enhanced transitions

        // Modify filterTasksByDate
        function filterTasksByDate(dateString, viewTitle) {
            // First update the page title with animation
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

        // Similarly modify filterTasksByDateRange and filterTasksByPriority
        // with the same animation pattern

        // Update filterTasksByList to use the new animations
        function filterTasksByList(listName) {
            // First update the page title with animation
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

        // Initialize with Inbox view as active by default
        document.querySelector(".menu a:nth-child(6)").classList.add("active");
    }


    function setupNavigationEvents() {
        // Get all navigation links
        const navLinks = document.querySelectorAll(".menu a, .list-name");

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

        // Update the list item click handler to include the transition
        // This needs to be applied to any dynamically created list items
        function updateListClickHandlers() {
            document.querySelectorAll(".list-name").forEach(listNameEl => {
                // Remove old event listeners (if any)
                const newListNameEl = listNameEl.cloneNode(true);
                listNameEl.parentNode.replaceChild(newListNameEl, listNameEl);

                // Add new event listener with transition
                newListNameEl.addEventListener('click', function() {
                    const listName = this.textContent;
                    applyViewTransition(() => {
                        filterTasksByList(listName);
                    });
                });
            });
        }

        // Call this function after rendering lists
        updateListClickHandlers();
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

// Modify the renderLists function to update click handlers after rendering
    function renderLists() {
        listsContainer.innerHTML = '';

        lists.forEach((listName, index) => {
            const listItem = document.createElement("div");
            listItem.classList.add("list-item");

            // List name (clickable)
            const listName_el = document.createElement("span");
            listName_el.className = "list-name";
            listName_el.dataset.index = index;
            listName_el.textContent = listName;

            // We'll update the event listeners in a separate function

            // List actions (edit, delete)
            const listActions = document.createElement("div");
            listActions.className = "list-actions";

            // Edit button
            const editBtn = document.createElement("button");
            editBtn.className = "list-edit-btn";
            editBtn.dataset.index = index;
            editBtn.textContent = "Edit";
            editBtn.addEventListener('click', function () {
                editList(index, listItem);
            });

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "list-delete-btn";
            deleteBtn.dataset.index = index;
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener('click', function () {
                deleteList(index, listName);
            });

            // Assemble list item
            listActions.append(editBtn, deleteBtn);
            listItem.append(listName_el, listActions);
            listsContainer.appendChild(listItem);
        });

        // Update the click handlers for list items
        document.querySelectorAll(".list-name").forEach(listNameEl => {
            listNameEl.addEventListener('click', function() {
                const listName = this.textContent;
                applyViewTransition(() => {
                    filterTasksByList(listName);
                });
            });
        });
    }

// Filter tasks by date range
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

// Filter tasks by priority
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

    // ----------------------
    // Task Management
    // ----------------------
    function addTask() {
        const titleValue = taskTitle.value.trim();

        if (titleValue) {
            const newTask = {
                id: Date.now(), // Unique ID using timestamp
                title: titleValue,
                description: taskDescription.value.trim(),
                date: dueDate.value || null,
                reminder: reminder.value || null,
                priority: priority.value !== 'priority' ? priority.value : 'medium',
                list: listSelect.value !== 'default' ? listSelect.value : 'N/A',
                completed: false,
                createdAt: new Date().toISOString(),
                subtasks: [] // Initialize empty subtasks array
            };

            // Add task to global array
            tasks.push(newTask);
// Create task element
            const taskItem = createTaskElement(newTask);
            taskList.appendChild(taskItem);

// Add this line:
            removeNoTasksMessage();

// Save tasks to localStorage
            saveTasks();

            // Reset form
            clearTaskForm();

            // Collapse creation box
            taskCreationBox.classList.remove("expanded");
        } else {
            alert("Please enter a task title");
        }
    }

    function clearTaskForm() {
        taskTitle.value = '';
        taskDescription.value = '';
        dueDate.value = '';
        reminder.value = '';

        priority.value = 'priority';
        listSelect.value = 'default';

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

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.className = "delete-task";
        deleteButton.addEventListener("click", function () {
            deleteTask(task.id, taskItem);
        });

        // Assemble the task item
        metadata.append(dateDiv, reminderDiv, priorityDiv, listDiv);
        taskContent.append(titleDiv, descDiv, metadata, subtaskButton);

        // Render existing subtasks if any
        renderSubtasks(task, taskContent);

        taskItemInner.append(taskRing, taskContent);
        taskItem.append(taskItemInner, deleteButton);

        return taskItem;
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
    function saveFieldEdit(fieldName, value, task, displayElement, prefix = '') {
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

// Update this function to ensure date is formatted correctly when a task is added
    function addTask() {
        const titleValue = taskTitle.value.trim();

        if (titleValue) {
            const newTask = {
                id: Date.now(), // Unique ID using timestamp
                title: titleValue,
                description: taskDescription.value.trim(),
                date: dueDate.value || null,
                reminder: reminder.value || null,
                priority: priority.value !== 'priority' ? priority.value : 'medium',
                list: listSelect.value !== 'default' ? listSelect.value : 'N/A',
                completed: false,
                createdAt: new Date().toISOString(),
                subtasks: [] // Initialize empty subtasks array
            };

            // Add task to global array
            tasks.push(newTask);

            // Create task element
            const taskItem = createTaskElement(newTask);
            taskList.appendChild(taskItem);

            // Remove no tasks message if it exists
            removeNoTasksMessage();

            // Save tasks to localStorage
            saveTasks();

            // Reset form
            clearTaskForm();

            // Collapse creation box
            taskCreationBox.classList.remove("expanded");
        } else {
            alert("Please enter a task title");
        }
    }

// Update formatDate function to better handle different date formats
    function formatDate(dateString) {
        if (!dateString) return 'N/A';

        // Check if the date is already in dd/mm/yyyy format
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            return dateString;
        }

        // Convert from yyyy-mm-dd to dd/mm/yyyy
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                // Try parsing as yyyy-mm-dd if direct Date parsing fails
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
                }
                return 'N/A';
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return `${day}/${month}/${year}`;
        } catch (e) {
            // If any error occurs, return N/A
            return 'N/A';
        }
    }

// Ensure dates are formatted correctly when tasks are first displayed
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

        // Format dates for display - always format here to ensure consistent display
        const formattedDueDate = formatDate(task.date);
        const formattedReminderDate = formatDate(task.reminder);

        // Title with inline editing
        const titleDiv = createEditableField('title', task.title, 'task-title', task);

        // Description with inline editing
        const descDiv = createEditableField('description', task.description, 'task-desc', task);

        // Metadata container
        const metadata = document.createElement("div");
        metadata.classList.add("task-metadata");

        // Date with inline editing - use formatted date
        const dateDiv = createEditableField('date', formattedDueDate, '', task, 'Date: ');

        // Reminder with inline editing - use formatted date
        const reminderDiv = createEditableField('reminder', formattedReminderDate, '', task, 'Reminder: ');

        // Priority with inline editing (select dropdown)
        const priorityDiv = createEditableSelectField('priority', task.priority, task, ['low', 'medium', 'high'], 'Priority: ');

        // List with inline editing (select dropdown)
        const listDiv = createEditableSelectField('list', task.list, task, ['N/A', ...lists], 'List: ');

        // Store task ID in the DOM element for reference
        taskItem.dataset.id = task.id;

        // Create new subtask button
        const subtaskButton = createAddSubtaskButton(task, taskContent);

        // Delete button
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "×";
        deleteButton.className = "delete-task";
        deleteButton.addEventListener("click", function () {
            deleteTask(task.id, taskItem);
        });

        // Assemble the task item
        metadata.append(dateDiv, reminderDiv, priorityDiv, listDiv);
        taskContent.append(titleDiv, descDiv, metadata, subtaskButton);

        // Render existing subtasks if any
        renderSubtasks(task, taskContent);

        taskItemInner.append(taskRing, taskContent);
        taskItem.append(taskItemInner, deleteButton);

        return taskItem;
    }

// Update convertToInputDateFormat to better handle different date formats
    function convertToInputDateFormat(dateString) {
        if (!dateString || dateString === 'N/A') return '';

        // If already in yyyy-mm-dd format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // Convert from dd/mm/yyyy to yyyy-mm-dd
        try {
            const parts = dateString.split('/');
            if (parts.length === 3) {
                // Make sure we have year-month-day
                return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }

            // If not in expected format, try parsing as a date
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            // If any error occurs, return empty string
            console.error("Error converting date format:", e);
        }

        return '';
    }

// Fix formatDateForComparison to better handle date conversion
    function formatDateForComparison(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function toggleTaskCompletion(task, taskRingElement, taskItemElement) {
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
        taskRingElement.addEventListener("animationend", function handler() {
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
                saveTasks();
            }
        }, { once: true });
    }


    function deleteTask(taskId, taskElement) {
        if (confirm("Are you sure you want to delete this task?")) {
            // Remove from DOM
            taskElement.remove();

            // Remove from global array
            tasks = tasks.filter(task => task.id !== taskId);

            // Save changes
            saveTasks();
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

    // UPDATED: Removed date parameter from the function
    function saveNewSubtask(task, subtaskInput, subtaskItem, subtasksContainer) {
        const subtaskText = subtaskInput.value.trim();

        if (subtaskText) {
            // Create a new subtask object WITHOUT date field
            const newSubtask = {
                id: Date.now(), // Unique ID
                text: subtaskText,
                completed: false
                // date field removed
            };

            // Initialize subtasks array if it doesn't exist
            if (!task.subtasks) {
                task.subtasks = [];
            }

            // Add to task's subtasks
            task.subtasks.push(newSubtask);

            // Remove the input field
            subtaskInput.classList.remove('show');

            // Create the permanent subtask element
            setTimeout(() => {
                subtaskItem.innerHTML = ''; // Clear existing content

                // Create checkbox
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'subtask-checkbox';
                checkbox.addEventListener('change', function () {
                    newSubtask.completed = this.checked;

                    // Update subtask appearance
                    const subtaskText = subtaskItem.querySelector('.display-text');
                    if (this.checked) {
                        subtaskText.style.textDecoration = 'line-through';
                        subtaskText.style.color = '#888';
                    } else {
                        subtaskText.style.textDecoration = 'none';
                        subtaskText.style.color = '';
                    }

                    // Save changes
                    saveTask(task);
                });

                // Create editable text
                const editable = document.createElement('div');
                editable.className = 'editable-content';

                const displayText = document.createElement('div');
                displayText.className = 'display-text';
                displayText.textContent = newSubtask.text;

                // Make display text clickable for editing
                displayText.addEventListener('click', function (e) {
                    e.stopPropagation(); // Stop propagation

                    // Create edit input
                    const editInput = document.createElement('textarea');
                    editInput.className = 'expanding-input';
                    editInput.value = newSubtask.text;

                    // Replace display text with input
                    displayText.style.display = 'none';
                    editable.appendChild(editInput);

                    // Show animation
                    setTimeout(() => {
                        editInput.classList.add('show');
                        editInput.focus();
                        autoExpand(editInput);
                        editInput.addEventListener('input', () => autoExpand(editInput));
                    }, 10);

                    // Set up one-time click away listener
                    function handleClickAway(e) {
                        if (e.target !== editInput && e.target !== displayText) {
                            saveSubtaskEdit(newSubtask, editInput, displayText, task);

                            // Remove this event listener
                            document.removeEventListener("click", handleClickAway);
                        }
                    }

                    // Add the click away handler after a small delay
                    setTimeout(() => {
                        document.addEventListener("click", handleClickAway);
                    }, 10);

                    // Save on Enter or cancel on Escape
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

                // Create delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-subtask';
                deleteBtn.innerHTML = '×';
                deleteBtn.addEventListener('click', function () {
                    // Remove from task's subtasks array
                    task.subtasks = task.subtasks.filter(st => st.id !== newSubtask.id);

                    // Remove from DOM with animation
                    subtaskItem.style.opacity = '0';
                    subtaskItem.style.height = '0';
                    subtaskItem.style.margin = '0';
                    subtaskItem.style.transition = 'all 0.3s ease';

                    setTimeout(() => {
                        subtaskItem.remove();

                        // Remove container if empty
                        if (task.subtasks.length === 0) {
                            subtasksContainer.remove();
                        }

                        // Save changes
                        saveTask(task);
                    }, 300);
                });

                // Assemble the subtask item (WITHOUT metadata)
                editable.appendChild(displayText);
                subtaskItem.appendChild(checkbox);
                subtaskItem.appendChild(editable);
                subtaskItem.appendChild(deleteBtn);

                // Save changes
                saveTask(task);
            }, 300);
        } else {
            // If empty, just remove the item
            subtaskInput.classList.remove('show');
            setTimeout(() => {
                subtaskItem.remove();

                // Remove container if empty
                if (subtasksContainer.children.length === 0) {
                    subtasksContainer.remove();
                }
            }, 300);
        }
    }

    // UPDATED: Only handles text editing, no date editing
    function saveSubtaskEdit(subtask, editInput, displayText, task) {
        const newText = editInput.value.trim();

        if (newText) {
            // Update subtask
            subtask.text = newText;
            displayText.textContent = newText;

            // Save changes
            saveTask(task);
        }

        // Hide input with animation
        editInput.classList.remove('show');
        setTimeout(() => {
            displayText.style.display = 'block';
            editInput.remove();
        }, 300);
    }

    function saveTask(task) {
        // Find task in global array and update it
        const taskIndex = tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
            tasks[taskIndex] = task;
            saveTasks();
        }
    }

    // UPDATED: Removed date display from subtasks
    function renderSubtasks(task, taskContent) {
        // Skip if no subtasks
        if (!task.subtasks || task.subtasks.length === 0) return;

        // Create subtasks container
        const subtasksContainer = document.createElement('div');
        subtasksContainer.className = 'subtasks-container';

        // Render each subtask
        task.subtasks.forEach(subtask => {
            const subtaskItem = document.createElement('div');
            subtaskItem.className = 'subtask-item';

            // Create checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'subtask-checkbox';
            checkbox.checked = subtask.completed;
            checkbox.addEventListener('change', function () {
                subtask.completed = this.checked;

                // Update subtask appearance
                const subtaskText = subtaskItem.querySelector('.display-text');
                if (this.checked) {
                    subtaskText.style.textDecoration = 'line-through';
                    subtaskText.style.color = '#888';
                } else {
                    subtaskText.style.textDecoration = 'none';
                    subtaskText.style.color = '';
                }

                // Save changes
                saveTask(task);
            });

            // Create editable text
            const editable = document.createElement('div');
            editable.className = 'editable-content';

            const displayText = document.createElement('div');
            displayText.className = 'display-text';
            displayText.textContent = subtask.text;

            // Apply styling for completed subtasks
            if (subtask.completed) {
                displayText.style.textDecoration = 'line-through';
                displayText.style.color = '#888';
            }

            // Make display text clickable for editing
            displayText.addEventListener('click', function (e) {
                e.stopPropagation(); // Stop propagation

                // Create edit input
                const editInput = document.createElement('textarea');
                editInput.className = 'expanding-input';
                editInput.value = subtask.text;

                // Replace display text with input
                displayText.style.display = 'none';
                editable.appendChild(editInput);

                // Show animation
                setTimeoutsetTimeout(() => {
                    editInput.classList.add('show');
                    editInput.focus();
                    autoExpand(editInput);
                    editInput.addEventListener('input', () => autoExpand(editInput));
                }, 10);

                // Set up one-time click away listener
                function handleClickAway(e) {
                    if (e.target !== editInput && e.target !== displayText) {
                        saveSubtaskEdit(subtask, editInput, displayText, task);

                        // Remove this event listener
                        document.removeEventListener("click", handleClickAway);
                    }
                }

                // Add the click away handler after a small delay
                setTimeout(() => {
                    document.addEventListener("click", handleClickAway);
                }, 10);

                // Save on Enter or cancel on Escape
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

            // Create delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-subtask';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', function () {
                // Remove from task's subtasks array
                task.subtasks = task.subtasks.filter(st => st.id !== subtask.id);

                // Remove from DOM with animation
                subtaskItem.style.opacity = '0';
                subtaskItem.style.height = '0';
                subtaskItem.style.margin = '0';
                subtaskItem.style.transition = 'all 0.3s ease';

                setTimeout(() => {
                    subtaskItem.remove();

                    // Remove container if empty
                    if (task.subtasks.length === 0) {
                        subtasksContainer.remove();
                    }

                    // Save changes
                    saveTask(task);
                }, 300);
            });






            // Assemble the subtask item (WITHOUT metadata)
            editable.appendChild(displayText);
            subtaskItem.appendChild(checkbox);
            subtaskItem.appendChild(editable);
            subtaskItem.appendChild(deleteBtn);
            subtasksContainer.appendChild(subtaskItem);
        });

        // Add to the task content
        taskContent.appendChild(subtasksContainer);
    }

    // NEW: Create a function for the Add Subtask button
    function createAddSubtaskButton(task, taskContent) {
        const subtaskButton = document.createElement("button");
        subtaskButton.className = "subtask-button";
        subtaskButton.innerHTML = '<i class="fas fa-plus"></i> Add Subtask';
        subtaskButton.addEventListener("click", function (e) {
            e.stopPropagation(); // Prevent event bubbling

            // Check if there's already a subtasks container
            let subtasksContainer = taskContent.querySelector('.subtasks-container');
            if (!subtasksContainer) {
                // Create subtasks container if it doesn't exist
                subtasksContainer = document.createElement('div');
                subtasksContainer.className = 'subtasks-container';
                taskContent.appendChild(subtasksContainer);

                // Initialize subtasks array if it doesn't exist
                if (!task.subtasks) {
                    task.subtasks = [];
                }
            }

            // Create a new subtask creation form
            const subtaskItem = document.createElement('div');
            subtaskItem.className = 'subtask-item';

            // Create checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'subtask-checkbox';

            // Create expanding input for new subtask
            const subtaskInput = document.createElement('textarea');
            subtaskInput.className = 'expanding-input';
            subtaskInput.placeholder = 'Enter subtask...';
            subtaskInput.style.display = 'block';

            // Add the subtask creation elements to DOM (NO date input row)
            subtaskItem.appendChild(checkbox);
            subtaskItem.appendChild(subtaskInput);
            subtasksContainer.appendChild(subtaskItem);

            // Add subtask add and cancel buttons
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

            // Focus and show animation
            setTimeout(() => {
                subtaskInput.classList.add('show');
                subtaskInput.focus();
                autoExpand(subtaskInput);
                subtaskInput.addEventListener('input', () => autoExpand(subtaskInput));
            }, 10);

            // Cancel button handler
            cancelSubtaskBtn.addEventListener('click', function () {
                subtaskInput.classList.remove('show');
                setTimeout(() => {
                    subtaskItem.remove();
                    // Remove container if empty
                    if (subtasksContainer.children.length === 0) {
                        subtasksContainer.remove();
                    }
                }, 300);
            });

            // Add button handler - Note: no date is passed
            addSubtaskBtn.addEventListener('click', function () {
                saveNewSubtask(
                    task,
                    subtaskInput,
                    subtaskItem,
                    subtasksContainer
                );
            });

            // Save on Enter
            subtaskInput.addEventListener('keydown', function (e) {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveNewSubtask(
                        task,
                        subtaskInput,
                        subtaskItem,
                        subtasksContainer
                    );
                } else if (e.key === 'Escape') {
                    subtaskInput.classList.remove('show');
                    setTimeout(() => {
                        subtaskItem.remove();
                        // Remove container if empty
                        if (subtasksContainer.children.length === 0) {
                            subtasksContainer.remove();
                        }
                    }, 300);
                }
            });
        });

        return subtaskButton;
    }

    // ----------------------
    // List Management
    // ----------------------
    function addNewList() {
        const newListName = prompt("Enter a name for the new list:");

        if (newListName && newListName.trim()) {
            // Check if list already exists
            if (lists.includes(newListName.trim())) {
                alert("A list with this name already exists");
                return;
            }

            // Add to global array
            lists.push(newListName.trim());

            // Save and update UI
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

            // List name (clickable)
            const listName_el = document.createElement("span");
            listName_el.className = "list-name";
            listName_el.dataset.index = index;
            listName_el.textContent = listName;
            listName_el.addEventListener('click', function () {
                filterTasksByList(listName);
            });

            // List actions (edit, delete)
            const listActions = document.createElement("div");
            listActions.className = "list-actions";

            // Edit button
            const editBtn = document.createElement("button");
            editBtn.className = "list-edit-btn";
            editBtn.dataset.index = index;
            editBtn.textContent = "Edit";
            editBtn.addEventListener('click', function () {
                editList(index, listItem);
            });

            // Delete button
            const deleteBtn = document.createElement("button");
            deleteBtn.className = "list-delete-btn";
            deleteBtn.dataset.index = index;
            deleteBtn.textContent = "Delete";
            deleteBtn.addEventListener('click', function () {
                deleteList(index, listName);
            });

            // Assemble list item
            listActions.append(editBtn, deleteBtn);
            listItem.append(listName_el, listActions);
            listsContainer.appendChild(listItem);
        });
    }

    function editList(index, listItem) {
        const listNameEl = listItem.querySelector('.list-name');
        const currentName = lists[index];

        // Create edit input
        const editInput = document.createElement("input");
        editInput.className = "list-edit-input";
        editInput.value = currentName;

        // Replace list name with input
        listNameEl.style.display = 'none';
        listItem.insertBefore(editInput, listNameEl);
        editInput.focus();

        // Setup save on enter or blur
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
            // Check if the new name already exists
            if (lists.includes(newName)) {
                alert("A list with this name already exists");
                cancelListEdit(listItem, listNameEl, editInput);
                return;
            }

            const oldName = lists[index];
            lists[index] = newName;

            // Update tasks with this list name
            updateTasksWithNewListName(oldName, newName);

            // Save and update UI
            saveLists();
            updateListDropdown();
        }

        // Restore display
        listNameEl.textContent = lists[index];
        listNameEl.style.display = '';
        editInput.remove();
    }

    function cancelListEdit(listItem, listNameEl, editInput) {
        listNameEl.style.display = '';
        editInput.remove();
    }

    function deleteList(index, listName) {
        // Prevent deleting default lists
        if (['Personal', 'Work', 'Shopping'].includes(listName)) {
            alert('Cannot delete default lists');
            return;
        }

        if (confirm(`Are you sure you want to delete the list "${listName}"?`)) {
            // Remove from global array
            lists.splice(index, 1);

            // Update tasks that were in this list
            updateTasksWithDeletedList(listName);

            // Save and update UI
            saveLists();
            renderLists();
            updateListDropdown();
        }
    }

    function updateTasksWithNewListName(oldName, newName) {
        let tasksUpdated = false;

        // Update in memory tasks
        tasks.forEach(task => {
            if (task.list === oldName) {
                task.list = newName;
                tasksUpdated = true;
            }
        });

        // Update task elements in the DOM
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

        // Update in memory tasks
        tasks.forEach(task => {
            if (task.list === deletedListName) {
                task.list = 'N/A';
                tasksUpdated = true;
            }
        });

        // Update task elements in the DOM
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
        // Clear current options except the default one
        while (listSelect.options.length > 1) {
            listSelect.remove(1);
        }

        // Add list options
        lists.forEach(listName => {
            const option = document.createElement("option");
            option.value = listName;
            option.textContent = listName;
            listSelect.appendChild(option);
        });
    }

    function filterTasksByList(listName) {
        const taskItems = document.querySelectorAll(".task-item");

        taskItems.forEach(taskItem => {
            const parentLi = taskItem.closest('li');
            const taskList = taskItem.querySelector("[data-field='list'] .display-text").textContent.replace("List: ", "");

            if (listName === taskList) {
                parentLi.style.display = "flex";
            } else {
                parentLi.style.display = "none";
            }
        });

        // Update the page title to show which list is being viewed
        document.querySelector(".today-title").textContent = listName;
    }

    // ----------------------
    // Persistence Functions
    // ----------------------
    function loadTasks() {
        const savedTasks = localStorage.getItem("tasks");

        tasks = savedTasks ? JSON.parse(savedTasks) : [];

        // Render tasks to DOM
        renderTasks();
    }

    function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
    }

    function renderTasks() {
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
    }

    function loadLists() {
        const savedLists = localStorage.getItem("custom-lists");

        lists = savedLists ? JSON.parse(savedLists) : ["Personal", "Work", "Shopping"];

        // Update UI
        renderLists();
        updateListDropdown();
    }

    function saveLists() {
        localStorage.setItem("custom-lists", JSON.stringify(lists));
    }

    // ----------------------
    // Utility Functions
    // ----------------------
    function formatDate(dateString) {
        if (!dateString) return 'N/A';

        // Check if the date is already in dd/mm/yyyy format
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
            return dateString;
        }

        // Convert from yyyy-mm-dd to dd/mm/yyyy
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

        // If already in yyyy-mm-dd format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // Convert from dd/mm/yyyy to yyyy-mm-dd
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




    function parseDateString(dateString) {
        // Handle special cases
        if (dateString === 'N/A') return Number.MAX_SAFE_INTEGER; // Put at the end

        // Parse dd/mm/yyyy format
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return new Date(year, month - 1, day).getTime();
        }

        // Fallback to regular date parsing
        return new Date(dateString).getTime();
    }

    // Auto-expand textarea based on content
    window.autoExpand = function(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = (textarea.scrollHeight) + 'px';
    };
})

