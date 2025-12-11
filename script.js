// UI Elements
const menu = document.getElementById('menu');
const upload = document.getElementById('upload');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const loading = document.getElementById('loading');
const game = document.getElementById('game');
const endPanel = document.getElementById('endPanel');

const chooseSongBtn = document.getElementById('chooseSongBtn');
const fileInput = document.getElementById('mp3input');

const finalScore = document.getElementById('finalScore');
const playAgainBtn = document.getElementById('playAgain');
const backMenuBtn = document.getElementById('backMenu');

const sens = document.getElementById('sens');
const theme = document.getElementById('theme');
const hideCursorCheckbox = document.getElementById('hideCursor');

const target = document.getElementById('target');
const quitBtn = document.getElementById('quit');
const scoreEl = document.getElementById('score');

const warningPopup = document.getElementById("warningPopup");
const warningMessage = document.getElementById("warningMessage");
const warningOK = document.getElementById("warningOK");

// Game vars
let sensitivity = 1;
let hideCursor = false;
let score = 0;
let pos = {x: window.innerWidth/2, y: window.innerHeight/2};
let lastCirclePos = null;

// Audio engine
let audioCtx, analyser, audioElement, dataArray;

// --------------------------- SETTINGS ------------------------------

function loadSettings(){
    sensitivity = parseFloat(localStorage.getItem('sens')||'1');
    sens.value = sensitivity;

    const t = localStorage.getItem('theme') || 'light';
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
    if(!game.classList.contains('hidden') && hideCursor){
        document.body.classList.add('hide-cursor');
    } else {
        document.body.classList.remove('hide-cursor');
    }
}

// --------------------------- SCREEN SYSTEM -------------------------

function showScreen(screen){
    menu.classList.add('hidden');
    upload.classList.add('hidden');
    settings.classList.add('hidden');
    credits.classList.add('hidden');
    game.classList.add('hidden');
    loading.classList.add('hidden');
    endPanel.classList.add('hidden');
    if(warningPopup) warningPopup.classList.add('hidden');

    screen.classList.remove('hidden');
    updateCursor();
}

// --------------------------- BUTTON HOOKS ---------------------------

document.getElementById('playBtn').onclick = ()=>showScreen(upload);
chooseSongBtn.onclick = ()=>fileInput.click();
document.getElementById('backUpload').onclick = ()=>showScreen(menu);
document.getElementById('settingsBtn').onclick = ()=>showScreen(settings);
document.getElementById('creditsBtn').onclick = ()=>showScreen(credits);
document.getElementById('backSettings').onclick = ()=>{saveSettings(); showScreen(menu);}
document.getElementById('backCredits').onclick = ()=>showScreen(menu);
quitBtn.onclick = ()=>{ if(audioElement) audioElement.pause(); showScreen(menu); };
playAgainBtn.onclick = ()=>showScreen(upload);
backMenuBtn.onclick = ()=>showScreen(menu);

// Warning popup
warningOK.onclick = ()=> warningPopup.classList.add("hidden");
function showWarning(msg){
    warningPopup.classList.remove("hidden");
    warningMessage.textContent = msg;
}

// --------------------------- CURSOR MOVEMENT ------------------------

document.addEventListener('mousemove', e=>{
    if(game.classList.contains('hidden')) return;

    const x = e.clientX - 20;
    const y = e.clientY - 20;

    pos.x += (x-pos.x)*sensitivity*0.5;
    pos.y += (y-pos.y)*sensitivity*0.5;

    pos.x = Math.max(0, Math.min(window.innerWidth-40, pos.x));
    pos.y = Math.max(0, Math.min(window.innerHeight-40, pos.y));

    target.style.left = pos.x+'px';
    target.style.top = pos.y+'px';
});

// Smooth flash on click
target.onclick = ()=>{
    target.classList.add("clicked");
    setTimeout(()=>target.classList.remove("clicked"), 150);
};

// --------------------------- FILE LOADING ---------------------------

fileInput.onchange = async e=>{
    const file = e.target.files[0];
    if(!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if(ext !== 'mp3'){
        showWarning("❌ Unsupported file.\nPlease upload an MP3.");
        fileInput.value = "";
        return;
    }

    showScreen(loading);

    try {
        await startSong(file);
    } catch(err){
        console.error(err);
        showWarning("⚠️ Failed to load audio.\nTry another MP3.");
        fileInput.value = "";
        showScreen(upload);
    }
};

async function startSong(file){
    if(!audioCtx) audioCtx = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();

    // decode test
    await audioCtx.decodeAudioData(arrayBuffer.slice(0));

    // real audio element
    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);

    await audioElement.play();

    const source = audioCtx.createMediaElementSource(audioElement);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;

    dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    lastCirclePos = null;
    score = 0;
    scoreEl.textContent = "Score: 0";
    showScreen(game);

    detectBeats();
}

// --------------------------- BEAT DETECTION ---------------------------

let lastBeat = 0;

function detectBeats(){
    if(!analyser) return;

    analyser.getByteFrequencyData(dataArray);

    // average low freq
    let low = 0;
    for(let i=0;i<40;i++) low += dataArray[i];
    low /= 40;

    const now = audioCtx.currentTime * 1000;

    // beat threshold
    if(low > 150 && now - lastBeat > 320){
        lastBeat = now;
        spawnCircle();
    }

    if(audioElement.ended){
        finalScore.textContent = "Score: "+score;
        showScreen(endPanel);
        return;
    }

    requestAnimationFrame(detectBeats);
}

// --------------------------- CIRCLE SPAWN ---------------------------

function spawnCircle(){

    const size = 80;
    const circle = document.createElement("div");
    circle.className = "beatCircle";

    let x,y;
    const minDist = 120;
    const maxDist = 350;

    for(let i=0;i<40;i++){
        x = Math.random()*(window.innerWidth-size);
        y = Math.random()*(window.innerHeight-size);

        if(!lastCirclePos) break;

        const dx = x-lastCirclePos.x;
        const dy = y-lastCirclePos.y;
        const d = Math.hypot(dx,dy);

        if(d >= minDist && d <= maxDist) break;
    }

    lastCirclePos = {x,y};

    circle.style.left = x+"px";
    circle.style.top = y+"px";
    circle.style.background = 
        theme.value==='dark' 
        ? "rgba(255,61,107,0.6)" 
        : "rgba(0,139,139,0.6)";

    document.body.appendChild(circle);

    // click effect
    circle.onclick = ()=>{
        score += 100;
        scoreEl.textContent = "Score: "+score;
        circle.style.transition = "0.15s";
        circle.style.filter = "brightness(2)";
        circle.style.transform = "scale(1.3)";
        setTimeout(()=>circle.remove(), 120);
    };

    setTimeout(()=>circle.remove(), 1000);
}

// --------------------------- INIT ---------------------------
sens.oninput = saveSettings;
theme.oninput = saveSettings;
hideCursorCheckbox.oninput = saveSettings;

loadSettings();
