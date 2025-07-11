<?php

namespace App;

use PDO;
use PDOException;

class Database
{
    private $conn;
    private $allowedTables = ['users', 'user_activities', 'plans', 'user_subscriptions'];

    public function __construct($dbHost, $dbUser, $dbPassword, $dbName, $dbPort)
    {
        $dsn = 'mysql:host=' . $dbHost . ';port=' . $dbPort . ';dbname=' . $dbName . ';charset=utf8mb4';
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $this->conn = new PDO($dsn, $dbUser, $dbPassword, $options);
        } catch (PDOException $e) {
            // Log the detailed error message to the server's error log
            error_log('Database Connection Failed: ' . $e->getMessage());
            // Show a generic error message to the user
            die('An internal server error occurred. Please try again later.');
        }
    }

    public function insert($table, $data)
    {
        if (!in_array($table, $this->allowedTables)) {
            throw new \Exception("Table not allowed: $table");
        }

        // Quote table and column names to prevent SQL injection.
        $table = '`' . str_replace('`', '``', $table) . '`';
        $columns = implode(', ', array_map(function ($column) {
            return '`' . str_replace('`', '``', $column) . '`';
        }, array_keys($data)));

        $placeholders = ':' . implode(', :', array_keys($data));

        $sql = "INSERT INTO {$table} ({$columns}) VALUES ({$placeholders})";
        $stmt = $this->conn->prepare($sql);

        return $stmt->execute($data);
    }

    public function select($sql, $params = [])
    {
        $stmt = $this->conn->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getConnection()
    {
        return $this->conn;
    }
}
