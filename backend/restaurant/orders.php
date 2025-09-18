<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $restaurant_id = $_GET['restaurant_id'] ?? '';
    $limit = $_GET['limit'] ?? 10;
    
    if (!$restaurant_id) {
        echo json_encode(["success" => false, "message" => "Restaurant ID is required"]);
        exit;
    }
    
    // Get orders with customer info
    $ordersQuery = "
        SELECT o.*, u.name as customer_name 
        FROM orders o 
        JOIN users u ON o.customer_id = u.user_id 
        WHERE o.restaurant_id = ? 
        ORDER BY o.created_at DESC 
        LIMIT ?
    ";
    
    $stmt = $conn->prepare($ordersQuery);
    $stmt->bind_param("ii", $restaurant_id, $limit);
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