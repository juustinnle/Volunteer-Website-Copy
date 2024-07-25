const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const pool = require('./db'); // Ensure this points to your database connection file
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json()); // Middleware to parse JSON bodies

// Helper function to handle undefined parameters
const handleUndefinedParams = (params) => {
    return params.map(param => param === undefined ? null : param);
};

// User Registration Endpoint
app.post('/register', async (req, res) => {
    const { username, password, full_name, address, city, state, zipcode, skills, preferences, availability } = req.body;

    // Log received request body for debugging
    console.log('Received request body:', req.body);

    // Input validation
    if (!username || !password || !full_name || !address || !city || !state || !zipcode) {
        console.log('Validation failed. Missing required fields.');
        return res.status(400).send('Missing required fields');
    }

    try {
        const connection = await pool.getConnection();

        // Check if username already exists
        const [existingUser] = await connection.execute('SELECT * FROM UserCredentials WHERE username = ?', [username]);
        if (existingUser.length > 0) {
            console.log('Username already exists');
            connection.release();
            return res.status(400).send('Username already exists');
        }

        // Encrypt password
        const password_hash = await bcrypt.hash(password, 10);

        // Insert user credentials
        const [result] = await connection.execute('INSERT INTO UserCredentials (username, password_hash) VALUES (?, ?)', [username, password_hash]);
        const user_id = result.insertId;

        // Prepare user profile data, handling undefined parameters
        const userProfileParams = handleUndefinedParams([user_id, full_name, address, city, state, zipcode, skills, preferences, availability]);

        // Insert user profile
        await connection.execute(
            'INSERT INTO UserProfile (user_id, full_name, address, city, state, zipcode, skills, preferences, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            userProfileParams
        );

        connection.release();
        console.log('User registered successfully');
        res.status(201).send('User registered successfully');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send('Username and password are required.');
        }

        const [users] = await pool.execute(
            'SELECT * FROM UserCredentials WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).send('Invalid username or password.');
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).send('Invalid username or password.');
        }

        res.status(200).send('Login successful.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Login failed.');
    }
});

// Update user profile endpoint
app.put('/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const { full_name, address, city, state, zipcode, skills, preferences, availability } = req.body;

        // Prepare user profile data, handling undefined parameters
        const userProfileParams = handleUndefinedParams([full_name, address, city, state, zipcode, skills, preferences, availability, username]);

        const [result] = await pool.execute(
            'UPDATE UserProfile JOIN UserCredentials ON UserProfile.user_id = UserCredentials.ID SET full_name = ?, address = ?, city = ?, state = ?, zipcode = ?, skills = ?, preferences = ?, availability = ? WHERE UserCredentials.username = ?',
            userProfileParams
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('User not found.');
        }

        res.status(200).send('Profile updated successfully.');
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to update profile.');
    }
});

// Create event endpoint
app.post('/events', (req, res) => {
    const { name, description, location, requiredSkills, urgency, eventDates } = req.body;

    if (!name || !description || !location || !requiredSkills || !urgency || !eventDates) {
        return res.status(400).send('All fields are required.');
    }

    const newEvent = {
        id: `${Date.now()}`,
        name,
        description,
        location,
        requiredSkills,
        urgency,
        eventDates
    };
    events.push(newEvent);

    users.forEach(user => {
        notifications.push({
            email: user.email,
            message: `New event: ${name}`
        });
    });

    res.status(201).send('Event created successfully.');
});

// Get all events endpoint
app.get('/events', (req, res) => {
    res.status(200).json(events);
});

// Delete event endpoint
app.delete('/events/:id', (req, res) => {
    const { id } = req.params;
    const eventIndex = events.findIndex(event => event.id === id);

    if (eventIndex === -1) {
        return res.status(404).send('Event not found.');
    }

    events.splice(eventIndex, 1);
    res.status(200).send('Event deleted successfully.');
});

// Create notification endpoint
app.post('/notifications', (req, res) => {
    const { email, message } = req.body;

    if (!email || !message) {
        return res.status(400).send('Email and message are required.');
    }

    notifications.push({ email, message });
    res.status(201).send('Notification created successfully.');
});

// Get notifications for a user endpoint
app.get('/notifications/:email', (req, res) => {
    const { email } = req.params;
    const userNotifications = notifications.filter(notification => notification.email === email);
    res.status(200).json(userNotifications);
});

// Get all users endpoint
app.get('/users', (req, res) => {
    res.status(200).json(users);
});

// Delete notification endpoint
app.delete('/notifications/:email/:message', (req, res) => {
    const { email, message } = req.params;
    const notificationIndex = notifications.findIndex(notification => notification.email === email && notification.message === message);

    if (notificationIndex === -1) {
        return res.status(404).send('Notification not found.');
    }

    notifications.splice(notificationIndex, 1);
    res.status(200).send('Notification deleted successfully.');
});

app.get('/matching-events/:email', (req, res) => {
    const { email } = req.params;
    const user = users.find(user => user.email === email);

    if (!user) {
        return res.status(404).send('User not found.');
    }

    const userSkills = user.profile.skills || [];
    const userAvailability = user.profile.availability || [];

    const isDateOverlap = (startDate1, endDate1, startDate2, endDate2) => {
        return (startDate1 <= endDate2) && (startDate2 <= endDate1);
    };

    const matchingEvents = events.filter(event => {
        const eventDates = event.eventDates.map(dates => dates.split(' to '));
        return event.requiredSkills.some(skill => userSkills.includes(skill)) &&
            eventDates.some(([eventStart, eventEnd]) => {
                return userAvailability.some(dateRange => {
                    const [availStart, availEnd] = dateRange.split(' to ');
                    return isDateOverlap(new Date(eventStart), new Date(eventEnd), new Date(availStart), new Date(availEnd));
                });
            });
    });

    res.status(200).json(matchingEvents);
});

// Match volunteer to an event endpoint
app.post('/match-volunteer', (req, res) => {
    const { email, eventId } = req.body;

    const user = users.find(user => user.email === email);
    const event = events.find(event => event.id === eventId);

    if (!user) {
        return res.status(404).send('User not found.');
    }
    if (!event) {
        return res.status(404).send('Event not found.');
    }

    const alreadyMatched = user.volunteerHistory.some(history => history.eventId === eventId);
    if (alreadyMatched) {
        return res.status(400).send('Volunteer already matched to this event.');
    }

    user.volunteerHistory.push({
        eventId: event.id,
        eventName: event.name,
        eventDescription: event.description,
        location: event.location,
        requiredSkills: event.requiredSkills,
        urgency: event.urgency,
        dates: event.eventDates,
        status: 'Registered'
    });

    // Send a notification to the user
    notifications.push({
        email: user.email,
        message: `You have been matched to the event: ${event.name}`
    });

    res.status(200).send('Volunteer matched to event successfully.');
});

// Get volunteer history endpoint
app.get('/history/:email', (req, res) => {
    const { email } = req.params;
    const user = users.find(user => user.email === email);

    if (!user) {
        return res.status(404).send('User not found.');
    }

    res.status(200).json(user.volunteerHistory);
});

// Test endpoint
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
