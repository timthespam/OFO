// Elements
const menu = document.getElementById('menu');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const game = document.getElementById('game');
const sens = document.getElementById('sens');
const theme = document.getElementById('theme');
const target = document.getElementById('target');
const quitBtn = document.getElementById('quit');

// Settings
let sensitivity = 1;

// Smooth mouse follow
let pos = {x: window.innerWidth/2, y: window.innerHeight/2};

// Load saved settings
function loadSettings() {
    sensitivity = localStorage.getItem('sens') ? parseFloat(localStorage.getItem('sens')) : 1;
    sens.value = sensitivity;
    let t = localStorage.getItem('theme') || 'light';
    theme.value = t;
    document.body.className = t;
}

// Save settings
function saveSettings() {
    localStorage.setItem('sens', sens.value);
    localStorage.setItem('theme', theme.value);
    document.body.className = theme.value;
}

// Show and hide screens
function showScreen(screen) {
    menu.classList.add('hidden');
    settings.classList.add('hidden');
    credits.classList.add('hidden');
    game.classList.add('hidden');
    screen.classList.remove('hidden');
}

// Buttons
document.getElementById('playBtn').onclick = () => showScreen(game);
document.getElementById('settingsBtn').onclick = () => showScreen(settings);
document.getElementById('creditsBtn').onclick = () => showScreen(credits);
document.getElementById('backSettings').onclick = () => { saveSettings(); showScreen(menu); };
document.getElementById('backCredits').onclick = () => showScreen(menu);
quitBtn.onclick = () => showScreen(menu);

// Mouse movement for target
document.addEventListener('mousemove', e => {
    if(game.classList.contains('hidden')) return;
    let dx = e.clientX - pos.x;
    let dy = e.clientY - pos.y;
    pos.x += dx * sensitivity;
    pos.y += dy * sensitivity;
    target.style.left = (pos.x - 20) + 'px';
    target.style.top = (pos.y - 20) + 'px';
});

// Save settings when changed
sens.oninput = saveSettings;
theme.oninput = saveSettings;

// Load settings on start
loadSettings();
