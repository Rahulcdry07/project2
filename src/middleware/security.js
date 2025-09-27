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
  // Check if we're in test mode
  const isTestMode = process.env.NODE_ENV === 'test' || process.env.CYPRESS_TESTING === 'true';
  
  const {
    rateLimitMax = isTestMode ? 1000 : 100, // Higher limit for tests
    rateLimitWindowMs = isTestMode ? 1 * 60 * 1000 : 60 * 60 * 1000, // 1 minute for tests, 1 hour for production
    corsOrigins = ['http://localhost:3000', 'http://0.0.0.0:3000', 'http://localhost:3001'],
    trustProxy = true,
  } = options;
  
  // Set trust proxy if needed
  if (trustProxy) {
    app.set('trust proxy', 1);
  }

  // Set security HTTP headers with CSP configuration
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://via.placeholder.com", "https:"],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
  }));

  // Parse cookies
  app.use(cookieParser());

  // Rate limiting - conditionally disabled in test mode
  // Enable rate limiting if: not in test mode OR testing security specifically OR custom config provided
  const enableRateLimit = !isTestMode || process.env.TESTING_SECURITY === 'true' || options.rateLimitMax || options.rateLimitWindowMs;
  
  if (enableRateLimit) {
    const limiter = rateLimit({
      max: rateLimitMax,
      windowMs: rateLimitWindowMs,
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        res.status(options.statusCode).json({
          status: 'error',
          message: options.message,
        });
      }
    });

    // Apply rate limiting to API routes
    app.use('/api', limiter);
  }

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

  logger.info('Security middleware configured');
};

module.exports = configureSecurityMiddleware;