function mostrarAlert(mensagem) {
    document.getElementById('alertMessage').innerText = mensagem;
    document.getElementById('customAlert').classList.remove('hidden');
}

function fecharAlert() {
    document.getElementById('customAlert').classList.add('hidden');
}

function exportarDados() {
    const dados = {
        codigoJogador:
            localStorage.getItem('codigoJogador'),

        nomeJogador:
            localStorage.getItem('nomeJogador'),

        estatisticas:
            localStorage.getItem('estatisticas'),

        tema:
            localStorage.getItem('tema')
    };

    const codigo = btoa(unescape(encodeURIComponent(JSON.stringify(dados))));

    document.getElementById('codigoExportado').value = codigo;
    mostrarAlert('Código gerado com sucesso!');
}

async function copiarCodigo() {
    const textarea =document.getElementById('codigoExportado');
    if (!textarea.value) {
        mostrarAlert('Gere um código primeiro.');
        return;
    }

    await navigator.clipboard.writeText(textarea.value);
    mostrarAlert('Código copiado!');
}

function importarDados() {

    const codigo = document.getElementById('codigoImportacao').value.trim();

    if (!codigo) {
        mostrarAlert('Cole um código.');
        return;
    }

    try {
        const dados = JSON.parse(decodeURIComponent(escape(atob(codigo))));

         Object.keys(dados).forEach(chave => {localStorage.setItem( chave,  dados[chave] );
        });

        mostrarAlert( 'Conta restaurada com sucesso!' );
        setTimeout(() => {
            window.location.href ='Estatisticas.html'; }, 1500);

    } catch (erro) {
        console.error(erro);
        mostrarAlert('Código inválido ou corrompido.');
    }
}