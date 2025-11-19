// -------------------------------------------------------------
//  CONFIG
// -------------------------------------------------------------
const lanes = {
    ArrowLeft: 0,
    ArrowDown: 1,
    ArrowUp: 2,
    ArrowRight: 3
};

const symbols = {
    ArrowLeft: "◀",
    ArrowDown: "▼",
    ArrowUp: "▲",
    ArrowRight: "▶"
};

const NOTE_SPEED = 420;   // px/sec
const HIT_Y = 460;        
const PERFECT = 0.08;
const GOOD = 0.16;
const HOLD_TICK_POINTS = 25; 
const HOLD_TICK_INTERVAL = 100; 
const PENALTY_THRESHOLD = 2000; // Pontuação mínima para começar a perder pontos
const PENALTY_AMOUNT = 400;     // Valor da penalidade de miss (400 pontos)

const audio = document.getElementById("music");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");

const laneInners = document.querySelectorAll(".laneInner");
const targets = document.querySelectorAll(".target");

let score = 0;
let combo = 0;
let maxCombo = 0;
let gameRunning = false;
let raf;

let highScore = 0; 

const holdingNotes = new Map(); 

// -------------------------------------------------------------
//  CHART EXEMPLO GRANDE (com long notes)
// -------------------------------------------------------------
const chart = [
    // --- INTRO SIMPLES (0–6s) ---
    { time: 1, lane: 1, hold: 0 },
    { time: 2, lane: 2, hold: 0 },
    { time: 3, lane: 0, hold: 0 },
    { time: 4, lane: 3, hold: 0 },
    { time: 5.5, lane: 1, hold: 0 },

    // --- PRIMEIRA PARTE RITMADA (6–15s) ---
    { time: 6, lane: 0, hold: 0 },
    { time: 6.5, lane: 1, hold: 0 },
    { time: 7, lane: 2, hold: 0 },
    { time: 7.5, lane: 3, hold: 0 },

    { time: 8, lane: 0, hold: 0 },
    { time: 8.25, lane: 0, hold: 0 },
    { time: 8.5, lane: 1, hold: 0 },
    { time: 9, lane: 2, hold: 0 },
    { time: 9.5, lane: 3, hold: 0 },

    // mini combo
    { time: 10, lane: 1, hold: 0 },
    { time: 10.2, lane: 1, hold: 0 },
    { time: 10.4, lane: 1, hold: 0 },

    // --- NOTAS LONGAS (11–16s) ---
    { time: 11, lane: 0, hold: 2 }, // segura 2s
    { time: 12, lane: 2, hold: 1.5 },
    { time: 13.5, lane: 3, hold: 2 },
    { time: 15, lane: 1, hold: 1 },

    // --- PARTE RÁPIDA (16–30s) ---
    { time: 16, lane: 0, hold: 0 },
    { time: 16.3, lane: 1, hold: 0 },
    { time: 16.6, lane: 2, hold: 0 },
    { time: 16.9, lane: 3, hold: 0 },

    { time: 17.5, lane: 0, hold: 0 },
    { time: 18, lane: 2, hold: 0 },
    { time: 18.5, lane: 3, hold: 0 },
    { time: 19, lane: 1, hold: 0 },
    { time: 19.3, lane: 1, hold: 0 },
    { time: 19.6, lane: 1, hold: 0 },

    // combo rápido
    { time: 20, lane: 0, hold: 0 },
    { time: 20.15, lane: 1, hold: 0 },
    { time: 20.3, lane: 2, hold: 0 },
    { time: 20.45, lane: 3, hold: 0 },
    { time: 20.6, lane: 2, hold: 0 },
    { time: 20.75, lane: 1, hold: 0 },

    // --- NOTAS LONGAS PESADAS (30–40s) ---
    { time: 30, lane: 0, hold: 3 },
    { time: 31, lane: 1, hold: 2.5 },
    { time: 32.5, lane: 3, hold: 3 },
    { time: 34, lane: 2, hold: 4 },

    // --- FINAL ÉPICO (40–60s) ---
    { time: 40, lane: 0, hold: 0 },
    { time: 40.3, lane: 3, hold: 0 },
    { time: 40.6, lane: 2, hold: 0 },
    { time: 40.9, lane: 1, hold: 0 },

    { time: 42, lane: 0, hold: 1 },
    { time: 43.5, lane: 3, hold: 1 },

    // chuva de notas
    { time: 45, lane: 1, hold: 0 },
    { time: 45.2, lane: 1, hold: 0 },
    { time: 45.4, lane: 2, hold: 0 },
    { time: 45.6, lane: 2, hold: 0 },
    { time: 45.8, lane: 3, hold: 0 },
    { time: 46, lane: 3, hold: 0 },
    { time: 46.2, lane: 0, hold: 0 },
    { time: 46.4, lane: 0, hold: 0 },

    // final boss
    { time: 50, lane: 3, hold: 3 },
    { time: 51, lane: 0, hold: 3 },

    // últimos hits
    { time: 56, lane: 1, hold: 0 },
    { time: 57, lane: 2, hold: 0 },
    { time: 58, lane: 3, hold: 0 },
    { time: 59, lane: 0, hold: 0 },
];

