<?php

use PHPUnit\Framework\TestCase;
use App\TestableUserController;
use App\Database;
use App\User;
use App\ActivityLogger;
use Psr\Log\LoggerInterface;

class UserControllerTest extends TestCase
{
    private $dbMock;
    private $loggerMock;
    private $userModelMock;
    private $activityLoggerMock;
    private $userController;

    protected function setUp(): void
    {
        $this->dbMock = $this->createMock(Database::class);
        $this->loggerMock = $this->createMock(LoggerInterface::class);
        $this->userModelMock = $this->createMock(User::class);
        $this->activityLoggerMock = $this->createMock(ActivityLogger::class);

        $this->userController = new TestableUserController(
            $this->dbMock,
            $this->loggerMock,
            $this->userModelMock,
            $this->activityLoggerMock
        );
    }

    public function testRegisterSuccess()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['name'] = 'Test User';
        $_POST['email'] = 'test@example.com';
        $_POST['password'] = 'password123';

        $this->userModelMock->method('getUserByEmail')->willReturn(null);
        $this->userModelMock->expects($this->once())->method('register')->willReturn(1);
        $this->userModelMock->expects($this->once())->method('setEmailVerificationToken');
        $this->activityLoggerMock->expects($this->once())->method('logActivity');
        $this->loggerMock->expects($this->once())->method('warning');

