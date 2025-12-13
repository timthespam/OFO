// ================= ELEMENTS =================
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

// ================= STATE =================
let sensitivity = 1;
let hideCursor = false;
let pos = { x: innerWidth / 2, y: innerHeight / 2 };
let score = 0;

// Audio
let audioCtx, analyser, dataArray, audioElement, source;

// Beat logic
let lastBeatTime = 0;
let energyHistory = [];

// ================= SETTINGS =================
function loadSettings() {
    sens.value = localStorage.getItem('sens') || 1;
    theme.value = localStorage.getItem('theme') || 'light';
    hideCursorCheckbox.checked = localStorage.getItem('hideCursor') === 'true';

    sensitivity = parseFloat(sens.value);
    hideCursor = hideCursorCheckbox.checked;
    document.body.className = theme.value;
    updateCursor();
}

function saveSettings() {
    localStorage.setItem('sens', sens.value);
    localStorage.setItem('theme', theme.value);
    localStorage.setItem('hideCursor', hideCursorCheckbox.checked);
    loadSettings();
}

function updateCursor() {
    document.body.classList.toggle('hide-cursor', !game.classList.contains('hidden') && hideCursor);
}

// ================= UI =================
function showScreen(screen) {
    [menu, upload, settings, credits, game, loading, endPanel]
        .forEach(p => p.classList.add('hidden'));
    screen.classList.remove('hidden');
    updateCursor();
}

// Buttons
document.getElementById('playBtn').onclick = () => showScreen(upload);
chooseSongBtn.onclick = () => fileInput.click();
backUpload.onclick = () => showScreen(menu);
document.getElementById('settingsBtn').onclick = () => showScreen(settings);
document.getElementById('creditsBtn').onclick = () => showScreen(credits);
document.getElementById('backSettings').onclick = () => { saveSettings(); showScreen(menu); };
document.getElementById('backCredits').onclick = () => showScreen(menu);
quitBtn.onclick = () => { audioElement?.pause(); showScreen(menu); };
playAgainBtn.onclick = () => showScreen(upload);
backMenuBtn.onclick = () => showScreen(menu);

// ================= MOUSE =================
document.addEventListener('mousemove', e => {
    if (game.classList.contains('hidden')) return;
    pos.x += (e.clientX - 20 - pos.x) * sensitivity * 0.4;
    pos.y += (e.clientY - 20 - pos.y) * sensitivity * 0.4;
    target.style.left = pos.x + 'px';
    target.style.top = pos.y + 'px';
});

// ================= FILE LOAD =================
fileInput.onchange = async e => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith('.mp3')) {
        alert('Please select a valid MP3 file.');
        return;
    }

    showScreen(loading);
    try {
        await startSong(file);
    } catch (err) {
        console.error(err);
        alert('Failed to load audio.');
        showScreen(upload);
    }
};

async function startSong(file) {
    audioCtx ??= new AudioContext();

    audioElement?.remove();
    audioElement = new Audio(URL.createObjectURL(file));
    await audioElement.play();

    source = audioCtx.createMediaElementSource(audioElement);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    score = 0;
    scoreEl.textContent = 'Score: 0';
    energyHistory = [];

    showScreen(game);
    detectBeats();
}

// ================= BEAT DETECTION =================
function detectBeats() {
    if (!analyser) return;

    analyser.getByteFrequencyData(dataArray);

    let energy = 0;
    for (let i = 0; i < dataArray.length * 0.15; i++) {
        energy += dataArray[i];
    }

    energyHistory.push(energy);
    if (energyHistory.length > 20) energyHistory.shift();

    const avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / energyHistory.length;
    const now = performance.now();

    if (energy > avgEnergy * 1.4 && now - lastBeatTime > 300) {
        lastBeatTime = now;
        spawnCircle();
    }

    if (audioElement.ended) {
        finalScore.textContent = `Score: ${score}`;
        showScreen(endPanel);
        return;
    }

    requestAnimationFrame(detectBeats);
}

// ================= GAMEPLAY =================
function spawnCircle() {
    const circle = document.createElement('div');
    circle.className = 'beatCircle';

    const size = 80;
    let x, y;
    do {
        x = Math.random() * (innerWidth - size);
        y = Math.random() * (innerHeight - size);
    } while (Math.hypot(x - pos.x, y - pos.y) < 150);

    circle.style.left = x + 'px';
    circle.style.top = y + 'px';

    document.body.appendChild(circle);

    let hit = false;

    circle.onclick = () => {
        if (hit) return;
        hit = true;
        score += 100;
        scoreEl.textContent = `Score: ${score}`;
        circle.style.transform = 'scale(1.4)';
        circle.style.opacity = '0';
        setTimeout(() => circle.remove(), 150);
    };

    setTimeout(() => {
        if (!hit) {
            circle.style.opacity = '0';
            setTimeout(() => circle.remove(), 200);
        }
    }, 600);
}

// ================= INIT =================
sens.oninput = saveSettings;
theme.oninput = saveSettings;
hideCursorCheckbox.oninput = saveSettings;
loadSettings();
