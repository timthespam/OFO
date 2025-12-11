// Elements
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
const theme = document.getElementById('theme');
const hideCursorCheckbox = document.getElementById('hideCursor');
const target = document.getElementById('target');
const quitBtn = document.getElementById('quit');
const scoreEl = document.getElementById('score');
const fileInput = document.getElementById('mp3input');

const warningPopup = document.getElementById('warningPopup');
const warningMessage = document.getElementById('warningMessage');
const warningOK = document.getElementById('warningOK');

let sensitivity = 1;
let hideCursor = false;
let pos = {x: window.innerWidth/2, y: window.innerHeight/2};
let score = 0;

// Audio
let audioCtx, source, analyser, dataArray, audioElement;
let lastCirclePos = null;

// IMPORTANT: only treat file changes as user-initiated if they clicked "Choose File"
let userRequestedFile = false;

// ---------------- Settings load/save ----------------
function loadSettings(){
    sensitivity = parseFloat(localStorage.getItem('sens')||'1');
    sens.value = sensitivity;

    let t = localStorage.getItem('theme') || 'light';
    theme.value = t;
    document.body.className = t;

    hideCursor = localStorage.getItem('hideCursor') === 'true';
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

// ---------------- Screen switching ----------------
function showScreen(screen){
    menu.classList.add('hidden');
    upload.classList.add('hidden');
    settings.classList.add('hidden');
    credits.classList.add('hidden');
    game.classList.add('hidden');
    loading.classList.add('hidden');
    endPanel.classList.add('hidden');
    warningPopup.classList.add('hidden');

    screen.classList.remove('hidden');
    updateCursor();
}

// ---------------- Buttons ----------------
document.getElementById('playBtn').onclick = ()=>showScreen(upload);
chooseSongBtn.onclick = ()=> { userRequestedFile = true; fileInput.click(); };
backUpload.onclick = ()=>showScreen(menu);
document.getElementById('settingsBtn').onclick = ()=>showScreen(settings);
document.getElementById('creditsBtn').onclick = ()=>showScreen(credits);
document.getElementById('backSettings').onclick = ()=>{ saveSettings(); showScreen(menu); };
document.getElementById('backCredits').onclick = ()=>showScreen(menu);
quitBtn.onclick = ()=>{ if(audioElement) audioElement.pause(); showScreen(menu); };
playAgainBtn.onclick = ()=>showScreen(upload);
backMenuBtn.onclick = ()=>showScreen(menu);

// Warning popup OK
warningOK && (warningOK.onclick = ()=> { warningPopup.classList.add('hidden'); });

// ---------------- Cursor movement ----------------
document.addEventListener('mousemove', e=>{
    if(game.classList.contains('hidden')) return;
    let x = e.clientX - 20;
    let y = e.clientY - 20;
    pos.x += (x - pos.x) * sensitivity * 0.5;
    pos.y += (y - pos.y) * sensitivity * 0.5;
    pos.x = Math.max(0, Math.min(window.innerWidth - 40, pos.x));
    pos.y = Math.max(0, Math.min(window.innerHeight - 40, pos.y));
    target.style.left = pos.x + 'px';
    target.style.top = pos.y + 'px';
});

// target visual feedback
target.addEventListener('click', ()=>{
    target.classList.add('clicked');
    setTimeout(()=>target.classList.remove('clicked'), 150);
});

// ---------------- File handling (only if userRequestedFile) ----------------
fileInput.onchange = async (e) => {
    const file = e.target.files[0];

    // Reset flag immediately (we only want to treat this change once right after button click)
    const wasUserRequested = userRequestedFile;
    userRequestedFile = false;

    if(!file) return; // user canceled picker

    if(!wasUserRequested){
        // This onchange wasn't caused by the user clicking "Choose File" (browser autofill/restore).
        // Ignore silently and clear input.
        fileInput.value = '';
        return;
    }

    // Validate extension immediately (case-insensitive)
    const name = (file.name || '').toLowerCase();
    const ext = name.split('.').pop();
    if(ext !== 'mp3'){
        // show popup warning (not during load)
        warningMessage.textContent = 'Please upload an MP3 file.';
        warningPopup.classList.remove('hidden');
        fileInput.value = '';
        return;
    }

    // Proceed to loading screen and try to decode safely
    showScreen(loading);

    try {
        await startSong(file);
    } catch(err){
        console.error(err);
        warningMessage.textContent = 'Failed to load audio. Try a different MP3.';
        warningPopup.classList.remove('hidden');
        fileInput.value = '';
        showScreen(upload);
    }
};

// ---------------- Safe audio start ----------------
async function startSong(file){
    if(!audioCtx) audioCtx = new AudioContext();

    const arrayBuffer = await file.arrayBuffer();

    // Safely decode (catch failures)
    try {
        await new Promise((resolve, reject) => {
            audioCtx.decodeAudioData(arrayBuffer, resolve, reject);
        });
    } catch(e){
        throw new Error('Decoding failed');
    }

    // Create element and play (catch autoplay errors)
    if(audioElement) {
        try { audioElement.pause(); } catch {}
        audioElement.remove();
    }
    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);

    try {
        await audioElement.play();
    } catch(err){
        throw new Error('Playback failed: ' + (err && err.message || err));
    }

    // Hook analyzer
    source = audioCtx.createMediaElementSource(audioElement);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    dataArray = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    // reset game state
    score = 0;
    scoreEl.textContent = 'Score: 0';
    lastCirclePos = null;

    showScreen(game);
    detectBeats();
}

