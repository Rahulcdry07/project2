document.addEventListener('DOMContentLoaded', () => {
    const userList = document.getElementById('user-list');
    const newUserForm = document.getElementById('new-user-form');

    // Function to fetch and display users
    async function fetchUsers() {
        try {
            const response = await fetch('/api/users');
            const users = await response.json();

            userList.innerHTML = ''; // Clear the list
            users.forEach(user => {
                const li = document.createElement('li');
                li.textContent = `ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`;
                userList.appendChild(li);
            });
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    // Function to handle form submission
    newUserForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const email = document.getElementById('email').value;

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, email }),
            });

            if (response.ok) {
                fetchUsers(); // Refresh the user list
                newUserForm.reset(); // Clear the form
            } else {
                const errorData = await response.json();
                alert(`Error: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error creating user:', error);
        }
    });

    // Initial fetch of users
    fetchUsers();
});
