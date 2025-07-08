<?php

namespace App;

use PDO;

class ActivityLogger
{
    private $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function logActivity($userId, $activityType, $description = null, $ipAddress = null)
    {
        $sql = "INSERT INTO user_activities (user_id, activity_type, description, ip_address) VALUES (?, ?, ?, ?)";
        $stmt = $this->db->getConnection()->prepare($sql);
        return $stmt->execute([$userId, $activityType, $description, $ipAddress]);
    }

    public function getRecentActivities($limit = 3)
    {
        $sql = "SELECT ua.*, u.name, u.email FROM user_activities ua JOIN users u ON ua.user_id = u.id ORDER BY ua.created_at DESC LIMIT ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRecentActivitiesForUser($userId, $limit = 3)
    {
        $sql = "SELECT ua.*, u.name, u.email FROM user_activities ua JOIN users u ON ua.user_id = u.id WHERE ua.user_id = ? ORDER BY ua.created_at DESC LIMIT ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->bindValue(1, $userId, PDO::PARAM_INT);
        $stmt->bindValue(2, $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
