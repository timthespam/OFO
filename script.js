// UI elements
const playBtn = document.getElementById('playBtn');
const settingsBtn = document.getElementById('settingsBtn');
const creditsBtn = document.getElementById('creditsBtn');
const howBtn = document.getElementById('howBtn');
const menu = document.getElementById('menu');
const upload = document.getElementById('upload');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const how = document.getElementById('how');
const loading = document.getElementById('loading');
const game = document.getElementById('game');
const arena = document.getElementById('arena');
const cursorEl = document.getElementById('cursor');
const chooseSongBtn = document.getElementById('chooseSongBtn');
const mp3input = document.getElementById('mp3input');
const backUpload = document.getElementById('backUpload');
const backSettings = document.getElementById('backSettings');
const backCredits = document.getElementById('backCredits');
const backHow = document.getElementById('backHow');
const saveSettings = document.getElementById('saveSettings');
const sensEl = document.getElementById('sens');
const sensValEl = document.getElementById('sensVal');
const themeEl = document.getElementById('theme');
const hideCursorEl = document.getElementById('hideCursor');
const quitBtn = document.getElementById('quit');
const playAgainBtn = document.getElementById('playAgain');
const backMenuBtn = document.getElementById('backMenu');
const scoreEl = document.getElementById('score');
const finalScore = document.getElementById('finalScore');

let audioCtx = null;
let analyser = null;
let sourceNode = null;
let dataArray = null;
let audioElement = null;
let rafId = null;
let currentFileURL = null;

let circles = [];
let score = 0;
let combo = 0;

let sensitivity = 1.0;
let hideNative = false;
let pointerLocked = false;

let cursorPos = { x: innerWidth / 2, y: innerHeight / 2 };
let lastClient = null;

// show/hide screens
function showScreen(el){
  [menu, upload, settings, credits, how, loading, game, document.getElementById('endPanel')].forEach(s => s.classList.add('hidden'));
  el.classList.remove('hidden');
  updateCursorVisibility();
}
function updateCursorVisibility(){
  if(!game.classList.contains('hidden') && hideNative) document.body.classList.add('hide-native');
  else document.body.classList.remove('hide-native');
}

// load/save settings
function loadSettings(){
  const s = localStorage.getItem('ofo_sens');
  const t = localStorage.getItem('ofo_theme');
  const hc = localStorage.getItem('ofo_hideCursor');
  sensitivity = s ? parseFloat(s) : 1.0;
  sensitivity = Math.max(0.2, Math.min(4, sensitivity));
  sensEl.value = sensitivity;
  sensValEl.textContent = sensitivity.toFixed(2);
  hideNative = hc === 'true';
  hideCursorEl.checked = hideNative;
  if(t === 'light'){ document.body.classList.add('light'); document.body.classList.remove('dark'); themeEl.value = 'light'; }
  else { document.body.classList.add('dark'); document.body.classList.remove('light'); themeEl.value = 'dark'; }
}
function saveSettings(){
  localStorage.setItem('ofo_sens', String(sensitivity));
  localStorage.setItem('ofo_theme', themeEl.value);
  localStorage.setItem('ofo_hideCursor', hideNative ? 'true' : 'false');
}

// UI wiring
playBtn.addEventListener('click', ()=> showScreen(upload));
settingsBtn.addEventListener('click', ()=> showScreen(settings));
creditsBtn.addEventListener('click', ()=> showScreen(credits));
howBtn.addEventListener('click', ()=> showScreen(how));
backUpload.addEventListener('click', ()=> showScreen(menu));
backSettings.addEventListener('click', ()=> { saveSettings(); showScreen(menu); });
backCredits.addEventListener('click', ()=> showScreen(menu));
backHow.addEventListener('click', ()=> showScreen(menu));
saveSettings.addEventListener('click', ()=> { sensitivity = parseFloat(sensEl.value); sensValEl.textContent = sensitivity.toFixed(2); hideNative = hideCursorEl.checked; saveSettings(); showScreen(menu); });
themeEl.addEventListener('change', ()=> { if(themeEl.value === 'light'){ document.body.classList.add('light'); document.body.classList.remove('dark'); } else { document.body.classList.add('dark'); document.body.classList.remove('light'); } saveSettings(); });
sensEl.addEventListener('input', ()=> { sensitivity = parseFloat(sensEl.value); sensValEl.textContent = sensitivity.toFixed(2); });

chooseSongBtn.addEventListener('click', ()=> mp3input.click());
mp3input.addEventListener('change', async (e)=> {
  const file = e.target.files && e.target.files[0];
  if(!file) return;
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if(ext !== 'mp3'){
    setTimeout(()=>{ alert('⚠️ Invalid file. Please select an MP3 file.'); mp3input.value = ''; showScreen(upload); }, 0);
    return;
  }
  showScreen(loading);
  try { await startSongFromFile(file); } 
  catch(err){ console.error(err); setTimeout(()=>{ alert('⚠️ Failed to load audio. File may be corrupted or unsupported.'); mp3input.value = ''; showScreen(upload); },0); }
});

