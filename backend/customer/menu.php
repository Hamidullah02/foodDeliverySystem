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
    
    // Verify restaurant exists and is approved
    $restaurantStmt = $conn->prepare("SELECT restaurant_id FROM restaurants WHERE restaurant_id = ? AND status = 'approved'");
    $restaurantStmt->bind_param("i", $restaurant_id);
    $restaurantStmt->execute();
    $restaurantResult = $restaurantStmt->get_result();
    
    if ($restaurantResult->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Restaurant not found or not approved"]);
        exit;
    }
    
    // Get menu items
    $stmt = $conn->prepare("SELECT menu_item_id, name, description, price, category, image_url FROM menu_items WHERE restaurant_id = ? AND is_available = 1 ORDER BY category ASC, name ASC");
    $stmt->bind_param("i", $restaurant_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $menuItems = [];
    while ($row = $result->fetch_assoc()) {
        $menuItems[] = $row;
    }
    
    echo json_encode([
        "success" => true,
        "data" => $menuItems,
        "count" => count($menuItems)
    ]);
    
    $stmt->close();
    $restaurantStmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>