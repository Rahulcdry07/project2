<?php

use PHPUnit\Framework\TestCase;
use App\Database;

// Load database configuration constants
require_once __DIR__ . '/../src/config/config.php';

class DatabaseTest extends TestCase
{
    private $db;

    protected function setUp(): void
    {
        // Use the test database constants defined in phpunit.xml
        $this->db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);

        // Ensure a clean state for each test
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS test_users');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS users');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS plans');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS user_activities');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS user_subscriptions');

        // Recreate necessary tables for testing Database class methods
        $this->db->getConnection()->exec('
            CREATE TABLE users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ');
        $this->db->getConnection()->exec('
            CREATE TABLE plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL
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
        $this->db->getConnection()->exec('
            CREATE TABLE user_subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                plan_id INT NOT NULL,
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                end_date TIMESTAMP NULL,
                status VARCHAR(50) NOT NULL
            );
        ');
    }

    public function testConnection()
    {
        $this->assertInstanceOf(PDO::class, $this->db->getConnection());
    }

    public function testInsert()
    {
        $data = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => password_hash('password123', PASSWORD_DEFAULT)
        ];
        $this->assertTrue($this->db->insert('users', $data));

        $stmt = $this->db->getConnection()->query('SELECT COUNT(*) FROM users');
        $this->assertEquals(1, $stmt->fetchColumn());
    }

    public function testSelect()
    {
        $this->db->getConnection()->exec("INSERT INTO users (name, email, password) VALUES ('Test User', 'test@example.com', '" . password_hash('password123', PASSWORD_DEFAULT) . "')");

        $results = $this->db->select('SELECT * FROM users WHERE email = ?', ['test@example.com']);
        $this->assertCount(1, $results);
        $this->assertEquals('test@example.com', $results[0]['email']);
    }

    public function testInsertDisallowedTableThrowsException()
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Table not allowed: disallowed_table');

        $this->db->insert('disallowed_table', ['id' => 1]);
    }

    protected function tearDown(): void
    {
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS test_users');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS users');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS plans');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS user_activities');
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS user_subscriptions');
    }
}
