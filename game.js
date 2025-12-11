const KEY='ofo_settings_v1';
let settings={sensitivity:1,theme:'dark'};
let state={score:0,hits:0,misses:0};
const menu=document.getElementById('menu');
const settingsScreen=document.getElementById('settings');
const creditsScreen=document.getElementById('credits');
const gameScreen=document.getElementById('game');
const playBtn=document.getElementById('playBtn');
const settingsBtn=document.getElementById('settingsBtn');
const creditsBtn=document.getElementById('creditsBtn');
const backFromSettings=document.getElementById('backFromSettings');
const backFromCredits=document.getElementById('backFromCredits');
const saveSettings=document.getElementById('saveSettings');
const sensitivity=document.getElementById('sensitivity');
const sensVal=document.getElementById('sensVal');
const themeSelect=document.getElementById('themeSelect');
const themeToggle=document.getElementById('themeToggle');
const arena=document.getElementById('arena');
const scoreEl=document.getElementById('score');
const hitsEl=document.getElementById('hits');
const missesEl=document.getElementById('misses');
const quitBtn=document.getElementById('quitBtn');
let cursor=document.createElement('div');
cursor.className='cursor';
arena.appendChild(cursor);
let cx=0,cy=0,prevMouse=null,spawnTimer=null,targetTimer=null,activeTarget=null;
function load(){const raw=localStorage.getItem(KEY);if(raw){try{settings=JSON.parse(raw);}catch(e){}}
applySettings();}
function save(){localStorage.setItem(KEY,JSON.stringify(settings));}
function applySettings(){document.documentElement.classList.remove('light','dark');document.documentElement.classList.add(settings.theme);sensitivity.value=settings.sensitivity;sensVal.textContent=settings.sensitivity.toFixed(1);themeSelect.value=settings.theme;themeToggle.textContent=settings.theme==='light'?'Light':'Dark';}
function showScreen(el){[menu,settingsScreen,creditsScreen,gameScreen].forEach(s=>s.classList.remove('active'));el.classList.add('active');}
playBtn.addEventListener('click',()=>{startGame();showScreen(gameScreen);arena.focus();});
settingsBtn.addEventListener('click',()=>{showScreen(settingsScreen);});
creditsBtn.addEventListener('click',()=>{showScreen(creditsScreen);});
backFromSettings.addEventListener('click',()=>{showScreen(menu);});
backFromCredits.addEventListener('click',()=>{showScreen(menu);});
saveSettings.addEventListener('click',()=>{settings.sensitivity=parseFloat(sensitivity.value);settings.theme=themeSelect.value;save();applySettings();showScreen(menu);});
sensitivity.addEventListener('input',()=>{sensVal.textContent=parseFloat(sensitivity.value).toFixed(1);});
themeToggle.addEventListener('click',()=>{settings.theme=(settings.theme==='dark')?'light':'dark';save();applySettings();});
quitBtn.addEventListener('click',()=>{stopGame();showScreen(menu);});
function rand(min,max){return Math.random()*(max-min)+min;}
function spawnTarget(){if(activeTarget)return;const r=rand(18,36);const x=rand(r,arena.clientWidth-r);const y=rand(r,arena.clientHeight-r);const el=document.createElement('div');el.className='target';el.style.width=r+'px';el.style.height=r+'px';el.style.left=x+'px';el.style.top=y+'px';el.style.background='radial-gradient(circle at 30% 30%, '+(settings.theme==='dark'? '#7ce3ff':'#006b9a')+', rgba(0,0,0,0))';el.dataset.r=r;arena.appendChild(el);activeTarget=el;setTimeout(()=>{if(activeTarget===el){arena.removeChild(el);activeTarget=null;state.misses++;updateStats()}},1200);}
function startGame(){state.score=0;state.hits=0;state.misses=0;updateStats();cx=arena.clientWidth/2;cy=arena.clientHeight/2;cursor.style.left=cx+'px';cursor.style.top=cy+'px';prevMouse=null;arena.addEventListener('mousemove',onMove);arena.addEventListener('click',onClick);spawnTimer=setInterval(spawnTarget,800);}
function stopGame(){clearInterval(spawnTimer);spawnTimer=null;if(activeTarget){arena.removeChild(activeTarget);activeTarget=null;}arena.removeEventListener('mousemove',onMove);arena.removeEventListener('click',onClick);}
function onMove(e){if(prevMouse){const dx=e.clientX-prevMouse.x;const dy=e.clientY-prevMouse.y;cx+=dx*settings.sensitivity;cy+=dy*settings.sensitivity;cx=Math.max(0,Math.min(arena.clientWidth, cx));cy=Math.max(0,Math.min(arena.clientHeight, cy));cursor.style.left=cx+'px';cursor.style.top=cy+'px';}prevMouse={x:e.clientX,y:e.clientY};}
function onClick(){if(!activeTarget)return;const tx=parseFloat(activeTarget.style.left);const ty=parseFloat(activeTarget.style.top);const r=parseFloat(activeTarget.dataset.r)/2;const dx=cx-tx;const dy=cy-ty;const dist=Math.sqrt(dx*dx+dy*dy);if(dist<=r){state.hits++;state.score+=Math.round(100* (1+settings.sensitivity));arena.removeChild(activeTarget);activeTarget=null;updateStats();}else{state.misses++;updateStats();}}
function updateStats(){scoreEl.textContent=state.score;hitsEl.textContent=state.hits;missesEl.textContent=state.misses;}
load();applySettings();showScreen(menu);