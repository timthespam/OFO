// ===== Elements =====
const menu = document.getElementById('menu');
const upload = document.getElementById('upload');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const loading = document.getElementById('loading');
const game = document.getElementById('game');
const endPanel = document.getElementById('endPanel');
const scoreEl = document.getElementById('score');
const finalScore = document.getElementById('finalScore');

const playBtn = document.getElementById('playBtn');
const settingsBtn = document.getElementById('settingsBtn');
const creditsBtn = document.getElementById('creditsBtn');
const backUpload = document.getElementById('backUpload');
const backSettings = document.getElementById('backSettings');
const backCredits = document.getElementById('backCredits');
const backMenu = document.getElementById('backMenu');

const fileBtn = document.getElementById('fileBtn');
const fileInput = document.getElementById('fileInput');
const themeSelect = document.getElementById('theme');

// ===== State =====
let audioCtx, analyser, audio;
let data;
let score = 0;
let lastEnergy = 0;
let lastBeat = 0;
let lastPos = { x: innerWidth/2, y: innerHeight/2 };

// ===== UI =====
function show(screen){
    [menu,upload,settings,credits,loading,game,endPanel]
        .forEach(s=>s.classList.add('hidden'));
    screen.classList.remove('hidden');
}

playBtn.onclick = ()=>show(upload);
settingsBtn.onclick = ()=>show(settings);
creditsBtn.onclick = ()=>show(credits);
backUpload.onclick = ()=>show(menu);
backSettings.onclick = ()=>show(menu);
backCredits.onclick = ()=>show(menu);
backMenu.onclick = ()=>show(menu);

// ===== Theme =====
themeSelect.onchange = ()=>{
    document.body.className = themeSelect.value;
    localStorage.setItem('theme', themeSelect.value);
};

document.body.className = localStorage.getItem('theme') || 'light';

// ===== File Handling =====
fileBtn.onclick = ()=>fileInput.click();

fileInput.onchange = async ()=>{
    const file = fileInput.files[0];
    fileInput.value = '';

    if(!file) return;

    if(!file.name.toLowerCase().endsWith('.mp3')){
        alert('⚠️ Only MP3 files are supported.');
        return;
    }

    show(loading);
    startGame(file);
};

// ===== Audio & Game =====
async function startGame(file){
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    data = new Uint8Array(analyser.frequencyBinCount);

    audio = new Audio(URL.createObjectURL(file));
    const src = audioCtx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(audioCtx.destination);

    score = 0;
    scoreEl.textContent = 'Score: 0';

    await audio.play();
    show(game);
    loop();
}

function loop(){
    if(audio.ended){
        finalScore.textContent = `Score: ${score}`;
        show(endPanel);
        return;
    }

    analyser.getByteFrequencyData(data);

    let energy = 0;
    for(let i=0;i<data.length;i++) energy += data[i];
    energy /= data.length;

    const delta = energy - lastEnergy;
    const now = performance.now();

    if(delta > 25 && now - lastBeat > 350){
        spawnCircle();
        lastBeat = now;
    }

    lastEnergy = energy;
    requestAnimationFrame(loop);
}

// ===== Circle Logic =====
function spawnCircle(){
    const c = document.createElement('div');
    c.className = 'beatCircle';

    let x,y;
    do {
        x = Math.random()*(innerWidth-100);
        y = Math.random()*(innerHeight-100);
    } while(Math.hypot(x-lastPos.x,y-lastPos.y) < 180);

    lastPos = {x,y};
    c.style.left = x+'px';
    c.style.top = y+'px';

    let hit=false;

    c.onclick = ()=>{
        if(hit) return;
        hit=true;
        score+=100;
        scoreEl.textContent = `Score: ${score}`;
        c.classList.add('hit');
        setTimeout(()=>c.remove(),200);
    };

    game.appendChild(c);
    setTimeout(()=>{ if(!hit) c.remove(); },800);
}
