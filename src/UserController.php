<?php

namespace App;

use Psr\Log\LoggerInterface;

class UserController extends BaseController
{
    private $db;
    private $logger;
    private $userModel;
    private $activityLogger;

    public function __construct(Database $db, LoggerInterface $logger, User $userModel, ActivityLogger $activityLogger)
    {
        $this->db = $db;
        $this->logger = $logger;
        $this->userModel = $userModel;
        $this->activityLogger = $activityLogger;
    }

    public function register()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $name = trim($_POST['name'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';

            $sanitizedName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');

            if (empty($name) || empty($email) || empty($password)) {
                $this->jsonResponse(['success' => false, 'message' => 'All fields are required.']);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->jsonResponse(['success' => false, 'message' => 'Invalid email format.']);
                return;
            }

            $passwordValidation = $this->validatePasswordStrength($password);
            if (!$passwordValidation['isValid']) {
                $this->jsonResponse(['success' => false, 'message' => $passwordValidation['message']]);
                return;
            }

            if ($this->userModel->getUserByEmail($email)) {
                $this->jsonResponse(['success' => false, 'message' => 'Email already registered.']);
                return;
            }

            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $userId = $this->userModel->register($sanitizedName, $email, $hashedPassword);

            if ($userId) {
                $this->activityLogger->logActivity($userId, 'registration', 'New user registered.', $_SERVER['REMOTE_ADDR']);
                $verificationToken = bin2hex(random_bytes(32));
                $this->userModel->setEmailVerificationToken($userId, $verificationToken);

                $verificationLink = 'http://localhost:8000/verify-email.html?token=' . $verificationToken;
                $this->logger->warning("Email Verification Link for " . $email . ": " . $verificationLink);

                $this->jsonResponse(['success' => true, 'message' => 'Registration successful! Please check your email for verification.']);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Registration failed. Please try again.']);
            }
        }
    }

    private function validatePasswordStrength($password)
    {
        $minLength = 8;
        $hasUppercase = preg_match('/[A-Z]/', $password);
        $hasLowercase = preg_match('/[a-z]/', $password);
        $hasNumber = preg_match('/\d/', $password);
        $hasSpecialChar = preg_match('/[!@#$%^&*(),.?":{}|<>]/u', $password);

        $message = '';
        $isValid = true;

        if (strlen($password) < $minLength) {
            $message .= "Password must be at least {$minLength} characters long. ";
            $isValid = false;
        }
        if (!$hasUppercase) {
            $message .= 'Must contain at least one uppercase letter. ';
            $isValid = false;
        }
        if (!$hasLowercase) {
            $message .= 'Must contain at least one lowercase letter. ';
            $isValid = false;
        }
        if (!$hasNumber) {
            $message .= 'Must contain at least one number. ';
            $isValid = false;
        }
        if (!$hasSpecialChar) {
            $message .= 'Must contain at least one special character. ';
            $isValid = false;
        }

        return ['isValid' => $isValid, 'message' => trim($message)];
    }

