// script.js — versão com combo/multiplicador/efeitos

const CONFIG = {
  lanes: ['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'],
  spawnInterval: 700, 
  speed: 280,
  hitWindow: 0.25,
  perfectRange: 0.08,
};

const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const messageEl = document.getElementById('message');
const laneContainer = document.getElementById('laneContainer');

let arrows = [];
let lastSpawn = 0;
let running = false;
let paused = false;
let score = 0;
let combo = 0;
let startTime = 0;

function buildLanes(){
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
}
buildLanes();

function arrowSymbol(dir){
  return {ArrowLeft:'◀',ArrowDown:'▼',ArrowUp:'▲',ArrowRight:'▶'}[dir] || '?';
}

function spawnArrow(dir){
  const wrappers = [...document.querySelectorAll('.lane > div')];
  const wrapper = wrappers[CONFIG.lanes.indexOf(dir)];
  if(!wrapper) return;

  const el = document.createElement('div');
  el.className = 'arrow';
  el.textContent = arrowSymbol(dir);
  wrapper.appendChild(el);

  const startY = -80;
  const targetY = wrapper.offsetHeight - 120;
  const distance = targetY - startY;
  const travelTime = distance / CONFIG.speed;
  const spawnedAt = performance.now() / 1000;

  arrows.push({el, dir, spawnedAt, travelTime, startY, targetY, wrapper});
}

function update(){
  if(!running || paused) return;
  const nowMs = performance.now();
  const now = nowMs / 1000;

  if(nowMs - lastSpawn > CONFIG.spawnInterval){
    spawnArrow(CONFIG.lanes[Math.floor(Math.random()*CONFIG.lanes.length)]);
    lastSpawn = nowMs;
  }

  for(let i = arrows.length - 1; i >= 0; i--){
    const a = arrows[i];
    const elapsed = now - a.spawnedAt;
    const progress = elapsed / a.travelTime;
    const y = a.startY + progress * (a.targetY - a.startY);
    a.el.style.transform = `translateY(${y}px)`;

    if(progress >= 1.18){
      a.el.remove();
      arrows.splice(i,1);
      combo = 0;
      updateHUD();
    }
  }

  requestAnimationFrame(update);
}

function handleKey(e){
  if(!running || paused) return;
  const key = e.key;
  const now = performance.now() / 1000;

  let bestIndex = -1;
  let bestDelta = Infinity;

  for(let i = 0; i < arrows.length; i++){
    const a = arrows[i];
    if(a.dir !== key) continue;

    const delta = Math.abs(a.travelTime - (now - a.spawnedAt));

    if(delta < bestDelta){
      bestDelta = delta;
      bestIndex = i;
    }
  }

  if(bestIndex === -1) return;

  const a = arrows[bestIndex];
  const delta = bestDelta;

  if(delta <= CONFIG.hitWindow){

    // ============ SISTEMA DE PONTOS COM MULTIPLICADOR ============

    let base = 0;

    if(delta <= CONFIG.perfectRange){
      base = 300;
      messageEl.textContent = 'PERFEITO';
    }
    else if(delta <= CONFIG.hitWindow / 2){
      base = 150;
      messageEl.textContent = 'BOM';
    }
    else {
      base = 50;
      messageEl.textContent = 'OK';
    }

    // bonus do combo: +10% por combo até x3 máximo
    const comboBonus = Math.min(combo * 0.10, 3);
    const finalScore = Math.floor(base * (1 + comboBonus));
    score += finalScore;

    // efeito visual de combo
    comboEl.classList.add("comboFlash");
    setTimeout(() => comboEl.classList.remove("comboFlash"), 250);

    // =============================================================

    combo++;
    a.el.classList.add('hit');
    a.el.remove();
    arrows.splice(bestIndex,1);
    updateHUD();

    setTimeout(()=> messageEl.textContent = '', 400);

  } else {
    combo = 0;
    updateHUD();
  }
}

function updateHUD(){
  scoreEl.textContent = `Pontos: ${score}`;
  comboEl.textContent = `Combo: ${combo}`;
}

startBtn.addEventListener('click', ()=>{
  if(running) reset();
  startGame();
});

pauseBtn.addEventListener('click', ()=>{
  paused = !paused;
  pauseBtn.textContent = paused ? 'Retomar' : 'Pausar';
  if(!paused) requestAnimationFrame(update);
});

function startGame(){
  running = true;
  paused = false;
  score = 0;
  combo = 0;
  arrows.forEach(a => a.el.remove());
  arrows = [];
  updateHUD();
  startTime = performance.now();
  lastSpawn = performance.now();
  requestAnimationFrame(update);
}

function reset(){
  running = false;
  arrows.forEach(a => a.el.remove());
  arrows = [];
  score = 0;
  combo = 0;
  updateHUD();
}

window.addEventListener('keydown', handleKey);
