<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../User.php';

use App\User;
use App\Database;

header('Content-Type: application/json');

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, 8889);

// Verify CSRF token
if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
    echo json_encode(['success' => false, 'message' => 'Invalid CSRF token.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $user = new User($db);
    $loggedInUser = $user->login($email, $password);

    if ($loggedInUser === 'email_not_found') {
        echo json_encode(['success' => false, 'message' => 'Email not found.']);
    } elseif ($loggedInUser === 'invalid_password') {
        echo json_encode(['success' => false, 'message' => 'Invalid password.']);
    } elseif ($loggedInUser) {
        if (!$loggedInUser['is_verified']) {
            echo json_encode(['success' => false, 'message' => 'Please verify your email address to log in.']);
            exit;
        }
        session_regenerate_id(true); // Regenerate session ID to prevent session fixation
        $_SESSION['user_id'] = $loggedInUser['id'];
        $_SESSION['user_role'] = $loggedInUser['role'];

        // Log login activity
        $activityLogger = new App\ActivityLogger($db);
        $activityLogger->logActivity($loggedInUser['id'], 'login', 'User logged in.', $_SERVER['REMOTE_ADDR']);

        // Handle "Remember Me"
        if (isset($_POST['remember_me']) && $_POST['remember_me'] === 'on') {
            $rememberToken = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+30 days')); // Token valid for 30 days
            $user->setRememberToken($loggedInUser['id'], $rememberToken, $expires);
            setcookie('remember_me', $rememberToken, ['expires' => strtotime('+30 days'), 'path' => '/', 'httponly' => true, 'secure' => true, 'samesite' => 'Lax']);
        }

        echo json_encode(['success' => true, 'user' => $loggedInUser]);
    } else {
        // This case should ideally not be reached if all specific errors are handled
        echo json_encode(['success' => false, 'message' => 'An unexpected login error occurred.']);
    }
}
