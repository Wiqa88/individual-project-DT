console.log('=== EISENHOWER MATRIX STARTING ===');

let tasks = [];
let currentEditingTask = null;

document.addEventListener("DOMContentLoaded", function() {
    console.log('✅ DOM Content Loaded');
    initMatrix();
    setupEventListeners();
});

function initMatrix() {
    console.log('🚀 Initializing Eisenhower Matrix...');
    loadTasks();
    categorizeTasks();
    updateStats();
}

function setupEventListeners() {
    const refreshBtn = document.getElementById('refresh-tasks');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            refreshTasks();
        });
    }

    const closeModalBtns = document.querySelectorAll('.close-modal');
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    const cancelEditBtn = document.getElementById('cancel-edit');
    const saveClassificationBtn = document.getElementById('save-classification');
    const editInTodoBtn = document.getElementById('edit-in-todo');

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', closeModal);
    }

    if (saveClassificationBtn) {
        saveClassificationBtn.addEventListener('click', saveTaskClassification);
    }

    if (editInTodoBtn) {
        editInTodoBtn.addEventListener('click', function() {
            window.location.href = 'todo.html';
        });
    }

    // Urgency and importance change handlers for live preview
    const urgencySelect = document.getElementById('task-urgency');
    const importanceSelect = document.getElementById('task-importance');

    if (urgencySelect && importanceSelect) {
        urgencySelect.addEventListener('change', updateQuadrantPreview);
        importanceSelect.addEventListener('change', updateQuadrantPreview);
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('edit-task-modal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

function loadTasks() {
    // Load tasks from localStorage (same as todo page)
    const savedTasks = localStorage.getItem('tasks');
    tasks = savedTasks ? JSON.parse(savedTasks) : [];
    console.log(`📊 Loaded ${tasks.length} tasks from localStorage`);
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    console.log('💾 Tasks saved to localStorage');
}

function refreshTasks() {
    // Show loading state
    showLoadingState();

    // Reload tasks with a small delay for visual feedback
    setTimeout(() => {
        loadTasks();
        categorizeTasks();
        updateStats();
        showRefreshNotification();
    }, 500);
}

function showLoadingState() {
    const quadrants = ['q1-tasks', 'q2-tasks', 'q3-tasks', 'q4-tasks'];

    quadrants.forEach(quadrantId => {
        const quadrant = document.getElementById(quadrantId);
        if (quadrant) {
            quadrant.innerHTML = `
                <div class="loading">
                    <i class="fas fa-spinner"></i>
                    <p>Loading tasks...</p>
                </div>
            `;
        }
    });
}

function showRefreshNotification() {
    showNotification('Tasks refreshed!', 'success');
}

function showNotification(message, type = 'success') {
    // Create notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#2ed573' : type === 'error' ? '#ff4757' : '#1e3a8a'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}"></i> ${message}`;

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

function categorizeTasks() {
    // Filter out completed tasks for cleaner view (optional - you can change this)
    const activeTasks = tasks; // Show all tasks including completed ones

    // Initialize quadrants
    const quadrants = {
        q1: [], // Urgent & Important
        q2: [], // Important, Not Urgent
        q3: [], // Urgent, Not Important
        q4: []  // Neither Urgent nor Important
    };

    activeTasks.forEach(task => {
        const isUrgent = isTaskUrgent(task);
        const isImportant = isTaskImportant(task);

        if (isUrgent && isImportant) {
            quadrants.q1.push(task);
        } else if (!isUrgent && isImportant) {
            quadrants.q2.push(task);
        } else if (isUrgent && !isImportant) {
            quadrants.q3.push(task);
        } else {
            quadrants.q4.push(task);
        }
    });

    // Render tasks in each quadrant
    renderQuadrant('q1-tasks', quadrants.q1, 'urgent-important');
    renderQuadrant('q2-tasks', quadrants.q2, 'important');
    renderQuadrant('q3-tasks', quadrants.q3, 'urgent');
    renderQuadrant('q4-tasks', quadrants.q4, 'neither');

    console.log('📋 Tasks categorized:', {
        'Urgent & Important': quadrants.q1.length,
        'Important': quadrants.q2.length,
        'Urgent': quadrants.q3.length,
        'Neither': quadrants.q4.length
    });
}

function isTaskUrgent(task) {
    // A task is urgent if:
    // 1. It has a due date that's today or overdue
    // 2. It has high priority

    if (task.priority === 'high' || task.priority === 'High') {
        return true;
    }

    if (task.date) {
        const today = new Date();
        const taskDate = new Date(task.date);

        // Remove time component for date comparison
        today.setHours(0, 0, 0, 0);
        taskDate.setHours(0, 0, 0, 0);

        // Task is urgent if due today or overdue
        return taskDate <= today;
    }

    return false;
}

function isTaskImportant(task) {
    // A task is important if:
    // 1. It has medium or high priority
    // 2. It belongs to Work or Personal lists
    // 3. It has a future due date (planned ahead)

    if (task.priority === 'high' || task.priority === 'High' ||
        task.priority === 'medium' || task.priority === 'Medium') {
        return true;
    }

    if (task.list === 'Work' || task.list === 'Personal') {
        return true;
    }

    // If task has a future date (more than today), it might be important planning
    if (task.date) {
        const today = new Date();
        const taskDate = new Date(task.date);

        today.setHours(0, 0, 0, 0);
        taskDate.setHours(0, 0, 0, 0);

        // If it's scheduled for the future, consider it important
        if (taskDate > today) {
            return true;
        }
    }

    return false;
}

function renderQuadrant(quadrantId, tasksInQuadrant, type) {
    const quadrant = document.getElementById(quadrantId);
    if (!quadrant) return;

    if (tasksInQuadrant.length === 0) {
        quadrant.innerHTML = getEmptyState(type);
        return;
    }

    let html = '';
    tasksInQuadrant.forEach(task => {
        html += createTaskHTML(task);
    });

    quadrant.innerHTML = html;

    // Add event listeners to task elements
    addTaskEventListeners(quadrant);
}

function addTaskEventListeners(quadrant) {
    // Task click handlers
    const taskItems = quadrant.querySelectorAll('.task-item');
    taskItems.forEach(taskItem => {
        const taskId = taskItem.dataset.taskId;

        // Task click to view details
        taskItem.addEventListener('click', function(e) {
            // Don't trigger if clicking on control buttons
            if (e.target.closest('.task-controls')) return;

            const task = tasks.find(t => t.id == taskId);
            if (task) {
                showTaskDetails(task);
            }
        });

        // Edit button handler
        const editBtn = taskItem.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const task = tasks.find(t => t.id == taskId);
                if (task) {
                    openEditModal(task);
                }
            });
        }

        // Delete button handler
        const deleteBtn = taskItem.querySelector('.delete-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const task = tasks.find(t => t.id == taskId);
                if (task) {
                    deleteTask(task);
                }
            });
        }

        // Complete/incomplete button handler
        const completeBtn = taskItem.querySelector('.complete-btn');
        if (completeBtn) {
            completeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const task = tasks.find(t => t.id == taskId);
                if (task) {
                    toggleTaskCompletion(task);
                }
            });
        }
    });
}

