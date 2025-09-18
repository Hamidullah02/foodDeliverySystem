<?php
// Prevent any output before JSON headers
ob_start();

// Database configuration
$servername = "localhost";
$username = "root";
$password = "";
$dbname = "food_delivery";

try {
    // Create connection
    $conn = new mysqli($servername, $username, $password, $dbname);

    if ($conn->connect_error) {
        ob_clean();
        header("Content-Type: application/json");
        echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
        exit;
    }

    $conn->set_charset("utf8");
    
} catch (Exception $e) {
    ob_clean();
    header("Content-Type: application/json");
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    exit;
}
?>