<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once("../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $restaurant_id = $input['restaurant_id'] ?? '';
    $action = $input['action'] ?? '';
    
    if (!$restaurant_id || !$action) {
        echo json_encode(["success" => false, "message" => "Restaurant ID and action are required"]);
        exit;
    }
    
    if (!in_array($action, ['approve', 'reject'])) {
        echo json_encode(["success" => false, "message" => "Invalid action"]);
        exit;
    }
    
    $status = ($action === 'approve') ? 'approved' : 'rejected';
    
    $stmt = $conn->prepare("UPDATE restaurants SET status = ? WHERE restaurant_id = ? AND status = 'pending'");
    $stmt->bind_param("si", $status, $restaurant_id);
    
    if ($stmt->execute()) {
        if ($stmt->affected_rows > 0) {
            echo json_encode([
                "success" => true, 
                "message" => "Restaurant " . $status . " successfully"
            ]);
        } else {
            echo json_encode(["success" => false, "message" => "Restaurant not found or already processed"]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Failed to update restaurant status"]);
    }
    
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
?>