<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../Plan.php';

header('Content-Type: application/json');

$db = new App\Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
$planModel = new App\Plan($db);

$plans = $planModel->getAllPlans();

echo json_encode(['success' => true, 'plans' => $plans]);
