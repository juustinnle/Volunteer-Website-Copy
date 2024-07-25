const express = require('express');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.json());

function logToFile(message) {
  fs.appendFileSync('server.log', new Date().toISOString() + ': ' + message + '\n');
}

app.get('/', (req, res) => {
  logToFile('Root route accessed');
  res.send('Hello World!');
});

app.post('/test', (req, res) => {
  logToFile('Test route accessed');
  logToFile('Request body: ' + JSON.stringify(req.body));
  res.json({ message: 'Test successful' });
});

app.listen(port, () => {
  logToFile(`Server started on port ${port}`);
  console.log(`Server running at http://localhost:${port}`);
});
