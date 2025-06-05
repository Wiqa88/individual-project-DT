// COMPLETE WORKING CALENDAR WITH POMODORO - Replace your Cal.js with this
console.log('=== CALENDAR WITH POMODORO STARTING ===');

// Global state
let events = [];
let tasks = [];
let lists = ['Personal', 'Work', 'Shopping'];
let currentDate = new Date();
let currentView = 'month';
let selectedEvent = null;
let currentPage = 'calendar'; // 'calendar' or 'pomodoro'

// Pomodoro state
let pomodoroTimer = {
    timeLeft: 25 * 60, // 25 minutes in seconds
    isRunning: false,
    currentMode: 'work', // 'work', 'shortBreak', 'longBreak'
    currentSession: 1,
    totalSessions: 4,
    completedSessions: 0,
    totalFocusTime: 0,
    intervals: null,
    settings: {
        workTime: 25,
        shortBreak: 5,
        longBreak: 15
    }
};

// Date formatters
let dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
let monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
let timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function() {
    console.log('✅ DOM Content Loaded');
    initApp();
    setupEventListeners();
    loadPomodoroSettings();
});

function initApp() {
    console.log('🚀 Initializing calendar...');

    // Load data
    loadLists();
    loadTasks();
    loadEvents();

    // Create test events if none exist
    if (events.length === 0) {
        createTestEvents();
    }

    // Initialize calendar
    updateCalendarTitle();
    renderMiniCalendar();
    updateCalendarView();

    // Initialize pomodoro
    updatePomodoroDisplay();

    console.log(`📊 Initialized with ${events.length} events and ${lists.length} lists`);
}

function createTestEvents() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    events = [
        {
            id: 1001,
            title: "Team Meeting",
            date: formatDate(today),
            time: "10:00",
            endTime: "11:00",
            description: "Weekly team sync",
            list: "Work",
            priority: "high",
            createdAt: new Date().toISOString()
        },
        {
            id: 1002,
            title: "Lunch with Sarah",
            date: formatDate(today),
            time: "12:30",
            endTime: "13:30",
            description: "Catch up lunch",
            list: "Personal",
            priority: "medium",
            createdAt: new Date().toISOString()
        },
        {
            id: 1003,
            title: "Grocery Shopping",
            date: formatDate(tomorrow),
            time: "15:00",
            endTime: "16:00",
            description: "Weekly grocery run",
            list: "Shopping",
            priority: "low",
            createdAt: new Date().toISOString()
        }
    ];

    saveEvents();
    console.log('📝 Created test events');
}

function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');

    // Page navigation
    const pomodoroLink = document.getElementById('pomodoro-link');
    const backToCalendar = document.getElementById('back-to-calendar');

    if (pomodoroLink) {
        pomodoroLink.addEventListener('click', function(e) {
            e.preventDefault();
            showPomodoroPage();
        });
    }

    if (backToCalendar) {
        backToCalendar.addEventListener('click', function(e) {
            e.preventDefault();
            showCalendarPage();
        });
    }

    // Calendar event listeners
    setupCalendarEventListeners();

    // Pomodoro event listeners
    setupPomodoroEventListeners();
}

function setupCalendarEventListeners() {
    // View buttons
    document.querySelectorAll('.view-option').forEach(button => {
        button.addEventListener('click', function() {
            changeView(this.dataset.view);
        });
    });

    // Navigation buttons
    const prevBtn = document.getElementById('prev-period');
    const nextBtn = document.getElementById('next-period');

    if (prevBtn) prevBtn.addEventListener('click', navigatePrevious);
    if (nextBtn) nextBtn.addEventListener('click', navigateNext);

    // Mini calendar navigation
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderMiniCalendar();
            updateCalendarTitle();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function() {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderMiniCalendar();
            updateCalendarTitle();
        });
    }

    // Modal event listeners
    const addEventLink = document.getElementById('add-event-link');
    const eventModal = document.getElementById('event-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const cancelEventButton = document.getElementById('cancel-event');
    const saveEventButton = document.getElementById('save-event');

    if (addEventLink) {
        addEventLink.addEventListener('click', function(e) {
            e.preventDefault();
            showAddEventModal();
        });
    }

    if (closeModalButtons) {
        closeModalButtons.forEach(button => {
            button.addEventListener('click', closeAllModals);
        });
    }

    if (cancelEventButton) cancelEventButton.addEventListener('click', closeAllModals);
    if (saveEventButton) saveEventButton.addEventListener('click', saveEvent);

    // Details modal buttons
    const deleteEventBtn = document.getElementById('delete-event');
    const editEventBtn = document.getElementById('edit-event');

    if (deleteEventBtn) deleteEventBtn.addEventListener('click', deleteSelectedEvent);
    if (editEventBtn) editEventBtn.addEventListener('click', editSelectedEvent);

    // Sidebar navigation
    const weekLink = document.getElementById('week-link');
    const monthLink = document.getElementById('month-link');

    if (weekLink) {
        weekLink.addEventListener('click', function(e) {
            e.preventDefault();
            changeView('week');
        });
    }

    if (monthLink) {
        monthLink.addEventListener('click', function(e) {
            e.preventDefault();
            changeView('month');
        });
    }

    // List management
    const addListBtn = document.getElementById('add-list-btn');
    if (addListBtn) addListBtn.addEventListener('click', addNewList);
}

