// Elements
const menu = document.getElementById('menu');
const upload = document.getElementById('upload');
const chooseSongBtn = document.getElementById('chooseSongBtn');
const backUpload = document.getElementById('backUpload');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const howto = document.getElementById('howto');
const loading = document.getElementById('loading');
const game = document.getElementById('game');
const endPanel = document.getElementById('endPanel');
const finalScore = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgain');
const backMenuBtn = document.getElementById('backMenu');
const sens = document.getElementById('sens');
const theme = document.getElementById('theme');
const hideCursorCheckbox = document.getElementById('hideCursor');
const target = document.getElementById('target');
const quitBtn = document.getElementById('quit');
const scoreEl = document.getElementById('score');
const fileInput = document.getElementById('mp3input');
const howToBtn = document.getElementById('howToBtn');
const backHowTo = document.getElementById('backHowTo');

let sensitivity = 1;
let hideCursor = false;
let pos = {x: window.innerWidth/2, y: window.innerHeight/2};
let score = 0;

// Audio
let audioCtx, source, analyser, dataArray, audioElement;

// Last circle position
let lastCirclePos = null;

// Load settings
function loadSettings(){
    sensitivity = parseFloat(localStorage.getItem('sens')||'1');
    sens.value = sensitivity;
    let t = localStorage.getItem('theme') || 'light';
    theme.value = t;
    document.body.className = t;
    hideCursor = localStorage.getItem('hideCursor')==='true';
    hideCursorCheckbox.checked = hideCursor;
    updateCursor();
}

// Save settings
function saveSettings(){
    localStorage.setItem('sens', sens.value);
    localStorage.setItem('theme', theme.value);
    localStorage.setItem('hideCursor', hideCursorCheckbox.checked);
    sensitivity = parseFloat(sens.value);
    hideCursor = hideCursorCheckbox.checked;
    document.body.className = theme.value;
    updateCursor();
}

// Cursor visibility
function updateCursor(){
    if(!game.classList.contains('hidden') && hideCursor) document.body.classList.add('hide-cursor');
    else document.body.classList.remove('hide-cursor');
}

// Show only one panel
function showScreen(screen){
    menu.classList.add('hidden');
    upload.classList.add('hidden');
    settings.classList.add('hidden');
    credits.classList.add('hidden');
    howto.classList.add('hidden');
    game.classList.add('hidden');
    loading.classList.add('hidden');
    endPanel.classList.add('hidden');
    screen.classList.remove('hidden');
    updateCursor();
}

// Buttons
document.getElementById('playBtn').onclick = ()=>showScreen(upload);
chooseSongBtn.onclick = ()=>fileInput.click();
backUpload.onclick = ()=>showScreen(menu);
document.getElementById('settingsBtn').onclick = ()=>showScreen(settings);
document.getElementById('creditsBtn').onclick = ()=>showScreen(credits);
document.getElementById('backSettings').onclick = ()=>{saveSettings(); showScreen(menu);}
document.getElementById('backCredits').onclick = ()=>showScreen(menu);
quitBtn.onclick = ()=>{ if(audioElement) audioElement.pause(); showScreen(menu); };
playAgainBtn.onclick = ()=>showScreen(upload);
backMenuBtn.onclick = ()=>showScreen(menu);
howToBtn.onclick = ()=>showScreen(howto);
backHowTo.onclick = ()=>showScreen(menu);

// Mouse follow
document.addEventListener('mousemove', e=>{
    if(game.classList.contains('hidden')) return;
    let x = e.clientX-20;
    let y = e.clientY-20;
    pos.x += (x-pos.x)*sensitivity*0.5;
    pos.y += (y-pos.y)*sensitivity*0.5;
    pos.x = Math.max(0, Math.min(window.innerWidth-40, pos.x));
    pos.y = Math.max(0, Math.min(window.innerHeight-40, pos.y));
    target.style.left = pos.x+'px';
    target.style.top = pos.y+'px';
});

// File upload & loading
fileInput.onchange = e => {
    const file = e.target.files[0];
    if(!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if(ext !== 'mp3'){
        setTimeout(()=>{ alert('⚠️ Invalid file! Please select an MP3 file.'); fileInput.value = ''; },0);
        return;
    }
    showScreen(loading);
    startSong(file).catch(err=>{
        console.error(err);
        alert('⚠️ Failed to load audio. Make sure it is a valid MP3.');
        fileInput.value='';
        showScreen(upload);
    });
};

async function startSong(file){
    if(!audioCtx) audioCtx = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();
    try { await new Promise((resolve,reject)=>{ audioCtx.decodeAudioData(arrayBuffer, resolve, reject); }); } 
    catch(e){ throw new Error('Audio decoding failed'); }

    if(audioElement) audioElement.remove();
    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);
    try { await audioElement.play(); } 
    catch(err){ throw new Error('Audio playback failed: '+err.message); }

    source = audioCtx.createMediaElementSource(audioElement);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    score = 0;
    scoreEl.textContent = 'Score: 0';
    pos.x = window.innerWidth/2;
    pos.y = window.innerHeight/2;
    lastCirclePos = null;

    showScreen(game); // hide menu

    detectBeats();
}

// Beat detection
let lastBeatTime = 0;
function detectBeats(){
    if(!analyser) return;
    analyser.getByteFrequencyData(dataArray);
    let lowSum=0;
    for(let i=0;i<dataArray.length/4;i++) lowSum+=dataArray[i];
    const avg = lowSum/(dataArray.length/4);
    const now = audioCtx.currentTime*1000;
    if(avg>150 && now-lastBeatTime>300 && Math.random()<0.7){
        lastBeatTime = now;
        spawnCircle();
    }
    if(audioElement.ended){
        finalScore.textContent = 'Score: '+score;
        showScreen(endPanel);
        return;
    }
    requestAnimationFrame(detectBeats);
}

// Spawn circle
function spawnCircle(){
    const circle=document.createElement('div');
    circle.className='beatCircle';
    const size=80;
    let x,y;
    const minDistance=120;
    const maxDistance=400;
    let attempts=50;
    for(let i=0;i<attempts;i++){
        x=Math.random()*(window.innerWidth-size);
        y=Math.random()*(window.innerHeight-size);
        if(!lastCirclePos) break;
        const dx=x-lastCirclePos.x;
        const dy=y-lastCirclePos.y;
        const dist=Math.sqrt(dx*dx+dy*dy);
        if(dist>=minDistance && dist<=maxDistance) break;
    }
    lastCirclePos={x,y};
    circle.style.left=x+'px';
    circle.style.top=y+'px';
    circle.style.background=theme.value==='dark'?'rgba(255,61,107,0.8)':'rgba(0,255,255,0.8)';
    circle.style.boxShadow='0 0 20px rgba(255,255,255,0.8)';

    document.body.appendChild(circle);
    circle.onclick=()=>{
        score+=100;
        scoreEl.textContent='Score: '+score;
        circle.remove();
    }

    // Last 2.5s with fade
    circle.style.transition='opacity 0.5s, transform 0.5s';
    setTimeout(()=>circle.style.opacity=0,2000);
    setTimeout(()=>circle.remove(),2500);
}

// Settings
sens.oninput=saveSettings;
theme.oninput=saveSettings;
hideCursorCheckbox.oninput=saveSettings;

loadSettings();
