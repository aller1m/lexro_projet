<?php
require __DIR__ . "/tentarconectar.php";
header('Content-Type: application/json');

$codigo = $_GET['codigo'] ?? null;

if (!$codigo) {
    echo json_encode(["erro" => "Código não encontrado"]);
    exit;
}

try {
    // 1. Dados Básicos do Jogador
    $stmt = $conn->prepare("SELECT id, nome, vitorias, derrotas, sequencia, melhor_sequencia FROM jogadores WHERE codigo_unico = ?");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $jogador = $stmt->get_result()->fetch_assoc();

    if (!$jogador) throw new Exception("Jogador inexistente");

    $id = $jogador['id'];

    // 2. Cálculos Avançados (Taxa de Vitória e Média de Tentativas)
    $stmt = $conn->prepare("
        SELECT 
            COUNT(*) as total_partidas,
            ROUND(AVG(tentativas_usadas), 1) as media_tentativas,
            MIN(CASE WHEN modo = 'desafio' AND resultado = 'vitoria' THEN (120 - tempo_restante) END) as melhor_tempo_gasto
        FROM partidas 
        WHERE jogador_id = ? AND resultado = 'vitoria'
    ");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $avancado = $stmt->get_result()->fetch_assoc();

    // 3. Histórico das últimas 10 partidas
    $stmt = $conn->prepare("
        SELECT p.resultado, p.tentativas_usadas, p.tempo_restante, p.modo, p.data_partida 
        FROM partidas p
        WHERE p.jogador_id = ? 
        ORDER BY p.data_partida DESC 
        LIMIT 10
    ");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $historico = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $stmt = $conn->prepare("
        SELECT jogador_id, COUNT(*) AS total_partidas, 
            SUM(CASE WHEN resultado = 'vitoria' THEN 1 ELSE 0 END) AS total_vitorias, 
            CASE WHEN COUNT(*) > 0 THEN ROUND((SUM(CASE WHEN resultado = 'vitoria' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) ELSE 0 END AS taxa_vitoria 
            FROM partidas 
            WHERE jogador_id = ?;
    ");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $taxa_vitoria = $stmt->get_result()->fetch_assoc();

    // Calcular Taxa de Vitória Manualmente para ser preciso
    $total = $jogador['vitorias'] + $jogador['derrotas'];

    echo json_encode([
        "sucesso" => true,
        "geral" => $jogador,
        "taxa_vitoria" => $taxa_vitoria['taxa_vitoria'] ?? 0 . "%",
        "media_tentativas" => $avancado['media_tentativas'] ?? 0,
        "melhor_tempo" => $avancado['melhor_tempo_gasto'] ?? "--",
        "historico" => $historico
    ]);

    

} catch (Exception $e) {
    echo json_encode(["erro" => $e->getMessage()]);
}