// Mapeia o hold para o campo duration, adiciona a direção
chart.forEach(n => {
    n.spawned = false;
    n.duration = n.hold;
    n.dir = Object.keys(lanes).find(key => lanes[key] === n.lane);
    n.isHeld = false; 
});


// -------------------------------------------------------------
//  HUD
// -------------------------------------------------------------
function updateHUD() {
    scoreEl.textContent = "Pontos: " + score;
    comboEl.textContent = "Combo: " + combo;
}

// -------------------------------------------------------------
//  SPAWN NOTE
// -------------------------------------------------------------
function spawnNote(n) {
    const laneIndex = n.lane; 
    const wrap = laneInners[laneIndex];

    const el = document.createElement("div");
    el.className = "arrow";
    el.textContent = symbols[n.dir];
    el.dataset.time = n.time;
    el.dataset.dir = n.dir;
    el.dataset.duration = n.duration;
    el.dataset.held = "false"; 
    el.dataset.missed = "false"; // FLAG CRÍTICA: Rastreia se a nota já acionou o miss

    if (n.duration > 0) {
        const tail = document.createElement("div");
        tail.className = "long-tail";
        el.appendChild(tail);
        el.classList.add("longHead");
    }

    wrap.appendChild(el);
}

// -------------------------------------------------------------
// PONTUAÇÃO DE HOLDING 
// -------------------------------------------------------------
function scoreHold(dir, noteEl) {
    if (!gameRunning) {
        holdingNotes.delete(dir);
        document.querySelector(`.target[data-dir='${dir}']`).classList.remove("holding");
        return; 
    }
    
    if (!holdingNotes.has(dir) || holdingNotes.get(dir) !== noteEl) return;

    // Remove a nota se o tempo dela já tiver acabado
    const t = audio.error ? (performance.now() - startTime) / 1000 : audio.currentTime;
    const tEnd = parseFloat(noteEl.dataset.time) + parseFloat(noteEl.dataset.duration);
    
    if (t >= tEnd) {
        // A nota acabou, remove o estado de hold e o elemento
        holdingNotes.delete(dir);
        document.querySelector(`.target[data-dir='${dir}']`).classList.remove("holding");
        noteEl.remove();
        return; 
    }

    // Ganha pontos por tick
    score += HOLD_TICK_POINTS; 
    
    highScore = Math.max(highScore, score); 
    
    updateHUD();

    showHoldFeedback(dir);

    // Configura o próximo tick
    setTimeout(() => scoreHold(dir, noteEl), HOLD_TICK_INTERVAL);
}

