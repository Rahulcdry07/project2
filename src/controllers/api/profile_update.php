<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../User.php';

use App\User;
use App\Database;

header('Content-Type: application/json');

session_start();

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, 8889);

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = $_SESSION['user_id'];
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');

    // Sanitize name for display
    $sanitizedName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');

    if (empty($name) || empty($email)) {
        echo json_encode(['success' => false, 'message' => 'Name and email are required.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
        exit;
    }

    $userModel = new App\User($db);

    // Check if new email already exists for another user
    $existingUser = $userModel->getUserByEmail($email);
    if ($existingUser && $existingUser['id'] != $userId) {
        echo json_encode(['success' => false, 'message' => 'Email already taken by another user.']);
        exit;
    }

    if ($userModel->updateProfile($userId, $sanitizedName, $email)) {
        // Log profile update activity
        $activityLogger = new App\ActivityLogger($db);
        $activityLogger->logActivity($userId, 'profile_update', 'User updated their profile.', $_SERVER['REMOTE_ADDR']);

        echo json_encode(['success' => true, 'message' => 'Profile updated successfully!']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update profile.']);
    }
}