function setupPomodoroEventListeners() {
    // Timer controls
    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');
    const resetBtn = document.getElementById('reset-timer');

    if (startBtn) {
        startBtn.addEventListener('click', startPomodoro);
    }

    if (pauseBtn) {
        pauseBtn.addEventListener('click', pausePomodoro);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetPomodoro);
    }

    // Settings inputs
    const workTimeInput = document.getElementById('work-time');
    const shortBreakInput = document.getElementById('short-break');
    const longBreakInput = document.getElementById('long-break');

    if (workTimeInput) {
        workTimeInput.addEventListener('change', function() {
            pomodoroTimer.settings.workTime = parseInt(this.value);
            savePomodoroSettings();
            if (pomodoroTimer.currentMode === 'work' && !pomodoroTimer.isRunning) {
                pomodoroTimer.timeLeft = pomodoroTimer.settings.workTime * 60;
                updatePomodoroDisplay();
            }
        });
    }

    if (shortBreakInput) {
        shortBreakInput.addEventListener('change', function() {
            pomodoroTimer.settings.shortBreak = parseInt(this.value);
            savePomodoroSettings();
            if (pomodoroTimer.currentMode === 'shortBreak' && !pomodoroTimer.isRunning) {
                pomodoroTimer.timeLeft = pomodoroTimer.settings.shortBreak * 60;
                updatePomodoroDisplay();
            }
        });
    }

    if (longBreakInput) {
        longBreakInput.addEventListener('change', function() {
            pomodoroTimer.settings.longBreak = parseInt(this.value);
            savePomodoroSettings();
            if (pomodoroTimer.currentMode === 'longBreak' && !pomodoroTimer.isRunning) {
                pomodoroTimer.timeLeft = pomodoroTimer.settings.longBreak * 60;
                updatePomodoroDisplay();
            }
        });
    }
}

// Page Navigation Functions
function showPomodoroPage() {
    currentPage = 'pomodoro';

    // Hide calendar content
    const calendarContent = document.getElementById('calendar-content');
    const calendarSidebar = document.getElementById('calendar-sidebar');

    // Show pomodoro content
    const pomodoroContent = document.getElementById('pomodoro-content');
    const pomodoroSidebar = document.getElementById('pomodoro-sidebar');

    if (calendarContent) calendarContent.style.display = 'none';
    if (calendarSidebar) calendarSidebar.style.display = 'none';
    if (pomodoroContent) pomodoroContent.style.display = 'block';
    if (pomodoroSidebar) pomodoroSidebar.style.display = 'block';

    updatePomodoroDisplay();
}

function showCalendarPage() {
    currentPage = 'calendar';

    // Hide pomodoro content
    const pomodoroContent = document.getElementById('pomodoro-content');
    const pomodoroSidebar = document.getElementById('pomodoro-sidebar');

    // Show calendar content
    const calendarContent = document.getElementById('calendar-content');
    const calendarSidebar = document.getElementById('calendar-sidebar');

    if (pomodoroContent) pomodoroContent.style.display = 'none';
    if (pomodoroSidebar) pomodoroSidebar.style.display = 'none';
    if (calendarContent) calendarContent.style.display = 'block';
    if (calendarSidebar) calendarSidebar.style.display = 'block';
}

// Pomodoro Functions
function startPomodoro() {
    if (!pomodoroTimer.isRunning) {
        pomodoroTimer.isRunning = true;

        // Update button visibility
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');

        if (startBtn) startBtn.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'flex';

        // Start the timer
        pomodoroTimer.intervals = setInterval(() => {
            pomodoroTimer.timeLeft--;
            updatePomodoroDisplay();

            if (pomodoroTimer.timeLeft <= 0) {
                completePomodoro();
            }
        }, 1000);

        showNotification('Pomodoro started!', 'success');
    }
}

function pausePomodoro() {
    if (pomodoroTimer.isRunning) {
        pomodoroTimer.isRunning = false;
        clearInterval(pomodoroTimer.intervals);

        // Update button visibility
        const startBtn = document.getElementById('start-timer');
        const pauseBtn = document.getElementById('pause-timer');

        if (startBtn) startBtn.style.display = 'flex';
        if (pauseBtn) pauseBtn.style.display = 'none';

        showNotification('Pomodoro paused', 'break');
    }
}

