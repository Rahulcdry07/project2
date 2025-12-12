import { describe, it, expect } from 'vitest';
import { 
  HTTP_STATUS, 
  formatErrorMessage, 
  formatDate, 
  isValidEmail,
  validatePassword
} from '../helpers';

describe('helpers utility', () => {
  describe('HTTP_STATUS', () => {
    it('should have correct status codes', () => {
      expect(HTTP_STATUS.OK).toBe(200);
      expect(HTTP_STATUS.CREATED).toBe(201);
      expect(HTTP_STATUS.BAD_REQUEST).toBe(400);
      expect(HTTP_STATUS.UNAUTHORIZED).toBe(401);
      expect(HTTP_STATUS.NOT_FOUND).toBe(404);
      expect(HTTP_STATUS.INTERNAL_SERVER_ERROR).toBe(500);
    });
  });

  describe('formatErrorMessage', () => {
    it('should format string error', () => {
      expect(formatErrorMessage('Error occurred')).toBe('Error occurred');
    });

    it('should format Error object', () => {
      const error = new Error('Test error');
      expect(formatErrorMessage(error)).toBe('Test error');
    });

    it('should format object with message property', () => {
      expect(formatErrorMessage({ message: 'Custom message' })).toBe('Custom message');
    });

    it('should return default message for null/undefined', () => {
      expect(formatErrorMessage(null)).toBe('An unknown error occurred');
      expect(formatErrorMessage(undefined)).toBe('An unknown error occurred');
    });
  });

  describe('formatDate', () => {
    it('should format valid date string', () => {
      const date = '2023-12-07T10:30:00Z';
      const formatted = formatDate(date);
      expect(formatted).toContain('2023');
      expect(formatted).toBeTruthy();
    });

    it('should format Date object', () => {
      const date = new Date('2023-12-07');
      const formatted = formatDate(date);
      expect(formatted).toContain('2023');
      expect(formatted).toBeTruthy();
    });

    it('should return empty string for null/undefined', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('user@subdomain.example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('Password123').isValid).toBe(true);
      expect(validatePassword('MyP@ssw0rd').isValid).toBe(true);
      expect(validatePassword('Abcdefg1').isValid).toBe(true);
    });

    it('should reject passwords shorter than 8 characters', () => {
      expect(validatePassword('Pass12').isValid).toBe(false);
      expect(validatePassword('1234567').isValid).toBe(false);
      expect(validatePassword('').isValid).toBe(false);
    });

    it('should reject passwords without required character types', () => {
      expect(validatePassword('alllowercase').isValid).toBe(false);
      expect(validatePassword('ALLUPPERCASE').isValid).toBe(false);
      expect(validatePassword('NoNumbers').isValid).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(validatePassword(null).isValid).toBe(false);
      expect(validatePassword(undefined).isValid).toBe(false);
    });

    it('should return appropriate error messages', () => {
      expect(validatePassword('short').message).toContain('8 characters');
      expect(validatePassword('nonumbers').message).toContain('uppercase');
    });
  });
});
