<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $restaurant_id = $_GET['id'] ?? '';
    
    if (!$restaurant_id) {
        echo json_encode(["success" => false, "message" => "Restaurant ID is required"]);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT restaurant_id, name, location, description FROM restaurants WHERE restaurant_id = ? AND status = 'approved'");
    $stmt->bind_param("i", $restaurant_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        $restaurant = $result->fetch_assoc();
        echo json_encode([
            "success" => true,
            "data" => $restaurant
        ]);
    } else {
        echo json_encode(["success" => false, "message" => "Restaurant not found"]);
    }
    
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>