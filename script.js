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
const playBtn = document.getElementById('playBtn');
const settingsBtn = document.getElementById('settingsBtn');
const creditsBtn = document.getElementById('creditsBtn');

let sensitivity = 1;
let hideCursor = false;
let pos = {x: window.innerWidth/2, y: window.innerHeight/2};
let score = 0;
let lastCirclePos = null;

let audioCtx, source, analyser, dataArray, audioElement;
let rafDetect = null;
let circles = [];
let pointerLockActive = false;
let lastMouseClient = null;

// load settings
function loadSettings(){
    sensitivity = parseFloat(localStorage.getItem('sens')||'1');
    sensitivity = Math.max(0.2, Math.min(3, sensitivity));
    sens.value = sensitivity;
    sensVal.textContent = sensitivity.toFixed(2);

    let t = localStorage.getItem('theme') || 'light';
    theme.value = t;
    document.body.className = t;

    hideCursor = localStorage.getItem('hideCursor')==='true';
    hideCursorCheckbox.checked = hideCursor;
    updateCursor();
}
function saveSettings(){
    localStorage.setItem('sens', sens.value);
    localStorage.setItem('theme', theme.value);
    localStorage.setItem('hideCursor', hideCursorCheckbox.checked ? 'true' : 'false');
    sensitivity = parseFloat(sens.value);
    hideCursor = hideCursorCheckbox.checked;
    document.body.className = theme.value;
    updateCursor();
}
function updateCursor(){
    if(!game.classList.contains('hidden') && hideCursor) document.body.classList.add('hide-cursor');
    else document.body.classList.remove('hide-cursor');
}

// show only one panel
function showScreen(screen){
    menu.classList.add('hidden');
    upload.classList.add('hidden');
    settings.classList.add('hidden');
    credits.classList.add('hidden');
    game.classList.add('hidden');
    loading.classList.add('hidden');
    endPanel.classList.add('hidden');
    screen.classList.remove('hidden');
    updateCursor();
}

// button wiring
playBtn.onclick = ()=> showScreen(upload);
chooseSongBtn.onclick = ()=> fileInput.click();
backUpload.onclick = ()=> showScreen(menu);
settingsBtn.onclick = ()=> showScreen(settings);
creditsBtn.onclick = ()=> showScreen(credits);
document.getElementById('backSettings').onclick = ()=>{ saveSettings(); showScreen(menu); };
document.getElementById('backCredits').onclick = ()=> showScreen(menu);
quitBtn.onclick = ()=>{ if(audioElement) audioElement.pause(); stopDetect(); showScreen(menu); };
playAgainBtn.onclick = ()=> showScreen(upload);
backMenuBtn.onclick = ()=> showScreen(menu);
sens.oninput = ()=>{ sensitivity = parseFloat(sens.value); sensVal.textContent = sensitivity.toFixed(2); };
theme.oninput = ()=>{ document.body.className = theme.value; };
hideCursorCheckbox.oninput = ()=>{ hideCursor = hideCursorCheckbox.checked; updateCursor(); };

// pointer lock behaviour
document.addEventListener('pointerlockchange', ()=> {
    pointerLockActive = (document.pointerLockElement === game || document.pointerLockElement === document.body);
});

// mouse movement: if pointer locked use movementX/Y * sensitivity; else lerp towards absolute client coords to avoid clipping
document.addEventListener('mousemove', e=>{
    if(game.classList.contains('hidden')) return;
    if(pointerLockActive){
        pos.x += e.movementX * sensitivity;
        pos.y += e.movementY * sensitivity;
    } else {
        const targetX = e.clientX - 20;
        const targetY = e.clientY - 20;
        // lerp factor based on sensitivity (higher = faster following)
        const alpha = Math.min(1, 0.18 * sensitivity + 0.06);
        pos.x += (targetX - pos.x) * alpha;
        pos.y += (targetY - pos.y) * alpha;
    }
    // clamp so target never goes out of bounds (target element assumed 40x40)
    pos.x = Math.max(0, Math.min(window.innerWidth - 40, pos.x));
    pos.y = Math.max(0, Math.min(window.innerHeight - 40, pos.y));
    target.style.left = pos.x + 'px';
    target.style.top = pos.y + 'px';
});

// file input
fileInput.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = (file.name.split('.').pop()||'').toLowerCase();
    if (ext !== 'mp3'){
        setTimeout(()=>{ alert('⚠️ Invalid file! Please select an MP3 file.'); fileInput.value = ''; showScreen(upload); },0);
        return;
    }
    showScreen(loading);
    startSong(file).catch(err=>{
        console.error(err);
        alert('⚠️ Failed to load audio. Make sure it is a valid MP3.');
        fileInput.value = '';
        showScreen(upload);
    });
};

async function startSong(file){
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = await file.arrayBuffer();
    try {
        await new Promise((res, rej)=> audioCtx.decodeAudioData(buffer.slice(0), ()=>res(), (e)=>rej(e)));
    } catch(e){
        throw new Error('Audio decoding failed');
    }
    if(audioElement) { try{ audioElement.pause(); }catch(e){} audioElement.remove(); audioElement = null; }
    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);
    audioElement.crossOrigin = "anonymous";
    try {
        await audioElement.play();
    } catch(err){
        throw new Error('Audio playback failed: '+err.message);
    }
    if(source){ try{ source.disconnect(); }catch(e){} source = null; }
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
    clearAllCircles();
    showScreen(game);
    // attempt pointer lock for better sensitivity control (user must click to allow in many browsers)
    try {
        if (game.requestPointerLock) {
            game.requestPointerLock();
        }
    } catch(e){}
    detectBeats();
}

