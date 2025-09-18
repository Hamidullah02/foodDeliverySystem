<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $restaurant_id = $_GET['restaurant_id'] ?? '';
    
    if (!$restaurant_id) {
        echo json_encode(["success" => false, "message" => "Restaurant ID is required"]);
        exit;
    }
    
    // Get total menu items
    $menuStmt = $conn->prepare("SELECT COUNT(*) as total FROM menu_items WHERE restaurant_id = ?");
    $menuStmt->bind_param("i", $restaurant_id);
    $menuStmt->execute();
    $menuResult = $menuStmt->get_result();
    $menuCount = $menuResult->fetch_assoc()['total'];
    
    // Get pending orders
    $pendingStmt = $conn->prepare("SELECT COUNT(*) as total FROM orders WHERE restaurant_id = ? AND status = 'pending'");
    $pendingStmt->bind_param("i", $restaurant_id);
    $pendingStmt->execute();
    $pendingResult = $pendingStmt->get_result();
    $pendingCount = $pendingResult->fetch_assoc()['total'];
    
    // Get today's orders
    $todayStmt = $conn->prepare("SELECT COUNT(*) as total FROM orders WHERE restaurant_id = ? AND DATE(created_at) = CURDATE()");
    $todayStmt->bind_param("i", $restaurant_id);
    $todayStmt->execute();
    $todayResult = $todayStmt->get_result();
    $todayCount = $todayResult->fetch_assoc()['total'];
    
    echo json_encode([
        "success" => true,
        "data" => [
            "total_menu_items" => $menuCount,
            "pending_orders" => $pendingCount,
            "today_orders" => $todayCount
        ]
    ]);
    
    $menuStmt->close();
    $pendingStmt->close();
    $todayStmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>