// ---------------- Beat detection ----------------
let lastBeatTime = 0;
function detectBeats(){
    if(!analyser) return;
    analyser.getByteFrequencyData(dataArray);

    let lowSum = 0;
    // average lower bins (bass)
    const bins = Math.min(40, dataArray.length);
    for(let i=0;i<bins;i++) lowSum += dataArray[i];
    const avg = lowSum / bins;

    const now = (audioCtx && audioCtx.currentTime ? audioCtx.currentTime*1000 : Date.now());

    // spawn less often and with randomness to reduce spam on slow tracks
    if(avg > 140 && now - lastBeatTime > 350 && Math.random() < 0.55){
        lastBeatTime = now;
        spawnCircle();
    }

    if(audioElement && audioElement.ended){
        finalScore.textContent = 'Score: ' + score;
        showScreen(endPanel);
        return;
    }

    requestAnimationFrame(detectBeats);
}

// ---------------- Spawn circle ----------------
function spawnCircle(){
    const circle = document.createElement('div');
    circle.className = 'beatCircle';
    const size = 80;

    let x,y;
    const minDist = 120;
    const maxDist = 350;

    for(let i=0;i<60;i++){
        x = Math.random() * (window.innerWidth - size);
        y = Math.random() * (window.innerHeight - size);
        if(!lastCirclePos) break;
        const dx = x - lastCirclePos.x;
        const dy = y - lastCirclePos.y;
        const d = Math.hypot(dx,dy);
        if(d >= minDist && d <= maxDist) break;
    }

    lastCirclePos = {x,y};

    circle.style.left = x + 'px';
    circle.style.top = y + 'px';
    circle.style.background = (theme.value === 'dark') ? 'rgba(255,61,107,0.6)' : 'rgba(0,139,139,0.6)';

    document.body.appendChild(circle);

    // click behavior
    circle.onclick = ()=>{
        score += 100;
        scoreEl.textContent = 'Score: ' + score;

        circle.style.transition = 'transform 0.12s ease, filter 0.12s ease, opacity 0.15s ease';
        circle.style.transform = 'scale(1.35)';
        circle.style.filter = 'brightness(2)';
        circle.style.opacity = '0';

        setTimeout(()=>{ if(circle.parentNode) circle.remove(); }, 160);
    };

    // auto remove in case not clicked
    setTimeout(()=>{ if(circle.parentNode) circle.remove(); }, 1000);
}

// ---------------- Final setup -------------
sens.oninput = saveSettings;
theme.oninput = saveSettings;
hideCursorCheckbox.oninput = saveSettings;

loadSettings();
