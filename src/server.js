require('dotenv-safe').config();

const express = require('express');
const path = require('path');
const { sequelize, User } = require('./database.js');
const { Op } = require('sequelize');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const multer = require('multer');
const fs = require('fs');
const EmailService = require('./emailService.js');
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';

// Validate required environment variables
if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is required');
  process.exit(1);
}

// Configure Winston Logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'registration-app' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ],
});

// Initialize email service
const emailService = new EmailService();

const app = express();
const port = 3000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: true,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'sha256-zf5zznCP84LWPpFCLHtqpfgyiKwsm8jd5n55T+lHNR4='"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({ origin: 'http://localhost:3000' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../public/dashboard-app/build')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Input validation middleware
const validateRegistration = [
  body('username')
    .isLength({ min: 3, max: 30 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters long and contain only letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validatePasswordReset = [
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const validateChangePassword = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Old password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
];

const validateProfileUpdate = [
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('location')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Location must be less than 100 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Please provide a valid website URL'),
  body('github_url')
    .optional()
    .isURL()
    .withMessage('Please provide a valid GitHub URL'),
  body('linkedin_url')
    .optional()
    .isURL()
    .withMessage('Please provide a valid LinkedIn URL'),
  body('twitter_url')
    .optional()
    .isURL()
    .withMessage('Please provide a valid Twitter URL'),
  body('profile_privacy')
    .optional()
    .isIn(['public', 'private', 'friends'])
    .withMessage('Profile privacy must be public, private, or friends')
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

// Helper function to calculate profile completion percentage
const calculateProfileCompletion = (user) => {
  const fields = [
    'username', 'email', 'bio', 'location', 'website', 
    'github_url', 'linkedin_url', 'twitter_url', 'profile_picture'
  ];
  
  let completedFields = 0;
  fields.forEach(field => {
    if (user[field] && user[field].toString().trim() !== '') {
      completedFields++;
    }
  });
  
  return Math.round((completedFields / fields.length) * 100);
};

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

app.post('/api/test/get-verification-token', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (user && user.verification_token) {
            res.status(200).json({ verificationToken: user.verification_token });
        } else {
            res.status(404).json({ error: 'User or verification token not found.' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/test/get-refresh-token', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });
        if (user && user.refresh_token) {
            res.status(200).json({ refreshToken: user.refresh_token });
        } else {
            res.status(404).json({ error: 'User or refresh token not found.' });
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

// --- Rate Limiting Middleware ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req, res) => {
    // Skip rate limiting for test environments
    return process.env.NODE_ENV === 'test';
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for tests)
  message: {
    error: 'Too many requests from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req, res) => {
    // Skip rate limiting for test environments
    return process.env.NODE_ENV === 'test';
  }
});

// Apply rate limiting (skip for test environment or if DISABLE_RATE_LIMITER is set)
if (!process.env.DISABLE_RATE_LIMITER && process.env.NODE_ENV !== 'test') {
  app.use('/api/', generalLimiter);
  app.use('/api/register', authLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api/forgot-password', authLimiter);
}

// --- Middleware for Authentication ---
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided.' });

    const token = authHeader.split(' ')[1];
    try {
        const decoded = await new Promise((resolve, reject) => {
            jwt.verify(token, JWT_SECRET, (err, decoded) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(decoded);
                }
            });
        });
        req.userId = decoded.userId;
        req.userRole = decoded.role; // Attach user role to request
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired.' });
        }
        return res.status(401).json({ error: 'Invalid token.' });
    }
}

const isAdmin = async (req, res, next) => {
    
    if (req.userRole === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
};

// --- USER AUTHENTICATION ROUTES ---

// Register a new user
app.post('/api/register', validateRegistration, handleValidationErrors, async (req, res) => {
  
  try {
    const { username, email, password } = req.body;

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

    let user;
    try {
      user = await User.create({
        username,
        email,
        password: hashedPassword,
        verification_token: verificationToken,
      });
    } catch (createError) {
      // Handle Sequelize validation errors
      if (createError.name === 'SequelizeValidationError') {
        const validationErrors = createError.errors.map(err => err.message);
        return res.status(400).json({ error: validationErrors[0] });
      }
      throw createError;
    }

    const verificationLink = `http://localhost:${port}/verify-email.html?token=${verificationToken}`;
    
    try {
        // Send welcome email with verification link
        await emailService.sendWelcomeEmail(user, verificationLink);
        
        // Send admin notification if there are admin users
        const adminUsers = await User.findAll({ where: { role: 'admin' } });
        for (const admin of adminUsers) {
            await emailService.sendAdminNewUserEmail(admin, user);
        }
        
    } catch (emailError) {
        logger.error('Error sending welcome email', { error: emailError.message, email });
        // Continue with registration even if email sending fails
    }

    
    res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
  } catch (error) {
    logger.error('Error during registration', { error: error.message, stack: error.stack });
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', validateLogin, handleValidationErrors, async (req, res) => {
  const { email } = req.body;
  
  try {
    const { password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    // Create access token (short-lived)
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    
    // Create refresh token (long-lived)
    const refreshToken = crypto.randomBytes(64).toString('hex');
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Update login statistics
    user.refresh_token = refreshToken;
    user.refresh_token_expires_at = refreshTokenExpiry;
    user.last_login = new Date();
    user.login_count = (user.login_count || 0) + 1;
    await user.save();

    
    res.json({ 
      message: 'Login successful!', 
      token: accessToken, 
      refreshToken,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }, 
      redirect: '/dashboard' 
    });
  } catch (error) {
    logger.error('Login error', { email, error: error.message, stack: error.stack, ip: req.ip });
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token is required.' });
        }

        // Find user by refresh token
        const user = await User.findOne({ 
            where: { 
                refresh_token: refreshToken,
                refresh_token_expires_at: { [Op.gt]: new Date() }
            } 
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid or expired refresh token.' });
        }

        // Generate new access token
        const newAccessToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });

        res.json({ 
            message: 'Token refreshed successfully.',
            token: newAccessToken
        });
    } catch (error) {
        logger.error('Refresh token error', { error: error.message, stack: error.stack, ip: req.ip });
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/logout', authenticate, async (req, res) => {
    try {
        // Invalidate refresh token
        const user = await User.findByPk(req.userId);
        if (user) {
            user.refresh_token = null;
            user.refresh_token_expires_at = null;
            await user.save();
        }
        
        res.json({ message: 'Logout successful.' });
    } catch (error) {
        logger.error('Logout error', { userId: req.userId, error: error.message, stack: error.stack, ip: req.ip });
        res.status(500).json({ error: error.message });
    }
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
    
    // Send verification success email
    try {
      await emailService.sendVerificationSuccessEmail(user);
    } catch (emailError) {
      logger.error('Error sending verification success email', { error: emailError.message, userId: user.id });
    }
    
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/forgot-password', validateForgotPassword, handleValidationErrors, async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await User.findOne({ where: { email } });
    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.reset_token = resetToken;
      user.reset_token_expires_at = new Date(Date.now() + 3600000); // 1 hour from now
      await user.save();
      const resetLink = `http://localhost:${port}/reset-password.html?token=${resetToken}`;
      try {
          await emailService.sendPasswordResetEmail(user, resetLink);
      } catch (emailError) {
          logger.error('Error sending password reset email', { email, error: emailError.message, stack: emailError.stack });
          // Continue with the flow even if email sending fails
      }
    }
    
    res.json({ message: 'If your email address is in our database, you will receive a password reset link.' });
  } catch (error) {
    logger.error('Forgot password error', { email, error: error.message, stack: error.stack, ip: req.ip });
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reset-password', validatePasswordReset, handleValidationErrors, async (req, res) => {
  const { token, password } = req.body;
  
  try {
    const user = await User.findOne({ where: { reset_token: token, reset_token_expires_at: { [Op.gt]: new Date() } } });
    if (!user) {
      
      return res.status(400).json({ error: 'Invalid or expired password reset token.' });
    }
    user.password = await bcrypt.hash(password, 10);
    user.reset_token = null;
    user.reset_token_expires_at = null;
    await user.save();
    
    res.json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    logger.error('Password reset error', { error: error.message, stack: error.stack, ip: req.ip });
    res.status(500).json({ error: error.message });
  }
});

// --- USER PROFILE ROUTES ---

app.get('/api/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (user) {
            // Remove sensitive fields and include enhanced profile data
            const { 
                id, username, email, role, is_verified, 
                bio, location, website, github_url, linkedin_url, twitter_url,
                profile_picture, profile_privacy, last_login, login_count, profile_completion
            } = user;
            
            res.json({ 
                id, username, email, role, is_verified,
                bio, location, website, github_url, linkedin_url, twitter_url,
                profile_picture, profile_privacy, last_login, login_count, profile_completion
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        logger.error('Error fetching profile', { userId: req.userId, error: error.message, stack: error.stack, ip: req.ip });
        res.status(500).json({ error: error.message });
    }
});

// Profile picture upload endpoint
app.post('/api/profile/picture', authenticate, upload.single('profile_picture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete old profile picture if it exists
        if (user.profile_picture) {
            const oldPicturePath = path.join(uploadsDir, path.basename(user.profile_picture));
            if (fs.existsSync(oldPicturePath)) {
                fs.unlinkSync(oldPicturePath);
            }
        }

        // Update user with new profile picture URL
        const pictureUrl = `/uploads/${req.file.filename}`;
        await user.update({ profile_picture: pictureUrl });

        // Recalculate profile completion
        const completion = calculateProfileCompletion(user);
        await user.update({ profile_completion: completion });

        // Send profile picture update notification
        try {
          await emailService.sendProfilePictureUpdatedEmail(user);
        } catch (emailError) {
          logger.error('Error sending profile picture update email', { error: emailError.message, userId: req.userId });
        }

        res.json({ 
            message: 'Profile picture updated successfully!',
            profile_picture: pictureUrl,
            profile_completion: completion
        });
    } catch (error) {
        logger.error('Error uploading profile picture', { userId: req.userId, error: error.message, stack: error.stack, ip: req.ip });
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/profile', authenticate, validateProfileUpdate, handleValidationErrors, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (user) {
            const { 
                username, email, bio, location, website, 
                github_url, linkedin_url, twitter_url, profile_privacy 
            } = req.body;
            
            // Update basic fields
            await user.update({ 
                username, email, bio, location, website,
                github_url, linkedin_url, twitter_url, profile_privacy
            });
            
            // Calculate and update profile completion
            const completion = calculateProfileCompletion(user);
            await user.update({ profile_completion: completion });
            
            const { 
                id, username: uname, email: uemail, role, is_verified,
                bio: userBio, location: userLocation, website: userWebsite,
                github_url: userGithub, linkedin_url: userLinkedin, twitter_url: userTwitter,
                profile_picture, profile_privacy: userPrivacy, last_login, login_count, profile_completion
            } = user;
            
            // Send profile update notification
            try {
              const changes = {
                username: uname,
                email: uemail,
                bio: userBio,
                location: userLocation,
                website: userWebsite,
                github_url: userGithub,
                linkedin_url: userLinkedin,
                twitter_url: userTwitter,
                profile_privacy: userPrivacy,
                profile_completion
              };
              await emailService.sendProfileUpdatedEmail(user, changes);
            } catch (emailError) {
              logger.error('Error sending profile update email', { error: emailError.message, userId: req.userId });
            }

            res.json({ 
                message: 'Profile updated successfully!',
                id, 
                username: uname, 
                email: uemail, 
                role, 
                is_verified,
                bio: userBio,
                location: userLocation,
                website: userWebsite,
                github_url: userGithub,
                linkedin_url: userLinkedin,
                twitter_url: userTwitter,
                profile_picture,
                profile_privacy: userPrivacy,
                last_login,
                login_count,
                profile_completion
            });
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        logger.error('Error updating profile', { userId: req.userId, error: error.message, stack: error.stack, ip: req.ip, payload: req.body });
        res.status(400).json({ error: error.message });
    }
});

// Public profile endpoint
app.get('/api/profile/:username', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ where: { username } });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check privacy settings
        if (user.profile_privacy === 'private') {
            return res.status(403).json({ error: 'This profile is private' });
        }

        // Return public profile data
        const { 
            id, username: uname, bio, location, website,
            github_url, linkedin_url, twitter_url, profile_picture,
            profile_privacy, last_login, login_count, profile_completion
        } = user;

        res.json({
            id, username: uname, bio, location, website,
            github_url, linkedin_url, twitter_url, profile_picture,
            profile_privacy, last_login, login_count, profile_completion
        });
    } catch (error) {
        logger.error('Error fetching public profile', { username: req.params.username, error: error.message, stack: error.stack, ip: req.ip });
        res.status(500).json({ error: error.message });
    }
});


