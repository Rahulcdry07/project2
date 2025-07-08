<?php

require_once __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../utils/SecurityUtils.php';
require_once __DIR__ . '/../utils/ValidationUtils.php';

class UserController extends Controller
{
    private $userModel;
    private $securityUtils;
    private $validationUtils;

    public function __construct()
    {
        $this->userModel = new User();
        $this->securityUtils = new SecurityUtils();
        $this->validationUtils = new ValidationUtils();
    }

    public function register()
    {
        // Only allow POST requests
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            return;
        }

        // Set JSON response header
        header('Content-Type: application/json');

        try {
            // Get and validate CSRF token
            $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
            if (!$this->securityUtils->validateCSRFToken($token)) {
                throw new Exception('Invalid CSRF token');
            }

            // Get input data
            $name = trim($_POST['name'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $password = $_POST['password'] ?? '';
            $confirmPassword = $_POST['confirm_password'] ?? '';
            $terms = $_POST['terms'] ?? false;

            // Security logging
            $this->securityUtils->logSecurityEvent('registration_attempt', [
                'ip' => $_SERVER['REMOTE_ADDR'],
                'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? '',
                'email' => $email
            ]);

            // Validate input
            $this->validateRegistrationInput($name, $email, $password, $confirmPassword, $terms);

            // Check for suspicious patterns
            if ($this->securityUtils->detectSuspiciousInput($name . ' ' . $email)) {
                $this->securityUtils->logSecurityEvent('suspicious_registration', [
                    'ip' => $_SERVER['REMOTE_ADDR'],
                    'email' => $email,
                    'name' => $name
                ]);
                throw new Exception('Registration data appears suspicious');
            }

            // Check if email already exists
            if ($this->userModel->findByEmail($email)) {
                throw new Exception('An account with this email already exists');
            }

            // Create user
            $userId = $this->userModel->create([
                'name' => $name,
                'email' => $email,
                'password' => password_hash($password, PASSWORD_DEFAULT, ['cost' => 12]),
                'created_at' => date('Y-m-d H:i:s'),
                'email_verified' => 0,
                'is_active' => 1
            ]);

            if (!$userId) {
                throw new Exception('Failed to create user account');
            }

            // Log successful registration
            $this->securityUtils->logSecurityEvent('user_registered', [
                'user_id' => $userId,
                'email' => $email,
                'ip' => $_SERVER['REMOTE_ADDR']
            ]);

            // Return success response
            echo json_encode([
                'success' => true,
                'message' => 'Registration successful! You can now log in.',
                'user_id' => $userId
            ]);
        } catch (Exception $e) {
            // Log error
            error_log('Registration error: ' . $e->getMessage());

            // Return error response
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
    }

    private function validateRegistrationInput($name, $email, $password, $confirmPassword, $terms)
    {
        // Validate name
        if (empty($name)) {
            throw new Exception('Name is required');
        }
        if (strlen($name) < 2 || strlen($name) > 100) {
            throw new Exception('Name must be between 2 and 100 characters');
        }
        if (!preg_match('/^[a-zA-Z\s\'-]+$/', $name)) {
            throw new Exception('Name contains invalid characters');
        }

        // Validate email
        if (empty($email)) {
            throw new Exception('Email is required');
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Please enter a valid email address');
        }
        if (strlen($email) > 255) {
            throw new Exception('Email address is too long');
        }

        // Validate password
        if (empty($password)) {
            throw new Exception('Password is required');
        }
        if (strlen($password) < 8) {
            throw new Exception('Password must be at least 8 characters long');
        }
        if (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/', $password)) {
            throw new Exception('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
        }

        // Validate password confirmation
        if ($password !== $confirmPassword) {
            throw new Exception('Passwords do not match');
        }

        // Validate terms acceptance
        if (!$terms) {
            throw new Exception('You must accept the terms and conditions');
        }
    }

    public function checkEmail()
    {
        // Only allow POST requests
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            return;
        }

        header('Content-Type: application/json');

        try {
            $email = trim($_POST['email'] ?? '');

            if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                echo json_encode(['available' => false, 'message' => 'Invalid email format']);
                return;
            }

            $exists = $this->userModel->findByEmail($email);

            echo json_encode([
                'available' => !$exists,
                'message' => $exists ? 'Email already exists' : 'Email available'
            ]);
        } catch (Exception $e) {
            echo json_encode(['available' => false, 'message' => 'Error checking email']);
        }
    }
}
