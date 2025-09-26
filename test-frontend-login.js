#!/usr/bin/env node

/**
 * Frontend Login Test
 * This script tests the frontend login functionality
 */

const puppeteer = require('puppeteer');

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
            console.log(`Request: ${request.method()} ${request.url()}`);
            request.continue();
        });
        
        page.on('response', (response) => {
            console.log(`Response: ${response.status()} ${response.url()}`);
        });
        
        // Listen for console messages
        page.on('console', (msg) => {
            console.log('Browser Console:', msg.text());
        });
        
        // Navigate to login page
        console.log('Navigating to login page...');
        await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle0' });
        
        // Wait for login form
        await page.waitForSelector('form');
        console.log('Login form found');
        
        // Fill in credentials
        await page.type('input[name="email"]', 'admin@example.com');
        await page.type('input[name="password"]', 'admin123');
        
        console.log('Credentials entered');
        
        // Submit form
        await Promise.all([
            page.waitForNavigation(),
            page.click('button[type="submit"]')
        ]);
        
        console.log('Form submitted');
        
        // Check if we're on dashboard
        const url = page.url();
        console.log('Current URL:', url);
        
        if (url.includes('/dashboard')) {
            console.log('✅ Login successful - redirected to dashboard');
        } else {
            console.log('❌ Login failed - not on dashboard page');
        }
        
        // Check for any error messages
        const errorElement = await page.$('.alert-danger');
        if (errorElement) {
            const errorText = await page.$eval('.alert-danger', el => el.textContent);
            console.log('Error message:', errorText);
        }
        
        // Check if user data is stored in localStorage
        const token = await page.evaluate(() => localStorage.getItem('token'));
        const user = await page.evaluate(() => localStorage.getItem('user'));
        
        console.log('Token stored:', !!token);
        console.log('User data stored:', !!user);
        
        if (user) {
            const userData = JSON.parse(user);
            console.log('User role:', userData.role);
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testLogin();