app.post('/api/profile/upload-picture', authenticate, upload.single('profile_picture'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Delete old profile picture if it exists
        if (user.profile_picture) {
            const oldPicturePath = path.join(uploadsDir, path.basename(user.profile_picture));
            if (fs.existsSync(oldPicturePath)) {
                fs.unlinkSync(oldPicturePath);
            }
        }

        // Update user with new profile picture URL
        const pictureUrl = `/uploads/${req.file.filename}`;
        await user.update({ profile_picture: pictureUrl });

        // Recalculate profile completion
        const completion = calculateProfileCompletion(user);
        await user.update({ profile_completion: completion });

        res.json({ 
            message: 'Profile picture uploaded successfully!',
            profile_picture: pictureUrl,
            profile_completion: completion
        });
    } catch (error) {
        logger.error('Error uploading profile picture', { userId: req.userId, error: error.message, stack: error.stack, ip: req.ip });
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/change-password', authenticate, validateChangePassword, handleValidationErrors, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findByPk(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid old password.' });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({ error: 'New password must be different from old password.' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        // Send password changed notification
        try {
          await emailService.sendPasswordChangedEmail(user, req.ip);
        } catch (emailError) {
          logger.error('Error sending password changed email', { error: emailError.message, userId: req.userId });
        }

        res.json({ message: 'Password changed successfully.' });
    } catch (error) {
        logger.error('Error changing password', { userId: req.userId, error: error.message, stack: error.stack, ip: req.ip });
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/users', authenticate, isAdmin, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'is_verified'],
            order: [['id', 'ASC']]
        });
        res.json(users);
    } catch (error) {
        logger.error('Admin: Error fetching users', { adminId: req.userId, error: error.message, stack: error.stack, ip: req.ip });
        res.status(500).json({ error: error.message });
    }
});

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
        logger.error('Admin: Error updating user role', { adminId: req.userId, targetUserId: req.params.id, error: error.message, stack: error.stack, ip: req.ip });
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/admin/users', authenticate, isAdmin, async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'username', 'email', 'role', 'is_verified'],
            order: [['id', 'ASC']]
        });
        res.json(users);
    } catch (error) {
        logger.error('Admin: Error fetching users', { adminId: req.userId, error: error.message, stack: error.stack, ip: req.ip });
        res.status(500).json({ error: error.message });
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
        logger.error('Admin: Error deleting user', { adminId: req.userId, targetUserId: req.params.id, error: error.message, stack: error.stack, ip: req.ip });
        res.status(500).json({ error: error.message });
    }
});

