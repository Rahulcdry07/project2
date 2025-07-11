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

if (empty($token)) {
    echo json_encode(['success' => false, 'message' => 'Verification token is missing.']);
    exit;
}

$userModel = new App\User($db, $log);
$user = $userModel->getUserByVerificationToken($token);

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'Invalid or expired verification token.']);
    exit;
}

// Verify the email
if ($userModel->verifyEmail($token)) {
    echo json_encode(['success' => true, 'message' => 'Email successfully verified!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to verify email. Please try again.']);
}
