<?php
header("Content-Type: application/json");
require_once("../db.php");

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (!$email || !$password) {
    echo json_encode(["success" => false, "message" => "Email and password required"]);
    exit;
}

$stmt = $conn->prepare("SELECT user_id, name, password, role FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    $stmt->bind_result($user_id, $name, $hashedPassword, $role);
    $stmt->fetch();
    if (password_verify($password, $hashedPassword)) {
        echo json_encode(["success" => true, "user_id" => $user_id, "name" => $name, "role" => $role]);
    } else {
        echo json_encode(["success" => false, "message" => "Invalid password"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "User not found"]);
}
$stmt->close();
$conn->close();
?>
