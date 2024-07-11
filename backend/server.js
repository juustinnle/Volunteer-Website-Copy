const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

let users = [];
let events = [];
let notifications = [];

// Registration endpoint
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  const userExists = users.some(user => user.email === email);
  if (userExists) {
    return res.status(400).send('User already exists.');
  }

  users.push({ email, password, profile: {} });
  res.status(201).send('User registered successfully.');
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  const user = users.find(user => user.email === email && user.password === password);
  if (!user) {
    return res.status(401).send('Invalid email or password.');
  }

  res.status(200).send('Login successful.');
});

// Get user profile endpoint
app.get('/profile/:email', (req, res) => {
  const { email } = req.params;
  const user = users.find(user => user.email === email);
  if (!user) {
    return res.status(404).send('User not found.');
  }
  res.status(200).json(user.profile);
});

// Update user profile endpoint
app.put('/profile/:email', (req, res) => {
  const { email } = req.params;
  const { profile } = req.body;
  const userIndex = users.findIndex(user => user.email === email);
  if (userIndex === -1) {
    return res.status(404).send('User not found.');
  }
  users[userIndex].profile = profile;
  res.status(200).send('Profile updated successfully.');
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

// Test endpoint
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
