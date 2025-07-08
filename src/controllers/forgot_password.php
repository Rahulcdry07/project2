<?php

require_once __DIR__ . '/../config/config.php';
use App\User;
use App\Database;

header('Content-Type: application/json');

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, 8889);

$data = json_decode(file_get_contents('php://input'), true);
$email = $data['email'] ?? '';

if (empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Email is required.']);
    exit;
}

$userModel = new App\User($db);
$user = $userModel->getUserByEmail($email);

if (!$user) {
    // For security, always return a generic success message even if email not found
    echo json_encode(['success' => true, 'message' => 'If your email address is in our database, you will receive a password reset link.']);
    exit;
}

// Generate a unique token
$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+1 hour')); // Token valid for 1 hour

// Store the token in the database
$userModel->updateResetToken($user['id'], $token, $expires);

// Simulate sending an email (in a real app, use a mail library like PHPMailer)
$resetLink = 'http://localhost:8000/reset-password.html?token=' . $token;

// For debugging, you can log the email content or display it
global $log;
$log->warning("Password Reset Link for " . $email . ": " . $resetLink);

echo json_encode(['success' => true, 'message' => 'If your email address is in our database, you will receive a password reset link.']);
