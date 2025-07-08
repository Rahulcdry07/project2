<?php

require_once __DIR__ . '/../config/config.php';
use App\User;
use App\Database;

header('Content-Type: application/json');

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, 8889);

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$newPassword = $data['password'] ?? '';

if (empty($token) || empty($newPassword)) {
    echo json_encode(['success' => false, 'message' => 'Token and new password are required.']);
    exit;
}

$userModel = new App\User($db);
$user = $userModel->getUserByResetToken($token);

if (!$user || strtotime($user['reset_token_expires_at']) < time()) {
    echo json_encode(['success' => false, 'message' => 'Invalid or expired reset token.']);
    exit;
}

// Hash the new password
$hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

// Update the user's password and clear the reset token
$userModel->updatePassword($user['id'], $hashedPassword);

echo json_encode(['success' => true, 'message' => 'Your password has been reset successfully. You can now log in.']);
