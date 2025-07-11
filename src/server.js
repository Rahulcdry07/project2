const express = require('express');
const path = require('path');
const { sequelize, User } = require('./database');
const crypto = require('crypto');

const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// --- Middleware for Authentication ---
// In a real app, this would be more robust (e.g., using JWTs or sessions)
const authenticate = async (req, res, next) => {
    // For now, we'll use a placeholder for the user ID
    req.userId = 1; 
    next();
};

const isAdmin = async (req, res, next) => {
    const user = await User.findByPk(req.userId);
    if (user && user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
};


// --- USER AUTHENTICATION ROUTES ---

app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({ username, email, password, verification_token: verificationToken });
    console.log(`Verification link for ${email}: http://localhost:${port}/verify-email.html?token=${verificationToken}`);
    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }
    res.json({ message: 'Login successful!', user: { id: user.id, username: user.username, email: user.email, role: user.role }, redirect: '/dashboard.html' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logout', (req, res) => {
    // In a real app with sessions, you would destroy the session here
    res.json({ message: 'Logout successful.' });
});

app.post('/api/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({ where: { verification_token: token } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token.' });
    }
    user.is_verified = true;
    user.verification_token = null;
    await user.save();
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.reset_token = resetToken;
      user.reset_token_expires_at = Date.now() + 3600000; // 1 hour
      await user.save();
      console.log(`Password reset link for ${email}: http://localhost:${port}/reset-password.html?token=${resetToken}`);
    }
    res.json({ message: 'If your email address is in our database, you will receive a password reset link.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ where: { reset_token: token, reset_token_expires_at: { [sequelize.Op.gt]: Date.now() } } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }
    user.password = password;
    user.reset_token = null;
    user.reset_token_expires_at = null;
    await user.save();
    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- USER PROFILE ROUTES ---

app.get('/api/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (user) {
            const { username, email } = req.body;
            await user.update({ username, email });
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/users', authenticate, isAdmin, async (req, res) => {
    try {
        const users = await User.findAll();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/users/:id/role', authenticate, isAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            const { role } = req.body;
            await user.update({ role });
            res.json(user);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.delete('/api/admin/users/:id', authenticate, isAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            await user.destroy();
            res.json({ message: 'User deleted successfully.' });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Sync the database and start the server
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});
