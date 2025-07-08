<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../User.php';

use App\User;
use App\Database;

header('Content-Type: application/json');

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, 8889);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? ''; // Password should not be trimmed

    // Sanitize name for display (e.g., on dashboard)
    $sanitizedName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');

    // Basic server-side validation
    if (empty($name) || empty($email) || empty($password)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
        exit;
    }

    if (strlen($password) < 6) {
        echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters long.']);
        exit;
    }

    $userModel = new User($db);

    // Check if email already exists
    if ($userModel->getUserByEmail($email)) {
        echo json_encode(['success' => false, 'message' => 'Email already registered.']);
        exit;
    }

    // Hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Register the user
    $userId = $userModel->register($sanitizedName, $email, $hashedPassword);

    if ($userId) {
        // Log registration activity
        $activityLogger = new App\ActivityLogger($db);
        $activityLogger->logActivity($userId, 'registration', 'New user registered.', $_SERVER['REMOTE_ADDR']);

        // Generate and store email verification token
        $verificationToken = bin2hex(random_bytes(32));
        $setTokenResult = $userModel->setEmailVerificationToken($userId, $verificationToken);
        var_dump("Set Token Result: ", $setTokenResult);

        // Simulate sending verification email
        $verificationLink = 'http://localhost:8000/verify-email.html?token=' . $verificationToken;
        global $log;
        $log->warning("Email Verification Link for " . $email . ": " . $verificationLink);

        echo json_encode(['success' => true, 'message' => 'Registration successful! Please check your email for verification.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed. Please try again.']);
    }
}
