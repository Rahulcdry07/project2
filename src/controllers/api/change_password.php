<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/logger.php';
require_once __DIR__ . '/../../User.php';

use App\User;
use App\Database;
use Psr\Log\LoggerInterface;

header('Content-Type: application/json');

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

// Verify CSRF token
if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    echo json_encode(['success' => false, 'message' => 'Invalid CSRF token.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = $_SESSION['user_id'];
    $currentPassword = $_POST['current_password'] ?? '';
    $newPassword = $_POST['new_password'] ?? '';

    // Passwords should not be trimmed

    if (empty($currentPassword) || empty($newPassword)) {
        echo json_encode(['success' => false, 'message' => 'Current and new passwords are required.']);
        exit;
    }

    if (strlen($newPassword) < 6) {
        echo json_encode(['success' => false, 'message' => 'New password must be at least 6 characters long.']);
        exit;
    }

    $userModel = new App\User($db, $log);
    $user = $userModel->getUserById($userId);

    if (!$user || !password_verify($currentPassword, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Incorrect current password.']);
        exit;
    }

    $hashedNewPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    if ($userModel->updatePassword($userId, $hashedNewPassword)) {
        // Log password change activity
        $activityLogger = new App\ActivityLogger($db);
        $activityLogger->logActivity($userId, 'password_change', 'User changed their password.', $_SERVER['REMOTE_ADDR']);

        echo json_encode(['success' => true, 'message' => 'Password changed successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to change password.']);
    }
}
