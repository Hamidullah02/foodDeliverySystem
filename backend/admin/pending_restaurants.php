<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    
    // Get pending restaurants with owner info
    $query = "
        SELECT r.*, u.name as owner_name, u.email as owner_email
        FROM restaurants r 
        JOIN users u ON r.owner_id = u.user_id 
        WHERE r.status = 'pending' 
        ORDER BY r.created_at ASC
    ";
    
    $stmt = $conn->prepare($query);
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