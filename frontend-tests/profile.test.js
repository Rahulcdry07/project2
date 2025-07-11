// frontend-tests/profile.test.js

jest.useFakeTimers();

document.body.innerHTML = `
    <div id="alert-container-profile"></div>
    <div id="alert-container-password"></div>
    <form id="profileForm">
        <input type="text" id="name" name="name">
        <input type="email" id="email" name="email">
        <input type="text" id="created_at" readonly>
        <input type="text" id="is_verified" readonly>
        <button type="submit">Update Profile</button>
    </form>
    <form id="changePasswordForm">
        <input type="password" id="current_password" name="current_password">
        <input type="password" id="new_password" name="new_password">
        <input type="password" id="confirm_new_password" name="confirm_new_password">
        <button type="submit">Change Password</button>
    </form>
    <button id="delete-account-button">Delete Account</button>
`;

global.fetch = jest.fn();

const localStorageMock = {
    setItem: jest.fn(),
    getItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

require('../public/js/utils.js'); // Assuming showMessage is in utils.js
require('../public/js/profile.js');

describe('Profile Page', () => {
    let nameInput, emailInput, createdAtInput, isVerifiedInput,
        profileForm, changePasswordForm, currentPasswordInput,
        newPasswordInput, confirmNewPasswordInput, alertContainerProfile,
        alertContainerPassword, deleteAccountButton;

    beforeEach(async () => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        document.body.innerHTML = `
            <div id="alert-container-profile"></div>
            <div id="alert-container-password"></div>
            <form id="profileForm">
                <input type="text" id="name" name="name">
                <input type="email" id="email" name="email">
                <input type="text" id="created_at" readonly>
                <input type="text" id="is_verified" readonly>
                <button type="submit">Update Profile</button>
            </form>
            <form id="changePasswordForm">
                <input type="password" id="current_password" name="current_password">
                <input type="password" id="new_password" name="new_password">
                <input type="password" id="confirm_new_password" name="confirm_new_password">
                <button type="submit">Change Password</button>
            </form>
            <button id="delete-account-button">Delete Account</button>
        `;

        nameInput = document.getElementById('name');
        emailInput = document.getElementById('email');
        createdAtInput = document.getElementById('created_at');
        isVerifiedInput = document.getElementById('is_verified');
        profileForm = document.getElementById('profileForm');
        changePasswordForm = document.getElementById('changePasswordForm');
        currentPasswordInput = document.getElementById('current_password');
        newPasswordInput = document.getElementById('new_password');
        confirmNewPasswordInput = document.getElementById('confirm_new_password');
        alertContainerProfile = document.getElementById('alert-container-profile');
        alertContainerPassword = document.getElementById('alert-container-password');
        deleteAccountButton = document.getElementById('delete-account-button');

        // Mock initial fetch for user profile
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, user: { name: 'Test User', email: 'test@example.com', created_at: '2023-01-01T00:00:00Z', is_verified: 1 } })
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        jest.runAllTimers();
        await Promise.resolve();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('should fetch and populate user profile on load', async () => {
        expect(nameInput.value).toBe('Test User');
        expect(emailInput.value).toBe('test@example.com');
        expect(createdAtInput.value).not.toBeNull(); // Date formatting might vary, just check it's not empty
        expect(isVerifiedInput.value).toBe('Yes');
    });

    test('should show error message if fetching profile fails', async () => {
        fetch.mockClear(); // Clear previous mock
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: false, message: 'Failed to load profile' })
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        jest.runAllTimers();
        await Promise.resolve();

        expect(alertContainerProfile.textContent).toContain('Failed to load profile');
    });

    test('should update profile successfully', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, message: 'Profile updated successfully!' })
        });

        nameInput.value = 'Updated Name';
        emailInput.value = 'updated@example.com';

        profileForm.dispatchEvent(new Event('submit'));
        jest.runAllTimers();
        await Promise.resolve();

        expect(alertContainerProfile.textContent).toContain('Profile updated successfully!');
        expect(localStorage.setItem).toHaveBeenCalledWith('user_name', 'Updated Name');
    });

    test('should show error if profile update fails', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: false, message: 'Update failed' })
        });

        profileForm.dispatchEvent(new Event('submit'));
        jest.runAllTimers();
        await Promise.resolve();

        expect(alertContainerProfile.textContent).toContain('Update failed');
    });

    test('should change password successfully', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, message: 'Password changed successfully!' })
        });

        currentPasswordInput.value = 'old_password';
        newPasswordInput.value = 'new_password123!';
        confirmNewPasswordInput.value = 'new_password123!';

        changePasswordForm.dispatchEvent(new Event('submit'));
        jest.runAllTimers();
        await Promise.resolve();

        expect(alertContainerPassword.textContent).toContain('Password changed successfully!');
        expect(currentPasswordInput.value).toBe(''); // Form should be reset
    });

    test('should show error if new passwords do not match', async () => {
        currentPasswordInput.value = 'old_password';
        newPasswordInput.value = 'new_password123!';
        confirmNewPasswordInput.value = 'mismatch_password';

        changePasswordForm.dispatchEvent(new Event('submit'));
        jest.runAllTimers();
        await Promise.resolve();

        expect(alertContainerPassword.textContent).toContain('New passwords do not match.');
    });

    test('should delete account successfully and redirect', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, message: 'Account deleted successfully.' })
        });

        window.confirm.mockImplementationOnce(() => true); // User confirms deletion

        deleteAccountButton.click();
        jest.runAllTimers();
        await Promise.resolve();

        expect(alertContainerProfile.textContent).toContain('Account deleted successfully.');
        expect(localStorage.clear).toHaveBeenCalledTimes(1);
        expect(window.location.assign).toHaveBeenCalledWith('login.html');
    });

    test('should not delete account if user cancels', async () => {
        window.confirm.mockImplementationOnce(() => false); // User cancels deletion

        deleteAccountButton.click();
        jest.runAllTimers();
        await Promise.resolve();

        expect(fetch).not.toHaveBeenCalledWith('/api/profile_delete', expect.any(Object));
        expect(localStorage.clear).not.toHaveBeenCalled();
        expect(window.location.assign).not.toHaveBeenCalled();
    });
});
