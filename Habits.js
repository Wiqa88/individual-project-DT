// Enhanced Habit Tracker JavaScript
console.log('=== HABIT TRACKER STARTING ===');

// Global state
let habits = [];
let currentWeekStart = getWeekStart(new Date());
let selectedHabit = null;
let currentFilter = 'all';

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log('✅ DOM Content Loaded');
    initHabits();
    setupEventListeners();
});

function initHabits() {
    console.log('🚀 Initializing Habit Tracker...');
    loadHabits();

    // Create sample habits if none exist
    if (habits.length === 0) {
        createSampleHabits();
    }

    updateWeekDisplay();
    renderHabits();
    updateStats();
}

function createSampleHabits() {
    const sampleHabits = [
        {
            id: Date.now(),
            title: "Drink 8 glasses of water",
            description: "Stay hydrated throughout the day",
            category: "health",
            frequency: "daily",
            target: 8,
            unit: "glasses",
            createdAt: new Date().toISOString(),
            completions: {},
            streak: 0,
            bestStreak: 0,
            reminder: null,
            isActive: true
        },
        {
            id: Date.now() + 1,
            title: "Read for 30 minutes",
            description: "Build a consistent reading habit",
            category: "learning",
            frequency: "daily",
            target: 30,
            unit: "minutes",
            createdAt: new Date().toISOString(),
            completions: {},
            streak: 0,
            bestStreak: 0,
            reminder: "20:00",
            isActive: true
        }
    ];

    habits = sampleHabits;
    saveHabits();
    console.log('📝 Created sample habits');
}

