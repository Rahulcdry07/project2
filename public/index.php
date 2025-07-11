<?php
session_start();
ob_start();

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../src/config/config.php';
require_once __DIR__ . '/../src/config/logger.php';

ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Set secure and httponly flags for session cookies
ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
ini_set('session.save_path', __DIR__ . '/../tmp/sessions');

use App\Router;
use App\UserController;
use App\AdminController;
use App\ApiController;
use App\Database;
use App\User;
use App\ActivityLogger;
use App\Plan;
use App\Subscription;

$db = new App\Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
$userModel = new User($db, $log);
$activityLogger = new ActivityLogger($db);
$planModel = new Plan($db);
$subscriptionModel = new Subscription($db);
$userController = new UserController($db, $log, $userModel, $activityLogger);
$adminController = new AdminController($db, $log, $userModel, $activityLogger);
$apiController = new ApiController($db, $log, $userModel, $activityLogger, $planModel, $subscriptionModel);

$requestUri = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');

$router = new Router($userController, $adminController, $apiController);
$router->route($requestUri);