function resetPomodoro() {
    pomodoroTimer.isRunning = false;
    clearInterval(pomodoroTimer.intervals);

    // Reset to work mode
    pomodoroTimer.currentMode = 'work';
    pomodoroTimer.timeLeft = pomodoroTimer.settings.workTime * 60;
    pomodoroTimer.currentSession = 1;

    // Update button visibility
    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');

    if (startBtn) startBtn.style.display = 'flex';
    if (pauseBtn) pauseBtn.style.display = 'none';

    updatePomodoroDisplay();
    showNotification('Pomodoro reset', 'break');
}

function completePomodoro() {
    pomodoroTimer.isRunning = false;
    clearInterval(pomodoroTimer.intervals);

    // Add completed session if it was work
    if (pomodoroTimer.currentMode === 'work') {
        pomodoroTimer.completedSessions++;
        pomodoroTimer.totalFocusTime += pomodoroTimer.settings.workTime;
        updateStats();
    }

    // Determine next mode
    if (pomodoroTimer.currentMode === 'work') {
        if (pomodoroTimer.currentSession % 4 === 0) {
            // Long break after 4 sessions
            pomodoroTimer.currentMode = 'longBreak';
            pomodoroTimer.timeLeft = pomodoroTimer.settings.longBreak * 60;
            showNotification('Time for a long break!', 'break');
        } else {
            // Short break
            pomodoroTimer.currentMode = 'shortBreak';
            pomodoroTimer.timeLeft = pomodoroTimer.settings.shortBreak * 60;
            showNotification('Time for a short break!', 'break');
        }
    } else {
        // Back to work
        pomodoroTimer.currentMode = 'work';
        pomodoroTimer.timeLeft = pomodoroTimer.settings.workTime * 60;
        pomodoroTimer.currentSession++;

        if (pomodoroTimer.currentSession > pomodoroTimer.totalSessions) {
            pomodoroTimer.currentSession = 1;
        }

        showNotification('Break over! Time to focus!', 'success');
    }

    // Update button visibility
    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');

    if (startBtn) startBtn.style.display = 'flex';
    if (pauseBtn) pauseBtn.style.display = 'none';

    updatePomodoroDisplay();

    // Play notification sound (if supported)
    playNotificationSound();
}