// beat detection with dynamic average threshold
let lastBeatTime = 0;
let beatHistory = [];
function detectBeats(){
    if(!analyser) return;
    analyser.getByteFrequencyData(dataArray);
    let lowSum = 0;
    let lowLimit = Math.floor(dataArray.length / 4);
    for(let i=0;i<lowLimit;i++) lowSum += dataArray[i];
    const avg = lowSum / Math.max(1, lowLimit);
    beatHistory.push(avg);
    if(beatHistory.length > 40) beatHistory.shift();
    const histAvg = beatHistory.reduce((a,b)=>a+b,0) / Math.max(1, beatHistory.length);
    const threshold = histAvg * (1.25 - (sensitivity - 1) * 0.12); 
    const now = (audioCtx && audioCtx.currentTime) ? audioCtx.currentTime * 1000 : Date.now();
    if (avg > Math.max(140, threshold) && now - lastBeatTime > Math.max(180 - sensitivity*20, 80) && Math.random() < (0.7 + (sensitivity-1)*0.12)){
        lastBeatTime = now;
        spawnCircle();
    }
    if(audioElement && audioElement.ended){
        finalScore.textContent = 'Score: ' + score;
        showScreen(endPanel);
        return;
    }
    rafDetect = requestAnimationFrame(detectBeats);
}

function spawnCircle(){
    const circle = document.createElement('div');
    circle.className = 'beatCircle';
    const size = 80 + Math.round((Math.random()*40) - 20);
    circle.style.width = size + 'px';
    circle.style.height = size + 'px';
    const margin = Math.max(40, Math.round(size/2 + 8));
    let x = Math.random() * (window.innerWidth - margin*2) + margin;
    let y = Math.random() * (window.innerHeight - margin*2) + margin;
    // ensure not too close to last one or existing ones
    let attempts = 45;
    for(let i=0;i<attempts;i++){
        let ok = true;
        if(lastCirclePos){
            const dx = x - lastCirclePos.x;
            const dy = y - lastCirclePos.y;
            const dist = Math.hypot(dx, dy);
            if(dist < 120 || dist > 700) ok = false;
        }
        for(let c of circles){
            const dx = x - c.x, dy = y - c.y;
            if(Math.hypot(dx,dy) < Math.max(120, size)) { ok = false; break; }
        }
        if(ok) break;
        x = Math.random() * (window.innerWidth - margin*2) + margin;
        y = Math.random() * (window.innerHeight - margin*2) + margin;
    }
    lastCirclePos = { x, y };
    circle.style.left = (x - size/2) + 'px';
    circle.style.top = (y - size/2) + 'px';
    circle.style.background = (theme.value === 'dark') ? 'rgba(255,61,107,0.85)' : 'rgba(0,139,139,0.85)';
    circle.style.boxShadow = (theme.value === 'dark') ? `0 12px 40px 0 rgba(255,61,107,0.18)` : `0 12px 40px 0 rgba(0,139,139,0.18)`;
    document.body.appendChild(circle);

    circles.push({ el: circle, x, y, size });

    circle.onclick = ()=>{
        score += 100;
        scoreEl.textContent = 'Score: ' + score;
        try { circle.remove(); } catch(e){}
        // remove from circles array
        for(let i=circles.length-1;i>=0;i--){
            if(circles[i].el === circle) circles.splice(i,1);
        }
    };

    // auto-remove after a life time (shorter if sensitivity high)
    const life = Math.max(580, 1000 - (sensitivity - 1) * 300 - Math.random()*200);
    // shrink animation
    const created = Date.now();
    (function animate(){
        if(!document.body.contains(circle)) return;
        const t = (Date.now() - created) / life;
        if(t >= 1){ try { circle.remove(); } catch(e){} for(let i=circles.length-1;i>=0;i--) if(circles[i].el===circle) circles.splice(i,1); return; }
        const scale = 1 - t;
        circle.style.transform = `scale(${scale})`;
        circle.style.opacity = String(1 - t*1.05);
        requestAnimationFrame(animate);
    })();

    setTimeout(()=>{
        if(document.body.contains(circle)) try { circle.remove(); } catch(e){}
        for(let i=circles.length-1;i>=0;i--) if(circles[i].el===circle) circles.splice(i,1);
    }, life + 60);
}

// cleanup helpers
function stopDetect(){
    if(rafDetect) cancelAnimationFrame(rafDetect);
    rafDetect = null;
    try { if(audioElement) audioElement.pause(); } catch(e){}
    if(source){ try{ source.disconnect(); }catch(e){} source = null; }
    if(analyser){ analyser.disconnect(); analyser = null; }
}
function clearAllCircles(){
    for(let c of circles) try { c.el.remove(); } catch(e){}
    circles = [];
}

// ensure circles never spawn half off-screen (handled by margin), and target follow clamps to window
window.addEventListener('resize', ()=>{
    pos.x = Math.max(0, Math.min(window.innerWidth-40, pos.x));
    pos.y = Math.max(0, Math.min(window.innerHeight-40, pos.y));
    target.style.left = pos.x + 'px';
    target.style.top = pos.y + 'px';
});

// initial load
loadSettings();
showScreen(menu);
