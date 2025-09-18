<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $customer_id = $_GET['customer_id'] ?? '';
    
    if (!$customer_id) {
        echo json_encode(["success" => false, "message" => "Customer ID is required"]);
        exit;
    }
    
    // Get orders with restaurant info
    $ordersQuery = "
        SELECT o.*, r.name as restaurant_name 
        FROM orders o 
        JOIN restaurants r ON o.restaurant_id = r.restaurant_id 
        WHERE o.customer_id = ? 
        ORDER BY o.created_at DESC
    ";
    
    $ordersStmt = $conn->prepare($ordersQuery);
    $ordersStmt->bind_param("i", $customer_id);
    $ordersStmt->execute();
    $ordersResult = $ordersStmt->get_result();
    
    $orders = [];
    while ($order = $ordersResult->fetch_assoc()) {
        // Get order items
        $itemsQuery = "
            SELECT oi.*, mi.name 
            FROM order_items oi 
            JOIN menu_items mi ON oi.menu_item_id = mi.menu_item_id 
            WHERE oi.order_id = ?
        ";
        
        $itemsStmt = $conn->prepare($itemsQuery);
        $itemsStmt->bind_param("i", $order['order_id']);
        $itemsStmt->execute();
        $itemsResult = $itemsStmt->get_result();
        
        $items = [];
        while ($item = $itemsResult->fetch_assoc()) {
            $items[] = $item;
        }
        
        $order['items'] = $items;
        $orders[] = $order;
        $itemsStmt->close();
    }
    
    echo json_encode([
        "success" => true,
        "data" => $orders,
        "count" => count($orders)
    ]);
    
    $ordersStmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>