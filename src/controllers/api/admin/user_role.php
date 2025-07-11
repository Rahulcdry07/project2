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
    $userId = $_POST['user_id'] ?? null;
    $newRole = $_POST['new_role'] ?? null;

    if (empty($userId) || empty($newRole) || !in_array($newRole, ['user', 'admin'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid input.']);
        exit;
    }

    $userModel = new App\User($db, $log);

    // Prevent changing own role (optional, but good practice)
    if ($userId == $_SESSION['user_id']) {
        echo json_encode(['success' => false, 'message' => 'Cannot change your own role.']);
        exit;
    }

    if ($userModel->updateUserRole($userId, $newRole)) {
        // Log role change activity
        $activityLogger = new App\ActivityLogger($db);
        $activityLogger->logActivity($userId, 'role_change', "User role changed to $newRole.", $_SERVER['REMOTE_ADDR']);

        echo json_encode(['success' => true, 'message' => 'User role updated successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update user role.']);
    }
}
