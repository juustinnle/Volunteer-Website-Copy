require('dotenv').config(); // Add this line at the top and create a .env file for environment variables
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cors());

// Logging function
const fs = require('fs');
function logToFile(message) {
  fs.appendFileSync('server.log', new Date().toISOString() + ': ' + message + '\n');
}

// Registration endpoint
app.post('/register', async (req, res) => {
  logToFile('Registration route accessed');
  try {
    const { email, password, fullName, address, city, state, zipcode, skills, preferences, availability } = req.body;
    
    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      const [credResult] = await connection.execute(
        'INSERT INTO UserCredentials (username, password_hash) VALUES (?, ?)',
        [email, hashedPassword]
      );
      const userId = credResult.insertId;

      await connection.execute(
        'INSERT INTO UserProfile (user_id, full_name, address, city, state, zipcode, skills, preferences, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, fullName, address, city, state, zipcode, JSON.stringify(skills), JSON.stringify(preferences), JSON.stringify(availability)]
      );

      await connection.commit();
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logToFile('Registration error: ' + error.message);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const [users] = await db.execute(
      'SELECT * FROM UserCredentials WHERE username = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed.', details: error.message });
  }
});

// Get user profile endpoint
app.get('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const [users] = await db.execute(
      'SELECT UserProfile.* FROM UserProfile JOIN UserCredentials ON UserProfile.user_id = UserCredentials.user_id WHERE UserCredentials.username = ?',
      [email]
    );
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to retrieve profile.', details: error.message });
  }
});

// Update user profile endpoint
app.put('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { fullName, address, city, state, zipcode, skills, preferences, availability } = req.body;
    const [result] = await db.execute(
      'UPDATE UserProfile JOIN UserCredentials ON UserProfile.user_id = UserCredentials.user_id SET full_name = ?, address = ?, city = ?, state = ?, zipcode = ?, skills = ?, preferences = ?, availability = ? WHERE UserCredentials.username = ?',
      [fullName, address, city, state, zipcode, JSON.stringify(skills), JSON.stringify(preferences), JSON.stringify(availability), email]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile.', details: error.message });
  }
});

// can implement similar database integration for events, notifications, and volunteer history here

// Test endpoint
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
