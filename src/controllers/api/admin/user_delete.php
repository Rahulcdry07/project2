<?php

require_once __DIR__ . '/../../../config/config.php';
require_once __DIR__ . '/../../../config/logger.php';
require_once __DIR__ . '/../../../User.php';

use App\User;
use App\Database;
use Psr\Log\LoggerInterface;

header('Content-Type: application/json');

session_start();

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);

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

    $userModel = new App\User($db, $log);
    $activityLogger = new App\ActivityLogger($db);

    // Prevent admin from deleting their own account
    if ($userIdToDelete == $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'Cannot delete your own account from here.']);
        exit;
    }

    // Check if the user exists before logging and deleting
    $userToDelete = $userModel->getUserById($userIdToDelete);
    if (!$userToDelete) {
        echo json_encode(['success' => false, 'message' => 'User not found.']);
        exit;
    }

    // Log user deletion activity BEFORE deleting the user
    $activityLogger->logActivity($userIdToDelete, 'user_deletion', 'User account deleted by admin.', $_SERVER['REMOTE_ADDR']);

    if ($userModel->deleteUser($userIdToDelete)) {
        echo json_encode(['success' => true, 'message' => 'User deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete user.']);
    }
}
