<?php

use PHPUnit\Framework\TestCase;
use App\User;
use App\Database;
use Monolog\Logger;
use Monolog\Handler\TestHandler;

class UserTest extends TestCase
{
    private $db;
    private $userModel;
    private $logger;
    private $testHandler;

    protected function setUp(): void
    {
        // Set up a test logger
        $this->testHandler = new TestHandler();
        $this->logger = new Logger('test', [$this->testHandler]);

        // Use the test database constants defined in phpunit.xml
        $this->db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
        $this->userModel = new User($this->db, $this->logger);

        // Clear and re-create the users table for each test
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS user_activities');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS user_subscriptions');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS plans');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS users');
        $this->db->getConnection()->exec('
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                reset_token VARCHAR(255) NULL,
                reset_token_expires_at DATETIME NULL,
                is_verified TINYINT(1) DEFAULT 0,
                email_verification_token VARCHAR(255) NULL,
                role VARCHAR(50) DEFAULT "user" NOT NULL,
                remember_token VARCHAR(255) NULL,
                remember_token_expires_at DATETIME NULL,
                current_plan_id INT NULL,
                FOREIGN KEY (current_plan_id) REFERENCES plans(id) ON DELETE SET NULL
            );
        ');
        $this->db->getConnection()->exec('
            CREATE TABLE plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE,
                price DECIMAL(10, 2) NOT NULL,
                description TEXT,
                features TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ');
        $this->db->getConnection()->exec('
            CREATE TABLE user_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                plan_id INT NOT NULL,
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP NULL,
                status VARCHAR(50) NOT NULL DEFAULT "active"
            );
        ');
        $this->db->getConnection()->exec('
            CREATE TABLE user_activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                activity_type VARCHAR(50) NOT NULL,
                description TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ');
    }

    public function testUserRegistrationAndLogin()
    {
        $name = 'Test User';
        $email = 'test@example.com';
        $password = 'password123';

        // Test registration
        $userId = $this->userModel->register($name, $email, password_hash($password, PASSWORD_DEFAULT));
        $this->assertIsInt($userId);
        $this->assertGreaterThan(0, $userId);

        // Test login with correct credentials
        $loggedInUser = $this->userModel->login($email, $password);
        $this->assertIsArray($loggedInUser);
        $this->assertEquals($email, $loggedInUser['email']);

        // Test login with incorrect password
        $loggedInUser = $this->userModel->login($email, 'wrongpassword');
        $this->assertEquals('invalid_password', $loggedInUser);

        // Test login with non-existent email
        $loggedInUser = $this->userModel->login('nonexistent@example.com', 'password123');
        $this->assertEquals('email_not_found', $loggedInUser);
    }

    public function testGetUserByEmail()
    {
        $name = 'Email User';
        $email = 'email@example.com';
        $password = 'email123';
        $userId = $this->userModel->register($name, $email, password_hash($password, PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        $user = $this->userModel->getUserByEmail($email);
        $this->assertIsArray($user);
        $this->assertEquals($email, $user['email']);

        $nonExistentUser = $this->userModel->getUserByEmail('nonexistent@example.com');
        $this->assertNull($nonExistentUser);
    }

    public function testUpdateResetToken()
    {
        $name = 'Reset Token User';
        $email = 'resettoken@example.com';
        $password = 'resettoken123';
        $userId = $this->userModel->register($name, $email, password_hash($password, PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $this->assertTrue($this->userModel->updateResetToken($userId, $token, $expires));

        $user = $this->userModel->getUserById($userId);
        $this->assertEquals($token, $user['reset_token']);
        $this->assertEquals($expires, $user['reset_token_expires_at']);
    }

    public function testUpdatePassword()
    {
        $name = 'Update Pass User';
        $email = 'updatepass@example.com';
        $password = 'oldpass';
        $userId = $this->userModel->register($name, $email, password_hash($password, PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        $newPassword = 'newpass';
        $this->assertTrue($this->userModel->updatePassword($userId, password_hash($newPassword, PASSWORD_DEFAULT)));

        $loggedInUser = $this->userModel->login($email, $newPassword);
        $this->assertIsArray($loggedInUser);
        $this->assertEquals($email, $loggedInUser['email']);

        $user = $this->userModel->getUserById($userId);
        $this->assertNull($user['reset_token']);
        $this->assertNull($user['reset_token_expires_at']);
    }

    public function testEmailVerification()
    {
        $name = 'Verify User';
        $email = 'verify@example.com';
        $password = 'verify123';

        $userId = $this->userModel->register($name, $email, password_hash($password, PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        // Set verification token
        $token = bin2hex(random_bytes(32));
        $this->assertTrue($this->userModel->setEmailVerificationToken($userId, $token));

        // Verify email with correct token
        $this->assertTrue($this->userModel->verifyEmail($token));

        // Check if user is now verified
        $user = $this->userModel->getUserById($userId);
        $this->assertEquals(1, $user['is_verified']);
        $this->assertNull($user['email_verification_token']);

        // Try to verify with same token again (should fail)
        $this->assertFalse($this->userModel->verifyEmail($token));
    }

    public function testGetUserByVerificationToken()
    {
        $name = 'Token User';
        $email = 'token@example.com';
        $password = 'token123';
        $userId = $this->userModel->register($name, $email, password_hash($password, PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        $token = bin2hex(random_bytes(32));
        $this->userModel->setEmailVerificationToken($userId, $token);

        $user = $this->userModel->getUserByVerificationToken($token);
        $this->assertIsArray($user);
        $this->assertEquals($email, $user['email']);

        $nonExistentUser = $this->userModel->getUserByVerificationToken('nonexistenttoken');
        $this->assertNull($nonExistentUser);
    }

    public function testPasswordReset()
    {
        $name = 'Reset User';
        $email = 'reset@example.com';
        $password = 'oldpassword';

        $userId = $this->userModel->register($name, $email, password_hash($password, PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        // Directly set reset token and expiry in the database for the test user
        $token = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', strtotime('+1 hour')); // Token valid for 1 hour
        $this->db->getConnection()->exec("UPDATE users SET reset_token = '$token', reset_token_expires_at = '$expires' WHERE id = $userId");

        // Get user by reset token
        $user = $this->userModel->getUserByResetToken($token);
        $this->assertIsArray($user);
        $this->assertEquals($email, $user['email']);

        // Update password
        $newPassword = 'newpassword123';
        $this->assertTrue($this->userModel->updatePassword($userId, password_hash($newPassword, PASSWORD_DEFAULT)));

        // Try logging in with new password
        $loggedInUser = $this->userModel->login($email, $newPassword);
        $this->assertIsArray($loggedInUser);
        $this->assertEquals($email, $loggedInUser['email']);

        // Ensure old password no longer works
        $loggedInUser = $this->userModel->login($email, $password);
        $this->assertEquals('invalid_password', $loggedInUser);
    }

    public function testUserDeletion()
    {
        $name = 'Delete User';
        $email = 'delete@example.com';
        $password = 'delete123';

        $userId = $this->userModel->register($name, $email, password_hash($password, PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        // Delete user
        $this->assertTrue($this->userModel->deleteUser($userId));

        // Ensure user is no longer found
        $user = $this->userModel->getUserById($userId);
        $this->assertNull($user);
    }

    public function testGetAllUsers()
    {
        $this->userModel->register('User One', 'one@example.com', password_hash('pass1', PASSWORD_DEFAULT));
        $this->userModel->register('User Two', 'two@example.com', password_hash('pass2', PASSWORD_DEFAULT));

        $users = $this->userModel->getAllUsers();
        $this->assertIsArray($users);
        $this->assertCount(2, $users);
        $this->assertEquals('User One', $users[0]['name']);
    }

    public function testUpdateUserRole()
    {
        $userId = $this->userModel->register('Role User', 'role@example.com', password_hash('role123', PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        $this->assertTrue($this->userModel->updateUserRole($userId, 'admin'));

        $user = $this->userModel->getUserById($userId);
        $this->assertEquals('admin', $user['role']);
    }

    public function testUpdateProfile()
    {
        $name = 'Profile User';
        $email = 'profile@example.com';
        $password = 'profile123';
        $userId = $this->userModel->register($name, $email, password_hash($password, PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        $newName = 'Updated Name';
        $newEmail = 'updated@example.com';

        $this->assertTrue($this->userModel->updateProfile($userId, $newName, $newEmail));

        $user = $this->userModel->getUserById($userId);
        $this->assertEquals($newName, $user['name']);
        $this->assertEquals($newEmail, $user['email']);
    }

    public function testRememberMeTokens()
    {
        $userId = $this->userModel->register('Remember User', 'remember@example.com', password_hash('remember123', PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        $selector = bin2hex(random_bytes(16));
        $validator = bin2hex(random_bytes(32));
        $db_token = $selector . ':' . password_hash($validator, PASSWORD_DEFAULT);
        $cookie_token = $selector . ':' . $validator;
        $expires = date('Y-m-d H:i:s', strtotime('+1 day'));

        $this->assertTrue($this->userModel->setRememberToken($userId, $db_token, $expires));

        $user = $this->userModel->getUserByRememberToken($cookie_token);
        $this->assertIsArray($user);
        $this->assertEquals($userId, $user['id']);

        $this->assertTrue($this->userModel->clearRememberToken($userId));

        $user = $this->userModel->getUserByRememberToken($cookie_token);
        $this->assertNull($user);
    }

    public function testAssignPlanAndGetUserPlan()
    {
        // Create a plan first
        $this->db->getConnection()->exec("INSERT INTO plans (id, name, price) VALUES (1, 'Basic', 9.99)");

        $userId = $this->userModel->register('Plan User', 'plan@example.com', password_hash('plan123', PASSWORD_DEFAULT));
        $this->assertIsInt($userId);

        $this->assertTrue($this->userModel->assignPlan($userId, 1));

        $userPlan = $this->userModel->getUserPlan($userId);
        $this->assertIsArray($userPlan);
        $this->assertEquals('Basic', $userPlan['plan_name']);
        $this->assertEquals(9.99, $userPlan['price']);

        // Test with no plan assigned
        $userIdNoPlan = $this->userModel->register('No Plan User', 'noplan@example.com', password_hash('noplan123', PASSWORD_DEFAULT));
        $this->assertIsInt($userIdNoPlan);
        $this->assertNull($this->userModel->getUserPlan($userIdNoPlan));
    }

    public function testGetTotalUsers()
    {
        $this->assertEquals(0, $this->userModel->getTotalUsers());
        $this->userModel->register('User A', 'a@example.com', password_hash('passA', PASSWORD_DEFAULT));
        $this->assertEquals(1, $this->userModel->getTotalUsers());
        $this->userModel->register('User B', 'b@example.com', password_hash('passB', PASSWORD_DEFAULT));
        $this->assertEquals(2, $this->userModel->getTotalUsers());
    }

    public function testGetNewRegistrationsToday()
    {
        $this->assertEquals(0, $this->userModel->getNewRegistrationsToday());

        // Register a user today
        $this->userModel->register('Today User', 'today@example.com', password_hash('today123', PASSWORD_DEFAULT));
        $this->assertEquals(1, $this->userModel->getNewRegistrationsToday());

        // Register a user for yesterday (won't count for today)
        $yesterday = date('Y-m-d H:i:s', strtotime('-1 day'));
        $this->db->getConnection()->exec("INSERT INTO users (name, email, password, created_at) VALUES ('Yesterday User', 'yesterday@example.com', '" . password_hash('yesterday123', PASSWORD_DEFAULT) . "', '$yesterday')");
        $this->assertEquals(1, $this->userModel->getNewRegistrationsToday());
    }

    public function testAdminDeletesUser()
    {
        // Register a regular user
        $name = 'User To Delete';
        $email = 'delete_me@example.com';
        $password = 'delete123';
        $userId = $this->userModel->register($name, $email, password_hash($password, PASSWORD_DEFAULT));
        $this->assertIsInt($userId);
        $this->assertGreaterThan(0, $userId);

        // Verify the user exists before deletion
        $user = $this->userModel->getUserById($userId);
        $this->assertNotNull($user);

        // Simulate admin deleting the user
        $this->assertTrue($this->userModel->deleteUser($userId));

        // Verify the user is no longer in the database
        $deletedUser = $this->userModel->getUserById($userId);
        $this->assertNull($deletedUser);
    }
}