function updatePomodoroDisplay() {
    const timeDisplay = document.getElementById('time-display');
    const timerMode = document.getElementById('timer-mode');
    const currentSessionElement = document.getElementById('current-session');
    const currentModeElement = document.getElementById('current-mode');
    const progressRing = document.querySelector('.progress-ring-progress');
    const pomodoroTimer_element = document.querySelector('.pomodoro-timer');

    // Update time display
    if (timeDisplay) {
        const minutes = Math.floor(pomodoroTimer.timeLeft / 60);
        const seconds = pomodoroTimer.timeLeft % 60;
        timeDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // Update mode display
    if (timerMode) {
        switch (pomodoroTimer.currentMode) {
            case 'work':
                timerMode.textContent = 'Work Time';
                break;
            case 'shortBreak':
                timerMode.textContent = 'Short Break';
                break;
            case 'longBreak':
                timerMode.textContent = 'Long Break';
                break;
        }
    }

    // Update session info
    if (currentSessionElement) {
        currentSessionElement.textContent = pomodoroTimer.currentSession;
    }

    if (currentModeElement) {
        currentModeElement.textContent = timerMode ? timerMode.textContent : 'Work Time';
    }

    // Update progress ring
    if (progressRing) {
        const totalTime = getTotalTimeForCurrentMode();
        const progress = 1 - (pomodoroTimer.timeLeft / totalTime);
        const circumference = 2 * Math.PI * 140; // radius is 140
        const offset = circumference - (progress * circumference);
        progressRing.style.strokeDashoffset = offset;
    }

    // Update timer class for styling
    if (pomodoroTimer_element) {
        pomodoroTimer_element.className = 'pomodoro-timer';
        pomodoroTimer_element.classList.add(`${pomodoroTimer.currentMode}-mode`);
    }
}

function getTotalTimeForCurrentMode() {
    switch (pomodoroTimer.currentMode) {
        case 'work':
            return pomodoroTimer.settings.workTime * 60;
        case 'shortBreak':
            return pomodoroTimer.settings.shortBreak * 60;
        case 'longBreak':
            return pomodoroTimer.settings.longBreak * 60;
        default:
            return pomodoroTimer.settings.workTime * 60;
    }
}

function updateStats() {
    const completedSessionsElement = document.getElementById('completed-sessions');
    const totalTimeElement = document.getElementById('total-time');

    if (completedSessionsElement) {
        completedSessionsElement.textContent = pomodoroTimer.completedSessions;
    }

    if (totalTimeElement) {
        const hours = Math.floor(pomodoroTimer.totalFocusTime / 60);
        const minutes = pomodoroTimer.totalFocusTime % 60;
        totalTimeElement.textContent = `${hours}h ${minutes}m`;
    }
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `pomodoro-notification ${type}`;
    notification.textContent = message;

    // Add to document
    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function playNotificationSound() {
    // Try to play a simple beep sound
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio notification not supported');
    }
}

function loadPomodoroSettings() {
    const saved = localStorage.getItem('pomodoro-settings');
    if (saved) {
        const settings = JSON.parse(saved);
        pomodoroTimer.settings = { ...pomodoroTimer.settings, ...settings };

        // Update input values
        const workTimeInput = document.getElementById('work-time');
        const shortBreakInput = document.getElementById('short-break');
        const longBreakInput = document.getElementById('long-break');

        if (workTimeInput) workTimeInput.value = pomodoroTimer.settings.workTime;
        if (shortBreakInput) shortBreakInput.value = pomodoroTimer.settings.shortBreak;
        if (longBreakInput) longBreakInput.value = pomodoroTimer.settings.longBreak;

        // Update current time left if not running
        if (!pomodoroTimer.isRunning) {
            pomodoroTimer.timeLeft = pomodoroTimer.settings.workTime * 60;
        }
    }

    // Load stats
    const savedStats = localStorage.getItem('pomodoro-stats');
    if (savedStats) {
        const stats = JSON.parse(savedStats);
        pomodoroTimer.completedSessions = stats.completedSessions || 0;
        pomodoroTimer.totalFocusTime = stats.totalFocusTime || 0;
        updateStats();
    }
}

function savePomodoroSettings() {
    localStorage.setItem('pomodoro-settings', JSON.stringify(pomodoroTimer.settings));
    localStorage.setItem('pomodoro-stats', JSON.stringify({
        completedSessions: pomodoroTimer.completedSessions,
        totalFocusTime: pomodoroTimer.totalFocusTime
    }));
}

// Navigation functions
function navigatePrevious() {
    switch(currentView) {
        case 'week':
            currentDate.setDate(currentDate.getDate() - 7);
            break;
        case 'month':
            currentDate.setMonth(currentDate.getMonth() - 1);
            break;
    }
    updateCalendarView();
}

function navigateNext() {
    switch(currentView) {
        case 'week':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
        case 'month':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
    }
    updateCalendarView();
}

function goToToday() {
    currentDate = new Date();
    updateCalendarView();
}

function changeView(view) {
    if (view === currentView) return;

    console.log(`🔄 Changing view to: ${view}`);

    // Update active button
    document.querySelectorAll('.view-option').forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`.view-option[data-view="${view}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    // Hide all views
    document.querySelectorAll('.calendar-view').forEach(v => {
        v.classList.remove('active');
    });

    // Show selected view
    const targetView = document.getElementById(`${view}-view`);
    if (targetView) {
        targetView.classList.add('active');
    }

    currentView = view;
    updateCalendarView();
}

function updateCalendarView() {
    updateCalendarTitle();

    switch(currentView) {
        case 'month':
            renderMonthView();
            break;
        case 'week':
            renderWeekView();
            break;
    }

    renderMiniCalendar();
}

function updateCalendarTitle() {
    let title;

    switch(currentView) {
        case 'month':
            title = monthFormatter.format(currentDate);
            break;
        case 'week': {
            const weekStart = getWeekStartDate(currentDate);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            if (weekStart.getMonth() === weekEnd.getMonth()) {
                title = `${weekStart.toLocaleDateString('en-US', { month: 'long' })} ${weekStart.getDate()} - ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
            } else {
                title = `${weekStart.toLocaleDateString('en-US', { month: 'short' })} ${weekStart.getDate()} - ${weekEnd.toLocaleDateString('en-US', { month: 'short' })} ${weekEnd.getDate()}, ${weekStart.getFullYear()}`;
            }
            break;
        }
    }

    const titleElement = document.getElementById('calendar-title');
    const miniTitleElement = document.getElementById('mini-calendar-title');

    if (titleElement) titleElement.textContent = title;
    if (miniTitleElement) miniTitleElement.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
}

