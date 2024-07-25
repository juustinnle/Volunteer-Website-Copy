const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'Ftm5096!',
  database: 'volunteer_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

let events = [];
let notifications = [];

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).send('Username and password are required.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.execute(
        'INSERT INTO UserCredentials (username, password_hash) VALUES (?, ?)',
        [username, hashedPassword]
      );
      const userId = result.insertId;

      await connection.execute(
        'INSERT INTO UserProfile (user_id) VALUES (?)',
        [userId]
      );

      await connection.commit();
      res.status(201).send('User registered successfully.');
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).send('User already exists.');
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Registration failed.');
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

// Get user profile endpoint
app.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const [profiles] = await pool.execute(
      'SELECT UserProfile.* FROM UserProfile JOIN UserCredentials ON UserProfile.user_id = UserCredentials.user_id WHERE UserCredentials.username = ?',
      [username]
    );
    if (profiles.length === 0) {
      return res.status(404).send('User not found.');
    }
    res.status(200).json(profiles[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to retrieve profile.');
  }
});

// Update user profile endpoint
app.put('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { fullName, address, city, state, zipcode, skills, preferences, availability } = req.body;
    const [result] = await pool.execute(
      'UPDATE UserProfile JOIN UserCredentials ON UserProfile.user_id = UserCredentials.user_id SET full_name = ?, address = ?, city = ?, state = ?, zipcode = ?, skills = ?, preferences = ?, availability = ? WHERE UserCredentials.username = ?',
      [fullName, address, city, state, zipcode, JSON.stringify(skills), JSON.stringify(preferences), JSON.stringify(availability), username]
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

  // Add notifications for all users (assuming users array is defined and populated)
  users.forEach(user => {
    notifications.push({
      email: user.username,
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
  const { username, message } = req.body;

  if (!username || !message) {
    return res.status(400).send('Username and message are required.');
  }

  notifications.push({ username, message });
  res.status(201).send('Notification created successfully.');
});

// Get notifications for a user endpoint
app.get('/notifications/:username', (req, res) => {
  const { username } = req.params;
  const userNotifications = notifications.filter(notification => notification.username === username);
  res.status(200).json(userNotifications);
});

// Get all users endpoint
app.get('/users', (req, res) => {
  res.status(200).json(users);
});

// Delete notification endpoint
app.delete('/notifications/:username/:message', (req, res) => {
  const { username, message } = req.params;
  const notificationIndex = notifications.findIndex(notification => notification.username === username && notification.message === message);

  if (notificationIndex === -1) {
      return res.status(404).send('Notification not found.');
  }

  notifications.splice(notificationIndex, 1);
  res.status(200).send('Notification deleted successfully.');
});

app.get('/matching-events/:username', (req, res) => {
  const { username } = req.params;
  const user = users.find(user => user.username === username);
  
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
  const { username, eventId } = req.body;

  const user = users.find(user => user.username === username);
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
    username: user.username,
    message: `You have been matched to the event: ${event.name}`
  });

  res.status(200).send('Volunteer matched to event successfully.');
});

// Get volunteer history endpoint
app.get('/history/:username', (req, res) => {
  const { username } = req.params;
  const user = users.find(user => user.username === username);

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
