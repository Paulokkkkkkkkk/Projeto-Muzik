// script.js — Versão Final com Charting (Sincronia com a música) e Correções de Combo

const CONFIG = {
    lanes: ['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight'],
    speed: 280, // Velocidade de queda (em pixels/segundo)
    hitWindow: 0.25, // Janela de acerto (em segundos)
    perfectRange: 0.08, // Margem de acerto perfeito (em segundos)
    longNoteTickScore: 20 // Pontos ganhos por "tick" ao segurar
};

// Variáveis que serão referenciadas globalmente, mas inicializadas dentro de DOMContentLoaded
let scoreEl, comboEl, startBtn, pauseBtn, messageEl, laneContainer, audioEl;
let gameOverModal, gameOverScreen, finalScoreEl, restartBtn;

let arrows = [];
let running = false;
let paused = false;
let score = 0;
let combo = 0;
let startTime = 0;
let lastUpdate = performance.now();

// Controle de Chart (Novo)
let currentChart = (typeof AURA_CHART !== 'undefined') ? AURA_CHART : [];
let nextNoteIndex = 0; // O índice da próxima nota a ser spawnada no chart
let travelTime = 0; // Tempo que a seta leva para ir do topo ao alvo

let penaltyModeActive = false; 
let maxScoreThisRun = 0; 
let keysHeld = {};

// ======================== FUNÇÕES DE INICIALIZAÇÃO E SETUP ========================

function buildLanes() {
    if (!laneContainer) return; 
    laneContainer.innerHTML = '';
    const lane = document.createElement('div');
    lane.className = 'lane';
    CONFIG.lanes.forEach(d => {
        const wrapper = document.createElement('div');
        wrapper.style.width = '72px';
        wrapper.style.height = '100%';
        wrapper.style.position = 'relative';
        wrapper.dataset.dir = d;
        lane.appendChild(wrapper);
    });
    laneContainer.appendChild(lane);

    // Calcular o tempo de viagem da seta UMA VEZ
    // (Altura do playfield - posição do alvo) / Velocidade
    const targetY = laneContainer.offsetHeight - 120;
    const startY = -80;
    const distance = targetY - startY;
    travelTime = distance / CONFIG.speed;
}

function arrowSymbol(dir) {
    return { ArrowLeft: '◀', ArrowDown: '▼', ArrowUp: '▲', ArrowRight: '▶' }[dir] || '?';
}

/**
 * Cria uma seta baseada nos dados do Chart, ajustando o tempo de spawn.
 * @param {string} dir Direção da seta.
 * @param {number} duration Duração da Long Note (0 para nota curta).
 * @param {number} noteTime Tempo ideal de acerto (sincronizado com a música).
 */
function spawnChartArrow(dir, duration, noteTime) {
    const wrappers = [...document.querySelectorAll('.lane > div')];
    const wrapper = wrappers[CONFIG.lanes.indexOf(dir)];
    if (!wrapper) return;

    const isLongNote = duration > 0;
    
    // 1. Cria o elemento principal/cabeça
    const headEl = document.createElement('div');
    headEl.className = 'arrow' + (isLongNote ? ' long-head' : '');
    headEl.textContent = arrowSymbol(dir);
    wrapper.appendChild(headEl);

    const startY = -80;
    const targetY = wrapper.offsetHeight - 120;
    
    // O tempo em que a seta deve começar a cair para chegar no noteTime (tempo ideal)
    const idealSpawnTimeMs = (noteTime - travelTime) * 1000;
    const spawnedAt = (idealSpawnTimeMs + startTime) / 1000; // Tempo real de spawn (em segundos)

    let newArrow = {
        el: headEl,
        dir,
        spawnedAt,
        travelTime,
        startY,
        targetY,
        wrapper,
        isLongNote,
        duration,
        bodyEl: null,
        held: false,
        hitTime: 0
    };

    // 2. Se for longa, cria o corpo
    if (isLongNote) {
        const bodyEl = document.createElement('div');
        bodyEl.className = 'long-body';
        wrapper.appendChild(bodyEl);
        newArrow.bodyEl = bodyEl;
    }

    arrows.push(newArrow);
}


// ======================== LÓGICA DO JOGO E HUD ========================

function updateHUD() {
    scoreEl.textContent = `Pontos: ${Math.floor(score)}`;
    comboEl.textContent = `Combo: ${combo}`;
    if (score > maxScoreThisRun) {
        maxScoreThisRun = score;
    }
}

function checkGameOver() {
    if (score <= 0) {
        score = 0; 
        updateHUD();

        running = false;
        paused = true; 

        if (finalScoreEl && gameOverModal) {
            finalScoreEl.textContent = Math.floor(maxScoreThisRun);
            gameOverModal.style.display = 'flex'; 
        }
        
        arrows.forEach(a => {
            a.el.remove();
            if (a.bodyEl) a.bodyEl.remove();
        });
        arrows = [];
        
        messageEl.textContent = '';
        startBtn.textContent = 'Reiniciar';
        pauseBtn.textContent = 'Pausar';

        if (audioEl) {
            audioEl.pause();
        }
    }
}

