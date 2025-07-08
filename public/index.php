<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set secure and httponly flags for session cookies
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1);

session_start();

// Auto-login with remember me token
if (!isset($_SESSION['user_id']) && isset($_COOKIE['remember_me'])) {
    require_once __DIR__ . '/../User.php';
    require_once __DIR__ . '/../src/config/config.php';
    require_once __DIR__ . '/../src/Database.php';

    $db = new App\Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, 8889);
    $userModel = new App\User($db);

    $rememberToken = $_COOKIE['remember_me'];
    $user = $userModel->getUserByRememberToken($rememberToken);

    if ($user) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_role'] = $user['role'];
        // Optionally, regenerate session ID for security
        session_regenerate_id(true);
    } else {
        // Invalid or expired token, clear the cookie
        setcookie('remember_me', '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'secure' => true, 'samesite' => 'Lax']);
    }
}

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/config/logger.php';

use App\Router;
use App\Controller;

$requestUri = trim(str_replace('index.php', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)), '/');

$requestMethod = $_SERVER['REQUEST_METHOD'];

// Define routes
$routes = [
    '' => 'home', // Default route for the root URL
    'register' => 'register',
    'api/users' => 'api/users',
    'login' => 'login',
    'csrf_token' => 'csrf_token',
    'logout' => 'logout',
    'forgot-password' => 'forgot_password',
    'reset-password' => 'reset_password',
    'verify-email' => 'verify_email',
    'api/profile' => 'api_profile',
    'api/profile/update' => 'api_profile_update',
    'api/profile/change-password' => 'api_profile_change_password',
    'api/profile/delete' => 'api_profile_delete',
    'admin' => 'admin',
    'api/admin/users' => 'api_admin_users',
    'api/admin/user/role' => 'api_admin_user_role',
    'api/admin/user/delete' => 'api_admin_user_delete',
    'api/recent-activities' => 'api_recent_activities',
    'api/dashboard-stats' => 'api_dashboard_stats',
];

$routeName = 'not_found'; // Default to not found
foreach ($routes as $uri => $name) {
    if ($requestUri === $uri) {
        $routeName = $name;
        break;
    }
}

if ($routeName === 'admin' && (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin')) {
    header('Location: /dashboard.html'); // Redirect to dashboard or login
    exit;
}

$router = new Router(new Controller());
if ($requestMethod === 'POST') {
    $router->route($routeName, $_POST);
} else {
    $router->route($routeName, $_GET);
}
