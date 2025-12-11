const SETTINGS_KEY = 'ofo_v2_settings';
const STATE_KEY = 'ofo_v2_state';
let settings = { sensitivity: 1.0, theme: 'dark' };
let state = { score:0, hits:0, misses:0 };

const menu = document.getElementById('menu');
const settingsScreen = document.getElementById('settings');
const credits = document.getElementById('credits');
const gameScreen = document.getElementById('game');
const playBtn = document.getElementById('playBtn');
const settingsBtn = document.getElementById('settingsBtn');
const creditsBtn = document.getElementById('creditsBtn');
const backSettings = document.getElementById('backSettings');
const backCredits = document.getElementById('backCredits');
const saveSettings = document.getElementById('saveSettings');
const sensitivityInput = document.getElementById('sensitivity');
const sensitivityVal = document.getElementById('sensitivityVal');
const themeSelect = document.getElementById('themeSelect');
const openSettingsTop = document.getElementById('openSettingsTop');
const quitBtn = document.getElementById('quitBtn');

const arena = document.getElementById('arena');
const ctx = arena.getContext('2d');
const scoreEl = document.getElementById('score');
const hitsEl = document.getElementById('hits');
const missesEl = document.getElementById('misses');

let mouse = { x: 0, y: 0, inside: false };
let aim = { x: 0, y: 0 };
let target = null;
let running = false;
let spawnInterval = 700;
let spawnTimer = null;

