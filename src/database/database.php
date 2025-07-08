<?php
// Database configuration
$dbHost = 'localhost';
$dbUsername = 'your_username';
$dbPassword = 'your_password';
$dbName = 'your_database_name';

// Create a new PDO instance
$pdo = new PDO("mysql:host=$dbHost;dbname=$dbName", $dbUsername, $dbPassword);

// Set the PDO error mode to exception
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
?>
```
Replace `your_username`, `your_password`, and `your_database_name` with your actual database credentials.

Next, let's create a `register.php` file that uses this PDO instance to perform the registration functionality:
```php
<?php
require_once 'database.php';

// Register user function
function register_user($username, $email, $password)
{
  // Prepare and execute the SQL query
    $stmt = $pdo->prepare('INSERT INTO users (username, email, password) VALUES (:username, :email, :password)');
    $stmt->bindParam(':username', $username);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password', password_hash($password, PASSWORD_DEFAULT));
    $stmt->execute();
}

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];

  // Validate and sanitize input data
    if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
        register_user($username, $email, $password);
        echo 'Registration successful!';
    } else {
        echo 'Invalid email address!';
    }
}
?>
