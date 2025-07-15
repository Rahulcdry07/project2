const express = require('express');
const path = require('path');
const { sequelize, User } = require('./database');
const { Op } = require('sequelize');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const JWT_SECRET = 'a-string-secret-at-least-256-bits-long';

// Nodemailer transporter setup
// IMPORTANT: Replace YOUR_MAILTRAP_USERNAME and YOUR_MAILTRAP_PASSWORD with your actual Mailtrap credentials.
// These are placeholders and will not work for sending real emails.
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "YOUR_MAILTRAP_USERNAME",
        pass: "YOUR_MAILTRAP_PASSWORD"
    }
});

const app = express();
const port = 3000;

app.use(cors({ origin: 'http://localhost:3000' }));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public/dashboard-app/build')));

// Serve React app for all other routes
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard-app/build', 'index.html'));
});

// --- FOR TESTING PURPOSES ONLY ---
// This route allows tests to programmatically verify a user
app.post('/api/test/verify-user', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (user) {
            user.is_verified = true;
            await user.save();
            res.status(200).json({ message: 'User verified successfully.' });
        } else {
            res.status(404).json({ error: 'User not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// This route allows tests to programmatically set a user's role
app.post('/api/test/set-user-role', async (req, res) => {
    try {
        const { email, role } = req.body;
        const user = await User.findOne({ where: { email } });
        if (user) {
            user.role = role;
            await user.save();
            res.status(200).json({ message: `User role set to ${role} successfully.` });
        } else {
            res.status(404).json({ error: 'User not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/test/get-reset-token', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (user && user.reset_token) {
            res.status(200).json({ resetToken: user.reset_token });
        } else {
            res.status(404).json({ error: 'User or reset token not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/test/clear-database', async (req, res) => {
    try {
        await User.destroy({ where: {}, truncate: true });
        res.status(200).json({ message: 'Database cleared successfully.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Middleware for Authentication ---
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided.' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired.' });
            }
            return res.status(401).json({ error: 'Invalid token.' });
        }
        req.userId = decoded.userId;
        req.userRole = decoded.role; // Attach user role to request
        next();
    });
}

const isAdmin = async (req, res, next) => {
    console.log('isAdmin middleware: req.userRole =', req.userRole);
    if (req.userRole === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
};

// --- USER AUTHENTICATION ROUTES ---

// Register a new user
app.post('/api/register', async (req, res) => {
  console.log('Received registration request with body:', req.body);
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        console.log('Validation failed: Missing fields');
        return res.status(400).json({ error: 'Please fill in all fields.' });
    }

    if (password.length < 6) {
        console.log('Validation failed: Password too short');
        return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({ where: { [Op.or]: [{ username }, { email }] } });
    if (existingUser) {
        if (existingUser.username === username) {
            return res.status(400).json({ error: 'Username already exists.' });
        }
        if (existingUser.email === email) {
            return res.status(400).json({ error: 'Email already exists.' });
        }
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      verification_token: verificationToken,
    });

    const verificationLink = `http://localhost:${port}/verify-email.html?token=${verificationToken}`;
    
    try {
        await transporter.sendMail({
            from: 'no-reply@yourdomain.com',
            to: email,
            subject: 'Verify Your Email',
            html: `<p>Please verify your email by clicking on this link: <a href="${verificationLink}">${verificationLink}</a></p>`,
        });
    } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Continue with registration even if email sending fails
    }

    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password.' });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: 'Invalid email or password.' });
    if (!user.is_verified) return res.status(403).json({ error: 'Please verify your email before logging in.' });

    // Create JWT
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30m' });

    res.json({ message: 'Login successful!', token, user: { id: user.id, username: user.username, email: user.email, role: user.role }, redirect: '/dashboard.html' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/logout', (req, res) => {
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
      user.reset_token_expires_at = new Date(Date.now() + 3600000); // 1 hour from now
      await user.save();
      const resetLink = `http://localhost:${port}/reset-password.html?token=${resetToken}`;
      try {
          await transporter.sendMail({
              from: 'no-reply@yourdomain.com',
              to: email,
              subject: 'Password Reset Request',
              html: `<p>You requested a password reset. Please click this link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
          });
      } catch (emailError) {
          console.error('Error sending password reset email:', emailError);
          // Continue with the flow even if email sending fails
      }
    }
    res.json({ message: 'If your email address is in our database, you will receive a password reset link.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ where: { reset_token: token, reset_token_expires_at: { [Op.gt]: new Date() } } });
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    user.password = await bcrypt.hash(password, 10);
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
            // Remove sensitive fields
            const { id, username, email, role, is_verified } = user;
            res.json({ id, username, email, role, is_verified });
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
            const { id, username: uname, email: uemail, role, is_verified } = user;
            res.json({ id, username: uname, email: uemail, role, is_verified });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// --- ADMIN ROUTES ---

// Get all users
app.get('/api/admin/users', authenticate, isAdmin, async (req, res) => {
    try {
        const users = await User.findAll({
          attributes: { exclude: ['password', 'verification_token', 'reset_token', 'reset_token_expires_at'] }
        });
        console.log('Server sending users:', users);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a user's role
app.put('/api/admin/users/:id/role', authenticate, isAdmin, async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (user) {
            const { role } = req.body;
            await user.update({ role });
            const { id, username, email, role: userRole, is_verified } = user;
            res.json({ id, username, email, role: userRole, is_verified });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete a user
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

module.exports = app;