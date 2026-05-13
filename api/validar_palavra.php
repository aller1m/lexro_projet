<?php
error_reporting(0); 
header('Content-Type: application/json; charset=utf-8');

include 'tentarconectar.php'; // Garante que a variável $conn está aqui

$tentativa = $_GET['palavra'] ?? '';

if (strlen($tentativa) !== 5) {
    echo json_encode(['valida' => false]);
    exit;
}

// BUSCA REAL NO BANCO:
// Usando COLLATE para que "AVIAO" encontre "AVIÃO"
$sql = "SELECT palavra FROM palavras WHERE palavra COLLATE utf8mb4_general_ci = ? LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $tentativa);
$stmt->execute();
$resultado = $stmt->get_result();

if ($row = $resultado->fetch_assoc()) {
    echo json_encode([
        'valida' => true, 
        'palavra_acentuada' => $row['palavra'] 
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['valida' => false]);
}
exit;