function getEmptyState(type) {
    const emptyStates = {
        'urgent-important': {
            icon: 'fas fa-fire',
            message: 'No urgent and important tasks'
        },
        'important': {
            icon: 'fas fa-star',
            message: 'No important tasks to schedule'
        },
        'urgent': {
            icon: 'fas fa-clock',
            message: 'No urgent tasks to delegate'
        },
        'neither': {
            icon: 'fas fa-ban',
            message: 'No tasks to eliminate'
        }
    };

    const state = emptyStates[type];
    return `
        <div class="empty-state">
            <i class="${state.icon}"></i>
            <p>${state.message}</p>
        </div>
    `;
}

function createTaskHTML(task) {
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const getPriorityText = (priority) => {
        if (!priority || priority === 'priority') return '';
        return priority.charAt(0).toUpperCase() + priority.slice(1);
    };

    const completedClass = task.completed ? 'completed' : '';
    const priorityAttr = task.priority ? `data-priority="${task.priority.toLowerCase()}"` : '';

    let metaInfo = [];

    if (task.date) {
        metaInfo.push(`<span><i class="fas fa-calendar"></i> ${formatDate(task.date)}</span>`);
    }

    if (task.priority && task.priority !== 'priority') {
        metaInfo.push(`<span><i class="fas fa-flag"></i> ${getPriorityText(task.priority)}</span>`);
    }

    if (task.list && task.list !== 'N/A') {
        metaInfo.push(`<span><i class="fas fa-list"></i> ${task.list}</span>`);
    }

    // Control buttons
    const completeIcon = task.completed ? 'fas fa-undo' : 'fas fa-check';
    const completeTitle = task.completed ? 'Mark Incomplete' : 'Mark Complete';

    return `
        <div class="task-item ${completedClass}" ${priorityAttr} data-task-id="${task.id}">
            <div class="task-title">${task.title}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            ${metaInfo.length > 0 ? `<div class="task-meta">${metaInfo.join('')}</div>` : ''}
            <div class="task-controls">
                <button class="control-btn complete-btn" title="${completeTitle}">
                    <i class="${completeIcon}"></i>
                </button>
                <button class="control-btn edit-btn" title="Edit Task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="control-btn delete-btn" title="Delete Task">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `;
}

