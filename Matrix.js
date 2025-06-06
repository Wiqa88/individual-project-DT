// Eisenhower Matrix JavaScript
console.log('=== EISENHOWER MATRIX STARTING ===');

// Global state
let tasks = [];

// Wait for DOM to be fully loaded
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
    // Refresh tasks button
    const refreshBtn = document.getElementById('refresh-tasks');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function(e) {
            e.preventDefault();
            refreshTasks();
        });
    }
}

function loadTasks() {
    // Load tasks from localStorage (same as todo page)
    const savedTasks = localStorage.getItem('tasks');
    tasks = savedTasks ? JSON.parse(savedTasks) : [];

    console.log(`📊 Loaded ${tasks.length} tasks from localStorage`);
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
    // Create notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2ed573;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.innerHTML = '<i class="fas fa-check"></i> Tasks refreshed!';

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
    // Filter out completed tasks for cleaner view (optional)
    const activeTasks = tasks.filter(task => !task.completed);

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
    // 2. It belongs to Work or Personal lists (you can customize this)
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

function renderQuadrant(quadrantId, tasks, type) {
    const quadrant = document.getElementById(quadrantId);
    if (!quadrant) return;

    if (tasks.length === 0) {
        quadrant.innerHTML = getEmptyState(type);
        return;
    }

    let html = '';
    tasks.forEach(task => {
        html += createTaskHTML(task);
    });

    quadrant.innerHTML = html;
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

    return `
        <div class="task-item ${completedClass}" ${priorityAttr} data-task-id="${task.id}">
            <div class="task-title">${task.title}</div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            ${metaInfo.length > 0 ? `<div class="task-meta">${metaInfo.join('')}</div>` : ''}
        </div>
    `;
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

// Utility function to check if a date is today
function isToday(date) {
    const today = new Date();
    const checkDate = new Date(date);

    return today.getFullYear() === checkDate.getFullYear() &&
        today.getMonth() === checkDate.getMonth() &&
        today.getDate() === checkDate.getDate();
}

// Utility function to check if a date is overdue
function isOverdue(date) {
    const today = new Date();
    const checkDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate < today;
}

// Utility function to get days until due date
function getDaysUntilDue(date) {
    const today = new Date();
    const dueDate = new Date(date);

    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);

    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

console.log('✅ Eisenhower Matrix loaded successfully');