// Configurações do jogo
const LINHAS = 6;
const COLUNAS = 5;

let jogoIniciado = false;
let palavraSecreta = "";
let currentRow = 0;
let currentCol = 0;
let jogoAtivo = false;
let tempoTotal = 120; // tempo em segundos
let intervalo;
let palavraIdAtual = null; 

const game = document.getElementById("game");

function mostrarAlert(mensagem) {
  document.getElementById("alertMessage").textContent = mensagem;
  document.getElementById("customAlert").classList.remove("hidden");
}

function fecharAlert() {
  document.getElementById("customAlert").classList.add("hidden");
}


// Busca a palavra do dia
async function buscarPalavra() {
  try {
    const resposta = await fetch("api/buscar_palavra_dia.php");
    const dados = await resposta.json();

    if (dados.erro) {
      mostrarAlert(dados.erro);
      return;
    }

    palavraSecreta = dados.palavra.toUpperCase();
    console.log("Palavra do dia:", palavraSecreta);
    palavraIdAtual = dados.id;

  } catch (erro) {
    console.error("Erro ao buscar palavra:", erro);
  }
}

// Cria o grid
function criarGrid() {
  for (let i = 0; i < LINHAS; i++) {
    const row = document.createElement("div");
    row.classList.add("row");

    for (let j = 0; j < COLUNAS; j++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      row.appendChild(cell);
    }

    game.appendChild(row);
  }
}

// Inicia o jogo
async function iniciarJogo() {
  await buscarPalavra();
  criarGrid();
  // iniciarCronometro(); 
}

iniciarJogo();

// Eventos de teclado
document.addEventListener("keydown", (e) => {
  if (!jogoAtivo || currentRow >= LINHAS) return;

  // SE for uma letra e o cronômetro ainda não começou...
  if (/^[a-zA-Z]$/.test(e.key) && !jogoIniciado) {
    jogoIniciado = true;
    iniciarCronometro(); // Só começa agora!
    console.log("Cronômetro iniciado!");
  }

  if (e.key === "Backspace") removerLetra();
  else if (e.key === "Enter") verificarPalavra();
  else if (/^[a-zA-Z]$/.test(e.key)) adicionarLetra(e.key.toUpperCase());
});

// Funções de manipulação de letras
function adicionarLetra(letra) {
  if (currentCol < COLUNAS) {
    const row = game.children[currentRow];
    row.children[currentCol].textContent = letra;
    currentCol++;
  }
}

function removerLetra() {
  if (currentCol > 0) {
    currentCol--;
    const row = game.children[currentRow];
    row.children[currentCol].textContent = "";
  }
}

// Verificação da palavra
async function verificarPalavra() {
  if (currentCol < COLUNAS) {
    mostrarAlert("Digite a palavra completa!");
    return;
  }

  const row = game.children[currentRow];
  let tentativaInformada = "";
  for (let i = 0; i < COLUNAS; i++) {
    tentativaInformada += row.children[i].textContent;
  }

  try {
    // 1. Busca a palavra acentuada no banco
    const response = await fetch(`api/validar_palavra.php?palavra=${tentativaInformada}`);
    const data = await response.json();

    if (!data.valida) {
      mostrarAlert("Essa palavra não é aceita!");
      return;
    }

    // 2. Pega a versão correta (com acento) vinda do PHP
    const tentativaAcentuada = data.palavra_acentuada.toUpperCase();
    
    // 3. Atualiza o visual das letras na linha atual com os acentos
    for (let i = 0; i < COLUNAS; i++) {
      row.children[i].textContent = tentativaAcentuada[i];
    }

    // 4. Lógica de Cores (Comparando ACENTUADA com SECRETA)
    let cores = Array(COLUNAS).fill("cinza");
    let secretaArray = palavraSecreta.split("");
    let tentativaArray = tentativaAcentuada.split("");

    // PASSO 1 - Verdes
    for (let i = 0; i < COLUNAS; i++) {
      if (tentativaArray[i] === secretaArray[i]) {
        cores[i] = "verde";
        secretaArray[i] = null;
      }
    }

    // PASSO 2 - Amarelos
    for (let i = 0; i < COLUNAS; i++) {
      if (cores[i] === "verde") continue;
      let index = secretaArray.indexOf(tentativaArray[i]);
      if (index !== -1) {
        cores[i] = "amarelo";
        secretaArray[index] = null;
      }
    }

    // 5. Aplicar as cores no CSS
    for (let i = 0; i < COLUNAS; i++) {
      const cell = row.children[i];
      if (cores[i] === "verde") cell.style.backgroundColor = "#5fc2f4";
      else if (cores[i] === "amarelo") cell.style.backgroundColor = "#1c77c3";
      else cell.style.backgroundColor = "#071e31";
    }

    /// 6. Verificar Vitória
   if (tentativaAcentuada === palavraSecreta) {
        clearInterval(intervalo); 
        
        setTimeout(() => {
            // currentRow + 1 indica em qual linha o jogador acertou
            const tentativasUsadas = currentRow + 1; 
            mostrarAlert(`🎉 Parabéns! Acertou Em ${tentativasUsadas} tentativas, e com um tempo restante: ${tempoTotal}s`);
            
            finalizarPartida("vitoria", palavraIdAtual, tentativasUsadas);
            encerrarJogo();
        }, 100);
        return;
    }
    currentRow++;
    currentCol = 0;

    // 7. Verificar Derrota (Fim das linhas)
    if (currentRow === LINHAS 
      
    ) { // -1 porque o incremento vem depois
      finalizarPartida("derrota", palavraIdAtual, LINHAS);
      
      setTimeout(() => {
          mostrarAlert(`Fim de jogo! A palavra era: ${palavraSecreta}`);
          encerrarJogo();
      }, 100);
      return;
    }


  } catch (error) {
    console.error("Erro ao validar:", error);
    mostrarAlert("Erro de conexão com o servidor.");
  }
}

