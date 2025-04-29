const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 63342; // Must match your redirect URI

// Serve static files (e.g., Settings.html)
app.use(express.static(path.join(__dirname, 'public'))); // Make sure this folder contains your HTML files

// OAuth callback route
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    console.log('Authorization code received:', code);

    try {
        // For now, just redirect
        res.redirect('/Settings.html?auth=success');
    } catch (error) {
        console.error('Error processing OAuth callback:', error);
        res.redirect('/Settings.html?auth=error');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
