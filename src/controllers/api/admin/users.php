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

$userModel = new App\User($db, $log);
$users = $userModel->getAllUsers();

echo json_encode(['success' => true, 'users' => $users]);