function setupEventListeners() {
    // Modal handlers
    const addHabitLink = document.getElementById('add-habit-link');
    const createFirstHabit = document.getElementById('create-first-habit');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const saveHabitBtn = document.getElementById('save-habit');
    const cancelHabitBtn = document.getElementById('cancel-habit');

    if (addHabitLink) {
        addHabitLink.addEventListener('click', function(e) {
            e.preventDefault();
            showHabitModal();
        });
    }

    if (createFirstHabit) {
        createFirstHabit.addEventListener('click', function(e) {
            e.preventDefault();
            showHabitModal();
        });
    }

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    if (saveHabitBtn) {
        saveHabitBtn.addEventListener('click', saveHabit);
    }

    if (cancelHabitBtn) {
        cancelHabitBtn.addEventListener('click', closeModal);
    }

    // Week navigation
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');

    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', function() {
            currentWeekStart.setDate(currentWeekStart.getDate() - 7);
            updateWeekDisplay();
            renderHabits();
        });
    }

    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', function() {
            currentWeekStart.setDate(currentWeekStart.getDate() + 7);
            updateWeekDisplay();
            renderHabits();
        });
    }

    // Filter handlers
    const filterBtns = document.querySelectorAll('.menu a');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            if (this.id.startsWith('view-')) {
                e.preventDefault();

                // Remove active class from all filter buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                // Set filter
                if (this.id === 'view-all-habits') currentFilter = 'all';
                else if (this.id === 'view-active-habits') currentFilter = 'active';
                else if (this.id === 'view-completed-habits') currentFilter = 'completed';
                else if (this.id === 'view-streak-habits') currentFilter = 'streaks';

                renderHabits();
            }
        });
    });

    // Details modal handlers
    const editHabitBtn = document.getElementById('edit-habit');
    const deleteHabitBtn = document.getElementById('delete-habit');
    const archiveHabitBtn = document.getElementById('archive-habit');

    if (editHabitBtn) {
        editHabitBtn.addEventListener('click', function() {
            if (selectedHabit) {
                closeModal();
                showHabitModal(selectedHabit);
            }
        });
    }

    if (deleteHabitBtn) {
        deleteHabitBtn.addEventListener('click', function() {
            if (selectedHabit && confirm(`Are you sure you want to delete "${selectedHabit.title}"?`)) {
                deleteHabit(selectedHabit.id);
                closeModal();
            }
        });
    }

    if (archiveHabitBtn) {
        archiveHabitBtn.addEventListener('click', function() {
            if (selectedHabit) {
                archiveHabit(selectedHabit.id);
                closeModal();
            }
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
}

function showHabitModal(habit = null) {
    const modal = document.getElementById('habit-modal');
    const titleInput = document.getElementById('habit-title');
    const descriptionInput = document.getElementById('habit-description');
    const categorySelect = document.getElementById('habit-category');
    const frequencySelect = document.getElementById('habit-frequency');
    const targetInput = document.getElementById('habit-target');
    const unitSelect = document.getElementById('habit-unit');
    const reminderInput = document.getElementById('habit-reminder');

    // Clear or populate form
    if (habit) {
        titleInput.value = habit.title;
        descriptionInput.value = habit.description || '';
        categorySelect.value = habit.category;
        frequencySelect.value = habit.frequency;
        targetInput.value = habit.target;
        unitSelect.value = habit.unit;
        reminderInput.value = habit.reminder || '';

        modal.dataset.editingId = habit.id;
        document.querySelector('.modal-header h2').textContent = 'Edit Habit';
    } else {
        titleInput.value = '';
        descriptionInput.value = '';
        categorySelect.value = 'health';
        frequencySelect.value = 'daily';
        targetInput.value = '1';
        unitSelect.value = 'times';
        reminderInput.value = '';

        delete modal.dataset.editingId;
        document.querySelector('.modal-header h2').textContent = 'Create New Habit';
    }

    modal.style.display = 'flex';
    titleInput.focus();
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    selectedHabit = null;
}

function saveHabit() {
    const modal = document.getElementById('habit-modal');
    const titleInput = document.getElementById('habit-title');
    const descriptionInput = document.getElementById('habit-description');
    const categorySelect = document.getElementById('habit-category');
    const frequencySelect = document.getElementById('habit-frequency');
    const targetInput = document.getElementById('habit-target');
    const unitSelect = document.getElementById('habit-unit');
    const reminderInput = document.getElementById('habit-reminder');

    // Validate
    if (!titleInput.value.trim()) {
        showNotification('Please enter a habit title', 'error');
        return;
    }

    if (!targetInput.value || targetInput.value < 1) {
        showNotification('Please enter a valid target', 'error');
        return;
    }

    const habitData = {
        title: titleInput.value.trim(),
        description: descriptionInput.value.trim(),
        category: categorySelect.value,
        frequency: frequencySelect.value,
        target: parseInt(targetInput.value),
        unit: unitSelect.value,
        reminder: reminderInput.value || null
    };

    const editingId = modal.dataset.editingId;

    if (editingId) {
        // Edit existing habit
        const habitIndex = habits.findIndex(h => h.id == editingId);
        if (habitIndex !== -1) {
            habits[habitIndex] = { ...habits[habitIndex], ...habitData };
            showNotification('Habit updated successfully!', 'success');
        }
    } else {
        // Create new habit
        const newHabit = {
            id: Date.now(),
            ...habitData,
            createdAt: new Date().toISOString(),
            completions: {},
            streak: 0,
            bestStreak: 0,
            isActive: true
        };

        habits.push(newHabit);
        showNotification('Habit created successfully!', 'success');
    }

    saveHabits();
    closeModal();
    renderHabits();
    updateStats();
}

function deleteHabit(habitId) {
    habits = habits.filter(h => h.id !== habitId);
    saveHabits();
    renderHabits();
    updateStats();
    showNotification('Habit deleted successfully!', 'success');
}

function archiveHabit(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
        habit.isActive = false;
        habit.archivedAt = new Date().toISOString();
        saveHabits();
        renderHabits();
        updateStats();
        showNotification('Habit archived successfully!', 'success');
    }
}

function renderHabits() {
    const habitsGrid = document.getElementById('habits-grid');
    const emptyState = document.getElementById('empty-state');

    if (!habitsGrid) return;

    // Filter habits based on current filter
    let filteredHabits = habits.filter(habit => {
        if (currentFilter === 'all') return habit.isActive;
        if (currentFilter === 'active') return habit.isActive && habit.streak > 0;
        if (currentFilter === 'completed') return !habit.isActive;
        if (currentFilter === 'streaks') return habit.isActive && habit.streak >= 3;
        return true;
    });

    if (filteredHabits.length === 0) {
        habitsGrid.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    habitsGrid.style.display = 'grid';
    emptyState.style.display = 'none';

    habitsGrid.innerHTML = '';

    filteredHabits.forEach(habit => {
        const habitCard = createHabitCard(habit);
        habitsGrid.appendChild(habitCard);
    });
}

function createHabitCard(habit) {
    const card = document.createElement('div');
    card.className = `habit-card ${habit.category}`;
    card.dataset.habitId = habit.id;

    // Calculate progress for current week
    const weekProgress = calculateWeekProgress(habit);
    const progressPercentage = (weekProgress.completed / weekProgress.total) * 100;

    // Generate week view
    const weekDays = generateWeekDays();

    card.innerHTML = `
        <div class="habit-header">
            <div>
                <div class="habit-title">${habit.title}</div>
                ${habit.description ? `<div class="habit-description">${habit.description}</div>` : ''}
                <div class="habit-frequency">${habit.frequency} • ${habit.target} ${habit.unit}</div>
            </div>
            <div class="habit-controls">
                <button class="habit-control-btn edit" title="Edit Habit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="habit-control-btn delete" title="Delete Habit">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        
        <div class="habit-progress">
            <div class="habit-target">
                <span class="target-info">This week: ${weekProgress.completed}/${weekProgress.total}</span>
                <span class="target-value">${Math.round(progressPercentage)}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
        </div>
        
        <div class="habit-week">
            ${weekDays.map(day => `
                <div class="day-checkbox ${getdayStatus(habit, day)}" 
                     data-date="${formatDate(day)}" 
                     title="${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}">
                    ${day.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                </div>
            `).join('')}
        </div>
        
        <div class="habit-stats-row">
            <div class="habit-stat">
                <div class="habit-stat-number streak-number">${habit.streak}</div>
                <div class="habit-stat-label">Current Streak</div>
            </div>
            <div class="habit-stat">
                <div class="habit-stat-number">${habit.bestStreak}</div>
                <div class="habit-stat-label">Best Streak</div>
            </div>
            <div class="habit-stat">
                <div class="habit-stat-number completion-number">${calculateCompletionRate(habit)}%</div>
                <div class="habit-stat-label">Success Rate</div>
            </div>
        </div>
        
        ${habit.streak >= 7 ? `<div class="achievement-badge streak-${Math.min(habit.streak >= 100 ? 100 : habit.streak >= 30 ? 30 : 7, 100)}" title="${habit.streak} day streak!">🔥</div>` : ''}
    `;

    // Add event listeners
    setupHabitCardListeners(card, habit);

    return card;
}

function setupHabitCardListeners(card, habit) {
    // Card click to show details
    card.addEventListener('click', function(e) {
        // Don't trigger if clicking on controls or day checkboxes
        if (e.target.closest('.habit-controls') || e.target.closest('.day-checkbox')) return;
        showHabitDetails(habit);
    });

    // Edit button
    const editBtn = card.querySelector('.habit-control-btn.edit');
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showHabitModal(habit);
        });
    }

    // Delete button
    const deleteBtn = card.querySelector('.habit-control-btn.delete');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm(`Are you sure you want to delete "${habit.title}"?`)) {
                deleteHabit(habit.id);
            }
        });
    }

    // Day checkboxes
    const dayCheckboxes = card.querySelectorAll('.day-checkbox');
    dayCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('click', function(e) {
            e.stopPropagation();
            const date = this.dataset.date;
            const today = formatDate(new Date());

            // Only allow clicking on today or past days
            if (date <= today && !this.classList.contains('future')) {
                toggleHabitCompletion(habit, date, this);
            }
        });
    });
}

