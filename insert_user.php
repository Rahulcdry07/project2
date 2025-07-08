<?php
require_once __DIR__ . '/src/config/config.php';
require_once __DIR__ . '/vendor/autoload.php';

use App\Database;
use App\User;

$db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, 8889);

$email = 'test@example.com';
$password = 'password123';
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

$data = [
    'name' => 'Test User',
    'email' => $email,
    'password' => $hashedPassword
];

try {
    $db->insert('users', $data);
    echo "User inserted successfully!";
} catch (PDOException $e) {
    echo "Error inserting user: " . $e->getMessage();
}
