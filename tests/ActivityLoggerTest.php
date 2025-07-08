<?php

use PHPUnit\Framework\TestCase;
use App\ActivityLogger;
use App\Database;

// Load database configuration constants
require_once __DIR__ . '/../src/config/config.php';

class ActivityLoggerTest extends TestCase
{
    private $db;
    private $activityLogger;

    protected function setUp(): void
    {
        // Use the test database constants defined in phpunit.xml
        $this->db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
        $this->activityLogger = new ActivityLogger($this->db);

        // Clear and re-create the users and user_activities tables for each test
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS user_activities');
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
                remember_token_expires_at DATETIME NULL
            );
        ');

        $this->db->getConnection()->exec('
            CREATE TABLE user_activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                activity_type VARCHAR(50) NOT NULL,
                description TEXT,
                ip_address VARCHAR(45),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        ');
    }

    public function testLogActivity()
    {
        // Insert a dummy user first
        $this->db->getConnection()->exec("INSERT INTO users (name, email, password) VALUES ('Test User', 'test@example.com', '" . password_hash('password123', PASSWORD_DEFAULT) . "')");
        $userId = $this->db->getConnection()->lastInsertId();

        $this->assertTrue($this->activityLogger->logActivity($userId, 'login', 'User logged in.', '127.0.0.1'));

        $activities = $this->activityLogger->getRecentActivities();
        $this->assertCount(1, $activities);
        $this->assertEquals('login', $activities[0]['activity_type']);
    }

    public function testGetRecentActivities()
    {
        // Insert multiple dummy users and activities
        $this->db->getConnection()->exec("INSERT INTO users (name, email, password) VALUES ('User 1', 'user1@example.com', '" . password_hash('pass1', PASSWORD_DEFAULT) . "')");
        $userId1 = $this->db->getConnection()->lastInsertId();
        $this->db->getConnection()->exec("INSERT INTO users (name, email, password) VALUES ('User 2', 'user2@example.com', '" . password_hash('pass2', PASSWORD_DEFAULT) . "')");
        $userId2 = $this->db->getConnection()->lastInsertId();

        $this->activityLogger->logActivity($userId1, 'login', 'User 1 logged in.');
        sleep(1); // Add a delay
        $this->activityLogger->logActivity($userId2, 'registration', 'User 2 registered.');
        sleep(1); // Add a delay
        $this->activityLogger->logActivity($userId1, 'profile_update', 'User 1 updated profile.');

        $activities = $this->activityLogger->getRecentActivities(2);
        $this->assertCount(2, $activities);
        $this->assertEquals('profile_update', $activities[0]['activity_type']);
        $this->assertEquals('registration', $activities[1]['activity_type']);
    }

    public function testGetRecentActivitiesForUser()
    {
        // Insert multiple dummy users and activities
        $this->db->getConnection()->exec("INSERT INTO users (name, email, password) VALUES ('User A', 'userA@example.com', '" . password_hash('passA', PASSWORD_DEFAULT) . "')");
        $userIdA = $this->db->getConnection()->lastInsertId();
        $this->db->getConnection()->exec("INSERT INTO users (name, email, password) VALUES ('User B', 'userB@example.com', '" . password_hash('passB', PASSWORD_DEFAULT) . "')");
        $userIdB = $this->db->getConnection()->lastInsertId();

        $this->activityLogger->logActivity($userIdA, 'login', 'User A logged in.');
        sleep(1); // Add a delay
        $this->activityLogger->logActivity($userIdB, 'registration', 'User B registered.');
        sleep(1); // Add a delay
        $this->activityLogger->logActivity($userIdA, 'profile_update', 'User A updated profile.');

        $activities = $this->activityLogger->getRecentActivitiesForUser($userIdA, 1);
        $this->assertCount(1, $activities);
        $this->assertEquals('profile_update', $activities[0]['activity_type']);
    }
}
