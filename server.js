const express = require('express');
const path = require('path');
const axios = require('axios');
const app = express();
const PORT = 3000; // You can change this to any port you want

// Serve static files from the project directory
app.use(express.static(path.join(__dirname)));

// Route to handle Google OAuth callback
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    console.log('Authorization code received:', code);

    // Store the code or exchange it for tokens
    // For now, redirect to Settings.html
    res.redirect('/Settings.html?auth=success');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});