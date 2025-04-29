const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 63342; // This should match your redirect URI port

// Serve static files from the current folder
app.use(express.static(__dirname));

// OAuth callback route
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    console.log('Authorization code received:', code);

    try {
        // Redirect to your Settings page on success
        res.redirect('/Settings.html?auth=success');
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('/Settings.html?auth=error');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
