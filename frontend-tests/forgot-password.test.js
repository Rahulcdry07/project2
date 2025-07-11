// frontend-tests/forgot-password.test.js

jest.useFakeTimers();

document.body.innerHTML = `
    <div class="form-container">
        <form id="forgotPasswordForm">
            <div class="form-group">
                <input type="email" id="email" name="email" required>
            </div>
            <button type="submit">Send Reset Link</button>
        </form>
        <div class="message" style="display: none;"></div>
    </div>
`;

describe('Forgot Password Form', () => {
    let emailInput, form, messageDiv;

    beforeEach(async () => {
        document.body.innerHTML = `
            <div class="form-container">
                <form id="forgotPasswordForm">
                    <div class="form-group">
                        <input type="email" id="email" name="email" required>
                    </div>
                    <button type="submit">Send Reset Link</button>
                </form>
                <div class="message" style="display: none;"></div>
            </div>
        `;
        fetch.mockClear();

        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ token: 'test-csrf-token' })
        });

        emailInput = document.getElementById('email');
        form = document.getElementById('forgotPasswordForm');
        messageDiv = document.querySelector('.message');

        emailInput.value = 'test@example.com';
        if (messageDiv) {
            messageDiv.style.display = 'none';
        }

        require('../public/js/utils.js');
        require('../public/js/forgot-password.js');

        const domContentLoadedEvent = new Event('DOMContentLoaded', {
            bubbles: true,
            cancelable: true,
        });
        document.dispatchEvent(domContentLoadedEvent);

        jest.runAllTimers();
        await Promise.resolve();
    });

    test('should show success message on successful password reset request', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({
                success: true,
                message: 'If your email address is in our database, you will receive a password reset link.'
            })
        });

        await form.dispatchEvent(new Event('submit'));
        jest.runAllTimers();

        expect(messageDiv.textContent).toBe('If your email address is in our database, you will receive a password reset link.');
        expect(messageDiv.style.display).toBe('block');
    });

    test('should show error message if email is empty', async () => {
        emailInput.value = '';

        await form.dispatchEvent(new Event('submit'));
        jest.runAllTimers();

        expect(messageDiv.textContent).toBe('Please fill in all fields.');
        expect(messageDiv.style.display).toBe('block');
    });

    test('should show error message if email format is invalid', async () => {
        emailInput.value = 'invalid-email';

        await form.dispatchEvent(new Event('submit'));
        jest.runAllTimers();

        expect(messageDiv.textContent).toBe('Please enter a valid email address.');
        expect(messageDiv.style.display).toBe('block');
    });

    test('should show network error message on fetch failure', async () => {
        fetch.mockRejectedValueOnce(new Error('Network down'));

        await form.dispatchEvent(new Event('submit'));
        jest.runAllTimers();

        expect(messageDiv.textContent).toBe('Network error. Please check your connection and try again.');
        expect(messageDiv.style.display).toBe('block');
    });
});