quitBtn.addEventListener('click', stopAndReturnToMenu);
playAgainBtn.addEventListener('click', ()=> showScreen(upload));
backMenuBtn.addEventListener('click', ()=> showScreen(menu));

// pointer lock helpers
function requestPointerLock(){
  const el = document.getElementById('arena') || document.body;
  if(el.requestPointerLock){
    el.requestPointerLock();
  }
}
document.addEventListener('pointerlockchange', ()=> {
  pointerLocked = (document.pointerLockElement === (document.getElementById('arena') || document.body));
});

// start song: decode check, create audio nodes, start analyzer
async function startSongFromFile(file){
  stopDetectLoop();
  clearAllCircles();
  if(audioElement){ try{ audioElement.pause(); }catch(e){} audioElement = null; }
  if(currentFileURL){ try{ URL.revokeObjectURL(currentFileURL); }catch(e){} currentFileURL = null; }
  if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const arrayBuffer = await file.arrayBuffer();
  try {
    await new Promise((res, rej)=> audioCtx.decodeAudioData(arrayBuffer.slice(0), ()=>res(), (e)=>rej(e)));
  } catch(e){ throw new Error('Decoding error'); }
  audioElement = new Audio();
  currentFileURL = URL.createObjectURL(file);
  audioElement.src = currentFileURL;
  audioElement.crossOrigin = 'anonymous';
  try { await audioElement.play(); } catch(e){ throw new Error('Playback failed'); }
  if(sourceNode){ try{ sourceNode.disconnect(); }catch(e){} sourceNode = null; }
  sourceNode = audioCtx.createMediaElementSource(audioElement);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 2048;
  dataArray = new Uint8Array(analyser.frequencyBinCount);
  sourceNode.connect(analyser);
  analyser.connect(audioCtx.destination);
  score = 0; combo = 0; updateScore();
  showScreen(game);
  // hide native cursor if chosen
  updateCursorVisibility();
  // center cursor
  cursorPos.x = innerWidth/2; cursorPos.y = innerHeight/2;
  setCursorPos(cursorPos.x, cursorPos.y);
  // try pointer lock for game-style sensitivity
  try { requestPointerLock(); } catch(e) {}
  runDetectLoop();
}

// beat detection with dynamic threshold
let lastBeatTime = 0;
let beatHistory = [];
let beatCooldown = 180;
function runDetectLoop(){
  if(!analyser) return;
  analyser.getByteFrequencyData(dataArray);
  let lowSum = 0;
  let lowCount = Math.max(8, Math.floor(dataArray.length * 0.2));
  for(let i=0;i<lowCount;i++) lowSum += dataArray[i];
  const avg = lowSum / lowCount;
  beatHistory.push(avg);
  if(beatHistory.length > 48) beatHistory.shift();
  const histAvg = beatHistory.reduce((a,b)=>a+b,0) / Math.max(1, beatHistory.length);
  const threshold = histAvg * (1.18 - (sensitivity - 1) * 0.12);
  const now = Date.now();
  if(avg > threshold && (now - lastBeatTime) > Math.max(80, beatCooldown - (sensitivity*30))){
    lastBeatTime = now;
    if(Math.random() < Math.min(0.98, 0.45 + (sensitivity - 1) * 0.2)) spawnCircle();
  }
  if(audioElement && audioElement.ended){
    stopDetectLoop();
    showEnd();
    return;
  }
  rafId = requestAnimationFrame(runDetectLoop);
}

function stopDetectLoop(){
  if(rafId){ cancelAnimationFrame(rafId); rafId = null; }
}

// spawn interactive circle
function spawnCircle(){
  const el = document.createElement('div');
  el.className = 'beatCircle';
  const size = 70 + Math.round(Math.random()*40 - 20);
  el.style.width = size + 'px';
  el.style.height = size + 'px';
  const pad = 60;
  let x = Math.random() * (innerWidth - pad*2) + pad;
  let y = Math.random() * (innerHeight - pad*2) + pad;
  // avoid overlap
  let attempts = 50;
  for(let i=0;i<attempts;i++){
    let ok = true;
    for(let c of circles){
      if(Math.hypot(x - c.x, y - c.y) < Math.max(120, size)) { ok = false; break; }
    }
    if(ok) break;
    x = Math.random() * (innerWidth - pad*2) + pad;
    y = Math.random() * (innerHeight - pad*2) + pad;
  }
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  const lifeBase = 1100;
  const life = Math.max(380, lifeBase - (sensitivity - 1) * 360 - Math.random()*260);
  el.style.opacity = '1';
  document.body.appendChild(el);
  const cobj = { el, x, y, size, created: Date.now(), life };
  circles.push(cobj);

  function remove(){
    const idx = circles.indexOf(cobj);
    if(idx >= 0) circles.splice(idx, 1);
    try{ cobj.el.remove(); } catch(e){}
  }

  el.addEventListener('click', (ev) => {
    // clicking the element directly: score
    score += Math.round(100 * (1 + (sensitivity - 1) * 0.5));
    combo++;
    updateScore();
    remove();
  });

  // shrink animation using requestAnimationFrame
  const start = Date.now();
  (function animate(){
    if(!document.body.contains(el)) return;
    const t = (Date.now() - start) / life;
    if(t >= 1){
      remove();
      combo = 0;
      updateScore();
      return;
    }
    const scale = 1 - t;
    el.style.transform = `translate(-50%,-50%) scale(${scale})`;
    el.style.opacity = String(1 - t * 1.05);
    requestAnimationFrame(animate);
  })();

  setTimeout(()=> { if(document.body.contains(el)) remove(); }, life + 80);
}

