/* eslint-disable no-console */
/**
 * Lightweight logger for the dashboard app.
 * Consolidates console access so eslint no-console can remain enabled elsewhere.
 */
const isProduction = process.env.NODE_ENV === 'production';

const log = (level, ...args) => {
  if (level === 'debug' && isProduction) {
    return;
  }

  const method = typeof console[level] === 'function' ? level : 'log';
  console[method](...args);
};

export const logInfo = (...args) => log('info', ...args);
export const logWarn = (...args) => log('warn', ...args);
export const logError = (...args) => log('error', ...args);
export const logDebug = (...args) => log('debug', ...args);
