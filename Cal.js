// Global state
let events = [];
let tasks = [];
let lists = [];
let googleEvents = [];
let outlookEvents = [];
let currentDate = new Date();
let currentView = 'month';
let selectedEvent = null;
let dayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
let monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' });
let timeFormatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

// Wait for DOM to be fully loaded before executing any code
document.addEventListener("DOMContentLoaded", function() {
    // Initialize the application
    initApp();

    // Set up event listeners
    setupEventListeners();
});

// --------------------------
// Application Initialization
// --------------------------
function initApp() {
    // Load saved data from localStorage
    loadLists();
    loadTasks();
    loadEvents();

    // Initialize calendar views
    updateCalendarTitle();
    renderMiniCalendar();

    // Render the current view (default is month)
    updateCalendarView();
}

// -----------------------
// Event Listeners Setup
// -----------------------
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('prev-period').addEventListener('click', navigatePrevious);
    document.getElementById('next-period').addEventListener('click', navigateNext);

    // View options
    document.querySelectorAll('.view-option').forEach(option => {
        option.addEventListener('click', function() {
            changeView(this.dataset.view);
        });
    });

    // Mini calendar navigation
    document.getElementById('prev-month-btn').addEventListener('click', function() {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        currentDate = newDate;
        renderMiniCalendar();
    });

    document.getElementById('next-month-btn').addEventListener('click', function() {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        currentDate = newDate;
        renderMiniCalendar();
    });

    // Add event button and modal
    const addEventLink = document.getElementById('add-event-link');
    const eventModal = document.getElementById('event-modal');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const cancelEventButton = document.getElementById('cancel-event');
    const saveEventButton = document.getElementById('save-event');

    addEventLink.addEventListener('click', function(e) {
        e.preventDefault();
        showAddEventModal();
    });

    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    cancelEventButton.addEventListener('click', closeAllModals);
    saveEventButton.addEventListener('click', saveEvent);

    // Details modal buttons
    document.getElementById('delete-event').addEventListener('click', deleteSelectedEvent);
    document.getElementById('edit-event').addEventListener('click', editSelectedEvent);

    // Setup sidebar navigation links
    document.getElementById('today-link').addEventListener('click', function(e) {
        e.preventDefault();
        goToToday();
    });

    document.getElementById('week-link').addEventListener('click', function(e) {
        e.preventDefault();
        changeView('week');
    });

    document.getElementById('month-link').addEventListener('click', function(e) {
        e.preventDefault();
        changeView('month');
    });

    document.getElementById('agenda-link').addEventListener('click', function(e) {
        e.preventDefault();
        // For now just go to day view
        changeView('day');
    });

    // List management
    const addListBtn = document.getElementById('add-list-btn');
    addListBtn.addEventListener('click', addNewList);
}