// Rendering functions
function renderMonthView() {
    console.log('📅 Rendering month view...');
    const monthGrid = document.getElementById('month-grid');
    if (!monthGrid) return;

    monthGrid.innerHTML = '';

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstCalendarDay = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    firstCalendarDay.setDate(firstCalendarDay.getDate() - dayOfWeek);

    // Create a 6-week grid (42 days)
    for (let i = 0; i < 42; i++) {
        const currentDay = new Date(firstCalendarDay);
        currentDay.setDate(firstCalendarDay.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        // Check if day is in current month
        if (currentDay.getMonth() !== currentDate.getMonth()) {
            dayElement.classList.add('other-month');
        }

        // Check if day is today
        const today = new Date();
        if (currentDay.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }

        // Add day number
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = currentDay.getDate();
        dayElement.appendChild(dayNumber);

        // Add events container
        const dayEvents = document.createElement('div');
        dayEvents.className = 'day-events';

        // Get events for this day
        const dayFormatted = formatDate(currentDay);
        const dayEventsList = getEventsForDay(dayFormatted);

        // Display up to 3 events, add "more" link if needed
        const maxEventsToShow = 3;
        const hasMoreEvents = dayEventsList.length > maxEventsToShow;
        const eventsToShow = hasMoreEvents ? dayEventsList.slice(0, maxEventsToShow) : dayEventsList;

        eventsToShow.forEach(event => {
            const eventElement = createEventElement(event);
            dayEvents.appendChild(eventElement);
        });

        if (hasMoreEvents) {
            const moreEventsElement = document.createElement('div');
            moreEventsElement.className = 'more-events';
            moreEventsElement.textContent = `+ ${dayEventsList.length - maxEventsToShow} more`;
            dayEvents.appendChild(moreEventsElement);
        }

        dayElement.appendChild(dayEvents);

        // Add click handler to add event on this day
        dayElement.addEventListener('click', function(e) {
            if (e.target === dayElement || e.target === dayNumber) {
                const selectedDate = new Date(currentDay);
                showAddEventModal(selectedDate);
            }
        });

        monthGrid.appendChild(dayElement);
    }
}

function renderWeekView() {
    console.log('📅 Rendering week view...');
    const weekHeader = document.getElementById('week-header');
    const weekGrid = document.getElementById('week-grid');

    if (!weekHeader || !weekGrid) return;

    weekHeader.innerHTML = '';
    weekGrid.innerHTML = '';

    const weekStart = getWeekStartDate(currentDate);

    // Create the day headers and columns
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';

        // Check if day is today
        const today = new Date();
        if (dayDate.toDateString() === today.toDateString()) {
            dayHeader.classList.add('today');
        }

        dayHeader.textContent = dayDate.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
        weekHeader.appendChild(dayHeader);

        // Create column for the day
        const dayColumn = document.createElement('div');
        dayColumn.className = 'week-column';
        if (dayHeader.classList.contains('today')) {
            dayColumn.classList.add('today');
        }

        // Create hour slots (24 hours)
        for (let hour = 0; hour < 24; hour++) {
            const hourSlot = document.createElement('div');
            hourSlot.className = 'hour-slot';
            hourSlot.dataset.hour = hour;

            // Add hour slot click handler
            hourSlot.addEventListener('click', function(e) {
                e.stopPropagation();
                const selectedDate = new Date(dayDate);
                selectedDate.setHours(hour);
                showAddEventModal(selectedDate);
            });

            dayColumn.appendChild(hourSlot);
        }

        // Add current time indicator if it's today
        if (dayHeader.classList.contains('today')) {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            const topPosition = (hours * 60 + minutes) * (60 / 60); // 60px per hour

            const timeIndicator = document.createElement('div');
            timeIndicator.className = 'current-time-indicator';
            timeIndicator.style.top = `${topPosition}px`;
            dayColumn.appendChild(timeIndicator);
        }

        // Get events for this day and add them
        const dayFormatted = formatDate(dayDate);
        const dayEvents = getEventsForDay(dayFormatted);

        dayEvents.forEach(event => {
            const eventElement = createWeekDayEvent(event, false);
            if (eventElement) {
                dayColumn.appendChild(eventElement);
            }
        });

        weekGrid.appendChild(dayColumn);
    }
}

function renderMiniCalendar() {
    const miniCalendarDays = document.getElementById('mini-calendar-days');
    if (!miniCalendarDays) return;

    miniCalendarDays.innerHTML = '';

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstCalendarDay = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    firstCalendarDay.setDate(firstCalendarDay.getDate() - dayOfWeek);

    // Create a 6-week grid (42 days)
    for (let i = 0; i < 42; i++) {
        const currentDay = new Date(firstCalendarDay);
        currentDay.setDate(firstCalendarDay.getDate() + i);

        const dayElement = document.createElement('div');
        dayElement.className = 'mini-calendar-day';
        dayElement.textContent = currentDay.getDate();

        // Check if day is in current month
        if (currentDay.getMonth() !== currentDate.getMonth()) {
            dayElement.classList.add('other-month');
        }

        // Check if day is the selected day
        if (currentDay.toDateString() === currentDate.toDateString()) {
            dayElement.classList.add('current');
        }

        // Check if day is today
        const today = new Date();
        if (currentDay.toDateString() === today.toDateString() && !dayElement.classList.contains('current')) {
            dayElement.style.fontWeight = 'bold';
        }

        // Check if day has events
        const dayFormatted = formatDate(currentDay);
        const dayEvents = getEventsForDay(dayFormatted);
        if (dayEvents.length > 0) {
            dayElement.classList.add('has-events');
        }

        // Add click handler
        dayElement.addEventListener('click', function() {
            currentDate = new Date(currentDay);
            updateCalendarView();
        });

        miniCalendarDays.appendChild(dayElement);
    }
}

