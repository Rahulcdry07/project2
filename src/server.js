const express = require('express');
const path = require('path');
const { sequelize, User } = require('./database');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// A simple route to get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// A simple route to create a new user
app.post('/api/users', async (req, res) => {
  try {
    const { username, email } = req.body;
    const newUser = await User.create({ username, email });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Sync the database and start the server
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
