// COMPLETE WORKING CALENDAR WITH POMODORO + DATABASE INTEGRATION
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

// Add this to your Cal.js file, in the DOMContentLoaded event listener
// Check for hash on page load
if (window.location.hash === '#pomodoro') {
    showPomodoroPage();
}

// Listen for hash changes
window.addEventListener('hashchange', function() {
    if (window.location.hash === '#pomodoro') {
        showPomodoroPage();
    } else if (window.location.hash === '' || window.location.hash === '#calendar') {
        showCalendarPage();
    }
});




// Date formatters
let dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
let monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
let timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

// Enhanced initialization with proper event persistence
document.addEventListener("DOMContentLoaded", function() {
    console.log('✅ CALENDAR: DOM Content Loaded - Starting initialization...');

    // Wait for all required systems to be ready
    waitForSystemsReady().then(() => {
        initializeCalendarApp();
    }).catch(error => {
        console.error('❌ CALENDAR: System initialization failed:', error);
        // Initialize anyway with fallback
        initializeCalendarApp();
    });
});


// Wait for required systems (user data manager, auth guard, etc.)
function waitForSystemsReady(maxWait = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();

        function checkSystems() {
            const elapsed = Date.now() - startTime;

            if (elapsed > maxWait) {
                console.warn('⚠️ CALENDAR: Timeout waiting for systems, proceeding anyway');
                resolve();
                return;
            }

            // Check if user data manager is ready
            if (window.userDataManager && window.userDataManager.currentUser) {
                console.log('✅ CALENDAR: User data manager ready');
                resolve();
                return;
            }

            // Check again in 100ms
            setTimeout(checkSystems, 100);
        }

        checkSystems();
    });
}

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

    const testEvents = [
        {
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

    // Save test events to database or localStorage
    testEvents.forEach(async (event) => {
        try {
            if (window.taskDB && window.taskDB.isReady) {
                const savedId = await window.taskDB.addEvent(event);
                event.id = savedId;
                events.push(event);
                console.log('✅ Test event saved to database');
            } else {
                event.id = Date.now() + Math.random();
                events.push(event);
                saveEventsToLocalStorage();
                console.log('📱 Test event saved to localStorage');
            }
        } catch (error) {
            console.error('Failed to save test event:', error);
            event.id = Date.now() + Math.random();
            events.push(event);
            saveEventsToLocalStorage();
        }
    });

    updateCalendarView();
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

// DATABASE-INTEGRATED FUNCTIONS

// Replace your existing loadEvents() function with this:
// Enhanced loadEvents function with better error handling
async function loadEvents() {
    console.log('📂 CALENDAR: Loading events...');

    try {
        let loadedFromDB = false;

        // Try database first
        if (window.taskDB && window.taskDB.isReady) {
            try {
                const dbEvents = await window.taskDB.getEvents();
                if (dbEvents && Array.isArray(dbEvents)) {
                    events = dbEvents;
                    loadedFromDB = true;
                    console.log(`✅ CALENDAR: Loaded ${events.length} events from database`);
                }
            } catch (dbError) {
                console.error('❌ CALENDAR: Database load failed:', dbError);
            }
        }

        // Fallback to localStorage
        if (!loadedFromDB) {
            try {
                const savedEvents = localStorage.getItem('calendar-events');
                if (savedEvents) {
                    const parsedEvents = JSON.parse(savedEvents);
                    if (Array.isArray(parsedEvents)) {
                        events = parsedEvents;
                        console.log(`📱 CALENDAR: Loaded ${events.length} events from localStorage`);
                    } else {
                        console.warn('⚠️ CALENDAR: Invalid events format in localStorage');
                        events = [];
                    }
                } else {
                    console.log('📝 CALENDAR: No saved events found, starting fresh');
                    events = [];
                }
            } catch (parseError) {
                console.error('❌ CALENDAR: Failed to parse localStorage events:', parseError);
                events = [];
            }
        }

        // Migrate from localStorage to database if database is available but empty
        if (window.taskDB && window.taskDB.isReady && !loadedFromDB && events.length > 0) {
            console.log('🔄 CALENDAR: Migrating events from localStorage to database...');
            try {
                for (const event of events) {
                    await window.taskDB.addEvent(event);
                }
                console.log(`✅ CALENDAR: Migrated ${events.length} events to database`);
            } catch (migrationError) {
                console.error('❌ CALENDAR: Migration failed:', migrationError);
            }
        }

    } catch (error) {
        console.error('❌ CALENDAR: Critical error loading events:', error);
        events = [];
    }

    // Ensure events is always an array
    if (!Array.isArray(events)) {
        console.warn('⚠️ CALENDAR: Events is not an array, resetting');
        events = [];
    }

    console.log(`📊 CALENDAR: Final event count: ${events.length}`);
}


function renderWeekView() {
    console.log('📅 CALENDAR: Rendering week view with improved overlap handling...');
    const weekHeader = document.getElementById('week-header');
    const weekGrid = document.getElementById('week-grid');

    if (!weekHeader || !weekGrid) {
        console.error('❌ CALENDAR: Week view containers not found');
        return;
    }

    weekHeader.innerHTML = '';
    weekGrid.innerHTML = '';

    const weekStart = getWeekStartDate(currentDate);
    console.log(`📅 CALENDAR: Week starts on ${weekStart.toDateString()}`);

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

        dayHeader.textContent = dayDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric'
        });
        weekHeader.appendChild(dayHeader);

        // Create column for the day
        const dayColumn = document.createElement('div');
        dayColumn.className = 'week-column';
        dayColumn.style.position = 'relative';

        if (dayHeader.classList.contains('today')) {
            dayColumn.classList.add('today');
        }

        // Create hour slots (24 hours)
        for (let hour = 0; hour < 24; hour++) {
            const hourSlot = document.createElement('div');
            hourSlot.className = 'hour-slot';
            hourSlot.dataset.hour = hour;
            hourSlot.dataset.date = formatDate(dayDate);

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
            const topPosition = (hours * 60 + minutes) * (60 / 60);

            const timeIndicator = document.createElement('div');
            timeIndicator.className = 'current-time-indicator';
            timeIndicator.style.cssText = `
                position: absolute;
                left: 0;
                right: 0;
                top: ${topPosition}px;
                height: 2px;
                background: #ef4444;
                z-index: 15;
                box-shadow: 0 1px 3px rgba(239, 68, 68, 0.5);
            `;
            dayColumn.appendChild(timeIndicator);
        }

        // **IMPROVED: Process events with better overlap handling**
        const dayFormatted = formatDate(dayDate);
        const dayEvents = getEventsForDay(dayFormatted);

        console.log(`📅 CALENDAR: Day ${dayFormatted} has ${dayEvents.length} events`);

        if (dayEvents.length > 0) {
            createVisibleOverlappingEvents(dayColumn, dayEvents);
        }

        weekGrid.appendChild(dayColumn);
    }

    console.log(`✅ CALENDAR: Week view rendered with improved overlap visibility`);
}

