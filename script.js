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

const NOTE_SPEED = 480;   // px/sec
const HIT_Y = 460;        
const PERFECT = 0.08;
const GOOD = 0.16;
const HOLD_TICK_POINTS = 25; 
const HOLD_TICK_INTERVAL = 100; 
const PENALTY_THRESHOLD = 2000; 
const PENALTY_AMOUNT = 400;     

const audio = document.getElementById("music");
const scoreEl = document.getElementById("score");
const comboEl = document.getElementById("combo");

const laneInners = document.querySelectorAll(".laneInner");
const targets = document.querySelectorAll(".target");
const musicSelect = document.getElementById("musicSelect");
const startButton = document.getElementById("startBtn");
const selectionScreen = document.getElementById("musicSelectionScreen");

// Elementos da área de jogo para controle de visibilidade
const gameArea = document.getElementById("gameArea");
const targetsContainer = document.getElementById("targets");


let score = 0;
let combo = 0;
let maxCombo = 0;
let gameRunning = false;
let raf;

let highScore = 0; 
let penaltyUnlocked = false; 

const holdingNotes = new Map(); 

// -------------------------------------------------------------
//  MÚSICAS E CHARTS
// -------------------------------------------------------------

const SONGS = {
    "Aura - Ogryzek": {
        src: "Aura.mp3",
        chart: [
            { time: 3.00, lane: 0, hold: 0 },
            { time: 3.50, lane: 2, hold: 0 },
            { time: 4.00, lane: 1, hold: 0 },
            { time: 4.50, lane: 3, hold: 0 },
            { time: 5.00, lane: 0, hold: 0 },
            { time: 5.50, lane: 2, hold: 0 },
            { time: 6.00, lane: 1, hold: 0 },
            { time: 6.50, lane: 3, hold: 0 },
            { time: 7.00, lane: 0, hold: 0 },
            { time: 7.50, lane: 2, hold: 0 },
            { time: 8.00, lane: 1, hold: 0 },
            { time: 8.50, lane: 3, hold: 0 },
            { time: 9.00, lane: 2, hold: 0 },
            { time: 23.00, lane: 3, hold: 0 },
            { time: 23.50, lane: 3, hold: 0 },
            { time: 24.00, lane: 3, hold: 0 },
            { time: 9.50, lane: 1, hold: 0 },
            { time: 10.00, lane: 3, hold: 0 },
            { time: 10.50, lane: 0, hold: 0 },
            { time: 11.00, lane: 2, hold: 0 },
            { time: 11.50, lane: 1, hold: 0 },
            { time: 12.00, lane: 3, hold: 0 },
            { time: 12.50, lane: 0, hold: 0 },
            { time: 13.00, lane: 2, hold: 0 },
            { time: 13.50, lane: 1, hold: 0 },
            { time: 14.00, lane: 3, hold: 0 },
            { time: 14.50, lane: 0, hold: 0 },
            { time: 15.00, lane: 1, hold: 0 },
            { time: 15.50, lane: 2, hold: 0 },
            { time: 16.00, lane: 3, hold: 0 },
            { time: 16.50, lane: 1, hold: 0 },
            { time: 17.00, lane: 2, hold: 0 },
            { time: 17.50, lane: 3, hold: 0 },
            { time: 18.00, lane: 0, hold: 0 },
            { time: 19.00, lane: 1, hold: 0 },
            { time: 20.50, lane: 2, hold: 0 },
            { time: 23.00, lane: 3, hold: 0 },
            { time: 23.50, lane: 3, hold: 0 },
            { time: 24.00, lane: 3, hold: 0 },
            { time: 25.00, lane: 0, hold: 0 },
            { time: 25.50, lane: 2, hold: 0 },
            { time: 26.00, lane: 1, hold: 0 },
            { time: 27.00, lane: 3, hold: 0 },
            { time: 27.30, lane: 3, hold: 0 },
            { time: 29.00, lane: 3, hold: 0 },
            { time: 30.00, lane: 1, hold: 0 },
            { time: 30.50, lane: 2, hold: 0 },
            { time: 31.00, lane: 0, hold: 0 },
            { time: 31.50, lane: 3, hold: 0 },
            { time: 32.00, lane: 1, hold: 0 },
            { time: 33.00, lane: 3, hold: 0 },
            { time: 33.30, lane: 3, hold: 0 },
            { time: 34.00, lane: 0, hold: 0 },
            { time: 34.50, lane: 2, hold: 0 },
            { time: 35.00, lane: 1, hold: 0 },
            { time: 35.50, lane: 3, hold: 0 },
            { time: 36.00, lane: 2, hold: 0 },
            { time: 36.50, lane: 1, hold: 0 },
            { time: 37.00, lane: 0, hold: 0 },
            { time: 38.00, lane: 3, hold: 0 },
            { time: 38.30, lane: 3, hold: 0 },
            { time: 39.00, lane: 0, hold: 0 },
            { time: 39.50, lane: 2, hold: 0 },
            { time: 40.00, lane: 1, hold: 0 },
            { time: 40.50, lane: 3, hold: 0 },
            { time: 41.00, lane: 0, hold: 0 },
            { time: 41.50, lane: 2, hold: 0 },
            { time: 42.00, lane: 1, hold: 0 },
            { time: 42.50, lane: 3, hold: 0 },
            { time: 43.00, lane: 2, hold: 0 },
            { time: 43.50, lane: 1, hold: 0 },
            { time: 44.00, lane: 0, hold: 0 },
            { time: 45.00, lane: 1, hold: 0 },
            { time: 45.50, lane: 2, hold: 0 },
            { time: 46.00, lane: 0, hold: 0 },
            { time: 46.50, lane: 3, hold: 0 },
            { time: 47.00, lane: 1, hold: 0 },
            { time: 47.50, lane: 2, hold: 0 },
            { time: 48.00, lane: 0, hold: 0 },
            { time: 48.50, lane: 3, hold: 0 },
            { time: 49.00, lane: 2, hold: 0 },
            { time: 49.50, lane: 1, hold: 0 },
            { time: 51.00, lane: 0, hold: 0 },
            { time: 51.50, lane: 2, hold: 0 },
            { time: 52.00, lane: 1, hold: 0 },
            { time: 52.50, lane: 3, hold: 0 },
            { time: 53.00, lane: 0, hold: 0 },
            { time: 53.50, lane: 2, hold: 0 },
            { time: 54.00, lane: 1, hold: 0 },
            { time: 54.50, lane: 3, hold: 0 },
            { time: 55.00, lane: 2, hold: 0 },
            { time: 55.50, lane: 1, hold: 0 },
            { time: 56.00, lane: 0, hold: 0 },
            { time: 57.00, lane: 1, hold: 0 },
            { time: 57.33, lane: 3, hold: 0 },
            { time: 57.66, lane: 2, hold: 0 },
            { time: 58.00, lane: 0, hold: 0 },
            { time: 58.33, lane: 1, hold: 0 },
            { time: 58.66, lane: 3, hold: 0 },
            { time: 59.00, lane: 2, hold: 0 },
            { time: 59.33, lane: 1, hold: 0 },
            { time: 59.66, lane: 0, hold: 0 },
            { time: 60.00, lane: 2, hold: 0 },
            { time: 60.33, lane: 3, hold: 0 },
            { time: 60.66, lane: 1, hold: 0 },
            { time: 61.00, lane: 0, hold: 0 },
            { time: 61.33, lane: 2, hold: 0 },
            { time: 64.00, lane: 1, hold: 0 },
            { time: 64.50, lane: 2, hold: 0 },
            { time: 65.00, lane: 0, hold: 0 },
            { time: 65.50, lane: 3, hold: 0 },
            { time: 66.00, lane: 2, hold: 0 },
            { time: 66.50, lane: 1, hold: 0 },
            { time: 67.00, lane: 0, hold: 0 },
            { time: 67.50, lane: 3, hold: 0 },
            { time: 68.00, lane: 1, hold: 0 },
            { time: 68.50, lane: 2, hold: 0 },
            { time: 69.00, lane: 0, hold: 0 },
            { time: 70.00, lane: 2, hold: 0 },
            { time: 70.50, lane: 1, hold: 0 },
            { time: 71.00, lane: 3, hold: 0 },
            { time: 71.50, lane: 0, hold: 0 },
            { time: 72.00, lane: 2, hold: 0 },
            { time: 72.50, lane: 1, hold: 0 },
            { time: 73.00, lane: 3, hold: 0 },
            { time: 73.50, lane: 0, hold: 0 },
            { time: 76.00, lane: 1, hold: 0 },
            { time: 76.33, lane: 3, hold: 0 },
            { time: 76.66, lane: 2, hold: 0 },
            { time: 77.00, lane: 0, hold: 0 },
            { time: 77.33, lane: 1, hold: 0 },
            { time: 77.66, lane: 3, hold: 0 },
            { time: 78.00, lane: 2, hold: 0 },
            { time: 78.33, lane: 1, hold: 0 },
            { time: 81.00, lane: 0, hold: 0 },
            { time: 81.50, lane: 2, hold: 0 },
            { time: 82.00, lane: 1, hold: 0 },
            { time: 82.50, lane: 3, hold: 0 },
            { time: 83.00, lane: 0, hold: 0 },
            { time: 83.50, lane: 2, hold: 0 },
            { time: 84.00, lane: 1, hold: 0 },
            { time: 84.50, lane: 3, hold: 0 },
            { time: 87.00, lane: 2, hold: 0 },
            { time: 87.40, lane: 1, hold: 0 },
            { time: 87.80, lane: 3, hold: 0 },
            { time: 88.20, lane: 0, hold: 0 },
            { time: 88.60, lane: 2, hold: 0 },
            { time: 89.00, lane: 1, hold: 0 },
            { time: 89.40, lane: 3, hold: 0 },
            { time: 89.80, lane: 0, hold: 0 },
            { time: 90.00, lane: 1, hold: 0 },
            { time: 90.50, lane: 2, hold: 0 },
            { time: 91.00, lane: 0, hold: 0 },
            { time: 91.50, lane: 3, hold: 0 },
            { time: 92.00, lane: 1, hold: 0 },
            { time: 92.50, lane: 2, hold: 0 },
            { time: 93.00, lane: 0, hold: 0 },
            { time: 93.50, lane: 3, hold: 0 },
            { time: 96.00, lane: 2, hold: 0 },
            { time: 96.40, lane: 1, hold: 0 },
            { time: 96.80, lane: 3, hold: 0 },
            { time: 97.20, lane: 0, hold: 0 },
            { time: 97.60, lane: 2, hold: 0 },
            { time: 98.00, lane: 1, hold: 0 },
            { time: 98.40, lane: 3, hold: 0 },
            { time: 98.80, lane: 0, hold: 0 },
            { time: 101.00, lane: 1, hold: 0 },
            { time: 101.33, lane: 3, hold: 0 },
            { time: 101.66, lane: 2, hold: 0 },
            { time: 102.00, lane: 0, hold: 0 },
            { time: 102.33, lane: 1, hold: 0 },
            { time: 102.66, lane: 3, hold: 0 },
            { time: 103.00, lane: 2, hold: 0 },
            { time: 103.33, lane: 1, hold: 0 },
            { time: 103.66, lane: 0, hold: 0 },
            { time: 107.00, lane: 0, hold: 0 },
            { time: 107.50, lane: 2, hold: 0 },
            { time: 108.00, lane: 1, hold: 0 },
            { time: 108.50, lane: 3, hold: 0 },
            { time: 109.00, lane: 2, hold: 0 },
            { time: 109.50, lane: 1, hold: 0 },
            { time: 110.00, lane: 0, hold: 0 },
            { time: 110.50, lane: 3, hold: 0 },
            { time: 111.00, lane: 1, hold: 0 },
        ]
    },
    "Especial - Outra Musica": { 
        src: "Especial.mp3", 
        chart: [ 
            { time: 1.00, lane: 0, hold: 0 },
            { time: 1.50, lane: 1, hold: 0 },
            { time: 2.00, lane: 2, hold: 0.5 }, 
            { time: 2.50, lane: 3, hold: 0.5 }, 
            { time: 3.50, lane: 0, hold: 0 },
            { time: 4.00, lane: 1, hold: 0 },
            { time: 4.50, lane: 2, hold: 0 },
            { time: 5.00, lane: 3, hold: 0 },
            { time: 6.00, lane: 0, hold: 1.0 }, 
            { time: 7.50, lane: 1, hold: 0 },
            { time: 7.75, lane: 2, hold: 0 },
            { time: 8.00, lane: 3, hold: 0 },
        ]
    }
};

