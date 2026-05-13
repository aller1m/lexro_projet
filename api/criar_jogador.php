<?php

require __DIR__ . "/tentarconectar.php";

header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);
$nome = isset($data['nome']) ? trim($data['nome']) : null;

if (!$nome) {
    echo json_encode(["erro" => "Nome é obrigatório"]);
    exit;
}

// 🔥 GERAR CÓDIGO ÚNICO CURTO
function gerarCodigoUnico($conn) {
    do {
        $codigo = "LX" . rand(10000, 99999);

        $stmt = $conn->prepare("SELECT id FROM jogadores WHERE codigo_unico = ?");
        $stmt->bind_param("s", $codigo);
        $stmt->execute();
        $resultado = $stmt->get_result();

    } while ($resultado->num_rows > 0);

    return $codigo;
}

$codigo = gerarCodigoUnico($conn);

try {
    $stmt = $conn->prepare("
        INSERT INTO jogadores (codigo_unico, nome, vitorias, derrotas, sequencia, melhor_sequencia)
        VALUES (?, ?, 0, 0, 0, 0)
    ");
    $stmt->bind_param("ss", $codigo, $nome);
    $stmt->execute();

    $stmt = $conn->prepare("
        SELECT id, codigo_unico, nome, vitorias, derrotas, sequencia, melhor_sequencia
        FROM jogadores
        WHERE codigo_unico = ?
        LIMIT 1
    ");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();

    $jogador = $stmt->get_result()->fetch_assoc();

    echo json_encode([
        "sucesso" => true,
        "jogador" => $jogador
    ], JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "erro" => "Erro ao criar jogador",
        "detalhe" => $e->getMessage()
    ]);
}