-- Database setup for registration website
-- Run this in phpMyAdmin or MySQL command line

USE registration;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reset_token VARCHAR(255) NULL,
    reset_token_expires_at DATETIME NULL,
    is_verified TINYINT(1) DEFAULT 0,
    email_verification_token VARCHAR(255) NULL,
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    remember_token VARCHAR(255) NULL,
    remember_token_expires_at DATETIME NULL
);

-- Insert sample data (optional)
-- INSERT INTO users (name, email, password) VALUES 
-- ('John Doe', 'john@example.com', '$2y$10$example_hashed_password');
