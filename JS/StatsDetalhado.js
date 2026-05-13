async function renderizarStatsCompletos() {
    const codigo = localStorage.getItem("codigoJogador");
    if (!codigo) return;

    try {
        const res = await fetch(`api/buscar_stats_completos.php?codigo=${codigo}`);
        const data = await res.json();

        document.getElementById("taxa-vitoria").textContent = data.taxa_vitoria;
        document.getElementById("media-tentativas").textContent = data.media_tentativas;
        document.getElementById("melhor-tempo").textContent = data.melhor_tempo + "s";

        const corpoTabela = document.getElementById("tabela-corpo");
        corpoTabela.innerHTML = data.historico.map(p => `
            <tr>
                <td data-label="Data">${new Date(p.data_partida).toLocaleDateString('pt-BR')}</td>
                <td data-label="Modo"><span class="modo-badge">${p.modo === 'desafio'? 'Competitivo': p.modo.charAt(0).toUpperCase() + p.modo.slice(1)} </span></td>
                <td data-label="Resultado" style="color: ${p.resultado === 'vitoria' ? '#5fc2f4' : '#ff4d4d'}">${p.resultado}</td>
                <td data-label="Tentativas">${p.tentativas_usadas}</td>
                <td data-label="Tempo">${p.tempo_restante ? p.tempo_restante + 's' : '--'}</td>
            </tr>
        `).join('');
    } catch (e) { console.error("Erro:", e); }
}
window.onload = renderizarStatsCompletos;
