<?php
require __DIR__ . "/tentarconectar.php";

header("Content-Type: application/json; charset=utf-8");

$data = json_decode(file_get_contents("php://input"), true);

// 1. Capturar os novos campos enviados pelo JS
$codigo = $data['codigo'] ?? null;
$palavra_id = $data['palavra_id'] ?? null;
$resultado = $data['resultado'] ?? null; 
$tentativas = $data['tentativas'] ?? 0;
$tempo_restante = $data['tempo_restante'] ?? null; // Novo campo
$modo = $data['modo'] ?? 'classico';              // Novo campo (padrão: classico)

if (!$codigo || !$resultado || !in_array($resultado, ["vitoria", "derrota"])) {
    http_response_code(400);
    echo json_encode(["erro" => "Dados incompletos ou inválidos"]);
    exit;
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conn->begin_transaction();

    // 2. Buscar o ID interno do jogador
    $stmt = $conn->prepare("SELECT id FROM jogadores WHERE codigo_unico = ?");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    if (!$res) {
        throw new Exception("Jogador não encontrado");
    }
    $jogador_id = $res['id'];

    // 3. Registrar a Partida (Incluindo tempo_restante e modo)
    // ATENÇÃO: Verifique se os nomes das colunas no seu MySQL são exatamente estes:
    $stmt = $conn->prepare("
        INSERT INTO partidas (jogador_id, palavra_id, resultado, tentativas_usadas, tempo_restante, modo) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    
    // "iisiis" -> inteiro, inteiro, string, inteiro, inteiro, string
    $stmt->bind_param("iisiis", $jogador_id, $palavra_id, $resultado, $tentativas, $tempo_restante, $modo);
    $stmt->execute();

    // 4. Atualizar estatísticas do Jogador
    if ($resultado === "vitoria") {
        $stmt = $conn->prepare("
            UPDATE jogadores 
            SET vitorias = vitorias + 1, 
                sequencia = sequencia + 1,
                melhor_sequencia = IF(sequencia + 1 > melhor_sequencia, sequencia + 1, melhor_sequencia)
            WHERE id = ?
        ");
    } else {
        $stmt = $conn->prepare("
            UPDATE jogadores 
            SET derrotas = derrotas + 1, 
                sequencia = 0 
            WHERE id = ?
        ");
    }
    $stmt->bind_param("i", $jogador_id);
    $stmt->execute();

    // 5. Buscar dados atualizados
    $stmt = $conn->prepare("SELECT vitorias, derrotas, sequencia, melhor_sequencia FROM jogadores WHERE id = ?");
    $stmt->bind_param("i", $jogador_id);
    $stmt->execute();
    $stats = $stmt->get_result()->fetch_assoc();

    $conn->commit();

    echo json_encode([
        "sucesso" => true,
        "mensagem" => "Partida finalizada com sucesso ($modo)",
        "stats" => $stats
    ]);

} catch (Throwable $e) {
    if (isset($conn)) $conn->rollback();
    http_response_code(500);
    echo json_encode([
        "erro" => "Falha ao processar partida",
        "detalhe" => $e->getMessage()
    ]);
}
