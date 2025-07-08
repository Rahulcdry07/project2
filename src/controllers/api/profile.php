<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../User.php';

use App\User;
use App\Database;

header('Content-Type: application/json');

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, 8889);

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

$userId = $_SESSION['user_id'];
$userModel = new App\User($db);
$user = $userModel->getUserById($userId);

if ($user) {
    echo json_encode(['success' => true, 'user' => [
        'name' => $user['name'],
        'email' => $user['email'],
        'created_at' => $user['created_at'],
        'is_verified' => $user['is_verified'],
        'role' => $user['role']
    ]]);
} else {
    echo json_encode(['success' => false, 'message' => 'User not found.']);
}
