<?php
require __DIR__ . "/conectar.php";

$data = json_decode(file_get_contents("php://input"), true);
$jogador_id = isset($data['jogador_id']) ? (int)$data['jogador_id'] : 0;
$palavra_digitada = isset($data['palavra_digitada']) ? mb_strtoupper(trim($data['palavra_digitada']), 'UTF-8') : '';
$numero_tentativa = isset($data['numero_tentativa']) ? (int)$data['numero_tentativa'] : 0;

if ($jogador_id <= 0 || $palavra_digitada === '' || $numero_tentativa <= 0) {
    http_response_code(400);
    echo json_encode(["erro" => "Dados inválidos"], JSON_UNESCAPED_UNICODE);
    exit;
}

$hoje = date('Y-m-d');

try {
    // Palavra do dia obrigatória
    $stmt = $conn->prepare("SELECT palavra_id FROM palavras_do_dia WHERE data = ? LIMIT 1");
    $stmt->bind_param("s", $hoje);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        http_response_code(400);
        echo json_encode(["erro" => "Palavra do dia ainda não foi criada"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $palavra_id = (int)$row['palavra_id'];

    // Procura ou cria partida do dia em modo desafio
    $stmt = $conn->prepare("\n        SELECT id\n        FROM partidas\n        WHERE jogador_id = ? AND palavra_id = ? AND modo = 'desafio' AND DATE(data_partida) = ?\n        LIMIT 1\n    ");
    $stmt->bind_param("iis", $jogador_id, $palavra_id, $hoje);
    $stmt->execute();
    $partida = $stmt->get_result()->fetch_assoc();

    if ($partida) {
        $partida_id = (int)$partida['id'];
    } else {
        $stmt = $conn->prepare("INSERT INTO partidas (jogador_id, palavra_id, modo) VALUES (?, ?, 'desafio')");
        $stmt->bind_param("ii", $jogador_id, $palavra_id);
        $stmt->execute();
        $partida_id = $conn->insert_id;
    }

    // Evita duplicar a mesma tentativa
    $stmt = $conn->prepare("\n        INSERT INTO tentativas (partida_id, palavra_digitada, numero_tentativa)\n        VALUES (?, ?, ?)\n        ON DUPLICATE KEY UPDATE palavra_digitada = VALUES(palavra_digitada)\n    ");
    $stmt->bind_param("isi", $partida_id, $palavra_digitada, $numero_tentativa);
    $stmt->execute();

    echo json_encode(["sucesso" => true, "partida_id" => $partida_id], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro ao salvar tentativa", "detalhe" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
