// ==============================
// CONFIGURAÇÕES
// ==============================
const lanes = {
    "ArrowLeft": 0,
    "ArrowDown": 1,
    "ArrowUp": 2,
    "ArrowRight": 3
};

// Mapeamento de nomes de setas para os símbolos visuais
const arrowSymbols = {
    "ArrowLeft": "◀",
    "ArrowDown": "▼",
    "ArrowUp": "▲",
    "ArrowRight": "▶"
};

// Velocidade de descida das notas (px/s)
const NOTE_SPEED = 400;

// Posição de acerto (do topo da área de jogo até o target)
// Seu playfield tem 480px, targets estão em bottom: 40px. 480 - 40 = 440px. 
// Usaremos 440px como a linha de acerto.
const HIT_POSITION_PX = 440; 

// Tolerância de timing
const HIT_WINDOW = 0.160;

// Tempo que a nota leva para descer (1.5s = 440px / 400px/s)
// 440 / 400 = 1.1s. Vamos usar 1.1s para precisão.
const TIME_TO_DROP = HIT_POSITION_PX / NOTE_SPEED; 


// ==============================
// ELEMENTOS DOM
// ==============================
const laneElems = document.querySelectorAll(".lane"); 
const audio = document.getElementById("music"); 
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");

// Chart vindo de window.currentChart
let chart = window.currentChart || [];

// ==============================
// SPAWN DE NOTAS
// ==============================
function spawnNote(obj) {
    let laneIndex = lanes[obj.dir];
    if (laneIndex === undefined) return;

    let note = document.createElement("div");
    note.classList.add("note");
    note.dataset.time = obj.time;
    note.dataset.dir = obj.dir;
    
    // Adiciona o símbolo da seta como conteúdo
    note.textContent = arrowSymbols[obj.dir] || ''; 

    // Long note
    if (obj.duration > 0) {
        note.classList.add("long");
        note.dataset.duration = obj.duration;

        let tail = document.createElement("div");
        tail.classList.add("long-tail");
        note.appendChild(tail);
    }

    laneElems[laneIndex].appendChild(note);
}

// ==============================
// UPDATE DO JOGO (GAME LOOP)
// ==============================
function update() {
    if (audio.paused) {
        return; 
    }
    
    let t = audio.currentTime;

    // Spawn notas na hora certa. Spawnar a nota no topo 1.1s antes do acerto.
    chart.forEach(obj => {
        if (!obj.spawned && t >= obj.time - TIME_TO_DROP) {
            spawnNote(obj);
            obj.spawned = true;
        }
    });

    // Atualizar movimento das notas
    document.querySelectorAll(".note").forEach(note => {
        let time = parseFloat(note.dataset.time);
        let delta = t - time;
        
        // CÁLCULO CORRIGIDO:
        // Posição no eixo Y = Posição de Acerto - Distância que falta para percorrer
        let y = HIT_POSITION_PX - ( (time - t) * NOTE_SPEED);
        
        note.style.top = `${y}px`;

        // Long notes crescendo
        if (note.classList.contains("long")) {
            let dur = parseFloat(note.dataset.duration);
            let tail = note.querySelector(".long-tail");

            let grow = Math.max(0, Math.min(1, delta / dur));
            // A altura da cauda é relativa ao corpo da nota (72px)
            tail.style.height = `${grow * (HIT_POSITION_PX - 72)}px`; // Altura máxima da pista - altura da nota
        }

        // Remover notas muito atrasadas (Abaixo da tela)
        if (y > 550) note.remove();
    });

    requestAnimationFrame(update);
}

// ==============================
// INPUT DO JOGADOR
// ==============================
window.addEventListener("keydown", e => {
    if (!lanes.hasOwnProperty(e.key) || audio.paused) return;

    let lane = lanes[e.key];
    let notes = laneElems[lane].querySelectorAll(".note");

    let t = audio.currentTime;

    let best = null;
    let bestOffset = 999;

    notes.forEach(note => {
        let nTime = parseFloat(note.dataset.time);
        let diff = Math.abs(t - nTime);

        if (diff < bestOffset) {
            best = note;
            bestOffset = diff;
        }
    });

    if (best && bestOffset <= HIT_WINDOW) {
        best.remove();
    }
});

// ==============================
// CONTROLE DO JOGO (Iniciar/Pausar)
// ==============================

// Função para iniciar o jogo (agora ASYNC para tratar a Promise do play)
async function startGame() { 
    audio.currentTime = 0; 
    
    try {
        await audio.play(); 
        
        startBtn.style.display = 'none'; 
        pauseBtn.style.display = 'inline-block';
        
    } catch (error) {
        console.error("Erro ao tentar tocar o áudio:", error);
        alert("O navegador bloqueou o início automático. Clique em OK e tente novamente.");
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
    }
}

// Ouve o clique no botão Iniciar
startBtn.addEventListener("click", startGame);

// Ouve o clique no botão Pausar
pauseBtn.addEventListener("click", () => {
    audio.pause();
    startBtn.style.display = 'inline-block';
    pauseBtn.style.display = 'none';
});


// INICIAR LOOP: Este evento é disparado assim que 'audio.play()' é chamado.
audio.onplay = () => {
    requestAnimationFrame(update);
};