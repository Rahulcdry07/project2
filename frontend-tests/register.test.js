// frontend-tests/register.test.js

jest.useFakeTimers();

document.body.innerHTML = `
    <div class="form-container">
        <form id="registerForm">
            <div class="form-group">
                <input type="text" id="name" name="name" required>
            </div>
            <div class="form-group">
                <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
                <input type="password" id="password" name="password" required>
            </div>
            <button type="submit">Register</button>
        </form>
        <div class="message" style="display: none;"></div>
    </div>
`;

describe('Register Form', () => {
    jest.setTimeout(15000); // Increase timeout for this test suite
    let nameInput, emailInput, passwordInput, form, messageDiv;

    beforeEach(async () => {
        jest.resetModules(); // Clear module cache to re-import scripts

        document.body.innerHTML = `
            <div class="form-container">
                <form id="registerForm">
                    <div class="form-group">
                        <input type="text" id="name" name="name" required>
                    </div>
                    <div class="form-group">
                        <input type="email" id="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <input type="password" id="password" name="password" required>
                    </div>
                    <button type="submit">Register</button>
                </form>
                <div class="message" style="display: none;"></div>
            </div>
        `;

        fetch.mockClear();

        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ token: 'test-csrf-token' })
        });

        nameInput = document.getElementById('name');
        emailInput = document.getElementById('email');
        passwordInput = document.getElementById('password');
        form = document.getElementById('registerForm');
        messageDiv = document.querySelector('.message');

        nameInput.value = 'Test User';
        emailInput.value = 'test@example.com';
        passwordInput.value = 'Password123!';
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }

        require('../public/js/utils.js');
        require('../public/js/register.js');

        const domContentLoadedEvent = new Event('DOMContentLoaded', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(domContentLoadedEvent);

        jest.runAllTimers();
        await Promise.resolve(); // Allow any microtasks to complete
    });

    test('should show success message on successful registration', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                success: true,
                message: 'Registration successful! Please check your email for verification.'
            })
        });

        await form.dispatchEvent(new Event('submit'));
        jest.runAllTimers();

        expect(messageDiv.textContent).toBe('Registration successful! Please check your email for verification.');
        expect(messageDiv.style.display).toBe('block');
    });

    test('should show error message if email already exists', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                success: false,
                message: 'Email already registered.'
            })
        });

        await form.dispatchEvent(new Event('submit'));
        jest.runAllTimers();

        expect(messageDiv.textContent).toBe('Email already registered.');
        expect(messageDiv.style.display).toBe('block');
    });

    test('should show error message if fields are empty', async () => {
        nameInput.value = '';
        emailInput.value = '';
        passwordInput.value = '';

        await form.dispatchEvent(new Event('submit'));
        jest.runAllTimers();

        expect(messageDiv.textContent).toBe('Please fill in all fields.');
        expect(messageDiv.style.display).toBe('block');
    });

    test('should show error message if email format is invalid', async () => {
        emailInput.value = 'invalid-email';

        await form.dispatchEvent(new Event('submit'));
        jest.runAllTimers();

        expect(messageDiv.textContent).toBe('Invalid email format.');
        expect(messageDiv.style.display).toBe('block');
    });

    test('should show error message if password is weak', async () => {
        passwordInput.value = 'short';

        await form.dispatchEvent(new Event('submit'));
        jest.runAllTimers();

        expect(messageDiv.textContent).toContain('Password must be at least 8 characters long.');
        expect(messageDiv.style.display).toBe('block');
    });
});
