<?php
require_once("db.php");

$name = "Admin User";
$email = "admin@admin.com";
$password = "admin123";
$role = "admin";

$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $name, $email, $hashedPassword, $role);
$stmt->execute();
$stmt->close();
$conn->close();

echo "Admin created!";
?>
