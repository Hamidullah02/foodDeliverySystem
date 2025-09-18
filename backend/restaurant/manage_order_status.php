<?php
ob_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    ob_clean();
    exit(0);
}

require_once("../db.php");

try {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $order_id = $_POST['order_id'] ?? '';
        $status = $_POST['status'] ?? '';
        
        if (!$order_id || !$status) {
            ob_clean();
            echo json_encode(["success" => false, "message" => "Order ID and status are required"]);
            exit;
        }
        
        // Validate status
        $validStatuses = ['pending', 'preparing', 'delivered', 'cancelled'];
        if (!in_array($status, $validStatuses)) {
            ob_clean();
            echo json_encode(["success" => false, "message" => "Invalid status"]);
            exit;
        }
        
        $checkStmt = $conn->prepare("SELECT order_id FROM orders WHERE order_id = ?");
        $checkStmt->bind_param("i", $order_id);
        $checkStmt->execute();
        $checkResult = $checkStmt->get_result();
        
        if ($checkResult->num_rows === 0) {
            ob_clean();
            echo json_encode(["success" => false, "message" => "Order not found"]);
            exit;
        }
        
        // Update order status
        $updateStmt = $conn->prepare("UPDATE orders SET status = ? WHERE order_id = ?");
        $updateStmt->bind_param("si", $status, $order_id);
        
        if ($updateStmt->execute()) {
            ob_clean();
            echo json_encode([
                "success" => true,
                "message" => "Order status updated to " . $status
            ]);
        } else {
            ob_clean();
            echo json_encode(["success" => false, "message" => "Failed to update order status"]);
        }
        
        $checkStmt->close();
        $updateStmt->close();
    } else {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Only POST method allowed"]);
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