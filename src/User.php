<?php

namespace App;

use PDO;

class User
{
    private $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    public function login($email, $password)
    {
        $user = $this->db->select('SELECT * FROM users WHERE email = ?', [$email]);

        if (empty($user)) {
            return 'email_not_found';
        }

        if (!password_verify($password, $user[0]['password'])) {
            return 'invalid_password';
        }

        return $user[0];
    }

    public function getUserByEmail($email)
    {
        $user = $this->db->select('SELECT * FROM users WHERE email = ?', [$email]);
        return $user[0] ?? null;
    }

    public function getUserById($userId)
    {
        $sql = "SELECT * FROM users WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($user === false) {
            return null;
        }
        return $user;
    }

    public function updateResetToken($userId, $token, $expires)
    {
        $sql = "UPDATE users SET reset_token = ?, reset_token_expires_at = ? WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        return $stmt->execute([$token, $expires, $userId]);
    }

    public function getUserByResetToken($token)
    {
        $sql = "SELECT * FROM users WHERE reset_token = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        return $user ?? null;
    }

    public function updatePassword($userId, $hashedPassword)
    {
        $sql = "UPDATE users SET password = ?, reset_token = NULL, reset_token_expires_at = NULL WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        return $stmt->execute([$hashedPassword, $userId]);
    }

    public function getAllUsers()
    {
        $sql = "SELECT id, name, email, role, is_verified FROM users";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function updateUserRole($userId, $role)
    {
        $sql = "UPDATE users SET role = ? WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        return $stmt->execute([$role, $userId]);
    }

    public function register($name, $email, $hashedPassword)
    {
        $sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        $stmt = $this->db->getConnection()->prepare($sql);
        try {
            if ($stmt->execute([$name, $email, $hashedPassword])) {
                return (int)$this->db->getConnection()->lastInsertId();
            } else {
                return false;
            }
        } catch (PDOException $e) {
            global $log;
            $log->error("Error registering user: " . $e->getMessage());
            return false;
        }
    }

    public function setEmailVerificationToken($userId, $token)
    {
        $sql = "UPDATE users SET email_verification_token = ? WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        try {
            return $stmt->execute([$token, $userId]);
        } catch (PDOException $e) {
            global $log;
            $log->error("Error setting email verification token: " . $e->getMessage());
            return false;
        }
    }

    public function verifyEmail($token)
    {
        $sql = "UPDATE users SET is_verified = 1, email_verification_token = NULL WHERE email_verification_token = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute([$token]);
        return $stmt->rowCount() > 0;
    }

    public function getUserByVerificationToken($token)
    {
        $sql = "SELECT * FROM users WHERE email_verification_token = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        return $user ?? null;
    }

    public function updateProfile($userId, $name, $email)
    {
        $sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        return $stmt->execute([$name, $email, $userId]);
    }

    public function deleteUser($userId)
    {
        $sql = "DELETE FROM users WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        try {
            return $stmt->execute([$userId]);
        } catch (PDOException $e) {
            global $log;
            $log->error("Error deleting user: " . $e->getMessage());
            return false;
        }
    }

    public function setRememberToken($userId, $token, $expires)
    {
        $sql = "UPDATE users SET remember_token = ?, remember_token_expires_at = ? WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        return $stmt->execute([$token, $expires, $userId]);
    }

    public function getUserByRememberToken($token)
    {
        $sql = "SELECT * FROM users WHERE remember_token = ? AND remember_token_expires_at > NOW()";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        return $user ?? null;
    }

    public function clearRememberToken($userId)
    {
        $sql = "UPDATE users SET remember_token = NULL, remember_token_expires_at = NULL WHERE id = ?";
        $stmt = $this->db->getConnection()->prepare($sql);
        return $stmt->execute([$userId]);
    }

    public function getTotalUsers()
    {
        $sql = "SELECT COUNT(*) FROM users";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute();
        return $stmt->fetchColumn();
    }

    public function getNewRegistrationsToday()
    {
        $sql = "SELECT COUNT(*) FROM users WHERE created_at >= CURDATE()";
        $stmt = $this->db->getConnection()->prepare($sql);
        $stmt->execute();
        return $stmt->fetchColumn();
    }
}
