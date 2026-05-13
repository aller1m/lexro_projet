const LINHAS = 6;
const COLUNAS = 5;
let palavraSecreta = '';
let currentRow = 0;
let currentCol = 0;
let jogadorId = null;
let codigoAmigo = '';
let jogoAtivo = false;

const game = document.getElementById('game');
const gameAmigo = document.getElementById('gameAmigo');
const estadoAmigo = document.getElementById('estadoAmigo');
const statusLigacao = document.getElementById('statusLigacao');

function criarGrid(el, mini = false) {
  el.innerHTML = '';
  for (let i = 0; i < LINHAS; i++) {
    const row = document.createElement('div');
    row.className = mini ? 'row-mini' : 'row';
    for (let j = 0; j < COLUNAS; j++) {
      const cell = document.createElement('div');
      cell.className = mini ? 'cell-mini' : 'cell';
      row.appendChild(cell);
    }
    el.appendChild(row);
  }
}

function normalizar(txt) {
  return txt
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function calcularCores(tentativa, resposta) {
  const t = normalizar(tentativa).split('');
  const r = normalizar(resposta).split('');
  const cores = Array(COLUNAS).fill('errada');

  for (let i = 0; i < COLUNAS; i++) {
    if (t[i] === r[i]) {
      cores[i] = 'correta';
      r[i] = null;
    }
  }

  for (let i = 0; i < COLUNAS; i++) {
    if (cores[i] === 'correta') continue;
    const idx = r.indexOf(t[i]);
    if (idx !== -1) {
      cores[i] = 'presente';
      r[idx] = null;
    }
  }
  return cores;
}

function pintarLinha(rowIndex, cores) {
  const row = game.children[rowIndex];
  for (let i = 0; i < COLUNAS; i++) {
    row.children[i].classList.add(cores[i]);
  }
}

function renderizarAmigo(linhas) {
  criarGrid(gameAmigo, true);
  linhas.forEach((cores, rowIndex) => {
    const row = gameAmigo.children[rowIndex];
    cores.forEach((cor, colIndex) => {
      row.children[colIndex].classList.add(cor);
    });
  });
}

function adicionarLetra(letra) {
  if (!jogoAtivo || currentCol >= COLUNAS) return;
  const row = game.children[currentRow];
  row.children[currentCol].textContent = letra;
  currentCol++;
}

function removerLetra() {
  if (!jogoAtivo || currentCol <= 0) return;
  currentCol--;
  const row = game.children[currentRow];
  row.children[currentCol].textContent = '';
}

async function verificarPalavra() {
  if (!jogoAtivo) return;
  if (currentCol < COLUNAS) {
    alert('Digite a palavra completa');
    return;
  }

  const row = game.children[currentRow];
  let tentativa = '';
  for (let i = 0; i < COLUNAS; i++) tentativa += row.children[i].textContent;

  const cores = calcularCores(tentativa, palavraSecreta);
  pintarLinha(currentRow, cores);
  await salvarTentativaCompetitiva(jogadorId, tentativa, currentRow + 1);

  if (normalizar(tentativa) === normalizar(palavraSecreta)) {
    jogoAtivo = false;
    await finalizarCompetitivo(jogadorId, 'vitoria', currentRow + 1);
    alert(`Vitória em ${currentRow + 1} tentativa(s)!`);
    return;
  }

  currentRow++;
  currentCol = 0;

  if (currentRow >= LINHAS) {
    jogoAtivo = false;
    await finalizarCompetitivo(jogadorId, 'derrota', LINHAS);
    alert(`Fim de jogo. A palavra era ${palavraSecreta}`);
  }
}

async function atualizarAmigo() {
  if (!codigoAmigo) return;
  const dados = await buscarStatusAmigo(codigoAmigo);
  if (!dados.sucesso) {
    estadoAmigo.textContent = 'Amigo não encontrado.';
    return;
  }

  const estado = dados.estado;
  renderizarAmigo(estado.linhas || []);

  if (estado.resultado === 'vitoria') {
    estadoAmigo.textContent = `O teu amigo acertou em ${estado.tentativas} tentativa(s).`;
  } else if (estado.resultado === 'derrota') {
    estadoAmigo.textContent = 'O teu amigo não conseguiu acertar.';
  } else {
    estadoAmigo.textContent = `O teu amigo já fez ${estado.linhas.length} tentativa(s).`;
  }
}

async function iniciar() {
  const meuCodigo = document.getElementById('meuCodigo').value.trim().toUpperCase();
  codigoAmigo = document.getElementById('codigoAmigo').value.trim().toUpperCase();

  if (!meuCodigo || !codigoAmigo) {
    alert('Preenche os dois códigos.');
    return;
  }

  const jogador = await criarOuBuscarJogador(meuCodigo);
  if (!jogador.sucesso) {
    alert(jogador.erro || 'Erro ao criar jogador');
    return;
  }

  jogadorId = jogador.jogador.id;

  const palavraDia = await buscarPalavraDia();
  if (palavraDia.erro) {
    alert(palavraDia.erro);
    return;
  }

  palavraSecreta = palavraDia.palavra;
  currentRow = 0;
  currentCol = 0;
  jogoAtivo = true;

  criarGrid(game, false);
  criarGrid(gameAmigo, true);
  statusLigacao.textContent = `Ligado como ${meuCodigo}. Palavra do dia pronta.`;
  atualizarAmigo();
}

document.getElementById('btnEntrar').addEventListener('click', iniciar);

document.addEventListener('keydown', (e) => {
  if (!jogoAtivo) return;
  if (e.key === 'Backspace') removerLetra();
  else if (e.key === 'Enter') verificarPalavra();
  else if (/^[a-zA-ZÀ-ÿ]$/.test(e.key)) adicionarLetra(e.key.toUpperCase());
});

setInterval(atualizarAmigo, 3000);
criarGrid(game, false);
criarGrid(gameAmigo, true);
