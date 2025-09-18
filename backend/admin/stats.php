<?php
ob_start();
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

require_once(__DIR__ . "/../db.php");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    try {
        $usersStmt = $conn->prepare("SELECT COUNT(*) as total FROM users");
        $usersStmt->execute();
        $totalUsers = $usersStmt->get_result()->fetch_assoc()['total'];

        // Total restaurants
        $restaurantsStmt = $conn->prepare("SELECT COUNT(*) as total FROM restaurants");
        $restaurantsStmt->execute();
        $totalRestaurants = $restaurantsStmt->get_result()->fetch_assoc()['total'];

        // Pending approvals
        $pendingStmt = $conn->prepare("SELECT COUNT(*) as total FROM restaurants WHERE status = 'pending'");
        $pendingStmt->execute();
        $pendingApprovals = $pendingStmt->get_result()->fetch_assoc()['total'];

        // Total orders
        $ordersStmt = $conn->prepare("SELECT COUNT(*) as total FROM orders");
        $ordersStmt->execute();
        $totalOrders = $ordersStmt->get_result()->fetch_assoc()['total'];

        echo json_encode([
            "success" => true,
            "data" => [
                "total_users" => $totalUsers,
                "total_restaurants" => $totalRestaurants,
                "pending_approvals" => $pendingApprovals,
                "total_orders" => $totalOrders
            ]
        ]);

        $usersStmt->close();
        $restaurantsStmt->close();
        $pendingStmt->close();
        $ordersStmt->close();
    } catch (Exception $e) {
        ob_clean();
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Invalid request method"]);
}

$conn->close();
