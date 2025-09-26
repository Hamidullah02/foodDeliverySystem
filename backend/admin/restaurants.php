<?php
header("Content-Type: application/json");
require_once("../db.php");

if ($_SERVER['REQUEST_METHOD']==='GET') {
  $q="SELECT r.restaurant_id,r.name,r.status,r.location,r.description,
             u.name as owner_name 
      FROM restaurants r JOIN users u ON r.owner_id=u.user_id 
      ORDER BY r.created_at DESC";
  $res=$conn->query($q);
  echo json_encode(["success"=>true,"data"=>$res->fetch_all(MYSQLI_ASSOC)]);
}

elseif ($_SERVER['REQUEST_METHOD']==='POST') {
  $d=json_decode(file_get_contents("php://input"),true);
  $id=$d['restaurant_id']??0; $a=$d['action']??'';
  if(!$id){echo json_encode(["success"=>false]);exit;}

  if($a==='approve'||$a==='reject'){
    $status=$a==='approve'?'approved':'rejected';
    $stmt=$conn->prepare("UPDATE restaurants SET status=? WHERE restaurant_id=?");
    $stmt->bind_param("si",$status,$id);$stmt->execute();
    echo json_encode(["success"=>true]);
  }

  elseif($a==='update'){
    $name=$d['name']??''; $loc=$d['location']??''; $desc=$d['description']??'';
    $stmt=$conn->prepare("UPDATE restaurants SET name=?,location=?,description=? WHERE restaurant_id=?");
    $stmt->bind_param("sssi",$name,$loc,$desc,$id);$stmt->execute();
    echo json_encode(["success"=>true]);
  }

  else echo json_encode(["success"=>false,"message"=>"Invalid action"]);
}

else echo json_encode(["success"=>false,"message"=>"Invalid request"]);
$conn->close();