// Event creation and management
function createEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event';

    // Set background color based on list
    const listColor = getListColor(event.list);
    eventElement.style.backgroundColor = listColor;
    eventElement.style.color = 'white';

    // Create title with time if available
    let titleText = event.title;
    if (event.time) {
        titleText = `${formatTime(event.time)} ${titleText}`;
    }

    eventElement.textContent = titleText;

    // Add click handler to show details
    eventElement.addEventListener('click', function(e) {
        e.stopPropagation();
        showEventDetails(event);
    });

    return eventElement;
}

function createWeekDayEvent(event, isDayView = false) {
    if (!event.time) {
        // All-day event - show at top
        const eventElement = document.createElement('div');
        eventElement.className = isDayView ? 'day-event all-day' : 'week-event all-day';
        eventElement.textContent = event.title;
        eventElement.style.top = '0px';
        eventElement.style.height = '20px';
        eventElement.style.backgroundColor = getListColor(event.list);
        eventElement.style.color = 'white';
        eventElement.style.fontSize = isDayView ? '14px' : '12px';
        eventElement.style.padding = '2px 6px';
        eventElement.style.borderRadius = '3px';
        eventElement.style.cursor = 'pointer';
        eventElement.style.position = 'absolute';
        eventElement.style.left = isDayView ? '10px' : '2px';
        eventElement.style.right = isDayView ? '10px' : '2px';
        eventElement.style.zIndex = '5';

        eventElement.addEventListener('click', function(e) {
            e.stopPropagation();
            showEventDetails(event);
        });

        return eventElement;
    }

    // Timed event
    const [hours, minutes] = event.time.split(':').map(Number);
    const endHours = event.endTime ? parseInt(event.endTime.split(':')[0]) : hours + 1;
    const endMinutes = event.endTime ? parseInt(event.endTime.split(':')[1]) : minutes;

    // Calculate position and height
    const topPosition = (hours * 60 + minutes) * (60 / 60); // 60px per hour
    const duration = Math.max(((endHours * 60 + endMinutes) - (hours * 60 + minutes)) * (60 / 60), 30);

    const eventElement = document.createElement('div');
    eventElement.className = isDayView ? 'day-event' : 'week-event';
    eventElement.textContent = event.title;
    eventElement.style.top = `${topPosition}px`;
    eventElement.style.height = `${duration}px`;
    eventElement.style.backgroundColor = getListColor(event.list);
    eventElement.style.color = 'white';
    eventElement.style.fontSize = isDayView ? '14px' : '12px';
    eventElement.style.padding = isDayView ? '4px 8px' : '2px 6px';
    eventElement.style.borderRadius = '4px';
    eventElement.style.cursor = 'pointer';
    eventElement.style.position = 'absolute';
    eventElement.style.left = isDayView ? '10px' : '2px';
    eventElement.style.right = isDayView ? '10px' : '2px';
    eventElement.style.zIndex = '5';
    eventElement.style.overflow = 'hidden';
    eventElement.style.textOverflow = 'ellipsis';
    eventElement.style.whiteSpace = 'nowrap';

    // Set priority border if applicable
    if (event.priority) {
        switch(event.priority) {
            case 'high':
                eventElement.style.borderLeft = '3px solid #ff5555';
                break;
            case 'medium':
                eventElement.style.borderLeft = '3px solid #ffa500';
                break;
            case 'low':
                eventElement.style.borderLeft = '3px solid #3498db';
                break;
        }
    }

    eventElement.addEventListener('click', function(e) {
        e.stopPropagation();
        showEventDetails(event);
    });

    return eventElement;
}

