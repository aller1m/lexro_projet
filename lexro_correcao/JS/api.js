async function postJSON(url, body) {
  const resposta = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return resposta.json();
}

async function criarOuBuscarJogador(codigo, nome = null) {
  return postJSON('api/criar_jogador.php', { codigo, nome });
}

async function buscarPalavraDia() {
  const resposta = await fetch('api/buscar_palavra_dia.php');
  return resposta.json();
}

async function salvarTentativaCompetitiva(jogadorId, palavra, numeroTentativa) {
  return postJSON('api/salvar_tentativa_competitiva.php', {
    jogador_id: jogadorId,
    palavra_digitada: palavra,
    numero_tentativa: numeroTentativa,
  });
}

async function finalizarCompetitivo(jogadorId, resultado, tentativas) {
  return postJSON('api/finalizar_partida_competitiva.php', {
    jogador_id: jogadorId,
    resultado,
    tentativas,
  });
}

async function buscarStatusAmigo(codigoAmigo) {
  const resposta = await fetch(`api/status_amigo.php?codigo=${encodeURIComponent(codigoAmigo)}`);
  return resposta.json();
}