function toggleHabitCompletion(habit, date, element) {
    const wasCompleted = habit.completions[date] || false;

    if (wasCompleted) {
        // Mark as incomplete
        delete habit.completions[date];
        element.classList.remove('completed');
    } else {
        // Mark as complete
        habit.completions[date] = true;
        element.classList.add('completed');
        element.classList.add('completing');

        // Remove animation class after animation completes
        setTimeout(() => {
            element.classList.remove('completing');
        }, 600);
    }

    // Update streak
    updateStreak(habit);

    // Save and update
    saveHabits();
    updateStats();

    // Show notification
    const message = wasCompleted ? 'Habit unmarked!' : 'Great job! Habit completed!';
    showNotification(message, wasCompleted ? 'warning' : 'success');

    // Update the card display
    setTimeout(() => {
        renderHabits();
    }, 100);
}

function updateStreak(habit) {
    const today = new Date();
    let currentStreak = 0;
    let checkDate = new Date(today);

    // Count consecutive days backwards from today
    while (true) {
        const dateStr = formatDate(checkDate);
        if (habit.completions[dateStr]) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
        } else {
            break;
        }
    }

    habit.streak = currentStreak;
    habit.bestStreak = Math.max(habit.bestStreak, currentStreak);
}

function showHabitDetails(habit) {
    selectedHabit = habit;
    const modal = document.getElementById('habit-details-modal');

    // Update modal content
    document.getElementById('detail-habit-title').textContent = habit.title;
    document.getElementById('detail-current-streak').textContent = habit.streak;
    document.getElementById('detail-best-streak').textContent = habit.bestStreak;
    document.getElementById('detail-completion-rate').textContent = calculateCompletionRate(habit) + '%';

    modal.style.display = 'flex';
}

