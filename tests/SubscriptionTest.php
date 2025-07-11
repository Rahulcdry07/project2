<?php

use PHPUnit\Framework\TestCase;
use App\Subscription;
use App\Database;
use App\User;
use App\Plan;
use Monolog\Logger;
use Monolog\Handler\TestHandler;

class SubscriptionTest extends TestCase
{
    private $db;
    private $subscriptionModel;
    private $userModel;
    private $planModel;
    private $testUser;
    private $testPlan;
    private $logger;
    private $testHandler;

    protected function setUp(): void
    {
        $this->testHandler = new TestHandler();
        $this->logger = new Logger('test', [$this->testHandler]);

        $this->db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
        $this->subscriptionModel = new Subscription($this->db);
        $this->userModel = new User($this->db, $this->logger);
        $this->planModel = new Plan($this->db);

        // Drop tables in reverse order of creation due to foreign key constraints
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS user_subscriptions');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS user_activities');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS users');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS plans');

        // Create tables
        $this->db->getConnection()->exec('
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_verified TINYINT(1) DEFAULT 0,
                role VARCHAR(50) DEFAULT "user" NOT NULL
            );
        ');

        $this->db->getConnection()->exec('
            CREATE TABLE plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                description TEXT,
                features TEXT
            );
        ');

        $this->db->getConnection()->exec('
            CREATE TABLE user_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                plan_id INT NOT NULL,
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date DATETIME NOT NULL,
                status VARCHAR(50) DEFAULT "active" NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
            );
        ');

        // Create a test user and plan for use in the tests
        $userId = $this->userModel->register('Test User', 'test@example.com', 'password');
        $this->testUser = $this->userModel->getUserById($userId);

        $planId = $this->planModel->createPlan('Test Plan', 29.99, 'A test plan.', 'Test Feature');
        $this->testPlan = $this->planModel->getPlanById($planId);
    }

    public function testCreateSubscription()
    {
        $endDate = date('Y-m-d H:i:s', strtotime('+1 month'));
        $subscriptionId = $this->subscriptionModel->createSubscription($this->testUser['id'], $this->testPlan['id'], $endDate);

        $this->assertIsInt($subscriptionId);
        $this->assertGreaterThan(0, $subscriptionId);
    }

    public function testGetUserSubscription()
    {
        $endDate = date('Y-m-d H:i:s', strtotime('+1 month'));
        $this->subscriptionModel->createSubscription($this->testUser['id'], $this->testPlan['id'], $endDate);

        $subscription = $this->subscriptionModel->getUserSubscription($this->testUser['id']);

        $this->assertIsArray($subscription);
        $this->assertEquals($this->testPlan['id'], $subscription['plan_id']);
        $this->assertEquals($this->testPlan['name'], $subscription['plan_name']);
    }

    public function testCancelSubscription()
    {
        $endDate = date('Y-m-d H:i:s', strtotime('+1 month'));
        $subscriptionId = $this->subscriptionModel->createSubscription($this->testUser['id'], $this->testPlan['id'], $endDate);

        $this->assertTrue($this->subscriptionModel->cancelSubscription($subscriptionId));

        // Verify the subscription is marked as cancelled
        $subscription = $this->subscriptionModel->getUserSubscription($this->testUser['id']);
        $this->assertFalse($subscription); // getUserSubscription only fetches active ones
    }

    protected function tearDown(): void
    {
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS user_subscriptions');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS users');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS plans');
    }
}
