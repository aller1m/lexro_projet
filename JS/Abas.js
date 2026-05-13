function controlarAba(botaoId, overlayId, fecharId) {

  const botao = document.getElementById(botaoId);
  const overlay = document.getElementById(overlayId);
  const fechar = document.getElementById(fecharId);

  if (!overlay) return;

  // abrir (só se existir botão)
  if (botao) {
    botao.addEventListener("click", () => {
      overlay.style.display = "flex";
    });
  }

  // fechar pelo X
  if (fechar) {
    fechar.addEventListener("click", () => {
      overlay.style.display = "none";
    });
  }

  // fechar clicando fora
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.style.display = "none";
    }
  });
}

  function abrirAba(id){
  const overlay = document.getElementById(id);
  if(overlay){
    overlay.style.display = "flex";
  }
}


// conectar cada aba
controlarAba("btnTutorial", "tutorialOverlay", "fecharTutorial");
controlarAba("btnstats", "OverlayStats", "fecharStats");
controlarAba("btnCode", "OverlayCode", "fecharCode");
controlarAba("btnCompe", "OverlayCompe", "fecharCompe");
controlarAba("btnCriar", "OverlayCriar", "fecharCriar");
controlarAba("btnEntrar", "OverlayEntrar", "fecharEntrar");

async function carregarEstatisticas() {
  const codigo = localStorage.getItem("codigoJogador");
  if (!codigo) return;

  try {
    const res = await fetch(`api/buscar_stats.php?codigo=${codigo}`);
    const stats = await res.json();

    // Atualiza o texto dentro da aba-box
    document.getElementById("stat-vitorias").textContent = stats.vitorias;
    document.getElementById("stat-derrotas").textContent = stats.derrotas;
    document.getElementById("stat-sequencia").textContent = stats.sequencia;
    document.getElementById("stat-melhor").textContent = stats.melhor_sequencia;
  } catch (e) {
    console.error("Erro ao carregar stats:", e);
  }
}

// Chamar a função quando o botão de stats for clicado
document.getElementById("btnstats").addEventListener("click", carregarEstatisticas);


async function carregarEstatisticas() {
  const codigo = localStorage.getItem("codigoJogador");
  if (!codigo) return;

  try {
    // Chamando o PHP que já faz os cálculos
    const res = await fetch(`api/buscar_stats_completos.php?codigo=${codigo}`);
    const data = await res.json();

    if (data.sucesso) {
      // Atualiza os IDs específicos que você colocou no HTML da abinha
      const vitoriasEl = document.getElementById("stat-vitorias-resumo");
      const sequenciaEl = document.getElementById("stat-sequencia-resumo");

      if (vitoriasEl) vitoriasEl.textContent = data.geral.vitorias;
      if (sequenciaEl) sequenciaEl.textContent = data.geral.sequencia;
      
      console.log("Stats da abinha atualizados!");
    }
  } catch (e) {
    console.error("Erro ao carregar stats para a abinha:", e);
  }
}

// Garante que o clique no botão chama a atualização dos dados
const btnStats = document.getElementById("btnstats");
if (btnStats) {
    btnStats.addEventListener("click", carregarEstatisticas);
}
