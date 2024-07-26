const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const fs = require('fs');

function logToFile(message) {
  fs.appendFileSync('server.log', message + '\n');
}

const bcrypt = require('bcrypt');
const db = require('./db');

app.post('/register', async (req, res) => {
  console.log('Registration attempt:', req.body);
  logToFile('==== REGISTRATION ROUTE ACCESSED ====');
  logToFile('Request body: ' + JSON.stringify(req.body));

  try {
    const { email, password, fullName, address, city, state, zipcode, skills, preferences, availability } = req.body;
    
    if (!email || !password) {
      console.log('Registration failed: Email or password missing');
      logToFile('Registration failed: Email or password missing');
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    console.log('Received registration request for:', email);
    logToFile('Received registration request for: ' + email);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    logToFile('Password hashed successfully');

    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      console.log('Inserting into UserCredentials');
      logToFile('Inserting into UserCredentials');
      const [credResult] = await connection.execute(
        'INSERT INTO UserCredentials (username, password_hash) VALUES (?, ?)',
        [email, hashedPassword]
      );
      const userId = credResult.insertId;
      console.log('UserCredentials inserted, userId:', userId);
      logToFile('UserCredentials inserted, userId: ' + userId);

      console.log('Inserting into UserProfile');
      logToFile('Inserting into UserProfile');
      await connection.execute(
        'INSERT INTO UserProfile (user_id, full_name, address, city, state, zipcode, skills, preferences, availability) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, fullName || null, address || null, city || null, state || null, zipcode || null, 
         skills ? JSON.stringify(skills) : null, 
         preferences ? JSON.stringify(preferences) : null, 
         availability ? JSON.stringify(availability) : null]
      );
      console.log('UserProfile inserted');
      logToFile('UserProfile inserted');

      await connection.commit();
      console.log('Transaction committed');
      logToFile('Transaction committed');
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      await connection.rollback();
      console.error('Database error:', error);
      logToFile('Database error: ' + error.message);
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'User already exists.' });
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Registration error:', error);
    logToFile('Registration error: ' + error.message);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send('Email and password are required.');
    }

    const [users] = await db.execute(
      'SELECT * FROM UserCredentials WHERE username = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).send('Invalid email or password.');
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).send('Invalid email or password.');
    }

    res.status(200).send('Login successful.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Login failed.');
  }
});

app.get('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const [users] = await db.execute(
      'SELECT UserProfile.* FROM UserProfile JOIN UserCredentials ON UserProfile.user_id = UserCredentials.user_id WHERE UserCredentials.username = ?',
      [email]
    );
    if (users.length === 0) {
      return res.status(404).send('User not found.');
    }
    res.status(200).json(users[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to retrieve profile.');
  }
});

app.put('/profile/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { fullName, address, city, state, zipcode, skills, preferences, availability } = req.body;
    const [result] = await db.execute(
      'UPDATE UserProfile JOIN UserCredentials ON UserProfile.user_id = UserCredentials.user_id SET full_name = ?, address = ?, city = ?, state = ?, zipcode = ?, skills = ?, preferences = ?, availability = ? WHERE UserCredentials.username = ?',
      [fullName, address, city, state, zipcode, JSON.stringify(skills), JSON.stringify(preferences), JSON.stringify(availability), email]
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
app.post('/events', async (req, res) => {
  try {
    const { name, description, location, requiredSkills, urgency, eventDates } = req.body;

    if (!name || !description || !location || !requiredSkills || !urgency || !eventDates) {
      return res.status(400).send('All fields are required.');
    }

    const [result] = await db.execute(
      'INSERT INTO Events (name, description, location, required_skills, urgency, event_dates) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, location, JSON.stringify(requiredSkills), urgency, JSON.stringify(eventDates)]
    );

    res.status(201).send('Event created successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to create event.');
  }
});

// Get all events endpoint
app.get('/events', async (req, res) => {
  try {
    const [events] = await db.execute('SELECT * FROM Events');
    res.status(200).json(events);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to retrieve events.');
  }
});

// Delete event endpoint
app.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute('DELETE FROM Events WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Event not found.');
    }
    res.status(200).send('Event deleted successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to delete event.');
  }
});
// Create notification endpoint
app.post('/notifications', async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).send('Email and message are required.');
    }

    await db.execute('INSERT INTO Notifications (email, message) VALUES (?, ?)', [email, message]);
    res.status(201).send('Notification created successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to create notification.');
  }
});

