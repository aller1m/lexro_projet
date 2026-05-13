<?php
require __DIR__ . "/conectar.php";

$data = json_decode(file_get_contents("php://input"), true);
$jogador_id = isset($data['jogador_id']) ? (int)$data['jogador_id'] : 0;
$resultado = isset($data['resultado']) ? $data['resultado'] : '';
$tentativas = isset($data['tentativas']) ? (int)$data['tentativas'] : 0;

if ($jogador_id <= 0 || !in_array($resultado, ['vitoria', 'derrota'], true) || $tentativas <= 0) {
    http_response_code(400);
    echo json_encode(["erro" => "Dados inválidos"], JSON_UNESCAPED_UNICODE);
    exit;
}

$hoje = date('Y-m-d');

try {
    $stmt = $conn->prepare("SELECT palavra_id FROM palavras_do_dia WHERE data = ? LIMIT 1");
    $stmt->bind_param("s", $hoje);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row) {
        echo json_encode(["erro" => "Palavra do dia não encontrada"], JSON_UNESCAPED_UNICODE);
        exit;
    }
    $palavra_id = (int)$row['palavra_id'];

    $stmt = $conn->prepare("\n        SELECT id\n        FROM partidas\n        WHERE jogador_id = ? AND palavra_id = ? AND modo = 'desafio' AND DATE(data_partida) = ?\n        LIMIT 1
    ");
    $stmt->bind_param("iis", $jogador_id, $palavra_id, $hoje);
    $stmt->execute();
    $partida = $stmt->get_result()->fetch_assoc();

    if (!$partida) {
        echo json_encode(["erro" => "Partida não encontrada"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $partida_id = (int)$partida['id'];

    $stmt = $conn->prepare("UPDATE partidas SET resultado = ?, tentativas_usadas = ? WHERE id = ?");
    $stmt->bind_param("sii", $resultado, $tentativas, $partida_id);
    $stmt->execute();

    $stmt = $conn->prepare("INSERT IGNORE INTO estatisticas_jogador (jogador_id) VALUES (?)");
    $stmt->bind_param("i", $jogador_id);
    $stmt->execute();

    if ($resultado === 'vitoria') {
        $stmt = $conn->prepare("\n            UPDATE estatisticas_jogador\n            SET partidas_jogadas = partidas_jogadas + 1,\n                vitorias = vitorias + 1,\n                sequencia_atual = sequencia_atual + 1,\n                melhor_sequencia = GREATEST(melhor_sequencia, sequencia_atual + 1)\n            WHERE jogador_id = ?");
    } else {
        $stmt = $conn->prepare("\n            UPDATE estatisticas_jogador\n            SET partidas_jogadas = partidas_jogadas + 1,\n                derrotas = derrotas + 1,\n                sequencia_atual = 0\n            WHERE jogador_id = ?");
    }
    $stmt->bind_param("i", $jogador_id);
    $stmt->execute();

    echo json_encode(["sucesso" => true], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro ao finalizar partida", "detalhe" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
