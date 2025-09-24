/**
 * Logger configuration
 */
const winston = require('winston');
const path = require('path');
const { NODE_ENV } = require('../config/env');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    ({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${
        Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
      }`;
    }
  )
);

// Define log directory
const logDir = path.join(__dirname, '../../logs');

// Create Winston logger
const logger = winston.createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'dynamic-web-app' },
  transports: [
    // Write logs to file in production
    ...(NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
          new winston.transports.File({
            filename: path.join(logDir, 'combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
    // Console logging for all environments
    new winston.transports.Console({
      format: consoleFormat,
    }),
  ],
  // Handle uncaught exceptions and unhandled rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat,
    }),
    ...(NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: path.join(logDir, 'exceptions.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
          }),
        ]
      : []),
  ],
  exitOnError: false,
});

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;