-- Table for subscription plans
CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    features TEXT, -- Comma-separated list of features or JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for user subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, cancelled, expired
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
);
