<?php

// Load environment variables from .env file
if (file_exists(__DIR__ . '/../../.env')) {
    $lines = file(__DIR__ . '/../../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!array_key_exists($name, $_SERVER) && !array_key_exists($name, $_ENV)) {
            putenv(sprintf('%s=%s', $name, $value));
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}

if (!defined('DB_HOST')) {
    define('DB_HOST', $_ENV['DB_HOST'] ?? '127.0.0.1');
}
if (!defined('DB_USER')) {
    define('DB_USER', $_ENV['DB_USER'] ?? 'root');
}
if (!defined('DB_PASSWORD')) {
    define('DB_PASSWORD', $_ENV['DB_PASSWORD'] ?? '');
}
if (!defined('DB_NAME')) {
    if (defined('PHPUNIT_TESTSUITE')) {
        define('DB_NAME', 'registration_test');
    } else {
        define('DB_NAME', $_ENV['DB_NAME'] ?? 'registration_db');
    }
}
if (!defined('DB_PORT')) {
    define('DB_PORT', $_ENV['DB_PORT'] ?? 3306);
}

// Error logging
ini_set('error_log', __DIR__ . '/../logs/app.log');