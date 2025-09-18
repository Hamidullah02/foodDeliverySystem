<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $restaurant_id = $_POST['restaurant_id'] ?? '';
    $name = $_POST['name'] ?? '';
    $location = $_POST['location'] ?? '';
    $description = $_POST['description'] ?? '';
    
    if (!$restaurant_id || !$name || !$location) {
        echo json_encode(["success" => false, "message" => "Restaurant ID, name, and location are required"]);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE restaurants SET name = ?, location = ?, description = ? WHERE restaurant_id = ?");
    $stmt->bind_param("sssi", $name, $location, $description, $restaurant_id);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Restaurant updated successfully"]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update restaurant"]);
    }
    
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>