function showTaskDetails(task) {
    // Create a simple task details view
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Task Details</h3>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <h4>${task.title}</h4>
                ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
                <p><strong>Priority:</strong> ${task.priority || 'Not set'}</p>
                <p><strong>Due Date:</strong> ${task.date ? new Date(task.date).toLocaleDateString() : 'Not set'}</p>
                <p><strong>List:</strong> ${task.list || 'N/A'}</p>
                <p><strong>Status:</strong> ${task.completed ? 'Completed' : 'Pending'}</p>
                ${task.reminder ? `<p><strong>Reminder:</strong> ${new Date(task.reminder).toLocaleDateString()}</p>` : ''}
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="openEditModal(tasks.find(t => t.id == ${task.id})); this.closest('.modal').remove();">Edit</button>
                <button class="btn btn-secondary" onclick="this.closest('.modal').remove();">Close</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Add close handler
    modal.querySelector('.close-modal').addEventListener('click', function() {
        modal.remove();
    });

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function openEditModal(task) {
    currentEditingTask = task;
    const modal = document.getElementById('edit-task-modal');

    // Set current values
    const urgencySelect = document.getElementById('task-urgency');
    const importanceSelect = document.getElementById('task-importance');

    // Determine current urgency level
    let urgencyLevel = 'low';
    if (isTaskUrgent(task)) {
        urgencyLevel = task.priority === 'high' || task.priority === 'High' ? 'high' : 'medium';
    }

    // Determine current importance level
    let importanceLevel = 'low';
    if (isTaskImportant(task)) {
        if (task.priority === 'high' || task.priority === 'High') {
            importanceLevel = 'high';
        } else if (task.priority === 'medium' || task.priority === 'Medium' ||
            task.list === 'Work' || task.list === 'Personal') {
            importanceLevel = 'medium';
        } else {
            importanceLevel = 'medium';
        }
    }

    urgencySelect.value = urgencyLevel;
    importanceSelect.value = importanceLevel;

    updateQuadrantPreview();
    modal.style.display = 'flex';
}

function updateQuadrantPreview() {
    const urgencySelect = document.getElementById('task-urgency');
    const importanceSelect = document.getElementById('task-importance');
    const preview = document.getElementById('quadrant-preview');

    const urgency = urgencySelect.value;
    const importance = importanceSelect.value;

    let quadrantName = '';
    let quadrantColor = '';

    if ((urgency === 'high' || urgency === 'medium') && (importance === 'high' || importance === 'medium')) {
        quadrantName = 'Do First (Urgent & Important)';
        quadrantColor = '#ff4757';
    } else if ((urgency === 'low') && (importance === 'high' || importance === 'medium')) {
        quadrantName = 'Schedule (Important, Not Urgent)';
        quadrantColor = '#2ed573';
    } else if ((urgency === 'high' || urgency === 'medium') && (importance === 'low')) {
        quadrantName = 'Delegate (Urgent, Not Important)';
        quadrantColor = '#ffa502';
    } else {
        quadrantName = 'Eliminate (Neither Urgent nor Important)';
        quadrantColor = '#747d8c';
    }

    preview.textContent = quadrantName;
    preview.style.backgroundColor = quadrantColor;
    preview.style.color = 'white';
}

function saveTaskClassification() {
    if (!currentEditingTask) return;

    const urgencySelect = document.getElementById('task-urgency');
    const importanceSelect = document.getElementById('task-importance');

    const urgency = urgencySelect.value;
    const importance = importanceSelect.value;

    // Update task properties based on classification
    if (importance === 'high') {
        currentEditingTask.priority = 'high';
    } else if (importance === 'medium') {
        currentEditingTask.priority = 'medium';
    } else {
        currentEditingTask.priority = 'low';
    }

    // If urgency is high but importance is low, we might want to adjust
    if (urgency === 'high' && importance === 'low') {
        // This goes to delegate quadrant - maybe set reminder or different handling
        currentEditingTask.priority = 'medium'; // Compromise
    }

    // Save changes
    saveTasks();

    // Refresh matrix
    categorizeTasks();
    updateStats();

    // Close modal
    closeModal();

    showNotification('Task classification updated!', 'success');
}

function deleteTask(task) {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
        // Remove from tasks array
        tasks = tasks.filter(t => t.id !== task.id);

        // Save changes
        saveTasks();

        // Refresh matrix
        categorizeTasks();
        updateStats();

        showNotification('Task deleted successfully!', 'success');
    }
}

