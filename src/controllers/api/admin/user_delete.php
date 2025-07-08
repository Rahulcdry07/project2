<?php

require_once __DIR__ . '/../../../config/config.php';
require_once __DIR__ . '/../../../User.php';

use App\User;
use App\Database;

header('Content-Type: application/json');

session_start();

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, 8889);

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userIdToDelete = $_POST['user_id'] ?? null;

    if (empty($userIdToDelete)) {
        echo json_encode(['success' => false, 'message' => 'User ID is required.']);
        exit;
    }

    $userModel = new App\User($db);

    // Prevent admin from deleting their own account
    if ($userIdToDelete == $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'Cannot delete your own account from here.']);
        exit;
    }

    if ($userModel->deleteUser($userIdToDelete)) {
        // Log user deletion activity
        $activityLogger = new App\ActivityLogger($db);
        $activityLogger->logActivity($userIdToDelete, 'user_deletion', 'User account deleted by admin.', $_SERVER['REMOTE_ADDR']);

        // Destroy session after successful deletion
        $_SESSION = array();
        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                $params["path"], $params["domain"],
                $params["secure"], $params["httponly"]
            );
        }
        session_destroy();

        echo json_encode(['success' => true, 'message' => 'Your account has been deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete user.']);
    }
}
