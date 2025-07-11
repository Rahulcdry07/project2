<?php

namespace App;

use PDO;

class Plan
{
    private $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function getAllPlans()
    {
        $sql = "SELECT * FROM plans ORDER BY price ASC";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPlanById($planId)
    {
        $sql = "SELECT * FROM plans WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute([$planId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createPlan($name, $price, $description, $features)
    {
        $sql = "INSERT INTO plans (name, price, description, features) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->getConnection()->prepare($sql);
        if ($stmt->execute([$name, $price, $description, $features])) {
            return (int)$this->db->getConnection()->lastInsertId();
        }
        return false;
    }
}