let currentSongData = null; 
let chart = []; 

// Preencher o <select> com as músicas disponíveis
Object.keys(SONGS).forEach(songName => {
    const option = document.createElement('option');
    option.value = songName;
    option.textContent = songName;
    musicSelect.appendChild(option);
});


// -------------------------------------------------------------
//  SETUP E UTILIDADES
// -------------------------------------------------------------

function setupChart(songName) {
    currentSongData = SONGS[songName];
    
    // 1. Carrega o áudio
    audio.src = currentSongData.src;

    // 2. Clona o chart e adiciona as propriedades dinâmicas
    chart = JSON.parse(JSON.stringify(currentSongData.chart));
    chart.forEach(n => {
        n.spawned = false;
        n.duration = n.hold;
        n.dir = Object.keys(lanes).find(key => lanes[key] === n.lane);
        n.isHeld = false;
    });
}

function updateHUD() {
    scoreEl.textContent = "Pontos: " + score;
    comboEl.textContent = "Combo: " + combo;
}

// -------------------------------------------------------------
//  SPAWN NOTE
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
    el.dataset.missed = "false"; 

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

    const t = audio.error ? (performance.now() - startTime) / 1000 : audio.currentTime;
    const tEnd = parseFloat(noteEl.dataset.time) + parseFloat(noteEl.dataset.duration);
    
    if (t >= tEnd) {
        holdingNotes.delete(dir);
        document.querySelector(`.target[data-dir='${dir}']`).classList.remove("holding");
        noteEl.remove();
        return; 
    }

    score += HOLD_TICK_POINTS; 
    highScore = Math.max(highScore, score); 
    
    if (score >= PENALTY_THRESHOLD) {
        penaltyUnlocked = true;
    }
    
    updateHUD();
    showHoldFeedback(dir);

    setTimeout(() => scoreHold(dir, noteEl), HOLD_TICK_INTERVAL);
}

