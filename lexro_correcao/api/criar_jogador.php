<?php
require __DIR__ . "/conectar.php";

$data = json_decode(file_get_contents("php://input"), true);
$codigo = isset($data['codigo']) ? trim($data['codigo']) : '';
$nome = isset($data['nome']) ? trim($data['nome']) : null;

if ($codigo === '') {
    http_response_code(400);
    echo json_encode(["erro" => "Código não enviado"], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stmt = $conn->prepare("INSERT INTO jogadores (codigo_unico, nome) VALUES (?, ?) ON DUPLICATE KEY UPDATE nome = COALESCE(VALUES(nome), nome)");
    $stmt->bind_param("ss", $codigo, $nome);
    $stmt->execute();

    $stmt = $conn->prepare("SELECT id, codigo_unico, nome FROM jogadores WHERE codigo_unico = ? LIMIT 1");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $jogador = $stmt->get_result()->fetch_assoc();

    echo json_encode(["sucesso" => true, "jogador" => $jogador], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro ao criar jogador", "detalhe" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
