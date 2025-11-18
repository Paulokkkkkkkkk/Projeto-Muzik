// -------------------------------------------------------------
//  CONFIG
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

const NOTE_SPEED = 420;   // px/sec
const HIT_Y = 440;        // posição do target
const PERFECT = 0.08;
const GOOD = 0.16;

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

// -------------------------------------------------------------
//  CHART EXEMPLO GRANDE (com long notes)
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
});


// -------------------------------------------------------------
//  HUD
// -------------------------------------------------------------
function updateHUD() {
    scoreEl.textContent = "Pontos: " + score;
    comboEl.textContent = "Combo: " + combo;
}

// -------------------------------------------------------------
//  SPAWN NOTE
// -------------------------------------------------------------
function spawnNote(n) {
    const laneIndex = n.lane; // Usando o lane index diretamente
    const wrap = laneInners[laneIndex];

    const el = document.createElement("div");
    el.className = "arrow";
    el.textContent = symbols[n.dir];
    el.dataset.time = n.time;
    el.dataset.dir = n.dir;
    el.dataset.duration = n.duration;

    if (n.duration > 0) {
        const tail = document.createElement("div");
        tail.className = "long-tail";
        el.appendChild(tail);
        el.classList.add("longHead");
    }

    wrap.appendChild(el);
}

// -------------------------------------------------------------
//  MAIN UPDATE LOOP
// -------------------------------------------------------------
function update() {
    if (!gameRunning) return;

    // Se o áudio falhou, usamos um tempo simulado. Caso contrário, usamos o tempo do áudio.
    const t = audio.error ? (performance.now() - startTime) / 1000 : audio.currentTime;

    // spawn
    chart.forEach(n => {
        if (!n.spawned && t >= n.time - (HIT_Y / NOTE_SPEED)) {
            spawnNote(n);
            n.spawned = true;
        }
    });

    // mover notas
    document.querySelectorAll(".arrow").forEach(note => {
        const tNote = parseFloat(note.dataset.time);
        const duration = parseFloat(note.dataset.duration);

        // A posição Y é calculada pela diferença de tempo até o hit point (tNote)
        const y = HIT_Y - ((tNote - t) * NOTE_SPEED);
        note.style.top = y + "px";

        // long tail
        if (duration > 0) {
            const tail = note.querySelector(".long-tail");
            const holdPixels = duration * NOTE_SPEED;
            tail.style.height = holdPixels + "px";
        }

        // passou da linha = miss
        if (y > HIT_Y + 120) {
            note.remove();
            registerMiss();
        }
    });

    raf = requestAnimationFrame(update);

    // Fim do Jogo: Parar o loop se a última nota passou
    if (t > chart[chart.length - 1].time + 2) {
        endGame();
    }
}

// -------------------------------------------------------------
//  SCORE SYSTEM
// -------------------------------------------------------------
function registerHit(note, offset) {
    let gain = 0;

    if (Math.abs(offset) <= PERFECT) gain = 300;
    else if (Math.abs(offset) <= GOOD) gain = 100;
    else gain = 0;

    // long note - hit head
    const dur = parseFloat(note.dataset.duration);
    if (dur > 0) gain += 100;

    if (gain > 0) {
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        // Exibir feedback de acerto (Perfect/Good)
        const result = Math.abs(offset) <= PERFECT ? "PERFECT" : "GOOD";
        showFeedback(note, result);
    } else {
        // Se gain for 0 (hit ruim, mas dentro do GOOD), ainda é miss de combo
        combo = 0; 
        showFeedback(note, "BAD");
    }

    score += gain;
    updateHUD();
}

function registerMiss() {
    combo = 0;
    score -= 500;
    if (score < 0) score = 0;
    updateHUD();

    // Comentando o Game Over por enquanto, para não ser tão punitivo no início.
    /*
    if (score <= 0) {
        endGame();
    }
    */
}

// Feedback visual
function showFeedback(note, result) {
    // Adicionar lógica de feedback visual (ex: texto flutuante "PERFECT")
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


// -------------------------------------------------------------
//  KEY HANDLING
// -------------------------------------------------------------
document.addEventListener("keydown", (e) => {
    if (!(e.key in lanes)) return;
    if (!gameRunning) return;

    const laneIndex = lanes[e.key];
    const notes = Array.from(laneInners[laneIndex].querySelectorAll(".arrow"));

    if (notes.length === 0) {
        // Não penaliza se não houver notas para acertar
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
        registerHit(best, t - parseFloat(best.dataset.time));
        best.remove();
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
//  GAME OVER
// -------------------------------------------------------------
function endGame() {
    gameRunning = false;
    audio.pause();
    cancelAnimationFrame(raf);

    // Garante que o Game Over apareça apenas uma vez
    if (document.getElementById("gameOver")) return;

    const box = document.createElement("div");
    box.id = "gameOver";
    box.innerHTML = `
        <div class="panel">
            <h2>FIM DE JOGO!</h2>
            <p>Pontos: <b>${score}</b></p>
            <p>Maior Combo: <b>${maxCombo}</b></p>
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
let startTime; // Variável para rastrear o tempo de início, caso o áudio falhe

function resetGame() {
    score = 0;
    combo = 0;
    maxCombo = 0;
    
    // Reseta o estado do áudio
    if (audio && !audio.error) {
        audio.currentTime = 0;
    }

    chart.forEach(n => n.spawned = false);
    document.querySelectorAll(".arrow").forEach(a => a.remove());

    updateHUD();
}

// ** CORREÇÃO CRUCIAL AQUI: Trata o erro do áudio! **
document.getElementById("startBtn").onclick = async () => {
    resetGame();
    
    // Tenta tocar o áudio. Se o 404 acontecer, o .catch é executado e o jogo continua.
    try {
        await audio.play();
        startTime = performance.now(); // Tempo real do áudio
    } catch (e) {
        console.error("Falha ao tocar áudio (music.mp3). Iniciando sem sincronia musical.", e);
        // Define o tempo de início do jogo baseado no relógio do navegador (performance.now())
        startTime = performance.now(); 
    }

    gameRunning = true;
    update();
};