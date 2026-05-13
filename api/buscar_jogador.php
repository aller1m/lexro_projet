<?php
require __DIR__ . "/tentarconectar.php";

$data = json_decode(file_get_contents("php://input"), true);
$codigo = isset($data['codigo']) ? trim($data['codigo']) : '';

if ($codigo === '') {
    http_response_code(400);
    echo json_encode(["erro" => "Código não enviado"], JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT id, codigo_unico, nome FROM jogadores WHERE codigo_unico = ? LIMIT 1");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $jogador = $stmt->get_result()->fetch_assoc();

    if (!$jogador) {
        echo json_encode(["sucesso" => false], JSON_UNESCAPED_UNICODE);
        exit;
    }

    echo json_encode(["sucesso" => true, "jogador" => $jogador], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro ao buscar jogador", "detalhe" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