function applyPenalty(type) {
    combo = 0; 
    let displayMessage = type;
    
    if (score > 2000) {
        penaltyModeActive = true;
    }
    
    if (penaltyModeActive) {
        score -= 1000;
        displayMessage += ' (-1000)';
        
        scoreEl.classList.add("scoreMiss");
        setTimeout(() => scoreEl.classList.remove("scoreMiss"), 250);
    } 

    messageEl.textContent = displayMessage;
    setTimeout(() => messageEl.textContent = '', 400);

    updateHUD();
    checkGameOver();
}

function update(nowMs) {
    if (!running || paused) {
        lastUpdate = nowMs;
        return;
    }
    
    const now = nowMs / 1000;
    const deltaTime = (nowMs - lastUpdate) / 1000;
    lastUpdate = nowMs;

    // ================= LÓGICA DE SPAWN BASEADA EM CHART (NOVO) =================
    const songTime = (nowMs - startTime) / 1000; 

    while (nextNoteIndex < currentChart.length) {
        const note = currentChart[nextNoteIndex];
        
        // Se o tempo de spawn ideal da próxima nota já passou
        if (songTime >= (note.time - travelTime)) {
            if (note.dir === 'END') {
                running = false; // Fim da música
                break;
            }
            
            // Spawn da seta com os dados do chart
            spawnChartArrow(note.dir, note.duration, note.time);
            nextNoteIndex++;
        } else {
            // A próxima nota ainda está muito longe
            break;
        }
    }
    // ================= FIM DA LÓGICA DE SPAWN =================

    for (let i = arrows.length - 1; i >= 0; i--) {
        const a = arrows[i];
        const elapsed = now - a.spawnedAt;
        const progress = elapsed / a.travelTime;
        const y = a.startY + progress * (a.targetY - a.startY);

        // Lógica de Movimento
        if (!a.isLongNote || a.hitTime === 0) {
            a.el.style.transform = `translateY(${y}px)`;
        } else {
            // Lógica de Long Note (Body e Head)
            const heldElapsed = now - a.hitTime;
            const bodyHeight = (a.duration - heldElapsed) * CONFIG.speed;
            
            a.bodyEl.style.height = `${Math.max(0, bodyHeight)}px`;
            a.bodyEl.style.transform = `translateY(${a.el.offsetTop + a.el.offsetHeight / 2 - a.bodyEl.offsetHeight / 2}px)`;
            a.el.style.transform = `translateY(${a.targetY}px)`;
            
            // Pontuação Contínua (Tick Score)
            if (a.held && heldElapsed < a.duration) {
                score += CONFIG.longNoteTickScore * deltaTime * 10;
                updateHUD(); 
            }
        }

        // Lógica de MISS (Erros de setas que passam)
        if (progress >= 1.18) {
            if (!a.isLongNote || a.hitTime === 0) {
                a.el.remove();
                if (a.isLongNote) a.bodyEl.remove();
                arrows.splice(i, 1);
                
                applyPenalty('MISS'); 
                continue;
            }
        }

        // Fim da Long Note
        if (a.isLongNote && a.hitTime > 0 && (now - a.hitTime) >= a.duration) {
            a.el.remove();
            a.bodyEl.remove();
            arrows.splice(i, 1);
            a.held = false;
            continue;
        }
    }

    // Lógica de penalidade por soltar Long Note cedo
    for (let i = 0; i < arrows.length; i++) {
        const a = arrows[i];
        if (a.isLongNote && a.held && !keysHeld[a.dir]) {
            applyPenalty('EARLY RELEASE'); 
            
            a.held = false;
            a.el.remove();
            a.bodyEl.remove();
            arrows.splice(i, 1);
            
            break; 
        }
    }

    requestAnimationFrame(update);
}


// ======================== FUNÇÕES DE EVENTOS DE TECLADO ========================