// -------------------------------------------------------------
//  MAIN UPDATE LOOP
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

    // mover notas e checar miss
    document.querySelectorAll(".arrow").forEach(note => {
        const tNote = parseFloat(note.dataset.time);
        const duration = parseFloat(note.dataset.duration);
        const y = HIT_Y - ((tNote - t) * NOTE_SPEED);
        
        const alreadyMissed = note.dataset.missed === 'true'; 

        note.style.top = y + "px";

        // long tail
        if (duration > 0) {
            const tail = note.querySelector(".long-tail");
            const holdPixels = duration * NOTE_SPEED;
            tail.style.height = holdPixels + "px";

            // Miss de long note
            if (y > HIT_Y + 120 && note.dataset.held === "false" && !alreadyMissed) {
                note.dataset.missed = 'true'; 
                note.remove(); 
                registerMiss();
            }
        }
        
        // Miss para notas simples
        else if (duration === 0 && y > HIT_Y + 120 && !alreadyMissed) {
            note.dataset.missed = 'true'; 
            note.remove(); 
            registerMiss();
        }
    });

    raf = requestAnimationFrame(update);

    // Checagem de fim de música
    if (chart.length > 0 && t > chart[chart.length - 1].time + 2) {
        endGame();
    }
}

// -------------------------------------------------------------
//  SCORE SYSTEM
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
    
    if (score >= PENALTY_THRESHOLD) {
        penaltyUnlocked = true;
    }
    
    highScore = Math.max(highScore, score); 
    
    updateHUD();
    showFeedback(note, result);
}

