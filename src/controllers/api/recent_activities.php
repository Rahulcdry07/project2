<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/logger.php';
require_once __DIR__ . '/../../ActivityLogger.php';
require_once __DIR__ . '/../../User.php';

use Psr\Log\LoggerInterface;

header('Content-Type: application/json');

// Only allow admin to view all activities, otherwise show user's own activities
$userId = null;
if (isset($_SESSION['user_id'])) {
    $userModel = new App\User(new App\Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT), $log);
    $loggedInUser = $userModel->getUserById($_SESSION['user_id']);
    if ($loggedInUser && $loggedInUser['role'] !== 'admin') {
        $userId = $_SESSION['user_id'];
    }
}

$db = new App\Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
$activityLogger = new App\ActivityLogger($db);

if ($userId) {
    // Fetch activities for a specific user
    $activities = $activityLogger->getRecentActivitiesForUser($userId);
} else {
    // Fetch all activities (only for admin, handled by frontend check)
    $activities = $activityLogger->getRecentActivities();
}

echo json_encode(['success' => true, 'activities' => $activities]);
