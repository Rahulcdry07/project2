document.addEventListener('DOMContentLoaded', () => {
    const userTableBody = document.getElementById('user-table-body');
    const alertContainer = document.getElementById('alert-container');

    // --- Modals ---
    const roleModal = document.getElementById('role-modal');
    const deleteModal = document.getElementById('delete-modal');
    const closeModalButtons = document.querySelectorAll('.close-button');
    const confirmRoleChangeBtn = document.getElementById('confirm-role-change');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');

    let currentUserId = null; // To store the user ID for modal actions

    function showMessage(message, type = 'info') {
        alertContainer.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
    }

    function openModal(modal, userId, userName) {
        currentUserId = userId;
        if (modal === roleModal) {
            document.getElementById('modal-user-name').textContent = userName;
        } else if (modal === deleteModal) {
            document.getElementById('delete-user-name').textContent = userName;
        }
        modal.style.display = 'flex';
    }

    function closeModal() {
        roleModal.style.display = 'none';
        deleteModal.style.display = 'none';
    }

    closeModalButtons.forEach(button => button.onclick = closeModal);
    window.onclick = (event) => {
        if (event.target == roleModal || event.target == deleteModal) {
            closeModal();
        }
    };

    // --- API Calls ---
    async function fetchUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const result = await response.json();
            if (result.success) {
                populateUserTable(result.users);
                updateStats(result.users);
            } else {
                showMessage(result.message || 'Failed to load users.', 'error');
            }
        } catch (error) {
            showMessage('Network error. Could not fetch users.', 'error');
        }
    }

    function populateUserTable(users) {
        userTableBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.role}</td>
                <td>${user.is_verified ? 'Yes' : 'No'}</td>
                <td class="action-buttons">
                    <button class="edit-role" data-id="${user.id}" data-name="${user.name}"><i class="fas fa-edit"></i></button>
                    <button class="delete-user" data-id="${user.id}" data-name="${user.name}"><i class="fas fa-trash-alt"></i></button>
                </td>
            `;
            userTableBody.appendChild(row);
        });
    }

    function updateStats(users) {
        document.getElementById('total-users').textContent = users.length;
        const verifiedCount = users.filter(u => u.is_verified).length;
        document.getElementById('verified-users').textContent = verifiedCount;
        // In a real app, the "new users today" would come from a separate API endpoint
        // For now, we'll just leave it as a placeholder.
        document.getElementById('new-registrations-today').textContent = 'N/A';
    }

    // --- Event Listeners ---
    userTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        const userId = button.dataset.id;
        const userName = button.dataset.name;

        if (button.classList.contains('edit-role')) {
            openModal(roleModal, userId, userName);
        } else if (button.classList.contains('delete-user')) {
            openModal(deleteModal, userId, userName);
        }
    });

    confirmRoleChangeBtn.addEventListener('click', async () => {
        const newRole = document.getElementById('role-select').value;
        if (!currentUserId) return;

        try {
            const formData = new FormData();
            formData.append('user_id', currentUserId);
            formData.append('new_role', newRole);

            const response = await fetch('/api/admin/user_role', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (result.success) {
                showMessage('User role updated successfully!', 'success');
                fetchUsers(); // Refresh the user table
            } else {
                showMessage(result.message || 'Failed to update user role.', 'error');
            }
        } catch (error) {
            showMessage('Network error. Could not update role.', 'error');
        } finally {
            closeModal();
        }
    });

    cancelDeleteBtn.addEventListener('click', closeModal);

    confirmDeleteBtn.addEventListener('click', async () => {
        if (!currentUserId) return;

        try {
            const formData = new FormData();
            formData.append('user_id', currentUserId);

            const response = await fetch('/api/admin/user/delete', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                showMessage('User deleted successfully!', 'success');
                fetchUsers(); // Refresh the user table
            } else {
                showMessage(result.message || 'Failed to delete user.', 'error');
            }
        } catch (error) {
            showMessage('Network error. Could not delete user.', 'error');
        } finally {
            closeModal();
        }
    });

    // Initial Load
    fetchUsers();
});