    public function login()
    {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (!isset($_POST['csrf_token']) || !isset($_SESSION['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
                $this->jsonResponse(['success' => false, 'message' => 'Invalid CSRF token.']);
                return;
            }

            $email = $_POST['email'];
            $password = $_POST['password'];

            $loggedInUser = $this->userModel->login($email, $password);

            if ($loggedInUser === 'email_not_found') {
                $this->jsonResponse(['success' => false, 'message' => 'Email not found.']);
            } elseif ($loggedInUser === 'invalid_password') {
                $this->jsonResponse(['success' => false, 'message' => 'Invalid password.']);
            } elseif (is_array($loggedInUser)) {
                if (!$loggedInUser['is_verified']) {
                    $this->jsonResponse(['success' => false, 'message' => 'Please verify your email address to log in.']);
                    return;
                }
                session_regenerate_id(true);
                $_SESSION['user_id'] = $loggedInUser['id'];
                $_SESSION['user_role'] = $loggedInUser['role'];

                $this->activityLogger->logActivity($loggedInUser['id'], 'login', 'User logged in.', $_SERVER['REMOTE_ADDR']);

                if (isset($_POST['remember_me']) && $_POST['remember_me'] === 'on') {
                    $selector = bin2hex(random_bytes(16));
                    $validator = bin2hex(random_bytes(32));
                    $db_token = $selector . ':' . password_hash($validator, PASSWORD_DEFAULT);
                    $cookie_token = $selector . ':' . $validator;
                    $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
                    $this->userModel->setRememberToken($loggedInUser['id'], $db_token, $expires);
                    setcookie('remember_me', $cookie_token, ['expires' => strtotime('+30 days'), 'path' => '/', 'httponly' => true, 'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'samesite' => 'Strict']);
                }

                $this->jsonResponse(['success' => true, 'user' => $loggedInUser]);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'An unexpected login error occurred.']);
            }
        }
    }

    public function logout()
    {
        $this->checkAuth();
        $this->logger->info('Logout initiated.');

        // Clear remember me token if it exists
        if (isset($_SESSION['user_id'])) {
            $this->userModel->clearRememberToken($_SESSION['user_id']);
            $this->logger->info('Remember me token cleared for user ID: ' . $_SESSION['user_id']);
        }

        // Clear remember me cookie
        setcookie('remember_me', '', ['expires' => time() - 3600, 'path' => '/', 'httponly' => true, 'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off', 'samesite' => 'Lax']);
        $this->logger->info('Remember me cookie cleared.');

        // Unset all of the session variables.
        $_SESSION = array();
        $this->logger->info('Session variables unset.');

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
                isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
                $params["httponly"]
            );
            $this->logger->info('Session cookie cleared.');
        }

        // Finally, destroy the session.
        session_destroy();
        $this->logger->info('Session destroyed.');

