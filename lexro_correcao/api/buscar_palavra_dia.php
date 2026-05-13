<?php
require __DIR__ . "/conectar.php";

$hoje = date('Y-m-d');

try {
    // 1) Procura se já existe palavra do dia para todos jogarem a mesma palavra
    $stmt = $conn->prepare("\n        SELECT p.id, p.palavra\n        FROM palavras_do_dia pd\n        INNER JOIN palavras p ON p.id = pd.palavra_id\n        WHERE pd.data = ?\n        LIMIT 1\n    ");
    $stmt->bind_param("s", $hoje);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        echo json_encode($result->fetch_assoc(), JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2) Se não existir, escolhe uma palavra válida e guarda como palavra do dia
    $sql = "\n        SELECT id, palavra\n        FROM palavras\n        WHERE ativa = 1 AND pode_ser_resposta = 1\n        ORDER BY RAND()\n        LIMIT 1\n    ";
    $result = $conn->query($sql);

    if ($result->num_rows === 0) {
        echo json_encode(["erro" => "Nenhuma palavra encontrada"], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $palavra = $result->fetch_assoc();

    $stmt = $conn->prepare("INSERT INTO palavras_do_dia (palavra_id, data) VALUES (?, ?)");
    $stmt->bind_param("is", $palavra['id'], $hoje);
    $stmt->execute();

    echo json_encode($palavra, JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode([
        "erro" => "Erro ao buscar palavra do dia",
        "detalhe" => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}
