<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - SecureReg</title>
    <link rel="stylesheet" href="css/style.css">
    <link rel="stylesheet" href="css/nav.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <?php include 'includes/admin_nav.html'; ?>

    <div class="admin-page-container">
        <header class="admin-header">
            <div class="header-content">
                <h1>Admin Panel</h1>
                <p>Oversee and manage all user accounts and site activities.</p>
            </div>
        </header>

        <main class="admin-main">
            <section class="admin-stats-grid">
                <div class="stat-card users">
                    <div class="stat-icon"><i class="fas fa-users"></i></div>
                    <div class="stat-info">
                        <h3>Total Users</h3>
                        <p id="total-users">0</p>
                    </div>
                </div>
                <div class="stat-card verified-users">
                    <div class="stat-icon"><i class="fas fa-user-check"></i></div>
                    <div class="stat-info">
                        <h3>Verified Users</h3>
                        <p id="verified-users">0</p>
                    </div>
                </div>
                <div class="stat-card new-users-today">
                    <div class="stat-icon"><i class="fas fa-user-plus"></i></div>
                    <div class="stat-info">
                        <h3>New Users Today</h3>
                        <p id="new-registrations-today">0</p>
                    </div>
                </div>
            </section>

            <section class="user-management-table">
                <div class="table-header">
                    <h2>User Management</h2>
                </div>
                <div id="alert-container" class="alert-container"></div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Verified</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="user-table-body">
                        <!-- User rows will be loaded here -->
                    </tbody>
                </table>
            </section>
        </main>
    </div>

    <!-- Role Change Modal -->
    <div id="role-modal" class="modal" style="display:none;">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Change User Role</h2>
            <p>Select a new role for <strong id="modal-user-name"></strong>:</p>
            <select id="role-select">
                <option value="user">User</option>
                <option value="admin">Admin</option>
            </select>
            <button id="confirm-role-change" class="btn-modal-confirm">Confirm Change</button>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div id="delete-modal" class="modal" style="display:none;">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Confirm Deletion</h2>
            <p>Are you sure you want to delete the user <strong id="delete-user-name"></strong>? This action cannot be undone.</p>
            <div class="modal-actions">
                <button id="cancel-delete" class="btn-modal-cancel">Cancel</button>
                <button id="confirm-delete" class="btn-modal-confirm-delete">Yes, Delete User</button>
            </div>
        </div>
    </div>

    <script src="js/admin.js"></script>
</body>
</html>
