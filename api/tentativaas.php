<?php
require __DIR__ . "/tentarconectar.php";
header("Content-Type: application/json; charset=utf-8");

$data = json_decode(file_get_contents("php://input"), true);

$codigo = $data['codigo'] ?? null;
$palavra_id = $data['palavra_id'] ?? null;
$resultado = $data['resultado'] ?? null; 
$tentativas = $data['tentativas'] ?? 0;
$tempo_restante = $data['tempo_restante'] ?? null;

// PEGA O MODO DO JS. SE VIER VAZIO, DEFINE UM PADRÃO BASEADO NO TEMPO
$modo = !empty($data['modo']) ? $data['modo'] : ($tempo_restante ? 'vs tempo' : 'classico');

if (!$codigo || !$resultado || !in_array($resultado, ["vitoria", "derrota"])) {
    http_response_code(400);
    echo json_encode(["erro" => "Dados incompletos"]);
    exit;
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conn->begin_transaction();

    // Buscar Jogador
    $stmt = $conn->prepare("SELECT id FROM jogadores WHERE codigo_unico = ?");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();

    if (!$res) throw new Exception("Jogador não encontrado");
    $jogador_id = $res['id'];

    // Salvar Partida com o modo correto enviado pelo JS
    $stmt = $conn->prepare("
        INSERT INTO partidas (jogador_id, palavra_id, resultado, tentativas_usadas, tempo_restante, modo) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("iisiis", $jogador_id, $palavra_id, $resultado, $tentativas, $tempo_restante, $modo);
    $stmt->execute();

    // Atualizar Stats (Vitorias/Derrotas)
    if ($resultado === "vitoria") {
        $stmt = $conn->prepare("UPDATE jogadores SET vitorias = vitorias + 1, sequencia = sequencia + 1, melhor_sequencia = GREATEST(melhor_sequencia, sequencia) WHERE id = ?");
    } else {
        $stmt = $conn->prepare("UPDATE jogadores SET derrotas = derrotas + 1, sequencia = 0 WHERE id = ?");
    }
    $stmt->bind_param("i", $jogador_id);
    $stmt->execute();

    $conn->commit();
    echo json_encode(["sucesso" => true, "modo_salvo" => $modo]);

} catch (Throwable $e) {
    if (isset($conn)) $conn->rollback();
    http_response_code(500);
    echo json_encode(["erro" => $e->getMessage()]);
}
