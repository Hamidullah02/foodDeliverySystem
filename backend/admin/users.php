<?php
header("Content-Type: application/json");
require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $conn->prepare("SELECT user_id, name, email, role FROM users ORDER BY created_at DESC");
    $stmt->execute();
    $result = $stmt->get_result();
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = $row;
    }
    echo json_encode(["success" => true, "data" => $users]);
    $stmt->close();
}

elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents("php://input"), true);
    $id = $input['user_id'] ?? 0;

    if (!$id) {
        echo json_encode(["success" => false, "message" => "User ID required"]);
        exit;
    }

    $stmt = $conn->prepare("DELETE FROM users WHERE user_id = ?");
    $stmt->bind_param("i", $id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "User deleted"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete user"]);
    }

    $stmt->close();
}

else {
    echo json_encode(["success" => false, "message" => "Invalid request"]);
}

$conn->close();
