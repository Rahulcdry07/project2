// frontend-tests/admin.test.js
const { screen } = require('@testing-library/dom');

jest.useFakeTimers();


document.body.innerHTML = `
    <div id="alert-container"></div>
    <table>
        <tbody id="user-table-body"></tbody>
    </table>

    <!-- Role Modal -->
    <div id="role-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Change Role for <span id="modal-user-name"></span></h2>
            <select id="role-select">
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>
            <button id="confirm-role-change">Confirm</button>
        </div>
    </div>

    <!-- Delete Modal -->
    <div id="delete-modal" class="modal" style="display: none;">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Delete User <span id="delete-user-name"></span>?</h2>
            <button id="confirm-delete">Confirm Delete</button>
            <button id="cancel-delete">Cancel</button>
        </div>
    </div>

    <p>Total Users: <span id="total-users"></span></p>
    <p>Verified Users: <span id="verified-users"></span></p>
    <p>New Registrations Today: <span id="new-registrations-today"></span></p>
`;

global.fetch = jest.fn();

describe('Admin Panel', () => {
    let userTableBody, alertContainer, roleModal, deleteModal,
        modalUserNameSpan, deleteUserNameSpan, roleSelect,
        confirmRoleChangeBtn, cancelDeleteBtn, confirmDeleteBtn,
        totalUsersSpan, verifiedUsersSpan, newRegistrationsTodaySpan;

    beforeEach(async () => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        // Reset DOM to initial state
        document.body.innerHTML = `
            <div id="alert-container"></div>
            <table>
                <tbody id="user-table-body"></tbody>
            </table>

            <!-- Role Modal -->
            <div id="role-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <span class="close-button">&times;</span>
                    <h2>Change Role for <span id="modal-user-name"></span></h2>
                    <select id="role-select">
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                    <button id="confirm-role-change">Confirm</button>
                </div>
            </div>

            <!-- Delete Modal -->
            <div id="delete-modal" class="modal" style="display: none;">
                <div class="modal-content">
                    <span class="close-button">&times;</span>
                    <h2>Delete User <span id="delete-user-name"></span>?</h2>
                    <button id="confirm-delete">Confirm Delete</button>
                    <button id="cancel-delete">Cancel</button>
                </div>
            </div>

            <p>Total Users: <span id="total-users"></span></p>
            <p>Verified Users: <span id="verified-users"></span></p>
            <p>New Registrations Today: <span id="new-registrations-today"></span></p>
        `;

        userTableBody = document.getElementById('user-table-body');
        alertContainer = document.getElementById('alert-container');
        roleModal = document.getElementById('role-modal');
        deleteModal = document.getElementById('delete-modal');
        modalUserNameSpan = document.getElementById('modal-user-name');
        deleteUserNameSpan = document.getElementById('delete-user-name');
        roleSelect = document.getElementById('role-select');
        confirmRoleChangeBtn = document.getElementById('confirm-role-change');
        cancelDeleteBtn = document.getElementById('cancel-delete');
        confirmDeleteBtn = document.getElementById('confirm-delete');
        totalUsersSpan = document.getElementById('total-users');
        verifiedUsersSpan = document.getElementById('verified-users');
        newRegistrationsTodaySpan = document.getElementById('new-registrations-today');

        // Clear module cache to re-import scripts
        jest.resetModules();
        require('../public/js/utils.js'); // Ensure utils.js is loaded first
        require('../public/js/admin.js');

        // Mock fetch for initial user load
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, users: [
                { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user', is_verified: 1 },
                { id: 2, name: 'Bob', email: 'bob@example.com', role: 'admin', is_verified: 0 },
            ] }) // Initial fetch returns some users
        });

        // Manually trigger DOMContentLoaded
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve(); // Allow promises to resolve
        // Wait for the table to be populated by waiting for a specific element to appear
        await screen.findByText('Alice');
    });

    test('should fetch and populate users table on load', async () => {
        const mockUsers = [
            { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user', is_verified: 1 },
            { id: 2, name: 'Bob', email: 'bob@example.com', role: 'admin', is_verified: 0 },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, users: mockUsers })
        });

        // Re-trigger DOMContentLoaded to simulate initial load with new mock
        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        expect(userTableBody.children.length).toBe(2);
        expect(userTableBody.children[0].textContent).toContain('Alice');
        expect(userTableBody.children[1].textContent).toContain('Bob');
        expect(totalUsersSpan.textContent).toBe('2');
        expect(verifiedUsersSpan.textContent).toBe('1');
    });

    test('should show error message if fetching users fails', async () => {
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: false, message: 'Failed to load users' })
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        expect(alertContainer.textContent).toContain('Failed to load users');
    });

    test('should open role modal with correct user data', async () => {
        const mockUsers = [
            { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user', is_verified: 1 },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, users: mockUsers })
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const editButton = userTableBody.querySelector('.edit-role');
        editButton.click();

        expect(roleModal.style.display).toBe('flex');
        expect(modalUserNameSpan.textContent).toBe('Alice');
    });

    test('should change user role and refresh table on success', async () => {
        const mockUsers = [
            { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user', is_verified: 1 },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, users: mockUsers }) // Initial fetch
        });
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, message: 'Role updated' }) // Role change API
        });
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, users: [{ id: 1, name: 'Alice', email: 'alice@example.com', role: 'admin', is_verified: 1 }] }) // Refresh fetch
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const editButton = userTableBody.querySelector('.edit-role');
        editButton.click();

        roleSelect.value = 'admin';
        confirmRoleChangeBtn.click();
        await Promise.resolve();

        expect(roleModal.style.display).toBe('none');
        expect(alertContainer.textContent).toContain('User role updated successfully!');
        expect(userTableBody.children[0].textContent).toContain('admin');
    });

    test('should open delete modal with correct user data', async () => {
        const mockUsers = [
            { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user', is_verified: 1 },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, users: mockUsers })
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const deleteButton = userTableBody.querySelector('.delete-user');
        deleteButton.click();

        expect(deleteModal.style.display).toBe('flex');
        expect(deleteUserNameSpan.textContent).toBe('Alice');
    });

    test('should delete user and refresh table on success', async () => {
        const mockUsers = [
            { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user', is_verified: 1 },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, users: mockUsers }) // Initial fetch
        });
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, message: 'User deleted' }) // Delete API
        });
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, users: [] }) // Refresh fetch
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const deleteButton = userTableBody.querySelector('.delete-user');
        deleteButton.click();

        confirmDeleteBtn.click();
        await Promise.resolve();

        expect(deleteModal.style.display).toBe('none');
        expect(alertContainer.textContent).toContain('User deleted successfully!');
        expect(userTableBody.children.length).toBe(0);
    });

    test('should close modals when close button is clicked', async () => {
        const mockUsers = [
            { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user', is_verified: 1 },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, users: mockUsers })
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const editButton = userTableBody.querySelector('.edit-role');
        editButton.click();
        expect(roleModal.style.display).toBe('flex');

        const closeButton = roleModal.querySelector('.close-button');
        closeButton.click();
        expect(roleModal.style.display).toBe('none');
    });

    test('should close modals when clicking outside', async () => {
        const mockUsers = [
            { id: 1, name: 'Alice', email: 'alice@example.com', role: 'user', is_verified: 1 },
        ];
        fetch.mockResolvedValueOnce({
            json: () => Promise.resolve({ success: true, users: mockUsers })
        });

        document.dispatchEvent(new Event('DOMContentLoaded'));
        await Promise.resolve();

        const deleteButton = userTableBody.querySelector('.delete-user');
        deleteButton.click();
        expect(deleteModal.style.display).toBe('flex');

        // Simulate click outside the modal
        document.body.click();
        expect(deleteModal.style.display).toBe('none');
    });
});