// -----------------------
// Calendar Navigation
// -----------------------
function navigatePrevious() {
    switch(currentView) {
        case 'day':
            currentDate.setDate(currentDate.getDate() - 1);
            break;
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
        case 'day':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
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

    // Update active button
    document.querySelectorAll('.view-option').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.view-option[data-view="${view}"]`).classList.add('active');

    // Hide all views
    document.querySelectorAll('.calendar-view').forEach(v => {
        v.classList.remove('active');
    });

    // Show selected view
    document.getElementById(`${view}-view`).classList.add('active');

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
        case 'day':
            renderDayView();
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
        case 'day':
            title = dayFormatter.format(currentDate);
            break;
    }

    document.getElementById('calendar-title').textContent = title;
    document.getElementById('mini-calendar-title').textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate);
}

// -----------------------
// Calendar View Rendering
// -----------------------
function renderMonthView() {
    const monthGrid = document.getElementById('month-grid');
    monthGrid.innerHTML = '';

    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Calculate the first day of the calendar grid (might be from the previous month)
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
        if (currentDay.getDate() === today.getDate() &&
            currentDay.getMonth() === today.getMonth() &&
            currentDay.getFullYear() === today.getFullYear()) {
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
            moreEventsElement.addEventListener('click', function() {
                // Show day view with all events
                currentDate = new Date(currentDay);
                changeView('day');
            });
            dayEvents.appendChild(moreEventsElement);
        }

        dayElement.appendChild(dayEvents);

        // Add click handler to add event on this day
        dayElement.addEventListener('click', function(e) {
            // Only handle clicks on the day background, not on events
            if (e.target === dayElement || e.target === dayNumber) {
                const selectedDate = new Date(currentDay);
                showAddEventModal(selectedDate);
            }
        });

        monthGrid.appendChild(dayElement);
    }
}

function renderWeekView() {
    const weekHeader = document.getElementById('week-header');
    const weekGrid = document.getElementById('week-grid');

    weekHeader.innerHTML = '';
    weekGrid.innerHTML = '';

    // Get the week start date (Sunday)
    const weekStart = getWeekStartDate(currentDate);

    // Create the day headers
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + i);

        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';

        // Check if day is today
        const today = new Date();
        if (dayDate.getDate() === today.getDate() &&
            dayDate.getMonth() === today.getMonth() &&
            dayDate.getFullYear() === today.getFullYear()) {
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

        // Create hour slots
        for (let hour = 0; hour < 24; hour++) {
            const hourSlot = document.createElement('div');
            hourSlot.className = 'hour-slot';
            hourSlot.dataset.hour = hour;

            // Add hour slot click handler to add event
            hourSlot.addEventListener('click', function() {
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

        // Add events to the day column
        const dayFormatted = formatDate(dayDate);
        const dayEvents = getEventsForDay(dayFormatted);

        dayEvents.forEach(event => {
            if (event.time) {
                // Parse time (HH:MM)
                const [hours, minutes] = event.time.split(':').map(Number);
                const endHours = event.endTime ? parseInt(event.endTime.split(':')[0]) : hours + 1;
                const endMinutes = event.endTime ? parseInt(event.endTime.split(':')[1]) : minutes;

                // Calculate position and height
                const topPosition = (hours * 60 + minutes) * (60 / 60); // 60px per hour
                const duration = ((endHours * 60 + endMinutes) - (hours * 60 + minutes)) * (60 / 60);

                const eventElement = document.createElement('div');
                eventElement.className = 'week-event';
                if (event.list && lists.includes(event.list)) {
                    eventElement.classList.add(event.list.toLowerCase());
                } else {
                    // Default color if no list or list not found
                    eventElement.style.backgroundColor = '#3498db';
                }

                eventElement.textContent = event.title;
                eventElement.style.top = `${topPosition}px`;
                eventElement.style.height = `${duration}px`;

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

                dayColumn.appendChild(eventElement);
            }
        });

        weekGrid.appendChild(dayColumn);
    }
}

function renderDayView() {
    const dayHeader = document.getElementById('day-header');
    const dayGrid = document.getElementById('day-grid');

    dayHeader.innerHTML = '';
    dayGrid.innerHTML = '';

    // Create day header
    const headerElement = document.createElement('div');
    headerElement.className = 'day-header';
    headerElement.textContent = dayFormatter.format(currentDate);

    // Check if it's today
    const today = new Date();
    if (currentDate.getDate() === today.getDate() &&
        currentDate.getMonth() === today.getMonth() &&
        currentDate.getFullYear() === today.getFullYear()) {
        headerElement.classList.add('today');
        dayGrid.classList.add('today');
    } else {
        dayGrid.classList.remove('today');
    }

    dayHeader.appendChild(headerElement);

    // Create hour slots
    for (let hour = 0; hour < 24; hour++) {
        const hourSlot = document.createElement('div');
        hourSlot.className = 'hour-slot';
        hourSlot.dataset.hour = hour;

        // Add hour slot click handler to add event
        hourSlot.addEventListener('click', function() {
            const selectedDate = new Date(currentDate);
            selectedDate.setHours(hour);
            showAddEventModal(selectedDate);
        });

        dayGrid.appendChild(hourSlot);
    }

    // Add current time indicator if it's today
    if (headerElement.classList.contains('today')) {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const topPosition = (hours * 60 + minutes) * (60 / 60); // 60px per hour

        const timeIndicator = document.createElement('div');
        timeIndicator.className = 'current-time-indicator';
        timeIndicator.style.top = `${topPosition}px`;
        dayGrid.appendChild(timeIndicator);
    }

    // Add events to the day
    const dayFormatted = formatDate(currentDate);
    const dayEvents = getEventsForDay(dayFormatted);

    dayEvents.forEach(event => {
        if (event.time) {
            // Parse time (HH:MM)
            const [hours, minutes] = event.time.split(':').map(Number);
            const endHours = event.endTime ? parseInt(event.endTime.split(':')[0]) : hours + 1;
            const endMinutes = event.endTime ? parseInt(event.endTime.split(':')[1]) : minutes;

            // Calculate position and height
            const topPosition = (hours * 60 + minutes) * (60 / 60); // 60px per hour
            const duration = ((endHours * 60 + endMinutes) - (hours * 60 + minutes)) * (60 / 60);

            const eventElement = document.createElement('div');
            eventElement.className = 'day-event';
            if (event.list && lists.includes(event.list)) {
                eventElement.classList.add(event.list.toLowerCase());
            } else {
                // Default color if no list or list not found
                eventElement.style.backgroundColor = '#3498db';
            }

            eventElement.textContent = event.title;
            eventElement.style.top = `${topPosition}px`;
            eventElement.style.height = `${duration}px`;

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

            dayGrid.appendChild(eventElement);
        }
    });
}

function renderMiniCalendar() {
    const miniCalendarDays = document.getElementById('mini-calendar-days');
    miniCalendarDays.innerHTML = '';

    // Get the first day of the month
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    // Calculate the first day of the calendar grid (might be from the previous month)
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
        if (currentDay.getDate() === currentDate.getDate() &&
            currentDay.getMonth() === currentDate.getMonth() &&
            currentDay.getFullYear() === currentDate.getFullYear()) {
            dayElement.classList.add('current');
        }

        // Check if day is today
        const today = new Date();
        if (currentDay.getDate() === today.getDate() &&
            currentDay.getMonth() === today.getMonth() &&
            currentDay.getFullYear() === today.getFullYear() &&
            !dayElement.classList.contains('current')) {
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

// -----------------------
// Event Management
// -----------------------
function createEventElement(event) {
    const eventElement = document.createElement('div');
    eventElement.className = 'event';

    // Add list class if available
    if (event.list && lists.includes(event.list)) {
        eventElement.classList.add(event.list.toLowerCase());
    } else {
        // Default color if no list or list not found
        eventElement.style.backgroundColor = '#3498db';
    }

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

function showAddEventModal(date = null) {
    const modal = document.getElementById('event-modal');
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const endDateInput = document.getElementById('event-end-date');
    const endTimeInput = document.getElementById('event-end-time');
    const listSelect = document.getElementById('event-list');

    // Clear previous values
    titleInput.value = '';
    timeInput.value = '';
    endDateInput.value = '';
    endTimeInput.value = '';
    document.getElementById('event-description').value = '';
    document.getElementById('event-priority').value = 'none';
    document.getElementById('add-as-task').checked = false;

    // Set current date if none provided
    if (!date) {
        date = new Date(currentDate);
    }

    // Format date for input
    const formattedDate = formatDateForInput(date);
    dateInput.value = formattedDate;

    // If the time was clicked in week/day view, set that time
    if (date.getHours() !== 0) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;

        // Set end time to 1 hour later
        const endDate = new Date(date);
        endDate.setHours(date.getHours() + 1);
        endDateInput.value = formattedDate;

        const endHours = endDate.getHours().toString().padStart(2, '0');
        const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
        endTimeInput.value = `${endHours}:${endMinutes}`;
    }

    // Populate list dropdown
    listSelect.innerHTML = '<option value="none">None</option>';
    lists.forEach(list => {
        const option = document.createElement('option');
        option.value = list;
        option.textContent = list;
        listSelect.appendChild(option);
    });

    modal.style.display = 'flex';
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

    // Validate required fields
    if (!titleInput.value.trim()) {
        alert('Please enter a title for the event');
        return;
    }

    if (!dateInput.value) {
        alert('Please select a date for the event');
        return;
    }

    // Create event object
    const newEvent = {
        id: Date.now(),
        title: titleInput.value.trim(),
        date: dateInput.value,
        time: timeInput.value || null,
        endDate: endDateInput.value || dateInput.value,
        endTime: endTimeInput.value || null,
        description: descriptionInput.value.trim(),
        list: listSelect.value !== 'none' ? listSelect.value : null,
        priority: prioritySelect.value !== 'none' ? prioritySelect.value : null,
        createdAt: new Date().toISOString()
    };

    // Add event to events array
    events.push(newEvent);

    // If add as task is checked, also create a task
    if (addAsTask.checked) {
        const newTask = {
            id: Date.now() + 1, // Ensure unique ID
            title: titleInput.value.trim(),
            description: descriptionInput.value.trim(),
            date: dateInput.value,
            reminder: null,
            priority: prioritySelect.value !== 'none' ? prioritySelect.value : 'medium',
            list: listSelect.value !== 'none' ? listSelect.value : 'N/A',
            completed: false,
            createdAt: new Date().toISOString(),
            subtasks: []
        };

        tasks.push(newTask);
        saveTasks();
    }

    // Save to localStorage
    saveEvents();

    // Close modal
    closeAllModals();

    // Refresh calendar
    updateCalendarView();
}

function showEventDetails(event) {
    selectedEvent = event;

    const modal = document.getElementById('event-details-modal');
    const titleElement = document.getElementById('detail-event-title');
    const dateElement = document.getElementById('detail-event-date');
    const timeElement = document.getElementById('detail-event-time');
    const listElement = document.getElementById('detail-event-list');
    const priorityElement = document.getElementById('detail-event-priority');
    const descriptionElement = document.getElementById('detail-event-description');

    // Set event details
    titleElement.textContent = event.title;

    // Format date
    const eventDate = new Date(event.date);
    dateElement.textContent = dayFormatter.format(eventDate);

    // Set time if available
    if (event.time) {
        if (event.endTime) {
            timeElement.textContent = `${formatTime(event.time)} - ${formatTime(event.endTime)}`;
        } else {
            timeElement.textContent = formatTime(event.time);
        }
    } else {
        timeElement.textContent = 'All Day';
    }

    // Set list
    listElement.textContent = event.list || 'None';

    // Set priority
    priorityElement.textContent = event.priority ?
        event.priority.charAt(0).toUpperCase() + event.priority.slice(1) :
        'None';

    // Set description
    descriptionElement.textContent = event.description || 'No description';

    // Show modal
    modal.style.display = 'flex';
}

function deleteSelectedEvent() {
    if (!selectedEvent) return;

    if (confirm('Are you sure you want to delete this event?')) {
        // Remove from events array
        events = events.filter(e => e.id !== selectedEvent.id);

        // Save to localStorage
        saveEvents();

        // Close modal
        closeAllModals();

        // Refresh calendar
        updateCalendarView();
    }
}

function editSelectedEvent() {
    if (!selectedEvent) return;

    // Close details modal
    closeAllModals();

    // Open edit modal
    const modal = document.getElementById('event-modal');
    const titleInput = document.getElementById('event-title');
    const dateInput = document.getElementById('event-date');
    const timeInput = document.getElementById('event-time');
    const endDateInput = document.getElementById('event-end-date');
    const endTimeInput = document.getElementById('event-end-time');
    const descriptionInput = document.getElementById('event-description');
    const listSelect = document.getElementById('event-list');
    const prioritySelect = document.getElementById('event-priority');

    // Set values from selected event
    titleInput.value = selectedEvent.title;
    dateInput.value = selectedEvent.date;
    timeInput.value = selectedEvent.time || '';
    endDateInput.value = selectedEvent.endDate || selectedEvent.date;
    endTimeInput.value = selectedEvent.endTime || '';
    descriptionInput.value = selectedEvent.description || '';
    listSelect.value = selectedEvent.list || 'none';
    prioritySelect.value = selectedEvent.priority || 'none';

    // Change save button functionality
    const saveButton = document.getElementById('save-event');
    const originalClickHandler = saveButton.onclick;

    saveButton.onclick = function() {
        const updatedEvent = {
            ...selectedEvent,
            title: titleInput.value.trim(),
            date: dateInput.value,
            time: timeInput.value || null,
            endDate: endDateInput.value || dateInput.value,
            endTime: endTimeInput.value || null,
            description: descriptionInput.value.trim(),
            list: listSelect.value !== 'none' ? listSelect.value : null,
            priority: prioritySelect.value !== 'none' ? prioritySelect.value : null
        };

        // Update in events array
        const eventIndex = events.findIndex(e => e.id === selectedEvent.id);
        if (eventIndex !== -1) {
            events[eventIndex] = updatedEvent;
        }

        // Save to localStorage
        saveEvents();

        // Close modal
        closeAllModals();

        // Refresh calendar
        updateCalendarView();

        // Restore original handler
        saveButton.onclick = originalClickHandler;
    };

    // Show modal
    modal.style.display = 'flex';
}

// -----------------------
// List Management
// -----------------------
function addNewList() {
    const newListName = prompt("Enter a name for the new list:");

    if (newListName && newListName.trim()) {
        // Check if list already exists
        if (lists.includes(newListName.trim())) {
            alert("A list with this name already exists");
            return;
        }

        // Add to lists array
        lists.push(newListName.trim());

        // Save and update UI
        saveLists();
        renderLists();
        updateEventListDropdown();
    }
}

function renderLists() {
    const listsContainer = document.getElementById('lists-container');
    listsContainer.innerHTML = '';

    // Define default colors for built-in lists
    const defaultColors = {
        'Personal': '#3498db',
        'Work': '#e74c3c',
        'Shopping': '#2ecc71'
    };

    lists.forEach((listName, index) => {
        const listItem = document.createElement("div");
        listItem.classList.add("list-item");

        // List color and name (clickable)
        const listColor = document.createElement("span");
        listColor.className = "list-color";

        // Use default color if available, or generate one
        if (defaultColors[listName]) {
            listColor.style.backgroundColor = defaultColors[listName];
        } else {
            // Generate a color based on the list name
            const hue = Math.abs(hashString(listName) % 360);
            listColor.style.backgroundColor = `hsl(${hue}, 70%, 60%)`;
        }

        const listNameEl = document.createElement("span");
        listNameEl.className = "list-name";
        listNameEl.dataset.index = index;
        listNameEl.appendChild(listColor);
        listNameEl.appendChild(document.createTextNode(listName));

        // Filter events by list when clicked
        listNameEl.addEventListener('click', function() {
            filterEventsByList(listName);
        });

        // List actions (edit, delete)
        const listActions = document.createElement("div");
        listActions.className = "list-actions";

        // Edit button
        const editBtn = document.createElement("button");
        editBtn.className = "list-edit-btn";
        editBtn.dataset.index = index;
        editBtn.textContent = "Edit";
        editBtn.addEventListener('click', function() {
            editList(index, listItem);
        });

        // Delete button
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "list-delete-btn";
        deleteBtn.dataset.index = index;
        deleteBtn.textContent = "Delete";
        deleteBtn.addEventListener('click', function() {
            deleteList(index, listName);
        });

        // Assemble list item
        listActions.append(editBtn, deleteBtn);
        listItem.append(listNameEl, listActions);
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
    editInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            saveListEdit(index, editInput.value, listItem, listNameEl, editInput);
        } else if (e.key === 'Escape') {
            cancelListEdit(listItem, listNameEl, editInput);
        }
    });

    editInput.addEventListener('blur', function() {
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

        // Update events with this list name
        updateEventsWithNewListName(oldName, newName);

        // Update tasks with this list name
        updateTasksWithNewListName(oldName, newName);

        // Save and update UI
        saveLists();
        updateEventListDropdown();
    }

    // Re-render lists
    renderLists();
}

function cancelListEdit(listItem, listNameEl, editInput) {
    listNameEl.style.display = '';
    editInput.remove();
}

function deleteList(index, listName) {
    if (confirm(`Are you sure you want to delete the list "${listName}"?`)) {
        // Remove from lists array
        lists.splice(index, 1);

        // Update events with this list
        updateEventsWithDeletedList(listName);

        // Update tasks with this list
        updateTasksWithDeletedList(listName);

        // Save and update UI
        saveLists();
        renderLists();
        updateEventListDropdown();

        // Refresh calendar
        updateCalendarView();
    }
}

function updateEventsWithNewListName(oldName, newName) {
    let eventsUpdated = false;

    events.forEach(event => {
        if (event.list === oldName) {
            event.list = newName;
            eventsUpdated = true;
        }
    });

    if (eventsUpdated) {
        saveEvents();
    }
}

function updateEventsWithDeletedList(deletedListName) {
    let eventsUpdated = false;

    events.forEach(event => {
        if (event.list === deletedListName) {
            event.list = null;
            eventsUpdated = true;
        }
    });

    if (eventsUpdated) {
        saveEvents();
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
    }
}

function updateEventListDropdown() {
    const listSelect = document.getElementById('event-list');

    // Save the current selection
    const currentSelection = listSelect.value;

    // Clear current options except the default one
    listSelect.innerHTML = '<option value="none">None</option>';

    // Add list options
    lists.forEach(listName => {
        const option = document.createElement("option");
        option.value = listName;
        option.textContent = listName;
        listSelect.appendChild(option);
    });

    // Restore selection if it still exists
    if (lists.includes(currentSelection)) {
        listSelect.value = currentSelection;
    }
}

function filterEventsByList(listName) {
    // Clear any existing filters first
    document.querySelectorAll('.event').forEach(event => {
        event.closest('.calendar-day').style.display = '';
    });

    // Update title to show which list is being viewed
    document.getElementById('calendar-title').textContent = `${listName} - ${monthFormatter.format(currentDate)}`;

    // In month view, highlight only days with events from this list
    if (currentView === 'month') {
        document.querySelectorAll('.calendar-day').forEach(day => {
            const hasListEvents = Array.from(day.querySelectorAll('.event'))
                .some(event => event.classList.contains(listName.toLowerCase()));

            if (!hasListEvents) {
                day.style.opacity = '0.5';
            }
        });
    }

    // Change background color of header to match list color
    const headerEl = document.querySelector('.calendar-header');

    // Define default colors for built-in lists
    const defaultColors = {
        'Personal': '#3498db',
        'Work': '#e74c3c',
        'Shopping': '#2ecc71'
    };

    if (defaultColors[listName]) {
        headerEl.style.borderBottom = `3px solid ${defaultColors[listName]}`;
    } else {
        // Generate a color based on the list name
        const hue = Math.abs(hashString(listName) % 360);
        headerEl.style.borderBottom = `3px solid hsl(${hue}, 70%, 60%)`;
    }
}

// -----------------------
// Task Integration
// -----------------------

// Synchronize tasks with events - convert tasks with dates to events
function syncTasksToEvents() {
    // First, get all tasks with dates
    const tasksWithDates = tasks.filter(task => task.date);

    // For each task with a date, check if we already have an event for it
    tasksWithDates.forEach(task => {
        // See if we already have an event with this task ID
        const existingEvent = events.find(event => event.taskId === task.id);

        if (!existingEvent) {
            // Create a new event from this task
            const newEvent = {
                id: Date.now(),
                taskId: task.id,
                title: task.title,
                date: task.date,
                time: null, // Tasks don't have times by default
                endDate: task.date,
                endTime: null,
                description: task.description || '',
                list: task.list !== 'N/A' ? task.list : null,
                priority: task.priority,
                createdAt: new Date().toISOString()
            };

            events.push(newEvent);
        } else {
            // Update existing event with task data
            existingEvent.title = task.title;
            existingEvent.date = task.date;
            existingEvent.endDate = task.date;
            existingEvent.description = task.description || '';
            existingEvent.list = task.list !== 'N/A' ? task.list : null;
            existingEvent.priority = task.priority;
        }
    });

    // Save events
    saveEvents();
}

// -----------------------
// Utility Functions
// -----------------------
function getEventsForDay(dateString) {
    return events.filter(event => event.date === dateString);
}

function getWeekStartDate(date) {
    const result = new Date(date);
    result.setDate(result.getDate() - result.getDay()); // Go to Sunday
    return result;
}

function formatDate(date) {
    // Format as YYYY-MM-DD for storage and comparison
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function formatDateForInput(date) {
    // Format as YYYY-MM-DD for input elements
    return formatDate(date);
}

function formatTime(timeString) {
    // Convert 24-hour format (HH:MM) to 12-hour format
    if (!timeString) return '';

    const [hours, minutes] = timeString.split(':').map(Number);

    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12

    return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

// -----------------------
// Data Storage Functions
// -----------------------
function loadEvents() {
    const savedEvents = localStorage.getItem('calendar-events');
    events = savedEvents ? JSON.parse(savedEvents) : [];

    // Sync tasks with dates to events
    syncTasksToEvents();
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

    // Render lists
    renderLists();
}

function saveLists() {
    localStorage.setItem('custom-lists', JSON.stringify(lists));


// Initialize external calendar integration
    function initCalendarIntegration() {
        // Check if calendar sync is enabled for any service
        const googleSyncEnabled = localStorage.getItem('google-calendar-sync') === 'true';
        const outlookSyncEnabled = localStorage.getItem('outlook-calendar-sync') === 'true';

        if (googleSyncEnabled) {
            fetchGoogleEvents();
        }

        if (outlookSyncEnabled) {
            fetchOutlookEvents();
        }

        // Set up automatic syncing based on frequency setting
        setupAutoSync();
    }

// Setup automatic synchronization based on user preferences
    function setupAutoSync() {
        // Clear any existing sync interval
        if (window.calendarSyncInterval) {
            clearInterval(window.calendarSyncInterval);
        }

        // Get sync frequency setting (in minutes)
        const syncFrequency = localStorage.getItem('calendar-sync-frequency') || '30';

        // If set to manual, don't set up auto-sync
        if (syncFrequency === 'manual') {
            console.log('Calendar sync set to manual mode');
            return;
        }

        // Convert minutes to milliseconds
        const syncInterval = parseInt(syncFrequency) * 60 * 1000;

        // Set up interval for auto-sync
        window.calendarSyncInterval = setInterval(() => {
            console.log(`Auto-syncing calendars (every ${syncFrequency} minutes)`);
            syncAllCalendars();
        }, syncInterval);

        console.log(`Automatic calendar sync set for every ${syncFrequency} minutes`);
    }

// Synchronize all enabled calendar services
    function syncAllCalendars() {
        const googleSyncEnabled = localStorage.getItem('google-calendar-sync') === 'true';
        const outlookSyncEnabled = localStorage.getItem('outlook-calendar-sync') === 'true';

        if (googleSyncEnabled) {
            fetchGoogleEvents();
        }

        if (outlookSyncEnabled) {
            fetchOutlookEvents();
        }

        // If there's a calendar view currently displayed, refresh it
        if (typeof updateCalendarView === 'function') {
            updateCalendarView();
        }
    }

// Fetch events from Google Calendar
    function fetchGoogleEvents() {
        // In a real implementation, this would make API calls to Google Calendar
        // For demo purposes, we'll generate some sample events

        console.log('Fetching Google Calendar events...');

        // Get selected calendars
        const selectedCalendars = JSON.parse(localStorage.getItem('google-calendar-selections') || '{}');

        // Clear previous events
        googleEvents = [];

        // Only proceed if we have a token
        const token = localStorage.getItem('google-auth-token');
        if (!token) {
            console.log('No Google authorization token found');
            return;
        }

        // Generate sample events for selected calendars
        Object.keys(selectedCalendars).forEach(calendarId => {
            if (selectedCalendars[calendarId]) {
                const sampleEvents = generateSampleEvents(
                    calendarId,
                    'google',
                    getCalendarColorForDemo(calendarId, 'google')
                );
                googleEvents = [...googleEvents, ...sampleEvents];
            }
        });

        console.log(`Fetched ${googleEvents.length} events from Google Calendar`);

        // Make events available to the main calendar
        integrateExternalEvents();
    }

// Fetch events from Outlook Calendar
    function fetchOutlookEvents() {
        // In a real implementation, this would make API calls to Microsoft Graph
        // For demo purposes, we'll generate some sample events

        console.log('Fetching Outlook Calendar events...');

        // Get selected calendars
        const selectedCalendars = JSON.parse(localStorage.getItem('outlook-calendar-selections') || '{}');

        // Clear previous events
        outlookEvents = [];

        // Only proceed if we have a token
        const token = localStorage.getItem('outlook-auth-token');
        if (!token) {
            console.log('No Outlook authorization token found');
            return;
        }

        // Generate sample events for selected calendars
        Object.keys(selectedCalendars).forEach(calendarId => {
            if (selectedCalendars[calendarId]) {
                const sampleEvents = generateSampleEvents(
                    calendarId,
                    'outlook',
                    getCalendarColorForDemo(calendarId, 'outlook')
                );
                outlookEvents = [...outlookEvents, ...sampleEvents];
            }
        });

        console.log(`Fetched ${outlookEvents.length} events from Outlook Calendar`);

        // Make events available to the main calendar
        integrateExternalEvents();
    }

// Generate sample events for demo purposes
    function generateSampleEvents(calendarId, service, color) {
        const events = [];
        const today = new Date();
        const calendarName = getCalendarNameForDemo(calendarId, service);

        // Create some past events
        for (let i = 1; i <= 5; i++) {
            const eventDate = new Date(today);
            eventDate.setDate(today.getDate() - Math.floor(Math.random() * 10) - 1);

            events.push({
                id: `${service}-${calendarId}-past-${i}`,
                title: `${calendarName} Past Event ${i}`,
                date: formatDate(eventDate),
                time: formatTimeForEvent(9 + i),
                endTime: formatTimeForEvent(10 + i),
                description: `This is a sample past event from ${service} (${calendarName})`,
                list: null,
                priority: null,
                color: color,
                source: service,
                calendarId: calendarId,
                sourceCalendarName: calendarName
            });
        }

        // Create some future events
        for (let i = 1; i <= 8; i++) {
            const eventDate = new Date(today);
            eventDate.setDate(today.getDate() + Math.floor(Math.random() * 14) + 1);

            const hourStart = 8 + Math.floor(Math.random() * 9);

            events.push({
                id: `${service}-${calendarId}-future-${i}`,
                title: `${calendarName} Future Event ${i}`,
                date: formatDate(eventDate),
                time: formatTimeForEvent(hourStart),
                endTime: formatTimeForEvent(hourStart + 1 + Math.floor(Math.random() * 2)),
                description: `This is a sample future event from ${service} (${calendarName})`,
                list: null,
                priority: null,
                color: color,
                source: service,
                calendarId: calendarId,
                sourceCalendarName: calendarName
            });
        }

        // Create a few all-day events
        for (let i = 1; i <= 3; i++) {
            const eventDate = new Date(today);
            eventDate.setDate(today.getDate() + Math.floor(Math.random() * 10) + 1);

            events.push({
                id: `${service}-${calendarId}-allday-${i}`,
                title: `${calendarName} All-Day Event ${i}`,
                date: formatDate(eventDate),
                time: null, // All-day event
                endTime: null,
                description: `This is a sample all-day event from ${service} (${calendarName})`,
                list: null,
                priority: null,
                color: color,
                source: service,
                calendarId: calendarId,
                sourceCalendarName: calendarName
            });
        }

        // Create a few events for today
        for (let i = 1; i <= 2; i++) {
            const hourStart = 12 + Math.floor(Math.random() * 6);

            events.push({
                id: `${service}-${calendarId}-today-${i}`,
                title: `${calendarName} Today Event ${i}`,
                date: formatDate(today),
                time: formatTimeForEvent(hourStart),
                endTime: formatTimeForEvent(hourStart + 1),
                description: `This is a sample event for today from ${service} (${calendarName})`,
                list: null,
                priority: null,
                color: color,
                source: service,
                calendarId: calendarId,
                sourceCalendarName: calendarName
            });
        }

        return events;
    }

// Get calendar name for demo purposes
    function getCalendarNameForDemo(calendarId, service) {
        // Define common calendar names for demo
        const googleCalendars = {
            'primary': 'Main Calendar',
            'work': 'Work',
            'family': 'Family',
            'birthdays': 'Birthdays'
        };

        const outlookCalendars = {
            'primary': 'Calendar',
            'work': 'Work Schedule',
            'personal': 'Personal',
            'holidays': 'Holidays'
        };

        if (service === 'google') {
            return googleCalendars[calendarId] || 'Google Calendar';
        } else {
            return outlookCalendars[calendarId] || 'Outlook Calendar';
        }
    }

// Get calendar color for demo purposes
    function getCalendarColorForDemo(calendarId, service) {
        // Define common calendar colors for demo
        const googleCalendars = {
            'primary': '#4285F4',
            'work': '#DB4437',
            'family': '#0F9D58',
            'birthdays': '#F4B400'
        };

        const outlookCalendars = {
            'primary': '#0078D4',
            'work': '#107C10',
            'personal': '#A4262C',
            'holidays': '#5C2E91'
        };

        if (service === 'google') {
            return googleCalendars[calendarId] || '#4285F4';
        } else {
            return outlookCalendars[calendarId] || '#0078D4';
        }
    }

// Format time for event (HH:MM)
    function formatTimeForEvent(hour) {
        const h = Math.floor(hour) % 24;
        const m = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, or 45

        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }

// Integrate external events with the main calendar
    function integrateExternalEvents() {
        // In a real implementation, you would add external events to the main events array
        // with proper source identification

        // Combine all external events
        const allExternalEvents = [...googleEvents, ...outlookEvents];

        // Filter out existing external events from the main events array
        events = events.filter(event => !event.source);

        // Add external events to the main events array
        events = [...events, ...allExternalEvents];

        // Save events to localStorage (in a real app, you might handle this differently)
        saveEvents();

        console.log(`Integrated ${allExternalEvents.length} external events with the main calendar`);
    }

// Create a new event in an external calendar
    function createExternalEvent(event, service, calendarId) {
        // In a real implementation, this would make API calls to the respective service
        // For demo purposes, we'll simulate creating an event

        console.log(`Creating event in ${service} calendar (${calendarId}):`, event.title);

        // Generate a unique ID for the new event
        const newId = `${service}-${calendarId}-${Date.now()}`;

        // Create the external event object
        const externalEvent = {
            ...event,
            id: newId,
            source: service,
            calendarId: calendarId,
            sourceCalendarName: getCalendarNameForDemo(calendarId, service),
            color: getCalendarColorForDemo(calendarId, service)
        };

        // Add to the appropriate array
        if (service === 'google') {
            googleEvents.push(externalEvent);
        } else if (service === 'outlook') {
            outlookEvents.push(externalEvent);
        }

        // Integrate with main calendar
        integrateExternalEvents();

        return externalEvent;
    }

// Update an existing event in an external calendar
    function updateExternalEvent(event) {
        // In a real implementation, this would make API calls to the respective service
        // For demo purposes, we'll simulate updating an event

        if (!event.source) {
            console.error('This is not an external event');
            return false;
        }

        console.log(`Updating event in ${event.source} calendar:`, event.title);

        // Update in the appropriate array
        if (event.source === 'google') {
            const index = googleEvents.findIndex(e => e.id === event.id);
            if (index !== -1) {
                googleEvents[index] = event;
            }
        } else if (event.source === 'outlook') {
            const index = outlookEvents.findIndex(e => e.id === event.id);
            if (index !== -1) {
                outlookEvents[index] = event;
            }
        }

        // Integrate with main calendar
        integrateExternalEvents();

        return true;
    }

// Delete an event from an external calendar
    function deleteExternalEvent(event) {
        // In a real implementation, this would make API calls to the respective service
        // For demo purposes, we'll simulate deleting an event

        if (!event.source) {
            console.error('This is not an external event');
            return false;
        }

        console.log(`Deleting event from ${event.source} calendar:`, event.title);

        // Remove from the appropriate array
        if (event.source === 'google') {
            googleEvents = googleEvents.filter(e => e.id !== event.id);
        } else if (event.source === 'outlook') {
            outlookEvents = outlookEvents.filter(e => e.id !== event.id);
        }

        // Integrate with main calendar
        integrateExternalEvents();

        return true;
    }

// Add this integration to the main Cal.js file by adding:
// 1. Import at the top
// 2. Call initCalendarIntegration() in the initApp() function
// 3. Modify event creation/editing to use the e
// Modifications to Cal.js to integrate external calendar services
// Add these changes to your existing Cal.js file

// Modified initApp function to initialize calendar integration
    function initApp() {
        // Load saved data from localStorage
        loadLists();
        loadTasks();
        loadEvents();

        // Initialize external calendar integrations
        initCalendarIntegration();

        // Initialize calendar views
        updateCalendarTitle();
        renderMiniCalendar();

        // Render the current view (default is month)
        updateCalendarView();
    }

// Modified event creation function to handle external calendars
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

        // Validate required fields
        if (!titleInput.value.trim()) {
            alert('Please enter a title for the event');
            return;
        }

        if (!dateInput.value) {
            alert('Please select a date for the event');
            return;
        }

        // Create event object
        const newEvent = {
            id: Date.now(),
            title: titleInput.value.trim(),
            date: dateInput.value,
            time: timeInput.value || null,
            endDate: endDateInput.value || dateInput.value,
            endTime: endTimeInput.value || null,
            description: descriptionInput.value.trim(),
            list: listSelect.value !== 'none' ? listSelect.value : null,
            priority: prioritySelect.value !== 'none' ? prioritySelect.value : null,
            createdAt: new Date().toISOString()
        };

        // Check if we should create the event in an external calendar
        const googleSyncEnabled = localStorage.getItem('google-calendar-sync') === 'true';
        const outlookSyncEnabled = localStorage.getItem('outlook-calendar-sync') === 'true';
        const twoWaySync = localStorage.getItem('two-way-sync') !== 'false';

        if (twoWaySync && (googleSyncEnabled || outlookSyncEnabled)) {
            // Get default calendars for each service if available
            let targetService = null;
            let targetCalendarId = null;

            if (googleSyncEnabled) {
                const googleSelections = JSON.parse(localStorage.getItem('google-calendar-selections') || '{}');
                // Find the first selected calendar (usually the primary)
                for (const calId in googleSelections) {
                    if (googleSelections[calId]) {
                        targetService = 'google';
                        targetCalendarId = calId;
                        break;
                    }
                }
            }

            // If no Google calendar was selected, try Outlook
            if (!targetService && outlookSyncEnabled) {
                const outlookSelections = JSON.parse(localStorage.getItem('outlook-calendar-selections') || '{}');
                // Find the first selected calendar
                for (const calId in outlookSelections) {
                    if (outlookSelections[calId]) {
                        targetService = 'outlook';
                        targetCalendarId = calId;
                        break;
                    }
                }
            }

            // If we have a target service and calendar, create the event there
            if (targetService && targetCalendarId) {
                const externalEvent = createExternalEvent(newEvent, targetService, targetCalendarId);

                if (externalEvent) {
                    console.log(`Event created in ${targetService} calendar ${targetCalendarId}`);
                    // Since integrateExternalEvents already adds to the main events array,
                    // we don't need to add it again below

                    // Close modal
                    closeAllModals();

                    // If add as task is checked, also create a task
                    if (addAsTask.checked) {
                        createTaskFromEvent(externalEvent);
                    }

                    // Refresh calendar
                    updateCalendarView();

                    return;
                }
            }
        }

        // If we get here, add to local events (not synced to external calendars)
        // Add event to events array
        events.push(newEvent);

        // If add as task is checked, also create a task
        if (addAsTask.checked) {
            createTaskFromEvent(newEvent);
        }

        // Save to localStorage
        saveEvents();

        // Close modal
        closeAllModals();

        // Refresh calendar
        updateCalendarView();
    }

// Helper function to create a task from an event
    function createTaskFromEvent(event) {
        const newTask = {
            id: Date.now() + 1, // Ensure unique ID
            title: event.title,
            description: event.description,
            date: event.date,
            reminder: null,
            priority: event.priority || 'medium',
            list: event.list || 'N/A',
            completed: false,
            createdAt: new Date().toISOString(),
            subtasks: []
        };

        tasks.push(newTask);
        saveTasks();
    }

// Modified deleteSelectedEvent function to handle external events
    function deleteSelectedEvent() {
        if (!selectedEvent) return;

        if (confirm('Are you sure you want to delete this event?')) {
            // Check if this is an external event
            if (selectedEvent.source) {
                // Delete from external calendar
                const success = deleteExternalEvent(selectedEvent);

                if (success) {
                    // Close modal
                    closeAllModals();

                    // Refresh calendar
                    updateCalendarView();
                    return;
                }
            }

            // Otherwise, remove from local events array
            events = events.filter(e => e.id !== selectedEvent.id);

            // Save to localStorage
            saveEvents();

            // Close modal
            closeAllModals();

            // Refresh calendar
            updateCalendarView();
        }
    }

// Modified editSelectedEvent function to handle external events
    function editSelectedEvent() {
        if (!selectedEvent) return;

        // Close details modal
        closeAllModals();

        // Open edit modal
        const modal = document.getElementById('event-modal');
        const titleInput = document.getElementById('event-title');
        const dateInput = document.getElementById('event-date');
        const timeInput = document.getElementById('event-time');
        const endDateInput = document.getElementById('event-end-date');
        const endTimeInput = document.getElementById('event-end-time');
        const descriptionInput = document.getElementById('event-description');
        const listSelect = document.getElementById('event-list');
        const prioritySelect = document.getElementById('event-priority');

        // Set values from selected event
        titleInput.value = selectedEvent.title;
        dateInput.value = selectedEvent.date;
        timeInput.value = selectedEvent.time || '';
        endDateInput.value = selectedEvent.endDate || selectedEvent.date;
        endTimeInput.value = selectedEvent.endTime || '';
        descriptionInput.value = selectedEvent.description || '';
        listSelect.value = selectedEvent.list || 'none';
        prioritySelect.value = selectedEvent.priority || 'none';

        // Change save button functionality
        const saveButton = document.getElementById('save-event');
        const originalClickHandler = saveButton.onclick;

        saveButton.onclick = function () {
            const updatedEvent = {
                ...selectedEvent,
                title: titleInput.value.trim(),
                date: dateInput.value,
                time: timeInput.value || null,
                endDate: endDateInput.value || dateInput.value,
                endTime: endTimeInput.value || null,
                description: descriptionInput.value.trim(),
                list: listSelect.value !== 'none' ? listSelect.value : null,
                priority: prioritySelect.value !== 'none' ? prioritySelect.value : null
            };

            // Check if this is an external event
            if (selectedEvent.source) {
                // Update in external calendar
                const success = updateExternalEvent(updatedEvent);

                if (success) {
                    // Close modal
                    closeAllModals();

                    // Refresh calendar
                    updateCalendarView();

                    // Restore original handler
                    saveButton.onclick = originalClickHandler;

                    return;
                }
            }

            // Otherwise, update in local events array
            const eventIndex = events.findIndex(e => e.id === selectedEvent.id);
            if (eventIndex !== -1) {
                events[eventIndex] = updatedEvent;
            }

            // Save to localStorage
            saveEvents();

            // Close modal
            closeAllModals();

            // Refresh calendar
            updateCalendarView();

            // Restore original handler
            saveButton.onclick = originalClickHandler;
        };

        // Show modal
        modal.style.display = 'flex';
    }

// Modified createEventElement to handle external events styling
    function createEventElement(event) {
        const eventElement = document.createElement('div');
        eventElement.className = 'event';

        // Style based on source (external calendar or local list)
        if (event.source) {
            // External event
            eventElement.style.backgroundColor = event.color || '#3498db';

            // Add source indicator
            eventElement.classList.add(`source-${event.source}`);
        } else if (event.list && lists.includes(event.list)) {
            // Local event with list
            eventElement.classList.add(event.list.toLowerCase());
        } else {
            // Default color for local events without list
            eventElement.style.backgroundColor = '#3498db';
        }

        // Create title with time if available
        let titleText = event.title;
        if (event.time) {
            titleText = `${formatTime(event.time)} ${titleText}`;
        }

        // For external events, add a small source indicator
        if (event.source) {
            const sourceIcon = event.source === 'google' ? '🔵 ' : '🟦 ';
            titleText = sourceIcon + titleText;
        }

        eventElement.textContent = titleText;

        // Add click handler to show details
        eventElement.addEventListener('click', function (e) {
            e.stopPropagation();
            showEventDetails(event);
        });

        return eventElement;
    }

// Modified event details display to show source information
    function showEventDetails(event) {
        selectedEvent = event;

        const modal = document.getElementById('event-details-modal');
        const titleElement = document.getElementById('detail-event-title');
        const dateElement = document.getElementById('detail-event-date');
        const timeElement = document.getElementById('detail-event-time');
        const listElement = document.getElementById('detail-event-list');
        const priorityElement = document.getElementById('detail-event-priority');
        const descriptionElement = document.getElementById('detail-event-description');

        // Set event details
        titleElement.textContent = event.title;

        // Format date
        const eventDate = new Date(event.date);
        dateElement.textContent = dayFormatter.format(eventDate);

        // Set time if available
        if (event.time) {
            if (event.endTime) {
                timeElement.textContent = `${formatTime(event.time)} - ${formatTime(event.endTime)}`;
            } else {
                timeElement.textContent = formatTime(event.time);
            }
        } else {
            timeElement.textContent = 'All Day';
        }

        // Set source or list
        if (event.source) {
            // This is an external event
            const sourceName = event.source === 'google' ? 'Google Calendar' : 'Outlook Calendar';
            listElement.innerHTML = `<i class="fab fa-${event.source === 'google' ? 'google' : 'microsoft'}"></i> ${sourceName}: ${event.sourceCalendarName}`;
        } else {
            // Local event
            listElement.textContent = event.list || 'None';
        }

        // Set priority
        priorityElement.textContent = event.priority ?
            event.priority.charAt(0).toUpperCase() + event.priority.slice(1) :
            'None';

        // Set description
        descriptionElement.textContent = event.description || 'No description';

        // Show modal
        modal.style.display = 'flex';
    }
}