function removeAllCircles(){
  for(const c of circles) try{ c.el.remove(); }catch(e){}
  circles = [];
}

// score display
function updateScore(){
  scoreEl.textContent = 'Score: ' + score;
  document.getElementById('combo').textContent = 'Combo: ' + combo;
  finalScore.textContent = 'Score: ' + score;
}

// end of song
function showEnd(){
  stopDetectLoop();
  removeAllCircles();
  showScreen(document.getElementById('endPanel'));
}

// stop and return
function stopAndReturnToMenu(){
  stopDetectLoop();
  removeAllCircles();
  if(audioElement){ try{ audioElement.pause(); }catch(e){} }
  if(currentFileURL){ try{ URL.revokeObjectURL(currentFileURL); }catch(e){} currentFileURL = null; }
  // exit pointer lock if active
  try { if(document.exitPointerLock) document.exitPointerLock(); } catch(e){}
  showScreen(menu);
}

// pointer / cursor control
function setCursorPos(x, y){
  cursorPos.x = Math.max(0, Math.min(innerWidth, x));
  cursorPos.y = Math.max(0, Math.min(innerHeight, y));
  cursorEl.style.left = cursorPos.x + 'px';
  cursorEl.style.top = cursorPos.y + 'px';
}
function onPointerMove(e){
  if(!pointerLocked){
    // fallback delta smoothing: use movement from client coords scaled by sensitivity and smoothing
    if(lastClient){
      const dx = (e.clientX - lastClient.x);
      const dy = (e.clientY - lastClient.y);
      cursorPos.x += dx * sensitivity;
      cursorPos.y += dy * sensitivity;
      setCursorPos(cursorPos.x, cursorPos.y);
    } else {
      // initial set
      cursorPos.x = e.clientX;
      cursorPos.y = e.clientY;
      setCursorPos(cursorPos.x, cursorPos.y);
    }
    lastClient = { x: e.clientX, y: e.clientY };
    return;
  }
  // pointer-locked delta control: movementX/movementY are already deltas
  cursorPos.x += e.movementX * sensitivity;
  cursorPos.y += e.movementY * sensitivity;
  setCursorPos(cursorPos.x, cursorPos.y);
}

// click handling using cursor position
function onGlobalClick(ev){
  // compute hit against circles by cursor position
  // prefer pointer click via pointer lock; else allow direct element click
  const cx = cursorPos.x;
  const cy = cursorPos.y;
  for(let i = circles.length - 1; i >= 0; i--){
    const c = circles[i];
    const dx = cx - c.x;
    const dy = cy - c.y;
    const dist = Math.hypot(dx, dy);
    if(dist <= c.size / 2){
      score += Math.round(100 * (1 + (sensitivity - 1) * 0.5));
      combo++;
      updateScore();
      try{ c.el.remove(); }catch(e){}
      circles.splice(i,1);
      return;
    }
  }
  // if missed
  combo = 0;
  updateScore();
}

// pointer lock events and fallback
document.addEventListener('pointerlockchange', ()=> {
  pointerLocked = (document.pointerLockElement === arena);
  // center cursor when lock obtained
  if(pointerLocked){
    cursorPos.x = innerWidth / 2;
    cursorPos.y = innerHeight / 2;
    setCursorPos(cursorPos.x, cursorPos.y);
  }
});

arena.addEventListener('click', async ()=> {
  // clicking the arena attempts to lock pointer if in game
  if(!game.classList.contains('hidden')){
    try {
      if(!pointerLocked && arena.requestPointerLock) arena.requestPointerLock();
    } catch(e){}
  }
});

// global mouse move listener
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mousedown', onGlobalClick);
window.addEventListener('resize', ()=> {
  // keep cursor inside bounds
  cursorPos.x = Math.max(0, Math.min(innerWidth, cursorPos.x));
  cursorPos.y = Math.max(0, Math.min(innerHeight, cursorPos.y));
  setCursorPos(cursorPos.x, cursorPos.y);
});

// initial load
loadSettings();
showScreen(menu);

// utility to clear circles when leaving
function clearAllCircles(){ removeAllCircles(); score = 0; combo = 0; updateScore(); }

// expose for debugging
window._ofo = {
  startSongFromFile,
  spawnCircle,
  clearAllCircles
};
