<?php
ob_start(); // Prevent any stray output
header("Content-Type: application/json");
require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    $name = trim($_POST['name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $role = $_POST['role'] ?? 'customer';

    if (!$name || !$email || !$password) {
        ob_clean();
        echo json_encode(["success" => false, "message" => "All fields are required"]);
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);

    $stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $email, $hashedPassword, $role);

    if ($stmt->execute()) {
        $userId = $stmt->insert_id; 
        ob_clean();
        echo json_encode([
            "success" => true,
            "message" => "User registered successfully",
            "id" => $userId,
            "name" => $name,
            "email" => $email,
            "role" => $role
        ]);
    } else {
        ob_clean();
        echo json_encode([
            "success" => false,
            "message" => "Email already exists or database error"
        ]);
    }

    $stmt->close();
    $conn->close();

} else {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}
?>