function registerMiss() {
    combo = 0;
    
    if (penaltyUnlocked) {
        score -= PENALTY_AMOUNT; 
    } 
    
    updateHUD(); 

    if (score <= 0) {
        endGame();
    }
}

function showFeedback(note, result) {
    const feedbackEl = document.createElement("div");
    feedbackEl.textContent = result;
    feedbackEl.className = "feedback " + result.toLowerCase();
    
    const laneIndex = lanes[note.dataset.dir];
    const targetEl = targets[laneIndex]; 
    targetEl.parentElement.appendChild(feedbackEl);
    
    setTimeout(() => feedbackEl.remove(), 600);
}

function showHoldFeedback(dir) {
    const targetEl = document.querySelector(`.target[data-dir='${dir}']`);
    targetEl.classList.add("holding");
}


// -------------------------------------------------------------
//  KEY HANDLING
// -------------------------------------------------------------

document.addEventListener("keyup", (e) => {
    if (!(e.key in lanes)) return;
    if (!gameRunning) return;
    
    const targetEl = document.querySelector(`.target[data-dir='${e.key}']`);
    targetEl.classList.remove("holding");

    if (holdingNotes.has(e.key)) {
        const noteEl = holdingNotes.get(e.key);
        
        const t = audio.error ? (performance.now() - startTime) / 1000 : audio.currentTime;
        const tEnd = parseFloat(noteEl.dataset.time) + parseFloat(noteEl.dataset.duration);
        
        if (t < tEnd) {
            registerMiss(); 
            noteEl.remove();
        }
        
        holdingNotes.delete(e.key);
    }
});


