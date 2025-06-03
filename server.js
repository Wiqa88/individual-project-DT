const express = require('express');
const path = require('path');
const app = express();
const PORT = 63342;

// Disable caching during development
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Basic route for serving the main application
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'todo.html'));
});

// Route for serving todo page
app.get('/todo.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'todo.html'));
});

// Route for serving calendar page
app.get('/Cal.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Cal.html'));
});

// Route for serving settings page
app.get('/Settings.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Settings.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});