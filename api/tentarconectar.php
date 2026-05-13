<?php
header("Content-Type: application/json; charset=utf-8");

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "lexro";

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conn = new mysqli($host, $user, $pass, $dbname);
    $conn->set_charset("utf8mb4");
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "erro" => "Falha na ligação à base de dados",
        "detalhe" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