        ob_start();
        $this->userController->register();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'Registration successful! Please check your email for verification.']),
            $output
        );
    }

    public function testRegisterEmailExists()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['name'] = 'Test User';
        $_POST['email'] = 'test@example.com';
        $_POST['password'] = 'password123';

        $this->userModelMock->expects($this->once())->method('getUserByEmail')->willReturn(['id' => 1, 'email' => 'test@example.com']);

        ob_start();
        $this->userController->register();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Email already registered.']),
            $output
        );
    }

    public function testLoginSuccess()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['email'] = 'test@example.com';
        $_POST['password'] = 'password123';
        $_POST['csrf_token'] = 'test_token';
        $_SESSION['csrf_token'] = 'test_token';

        $user = ['id' => 1, 'email' => 'test@example.com', 'is_verified' => 1, 'role' => 'user'];
        $this->userModelMock->method('login')->willReturn($user);

        ob_start();
        $this->userController->login();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'user' => $user]),
            $output
        );
    }

    public function testLoginEmailNotFound()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['email'] = 'test@example.com';
        $_POST['password'] = 'password123';
        $_POST['csrf_token'] = 'test_token';
        $_SESSION['csrf_token'] = 'test_token';

        $this->userModelMock->method('login')->willReturn('email_not_found');

        ob_start();
        $this->userController->login();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Email not found.']),
            $output
        );
    }

    public function testLoginInvalidPassword()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['email'] = 'test@example.com';
        $_POST['password'] = 'password123';
        $_POST['csrf_token'] = 'test_token';
        $_SESSION['csrf_token'] = 'test_token';

        $this->userModelMock->method('login')->willReturn('invalid_password');

        ob_start();
        $this->userController->login();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Invalid password.']),
            $output
        );
    }

    public function testLoginUnverifiedEmail()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['email'] = 'test@example.com';
        $_POST['password'] = 'password123';
        $_POST['csrf_token'] = 'test_token';
        $_SESSION['csrf_token'] = 'test_token';

        $user = ['id' => 1, 'email' => 'test@example.com', 'is_verified' => 0, 'role' => 'user'];
        $this->userModelMock->method('login')->willReturn($user);

        ob_start();
        $this->userController->login();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Please verify your email address to log in.']),
            $output
        );
    }

    public function testLoginRememberMe()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['email'] = 'test@example.com';
        $_POST['password'] = 'password123';
        $_POST['csrf_token'] = 'test_token';
        $_SESSION['csrf_token'] = 'test_token';
        $_POST['remember_me'] = 'on';

        $user = ['id' => 1, 'email' => 'test@example.com', 'is_verified' => 1, 'role' => 'user'];
        $this->userModelMock->method('login')->willReturn($user);
        $this->userModelMock->expects($this->once())->method('setRememberToken');

        ob_start();
        $this->userController->login();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'user' => $user]),
            $output
        );
    }

    public function testLogout()
    {
        $_SESSION['user_id'] = 1;

        $this->userModelMock->expects($this->once())->method('clearRememberToken');

        ob_start();
        $this->userController->logout();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'Logged out successfully.']),
            $output
        );
        $this->assertEmpty($_SESSION);
    }

    public function testForgotPasswordSuccess()
    {
        $email = 'test@example.com';
        $user = ['id' => 1, 'email' => $email];

        $this->userModelMock->method('getUserByEmail')->willReturn($user);
        $this->userModelMock->expects($this->once())->method('updateResetToken');
        $this->loggerMock->expects($this->once())->method('warning');

        $this->userController->inputStream = 'data://text/plain,' . json_encode(['email' => $email]);

        ob_start();
        $this->userController->forgotPassword();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'If your email address is in our database, you will receive a password reset link.']),
            $output
        );
    }

    public function testForgotPasswordEmptyEmail()
    {
        $this->userController->inputStream = 'data://text/plain,' . json_encode(['email' => '']);

        ob_start();
        $this->userController->forgotPassword();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Email is required.']),
            $output
        );
    }

    public function testForgotPasswordEmailNotFound()
    {
        $email = 'nonexistent@example.com';
        $this->userModelMock->method('getUserByEmail')->willReturn(null);
        $this->userModelMock->expects($this->never())->method('updateResetToken');
        $this->loggerMock->expects($this->never())->method('warning');

        $this->userController->inputStream = 'data://text/plain,' . json_encode(['email' => $email]);

        ob_start();
        $this->userController->forgotPassword();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'If your email address is in our database, you will receive a password reset link.']),
            $output
        );
    }

    public function testResetPassword()
    {
        $token = 'test_token';
        $password = 'new_password';
        $user = ['id' => 1, 'reset_token_expires_at' => date('Y-m-d H:i:s', strtotime('+1 hour'))];

        $this->userModelMock->method('getUserByResetToken')->willReturn($user);
        $this->userModelMock->expects($this->once())->method('updatePassword');

        $this->userController->inputStream = 'data://text/plain,' . json_encode(['token' => $token, 'password' => $password]);

        ob_start();
        $this->userController->resetPassword();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'Your password has been reset successfully. You can now log in.']),
            $output
        );
    }

    public function testVerifyEmail()
    {
        $token = 'test_token';
        $user = ['id' => 1];

        $this->userModelMock->method('getUserByVerificationToken')->willReturn($user);
        $this->userModelMock->method('verifyEmail')->willReturn(true);

        $this->userController->inputStream = 'data://text/plain,' . json_encode(['token' => $token]);

        ob_start();
        $this->userController->verifyEmail();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'Email successfully verified!']),
            $output
        );
    }

    public function testGetProfile()
    {
        $_SESSION['user_id'] = 1;
        $user = ['name' => 'Test User', 'email' => 'test@example.com', 'created_at' => '2023-01-01 00:00:00', 'is_verified' => 1, 'role' => 'user'];

        $this->userModelMock->method('getUserById')->willReturn($user);

        ob_start();
        $this->userController->getProfile();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'user' => $user]),
            $output
        );
    }

    public function testUpdateProfile()
    {
        $_SESSION['user_id'] = 1;
        $_POST['name'] = 'New Name';
        $_POST['email'] = 'new@example.com';
        $_POST['csrf_token'] = 'test_token';
        $_SESSION['csrf_token'] = 'test_token';

        $this->userModelMock->method('getUserByEmail')->willReturn(null);
        $this->userModelMock->method('updateProfile')->willReturn(true);
        $this->activityLoggerMock->expects($this->once())->method('logActivity');

        ob_start();
        $this->userController->updateProfile();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'Profile updated successfully!']),
            $output
        );
    }

    public function testChangePassword()
    {
        $_SESSION['user_id'] = 1;
        $_POST['current_password'] = 'password123';
        $_POST['new_password'] = 'new_password';
        $_POST['csrf_token'] = 'test_token';
        $_SESSION['csrf_token'] = 'test_token';

        $user = ['id' => 1, 'password' => password_hash('password123', PASSWORD_DEFAULT)];
        $this->userModelMock->method('getUserById')->willReturn($user);
        $this->userModelMock->method('updatePassword')->willReturn(true);
        $this->activityLoggerMock->expects($this->once())->method('logActivity');

        ob_start();
        $this->userController->changePassword();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'Password changed successfully!']),
            $output
        );
    }

    public function testDeleteProfile()
    {
        $_SESSION['user_id'] = 1;
        $_SERVER['REQUEST_METHOD'] = 'POST';

        $this->userModelMock->method('deleteUser')->willReturn(true);

        ob_start();
        $this->userController->deleteProfile();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => true, 'message' => 'Your account has been deleted successfully.']),
            $output
        );
        $this->assertEmpty($_SESSION);
    }

    public function testRegisterEmptyFields()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['name'] = '';
        $_POST['email'] = '';
        $_POST['password'] = '';

        ob_start();
        $this->userController->register();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'All fields are required.']),
            $output
        );
    }

    public function testRegisterInvalidEmail()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['name'] = 'Test User';
        $_POST['email'] = 'invalid-email';
        $_POST['password'] = 'password123';

        ob_start();
        $this->userController->register();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Invalid email format.']),
            $output
        );
    }

    public function testRegisterWeakPassword()
    {
        $_SERVER['REQUEST_METHOD'] = 'POST';
        $_POST['name'] = 'Test User';
        $_POST['email'] = 'test@example.com';
        $_POST['password'] = 'short'; // Weak password

        ob_start();
        $this->userController->register();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Password must be at least 8 characters long. Must contain at least one uppercase letter. Must contain at least one lowercase letter. Must contain at least one number. Must contain at least one special character.']),
            $output
        );
    }

    public function testResetPasswordInvalidToken()
    {
        $token = 'invalid_token';
        $password = 'new_password';

        $this->userModelMock->method('getUserByResetToken')->willReturn(null);
        $this->userModelMock->expects($this->never())->method('updatePassword');

        $this->userController->inputStream = 'data://text/plain,' . json_encode(['token' => $token, 'password' => $password]);

        ob_start();
        $this->userController->resetPassword();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Invalid or expired reset token.']),
            $output
        );
    }

    public function testResetPasswordExpiredToken()
    {
        $token = 'expired_token';
        $password = 'new_password';
        $user = ['id' => 1, 'reset_token_expires_at' => date('Y-m-d H:i:s', strtotime('-1 hour'))]; // Expired token

        $this->userModelMock->method('getUserByResetToken')->willReturn($user);
        $this->userModelMock->expects($this->never())->method('updatePassword');

        $this->userController->inputStream = 'data://text/plain,' . json_encode(['token' => $token, 'password' => $password]);

        ob_start();
        $this->userController->resetPassword();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Invalid or expired reset token.']),
            $output
        );
    }

    public function testResetPasswordEmptyPassword()
    {
        $token = 'test_token';
        $password = '';

        $this->userController->inputStream = 'data://text/plain,' . json_encode(['token' => $token, 'password' => $password]);

        ob_start();
        $this->userController->resetPassword();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Token and new password are required.']),
            $output
        );
    }

    public function testVerifyEmailInvalidToken()
    {
        $token = 'invalid_token';

        $this->userModelMock->method('getUserByVerificationToken')->willReturn(null);
        $this->userModelMock->expects($this->never())->method('verifyEmail');

        $this->userController->inputStream = 'data://text/plain,' . json_encode(['token' => $token]);

        ob_start();
        $this->userController->verifyEmail();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Invalid or expired verification token.']),
            $output
        );
    }

    public function testVerifyEmailAlreadyVerified()
    {
        $token = 'already_verified_token';
        $user = ['id' => 1, 'is_verified' => 1]; // User already verified

        $this->userModelMock->method('getUserByVerificationToken')->willReturn($user);
        $this->userModelMock->method('verifyEmail')->willReturn(false); // Simulate verifyEmail returning false if already verified

        $this->userController->inputStream = 'data://text/plain,' . json_encode(['token' => $token]);

        ob_start();
        $this->userController->verifyEmail();
        $output = ob_get_clean();

        $this->assertJsonStringEqualsJsonString(
            json_encode(['success' => false, 'message' => 'Failed to verify email. Please try again.']),
            $output
        );
    }
}
