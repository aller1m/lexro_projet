<?php
require __DIR__ . "/tentarconectar.php";
header('Content-Type: application/json');

$codigo = $_GET['codigo'] ?? null;

if (!$codigo) {
    echo json_encode(["erro" => "Código obrigatório"]);
    exit;
}

try {
    // 1. Dados Gerais
    $stmt = $conn->prepare("SELECT id, vitorias, derrotas, sequencia, melhor_sequencia FROM jogadores WHERE codigo_unico = ?");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $jogador = $stmt->get_result()->fetch_assoc();

    if (!$jogador) throw new Exception("Jogador não encontrado");

    // 2. Distribuição de Tentativas (Quantas vezes ganhou em cada linha)
    $stmt = $conn->prepare("
        SELECT tentativas_usadas, COUNT(*) as total 
        FROM partidas 
        WHERE jogador_id = ? AND resultado = 'vitoria' 
        GROUP BY tentativas_usadas
    ");
    $stmt->bind_param("i", $jogador['id']);
    $stmt->execute();
    $distribuicao = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode([
        "geral" => $jogador,
        "distribuicao" => $distribuicao
    ]);

} catch (Exception $e) {
    echo json_encode(["erro" => $e->getMessage()]);
}
