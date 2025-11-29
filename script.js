document.addEventListener('DOMContentLoaded', () => {
    const multiploInput = document.getElementById('multiplo');
    const iniciarBtn = document.getElementById('iniciar-btn');
    const colheitaArea = document.getElementById('colheita-area');
    const pontuacaoEl = document.getElementById('pontuacao');
    const corretosCountEl = document.getElementById('corretos-count');
    const feedbackEl = document.getElementById('feedback');
    const perguntaEl = document.getElementById('pergunta');
    const resetBtn = document.getElementById('reset-btn');
    const SEPARATION_DISTANCE_PX = 50; // Espaço de segurança mínimo entre os centros das frutas (em pixels)
    const MAX_PLACEMENT_ATTEMPTS = 200; // Limite de tentativas para evitar loops infinitos

    const FRUTAS = ['🍎', '🍓', '🍒', '🍇', '🍉', '🥭', '🍍', '🍑', '🥝', '🍋'];
    const MAX_NUMBERS = 20; // NOVO TOTAL: 10 Corretos + 10 Incorretos

    const somAcerto = document.getElementById('som-acerto');
    const somErro = document.getElementById('som-erro');

    let multiploAtual = 4;
    let pontuacao = 0;
    let corretosColhidos = 0;
    let jogoAtivo = false;

    // --- Funções de Lógica de Jogo ---

    // 1. Gera um número aleatório (múltiplo ou não)
    function gerarNumero(isMultiple) {
        if (isMultiple) {
            // Gera um múltiplo entre 1x e 10x
            const fator = Math.floor(Math.random() * 10) + 1;
            return multiploAtual * fator;
        } else {
            // Gera um número que NÃO é múltiplo
            let num;
            do {
                // Tenta um número no intervalo de 1 a (Múltiplo * 10) + 5
                num = Math.floor(Math.random() * (multiploAtual * 10 + 5)) + 1;
            } while (num % multiploAtual === 0); // Repete se for múltiplo

            return num;
        }
    }

    // 2. Cria o campo de colheita (AGORA COM LÓGICA DE DETECÇÃO DE COLISÃO)
// 2. Cria o campo de colheita (FINALIZADO COM DETECÇÃO DE COLISÃO ROBUSTA)
function criarColheita() {
    colheitaArea.innerHTML = '';
    const numerosParaColher = [];
    const placedPositions = []; // Armazena as posições [x, y] das frutas já colocadas

    const numCorretos = 10;
    const numErrados = MAX_NUMBERS - numCorretos;

    // 1. Geração dos 10 múltiplos corretos
    for (let i = 0; i < numCorretos; i++) {
        numerosParaColher.push({ valor: gerarNumero(true), isMultiple: true });
    }

    // 2. Geração dos 10 números errados
    for (let i = 0; i < numErrados; i++) {
        numerosParaColher.push({ valor: gerarNumero(false), isMultiple: false });
    }

    // Embaralha a ordem
    numerosParaColher.sort(() => Math.random() - 0.5);

    // --- FUNÇÃO AUXILIAR DE DETECÇÃO DE COLISÃO ---
    function isOverlapping(newX, newY, existingPositions) {
        for (const pos of existingPositions) {
            const dx = newX - pos[0];
            const dy = newY - pos[1];
            // Distância Euclidiana entre dois pontos
            const distance = Math.sqrt(dx * dx + dy * dy); 
            
            if (distance < SEPARATION_DISTANCE_PX) {
                return true; // Colisão detectada
            }
        }
        return false;
    }
    
    // --- LÓGICA DE POSICIONAMENTO COM LOOP WHILE ---

    // Obtém as dimensões do container para calcular posições reais em pixels
    // Deve ser chamada APÓS o DOM estar pronto
    const containerRect = colheitaArea.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;


    numerosParaColher.forEach(item => {
        const frutaEl = document.createElement('div');
        frutaEl.classList.add('fruta');
        
        const frutaEmoji = FRUTAS[Math.floor(Math.random() * FRUTAS.length)];
        frutaEl.innerHTML = `${frutaEmoji}<br><span>${item.valor}</span>`;
        frutaEl.dataset.isMultiple = item.isMultiple;
        frutaEl.dataset.valor = item.valor;

        let attempt = 0;
        let newX, newY;
        let leftPercent, topPercent;
        let overlap = true;

        while (overlap && attempt < MAX_PLACEMENT_ATTEMPTS) {
            // Gera novas posições aleatórias (10% a 60% top, 5% a 90% left)
            topPercent = Math.floor(Math.random() * 75) + 10; 
            leftPercent = Math.floor(Math.random() * 85) + 5; 

            // Converte a posição percentual em pixels absolutos para a verificação
            newX = (leftPercent / 100) * containerWidth;
            newY = (topPercent / 100) * containerHeight;
            
            // Verifica a colisão com as frutas já colocadas
            overlap = isOverlapping(newX, newY, placedPositions);
            attempt++;
        }

        if (attempt < MAX_PLACEMENT_ATTEMPTS) {
            // Posição encontrada: aplica e armazena
            frutaEl.style.position = 'absolute';
            frutaEl.style.top = `${topPercent}%`;
            frutaEl.style.left = `${leftPercent}%`;
            frutaEl.style.transform = 'translate(-50%, -50%)';
            
            placedPositions.push([newX, newY]); // Armazena a posição central em pixels

            frutaEl.addEventListener('click', handleColheitaClick);
            colheitaArea.appendChild(frutaEl);
        } else {
             // Caso falhe após 200 tentativas, a fruta é ignorada para não travar o jogo.
             // Você não verá mais a mensagem de erro, mas pode faltar uma fruta.
        }
    });
}

    // 3. Lógica do clique na fruta
    function handleColheitaClick(event) {
        if (!jogoAtivo) return;

        const fruta = event.currentTarget;
        const isCorreta = fruta.dataset.isMultiple === 'true';

        fruta.style.pointerEvents = 'none';

        if (isCorreta) {
            fruta.classList.add('correta');
            fruta.classList.add('colhida');
            pontuacao += 10;
            corretosColhidos++;
            feedbackEl.textContent = `Acertou! ${fruta.dataset.valor} é múltiplo de ${multiploAtual}. +10 pontos.`;
            feedbackEl.className = 'feedback success';
            somAcerto.play(); // 🔊 som de acerto
            fruta.removeEventListener('click', handleColheitaClick);
        } else {
            fruta.classList.add('errada');
            pontuacao = Math.max(0, pontuacao - 5);
            feedbackEl.textContent = `Errado! ${fruta.dataset.valor} NÃO é múltiplo de ${multiploAtual}. -5 pontos.`;
            feedbackEl.className = 'feedback error';
            somErro.play(); // 🔊 som de erro
            setTimeout(() => {
                fruta.classList.remove('errada');
                fruta.style.pointerEvents = 'auto';
            }, 500);
    }

    atualizarPlacar();

    if (corretosColhidos === 10) {
        finalizarJogo();
    }
    }


    // 4. Inicia o jogo
    function iniciarJogo() {
        const novoMultiplo = parseInt(multiploInput.value);
        if (isNaN(novoMultiplo) || novoMultiplo < 2 || novoMultiplo > 10) {
            alert("Por favor, insira um número válido entre 2 e 10.");
            return;
        }

        multiploAtual = novoMultiplo;
        pontuacao = 0;
        corretosColhidos = 0;
        jogoAtivo = true;

        iniciarBtn.style.display = 'none';
        multiploInput.disabled = true;
        resetBtn.style.display = 'none';
        
        perguntaEl.textContent = `Verifique em sua tabuada e colha apenas os múltiplos de ${multiploAtual}. Clique nas frutas corretas!`;
        // 🔊 Faz o navegador falar a frase
        const utterance = new SpeechSynthesisUtterance(perguntaEl.textContent);
        utterance.lang = "pt-BR"; // define português do Brasil
        speechSynthesis.speak(utterance);
        feedbackEl.textContent = '';
        
        atualizarPlacar();
        criarColheita();
    }
    
    // 5. Finaliza o jogo
    function finalizarJogo() {
        jogoAtivo = false;
        
        // Remove todos os listeners restantes
        colheitaArea.querySelectorAll('.fruta').forEach(fruta => {
            fruta.removeEventListener('click', handleColheitaClick);
            fruta.style.pointerEvents = 'none';
        });
        
        // Mostra a mensagem final
        let mensagem = `FIM DE JOGO! Você fez ${pontuacao} pontos.`;
        if (corretosColhidos === 10) {
            mensagem += " Parabéns! Você colheu todos os múltiplos!";
        } else {
            mensagem += ` Você colheu ${corretosColhidos} múltiplos de 10.`;
        }
        
        feedbackEl.textContent = mensagem;
        feedbackEl.className = 'feedback success';
        resetBtn.style.display = 'block';
    }

    // 6. Atualiza o placar na tela
    function atualizarPlacar() {
        pontuacaoEl.textContent = pontuacao;
        corretosCountEl.textContent = corretosColhidos;
    }

    // --- Listeners de Evento ---

    iniciarBtn.addEventListener('click', iniciarJogo);
    resetBtn.addEventListener('click', () => {
        iniciarBtn.style.display = 'inline-block';
        multiploInput.disabled = false;
        resetBtn.style.display = 'none';
        colheitaArea.innerHTML = '';
        perguntaEl.textContent = 'Qual tabuada você quer treinar?';
        feedbackEl.textContent = '';
        atualizarPlacar();
    });

    // Inicia a interface padrão
    atualizarPlacar();
});