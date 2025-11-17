// script.js — versão estável e sem erros
const CONFIG = {
  lanes: ['ArrowLeft','ArrowDown','ArrowUp','ArrowRight'],
  spawnInterval: 700, // ms
  speed: 280,          // pixels por segundo
  hitWindow: 0.25,     // segundos
  perfectRange: 0.08,  // segundos
};

const scoreEl = document.getElementById('score');
const comboEl = document.getElementById('combo');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const messageEl = document.getElementById('message');
const laneContainer = document.getElementById('laneContainer');

let arrows = [];
let lastSpawn = 0;           // em ms (Date.now ou performance.now)
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
  const travelTime = distance / CONFIG.speed; // segundos
  const spawnedAt = performance.now() / 1000;  // segundos

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
    const elapsed = now - a.spawnedAt; // segundos
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
    const delta = Math.abs(a.travelTime - (now - a.spawnedAt)); // segundos até o alvo (aprox)
    if(delta < bestDelta){ bestDelta = delta; bestIndex = i; }
  }

  if(bestIndex === -1) return; // não há arrow correspondente

  const delta = bestDelta;
  const a = arrows[bestIndex];

  if(delta <= CONFIG.hitWindow){
    if(delta <= CONFIG.perfectRange){ score += 300; messageEl.textContent = 'PERFEITO'; }
    else if(delta <= CONFIG.hitWindow/2){ score += 150; messageEl.textContent = 'BOM'; }
    else { score += 50; messageEl.textContent = 'OK'; }

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