function calculateWeekProgress(habit) {
    const weekDays = generateWeekDays();
    const today = new Date();

    let total = 0;
    let completed = 0;

    weekDays.forEach(day => {
        if (day <= today) {
            total++;
            const dateStr = formatDate(day);
            if (habit.completions[dateStr]) {
                completed++;
            }
        }
    });

    return { completed, total: Math.max(total, 1) };
}

function calculateCompletionRate(habit) {
    const createdDate = new Date(habit.createdAt);
    const today = new Date();
    const daysSinceCreated = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24)) + 1;

    const completedDays = Object.keys(habit.completions).length;
    const rate = (completedDays / daysSinceCreated) * 100;

    return Math.round(Math.min(rate, 100));
}

function generateWeekDays() {
    const days = [];
    const start = new Date(currentWeekStart);

    for (let i = 0; i < 7; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        days.push(day);
    }

    return days;
}

function getWeekStart(date) {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay()); // Go to Sunday
    start.setHours(0, 0, 0, 0);
    return start;
}

function getWeekEnd(weekStart) {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
}

function updateWeekDisplay() {
    const currentWeekElement = document.getElementById('current-week');
    if (!currentWeekElement) return;

    const weekEnd = getWeekEnd(currentWeekStart);
    const today = new Date();

    if (isCurrentWeek(currentWeekStart)) {
        currentWeekElement.textContent = 'This Week';
    } else if (currentWeekStart < today) {
        const weeksAgo = Math.ceil((today - currentWeekStart) / (7 * 24 * 60 * 60 * 1000));
        currentWeekElement.textContent = `${weeksAgo} week${weeksAgo > 1 ? 's' : ''} ago`;
    } else {
        const weeksAhead = Math.ceil((currentWeekStart - today) / (7 * 24 * 60 * 60 * 1000));
        currentWeekElement.textContent = `In ${weeksAhead} week${weeksAhead > 1 ? 's' : ''}`;
    }
}

function isCurrentWeek(weekStart) {
    const today = new Date();
    const thisWeekStart = getWeekStart(today);
    return weekStart.getTime() === thisWeekStart.getTime();
}

function getdayStatus(habit, date) {
    const dateStr = formatDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    let classes = [];

    if (checkDate.getTime() === today.getTime()) {
        classes.push('today');
    } else if (checkDate > today) {
        classes.push('future');
    }

    if (habit.completions[dateStr]) {
        classes.push('completed');
    }

    return classes.join(' ');
}

