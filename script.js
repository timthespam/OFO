const menu = document.getElementById('menu');
const upload = document.getElementById('upload');
const chooseSongBtn = document.getElementById('chooseSongBtn');
const backUpload = document.getElementById('backUpload');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const loading = document.getElementById('loading');
const game = document.getElementById('game');
const endPanel = document.getElementById('endPanel');
const finalScore = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgain');
const backMenuBtn = document.getElementById('backMenu');
const sens = document.getElementById('sens');
const sensVal = document.getElementById('sensVal');
const theme = document.getElementById('theme');
const hideCursorCheckbox = document.getElementById('hideCursor');
const target = document.getElementById('target');
const quitBtn = document.getElementById('quit');
const scoreEl = document.getElementById('score');
const fileInput = document.getElementById('mp3input');

let sensitivity = 1;
let hideCursor = false;
let pos = {x:window.innerWidth/2, y:window.innerHeight/2};
let score = 0;
let lastCirclePos = null;
let audioCtx, source, analyser, dataArray, audioElement;

// Settings
function loadSettings(){
    sensitivity = parseFloat(localStorage.getItem('sens')||'1');
    sens.value = sensitivity;
    sensVal.textContent = sensitivity.toFixed(2);
    let t = localStorage.getItem('theme')||'light';
    theme.value = t;
    document.body.className = t;
    hideCursor = localStorage.getItem('hideCursor')==='true';
    hideCursorCheckbox.checked = hideCursor;
    updateCursor();
}
function saveSettings(){
    localStorage.setItem('sens', sens.value);
    localStorage.setItem('theme', theme.value);
    localStorage.setItem('hideCursor', hideCursorCheckbox.checked);
    sensitivity = parseFloat(sens.value);
    hideCursor = hideCursorCheckbox.checked;
    document.body.className = theme.value;
    updateCursor();
}
function updateCursor(){
    if(!game.classList.contains('hidden') && hideCursor) document.body.classList.add('hide-cursor');
    else document.body.classList.remove('hide-cursor');
}

// Panels
function showScreen(screen){
    [menu, upload, settings, credits, loading, game, endPanel].forEach(s=>s.classList.add('hidden'));
    screen.classList.remove('hidden');
    updateCursor();
}

document.getElementById('playBtn').onclick = ()=>showScreen(upload);
chooseSongBtn.onclick = ()=>fileInput.click();
backUpload.onclick = ()=>showScreen(menu);
document.getElementById('settingsBtn').onclick = ()=>showScreen(settings);
document.getElementById('creditsBtn').onclick = ()=>showScreen(credits);
document.getElementById('backSettings').onclick = ()=>{ saveSettings(); showScreen(menu); };
document.getElementById('backCredits').onclick = ()=>showScreen(menu);
quitBtn.onclick = ()=>{ if(audioElement) audioElement.pause(); showScreen(menu); };
playAgainBtn.onclick = ()=>showScreen(upload);
backMenuBtn.onclick = ()=>showScreen(menu);
sens.oninput = ()=>{ sensitivity=parseFloat(sens.value); sensVal.textContent=sensitivity.toFixed(2); };
theme.oninput = saveSettings;
hideCursorCheckbox.oninput = saveSettings;

// Mouse follow
document.addEventListener('mousemove', e=>{
    if(game.classList.contains('hidden')) return;
    const targetX = e.clientX-20;
    const targetY = e.clientY-20;
    const alpha = Math.min(1, 0.18*sensitivity+0.06);
    pos.x += (targetX-pos.x)*alpha;
    pos.y += (targetY-pos.y)*alpha;
    pos.x = Math.max(0, Math.min(window.innerWidth-40, pos.x));
    pos.y = Math.max(0, Math.min(window.innerHeight-40, pos.y));
    target.style.left = pos.x+'px';
    target.style.top = pos.y+'px';
});

// File upload
fileInput.onchange = async e=>{
    const file = e.target.files[0];
    if(!file) return;
    showScreen(loading);
    const ext = (file.name.split('.').pop()||'').toLowerCase();
    if(ext!=='mp3'){
        setTimeout(()=>{ alert('⚠️ Only MP3 files are playable!'); showScreen(upload); fileInput.value=''; },0);
        return;
    }
    // play song
    if(!audioCtx) audioCtx = new AudioContext();
    if(audioElement){ audioElement.pause(); audioElement.remove(); }
    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);
    audioElement.crossOrigin = 'anonymous';
    try { await audioElement.play(); } catch(e){ alert('⚠️ Failed to play audio'); showScreen(upload); return; }
    source = audioCtx.createMediaElementSource(audioElement);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    score=0; scoreEl.textContent='Score: 0';
    pos = {x:window.innerWidth/2, y:window.innerHeight/2};
    lastCirclePos=null;
    showScreen(game);
    detectBeats();
};

// Beat detection
let lastBeatTime=0;
function detectBeats(){
    if(!analyser) return;
    analyser.getByteFrequencyData(dataArray);
    let lowSum=0;
    for(let i=0;i<dataArray.length/4;i++) lowSum+=dataArray[i];
    const avg = lowSum/(dataArray.length/4);
    const now = Date.now();
    if(avg>150 && now-lastBeatTime>300 && Math.random()<0.7){
        lastBeatTime = now;
        spawnCircle();
    }
    if(audioElement && audioElement.ended){ finalScore.textContent='Score: '+score; showScreen(endPanel); return; }
    requestAnimationFrame(detectBeats);
}

function spawnCircle(){
    const circle = document.createElement('div');
    circle.className='beatCircle';
    const size=80;
    let x=Math.random()*(window.innerWidth-size);
    let y=Math.random()*(window.innerHeight-size);
    circle.style.left = x+'px';
    circle.style.top = y+'px';
    document.body.appendChild(circle);
    circle.onclick = ()=>{ score+=100; scoreEl.textContent='Score: '+score; circle.remove(); };
    setTimeout(()=>{ if(circle.parentNode) circle.remove(); },1000);
}

loadSettings();
showScreen(menu);