// Cronômetro
function iniciarCronometro() {
  atualizarDisplay();

  intervalo = setInterval(() => {
    tempoTotal--;
    atualizarDisplay();

    if (tempoTotal <= 0) {
      clearInterval(intervalo);
      tempoEsgotado();
    }
  }, 1000);
}

function atualizarDisplay() {
  const minutos = Math.floor(tempoTotal / 60);
  const segundos = tempoTotal % 60;

  const cronometroEl = document.getElementById("cronometro");
  const corpo = document.body;

  cronometroEl.textContent = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;

  // Reset das classes de alerta
  corpo.classList.remove("alerta-laranja", "alerta-vermelho");

  if (tempoTotal <= 15) {
    cronometroEl.style.setProperty("color", "#ff4d4d", "important");
    corpo.classList.add("alerta-vermelho");
  } 
  else if (tempoTotal <= 40) {
    cronometroEl.style.setProperty("color", "#ffa500", "important");
    corpo.classList.add("alerta-laranja");
  } 
  else {
    cronometroEl.style.setProperty("color", "var(--cor-texto)", "important");
  }
}

function tempoEsgotado() {
    mostrarAlert("⏰ Tempo esgotado! Tente um modo mais fácil. A palavra era: ${palavraSecreta}");
    finalizarPartida("derrota", palavraIdAtual, currentRow); 
    encerrarJogo();
}


function encerrarJogo() {
  jogoAtivo = false;
  clearInterval(intervalo);

  // Se tiver botão de enviar
  const btnEnviar = document.getElementById("btnEnviar");
  if (btnEnviar) btnEnviar.disabled = true;

  // Se tiver teclado virtual
  const teclas = document.querySelectorAll(".tecla");
  teclas.forEach(tecla => tecla.disabled = true);

  // Revelar palavra
  mostrarPalavraCorreta();
}

function mostrarPalavraCorreta() {
  const row = game.children[currentRow - 1] || game.children[LINHAS - 1];
  for (let i = 0; i < COLUNAS; i++) {
    row.children[i].textContent = palavraSecreta[i];
    row.children[i].style.backgroundColor = "#5fc2f4";
  }
}


window.configurarModo = function(tempo) {
  console.log("Selecionado tempo:", tempo);
  tempoTotal = tempo;
  
  const modal = document.getElementById("modalModoCompetitivo");
  if (modal) {
    modal.classList.add("hidden"); 
    
  }
  
  atualizarDisplay();
  jogoAtivo = true; // Libera o teclado para começar
  console.log("Tempo definido. Boa sorte!");
};

async function finalizarPartida(resultado, palavraId, tentativas) {
  const codigo = localStorage.getItem("codigoJogador");

  if (!codigo) {
    console.error("Erro: Jogador sem código!");
    return;
  }

  try {
    const res = await fetch("api/finalizar_partida.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: codigo,
        resultado: resultado,
        palavra_id: palavraId,
        tentativas: tentativas,
        tempo_restante: tempoTotal, 
        modo: "desafio"         
      })
    });

    const data = await res.json();
    console.log("Resultado competitivo salvo:", data);
    return data;
  } catch (error) {
    console.error("Erro ao salvar partida competitiva:", error);
  }
}

function novaPartida(){
    location.reload();
}
