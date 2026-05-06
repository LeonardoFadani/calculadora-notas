// Script principal: estado, comunicação com backend e renderização.

// Estado global: quadros e resultado
const estado = {
    quadros: {
        A1: { ativo: true, pesoQuadro: 20, notas: [{ nota: 0, peso: 0 }] },
        A2: { ativo: false, pesoQuadro: 30, notas: [] },
        A3: { ativo: false, pesoQuadro: 50, notas: [] }
    },
    resultado: null
};

// --- utilitários ---

// Formata número para exibição (corta zeros desnecessários)
function fmt(valor) {
    return Number(valor || 0).toFixed(3).replace(/\.000$/, '.00').replace(/(\.\d*[1-9])0+$/, '$1');
}

// getElementById curto
function porId(id) {
    return document.getElementById(id);
}

// Retorna true se quadro está ativo (A1 sempre ativo)
function quadroAtivo(nome) {
    return nome === 'A1' || estado.quadros[nome].ativo;
}

// --- comunicação: enviar estado ao backend e atualizar resultado ---
async function calcular() {
    const response = await fetch('/api/calcular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quadros: estado.quadros })
    });

    const data = await response.json();
    if (!data.sucesso) {
        alert(data.erro || 'Erro ao calcular');
        return;
    }

    // Sincroniza estado com resposta do backend
    ['A1', 'A2', 'A3'].forEach((nome) => {
        const q = data.quadros[nome];
        estado.quadros[nome].ativo = q.ativo;
        estado.quadros[nome].pesoQuadro = q.pesoQuadro;
        estado.quadros[nome].notas = q.notas.map((n) => ({ nota: n.nota, peso: n.peso }));
    });

    estado.resultado = data;
    renderizar();
}

// --- renderização: atualiza DOM a partir do estado ---
function renderizar() {
    const resultado = estado.resultado;

    ['A1', 'A2', 'A3'].forEach((nome) => {
        const quadro = estado.quadros[nome];
        const ativo = quadroAtivo(nome);
        const bloco = porId(`quadro${nome}`);
        const lista = porId(`notas${nome}`);
        const pesoInput = porId(`peso${nome}`);
        const parcialSpan = porId(`parcial${nome}`);
        const finalSpan = porId(`final${nome}`);
        const addBtn = bloco.querySelector('.btn-add');
        const toggle = nome !== 'A1' ? porId(`toggle${nome}`) : null;

        bloco.classList.toggle('desabilitado', !ativo && nome !== 'A1');
        pesoInput.disabled = !ativo;
        addBtn.disabled = !ativo;

        if (toggle) {
            toggle.checked = quadro.ativo;
        }

        if (nome === 'A3' && toggle) {
            toggle.disabled = !estado.quadros.A2.ativo;
        }

        pesoInput.value = quadro.pesoQuadro;
        parcialSpan.textContent = ativo && resultado ? fmt(resultado.quadros[nome].parcial) : '0.00';
        finalSpan.textContent = ativo && resultado ? fmt(resultado.quadros[nome].final) : '0.00';

        lista.innerHTML = '';
        const notasComFinal = resultado
            ? resultado.quadros[nome].notas
            : quadro.notas.map((n) => ({ ...n, notaFinal: 0 }));

        notasComFinal.forEach((item, i) => {
            const linha = document.createElement('div');
            linha.className = 'nota-item';
            linha.innerHTML = `
                <input type="number" min="0" max="10" step="0.01" value="${item.nota}"
                       onchange="atualizar('${nome}', ${i}, 'nota', this.value)">
                <input type="number" min="0" max="100" step="0.01" value="${item.peso}"
                       onchange="atualizar('${nome}', ${i}, 'peso', this.value)">
                <input type="text" readonly value="${fmt(item.notaFinal)}">
                <button class="btn-remover" onclick="remover('${nome}', ${i})">x</button>
            `;
            lista.appendChild(linha);
        });
    });

    porId('mediaFinal').value = resultado ? fmt(resultado.mediaFinal) : '0.00';
}

// --- manipuladores: adicionar, remover, atualizar, toggles ---
function adicionarNota(nome) {
    if (!quadroAtivo(nome)) return;
    estado.quadros[nome].notas.push({ nota: 0, peso: 0 });
    calcular();
}

// Remove nota por índice
function remover(nome, i) {
    estado.quadros[nome].notas.splice(i, 1);
    calcular();
}

// Atualiza nota/peso e recalcula
function atualizar(nome, i, campo, valor) {
    estado.quadros[nome].notas[i][campo] = Number(valor || 0);
    calcular();
}

// Atualiza peso do quadro
function atualizarPesoQuadro(nome, valor) {
    estado.quadros[nome].pesoQuadro = Number(valor || 0);
    calcular();
}

// Alterna quadro (A2/A3). Regras de negócio simples: A1 sempre ativo; A3 depende de A2.
function alternarQuadro(nome) {
    if (nome === 'A3' && !estado.quadros.A2.ativo) {
        porId('toggleA3').checked = false;
        alert('Para ativar A3, primeiro ative A2.');
        return;
    }

    estado.quadros[nome].ativo = !estado.quadros[nome].ativo;

    // Se desativou, limpa notas
    if (!estado.quadros[nome].ativo) {
        estado.quadros[nome].notas = [];
        // Se A2 foi desativado, desativa também A3
        if (nome === 'A2') {
            estado.quadros.A3.ativo = false;
            estado.quadros.A3.notas = [];
        }
    } else if (estado.quadros[nome].notas.length === 0) {
        // Se ativou e não tinha notas, adiciona uma
        estado.quadros[nome].notas.push({ nota: 0, peso: 0 });
    }

    calcular();
}

// Reseta estado para valores iniciais
function limpar() {
    estado.quadros.A1 = { ativo: true, pesoQuadro: 20, notas: [{ nota: 0, peso: 0 }] };
    estado.quadros.A2 = { ativo: false, pesoQuadro: 30, notas: [] };
    estado.quadros.A3 = { ativo: false, pesoQuadro: 50, notas: [] };
    calcular();
}

/* ============================================================================
   INICIALIZAÇÃO
   ============================================================================ */

// Carrega dados iniciais ao abrir a página
calcular();
