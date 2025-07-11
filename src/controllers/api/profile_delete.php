<?php

require_once __DIR__ . '/../../config/config.php';
require_once __DIR__ . '/../../config/logger.php';
require_once __DIR__ . '/../../User.php';
require_once __DIR__ . '/../../Database.php';

use App\User;
use App\Database;
use Psr\Log\LoggerInterface;

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = $_SESSION['user_id'];

    $db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
    $userModel = new App\User($db, $log);

    if ($userModel->deleteUser($userId)) {
        // Destroy session after successful deletion
        $_SESSION = array();
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
        session_destroy();

        echo json_encode(['success' => true, 'message' => 'Your account has been deleted successfully.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete account.']);
    }
}