// -------------------------------------------------------------
//  MAIN UPDATE LOOP
// -------------------------------------------------------------
function update() {
    if (!gameRunning) return;

    const t = audio.error ? (performance.now() - startTime) / 1000 : audio.currentTime;
    
    highScore = Math.max(highScore, score);

    // spawn
    chart.forEach(n => {
        if (!n.spawned && t >= n.time - (HIT_Y / NOTE_SPEED)) {
            spawnNote(n);
            n.spawned = true;
        }
    });

    // mover notas e checar miss das long notes não-mantidas
    document.querySelectorAll(".arrow").forEach(note => {
        const tNote = parseFloat(note.dataset.time);
        const duration = parseFloat(note.dataset.duration);
        const y = HIT_Y - ((tNote - t) * NOTE_SPEED);
        
        // CRÍTICO: Rastreia se a nota já foi processada como miss
        const alreadyMissed = note.dataset.missed === 'true'; 

        note.style.top = y + "px";

        // long tail
        if (duration > 0) {
            const tail = note.querySelector(".long-tail");
            const holdPixels = duration * NOTE_SPEED;
            tail.style.height = holdPixels + "px";

            // Se é uma nota longa E ela passou da linha final E não foi acertada E NÃO FOI MARCADA COMO MISS
            if (y > HIT_Y + 120 && note.dataset.held === "false" && !alreadyMissed) {
                note.dataset.missed = 'true'; // Marca como processada
                note.remove(); 
                registerMiss();
            }
        }
        
        // Miss para notas simples (duração 0) E NÃO FOI MARCADA COMO MISS
        else if (duration === 0 && y > HIT_Y + 120 && !alreadyMissed) {
            note.dataset.missed = 'true'; // Marca como processada
            note.remove(); 
            registerMiss();
        }
    });

    raf = requestAnimationFrame(update);

    if (t > chart[chart.length - 1].time + 2) {
        endGame();
    }
}

// -------------------------------------------------------------
//  SCORE SYSTEM
// -------------------------------------------------------------
function registerHit(note, offset) {
    let gain = 0;
    let result = "BAD";

    if (Math.abs(offset) <= PERFECT) {
        gain = 300;
        result = "PERFECT";
    }
    else if (Math.abs(offset) <= GOOD) {
        gain = 100;
        result = "GOOD";
    }

    if (gain > 0) {
        combo++;
        maxCombo = Math.max(maxCombo, combo);
    } else {
        combo = 0; 
    }

    score += gain;
    
    highScore = Math.max(highScore, score); 
    
    updateHUD();
    showFeedback(note, result);
}

function registerMiss() {
    combo = 0;
    
    // LÓGICA DE PENALIDADE: Perda de 400 pontos só ocorre se score >= 2000
    if (score >= PENALTY_THRESHOLD) {
        score -= PENALTY_AMOUNT; 
    } 
    // Se score < 2000, o score não é alterado (apenas o combo zera).
    
    updateHUD(); 

    // FINALIZAÇÃO: O jogo termina se a pontuação for 0 ou negativa.
    if (score <= 0) {
        endGame();
    }
}

// Feedback visual
function showFeedback(note, result) {
    const feedbackEl = document.createElement("div");
    feedbackEl.textContent = result;
    feedbackEl.className = "feedback " + result.toLowerCase();
    
    // Posiciona o feedback sobre o target da nota
    const laneIndex = lanes[note.dataset.dir];
    const targetEl = targets[laneIndex]; 
    targetEl.parentElement.appendChild(feedbackEl);
    
    // Remove após a animação
    setTimeout(() => feedbackEl.remove(), 600);
}

// Feedback visual do Hold
function showHoldFeedback(dir) {
    const targetEl = document.querySelector(`.target[data-dir='${dir}']`);
    targetEl.classList.add("holding");
}


// -------------------------------------------------------------
//  KEY HANDLING
// -------------------------------------------------------------

// Gerencia o soltar da tecla (para notas longas)
document.addEventListener("keyup", (e) => {
    if (!(e.key in lanes)) return;
    if (!gameRunning) return;
    
    const targetEl = document.querySelector(`.target[data-dir='${e.key}']`);
    targetEl.classList.remove("holding");

    // Verifica se estava segurando uma nota longa
    if (holdingNotes.has(e.key)) {
        const noteEl = holdingNotes.get(e.key);
        
        // Se a nota ainda não terminou, a pessoa soltou cedo -> Miss
        const t = audio.error ? (performance.now() - startTime) / 1000 : audio.currentTime;
        const tEnd = parseFloat(noteEl.dataset.time) + parseFloat(noteEl.dataset.duration);
        
        if (t < tEnd) {
            // Marca como miss e remove.
            registerMiss(); 
            noteEl.remove();
        }
        
        // Remove do rastreamento de hold
        holdingNotes.delete(e.key);
    }
});


