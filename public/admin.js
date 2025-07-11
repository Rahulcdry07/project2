document.addEventListener('DOMContentLoaded', async () => {
    const userTableBody = document.getElementById('user-table-body');

    // Function to fetch and display users
    async function fetchUsers() {
        try {
            const response = await fetch('/api/admin/users');
            const users = await response.json();

            userTableBody.innerHTML = ''; // Clear the table
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.id}</td>
                    <td>${user.username}</td>
                    <td>${user.email}</td>
                    <td>
                        <select data-id="${user.id}" class="role-select">
                            <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </td>
                    <td>
                        <button data-id="${user.id}" class="delete-btn">Delete</button>
                    </td>
                `;
                userTableBody.appendChild(tr);
            });
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    // Handle role change
    userTableBody.addEventListener('change', async (e) => {
        if (e.target.classList.contains('role-select')) {
            const userId = e.target.dataset.id;
            const role = e.target.value;
            try {
                await fetch(`/api/admin/users/${userId}/role`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ role }),
                });
            } catch (error) {
                console.error('Error updating role:', error);
            }
        }
    });

    // Handle user deletion
    userTableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const userId = e.target.dataset.id;
            if (confirm('Are you sure you want to delete this user?')) {
                try {
                    await fetch(`/api/admin/users/${userId}`, {
                        method: 'DELETE',
                    });
                    fetchUsers(); // Refresh the user list
                } catch (error) {
                    console.error('Error deleting user:', error);
                }
            }
        }
    });

    // Initial fetch of users
    fetchUsers();
});