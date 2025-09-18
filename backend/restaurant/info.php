<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $owner_id = $_GET['owner_id'] ?? '';
    
    if (!$owner_id) {
        echo json_encode(["success" => false, "message" => "Owner ID is required"]);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT * FROM restaurants WHERE owner_id = ?");
    $stmt->bind_param("i", $owner_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $restaurant = $result->fetch_assoc();
        echo json_encode([
            "success" => true,
            "data" => $restaurant
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "No restaurant found"]);
    }
    
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>