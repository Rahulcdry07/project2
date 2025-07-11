<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/src/config/config.php';
require_once __DIR__ . '/src/config/logger.php';

use App\Database;
use App\User;

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
$userModel = new User($db, $log);

$email = 'admin@example.com';
$password = 'adminpassword';
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$name = 'Admin User';
$role = 'admin';
$isVerified = 1; // Admin users are typically verified by default

$sql = "INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, ?)";
$stmt = $db->getConnection()->prepare($sql);

try {
    if ($stmt->execute([$name, $email, $hashedPassword, $role, $isVerified])) {
        echo "Admin user inserted successfully!";
    } else {
        echo "Error inserting admin user.";
    }
} catch (PDOException $e) {
    echo "Error inserting admin user: " . $e->getMessage();
}
