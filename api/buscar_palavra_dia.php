<?php

require "tentarconectar.php";

$sql = "SELECT id, palavra
        FROM palavras
        ORDER BY RAND()
        LIMIT 1";

$result = $conn->query($sql);

if ($result->num_rows > 0) {

    $palavra = $result->fetch_assoc();

    echo json_encode($palavra);

} else {

    echo json_encode(["erro" => "Nenhuma palavra encontrada"]);

}

$conn->close();



?>