        $this->jsonResponse(['success' => true, 'message' => 'Logged out successfully.']);
    }

    public function forgotPassword()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $email = $data['email'] ?? '';

        if (empty($email)) {
            $this->jsonResponse(['success' => false, 'message' => 'Email is required.']);
            return;
        }

        $user = $this->userModel->getUserByEmail($email);

        if ($user) {
            $token = bin2hex(random_bytes(32));
            $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));
            $this->userModel->updateResetToken($user['id'], $token, $expires);
            $resetLink = 'http://localhost:8000/reset-password.html?token=' . $token;
            $this->logger->warning("Password Reset Link for " . $email . ": " . $resetLink);
        }

        $this->jsonResponse(['success' => true, 'message' => 'If your email address is in our database, you will receive a password reset link.']);
    }

    public function resetPassword()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $token = $data['token'] ?? '';
        $newPassword = $data['password'] ?? '';

        if (empty($token) || empty($newPassword)) {
            $this->jsonResponse(['success' => false, 'message' => 'Token and new password are required.']);
            return;
        }

        $user = $this->userModel->getUserByResetToken($token);

        if (!$user || strtotime($user['reset_token_expires_at']) < time()) {
            $this->jsonResponse(['success' => false, 'message' => 'Invalid or expired reset token.']);
            return;
        }

        $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
        $this->userModel->updatePassword($user['id'], $hashedPassword);

        $this->jsonResponse(['success' => true, 'message' => 'Your password has been reset successfully. You can now log in.']);
    }

    public function verifyEmail()
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $token = $data['token'] ?? '';

        if (empty($token)) {
            $this->jsonResponse(['success' => false, 'message' => 'Verification token is missing.']);
            return;
        }

        $user = $this->userModel->getUserByVerificationToken($token);

        if (!$user) {
            $this->jsonResponse(['success' => false, 'message' => 'Invalid or expired verification token.']);
            return;
        }

        if ($this->userModel->verifyEmail($token)) {
            $this->jsonResponse(['success' => true, 'message' => 'Email successfully verified!']);
        } else {
            $this->jsonResponse(['success' => false, 'message' => 'Failed to verify email. Please try again.']);
        }
    }

    public function api_profile()
    {
        $this->checkAuth();
        $userId = $_SESSION['user_id'];
        $user = $this->userModel->getUserById($userId);

        if ($user) {
            $this->jsonResponse(['success' => true, 'user' => [
                'name' => $user['name'],
                'email' => $user['email'],
                'created_at' => $user['created_at'],
                'is_verified' => $user['is_verified'],
                'role' => $user['role']
            ]]);
        } else {
            $this->jsonResponse(['success' => false, 'message' => 'User not found.']);
        }
    }

    public function apiProfileUpdate()
    {
        $this->checkAuth();
        if (!isset($_POST['csrf_token']) || !isset($_SESSION['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
            $this->jsonResponse(['success' => false, 'message' => 'Invalid CSRF token.']);
            return;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $userId = $_SESSION['user_id'];
            $name = trim($_POST['name'] ?? '');
            $email = trim($_POST['email'] ?? '');

            $sanitizedName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');

            if (empty($name) || empty($email)) {
                $this->jsonResponse(['success' => false, 'message' => 'Name and email are required.']);
                return;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $this->jsonResponse(['success' => false, 'message' => 'Invalid email format.']);
                return;
            }

            $existingUser = $this->userModel->getUserByEmail($email);
            if ($existingUser && $existingUser['id'] != $userId) {
                $this->jsonResponse(['success' => false, 'message' => 'Email already taken by another user.']);
                return;
            }

            if ($this->userModel->updateProfile($userId, $sanitizedName, $email)) {
                $this->activityLogger->logActivity($userId, 'profile_update', 'User updated their profile.', $_SERVER['REMOTE_ADDR']);
                $this->jsonResponse(['success' => true, 'message' => 'Profile updated successfully!']);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to update profile.']);
            }
        }
    }

    public function changePassword()
    {
        $this->checkAuth();
        if (!isset($_POST['csrf_token']) || !isset($_SESSION['csrf_token']) || $_POST['csrf_token'] !== $_SESSION['csrf_token']) {
            $this->jsonResponse(['success' => false, 'message' => 'Invalid CSRF token.']);
            return;
        }

        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $userId = $_SESSION['user_id'];
            $currentPassword = $_POST['current_password'] ?? '';
            $newPassword = $_POST['new_password'] ?? '';

            if (empty($currentPassword) || empty($newPassword)) {
                $this->jsonResponse(['success' => false, 'message' => 'Current and new passwords are required.']);
                return;
            }

            $passwordValidation = $this->validatePasswordStrength($newPassword);
            if (!$passwordValidation['isValid']) {
                $this->jsonResponse(['success' => false, 'message' => $passwordValidation['message']]);
                return;
            }

            $user = $this->userModel->getUserById($userId);

            if (!$user || !password_verify($currentPassword, $user['password'])) {
                $this->jsonResponse(['success' => false, 'message' => 'Incorrect current password.']);
                return;
            }

            $hashedNewPassword = password_hash($newPassword, PASSWORD_DEFAULT);

            if ($this->userModel->updatePassword($userId, $hashedNewPassword)) {
                $this->activityLogger->logActivity($userId, 'password_change', 'User changed their password.', $_SERVER['REMOTE_ADDR']);
                $this->jsonResponse(['success' => true, 'message' => 'Password changed successfully!']);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to change password.']);
            }
        }
    }

    public function deleteProfile()
    {
        $this->checkAuth();
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $userId = $_SESSION['user_id'];

            if ($this->userModel->deleteUser($userId)) {
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

                $this->jsonResponse(['success' => true, 'message' => 'Your account has been deleted successfully.']);
            } else {
                $this->jsonResponse(['success' => false, 'message' => 'Failed to delete account.']);
            }
        }
    }
}