// Modal functions
function showAddEventModal(date = null) {
    const modal = document.getElementById('event-modal');
    if (!modal) return;

    // Clear form
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const endDateInput = document.getElementById('event-end-date');
    const endTimeInput = document.getElementById('event-end-time');
    const descriptionInput = document.getElementById('event-description');
    const listSelect = document.getElementById('event-list');
    const prioritySelect = document.getElementById('event-priority');
    const addAsTask = document.getElementById('add-as-task');

    if (titleInput) titleInput.value = '';
    if (timeInput) timeInput.value = '';
    if (endDateInput) endDateInput.value = '';
    if (endTimeInput) endTimeInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    if (prioritySelect) prioritySelect.value = 'none';
    if (addAsTask) addAsTask.checked = false;

    // Set date
    if (!date) date = new Date(currentDate);
    const formattedDate = formatDateForInput(date);
    if (dateInput) dateInput.value = formattedDate;

    // If specific time was clicked, set it
    if (date.getHours() !== 0 || date.getMinutes() !== 0) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        if (timeInput) timeInput.value = `${hours}:${minutes}`;

        // Set end time to 1 hour later
        const endDate = new Date(date);
        endDate.setHours(date.getHours() + 1);
        if (endDateInput) endDateInput.value = formattedDate;

        const endHours = endDate.getHours().toString().padStart(2, '0');
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
        if (endTimeInput) endTimeInput.value = `${endHours}:${endMinutes}`;
    }

    // Populate list dropdown
    if (listSelect) {
        listSelect.innerHTML = '<option value="none">None</option>';
        lists.forEach(list => {
            const option = document.createElement('option');
            option.value = list;
            option.textContent = list;
            listSelect.appendChild(option);
        });
    }

    modal.style.display = 'flex';
    if (titleInput) titleInput.focus();
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function saveEvent() {
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const endDateInput = document.getElementById('event-end-date');
    const endTimeInput = document.getElementById('event-end-time');
    const descriptionInput = document.getElementById('event-description');
    const listSelect = document.getElementById('event-list');
    const prioritySelect = document.getElementById('event-priority');
    const addAsTask = document.getElementById('add-as-task');

    // Validate
    if (!titleInput || !titleInput.value.trim()) {
        alert('Please enter a title for the event');
        return;
    }

    if (!dateInput || !dateInput.value) {
        alert('Please select a date for the event');
        return;
    }

    // Create event
    const newEvent = {
        id: Date.now(),
        title: titleInput.value.trim(),
        date: dateInput.value,
        time: timeInput ? timeInput.value || null : null,
        endDate: endDateInput ? endDateInput.value || dateInput.value : dateInput.value,
        endTime: endTimeInput ? endTimeInput.value || null : null,
        description: descriptionInput ? descriptionInput.value.trim() : '',
        list: listSelect && listSelect.value !== 'none' ? listSelect.value : null,
        priority: prioritySelect && prioritySelect.value !== 'none' ? prioritySelect.value : null,
        createdAt: new Date().toISOString()
    };

    events.push(newEvent);

    // Handle "Add as Task"
    if (addAsTask && addAsTask.checked) {
        const newTask = {
            id: Date.now() + 1,
            title: titleInput.value.trim(),
            description: descriptionInput ? descriptionInput.value.trim() : '',
            date: dateInput.value,
            reminder: dateInput.value,
            priority: prioritySelect && prioritySelect.value !== 'none' ? prioritySelect.value : 'medium',
            list: listSelect && listSelect.value !== 'none' ? listSelect.value : 'N/A',
            completed: false,
            createdAt: new Date().toISOString(),
            subtasks: [],
            isFromCalendar: true
        };

        const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        existingTasks.push(newTask);
        localStorage.setItem('tasks', JSON.stringify(existingTasks));

        alert('Event created and added to your todo list!');
    }

    saveEvents();
    closeAllModals();
    updateCalendarView();
}

function showEventDetails(event) {
    selectedEvent = event;

    const modal = document.getElementById('event-details-modal');
    if (!modal) return;

    const titleElement = document.getElementById('detail-event-title');
    const dateElement = document.getElementById('detail-event-date');
    const timeElement = document.getElementById('detail-event-time');
    const listElement = document.getElementById('detail-event-list');
    const priorityElement = document.getElementById('detail-event-priority');
    const descriptionElement = document.getElementById('detail-event-description');

    // Set event details
    if (titleElement) titleElement.textContent = event.title;

    // Format date
    if (dateElement) {
        const eventDate = new Date(event.date);
        dateElement.textContent = dayFormatter.format(eventDate);
    }

    // Set time
    if (timeElement) {
        if (event.time) {
            if (event.endTime) {
                timeElement.textContent = `${formatTime(event.time)} - ${formatTime(event.endTime)}`;
            } else {
                timeElement.textContent = formatTime(event.time);
            }
        } else {
            timeElement.textContent = 'All Day';
        }
    }

    // Set list
    if (listElement) listElement.textContent = event.list || 'None';

    // Set priority
    if (priorityElement) {
        priorityElement.textContent = event.priority ?
            event.priority.charAt(0).toUpperCase() + event.priority.slice(1) :
            'None';
    }

    // Set description
    if (descriptionElement) descriptionElement.textContent = event.description || 'No description';

    modal.style.display = 'flex';
}

function deleteSelectedEvent() {
    if (!selectedEvent) return;

    if (confirm('Are you sure you want to delete this event?')) {
        events = events.filter(e => e.id !== selectedEvent.id);
        saveEvents();
        closeAllModals();
        updateCalendarView();
    }
}

