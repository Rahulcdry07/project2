#!/usr/bin/env node
/* global localStorage */

/**
 * Frontend Login Test
 * This script tests the frontend login functionality
 */

const puppeteer = require('puppeteer');
const logger = require('./src/utils/logger');

async function testLogin() {
    let browser;
    try {
        // Launch browser
        browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Enable request interception to log network requests
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            logger.debug(`Request: ${request.method()} ${request.url()}`);
            request.continue();
        });
        
        page.on('response', (response) => {
            logger.debug(`Response: ${response.status()} ${response.url()}`);
        });
        
        // Listen for console messages
        page.on('console', (msg) => {
            logger.debug('Browser Console:', msg.text());
        });
        
        // Navigate to login page
        logger.info('Navigating to login page...');
        await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
        
        // Wait for login form
        await page.waitForSelector('form');
        logger.info('Login form found');
        
        // Fill in credentials
        await page.type('input[name="email"]', 'admin@example.com');
        await page.type('input[name="password"]', 'admin123');
        
        logger.info('Credentials entered');
        
        // Submit form
        await Promise.all([
            page.waitForNavigation(),
            page.click('button[type="submit"]')
        ]);
        
        logger.info('Form submitted');
        
        // Check if we're on dashboard
        const url = page.url();
        logger.info('Current URL:', url);
        
        if (url.includes('/dashboard')) {
            logger.info('✅ Login successful - redirected to dashboard');
        } else {
            logger.warn('❌ Login failed - not on dashboard page');
        }
        
        // Check for any error messages
        const errorElement = await page.$('.alert-danger');
        if (errorElement) {
            const errorText = await page.$eval('.alert-danger', el => el.textContent);
            logger.warn('Error message:', errorText);
        }
        
        // Check if user data is stored in localStorage
        const token = await page.evaluate(() => localStorage.getItem('token'));
        const user = await page.evaluate(() => localStorage.getItem('user'));
        
        logger.info('Token stored:', !!token);
        logger.info('User data stored:', !!user);
        
        if (user) {
            const userData = JSON.parse(user);
            logger.debug('User role:', userData.role);
        }
        
    } catch (error) {
        logger.error('Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testLogin();