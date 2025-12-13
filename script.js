const menu = document.getElementById('menu');
const upload = document.getElementById('upload');
const game = document.getElementById('game');
const fileInput = document.getElementById('fileInput');
const scoreEl = document.getElementById('score');

let audio, audioCtx, analyser, data;
let score = 0;
let lastSpawn = 0;

/* UI */
function show(screen) {
    menu.classList.add('hidden');
    upload.classList.add('hidden');
    game.classList.add('hidden');
    if (screen) screen.classList.remove('hidden');
}

playBtn.onclick = () => show(upload);
backBtn.onclick = () => show(menu);
chooseFile.onclick = () => fileInput.click();

/* File Handling */
fileInput.onchange = () => {
    const file = fileInput.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.mp3')) {
        alert('⚠️ Please upload an MP3 file');
        fileInput.value = '';
        return;
    }

    startGame(file);
};

/* Start Game */
async function startGame(file) {
    score = 0;
    scoreEl.textContent = 'Score: 0';

    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    data = new Uint8Array(analyser.frequencyBinCount);

    audio = new Audio(URL.createObjectURL(file));
    const src = audioCtx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(audioCtx.destination);

    await audio.play();
    show(game);
    loop();
}

/* Game Loop */
function loop() {
    if (audio.ended) return;

    analyser.getByteFrequencyData(data);
    const energy = data.reduce((a, b) => a + b) / data.length;
    const now = performance.now();

    if (energy > 120 && now - lastSpawn > 400) {
        spawnNote();
        lastSpawn = now;
    }

    requestAnimationFrame(loop);
}

/* Spawn Notes */
function spawnNote() {
    const note = document.createElement('div');
    note.className = 'note';

    note.style.left = Math.random() * (window.innerWidth - 80) + 'px';
    note.style.top = Math.random() * (window.innerHeight - 80) + 'px';

    note.onclick = () => {
        score += 100;
        scoreEl.textContent = 'Score: ' + score;
        note.remove();
    };

    game.appendChild(note);
    setTimeout(() => note.remove(), 1200);
}
