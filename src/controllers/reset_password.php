<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/logger.php';
use App\User;
use App\Database;
use Psr\Log\LoggerInterface;

header('Content-Type: application/json');

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);

$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';
$newPassword = $data['password'] ?? '';

if (empty($token) || empty($newPassword)) {
    echo json_encode(['success' => false, 'message' => 'Token and new password are required.']);
    exit;
}

$userModel = new App\User($db, $log);
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
