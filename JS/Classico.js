function normalizar(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

// Configurações do jogo
const LINHAS = 6;
const COLUNAS = 5;

let palavraIdAtiva = 0; // Variável global para armazenar o ID da palavra atual

async function buscarPalavra() {
  try {
    const resposta = await fetch("api/buscar_palavra_dia.php");
    const dados = await resposta.json();

    if (dados.erro) {
      mostrarAlert(dados.erro);
      return;
    }

    // Como o seu PHP envia o objeto direto, acessamos assim:
    palavraSecreta = dados.palavra.toUpperCase();
    palavraIdAtiva = dados.id; // Aqui capturamos o ID para usar no final
    
    console.log("Palavra carregada ID:", palavraIdAtiva);

  } catch (erro) {
    console.error("Erro ao buscar palavra:", erro);
  }
}

function mostrarAlert(mensagem) {
  document.getElementById("alertMessage").textContent = mensagem;
  document.getElementById("customAlert").classList.remove("hidden");
}

function fecharAlert() {
  document.getElementById("customAlert").classList.add("hidden");
}


let palavraSecreta = "";
let currentRow = 0;
let currentCol = 0;

const game = document.getElementById("game");

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

buscarPalavra();
criarGrid();


// Eventos de teclado
document.addEventListener("keydown", (e) => {
  if (currentRow >= LINHAS) return;

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
    let secretaArray = normalizar(palavraSecreta).split("");
    let tentativaArray = normalizar(tentativaAcentuada).split("");

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
    if (normalizar(tentativaAcentuada) === normalizar(palavraSecreta)){
      const tentativasUsadas = currentRow + 1;
      // Chamada para o Banco de Dados
      finalizarPartida("vitoria", palavraIdAtiva, tentativasUsadas);
      
       setTimeout(() => mostrarInfoPalavra(palavraSecreta), 1000); 
      return;
    }

    currentRow++;
    currentCol = 0;

    // 7. Verificar Derrota (Fim das linhas)
    if (currentRow === LINHAS) {
      // Chamada para o Banco de Dados
      finalizarPartida("derrota", palavraIdAtiva, LINHAS);
      
      setTimeout(() =>mostrarInfoPalavra(palavraSecreta), 1000);
    }

  } catch (error) {
    console.error("Erro ao validar:", error);
    mostrarAlert("Erro de conexão com o servidor.");
  }
 
}


async function finalizarPartida(resultado, palavraId, tentativas) {
  const codigo = localStorage.getItem("codigoJogador");

  if (!codigo) {
    console.error("Erro: Jogador sem código!");
    return;
  }

  try {
    const res = await fetch("api/tentativaas.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codigo: codigo,
        resultado: resultado,
        palavra_id: palavraId,
        tentativas: tentativas,
        modo: "classico" 
      })
    });

    const data = await res.json();
    console.log("Servidor respondeu:", data);
    return data;
  } catch (error) {
    console.error("Erro ao comunicar com API de fim de jogo:", error);
  }
}

function novaPartida(){
    location.reload();
}

async function mostrarInfoPalavra(palavra) {
    const elSignificado = document.getElementById('significado');
    const elSinonimos = document.getElementById('sinonimos');
    
    document.getElementById('palavraRevelada').innerText = palavra.toUpperCase();
    document.getElementById('popupInfo').classList.remove('hidden');
    elSignificado.innerText = "Buscando no dicionário...";
    elSinonimos.innerText = "";

    try {
        const response = await fetch('api/buscar_significado.php?palavra=' + palavra);
        const data = await response.json();
        
        console.log("Dados Reais:", data);

        // Se a API retornar a estrutura do Dicio
        if (data.meanings) {
            // Se meanings for um array, pegamos o primeiro item. Se for string, usamos direto.
            elSignificado.innerText = Array.isArray(data.meanings) ? data.meanings[0] : data.meanings;
            
            if (data.synonyms && data.synonyms.length > 0) {
                elSinonimos.innerText = "Sinônimos: " + data.synonyms.slice(0, 3).join(", ");
            }
        } else {
            elSignificado.innerText = "Não encontramos uma definição para '" + palavra + "'.";
        }

    } catch (error) {
        elSignificado.innerText = "O dicionário está offline agora.";
    }
}

