const express = require('express');
const axios = require('axios');
const path = require('path');
const session = require('express-session');
const app = express();
const PORT = 3000;

// Add session support to store tokens
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Google OAuth configuration
const GOOGLE_CLIENT_ID = '233840126993-uned9hu7bedgpnursvggctc8c0qvussl.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'YOUR_CLIENT_SECRET'; // You need to add your client secret here
const REDIRECT_URI = `http://localhost:${PORT}/auth/google/callback`;

// OAuth callback route
app.get('/auth/google/callback', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.redirect('/Settings.html?error=no_code');
    }

    try {
        // Exchange code for tokens
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            code,
            client_id: GOOGLE_CLIENT_ID,
            client_secret: GOOGLE_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Store tokens in session
        req.session.googleTokens = tokenResponse.data;

        // Redirect to settings page with success parameter
        res.redirect('/Settings.html?auth=success');
    } catch (error) {
        console.error('Error exchanging code for tokens:', error.response?.data || error.message);
        res.redirect('/Settings.html?error=token_exchange');
    }
});

// API endpoint to get calendar list
app.get('/api/calendars', async (req, res) => {
    if (!req.session.googleTokens) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const response = await axios.get('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
            headers: {
                Authorization: `Bearer ${req.session.googleTokens.access_token}`
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching calendars:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch calendars' });
    }
});

// API endpoint to get events from a calendar
app.get('/api/events/:calendarId', async (req, res) => {
    if (!req.session.googleTokens) {
        return res.status(401).json({ error: 'Not authenticated' });
    }

    try {
        const calendarId = req.params.calendarId;
        const response = await axios.get(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
            headers: {
                Authorization: `Bearer ${req.session.googleTokens.access_token}`
            },
            params: {
                timeMin: new Date().toISOString(),
                maxResults: 10,
                singleEvents: true,
                orderBy: 'startTime'
            }
        });

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching events:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});