function editSelectedEvent() {
    if (!selectedEvent) return;

    closeAllModals();
    showAddEventModal();

    // Populate form with existing event data
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const endDateInput = document.getElementById('event-end-date');
    const endTimeInput = document.getElementById('event-end-time');
    const descriptionInput = document.getElementById('event-description');
    const listSelect = document.getElementById('event-list');
    const prioritySelect = document.getElementById('event-priority');

    if (titleInput) titleInput.value = selectedEvent.title;
    if (dateInput) dateInput.value = selectedEvent.date;
    if (timeInput) timeInput.value = selectedEvent.time || '';
    if (endDateInput) endDateInput.value = selectedEvent.endDate || selectedEvent.date;
    if (endTimeInput) endTimeInput.value = selectedEvent.endTime || '';
    if (descriptionInput) descriptionInput.value = selectedEvent.description || '';
    if (listSelect) listSelect.value = selectedEvent.list || 'none';
    if (prioritySelect) prioritySelect.value = selectedEvent.priority || 'none';

    // Change save button functionality temporarily
    const saveButton = document.getElementById('save-event');
    if (saveButton) {
        const originalHandler = saveButton.onclick;

        saveButton.onclick = function() {
            // Update the existing event
            const eventIndex = events.findIndex(e => e.id === selectedEvent.id);
            if (eventIndex !== -1) {
                events[eventIndex] = {
                    ...selectedEvent,
                    title: titleInput ? titleInput.value.trim() : selectedEvent.title,
                    date: dateInput ? dateInput.value : selectedEvent.date,
                    time: timeInput ? timeInput.value || null : selectedEvent.time,
                    endDate: endDateInput ? endDateInput.value || dateInput.value : selectedEvent.endDate,
                    endTime: endTimeInput ? endTimeInput.value || null : selectedEvent.endTime,
                    description: descriptionInput ? descriptionInput.value.trim() : selectedEvent.description,
                    list: listSelect && listSelect.value !== 'none' ? listSelect.value : null,
                    priority: prioritySelect && prioritySelect.value !== 'none' ? prioritySelect.value : null
                };
            }

            saveEvents();
            closeAllModals();
            updateCalendarView();

            // Restore original handler
            saveButton.onclick = originalHandler;
        };
    }
}

// List management
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
        updateEventListDropdown();
    }
}

function renderLists() {
    const listsContainer = document.getElementById('lists-container');
    if (!listsContainer) return;

    listsContainer.innerHTML = '';

    lists.forEach((listName, index) => {
        const listItem = document.createElement("div");
        listItem.classList.add("list-item");

        // List color and name
        const listColor = document.createElement("span");
        listColor.className = "list-color";
        listColor.style.backgroundColor = getListColor(listName);

        const listNameEl = document.createElement("span");
        listNameEl.className = "list-name";
        listNameEl.dataset.index = index;
        listNameEl.appendChild(listColor);
        listNameEl.appendChild(document.createTextNode(listName));

        // List actions
        const listActions = document.createElement("div");
        listActions.className = "list-actions";

        const editBtn = document.createElement("button");
        editBtn.className = "list-edit-btn";
        editBtn.textContent = "Edit";

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "list-delete-btn";
        deleteBtn.textContent = "Delete";

        listActions.append(editBtn, deleteBtn);
        listItem.append(listNameEl, listActions);
        listsContainer.appendChild(listItem);
    });
}

function updateEventListDropdown() {
    const listSelect = document.getElementById('event-list');
    if (!listSelect) return;

    const currentSelection = listSelect.value;
    listSelect.innerHTML = '<option value="none">None</option>';

    lists.forEach(listName => {
        const option = document.createElement("option");
        option.value = listName;
        option.textContent = listName;
        listSelect.appendChild(option);
    });

    if (lists.includes(currentSelection)) {
        listSelect.value = currentSelection;
    }
}

// Utility functions
function getEventsForDay(dateString) {
    return events.filter(event => event.date === dateString);
}

function getWeekStartDate(date) {
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay()); // Go to Sunday
    return result;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateForInput(date) {
    return formatDate(date);
}

function formatTime(timeString) {
    if (!timeString) return '';

    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;

    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function getListColor(listName) {
    const defaultColors = {
        'Personal': '#3498db',
        'Work': '#e74c3c',
        'Shopping': '#2ecc71'
    };

    if (defaultColors[listName]) {
        return defaultColors[listName];
    } else {
        const hue = Math.abs(hashString(listName || '') % 360);
        return `hsl(${hue}, 70%, 60%)`;
    }
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

// Data storage functions
function loadEvents() {
    const savedEvents = localStorage.getItem('calendar-events');
    events = savedEvents ? JSON.parse(savedEvents) : [];
}

function saveEvents() {
    localStorage.setItem('calendar-events', JSON.stringify(events));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    tasks = savedTasks ? JSON.parse(savedTasks) : [];
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadLists() {
    const savedLists = localStorage.getItem('custom-lists');
    lists = savedLists ? JSON.parse(savedLists) : ['Personal', 'Work', 'Shopping'];
    renderLists();
}

function saveLists() {
    localStorage.setItem('custom-lists', JSON.stringify(lists));
}

console.log('✅ Calendar with Pomodoro loaded successfully');