function saveSettings() {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
function loadSettings() {
  const raw = localStorage.getItem(SETTINGS_KEY);
  if(raw) {
    try { settings = JSON.parse(raw); } catch(e){}
  }
  sensitivityInput.value = settings.sensitivity;
  sensitivityVal.textContent = Number(settings.sensitivity).toFixed(1);
  themeSelect.value = settings.theme;
  applyTheme();
}
function saveState() { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
function loadState() { const raw = localStorage.getItem(STATE_KEY); if(raw){ try{ state = JSON.parse(raw);}catch(e){} } updateStats(); }

function applyTheme(){
  const app = document.getElementById('app');
  if(settings.theme === 'light') {
    app.classList.remove('theme-dark');
    app.classList.add('theme-light');
    document.body.classList.remove('theme-dark');
    document.body.classList.add('theme-light');
  } else {
    app.classList.remove('theme-light');
    app.classList.add('theme-dark');
    document.body.classList.remove('theme-light');
    document.body.classList.add('theme-dark');
  }
}

function showScreen(el){
  [menu, settingsScreen, credits, gameScreen].forEach(s=>s.classList.remove('active'));
  el.classList.add('active');
}

playBtn.addEventListener('click', ()=>{
  startGame();
  showScreen(gameScreen);
  arena.focus();
});
settingsBtn.addEventListener('click', ()=> showScreen(settingsScreen));
creditsBtn.addEventListener('click', ()=> showScreen(credits));
backSettings.addEventListener('click', ()=> showScreen(menu));
backCredits.addEventListener('click', ()=> showScreen(menu));
openSettingsTop.addEventListener('click', ()=> showScreen(settingsScreen));
saveSettings.addEventListener('click', ()=>{
  settings.sensitivity = parseFloat(sensitivityInput.value);
  settings.theme = themeSelect.value;
  saveSettings();
  applyTheme();
  showScreen(menu);
});
sensitivityInput.addEventListener('input', ()=>{
  sensitivityVal.textContent = parseFloat(sensitivityInput.value).toFixed(1);
});

quitBtn.addEventListener('click', ()=>{
  stopGame();
  showScreen(menu);
});

function resizeCanvas(){
  arena.width = arena.clientWidth;
  arena.height = arena.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function rand(min,max){ return Math.random()*(max-min)+min; }

function spawnTarget(){
  const r = Math.floor(rand(18,44));
  target = { x: rand(r, arena.width - r), y: rand(r, arena.height - r), r };
  // color variant
  target.color = (settings.theme === 'dark') ? '#ff7b7b' : '#cc0000';
  // auto-remove after time (miss)
  setTimeout(()=> {
    if(target && Date.now() - target._spawn < 1100) {
      // missed
      state.misses++;
      updateStats();
      target = null;
    }
  }, 1100);
  target._spawn = Date.now();
}

function startGame(){
  state.score = 0; state.hits = 0; state.misses = 0; updateStats();
  running = true;
  aim.x = arena.width/2; aim.y = arena.height/2;
  mouse.x = aim.x; mouse.y = aim.y;
  spawnTarget();
  if(spawnTimer) clearInterval(spawnTimer);
  spawnTimer = setInterval(()=>{ if(!target) spawnTarget(); }, spawnInterval);
  requestAnimationFrame(drawLoop);
}

function stopGame(){
  running = false;
  if(spawnTimer) clearInterval(spawnTimer);
  target = null;
}

function updateStats(){
  scoreEl.textContent = state.score;
  hitsEl.textContent = state.hits;
  missesEl.textContent = state.misses;
  saveState();
}

arena.addEventListener('mouseenter', (e)=>{ mouse.inside = true; });
arena.addEventListener('mouseleave', (e)=>{ mouse.inside = false; });
arena.addEventListener('mousemove', (e)=>{
  const rect = arena.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

arena.addEventListener('mousedown', (e)=>{
  if(!running) return;
  if(target){
    const dx = mouse.x - target.x;
    const dy = mouse.y - target.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if(dist <= target.r){
      state.hits++;
      state.score += Math.round(100 * (1 + settings.sensitivity * 0.5));
      target = null;
      updateStats();
      spawnTarget();
    } else {
      state.misses++;
      updateStats();
    }
  }
});

// smoothing: aim lerps towards actual mouse based on sensitivity so the cursor follows the real mouse but can be "faster" or "slower"
function lerp(a,b,t){ return a + (b-a)*t; }

function drawLoop(){
  if(!running) return;
  // smoothing factor: map sensitivity (0.3..3) to lerp t (0.05..0.95)
  const t = Math.min(0.98, Math.max(0.02, (settings.sensitivity - 0.3) / (3 - 0.3)));
  aim.x = lerp(aim.x, mouse.x, t);
  aim.y = lerp(aim.y, mouse.y, t);

  ctx.clearRect(0,0,arena.width,arena.height);

  // background gradient that respects theme
  const g = ctx.createLinearGradient(0,0,0,arena.height);
  if(settings.theme === 'dark'){
    g.addColorStop(0, '#071219');
    g.addColorStop(1, '#081827');
  } else {
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#edf2f7');
  }
  ctx.fillStyle = g;
  ctx.fillRect(0,0,arena.width,arena.height);

  // optional grid for rhythm feel
  ctx.lineWidth = 1;
  ctx.strokeStyle = (settings.theme === 'dark') ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const step = 60;
  for(let x=0;x<arena.width;x+=step){
    ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,arena.height); ctx.stroke();
  }
  for(let y=0;y<arena.height;y+=step){
    ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(arena.width,y); ctx.stroke();
  }

  // draw target
  if(target){
    ctx.beginPath();
    ctx.fillStyle = target.color;
    ctx.arc(target.x, target.y, target.r, 0, Math.PI*2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.stroke();
  }

  // draw aim reticle (follows player mouse smoothly)
  ctx.beginPath();
  ctx.arc(aim.x, aim.y, 8, 0, Math.PI*2);
  ctx.fillStyle = (settings.theme === 'dark') ? '#57d7ff' : '#006b9a';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.stroke();

  // small crosshair lines
  ctx.beginPath();
  ctx.moveTo(aim.x - 16, aim.y);
  ctx.lineTo(aim.x - 6, aim.y);
  ctx.moveTo(aim.x + 6, aim.y);
  ctx.lineTo(aim.x + 16, aim.y);
  ctx.moveTo(aim.x, aim.y - 16);
  ctx.lineTo(aim.x, aim.y - 6);
  ctx.moveTo(aim.x, aim.y + 6);
  ctx.lineTo(aim.x, aim.y + 16);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.stroke();

  requestAnimationFrame(drawLoop);
}

// init
function init(){
  loadSettings();
  loadState();
  // wire settings inputs
  sensitivityInput.addEventListener('change', ()=>{ settings.sensitivity = parseFloat(sensitivityInput.value); saveSettings(); });
  themeSelect.addEventListener('change', ()=>{ settings.theme = themeSelect.value; saveSettings(); applyTheme(); });

  // show menu first
  showScreen(menu);
}
init();
