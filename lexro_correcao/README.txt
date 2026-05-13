CORREÇÕES PRINCIPAIS DO LEXRO

1) O teu erro principal na base de dados está em api/conectar.php:
   - criaste $pdo, mas no resto do projecto usas $conn
   - o catch tem sintaxe inválida: echo "Erro: "=> ...
   - por isso todos os outros ficheiros partem logo na ligação

2) Também tens outro problema importante:
   - buscar_palavra_dia.php usa $conn->query(...)
   - mas $conn nunca é criado no teu conectar.php actual

3) Outro detalhe importante:
   - se abrires o HTML com file:/// o fetch("api/...") não funciona
   - tens de correr com XAMPP/WAMP/Laragon/Apache e abrir por:
     http://localhost/LeXro_Projet/Index.html

4) Pasta API corrigida:
   - conectar.php
   - buscar_palavra_dia.php
   - criar_jogador.php
   - buscar_jogador.php
   - salvar_tentativa_competitiva.php
   - finalizar_partida_competitiva.php
   - status_amigo.php

5) JS simples para falar com o PHP:
   - JS/api.js

6) Modo competitivo com amigo:
   - CompetitivoAmigo.html
   - CSS/competitivo_amigo.css
   - JS/competitivo_amigo.js

7) Para o modo competitivo funcionar melhor, convém ter este índice único:

   ALTER TABLE tentativas
   ADD UNIQUE KEY unique_tentativa (partida_id, numero_tentativa);

