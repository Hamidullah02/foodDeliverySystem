<?php
ob_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { ob_clean(); exit(0); }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { ob_clean(); echo json_encode(["success"=>false,"message"=>"Only POST allowed"]); exit; }

try {
    require_once(__DIR__ . "/../db.php");

    $name = trim($_POST['name'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $owner_id = intval($_POST['owner_id'] ?? 0);

    if (empty($name) || empty($location) || $owner_id <= 0) {
        ob_clean();
        echo json_encode(["success"=>false,"message"=>"Restaurant name, location and valid owner ID are required"]);
        exit;
    }

    $userStmt = $conn->prepare("SELECT role FROM users WHERE user_id = ?");
    $userStmt->bind_param("i", $owner_id);
    $userStmt->execute();
    $userResult = $userStmt->get_result();
    if ($userResult->num_rows === 0) { echo json_encode(["success"=>false,"message"=>"User not found"]); exit; }
    $user = $userResult->fetch_assoc();
    if ($user['role'] !== 'restaurant') { echo json_encode(["success"=>false,"message"=>"Only restaurant owners can create restaurants"]); exit; }

    $existingStmt = $conn->prepare("SELECT restaurant_id FROM restaurants WHERE owner_id = ?");
    $existingStmt->bind_param("i", $owner_id);
    $existingStmt->execute();
    $existingResult = $existingStmt->get_result();
    if ($existingResult->num_rows > 0) { echo json_encode(["success"=>false,"message"=>"You already have a restaurant registered"]); exit; }

    $createStmt = $conn->prepare("INSERT INTO restaurants (name, location, description, owner_id, status) VALUES (?, ?, ?, ?, 'pending')");
    $createStmt->bind_param("sssi", $name, $location, $description, $owner_id);

    if ($createStmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Restaurant created successfully! Pending admin approval.",
            "restaurant_id" => $conn->insert_id
        ]);
    } else {
        throw new Exception("Failed to create restaurant: " . $createStmt->error);
    }

    $userStmt->close();
    $existingStmt->close();
    $createStmt->close();

} catch (Exception $e) {
    ob_clean();
    echo json_encode(["success"=>false,"message"=>"Error: ".$e->getMessage()]);
} finally {
    if (isset($conn)) $conn->close();
}
?>