// **NEW: Create overlapping events that are all visible**
function createVisibleOverlappingEvents(dayColumn, dayEvents) {
    // Separate all-day and timed events
    const allDayEvents = dayEvents.filter(event => !event.time);
    const timedEvents = dayEvents.filter(event => event.time);

    // **IMPROVED: Handle all-day events first**
    allDayEvents.forEach((event, index) => {
        const eventElement = createAllDayEventElement(event, index, allDayEvents.length);
        dayColumn.appendChild(eventElement);
    });

    // **IMPROVED: Group timed events by time slots**
    const timeSlots = groupEventsByTimeSlot(timedEvents);

    Object.keys(timeSlots).forEach(timeSlot => {
        const eventsAtTime = timeSlots[timeSlot];

        if (eventsAtTime.length === 1) {
            // Single event - normal display
            const eventElement = createSingleTimedEvent(eventsAtTime[0]);
            dayColumn.appendChild(eventElement);
        } else {
            // Multiple events - create stacked/overlapping display
            createStackedEvents(dayColumn, eventsAtTime, timeSlot);
        }
    });
}

// **NEW: Group events by time slot**
function groupEventsByTimeSlot(events) {
    const timeSlots = {};

    events.forEach(event => {
        const timeKey = event.time;
        if (!timeSlots[timeKey]) {
            timeSlots[timeKey] = [];
        }
        timeSlots[timeKey].push(event);
    });

    return timeSlots;
}

// **NEW: Create all-day event with proper spacing**
function createAllDayEventElement(event, index, totalAllDay) {
    const eventElement = document.createElement('div');
    eventElement.className = 'week-event all-day-visible';

    // Position all-day events at the top with spacing
    const topOffset = index * 25; // 25px spacing between all-day events

    eventElement.style.cssText = `
        position: absolute;
        top: ${topOffset}px;
        left: 4px;
        right: 4px;
        height: 20px;
        background: ${getListColor(event.list)};
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 2px 6px;
        border-radius: 3px;
        cursor: pointer;
        z-index: ${10 + index};
        border: 1px solid rgba(255,255,255,0.3);
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    `;

    eventElement.textContent = event.title;

    // Add completion styling
    if (event.hasAssociatedTask && event.taskCompleted) {
        eventElement.style.textDecoration = 'line-through';
        eventElement.style.opacity = '0.7';
    }

    // Add hover effect
    eventElement.addEventListener('mouseenter', () => {
        eventElement.style.transform = 'scale(1.02)';
        eventElement.style.zIndex = '999';
    });

    eventElement.addEventListener('mouseleave', () => {
        eventElement.style.transform = 'scale(1)';
        eventElement.style.zIndex = `${10 + index}`;
    });

    eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        showEventDetails(event);
    });

    return eventElement;
}

// **NEW: Create single timed event (no overlap)**
function createSingleTimedEvent(event) {
    const [hours, minutes] = event.time.split(':').map(Number);
    const endHours = event.endTime ? parseInt(event.endTime.split(':')[0]) : hours + 1;
    const endMinutes = event.endTime ? parseInt(event.endTime.split(':')[1]) : minutes;

    const topPosition = (hours * 60 + minutes) * (60 / 60);
    const duration = Math.max(((endHours * 60 + endMinutes) - (hours * 60 + minutes)) * (60 / 60), 30);

    const eventElement = document.createElement('div');
    eventElement.className = 'week-event single-event';

    eventElement.style.cssText = `
        position: absolute;
        top: ${topPosition}px;
        left: 4px;
        right: 4px;
        height: ${duration}px;
        background: ${getListColor(event.list)};
        color: white;
        font-size: 12px;
        font-weight: 500;
        padding: 4px 6px;
        border-radius: 4px;
        cursor: pointer;
        z-index: 5;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        line-height: 1.2;
    `;

    eventElement.textContent = event.title;

    // Add priority border
    if (event.priority) {
        const priorityColors = { high: '#ff5555', medium: '#ffa500', low: '#3498db' };
        eventElement.style.borderLeft = `3px solid ${priorityColors[event.priority]}`;
    }

    // Add completion styling
    if (event.hasAssociatedTask && event.taskCompleted) {
        eventElement.style.textDecoration = 'line-through';
        eventElement.style.opacity = '0.7';
    }

    eventElement.addEventListener('click', (e) => {
        e.stopPropagation();
        showEventDetails(event);
    });

    return eventElement;
}

// **IMPROVED: Create stacked events for same time slot**
function createStackedEvents(dayColumn, events, timeSlot) {
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const baseTopPosition = (hours * 60 + minutes) * (60 / 60);

    // **OPTION 1: Stacked Display (all events visible vertically)**
    if (events.length <= 3) {
        createVerticallyStackedEvents(dayColumn, events, baseTopPosition);
    }
    // **OPTION 2: Compact display with expandable view**
    else {
        createCompactExpandableEvents(dayColumn, events, baseTopPosition, timeSlot);
    }
}