// Get notifications for a user endpoint
app.get('/notifications/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const [notifications] = await db.execute('SELECT * FROM Notifications WHERE email = ?', [email]);
    res.status(200).json(notifications);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to retrieve notifications.');
  }
});

// Delete notification endpoint
app.delete('/notifications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await db.execute('DELETE FROM Notifications WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Notification not found.');
    }
    res.status(200).send('Notification deleted successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to delete notification.');
  }
});

// Get all users endpoint
app.get('/users', async (req, res) => {
  try {
    const [users] = await db.execute('SELECT username FROM UserCredentials');
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to retrieve users.');
  }
});

app.get('/matching-events/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    // Get user skills and availability
    const [users] = await db.execute(
      'SELECT UserProfile.skills, UserProfile.availability FROM UserProfile JOIN UserCredentials ON UserProfile.user_id = UserCredentials.user_id WHERE UserCredentials.username = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(404).send('User not found.');
    }
    
    const user = users[0];
    const userSkills = JSON.parse(user.skills || '[]');
    const userAvailability = JSON.parse(user.availability || '[]');
    
    // Get all events
    const [events] = await db.execute('SELECT * FROM Events');
    
    // Filter matching events
    const matchingEvents = events.filter(event => {
      const eventSkills = JSON.parse(event.required_skills || '[]');
      const eventDates = JSON.parse(event.event_dates || '[]');
      
      return eventSkills.some(skill => userSkills.includes(skill)) &&
             eventDates.some(eventDate => {
               return userAvailability.some(availDate => {
                 return isDateOverlap(new Date(eventDate.start), new Date(eventDate.end), 
                                      new Date(availDate.start), new Date(availDate.end));
               });
             });
    });
    
    res.status(200).json(matchingEvents);
  } catch (error) {
    console.error('Error in /matching-events/:email:', error);
    res.status(500).send('Failed to retrieve matching events.');
  }
});

function isDateOverlap(startDate1, endDate1, startDate2, endDate2) {
  return (startDate1 <= endDate2) && (startDate2 <= endDate1);
}

app.post('/match-volunteer', async (req, res) => {
  try {
    const { email, eventId } = req.body;

    // Check if user exists
    const [users] = await db.execute('SELECT user_id FROM UserCredentials WHERE username = ?', [email]);
    if (users.length === 0) {
      return res.status(404).send('User not found.');
    }
    const userId = users[0].user_id;

    // Check if event exists
    const [events] = await db.execute('SELECT * FROM Events WHERE id = ?', [eventId]);
    if (events.length === 0) {
      return res.status(404).send('Event not found.');
    }
    const event = events[0];

    // Check if already matched
    const [matches] = await db.execute('SELECT * FROM VolunteerHistory WHERE user_id = ? AND event_id = ?', [userId, eventId]);
    if (matches.length > 0) {
      return res.status(400).send('Volunteer already matched to this event.');
    }

    // Create match
    await db.execute(
      'INSERT INTO VolunteerHistory (user_id, event_id, event_name, event_description, location, required_skills, urgency, dates, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [userId, eventId, event.name, event.description, event.location, event.required_skills, event.urgency, event.event_dates, 'Registered']
    );

    // Create notification
    await db.execute('INSERT INTO Notifications (email, message) VALUES (?, ?)', [email, `You have been matched to the event: ${event.name}`]);

    res.status(200).send('Volunteer matched to event successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to match volunteer to event.');
  }
});

app.get('/history/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const [history] = await db.execute(
      'SELECT VolunteerHistory.* FROM VolunteerHistory JOIN UserCredentials ON VolunteerHistory.user_id = UserCredentials.user_id WHERE UserCredentials.username = ?',
      [email]
    );
    res.status(200).json(history);
  } catch (error) {
    console.error(error);
    res.status(500).send('Failed to retrieve volunteer history.');
  }
});

// Test endpoint
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
