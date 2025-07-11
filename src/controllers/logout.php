<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../config/logger.php';
require_once __DIR__ . '/../User.php';
require_once __DIR__ . '/../Database.php';

use Psr\Log\LoggerInterface;

header('Content-Type: application/json');

// Clear remember me token from database and cookie
if (isset($_SESSION['user_id'])) {
    $db = new App\Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
    $userModel = new App\User($db, $log);
    $userModel->clearRememberToken($_SESSION['user_id']);
}
setcookie('remember_me', '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'secure' => true, 'samesite' => 'Lax']);

// Unset all of the session variables.
$_SESSION = array();

// If it's desired to kill the session, also delete the session cookie.
// Note: This will destroy the session, and not just the session data!
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(),
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Finally, destroy the session.
session_destroy();

header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Logged out successfully.']);
exit;