document.addEventListener("keydown", (e) => {
    if (!(e.key in lanes)) return;
    if (!gameRunning) return;
    
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

    for (let n of notes) {
        const diff = Math.abs(t - parseFloat(n.dataset.time));
        if (diff < bestDiff) {
            bestDiff = diff;
            best = n;
        }
    }

    if (!best) return;

    animateTarget(e.key);

    if (bestDiff <= GOOD) {
        const duration = parseFloat(best.dataset.duration);

        if (duration > 0) {
            registerHit(best, t - parseFloat(best.dataset.time));
            
            best.dataset.held = "true";
            
            holdingNotes.set(e.key, best);
            scoreHold(e.key, best);

        } else {
            registerHit(best, t - parseFloat(best.dataset.time));
            best.remove();
        }
    } else {
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

    holdingNotes.forEach((noteEl, key) => {
        document.querySelector(`.target[data-dir='${key}']`).classList.remove("holding");
    });
    holdingNotes.clear();

    if (document.getElementById("gameOver")) return;

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
            <button id="retryBtn">Tentar Novamente (Mesma Música)</button>
            <button id="menuBtn">Voltar ao Menu</button>
        </div>
    `;

    document.body.appendChild(box);

    document.getElementById("retryBtn").onclick = () => {
        box.remove();
        resetGame();
        // Força a reinicialização com a mesma música (já configurada)
        startButton.onclick(); 
    };

    document.getElementById("menuBtn").onclick = () => {
        box.remove();
        resetGame(); 
        
        // MOSTRA o Menu e ESCONDE a área de jogo
        selectionScreen.style.display = 'flex'; 
        gameArea.style.display = 'none'; 
        targetsContainer.style.display = 'none';
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
    penaltyUnlocked = false; 
    
    if (audio.src && !audio.error) {
        audio.currentTime = 0;
    }

    if (chart) {
        chart.forEach(n => {
            n.spawned = false;
            n.isHeld = false; 
        });
    }

    document.querySelectorAll(".arrow").forEach(a => a.remove());

    updateHUD();
}

startButton.onclick = async () => {
    // 1. Configura o jogo
    const selectedSong = musicSelect.value;
    setupChart(selectedSong); 

    // 2. Prepara o jogo
    resetGame();
    
    // 3. Altera a visualização (CRUCIAL!)
    selectionScreen.style.display = 'none'; // Esconde o Menu
    
    // MOSTRA a área de jogo e os alvos
    gameArea.style.display = 'flex'; 
    targetsContainer.style.display = 'flex'; 


    // 4. Inicia o áudio e o loop de update
    try {
        await audio.play();
        startTime = performance.now(); 
    } catch (e) {
        console.error("Falha ao tocar áudio. Iniciando sem sincronia musical.", e);
        startTime = performance.now(); 
    }

    gameRunning = true;
    update();
};