document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const currentPasswordInput = document.getElementById('current_password');
    const newPasswordInput = document.getElementById('new_password');
    const confirmNewPasswordInput = document.getElementById('confirm_new_password');
    const messageDiv = document.querySelector('.message');

    function showMessage(message, type = 'info') {
        messageDiv.textContent = message;
        messageDiv.className = `alert alert-${type}`;
        messageDiv.style.display = 'block';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }

    // Fetch user data and populate form
    async function fetchUserProfile() {
        try {
            const response = await fetch('/api/profile');
            const result = await response.json();

            if (result.success) {
                nameInput.value = result.user.name;
                emailInput.value = result.user.email;
                document.getElementById('created_at').value = new Date(result.user.created_at).toLocaleDateString();
                document.getElementById('is_verified').value = result.user.is_verified ? 'Yes' : 'No';
            } else {
                showMessage(result.message || 'Failed to load profile.', 'error');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            showMessage('Network error. Failed to load profile.', 'error');
        }
    }

    // Handle profile update submission
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('email', email);

            const response = await fetch('/api/profile/update', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.success) {
                showMessage(result.message, 'success');
                localStorage.setItem('user_name', name); // Update local storage
            } else {
                showMessage(result.message || 'Profile update failed.', 'error');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showMessage('Network error. Profile update failed.', 'error');
        }
    });

    // Handle password change submission
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showMessage('All password fields are required.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showMessage('New password must be at least 6 characters long.', 'error');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showMessage('New passwords do not match.', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('current_password', currentPassword);
            formData.append('new_password', newPassword);

            const response = await fetch('/api/profile/change-password', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.success) {
                showMessage(result.message, 'success');
                changePasswordForm.reset(); // Clear form
            } else {
                showMessage(result.message || 'Password change failed.', 'error');
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showMessage('Network error. Password change failed.', 'error');
        }
    });

    fetchUserProfile(); // Load user data on page load

    const deleteAccountButton = document.getElementById('delete-account-button');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                try {
                    const response = await fetch('/api/profile/delete', {
                        method: 'POST',
                    });
                    const result = await response.json();

                    if (result.success) {
                        showMessage(result.message, 'success');
                        localStorage.clear(); // Clear local storage
                        setTimeout(() => {
                            window.location.href = 'login.html'; // Redirect to login
                        }, 2000);
                    } else {
                        showMessage(result.message || 'Account deletion failed.', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting account:', error);
                    showMessage('Network error. Account deletion failed.', 'error');
                }
            }
        });
    }
});
