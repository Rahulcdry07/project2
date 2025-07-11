<?php

require_once __DIR__ . '/../../../config/config.php';
require_once __DIR__ . '/../../../config/logger.php';
require_once __DIR__ . '/../../../User.php';
require_once __DIR__ . '/../../../Subscription.php';

use Psr\Log\LoggerInterface;

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$planId = $data['plan_id'] ?? null;
$userId = $_SESSION['user_id'];

if (empty($planId)) {
    echo json_encode(['success' => false, 'message' => 'Plan ID is required.']);
    exit;
}

$db = new App\Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
$userModel = new App\User($db, $log);
$subscriptionModel = new App\Subscription($db);

// Assign plan to user
if ($userModel->assignPlan($userId, $planId)) {
    // Create a subscription record (e.g., for 30 days)
    $endDate = date('Y-m-d H:i:s', strtotime('+30 days'));
    $subscriptionModel->createSubscription($userId, $planId, $endDate);

    echo json_encode(['success' => true, 'message' => 'Subscription successful!']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to subscribe.']);
}