function updateStats() {
    const activeHabits = habits.filter(h => h.isActive);
    const today = formatDate(new Date());

    // Count today's completions
    const completedToday = activeHabits.filter(habit => habit.completions[today]).length;

    // Count active streaks (habits with streak > 0)
    const activeStreaks = activeHabits.filter(habit => habit.streak > 0).length;

    // Calculate overall success rate
    const totalCompletions = activeHabits.reduce((total, habit) => {
        return total + Object.keys(habit.completions).length;
    }, 0);

    const totalPossibleDays = activeHabits.reduce((total, habit) => {
        const createdDate = new Date(habit.createdAt);
        const daysSinceCreated = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24)) + 1;
        return total + daysSinceCreated;
    }, 0);

    const successRate = totalPossibleDays > 0 ? Math.round((totalCompletions / totalPossibleDays) * 100) : 0;

    // Update stats in sidebar
    const totalHabitsElement = document.getElementById('total-habits');
    const activeStreaksElement = document.getElementById('active-streaks');
    const completedTodayElement = document.getElementById('completed-today');
    const successRateElement = document.getElementById('success-rate');

    if (totalHabitsElement) totalHabitsElement.textContent = activeHabits.length;
    if (activeStreaksElement) activeStreaksElement.textContent = activeStreaks;
    if (completedTodayElement) completedTodayElement.textContent = completedToday;
    if (successRateElement) successRateElement.textContent = successRate + '%';
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function showNotification(message, type = 'success') {
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Data persistence functions
function loadHabits() {
    const savedHabits = localStorage.getItem('habits');
    habits = savedHabits ? JSON.parse(savedHabits) : [];
    console.log(`📊 Loaded ${habits.length} habits from localStorage`);
}

function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
    console.log('💾 Habits saved to localStorage');
}

// Integration with todo system - check for tasks marked as habits
function loadHabitsFromTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const habitTasks = tasks.filter(task => task.isHabit);

    habitTasks.forEach(task => {
        // Check if habit already exists
        const existingHabit = habits.find(h => h.sourceTaskId === task.id);

        if (!existingHabit) {
            // Create new habit from task
            const newHabit = {
                id: Date.now() + Math.random(),
                title: task.title,
                description: task.description || '',
                category: getCategoryFromList(task.list),
                frequency: 'daily',
                target: 1,
                unit: 'times',
                createdAt: task.createdAt || new Date().toISOString(),
                completions: {},
                streak: 0,
                bestStreak: 0,
                reminder: task.reminder || null,
                isActive: true,
                sourceTaskId: task.id
            };

            habits.push(newHabit);
        }
    });

    if (habitTasks.length > 0) {
        saveHabits();
        renderHabits();
        updateStats();
    }
}

function getCategoryFromList(listName) {
    const categoryMap = {
        'Personal': 'personal',
        'Work': 'productivity',
        'Health': 'health',
        'Learning': 'learning',
        'Social': 'social'
    };

    return categoryMap[listName] || 'personal';
}

// Export function to be called from todo.js
window.createHabitFromTask = function(task) {
    const newHabit = {
        id: Date.now(),
        title: task.title,
        description: task.description || '',
        category: getCategoryFromList(task.list),
        frequency: 'daily',
        target: 1,
        unit: 'times',
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

    // Check if habit already exists
    const existingHabit = existingHabits.find(h => h.sourceTaskId === task.id);

    if (!existingHabit) {
        existingHabits.push(newHabit);
        localStorage.setItem('habits', JSON.stringify(existingHabits));

        // Mark task as habit
        task.isHabit = true;
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        const taskIndex = tasks.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
            tasks[taskIndex] = task;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }

        return true;
    }

    return false;
};

// Load habits from tasks on initialization
document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
        loadHabitsFromTasks();
    }, 1000);
});

console.log('✅ Enhanced Habit Tracker loaded successfully');