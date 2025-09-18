<?php
ob_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    ob_clean();
    exit(0);
}

require_once("../db.php");

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $restaurant_id = $_GET['restaurant_id'] ?? '';
        
        if (!$restaurant_id) {
            ob_clean();
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
        ";
        
        $ordersStmt = $conn->prepare($ordersQuery);
        $ordersStmt->bind_param("i", $restaurant_id);
        $ordersStmt->execute();
        $ordersResult = $ordersStmt->get_result();
        
        $orders = [];
        while ($order = $ordersResult->fetch_assoc()) {
            // Get order items for each order
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
        
        ob_clean();
        echo json_encode([
            "success" => true,
            "data" => $orders,
            "count" => count($orders)
        ]);
        
        $ordersStmt->close();
    } else {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Only GET method allowed"]);
    }
    
} catch (Exception $e) {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>