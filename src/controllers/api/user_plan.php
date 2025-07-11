<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/logger.php';
require_once __DIR__ . '/../../User.php';
require_once __DIR__ . '/../../Subscription.php';

use Psr\Log\LoggerInterface;

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

$userId = $_SESSION['user_id'];

$db = new App\Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
$userModel = new App\User($db, $log);
$subscriptionModel = new App\Subscription($db);

$userPlan = $userModel->getUserPlan($userId);

if ($userPlan) {
    echo json_encode(['success' => true, 'plan' => $userPlan]);
} else {
    echo json_encode(['success' => false, 'message' => 'No active plan found.']);
}
