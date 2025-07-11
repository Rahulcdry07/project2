<?php

ob_start();

require_once __DIR__ . '/../config/config.php';

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

header('Content-Type: application/json');
echo json_encode(['token' => $_SESSION['csrf_token']]);

die(ob_get_clean());
