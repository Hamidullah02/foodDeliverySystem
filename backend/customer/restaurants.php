<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Fetch all approved restaurants
    $stmt = $conn->prepare("SELECT restaurant_id, name, location, description FROM restaurants WHERE status = 'approved' ORDER BY name ASC");
    $stmt->execute();
    $result = $stmt->get_result();
    
    $restaurants = [];
    while ($row = $result->fetch_assoc()) {
        $restaurants[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "data" => $restaurants,
        "count" => count($restaurants)
    ]);
    
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>