// Email service endpoints
app.post('/api/email/test', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const result = await emailService.testEmailService();
        
        if (result.success) {
            res.json({ message: 'Test email sent successfully!', result });
        } else {
            res.status(500).json({ error: 'Failed to send test email', result });
        }
    } catch (error) {
        logger.error('Email test error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/email/stats', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const stats = await emailService.getEmailStats();
        res.json(stats);
    } catch (error) {
        logger.error('Email stats error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: error.message });
    }
});

// Send weekly summary to all users (admin only)
app.post('/api/email/weekly-summary', authenticate, async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const users = await User.findAll({ where: { is_verified: true } });
        const results = [];

        for (const user of users) {
            try {
                const stats = {
                    logins: user.login_count || 0,
                    profileViews: 0, // Would be tracked in a real app
                    profileCompletion: user.profile_completion || 0,
                    lastLogin: user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'
                };

                await emailService.sendWeeklySummaryEmail(user, stats);
                results.push({ email: user.email, success: true });
            } catch (error) {
                results.push({ email: user.email, success: false, error: error.message });
            }
        }

        res.json({ 
            message: `Weekly summary sent to ${users.length} users`,
            results 
        });
    } catch (error) {
        logger.error('Weekly summary error', { error: error.message, userId: req.userId });
        res.status(500).json({ error: error.message });
    }
});

// Serve React app for all other routes (moved to end)
app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/dashboard-app/build', 'index.html'));
});

// Sync the database and start the server
sequelize.sync().then(() => {
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  });
});

module.exports = app;

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled application error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    body: req.body, // Log request body for context, but be mindful of sensitive data
    params: req.params,
    query: req.query,
  });

  // Send a generic error response to the client
  res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
});
