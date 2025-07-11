document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const currentPasswordInput = document.getElementById('current_password');
    const newPasswordInput = document.getElementById('new_password');
    const confirmNewPasswordInput = document.getElementById('confirm_new_password');
    const alertContainerProfile = document.getElementById('alert-container-profile');
    const alertContainerPassword = document.getElementById('alert-container-password');

    function showMessage(message, type = 'info', container) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        container.innerHTML = ''; // Clear previous messages
        container.appendChild(alertDiv);
        
        setTimeout(() => {
            alertDiv.style.display = 'none';
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
                showMessage(result.message || 'Failed to load profile.', 'error', alertContainerProfile);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            showMessage('Network error. Failed to load profile.', 'error', alertContainerProfile);
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
            // Add CSRF token if you have one
            // formData.append('csrf_token', 'your_csrf_token_here');

            const response = await fetch('/api/profile_update', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.success) {
                showMessage(result.message, 'success', alertContainerProfile);
                localStorage.setItem('user_name', name); // Update local storage
            } else {
                showMessage(result.message || 'Profile update failed.', 'error', alertContainerProfile);
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showMessage('Network error. Profile update failed.', 'error', alertContainerProfile);
        }
    });

    // Handle password change submission
    changePasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showMessage('All password fields are required.', 'error', alertContainerPassword);
            return;
        }

        if (newPassword.length < 6) {
            showMessage('New password must be at least 6 characters long.', 'error', alertContainerPassword);
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showMessage('New passwords do not match.', 'error', alertContainerPassword);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('current_password', currentPassword);
            formData.append('new_password', newPassword);
            // Add CSRF token
            // formData.append('csrf_token', 'your_csrf_token_here');

            const response = await fetch('/api/change_password', {
                method: 'POST',
                body: formData,
            });
            const result = await response.json();

            if (result.success) {
                showMessage(result.message, 'success', alertContainerPassword);
                changePasswordForm.reset(); // Clear form
            } else {
                showMessage(result.message || 'Password change failed.', 'error', alertContainerPassword);
            }
        } catch (error) {
            console.error('Error changing password:', error);
            showMessage('Network error. Password change failed.', 'error', alertContainerPassword);
        }
    });

    fetchUserProfile(); // Load user data on page load

    const deleteAccountButton = document.getElementById('delete-account-button');
    if (deleteAccountButton) {
        deleteAccountButton.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                try {
                    const response = await fetch('/api/profile_delete', {
                        method: 'POST',
                        // Add CSRF token if needed
                    });
                    const result = await response.json();

                    if (result.success) {
                        showMessage(result.message, 'success', alertContainerProfile);
                        localStorage.clear(); // Clear local storage
                        setTimeout(() => {
                            window.location.href = 'login.html'; // Redirect to login
                        }, 2000);
                    } else {
                        showMessage(result.message || 'Account deletion failed.', 'error', alertContainerProfile);
                    }
                } catch (error) {
                    console.error('Error deleting account:', error);
                    showMessage('Network error. Account deletion failed.', 'error', alertContainerProfile);
                }
            }
        });
    }
});

