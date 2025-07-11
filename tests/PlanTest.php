<?php

use PHPUnit\Framework\TestCase;
use App\Plan;
use App\Database;

class PlanTest extends TestCase
{
    private $db;
    private $planModel;

    protected function setUp(): void
    {
        // Use the test database constants defined in phpunit.xml
        $this->db = new Database(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT);
        $this->planModel = new Plan($this->db);

        // Clear and re-create the plans table for each test
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS plans');
        $this->db->getConnection()->exec('
            CREATE TABLE plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                description TEXT,
                features TEXT
            );
        ');
    }

    public function testCreatePlan()
    {
        $name = 'Basic Plan';
        $price = 9.99;
        $description = 'A basic subscription plan.';
        $features = 'Feature 1, Feature 2';

        $planId = $this->planModel->createPlan($name, $price, $description, $features);
        $this->assertIsInt($planId);
        $this->assertGreaterThan(0, $planId);

        // Verify the plan was actually inserted with the correct data
        $plan = $this->planModel->getPlanById($planId);
        $this->assertEquals($name, $plan['name']);
        $this->assertEquals($price, $plan['price']);
    }

    public function testGetPlanById()
    {
        // First, create a plan to test with
        $planId = $this->planModel->createPlan('Standard Plan', 19.99, 'A standard plan.', 'All features');

        // Now, get the plan by its ID
        $plan = $this->planModel->getPlanById($planId);

        $this->assertIsArray($plan);
        $this->assertEquals('Standard Plan', $plan['name']);
        $this->assertEquals(19.99, $plan['price']);
    }

    public function testGetAllPlans()
    {
        // No plans initially
        $this->assertCount(0, $this->planModel->getAllPlans());

        // Create some plans
        $this->planModel->createPlan('Plan A', 5.00, 'Description A', 'Feature A');
        $this->planModel->createPlan('Plan B', 15.00, 'Description B', 'Feature B');
        $this->planModel->createPlan('Plan C', 10.00, 'Description C', 'Feature C');

        $plans = $this->planModel->getAllPlans();
        $this->assertCount(3, $plans);

        // Check if they are ordered by price
        $this->assertEquals(5.00, $plans[0]['price']);
        $this->assertEquals(10.00, $plans[1]['price']);
        $this->assertEquals(15.00, $plans[2]['price']);
    }

    protected function tearDown(): void
    {
        // Drop the table after each test
        $this->db->getConnection()->exec('DROP TABLE IF EXISTS plans');
    }
}