// Gerencia o apertar da tecla
document.addEventListener("keydown", (e) => {
    if (!(e.key in lanes)) return;
    if (!gameRunning) return;
    
    // CRÍTICO: Evita repetição automática de tecla (muito importante para penalidade)
    if (e.repeat) return; 

    const laneIndex = lanes[e.key];
    const notes = Array.from(laneInners[laneIndex].querySelectorAll(".arrow"));

    if (notes.length === 0) {
        animateTarget(e.key);
        return; 
    }

    const t = audio.error ? (performance.now() - startTime) / 1000 : audio.currentTime;
    let best = null;
    let bestDiff = 999;

    // Encontra a nota mais próxima da linha de acerto
    for (let n of notes) {
        const diff = Math.abs(t - parseFloat(n.dataset.time));
        if (diff < bestDiff) {
            bestDiff = diff;
            best = n;
        }
    }

    if (!best) return;

    animateTarget(e.key);

    // Verifica se a nota está dentro da margem de acerto (GOOD)
    if (bestDiff <= GOOD) {
        const duration = parseFloat(best.dataset.duration);

        if (duration > 0) {
            // É uma nota longa. Registra o acerto da cabeça e inicia o hold.
            registerHit(best, t - parseFloat(best.dataset.time));
            
            // Marca a cabeça como acertada para não dar miss se passar da tela
            best.dataset.held = "true";
            
            // Inicia o loop de pontuação por hold
            holdingNotes.set(e.key, best);
            scoreHold(e.key, best);

        } else {
            // É uma nota simples.
            registerHit(best, t - parseFloat(best.dataset.time));
            best.remove();
        }
    } else {
        // Nota muito longe (early ou late)
        registerMiss();
    }
});

// -------------------------------------------------------------
// TARGET ANIMATION
// -------------------------------------------------------------
function animateTarget(dir) {
    document.querySelector(`.target[data-dir='${dir}']`).classList.add("hit");
    setTimeout(() => {
        document.querySelector(`.target[data-dir='${dir}']`).classList.remove("hit");
    }, 150);
}

// -------------------------------------------------------------
//  GAME OVER
// -------------------------------------------------------------
function endGame() {
    // 1. Defina gameRunning como false primeiro para parar todos os loops
    gameRunning = false;
    audio.pause();
    cancelAnimationFrame(raf);

    // 2. Limpa todos os estados de hold E a classe visual
    holdingNotes.forEach((noteEl, key) => {
        document.querySelector(`.target[data-dir='${key}']`).classList.remove("holding");
    });
    holdingNotes.clear();


    // Garante que o Game Over apareça apenas uma vez
    if (document.getElementById("gameOver")) return;

    // Determina se a pontuação atual é o novo recorde
    const isNewRecord = score > highScore;
    highScore = Math.max(highScore, score); 

    const box = document.createElement("div");
    box.id = "gameOver";
    box.innerHTML = `
        <div class="panel">
            <h2>FIM DE JOGO!</h2>
            <p class="finalScore">Pontos Finais: <b>${score}</b></p>
            <p class="maxCombo">Maior Combo: <b>${maxCombo}</b></p>
            <p class="highScore">Recorde: <b class="${isNewRecord ? 'newRecord' : ''}">${highScore}</b></p> 
            <button id="retryBtn">Tentar Novamente</button>
        </div>
    `;

    document.body.appendChild(box);

    document.getElementById("retryBtn").onclick = () => {
        box.remove();
        resetGame();
        // Reinicia o jogo após reset
        document.getElementById("startBtn").onclick(); 
    };
}

// -------------------------------------------------------------
// RESET / START
// -------------------------------------------------------------
let startTime; 

function resetGame() {
    score = 0;
    combo = 0;
    maxCombo = 0;
    
    if (audio && !audio.error) {
        audio.currentTime = 0;
    }

    chart.forEach(n => {
        n.spawned = false;
        n.isHeld = false; 
    });
    document.querySelectorAll(".arrow").forEach(a => a.remove());

    updateHUD();
}

document.getElementById("startBtn").onclick = async () => {
    resetGame();
    
    try {
        await audio.play();
        startTime = performance.now(); 
    } catch (e) {
        console.error("Falha ao tocar áudio (music.mp3). Iniciando sem sincronia musical.", e);
        startTime = performance.now(); 
    }

    gameRunning = true;
    update();
};