<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $customer_id = $input['customer_id'] ?? '';
    $restaurant_id = $input['restaurant_id'] ?? '';
    $delivery_address = $input['delivery_address'] ?? '';
    $phone = $input['phone'] ?? '';
    $items = $input['items'] ?? [];
    $total_amount = $input['total_amount'] ?? 0;
    
    if (!$customer_id || !$restaurant_id || !$delivery_address || !$phone || empty($items)) {
        echo json_encode(["success" => false, "message" => "All fields are required"]);
        exit;
    }
    
    $conn->begin_transaction();
    
    try {
        // Create order
        $orderStmt = $conn->prepare("INSERT INTO orders (customer_id, restaurant_id, total_amount, delivery_address, phone, status) VALUES (?, ?, ?, ?, ?, 'pending')");
        $orderStmt->bind_param("iidss", $customer_id, $restaurant_id, $total_amount, $delivery_address, $phone);
        $orderStmt->execute();
        
        $order_id = $conn->insert_id;
        
        // Add order items
        $itemStmt = $conn->prepare("INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)");
        
        foreach ($items as $item) {
            $menu_item_id = $item['menu_item_id'];
            $quantity = $item['quantity'];
            $price = $item['price'];
            
            $itemStmt->bind_param("iiid", $order_id, $menu_item_id, $quantity, $price);
            $itemStmt->execute();
        }
        
        // Commit transaction
        $conn->commit();
        
        echo json_encode([
            "success" => true,
            "message" => "Order placed successfully",
            "order_id" => $order_id
        ]);
        
        $orderStmt->close();
        $itemStmt->close();
        
    } catch (Exception $e) {
        // Rollback transaction
        $conn->rollback();
        echo json_encode(["success" => false, "message" => "Failed to place order: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>