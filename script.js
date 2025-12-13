const screens = document.querySelectorAll('.screen');
const game = document.getElementById('game');
const scoreEl = document.getElementById('score');
const fileInput = document.getElementById('fileInput');
const themeSelect = document.getElementById('theme');

let audioCtx, analyser, audio, data;
let score = 0;
let lastSpawn = 0;

/* ---------- UI ---------- */

function show(id){
    screens.forEach(s => s.classList.add('hidden'));
    if(id) document.getElementById(id).classList.remove('hidden');
}

playBtn.onclick = () => show('upload');
settingsBtn.onclick = () => show('settings');
backUpload.onclick = () => show('menu');
backSettings.onclick = () => show('menu');
chooseBtn.onclick = () => fileInput.click();

themeSelect.onchange = () => {
    document.body.className = themeSelect.value;
};

/* ---------- FILE HANDLING ---------- */

fileInput.onchange = () => {
    const file = fileInput.files[0];
    if(!file) return;

    if(!file.name.toLowerCase().endsWith('.mp3')){
        alert('⚠️ This file is not an MP3.');
        fileInput.value = '';
        return;
    }

    show('loading');
    startGame(file);
};

/* ---------- AUDIO ---------- */

async function startGame(file){
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    data = new Uint8Array(analyser.frequencyBinCount);

    audio = new Audio(URL.createObjectURL(file));
    const src = audioCtx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(audioCtx.destination);

    score = 0;
    scoreEl.textContent = 'Score: 0';

    await audio.play();
    show(null);
    update();
}

/* ---------- GAME LOOP ---------- */

function update(){
    if(audio.ended) return;

    analyser.getByteFrequencyData(data);
    let energy = data.reduce((a,b)=>a+b) / data.length;
    let now = performance.now();

    if(energy > 120 && now - lastSpawn > 400){
        spawnNote();
        lastSpawn = now;
    }

    requestAnimationFrame(update);
}

/* ---------- NOTE SPAWN ---------- */

function spawnNote(){
    const note = document.createElement('div');
    note.className = 'note';

    const x = Math.random() * (window.innerWidth - 80);
    const y = Math.random() * (window.innerHeight - 80);

    note.style.left = x + 'px';
    note.style.top = y + 'px';

    note.onclick = () => {
        score += 100;
        scoreEl.textContent = 'Score: ' + score;
        note.remove();
    };

    game.appendChild(note);
    setTimeout(() => note.remove(), 1000);
}
