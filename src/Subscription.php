<?php

namespace App;

use PDO;

class Subscription
{
    private $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function createSubscription($userId, $planId, $endDate)
    {
        $sql = "INSERT INTO user_subscriptions (user_id, plan_id, end_date) VALUES (?, ?, ?)";
        $stmt = $this->db->getConnection()->prepare($sql);
        if ($stmt->execute([$userId, $planId, $endDate])) {
            return (int)$this->db->getConnection()->lastInsertId();
        }
        return false;
    }

    public function getUserSubscription($userId)
    {
        $sql = "SELECT us.*, p.name as plan_name, p.price FROM user_subscriptions us JOIN plans p ON us.plan_id = p.id WHERE us.user_id = ? AND us.status = 'active' ORDER BY us.end_date DESC LIMIT 1";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function cancelSubscription($subscriptionId)
    {
        $sql = "UPDATE user_subscriptions SET status = 'cancelled' WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        return $stmt->execute([$subscriptionId]);
    }
}