// **NEW: Create vertically stacked events (for 2-3 events)**
function createVerticallyStackedEvents(dayColumn, events, baseTopPosition) {
    const eventHeight = 30; // Shorter height for stacked events
    const stackSpacing = 32; // 32px spacing between stacked events

    events.forEach((event, index) => {
        const eventElement = document.createElement('div');
        eventElement.className = 'week-event stacked-event';

        const topPosition = baseTopPosition + (index * stackSpacing);

        eventElement.style.cssText = `
            position: absolute;
            top: ${topPosition}px;
            left: 4px;
            right: 4px;
            height: ${eventHeight}px;
            background: ${getListColor(event.list)};
            color: white;
            font-size: 11px;
            font-weight: 500;
            padding: 2px 6px;
            border-radius: 4px;
            cursor: pointer;
            z-index: ${10 + index};
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.2;
            border: 2px solid rgba(255,255,255,0.4);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        `;

        // Add stack indicator
        const stackIndicator = document.createElement('span');
        stackIndicator.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: #ff4444;
            color: white;
            border-radius: 50%;
            width: 16px;
            height: 16px;
            font-size: 9px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
        `;
        stackIndicator.textContent = index + 1;
        eventElement.appendChild(stackIndicator);

        // Add time label for context
        const timeLabel = document.createElement('div');
        timeLabel.style.cssText = `
            position: absolute;
            bottom: -15px;
            left: 0;
            font-size: 9px;
            color: #666;
            background: white;
            padding: 1px 3px;
            border-radius: 2px;
            font-weight: bold;
        `;
        timeLabel.textContent = formatTime(event.time);
        eventElement.appendChild(timeLabel);

        eventElement.innerHTML = `<span style="line-height: 1.2;">${event.title}</span>`;
        eventElement.appendChild(stackIndicator);
        eventElement.appendChild(timeLabel);

        // Add hover effect
        eventElement.addEventListener('mouseenter', () => {
            eventElement.style.transform = 'scale(1.05)';
            eventElement.style.zIndex = '999';
            eventElement.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });

        eventElement.addEventListener('mouseleave', () => {
            eventElement.style.transform = 'scale(1)';
            eventElement.style.zIndex = `${10 + index}`;
            eventElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        });

        // Add completion styling
        if (event.hasAssociatedTask && event.taskCompleted) {
            eventElement.style.textDecoration = 'line-through';
            eventElement.style.opacity = '0.7';
        }

        eventElement.addEventListener('click', (e) => {
            e.stopPropagation();
            showEventDetails(event);
        });

        dayColumn.appendChild(eventElement);
    });
}

// **NEW: Create compact display with expansion (for 4+ events)**
function createCompactExpandableEvents(dayColumn, events, baseTopPosition, timeSlot) {
    // Create main container
    const containerElement = document.createElement('div');
    containerElement.className = 'week-event compact-events';

    containerElement.style.cssText = `
        position: absolute;
        top: ${baseTopPosition}px;
        left: 4px;
        right: 4px;
        height: 40px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-size: 11px;
        font-weight: 600;
        padding: 4px 6px;
        border-radius: 6px;
        cursor: pointer;
        z-index: 15;
        overflow: hidden;
        border: 2px solid rgba(255,255,255,0.5);
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: space-between;
    `;

    // Add main text
    const mainText = document.createElement('div');
    mainText.textContent = `${events.length} events at ${formatTime(timeSlot)}`;

    // Add expand icon
    const expandIcon = document.createElement('div');
    expandIcon.innerHTML = '📋';
    expandIcon.style.fontSize = '14px';

    containerElement.appendChild(mainText);
    containerElement.appendChild(expandIcon);

    // Add click handler to show all events
    containerElement.addEventListener('click', (e) => {
        e.stopPropagation();
        showCompactEventsModal(events, timeSlot);
    });

    // Add hover effect
    containerElement.addEventListener('mouseenter', () => {
        containerElement.style.transform = 'scale(1.05)';
        containerElement.style.zIndex = '999';
        expandIcon.style.transform = 'rotate(10deg)';
    });

    containerElement.addEventListener('mouseleave', () => {
        containerElement.style.transform = 'scale(1)';
        containerElement.style.zIndex = '15';
        expandIcon.style.transform = 'rotate(0deg)';
    });

    dayColumn.appendChild(containerElement);
}

// **NEW: Modal for compact events display**
function showCompactEventsModal(events, timeSlot) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 24px;
        max-width: 450px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        animation: slideIn 0.3s ease;
        box-shadow: 0 15px 35px rgba(0,0,0,0.4);
    `;

    // Title
    const title = document.createElement('h3');
    title.textContent = `Events at ${formatTime(timeSlot)}`;
    title.style.cssText = `
        margin: 0 0 20px 0;
        color: #1e3a8a;
        border-bottom: 3px solid #e5e7eb;
        padding-bottom: 12px;
        font-size: 18px;
    `;

    modalContent.appendChild(title);

    // Event list
    events.forEach((event, index) => {
        const eventDiv = document.createElement('div');
        eventDiv.style.cssText = `
            padding: 16px;
            margin: 12px 0;
            border-radius: 10px;
            border-left: 5px solid ${getListColor(event.list)};
            background: #f8f9fa;
            cursor: pointer;
            transition: all 0.2s ease;
            position: relative;
        `;

        eventDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 8px; color: #1e3a8a; font-size: 14px;">${event.title}</div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                ${event.description || 'No description'}
            </div>
            <div style="font-size: 11px; color: #9ca3af;">
                Priority: ${event.priority || 'None'} • 
                List: ${event.list || 'None'}
                ${event.hasAssociatedTask ? ' • 📋 Linked to task' : ''}
            </div>
        `;

        


        // Add number badge
        const badge = document.createElement('div');
        badge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: #1e3a8a;
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
        `;
        badge.textContent = index + 1;
        eventDiv.appendChild(badge);

        eventDiv.addEventListener('click', () => {
            modal.remove();
            showEventDetails(event);
        });

        eventDiv.addEventListener('mouseenter', () => {
            eventDiv.style.background = '#e9ecef';
            eventDiv.style.transform = 'translateX(4px)';
            eventDiv.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        });

        eventDiv.addEventListener('mouseleave', () => {
            eventDiv.style.background = '#f8f9fa';
            eventDiv.style.transform = 'translateX(0)';
            eventDiv.style.boxShadow = 'none';
        });

        modalContent.appendChild(eventDiv);
    });

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
        margin-top: 24px;
        padding: 12px 24px;
        background: #6b7280;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        width: 100%;
        font-size: 14px;
        font-weight: 600;
        transition: background 0.2s;
    `;

    closeButton.addEventListener('click', () => modal.remove());
    closeButton.addEventListener('mouseenter', () => {
        closeButton.style.background = '#4b5563';
    });
    closeButton.addEventListener('mouseleave', () => {
        closeButton.style.background = '#6b7280';
    });

    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}

console.log('✅ CALENDAR: Improved overlapping events - all events now visible!');



function renderWeekView() {
    console.log('📅 CALENDAR: Rendering week view with overlap detection...');
    const weekHeader = document.getElementById('week-header');
    const weekGrid = document.getElementById('week-grid');

    if (!weekHeader || !weekGrid) {
        console.error('❌ CALENDAR: Week view containers not found');
        return;
    }

    weekHeader.innerHTML = '';
    weekGrid.innerHTML = '';

    const weekStart = getWeekStartDate(currentDate);
    console.log(`📅 CALENDAR: Week starts on ${weekStart.toDateString()}`);

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

        dayHeader.textContent = dayDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'numeric',
            day: 'numeric'
        });
        weekHeader.appendChild(dayHeader);

        // Create column for the day
        const dayColumn = document.createElement('div');
        dayColumn.className = 'week-column';
        dayColumn.style.position = 'relative'; // Important for positioning

        if (dayHeader.classList.contains('today')) {
            dayColumn.classList.add('today');
        }

        // Create hour slots (24 hours)
        for (let hour = 0; hour < 24; hour++) {
            const hourSlot = document.createElement('div');
            hourSlot.className = 'hour-slot';
            hourSlot.dataset.hour = hour;
            hourSlot.dataset.date = formatDate(dayDate);

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
            timeIndicator.style.position = 'absolute';
            timeIndicator.style.left = '0';
            timeIndicator.style.right = '0';
            timeIndicator.style.height = '2px';
            timeIndicator.style.backgroundColor = '#ef4444';
            timeIndicator.style.zIndex = '10';
            dayColumn.appendChild(timeIndicator);
        }

        // **ENHANCED: Get events for this day and handle overlaps**
        const dayFormatted = formatDate(dayDate);
        const dayEvents = getEventsForDay(dayFormatted);

        console.log(`📅 CALENDAR: Day ${dayFormatted} has ${dayEvents.length} events`);

        // **NEW: Process overlapping events**
        const processedEvents = processOverlappingEvents(dayEvents);

        processedEvents.forEach((eventGroup, groupIndex) => {
            eventGroup.forEach((event, eventIndex) => {
                const eventElement = createWeekDayEventWithOverlap(event, eventGroup.length, eventIndex, groupIndex);
                if (eventElement) {
                    dayColumn.appendChild(eventElement);
                    console.log(`📅 CALENDAR: Added event "${event.title}" to ${dayFormatted} (group ${groupIndex}, position ${eventIndex})`);
                }
            });
        });

        weekGrid.appendChild(dayColumn);
    }

    console.log(`✅ CALENDAR: Week view rendered with ${events.length} total events and overlap detection`);
}

function processOverlappingEvents(dayEvents) {
    // Separate all-day and timed events
    const allDayEvents = dayEvents.filter(event => !event.time);
    const timedEvents = dayEvents.filter(event => event.time);

    // Group overlapping timed events
    const overlappingGroups = [];
    const processedEvents = new Set();

    timedEvents.forEach(event => {
        if (processedEvents.has(event.id)) return;

        const overlappingGroup = [event];
        processedEvents.add(event.id);

        // Find all events that overlap with this one
        timedEvents.forEach(otherEvent => {
            if (processedEvents.has(otherEvent.id)) return;

            if (eventsOverlap(event, otherEvent)) {
                overlappingGroup.push(otherEvent);
                processedEvents.add(otherEvent.id);
            }
        });

        overlappingGroups.push(overlappingGroup);
    });

    // Add all-day events as individual groups
    allDayEvents.forEach(event => {
        overlappingGroups.push([event]);
    });

    return overlappingGroups;
}


// **NEW: Function to check if two events overlap**
function eventsOverlap(event1, event2) {
    if (!event1.time || !event2.time) return false;

    const start1 = getEventStartMinutes(event1);
    const end1 = getEventEndMinutes(event1);
    const start2 = getEventStartMinutes(event2);
    const end2 = getEventEndMinutes(event2);

    // Events overlap if one starts before the other ends
    return start1 < end2 && start2 < end1;
}

function getEventStartMinutes(event) {
    if (!event.time) return 0;
    const [hours, minutes] = event.time.split(':').map(Number);
    return hours * 60 + minutes;
}

function getEventEndMinutes(event) {
    if (!event.time) return 1440; // End of day for all-day events

    if (event.endTime) {
        const [hours, minutes] = event.endTime.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Default to 1 hour duration
    const startMinutes = getEventStartMinutes(event);
    return startMinutes + 60;
}
function createWeekDayEventWithOverlap(event, totalInGroup, indexInGroup, groupIndex, isDayView = false) {
    if (!event.time) {
        // All-day event - show at top with overlap offset
        const eventElement = document.createElement('div');
        eventElement.className = isDayView ? 'day-event all-day' : 'week-event all-day';

        // Add task completion styling
        if (event.hasAssociatedTask || event.associatedTaskId) {
            if (event.taskCompleted) {
                eventElement.style.textDecoration = 'line-through';
                eventElement.style.opacity = '0.7';
            }
            eventElement.title = `Linked to task${event.taskCompleted ? ' (completed)' : ''}`;
        }

        eventElement.textContent = event.title;

        // **ENHANCED: Position all-day events with overlap offset**
        const topOffset = groupIndex * 25; // 25px offset per group
        eventElement.style.top = `${topOffset}px`;
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
        eventElement.style.zIndex = `${5 + groupIndex}`;

        // **NEW: Add overlap indicator for all-day events**
        if (totalInGroup > 1) {
            eventElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
            eventElement.style.border = '1px solid rgba(255,255,255,0.3)';

            // Add count indicator
            const countIndicator = document.createElement('span');
            countIndicator.style.cssText = `
                position: absolute;
                top: -8px;
                right: -8px;
                background: #ff4444;
                color: white;
                border-radius: 50%;
                width: 16px;
                height: 16px;
                font-size: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            `;
            countIndicator.textContent = totalInGroup;
            eventElement.appendChild(countIndicator);
        }

        eventElement.addEventListener('click', function(e) {
            e.stopPropagation();
            if (totalInGroup > 1) {
                showOverlappingEventsModal(event, totalInGroup);
            } else {
                showEventDetails(event);
            }
        });

        return eventElement;
    }

    // **ENHANCED: Timed event with overlap support**
    const [hours, minutes] = event.time.split(':').map(Number);
    const endHours = event.endTime ? parseInt(event.endTime.split(':')[0]) : hours + 1;
    const endMinutes = event.endTime ? parseInt(event.endTime.split(':')[1]) : minutes;

    // Calculate position and height
    const topPosition = (hours * 60 + minutes) * (60 / 60); // 60px per hour
    const duration = Math.max(((endHours * 60 + endMinutes) - (hours * 60 + minutes)) * (60 / 60), 30);

    const eventElement = document.createElement('div');
    eventElement.className = isDayView ? 'day-event' : 'week-event';
    eventElement.textContent = event.title;

    // **ENHANCED: Calculate overlap positioning**
    const columnWidth = 100 / totalInGroup; // Percentage width for each column
    const leftOffset = indexInGroup * columnWidth; // Percentage left offset

    eventElement.style.top = `${topPosition}px`;
    eventElement.style.height = `${duration}px`;
    eventElement.style.backgroundColor = getListColor(event.list);
    eventElement.style.color = 'white';
    eventElement.style.fontSize = isDayView ? '14px' : '11px'; // Smaller font for overlaps
    eventElement.style.padding = isDayView ? '4px 8px' : '2px 4px';
    eventElement.style.borderRadius = '4px';
    eventElement.style.cursor = 'pointer';
    eventElement.style.position = 'absolute';
    eventElement.style.overflow = 'hidden';
    eventElement.style.textOverflow = 'ellipsis';
    eventElement.style.whiteSpace = 'nowrap';

    // **NEW: Overlap positioning**
    if (totalInGroup > 1) {
        eventElement.style.left = `${leftOffset}%`;
        eventElement.style.width = `${columnWidth - 1}%`; // -1% for spacing
        eventElement.style.zIndex = `${10 + indexInGroup}`;

        // **NEW: Visual indicators for overlapping events**
        eventElement.style.border = '2px solid rgba(255,255,255,0.5)';
        eventElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

        // Add overlap count indicator
        const overlapIndicator = document.createElement('div');
        overlapIndicator.style.cssText = `
            position: absolute;
            top: 2px;
            right: 2px;
            background: rgba(255,255,255,0.9);
            color: #333;
            border-radius: 50%;
            width: 14px;
            height: 14px;
            font-size: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        `;
        overlapIndicator.textContent = `${indexInGroup + 1}/${totalInGroup}`;
        eventElement.appendChild(overlapIndicator);

        // **NEW: Different border colors for different positions**
        const borderColors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'];
        eventElement.style.borderLeftColor = borderColors[indexInGroup % borderColors.length];
        eventElement.style.borderLeftWidth = '4px';

    } else {
        eventElement.style.left = isDayView ? '10px' : '2px';
        eventElement.style.right = isDayView ? '10px' : '2px';
        eventElement.style.zIndex = '5';
    }

    // Add task completion styling
    if (event.hasAssociatedTask || event.associatedTaskId) {
        if (event.taskCompleted) {
            eventElement.style.textDecoration = 'line-through';
            eventElement.style.opacity = '0.7';
        }
        eventElement.title = `Linked to task${event.taskCompleted ? ' (completed)' : ''}`;

        // Add small task icon (adjust position for overlaps)
        const taskIcon = document.createElement('div');
        taskIcon.innerHTML = event.taskCompleted ? '✓' : '📋';
        taskIcon.style.cssText = `
            position: absolute;
            bottom: 2px;
            left: 2px;
            font-size: 8px;
            opacity: 0.8;
        `;
        eventElement.appendChild(taskIcon);
    }

    // Set priority border if applicable and not overlapping
    if (event.priority && totalInGroup === 1) {
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
        if (totalInGroup > 1) {
            showOverlappingEventsModal(event, totalInGroup);
        } else {
            showEventDetails(event);
        }
    });

    return eventElement;
}


// **NEW: Modal for overlapping events**
function showOverlappingEventsModal(clickedEvent, totalCount) {
    // Find all overlapping events at the same time
    const eventTime = clickedEvent.time;
    const eventDate = clickedEvent.date;

    const overlappingEvents = events.filter(event =>
        event.date === eventDate &&
        event.time === eventTime
    );

    // Create modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    `;

    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 20px;
        max-width: 400px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;

    const title = document.createElement('h3');
    title.textContent = `Overlapping Events (${totalCount})`;
    title.style.cssText = `
        margin: 0 0 15px 0;
        color: #1e3a8a;
        border-bottom: 2px solid #e5e7eb;
        padding-bottom: 10px;
    `;

    const timeInfo = document.createElement('p');
    timeInfo.textContent = `${formatTime(eventTime)} on ${formatDate(eventDate)}`;
    timeInfo.style.cssText = `
        margin: 0 0 20px 0;
        color: #6b7280;
        font-style: italic;
    `;

    modalContent.appendChild(title);
    modalContent.appendChild(timeInfo);

    // List all overlapping events
    overlappingEvents.forEach((event, index) => {
        const eventDiv = document.createElement('div');
        eventDiv.style.cssText = `
            padding: 12px;
            margin: 8px 0;
            border-radius: 8px;
            border-left: 4px solid ${getListColor(event.list)};
            background: #f8f9fa;
            cursor: pointer;
            transition: background 0.2s;
        `;

        if (event.id === clickedEvent.id) {
            eventDiv.style.background = '#e3f2fd';
            eventDiv.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        }

        eventDiv.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 4px;">${event.title}</div>
            <div style="font-size: 12px; color: #6b7280;">
                ${event.description || 'No description'} • 
                Priority: ${event.priority || 'None'} • 
                List: ${event.list || 'None'}
            </div>
        `;

        eventDiv.addEventListener('click', () => {
            modal.remove();
            showEventDetails(event);
        });

        eventDiv.addEventListener('mouseenter', () => {
            eventDiv.style.background = '#e9ecef';
        });

        eventDiv.addEventListener('mouseleave', () => {
            eventDiv.style.background = event.id === clickedEvent.id ? '#e3f2fd' : '#f8f9fa';
        });

        modalContent.appendChild(eventDiv);
    });

    // Close button
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText = `
        margin-top: 20px;
        padding: 10px 20px;
        background: #6b7280;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        width: 100%;
    `;

    closeButton.addEventListener('click', () => modal.remove());

    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}

console.log('✅ CALENDAR: Enhanced week view with overlapping events support loaded');

async function deleteSelectedEvent() {
    if (!selectedEvent) return;

    if (confirm('Are you sure you want to delete this event?')) {
        console.log(`🗑️ CALENDAR: Starting deletion of event ${selectedEvent.id}...`);

        try {
            // Use database if available
            if (window.taskDB && window.taskDB.isReady) {
                console.log('🔄 CALENDAR: Using database deletion...');
                await window.taskDB.deleteEvent(selectedEvent.id);
                console.log('✅ CALENDAR: Event and associated tasks deleted from database');
                showCalendarNotification('Event and related tasks deleted!', 'success');
            } else {
                console.log('📱 CALENDAR: Database not available, using enhanced localStorage deletion...');

                // ENHANCED LOCALSTORAGE DELETION
                let localTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
                let localEvents = JSON.parse(localStorage.getItem('calendar-events') || '[]');

                // Find the event to delete
                const eventToDelete = localEvents.find(e => e.id == selectedEvent.id);
                if (!eventToDelete) {
                    console.log('❌ CALENDAR: Event not found');
                    showCalendarNotification('Event not found', 'error');
                    return;
                }

                console.log(`CALENDAR: Found event to delete: "${eventToDelete.title}"`);

                // Find associated tasks to delete
                const tasksToDelete = localTasks.filter(task => {
                    return (
                        task.sourceEventId == selectedEvent.id ||
                        task.associatedEventId == selectedEvent.id ||
                        (task.createdFromEvent && task.sourceEventId == selectedEvent.id) ||
                        (eventToDelete.associatedTaskId && task.id == eventToDelete.associatedTaskId)
                    );
                });

                console.log(`CALENDAR: Found ${tasksToDelete.length} associated tasks to delete`);
                tasksToDelete.forEach(task => {
                    console.log(`CALENDAR: Will delete task: "${task.title}" (ID: ${task.id})`);
                });

                // Remove the event
                localEvents = localEvents.filter(e => e.id != selectedEvent.id);

                // Remove associated tasks
                localTasks = localTasks.filter(task => {
                    return !(
                        task.sourceEventId == selectedEvent.id ||
                        task.associatedEventId == selectedEvent.id ||
                        (task.createdFromEvent && task.sourceEventId == selectedEvent.id) ||
                        (eventToDelete.associatedTaskId && task.id == eventToDelete.associatedTaskId)
                    );
                });

                // Save back to localStorage
                localStorage.setItem('tasks', JSON.stringify(localTasks));
                localStorage.setItem('calendar-events', JSON.stringify(localEvents));

                // Update global events array
                events = localEvents;

                console.log(`✅ CALENDAR: Deleted 1 event and ${tasksToDelete.length} associated tasks`);

                if (tasksToDelete.length > 0) {
                    showCalendarNotification(`Event and ${tasksToDelete.length} related tasks deleted!`, 'success');
                } else {
                    showCalendarNotification('Event deleted (no associated tasks found)', 'success');
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
            }

            // Remove from global events array (if not already done)
            const originalLength = events.length;
            events = events.filter(e => e.id != selectedEvent.id);
            console.log(`📊 CALENDAR: Event array updated. Events: ${originalLength} → ${events.length}`);

            // Close modals and update view
            closeAllModals();
            updateCalendarView();

            // Fallback save to localStorage (if not already done)
            if (window.taskDB && window.taskDB.isReady) {
                saveEventsToLocalStorage();
            }

            console.log('✅ CALENDAR: Event deletion completed successfully');

        } catch (error) {
            console.error('❌ CALENDAR: Failed to delete event from database:', error);

            // Fallback removal
            const originalLength = events.length;
            events = events.filter(e => e.id != selectedEvent.id);

            saveEventsToLocalStorage();
            closeAllModals();
            updateCalendarView();

            showCalendarNotification('Event deleted locally (with errors)', 'warning');
            console.log(`📱 CALENDAR: Fallback deletion completed. Events: ${originalLength} → ${events.length}`);
        }
    }
}
async function saveEvent() {
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const endDateInput = document.getElementById('event-end-date');
    const endTimeInput = document.getElementById('event-end-time');
    const descriptionInput = document.getElementById('event-description');
    const listSelect = document.getElementById('event-list');
    const prioritySelect = document.getElementById('event-priority');
    const addAsTask = document.getElementById('add-as-task');

    // Validate required fields
    if (!titleInput || !titleInput.value.trim()) {
        alert('Please enter a title for the event');
        titleInput?.focus();
        return;
    }

    if (!dateInput || !dateInput.value) {
        alert('Please select a date for the event');
        dateInput?.focus();
        return;
    }

    console.log('💾 CALENDAR: Saving event...');
    console.log('Current events before save:', events.length);

    // Check if we're editing an existing event
    const isEditing = selectedEvent && selectedEvent.id;

    // Create event object with all required fields
    const eventData = {
        title: titleInput.value.trim(),
        date: dateInput.value,
        time: timeInput?.value || null,
        endDate: endDateInput?.value || dateInput.value,
        endTime: endTimeInput?.value || null,
        description: descriptionInput?.value.trim() || '',
        list: listSelect?.value !== 'none' ? listSelect?.value : null,
        priority: prioritySelect?.value !== 'none' ? prioritySelect?.value : null,
        lastUpdated: new Date().toISOString()
    };

    // If editing, preserve existing properties
    if (isEditing) {
        eventData.id = selectedEvent.id;
        eventData.createdAt = selectedEvent.createdAt || new Date().toISOString();
        eventData.hasAssociatedTask = selectedEvent.hasAssociatedTask || false;
        eventData.associatedTaskId = selectedEvent.associatedTaskId || null;
        eventData.taskCompleted = selectedEvent.taskCompleted || false;
    } else {
        eventData.createdAt = new Date().toISOString();
        eventData.hasAssociatedTask = false;
        eventData.associatedTaskId = null;
        eventData.taskCompleted = false;
    }

    try {
        let eventId;
        let saveSuccess = false;

        if (isEditing) {
            // Update existing event
            eventId = selectedEvent.id;
            console.log(`📝 CALENDAR: Updating existing event ${eventId}`);

            // Try database first
            if (window.taskDB && window.taskDB.isReady) {
                try {
                    await window.taskDB.updateEvent(eventData);
                    console.log('✅ CALENDAR: Event updated in database');
                    saveSuccess = true;
                } catch (dbError) {
                    console.error('❌ CALENDAR: Database update failed:', dbError);
                }
            }

            // Update in local events array
            const eventIndex = events.findIndex(e => e.id == eventId);
            if (eventIndex !== -1) {
                events[eventIndex] = { ...eventData };
                console.log(`✅ CALENDAR: Event updated in local array at index ${eventIndex}`);
                saveSuccess = true;
            } else {
                console.error('❌ CALENDAR: Event not found in local array for update');
            }

            // Update associated task if it exists
            if (selectedEvent.hasAssociatedTask || selectedEvent.associatedTaskId) {
                await updateAssociatedTask(eventData);
            }

        } else {
            // Create new event
            console.log('📝 CALENDAR: Creating new event');

            // Generate unique ID
            eventId = Date.now() + Math.random();
            eventData.id = eventId;

            // Try database first
            if (window.taskDB && window.taskDB.isReady) {
                try {
                    const dbEventId = await window.taskDB.addEvent(eventData);
                    eventData.id = dbEventId;
                    eventId = dbEventId;
                    console.log(`✅ CALENDAR: Event saved to database with ID: ${eventId}`);
                    saveSuccess = true;
                } catch (dbError) {
                    console.error('❌ CALENDAR: Database save failed:', dbError);
                    // Keep the generated ID for localStorage fallback
                }
            }

            // Add to local array
            events.push({ ...eventData });
            console.log(`✅ CALENDAR: Event added to local array. Total events: ${events.length}`);
            saveSuccess = true;
        }

        // CRITICAL: Always save to localStorage as backup
        try {
            localStorage.setItem('calendar-events', JSON.stringify(events));
            console.log(`💾 CALENDAR: Events saved to localStorage (${events.length} events)`);

            // Trigger storage event for cross-page sync
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'calendar-events',
                newValue: JSON.stringify(events),
                oldValue: null
            }));
            console.log('📡 CALENDAR: Storage event dispatched');

        } catch (storageError) {
            console.error('❌ CALENDAR: localStorage save failed:', storageError);
        }

        // Handle "Add as Task" for new events only
        if (!isEditing && addAsTask?.checked) {
            console.log('📝 CALENDAR: Creating associated task for event...');
            await createAssociatedTask(eventData);
        }

        // Show success message
        if (saveSuccess) {
            showCalendarNotification(
                isEditing ? 'Event updated successfully!' : 'Event created successfully!',
                'success'
            );
        } else {
            showCalendarNotification('Event saved with some issues', 'warning');
        }

        // Close modal and refresh view
        closeAllModals();
        selectedEvent = null;

        // Force refresh of the calendar view
        setTimeout(() => {
            updateCalendarView();
            console.log(`🔄 CALENDAR: View refreshed. Total events: ${events.length}`);
        }, 100);

    } catch (error) {
        console.error('❌ CALENDAR: Failed to save event:', error);
        showCalendarNotification('Failed to save event', 'error');

        // Try to save locally as fallback
        try {
            if (!isEditing) {
                eventData.id = Date.now() + Math.random();
                events.push(eventData);
            }
            localStorage.setItem('calendar-events', JSON.stringify(events));
            updateCalendarView();
            showCalendarNotification('Event saved locally only', 'warning');
        } catch (fallbackError) {
            console.error('❌ CALENDAR: Even fallback save failed:', fallbackError);
        }
    }
}

async function createAssociatedTask(event) {
    try {
        let taskId;

        if (window.taskDB && window.taskDB.isReady) {
            // Create task using database
            const newTask = {
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
                hasAssociatedEvent: true,
                associatedEventId: event.id
            };

            taskId = await window.taskDB.addTask(newTask);

            // Update the event to link back to the task
            event.hasAssociatedTask = true;
            event.associatedTaskId = taskId;
            await window.taskDB.updateEvent(event);

            console.log(`🔗 CALENDAR: Created task ${taskId} and linked with event ${event.id}`);
            showCalendarNotification('Event and task created successfully!', 'success');
        } else {
            // Fallback task creation with proper linking
            taskId = Date.now() + 1;
            const newTask = {
                id: taskId,
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
                hasAssociatedEvent: true,
                associatedEventId: event.id,
                createdAt: new Date().toISOString()
            };

            const existingTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            existingTasks.push(newTask);
            localStorage.setItem('tasks', JSON.stringify(existingTasks));

            // Update the event to link back to the task
            event.hasAssociatedTask = true;
            event.associatedTaskId = taskId;

            // Update the event in the events array
            const eventIndex = events.findIndex(e => e.id === event.id);
            if (eventIndex !== -1) {
                events[eventIndex] = event;
            }

            console.log(`🔗 CALENDAR: Created task ${taskId} and linked with event ${event.id}`);

            // Trigger storage event for todo page
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'tasks',
                newValue: JSON.stringify(existingTasks)
            }));

            showCalendarNotification('Event and task created locally!', 'success');
        }
    } catch (taskError) {
        console.error('❌ CALENDAR: Failed to create associated task:', taskError);
        showCalendarNotification('Event created, but failed to create associated task', 'warning');
    }
}


// Function to sync task changes to calendar events
function syncTaskChangesToEvents() {
    try {
        const updatedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        let eventsUpdated = false;

        events.forEach((event, index) => {
            if (event.hasAssociatedTask || event.associatedTaskId) {
                const linkedTask = updatedTasks.find(t =>
                    t.id == event.associatedTaskId ||
                    t.sourceEventId == event.id ||
                    t.associatedEventId == event.id
                );

                if (linkedTask) {
                    // Check if task was updated and sync changes
                    if (linkedTask.title !== event.title ||
                        linkedTask.description !== event.description ||
                        linkedTask.date !== event.date ||
                        linkedTask.priority !== event.priority ||
                        (linkedTask.list !== 'N/A' && linkedTask.list !== event.list)) {

                        console.log(`🔄 CALENDAR: Syncing task changes to event ${event.id}`);

                        events[index] = {
                            ...event,
                            title: linkedTask.title,
                            description: linkedTask.description || event.description,
                            date: linkedTask.date || event.date,
                            priority: linkedTask.priority || event.priority,
                            list: linkedTask.list !== 'N/A' ? linkedTask.list : event.list,
                            taskCompleted: linkedTask.completed,
                            lastTaskUpdate: new Date().toISOString()
                        };

                        eventsUpdated = true;
                    }
                } else {
                    // Task was deleted, mark event as no longer linked
                    console.log(`⚠️ CALENDAR: Task ${event.associatedTaskId} deleted, unlinking event ${event.id}`);
                    events[index] = {
                        ...event,
                        hasAssociatedTask: false,
                        associatedTaskId: null,
                        taskCompleted: null
                    };
                    eventsUpdated = true;
                }
            }
        });

        if (eventsUpdated) {
            saveEventsToLocalStorage();
            updateCalendarView();
            console.log('✅ CALENDAR: Events synced with task changes');
        }
    } catch (error) {
        console.error('❌ CALENDAR: Failed to sync task changes to events:', error);
    }
}

// ALSO ADD THIS FUNCTION TO PREVENT DUPLICATE NOTIFICATIONS:

// Enhanced notification function that prevents duplicates
let lastNotificationTime = 0;
let lastNotificationMessage = '';

function showCalendarNotification(message, type = 'success') {
    const now = Date.now();

    // Prevent duplicate notifications within 1 second
    if (now - lastNotificationTime < 1000 && message === lastNotificationMessage) {
        console.log('🚫 Preventing duplicate notification:', message);
        return;
    }

    lastNotificationTime = now;
    lastNotificationMessage = message;

    console.log(`${type.toUpperCase()}: ${message}`);

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;

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

console.log('✅ CALENDAR: Enhanced delete and sync functions loaded');

// Add this notification function for calendar:
function showCalendarNotification(message, type = 'success') {
    console.log(`${type.toUpperCase()}: ${message}`);

    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#ef4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;

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

// ALL THE ORIGINAL CALENDAR FUNCTIONS (these were missing in the database version)

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
    console.log(`🔄 CALENDAR: Updating calendar view (${currentView})`);
    console.log(`📊 CALENDAR: Current events count: ${events.length}`);

    updateCalendarTitle();

    switch(currentView) {
        case 'month':
            renderMonthView();
            break;
        case 'week':
            renderWeekView();
            break;
        default:
            console.warn(`⚠️ CALENDAR: Unknown view: ${currentView}`);
            renderMonthView();
            break;
    }

    renderMiniCalendar();
    console.log(`✅ CALENDAR: Calendar view updated`);
}

// Enhanced page load handling
document.addEventListener("DOMContentLoaded", function() {
    console.log('✅ CALENDAR: DOM Content Loaded');

    // Initialize app with proper loading sequence
    initializeCalendarApp();
});


async function initializeCalendarApp() {
    console.log('🚀 CALENDAR: Initializing calendar app...');

    try {
        // Load data in sequence
        await loadLists();
        await loadEvents(); // This now properly handles all loading scenarios

        // Initialize calendar
        updateCalendarTitle();
        renderMiniCalendar();
        updateCalendarView();

        // Set up event listeners
        setupEventListeners();
        setupPomodoroEventListeners();
        loadPomodoroSettings();

        console.log(`📊 CALENDAR: Initialized with ${events.length} events and ${lists.length} lists`);

        // Create test events only if no events exist
        if (events.length === 0) {
            console.log('📝 CALENDAR: No events found, creating test events...');
            createTestEvents();
        }

    } catch (error) {
        console.error('❌ CALENDAR: Initialization failed:', error);
        // Initialize with empty data as fallback
        events = [];
        lists = ['Personal', 'Work', 'Shopping'];
        updateCalendarView();
    }
}

// Enhanced storage event listener for better sync
window.addEventListener('storage', function(e) {
    if (e.key === 'calendar-events') {
        console.log('🔄 CALENDAR: Storage event received for calendar-events');

        try {
            const newEventsData = e.newValue ? JSON.parse(e.newValue) : [];
            if (Array.isArray(newEventsData)) {
                const oldEventsCount = events.length;
                events = newEventsData;

                // Update the view immediately
                updateCalendarView();

                console.log(`✅ CALENDAR: Events synced via storage event. Count: ${oldEventsCount} → ${events.length}`);
            } else {
                console.warn('⚠️ CALENDAR: Invalid events data received via storage event');
            }
        } catch (parseError) {
            console.error('❌ CALENDAR: Failed to parse storage event data:', parseError);
        }
    }

    // Also listen for task changes to update any task-related displays
    if (e.key === 'tasks') {
        console.log('🔄 CALENDAR: Tasks updated in another page');
        syncTaskChangesToEvents();
    }
});

// Enhanced debugging function
window.debugCalendar = function() {
    console.log('=== CALENDAR DEBUG ===');
    console.log('Current View:', currentView);
    console.log('Current Date:', currentDate);
    console.log('Events Array:', events);
    console.log('Events Count:', events.length);
    console.log('LocalStorage Events:', localStorage.getItem('calendar-events'));

    if (window.taskDB) {
        console.log('Database Available:', window.taskDB.isReady);
    }

    // Test event creation
    const testEvent = {
        id: 'debug-' + Date.now(),
        title: 'Debug Test Event',
        date: formatDate(new Date()),
        time: '14:00',
        description: 'Test event for debugging',
        createdAt: new Date().toISOString()
    };

    events.push(testEvent);
    localStorage.setItem('calendar-events', JSON.stringify(events));
    updateCalendarView();

    console.log('Added debug event and refreshed view');
    return testEvent;
};

// Force refresh function
window.forceRefreshCalendar = function() {
    console.log('🔄 CALENDAR: Force refreshing...');
    loadEvents().then(() => {
        updateCalendarView();
        console.log('✅ CALENDAR: Force refresh completed');
    });
};

console.log('✅ CALENDAR: Week view persistence fixes loaded');


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

    // Add task completion indicator
    if (event.hasAssociatedTask || event.associatedTaskId) {
        const taskIcon = document.createElement('i');
        taskIcon.className = event.taskCompleted ? 'fas fa-check-circle' : 'fas fa-tasks';
        taskIcon.style.cssText = `
            margin-right: 5px;
            opacity: 0.8;
            font-size: 12px;
        `;

        const titleContainer = document.createElement('div');
        titleContainer.style.display = 'flex';
        titleContainer.style.alignItems = 'center';
        titleContainer.appendChild(taskIcon);
        titleContainer.appendChild(document.createTextNode(titleText));

        eventElement.appendChild(titleContainer);

        // Add strikethrough effect if task is completed
        if (event.taskCompleted) {
            eventElement.style.textDecoration = 'line-through';
            eventElement.style.opacity = '0.7';
        }
    } else {
        eventElement.textContent = titleText;
    }

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

        // Add task completion styling
        if (event.hasAssociatedTask || event.associatedTaskId) {
            if (event.taskCompleted) {
                eventElement.style.textDecoration = 'line-through';
                eventElement.style.opacity = '0.7';
            }
            eventElement.title = `Linked to task${event.taskCompleted ? ' (completed)' : ''}`;
        }

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

    // Add task completion styling
    if (event.hasAssociatedTask || event.associatedTaskId) {
        if (event.taskCompleted) {
            eventElement.style.textDecoration = 'line-through';
            eventElement.style.opacity = '0.7';
        }
        eventElement.title = `Linked to task${event.taskCompleted ? ' (completed)' : ''}`;

        // Add small task icon
        const taskIcon = document.createElement('div');
        taskIcon.innerHTML = event.taskCompleted ? '✓' : '📋';
        taskIcon.style.cssText = `
            position: absolute;
            top: 2px;
            right: 2px;
            font-size: 8px;
            opacity: 0.8;
        `;
        eventElement.appendChild(taskIcon);
    }

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
    const addAsTask = document.getElementById('add-as-task');

    if (titleInput) titleInput.value = selectedEvent.title;
    if (dateInput) dateInput.value = selectedEvent.date;
    if (timeInput) timeInput.value = selectedEvent.time || '';
    if (endDateInput) endDateInput.value = selectedEvent.endDate || selectedEvent.date;
    if (endTimeInput) endTimeInput.value = selectedEvent.endTime || '';
    if (descriptionInput) descriptionInput.value = selectedEvent.description || '';
    if (listSelect) listSelect.value = selectedEvent.list || 'none';
    if (prioritySelect) prioritySelect.value = selectedEvent.priority || 'none';

    // Hide "Add as Task" checkbox if event already has a linked task
    if (addAsTask) {
        if (selectedEvent.hasAssociatedTask || selectedEvent.associatedTaskId) {
            addAsTask.parentElement.style.display = 'none';
        } else {
            addAsTask.parentElement.style.display = 'block';
            addAsTask.checked = false;
        }
    }

    // Update modal title to indicate editing
    const modalTitle = document.querySelector('#event-modal .modal-header h2');
    if (modalTitle) {
        modalTitle.textContent = 'Edit Event';
        if (selectedEvent.hasAssociatedTask || selectedEvent.associatedTaskId) {
            modalTitle.innerHTML += ' <i class="fas fa-link" style="color: #10b981; margin-left: 8px;" title="Linked to task"></i>';
        }
    }
}

console.log('✅ CALENDAR: Enhanced task-event syncing loaded');

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

console.log('✅ Calendar with Pomodoro and Database Integration loaded successfully');