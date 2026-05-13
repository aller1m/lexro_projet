<?php
require __DIR__ . "/conectar.php";

function normalizar($texto) {
    $mapa = [
        'Á'=>'A','À'=>'A','Ã'=>'A','Â'=>'A','Ä'=>'A',
        'É'=>'E','È'=>'E','Ê'=>'E','Ë'=>'E',
        'Í'=>'I','Ì'=>'I','Î'=>'I','Ï'=>'I',
        'Ó'=>'O','Ò'=>'O','Õ'=>'O','Ô'=>'O','Ö'=>'O',
        'Ú'=>'U','Ù'=>'U','Û'=>'U','Ü'=>'U',
        'Ç'=>'C'
    ];
    return strtr(mb_strtoupper($texto, 'UTF-8'), $mapa);
}

function calcularCores($tentativa, $resposta) {
    $tentativa = preg_split('//u', normalizar($tentativa), -1, PREG_SPLIT_NO_EMPTY);
    $resposta = preg_split('//u', normalizar($resposta), -1, PREG_SPLIT_NO_EMPTY);
    $cores = array_fill(0, count($tentativa), 'errada');

    for ($i = 0; $i < count($tentativa); $i++) {
        if (isset($resposta[$i]) && $tentativa[$i] === $resposta[$i]) {
            $cores[$i] = 'correta';
            $resposta[$i] = null;
        }
    }

    for ($i = 0; $i < count($tentativa); $i++) {
        if ($cores[$i] === 'correta') continue;
        $index = array_search($tentativa[$i], $resposta, true);
        if ($index !== false) {
            $cores[$i] = 'presente';
            $resposta[$index] = null;
        }
    }

    return $cores;
}

$codigo = isset($_GET['codigo']) ? trim($_GET['codigo']) : '';
if ($codigo === '') {
    http_response_code(400);
    echo json_encode(["erro" => "Código não enviado"], JSON_UNESCAPED_UNICODE);
    exit;
}

$hoje = date('Y-m-d');

try {
    $stmt = $conn->prepare("SELECT id FROM jogadores WHERE codigo_unico = ? LIMIT 1");
    $stmt->bind_param("s", $codigo);
    $stmt->execute();
    $jogador = $stmt->get_result()->fetch_assoc();

    if (!$jogador) {
        echo json_encode(["sucesso" => false, "estado" => null], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $jogador_id = (int)$jogador['id'];

    $stmt = $conn->prepare("\n        SELECT p.id AS partida_id, p.resultado, p.tentativas_usadas, pal.palavra\n        FROM partidas p\n        INNER JOIN palavras pal ON pal.id = p.palavra_id\n        WHERE p.jogador_id = ? AND p.modo = 'desafio' AND DATE(p.data_partida) = ?\n        LIMIT 1\n    ");
    $stmt->bind_param("is", $jogador_id, $hoje);
    $stmt->execute();
    $partida = $stmt->get_result()->fetch_assoc();

    if (!$partida) {
        echo json_encode(["sucesso" => true, "estado" => ["linhas" => [], "resultado" => null, "tentativas" => 0]], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $conn->prepare("\n        SELECT palavra_digitada, numero_tentativa\n        FROM tentativas\n        WHERE partida_id = ?\n        ORDER BY numero_tentativa ASC\n    ");
    $stmt->bind_param("i", $partida['partida_id']);
    $stmt->execute();
    $tentativas = $stmt->get_result();

    $linhas = [];
    while ($row = $tentativas->fetch_assoc()) {
        $linhas[] = calcularCores($row['palavra_digitada'], $partida['palavra']);
    }

    echo json_encode([
        "sucesso" => true,
        "estado" => [
            "linhas" => $linhas,
            "resultado" => $partida['resultado'],
            "tentativas" => $partida['tentativas_usadas']
        ]
    ], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro ao buscar estado do amigo", "detalhe" => $e->getMessage()], JSON_UNESCAPED_UNICODE);
}
