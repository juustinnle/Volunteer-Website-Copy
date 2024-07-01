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
  users.push({ email, password });
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

// Test endpoint
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
