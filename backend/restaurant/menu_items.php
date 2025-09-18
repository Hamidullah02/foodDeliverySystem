<?php
ob_start();

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    ob_clean();
    exit(0);
}

require_once("../db.php");

try {
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get menu items for a restaurant
        $restaurant_id = $_GET['restaurant_id'] ?? '';
        
        if (!$restaurant_id) {
            ob_clean();
            echo json_encode(["success" => false, "message" => "Restaurant ID is required"]);
            exit;
        }
        
        $stmt = $conn->prepare("SELECT * FROM menu_items WHERE restaurant_id = ? ORDER BY category ASC, name ASC");
        $stmt->bind_param("i", $restaurant_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = $row;
        }
        
        ob_clean();
        echo json_encode([
            "success" => true,
            "data" => $items,
            "count" => count($items)
        ]);
        
        $stmt->close();
        
    } elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle CRUD operations
        $action = $_POST['action'] ?? '';
        
        switch ($action) {
            case 'create':
                createMenuItem($conn);
                break;
            case 'update':
                updateMenuItem($conn);
                break;
            case 'delete':
                deleteMenuItem($conn);
                break;
            case 'toggle_availability':
                toggleAvailability($conn);
                break;
            default:
                ob_clean();
                echo json_encode(["success" => false, "message" => "Invalid action"]);
        }
    } else {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Invalid request method"]);
    }
    
} catch (Exception $e) {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}

function createMenuItem($conn) {
    $restaurant_id = $_POST['restaurant_id'] ?? '';
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $price = floatval($_POST['price'] ?? 0);
    $category = $_POST['category'] ?? '';
    $is_available = intval($_POST['is_available'] ?? 1);
    
    if (!$restaurant_id || !$name || $price <= 0 || !$category) {
        ob_clean();
        echo json_encode(["success" => false, "message" => "All required fields must be provided"]);
        return;
    }
    
    $stmt = $conn->prepare("INSERT INTO menu_items (restaurant_id, name, description, price, category, is_available) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("issdsi", $restaurant_id, $name, $description, $price, $category, $is_available);
    
    if ($stmt->execute()) {
        ob_clean();
        echo json_encode([
            "success" => true,
            "message" => "Menu item created successfully",
            "menu_item_id" => $conn->insert_id
        ]);
    } else {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Failed to create menu item"]);
    }
    
    $stmt->close();
}

function updateMenuItem($conn) {
    $menu_item_id = $_POST['menu_item_id'] ?? '';
    $name = trim($_POST['name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $price = floatval($_POST['price'] ?? 0);
    $category = $_POST['category'] ?? '';
    $is_available = intval($_POST['is_available'] ?? 1);
    
    if (!$menu_item_id || !$name || $price <= 0 || !$category) {
        ob_clean();
        echo json_encode(["success" => false, "message" => "All required fields must be provided"]);
        return;
    }
    
    $stmt = $conn->prepare("UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, is_available = ? WHERE menu_item_id = ?");
    $stmt->bind_param("ssdsii", $name, $description, $price, $category, $is_available, $menu_item_id);
    
    if ($stmt->execute()) {
        ob_clean();
        echo json_encode(["success" => true, "message" => "Menu item updated successfully"]);
    } else {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Failed to update menu item"]);
    }
    
    $stmt->close();
}

function deleteMenuItem($conn) {
    $menu_item_id = $_POST['menu_item_id'] ?? '';
    
    if (!$menu_item_id) {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Menu item ID is required"]);
        return;
    }
    
    $stmt = $conn->prepare("DELETE FROM menu_items WHERE menu_item_id = ?");
    $stmt->bind_param("i", $menu_item_id);
    
    if ($stmt->execute()) {
        ob_clean();
        echo json_encode(["success" => true, "message" => "Menu item deleted successfully"]);
    } else {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Failed to delete menu item"]);
    }
    
    $stmt->close();
}

function toggleAvailability($conn) {
    $menu_item_id = $_POST['menu_item_id'] ?? '';
    $is_available = intval($_POST['is_available'] ?? 0);
    
    if (!$menu_item_id) {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Menu item ID is required"]);
        return;
    }
    
    $stmt = $conn->prepare("UPDATE menu_items SET is_available = ? WHERE menu_item_id = ?");
    $stmt->bind_param("ii", $is_available, $menu_item_id);
    
    if ($stmt->execute()) {
        $status = $is_available ? 'enabled' : 'disabled';
        ob_clean();
        echo json_encode(["success" => true, "message" => "Menu item $status successfully"]);
    } else {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Failed to update availability"]);
    }
    
    $stmt->close();
}
?>