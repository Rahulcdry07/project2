// frontend-tests/nav.test.js

// Use fake timers to control setTimeout
jest.useFakeTimers();

document.body.innerHTML = `
    <nav class="main-nav">
        <div class="nav-container">
            <a href="dashboard.html" class="nav-brand">SecureReg</a>
            <div class="nav-links">
                <a href="profile.html">Profile</a>
                <a href="pricing.html">Pricing</a>
                <a href="admin.html" id="admin-panel-link" style="display: none;">Admin</a>
                <a href="#" id="logout-link">Logout</a>
            </div>
        </div>
    </nav>
`;

global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
    setItem: jest.fn(),
    getItem: jest.fn(),
    clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Import the nav script
require('../public/js/nav.js');

describe('Navigation', () => {
    let adminPanelLink, logoutLink;

    beforeEach(async () => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Reset DOM to initial state
        document.body.innerHTML = `
            <nav class="main-nav">
                <div class="nav-container">
                    <a href="dashboard.html" class="nav-brand">SecureReg</a>
                    <div class="nav-links">
                        <a href="profile.html">Profile</a>
                        <a href="pricing.html">Pricing</a>
                        <a href="admin.html" id="admin-panel-link" style="display: none;">Admin</a>
                        <a href="#" id="logout-link">Logout</a>
                    </div>
                </div>
            </nav>
        `;

        adminPanelLink = document.getElementById('admin-panel-link');
        logoutLink = document.getElementById('logout-link');

        // Manually trigger DOMContentLoaded
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve(); // Allow promises to resolve
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('admin panel link should be visible for admin user', async () => {
        localStorage.getItem.mockReturnValueOnce('admin');

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        expect(adminPanelLink.style.display).toBe('inline-block');
    });

    test('admin panel link should be hidden for non-admin user', async () => {
        localStorage.getItem.mockReturnValueOnce('user');

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        expect(adminPanelLink.style.display).toBe('none');
    });

    test('should clear localStorage and redirect to login on successful logout', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true })
        });

        logoutLink.click();
        await Promise.resolve();

        expect(localStorage.clear).toHaveBeenCalledTimes(1);
        expect(assignMock).toHaveBeenCalledWith('login.html');
    });

    test('should show alert on failed logout', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: false, message: 'Logout failed' })
        });

        logoutLink.click();
        await Promise.resolve();

        expect(window.alert).toHaveBeenCalledWith('Logout failed: Logout failed');
    });

    test('should show alert on network error during logout', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        logoutLink.click();
        await Promise.resolve();

        expect(window.alert).toHaveBeenCalledWith('Network error during logout.');
    });
});
