// Elements
const menu = document.getElementById('menu');
const upload = document.getElementById('upload');
const chooseSongBtn = document.getElementById('chooseSongBtn');
const backUpload = document.getElementById('backUpload');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const loading = document.getElementById('loading');
const game = document.getElementById('game');
const sens = document.getElementById('sens');
const theme = document.getElementById('theme');
const hideCursorCheckbox = document.getElementById('hideCursor');
const target = document.getElementById('target');
const quitBtn = document.getElementById('quit');
const scoreEl = document.getElementById('score');
const mp3input = document.getElementById('mp3input');

let sensitivity = 1;
let hideCursor = false;
let pos = {x: window.innerWidth/2, y: window.innerHeight/2};
let score = 0;

// Audio
let audioCtx, source, analyser, dataArray, audioElement;

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
    game.classList.add('hidden');
    loading.classList.add('hidden');
    screen.classList.remove('hidden');
    updateCursor();
}

// Buttons
document.getElementById('playBtn').onclick = ()=>showScreen(upload);
chooseSongBtn.onclick = ()=>mp3input.click();
backUpload.onclick = ()=>showScreen(menu);
document.getElementById('settingsBtn').onclick = ()=>showScreen(settings);
document.getElementById('creditsBtn').onclick = ()=>showScreen(credits);
document.getElementById('backSettings').onclick = ()=>{saveSettings(); showScreen(menu);}
document.getElementById('backCredits').onclick = ()=>showScreen(menu);
quitBtn.onclick = ()=>{ if(audioElement) audioElement.pause(); showScreen(menu); };

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

// MP3 upload & loading
mp3input.onchange = async (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    showScreen(loading);

    if(!audioCtx) audioCtx = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();
    await audioCtx.decodeAudioData(arrayBuffer);

    if(audioElement) audioElement.remove();
    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);
    audioElement.play();

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

    showScreen(game);
    detectBeats();
};

// Beat detection
let lastBeatTime = 0;
function detectBeats(){
    if(!analyser) return;
    analyser.getByteFrequencyData(dataArray);

    let lowSum = 0;
    for(let i=0;i<dataArray.length/4;i++) lowSum+=dataArray[i];
    const avg = lowSum/(dataArray.length/4);

    const now = audioCtx.currentTime*1000;
    if(avg>150 && now - lastBeatTime>200){
        lastBeatTime = now;
        spawnCircle();
    }

    if(audioElement.ended){
        setTimeout(()=>alert(`Song ended! Final Score: ${score}`),100);
        showScreen(menu);
        return;
    }

    requestAnimationFrame(detectBeats);
}

// Spawn one circle per beat
function spawnCircle(){
    const circle = document.createElement('div');
    circle.className = 'beatCircle';

    const size = 80;
    let x,y,safe=false;
    for(let i=0;i<50;i++){
        x = Math.random()*(window.innerWidth-size);
        y = Math.random()*(window.innerHeight-size);
        const circles = document.querySelectorAll('.beatCircle');
        safe=true;
        for(let c of circles){
            const rect = c.getBoundingClientRect();
            if(Math.abs(rect.left-x)<size && Math.abs(rect.top-y)<size){ safe=false; break; }
        }
        if(safe) break;
    }

    circle.style.left = x+'px';
    circle.style.top = y+'px';
    if(theme.value==='dark') circle.style.background='rgba(255,61,107,0.6)';
    else circle.style.background='rgba(0,139,139,0.6)';

    document.body.appendChild(circle);

    circle.onclick = ()=>{
        score+=100;
        scoreEl.textContent='Score: '+score;
        circle.remove();
    }

    setTimeout(()=>circle.remove(),1000);
}

// Settings inputs
sens.oninput = saveSettings;
theme.oninput = saveSettings;
hideCursorCheckbox.oninput = saveSettings;

loadSettings();
