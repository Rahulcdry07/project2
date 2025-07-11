// frontend-tests/pricing.test.js
const { screen } = require('@testing-library/dom');

jest.useFakeTimers();

document.body.innerHTML = `
    <div id="plans-grid"></div>
`;

global.fetch = jest.fn();

// Import the pricing script
require('../public/js/pricing.js');

describe('Pricing Page', () => {
    let plansGrid;

    beforeEach(async () => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        document.body.innerHTML = `
            <div id="plans-grid"></div>
        `;
        plansGrid = document.getElementById('plans-grid');

        // Mock initial fetch for plans
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, plans: [] })
        });

        // Manually trigger DOMContentLoaded
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve(); // Allow promises to resolve
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    test('should fetch and display plans on load', async () => {
        const mockPlans = [
            { id: 1, name: 'Basic', price: 9.99, description: 'Basic plan', features: 'Feature A, Feature B' },
            { id: 2, name: 'Pro', price: 19.99, description: 'Pro plan', features: 'Feature C, Feature D' },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, plans: mockPlans })
        });

        // Re-trigger DOMContentLoaded to simulate initial load with new mock
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        expect(plansGrid.children.length).toBe(2);
        expect(plansGrid.children[0].textContent).toContain('Basic');
        expect(plansGrid.children[1].textContent).toContain('Pro');
    });

    test('should show error message if fetching plans fails', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: false, message: 'Failed to load plans' })
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        expect(plansGrid.textContent).toContain('Failed to load plans. Please try again later.');
    });

    test('should show network error message if fetching plans fails due to network', async () => {
        fetch.mockRejectedValueOnce(new Error('Network error'));

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        expect(plansGrid.textContent).toContain('Network error. Failed to load plans.');
    });

    test('should subscribe to a plan and redirect on success', async () => {
        const mockPlans = [
            { id: 1, name: 'Basic', price: 9.99, description: 'Basic plan', features: 'Feature A, Feature B' },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, plans: mockPlans }) // Initial fetch
        });
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, message: 'Subscription successful!' }) // Subscribe API
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const selectButton = plansGrid.querySelector('.btn-select');
        selectButton.click();

        jest.runAllTimers(); // Fast-forward for setTimeout in pricing.js

        expect(window.alert).toHaveBeenCalledWith('Subscription successful!');
        expect(window.location.assign).toHaveBeenCalledWith('dashboard.html');
    });

    test('should show alert on failed subscription', async () => {
        const mockPlans = [
            { id: 1, name: 'Basic', price: 9.99, description: 'Basic plan', features: 'Feature A, Feature B' },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, plans: mockPlans }) // Initial fetch
        });
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: false, message: 'Subscription failed.' }) // Subscribe API
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const selectButton = plansGrid.querySelector('.btn-select');
        selectButton.click();

        jest.runAllTimers();

        expect(window.alert).toHaveBeenCalledWith('Subscription failed.');
        expect(window.location.assign).not.toHaveBeenCalled();
    });

    test('should show network error on subscription failure', async () => {
        const mockPlans = [
            { id: 1, name: 'Basic', price: 9.99, description: 'Basic plan', features: 'Feature A, Feature B' },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, plans: mockPlans }) // Initial fetch
        });
        fetch.mockRejectedValueOnce(new Error('Network error')); // Subscribe API network error

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const selectButton = plansGrid.querySelector('.btn-select');
        selectButton.click();

        jest.runAllTimers();

        expect(window.alert).toHaveBeenCalledWith('Network error. Subscription failed.');
        expect(window.location.assign).not.toHaveBeenCalled();
    });

    test('should not subscribe if user cancels confirmation', async () => {
        window.confirm.mockImplementationOnce(() => false); // User cancels

        const mockPlans = [
            { id: 1, name: 'Basic', price: 9.99, description: 'Basic plan', features: 'Feature A, Feature B' },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, plans: mockPlans }) // Initial fetch
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const selectButton = plansGrid.querySelector('.btn-select');
        selectButton.click();

        jest.runAllTimers();

        expect(fetch).toHaveBeenCalledTimes(1); // Only initial fetch, no subscribe API call
        expect(alertMock).not.toHaveBeenCalled();
        expect(window.location.assign).not.toHaveBeenCalled();
    });
});
