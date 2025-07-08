document.addEventListener('DOMContentLoaded', () => {
    const userTableBody = document.getElementById('user-table-body');
    const messageDiv = document.querySelector('.message');

    function showMessage(message, type = 'info') {
        messageDiv.textContent = message;
        messageDiv.className = `alert alert-${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    async function fetchUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const result = await response.json();

            if (result.success) {
                populateUserTable(result.users);
            } else {
                showMessage(result.message || 'Failed to load users.', 'error');
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            showMessage('Network error. Failed to load users.', 'error');
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
                    <button data-id="${user.id}" data-role="${user.role}" class="toggle-role-btn">${user.role === 'admin' ? 'Demote' : 'Promote'}</button>
                    <button data-id="${user.id}" class="delete-user-btn delete">Delete</button>
                </td>
            `;
            userTableBody.appendChild(row);
        });

        attachEventListeners();
    }

    function attachEventListeners() {
        document.querySelectorAll('.toggle-role-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.target.dataset.id;
                const currentRole = e.target.dataset.role;
                const newRole = currentRole === 'admin' ? 'user' : 'admin';

                try {
                    const formData = new FormData();
                    formData.append('user_id', userId);
                    formData.append('new_role', newRole);

                    const response = await fetch('/api/admin/user/role', {
                        method: 'POST',
                        body: formData,
                    });
                    const result = await response.json();

                    if (result.success) {
                        showMessage(result.message, 'success');
                        fetchUsers(); // Refresh table
                    } else {
                        showMessage(result.message || 'Failed to change role.', 'error');
                    }
                } catch (error) {
                    console.error('Error changing role:', error);
                    showMessage('Network error. Failed to change role.', 'error');
                }
            });
        });

        document.querySelectorAll('.delete-user-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.target.dataset.id;
                if (confirm('Are you sure you want to delete this user?')) {
                    try {
                        const formData = new FormData();
                        formData.append('user_id', userId);

                        const response = await fetch('/api/admin/user/delete', {
                            method: 'POST',
                            body: formData,
                        });
                        const result = await response.json();

                        if (result.success) {
                            showMessage(result.message, 'success');
                            fetchUsers(); // Refresh table
                        } else {
                            showMessage(result.message || 'Failed to delete user.', 'error');
                        }
                    } catch (error) {
                        console.error('Error deleting user:', error);
                        showMessage('Network error. Failed to delete user.', 'error');
                    }
                }
            });
        });
    }

    fetchUsers(); // Initial load
});