function handleKeyDown(e) {
    if (!running || paused || keysHeld[e.key]) return;

    const key = e.key;
    keysHeld[key] = true;
    const now = performance.now() / 1000;

    let bestIndex = -1;
    let bestDelta = Infinity;

    for (let i = 0; i < arrows.length; i++) {
        const a = arrows[i];
        if (a.dir !== key || a.hitTime > 0) continue;

        const elapsed = now - a.spawnedAt;
        const progress = elapsed / a.travelTime;
        
        if (progress < 1 - (CONFIG.hitWindow * 2)) continue;

        const delta = Math.abs(a.travelTime - elapsed);

        if (delta < bestDelta) {
            bestDelta = delta;
            bestIndex = i;
        }
    }

    if (bestIndex === -1) {
        // CORRIGIDO: Não penaliza cliques vazios, o combo só é quebrado por MISS ou ERRO TARDE.
        return; 
    }

    const a = arrows[bestIndex];
    const delta = bestDelta;

    if (delta <= CONFIG.hitWindow) {
        // ============ ACERTO (HEAD HIT) ============
        
        let base = 0;
        let message = '';

        if (delta <= CONFIG.perfectRange) {
            base = 300;
            message = 'PERFEITO';
        } else if (delta <= CONFIG.hitWindow / 2) {
            base = 150;
            message = 'BOM';
        } else {
            base = 50;
            message = 'OK';
        }

        const comboBonus = Math.min(combo * 0.10, 3);
        const finalScore = Math.floor(base * (1 + comboBonus));
        score += finalScore;

        comboEl.classList.add("comboFlash");
        setTimeout(() => comboEl.classList.remove("comboFlash"), 250);

        combo++;
        updateHUD();
        
        if (!a.isLongNote) {
            // Seta CURTA
            a.el.classList.add('hit');
            a.el.remove();
            arrows.splice(bestIndex, 1);
            messageEl.textContent = message;
            setTimeout(() => messageEl.textContent = '', 400);
        } else {
            // Cabeça de Seta LONGA
            a.hitTime = now;
            a.held = true;
            a.el.classList.add('held-head');
            messageEl.textContent = `${message} (HOLD)`;
        }
    } else {
        // Penalidade por ERRO MUITO TARDE
        applyPenalty('ERRO'); 
    }
}

function handleKeyUp(e) {
    const key = e.key;
    keysHeld[key] = false;
    
    for (let i = 0; i < arrows.length; i++) {
        const a = arrows[i];
        if (a.isLongNote && a.dir === key && a.held) {
            const now = performance.now() / 1000;
            const heldDuration = now - a.hitTime;
            
            if (heldDuration < a.duration - 0.1) {
                // Soltou cedo - a penalidade e remoção serão tratadas no loop de update
            } else {
                a.held = false;
            }
        }
    }
}


// ======================== FUNÇÕES DE CONTROLE ========================

function startGame() {
    running = true;
    paused = false;
    score = 0; 
    combo = 0;
    maxScoreThisRun = 0; 
    penaltyModeActive = false; 
    keysHeld = {};
    
    // Resetar o Chart
    nextNoteIndex = 0; 

    arrows.forEach(a => {
        a.el.remove();
        if (a.bodyEl) a.bodyEl.remove();
    });
    arrows = [];
    updateHUD();
    
    startTime = performance.now(); // Marca o início do jogo (e da música)
    startBtn.textContent = 'Reiniciar';
    messageEl.textContent = '';
    
    if (gameOverModal) {
        gameOverModal.style.display = 'none'; 
    }

    if (audioEl) {
        audioEl.currentTime = 0; // Volta a música para o início
        audioEl.play().catch(error => {
            console.warn("Áudio não pôde iniciar sem interação do usuário. Clique em Iniciar.");
        }); 
    }
    
    requestAnimationFrame(update);
}

function reset() {
    running = false;
    keysHeld = {};
    nextNoteIndex = 0; 

    arrows.forEach(a => {
        a.el.remove();
        if (a.bodyEl) a.bodyEl.remove();
    });
    arrows = [];
    score = 0;
    combo = 0;
    maxScoreThisRun = 0; 
    penaltyModeActive = false;
    updateHUD();
    messageEl.textContent = '';
    startBtn.textContent = 'Iniciar';
    
    if (gameOverModal) {
        gameOverModal.style.display = 'none'; 
    }

    if (audioEl) {
        audioEl.pause();
        audioEl.currentTime = 0; 
    }
}


// ======================== INICIALIZAÇÃO SEGURA ========================

document.addEventListener('DOMContentLoaded', () => {
    // ============ REFERÊNCIAS DO HUD E CONTROLES ============
    scoreEl = document.getElementById('score');
    comboEl = document.getElementById('combo');
    startBtn = document.getElementById('startBtn');
    pauseBtn = document.getElementById('pauseBtn');
    messageEl = document.getElementById('message');
    laneContainer = document.getElementById('laneContainer');
    audioEl = document.getElementById('gameAudio'); // NOVA REFERÊNCIA
    
    // ============ REFERÊNCIAS DO POP-UP MODAL ============
    gameOverModal = document.getElementById('gameOverModal'); 
    gameOverScreen = document.getElementById('gameOverScreen'); 
    finalScoreEl = document.getElementById('finalScore');
    restartBtn = document.getElementById('restartBtn');
    
    if (!scoreEl || !comboEl || !startBtn || !laneContainer || !pauseBtn) {
        console.error("Erro: Elementos essenciais do jogo não foram encontrados. Verifique seu index.html.");
        return; 
    }

    buildLanes();

    // ======================== LISTENERS ========================
    startBtn.addEventListener('click', () => {
        if (running) reset();
        startGame();
    });

    pauseBtn.addEventListener('click', () => {
        paused = !paused;
        pauseBtn.textContent = paused ? 'Retomar' : 'Pausar';

        if (audioEl) {
            paused ? audioEl.pause() : audioEl.play(); // Controle de áudio
        }

        if (!paused) {
            lastUpdate = performance.now();
            requestAnimationFrame(update);
        }
    });

    if (restartBtn) {
        restartBtn.addEventListener('click', startGame);
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
});