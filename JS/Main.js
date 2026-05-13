async function criarJogador(nome) {
  try {
    const res = await fetch("api/criar_jogador.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome })
    });

    // Verificamos se o servidor retornou erro 500 ou 404
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Erro do Servidor:", errorText);
      //mostrarAlert("O servidor respondeu com erro. Verifique o console F12.");
      return;
    }

    const data = await res.json();

    if (data.sucesso) {
      localStorage.setItem("codigoJogador", data.jogador.codigo_unico);
      //mostrarAlert("Perfil criado! Código: " + data.jogador.codigo_unico);
      //location.reload(); // Recarrega para garantir que o sistema veja o novo código
    } else {
      //mostrarAlert("O PHP disse: " + data.erro);
      if (data.detalhe) console.error("Detalhe técnico:", data.detalhe);
    }
  } catch (error) {
    console.error("Erro na requisição:", error);
    //mostrarAlert("Não foi possível falar com o servidor. Verifique se o Apache/MySQL estão ligados.");
  }
}



async function iniciarSistema() {
  let codigoExistente = localStorage.getItem("codigoJogador");

  if (!codigoExistente) {
    console.log("Nenhum jogador encontrado. Solicitando nome...");

    let nome = await pedirNome();

    if (!nome || nome.trim() === "") {
      nome = "Jogador" + Math.floor(Math.random() * 1000);
    }

    await criarJogador(nome);

    console.log("Novo código salvo:", localStorage.getItem("codigoJogador"));
    mostrarMenu();
  } else {
    console.log("Jogador já identificado:", codigoExistente);
    mostrarMenu();
  }
}

function mostrarMenu() {
  document.getElementById("menu").classList.remove("hidden");
}

// 🔹 Prompt custom (substitui o prompt())
function pedirNome() {
  return new Promise((resolve) => {
    let overlay = document.createElement("div");
    overlay.id = "customPrompt";

    overlay.innerHTML = `
      <div class="prompt-box">
        <h2>Bem-vindo ao Lexro!</h2>
        <p>Qual seu nome de jogador?</p>
        <input type="text" id="nomeInput" placeholder="Digite seu nome">
        <button id="btnConfirmar">Confirmar</button>
      </div>
    `;

    document.body.appendChild(overlay);

    let input = document.getElementById("nomeInput");
    let botao = document.getElementById("btnConfirmar");

    botao.onclick = () => {
      let nome = input.value;
      overlay.remove();
      resolve(nome);
    };

    // Enter também confirma
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        botao.click();
      }
    });
  });
}
// Executa assim que a página carregar
window.onload = iniciarSistema;



// Exibe o menu após a animação

function abrirJogo() {
  window.location.href = "Classico.html";
}

function JogoCompetitivo() {
 window.location.href = "CompVStime.html";
}

function Estatísticas() {
 window.location.href = "Estatisticas.html";
}

function Codigo(){
   window.location.href = "Codigo.html";
}

function Sobre() {
  window.location.href = "Sobre.html";
}


function exportarDados() {

    const dados = {
        codigo: localStorage.getItem('codigoJogador'),
        nome: localStorage.getItem('nomeJogador')
    };

    const codigo = btoa(JSON.stringify(dados));

    navigator.clipboard.writeText(codigo);

    alert('Código copiado!');
}

function importarDados(codigo) {

    try {

        const dados = JSON.parse(atob(codigo));

        localStorage.setItem('codigoJogador', dados.codigo);
        localStorage.setItem('nomeJogador', dados.nome);

        alert('Conta restaurada!');

    } catch {

        alert('Código inválido');
    }
}

