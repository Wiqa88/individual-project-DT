const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const port = 63342; // Match this with the port in your redirect URI

// Enable CORS and JSON handling
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from your project root directory
app.use(express.static(path.join(__dirname, '..'))); // This will serve files from C:\Individual project DT

// Google OAuth callback endpoint
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;
    console.log('Authorization code received:', code);

    if (!code) {
        return res.status(400).send('Authorization code is missing');
    }

    try {
        // Exchange code for tokens (implementation below)
        const tokens = await exchangeCodeForTokens(code);

        // In a real application, you would securely store these tokens
        // For this demo, we'll just show a success message

        // Redirect back to your settings page with a success parameter
        res.redirect('/Settings.html?auth=success');
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        res.redirect('/Settings.html?auth=error');
    }
});

// Function to exchange authorization code for tokens
async function exchangeCodeForTokens(code) {
    const clientId = '233840126993-uned9hu7bedgpnursvggctc8c0qvussl.apps.googleusercontent.com';
    const clientSecret = 'YOUR_CLIENT_SECRET'; // Replace with your actual client secret
    const redirectUri = 'http://localhost:63342/auth/google/callback';

    try {
        const response = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        });

        return response.data;
    } catch (error) {
        console.error('Token exchange error:', error.response?.data || error.message);
        throw error;
    }
}

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});