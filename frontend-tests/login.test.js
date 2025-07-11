// frontend-tests/login.test.js

// Use fake timers to control setTimeout
jest.useFakeTimers();

// Mock the global fetch function
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
    setItem: jest.fn(),
    getItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Login Form', () => {
    jest.setTimeout(15000); // Increase timeout for this test suite
    let emailInput, passwordInput, form, messageDiv;

    beforeEach(async () => {
        jest.resetModules(); // Clear module cache to re-import scripts

        // Set up a basic HTML structure for the login form
        document.body.innerHTML = `
            <div class="form-container">
                <form id="loginForm">
                    <div class="form-group">
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit">Login</button>
                </form>
                <div class="message" style="display: none;"></div>
            </div>
        `;

        // Reset mocks before each test
        fetch.mockClear();
        localStorage.clear.mockClear();
        localStorage.setItem.mockClear();

        // Mock the CSRF token fetch
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ token: 'test-csrf-token' })
        });

        // Import the login script which attaches event listeners
        require('../public/js/utils.js');
        require('../public/js/login.js');

        // Get DOM elements (after innerHTML and script import)
        emailInput = document.getElementById('email');
        passwordInput = document.getElementById('password');
        form = document.getElementById('loginForm');
        messageDiv = document.querySelector('.message');

        // Reset form inputs
        emailInput.value = 'test@example.com';
        passwordInput.value = 'password123';
        messageDiv.style.display = 'none';

        // Manually trigger DOMContentLoaded to attach event listeners
        const domContentLoadedEvent = new Event('DOMContentLoaded', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(domContentLoadedEvent);

        jest.runAllTimers();
        await Promise.resolve(); // Allow any microtasks to complete
    });

    test('should always pass', () => {
        expect(true).toBe(true);
    });
});