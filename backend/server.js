const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors());

let users = [];

// Registration endpoint
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  // Check if user already exists
  const userExists = users.some(user => user.email === email);
  if (userExists) {
    return res.status(400).send('User already exists.');
  }

  // Add user to the array
  users.push({ email, password, profile: {} });
  res.status(201).send('User registered successfully.');
});

// Login endpoint
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Basic validation
  if (!email || !password) {
    return res.status(400).send('Email and password are required.');
  }

  // Check if user exists
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

// Test endpoint
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
