const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const logger = require('../utils/logger');

/**
 * Configure and apply security middleware to the Express app
 * @param {Object} app - Express application instance
 * @param {Object} options - Configuration options
 */
const configureSecurityMiddleware = (app, options = {}) => {
  // Check if we're in test or development mode
  const isTestMode = process.env.NODE_ENV === 'test' || process.env.CYPRESS_TESTING === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';

  const {
    rateLimitMax = isTestMode ? 10000 : isDevelopment ? 1000 : 100, // Higher limits for dev/test
    rateLimitWindowMs = isTestMode
      ? 15 * 60 * 1000
      : isDevelopment
        ? 1 * 60 * 1000
        : 60 * 60 * 1000, // 1 min for dev, 15 min for test, 1 hour for prod
    corsOrigins = ['http://localhost:3000', 'http://0.0.0.0:3000', 'http://localhost:3001'],
    trustProxy = true,
  } = options;

  // Set trust proxy if needed
  if (trustProxy) {
    app.set('trust proxy', 1);
  }

  // Set security HTTP headers
  app.use(helmet());

  // Parse cookies
  app.use(cookieParser());

  // Rate limiting
  const limiter = rateLimit({
    max: rateLimitMax,
    windowMs: rateLimitWindowMs,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: req => {
      // Skip rate limiting for test routes in test/dev mode
      return (isTestMode || isDevelopment) && req.path.startsWith('/api/test');
    },
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, Path: ${req.path}`);
      res.status(options.statusCode).json({
        status: 'error',
        message: options.message,
      });
    },
  });

  // Apply rate limiting to API routes
  app.use('/api', limiter);

  // CORS configuration
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Data sanitization against XSS
  app.use(xss());

  // Prevent parameter pollution
  app.use(hpp());

  // Content Security Policy
  if (process.env.NODE_ENV === 'production') {
    app.use(
      helmet.contentSecurityPolicy({
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https://via.placeholder.com'],
          connectSrc: ["'self'", 'https://api.example.com'],
        },
      })
    );
  }

  logger.info('Security middleware configured');
};

module.exports = configureSecurityMiddleware;
