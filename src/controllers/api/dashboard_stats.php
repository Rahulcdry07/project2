<?php
require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../User.php';
require_once __DIR__ . '/../../Database.php';

header('Content-Type: application/json');

session_start();

// Optional: Restrict access to admin users if these stats are sensitive
// if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'admin') {
//     echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
//     exit;
// }

$db = new App\Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, 8889);
$userModel = new App\User($db);

$totalUsers = $userModel->getTotalUsers();
$newRegistrationsToday = $userModel->getNewRegistrationsToday();

echo json_encode([
    'success' => true,
    'stats' => [
        'total_users' => $totalUsers,
        'new_registrations_today' => $newRegistrationsToday,
        'online_users' => 'N/A' // More complex to implement, will keep as N/A for now
    ]
]);
