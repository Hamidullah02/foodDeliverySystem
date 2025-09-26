<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    exit();
}

require_once "../db.php";

try {
    if ($_SERVER["REQUEST_METHOD"] === "GET") {
        $restaurant_id = $_GET["restaurant_id"] ?? 0;
        if (!$restaurant_id) {
            echo json_encode([
                "success" => false,
                "message" => "Restaurant ID required",
            ]);
            exit();
        }

        $stmt = $conn->prepare(
            "SELECT * FROM menu_items WHERE restaurant_id=? ORDER BY category,name"
        );
        $stmt->bind_param("i", $restaurant_id);
        $stmt->execute();
        $res = $stmt->get_result();
        $items = [];
        while ($row = $res->fetch_assoc()) {
            if (empty($row["image_url"])) {
                $row["image_url"] = null;
            }
            $items[] = $row;
        }
        echo json_encode([
            "success" => true,
            "data" => $items,
            "count" => count($items),
        ]);
        $stmt->close();
    } elseif ($_SERVER["REQUEST_METHOD"] === "POST") {
        $action = $_POST["action"] ?? "";
        $restaurant_id = $_POST["restaurant_id"] ?? 0;

        $image_url = null;
       if(isset($_FILES["image"]) && $_FILES["image"]["error"]===UPLOAD_ERR_OK){
    $ext = pathinfo($_FILES["image"]["name"], PATHINFO_EXTENSION);
    $filename = uniqid().".".$ext;
    $target = "../uploads/".$filename;
    if(move_uploaded_file($_FILES["image"]["tmp_name"], $target)){
        $image_url = "uploads/".$filename;
    }
}


        if ($action === "create") {
            $name = trim($_POST["name"] ?? "");
            $desc = trim($_POST["description"] ?? "");
            $price = floatval($_POST["price"] ?? 0);
            $cat = trim($_POST["category"] ?? "");
            $avail = intval($_POST["is_available"] ?? 1);

            if (!$restaurant_id || !$name || !$price || !$cat) {
                echo json_encode([
                    "success" => false,
                    "message" => "All fields required",
                ]);
                exit();
            }

            $stmt = $conn->prepare(
                "INSERT INTO menu_items (restaurant_id,name,description,price,category,is_available,image_url) VALUES (?,?,?,?,?,?,?)"
            );
            $stmt->bind_param(
                "issdiss",
                $restaurant_id,
                $name,
                $desc,
                $price,
                $cat,
                $avail,
                $image_url
            );
            if ($stmt->execute()) {
                echo json_encode([
                    "success" => true,
                    "message" => "Added",
                    "menu_item_id" => $conn->insert_id,
                ]);
            } else {
                echo json_encode(["success" => false, "message" => "Failed"]);
            }
            $stmt->close();
        } elseif ($action === "update") {
            $id = $_POST["menu_item_id"] ?? 0;
            $name = trim($_POST["name"] ?? "");
            $desc = trim($_POST["description"] ?? "");
            $price = floatval($_POST["price"] ?? 0);
            $cat = trim($_POST["category"] ?? "");
            $avail = intval($_POST["is_available"] ?? 1);

            if (!$id || !$name || !$price || !$cat) {
                echo json_encode([
                    "success" => false,
                    "message" => "All fields required",
                ]);
                exit();
            }

            if ($image_url) {
                $stmt = $conn->prepare(
                    "UPDATE menu_items SET name=?,description=?,price=?,category=?,is_available=?,image_url=? WHERE menu_item_id=?"
                );
                $stmt->bind_param(
                    "ssdsisi",
                    $name,
                    $desc,
                    $price,
                    $cat,
                    $avail,
                    $image_url,
                    $id
                );
            } else {
                $stmt = $conn->prepare(
                    "UPDATE menu_items SET name=?,description=?,price=?,category=?,is_available=? WHERE menu_item_id=?"
                );
                $stmt->bind_param(
                    "ssdsi",
                    $name,
                    $desc,
                    $price,
                    $cat,
                    $avail,
                    $id
                );
            }

            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Updated"]);
            } else {
                echo json_encode(["success" => false, "message" => "Failed"]);
            }
            $stmt->close();
        } elseif ($action === "delete") {
            $id = $_POST["menu_item_id"] ?? 0;
            if (!$id) {
                echo json_encode([
                    "success" => false,
                    "message" => "ID required",
                ]);
                exit();
            }
            $stmt = $conn->prepare(
                "DELETE FROM menu_items WHERE menu_item_id=?"
            );
            $stmt->bind_param("i", $id);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Deleted"]);
            } else {
                echo json_encode(["success" => false, "message" => "Failed"]);
            }
            $stmt->close();
        } elseif ($action === "toggle_availability") {
            $id = $_POST["menu_item_id"] ?? 0;
            $avail = intval($_POST["is_available"] ?? 0);
            if (!$id) {
                echo json_encode([
                    "success" => false,
                    "message" => "ID required",
                ]);
                exit();
            }
            $stmt = $conn->prepare(
                "UPDATE menu_items SET is_available=? WHERE menu_item_id=?"
            );
            $stmt->bind_param("ii", $avail, $id);
            if ($stmt->execute()) {
                echo json_encode(["success" => true, "message" => "Toggled"]);
            } else {
                echo json_encode(["success" => false, "message" => "Failed"]);
            }
            $stmt->close();
        } else {
            echo json_encode([
                "success" => false,
                "message" => "Invalid action",
            ]);
        }
    } else {
        echo json_encode(["success" => false, "message" => "Invalid request"]);
    }
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