function toggleTaskCompletion(task) {
    // Toggle completion status
    task.completed = !task.completed;

    // Save changes
    saveTasks();

    // Refresh matrix
    categorizeTasks();
    updateStats();

    const message = task.completed ? 'Task marked as complete!' : 'Task marked as incomplete!';
    showNotification(message, 'success');
}

function closeModal() {
    const modal = document.getElementById('edit-task-modal');
    modal.style.display = 'none';
    currentEditingTask = null;
}

function updateStats() {
    const activeTasks = tasks.filter(task => !task.completed);

    // Count tasks in each quadrant
    let q1Count = 0, q2Count = 0, q3Count = 0, q4Count = 0;

    activeTasks.forEach(task => {
        const isUrgent = isTaskUrgent(task);
        const isImportant = isTaskImportant(task);

        if (isUrgent && isImportant) {
            q1Count++;
        } else if (!isUrgent && isImportant) {
            q2Count++;
        } else if (isUrgent && !isImportant) {
            q3Count++;
        } else {
            q4Count++;
        }
    });

    // Update stats in sidebar
    const totalTasksElement = document.getElementById('total-tasks');
    const q1CountElement = document.getElementById('q1-count');
    const q2CountElement = document.getElementById('q2-count');
    const q3CountElement = document.getElementById('q3-count');
    const q4CountElement = document.getElementById('q4-count');

    if (totalTasksElement) totalTasksElement.textContent = activeTasks.length;
    if (q1CountElement) q1CountElement.textContent = q1Count;
    if (q2CountElement) q2CountElement.textContent = q2Count;
    if (q3CountElement) q3CountElement.textContent = q3Count;
    if (q4CountElement) q4CountElement.textContent = q4Count;
}

// Utility functions
function isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);

    return today.getFullYear() === checkDate.getFullYear() &&
        today.getMonth() === checkDate.getMonth() &&
        today.getDate() === checkDate.getDate();
}

function isOverdue(date) {
    const today = new Date();
    const checkDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate < today;
}

function getDaysUntilDue(date) {
    const today = new Date();
    const dueDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

console.log('✅ Enhanced Eisenhower Matrix loaded successfully');