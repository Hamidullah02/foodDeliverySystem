<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $limit = $_GET['limit'] ?? 10;
    
    // Get recent orders with customer and restaurant info
    $query = "
        SELECT o.*, 
               u.name as customer_name,
               r.name as restaurant_name,
               r.location as restaurant_location
        FROM orders o 
        JOIN users u ON o.customer_id = u.user_id 
        JOIN restaurants r ON o.restaurant_id = r.restaurant_id 
        ORDER BY o.created_at DESC 
        LIMIT ?
    ";
    
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $orders = [];
    while ($order = $result->fetch_assoc()) {
        $orders[] = $order;
    }
    
    echo json_encode([
        "success" => true,
        "data" => $orders,
        "count" => count($orders)
    ]);
    
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>