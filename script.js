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

// Position for smooth follow
let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

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
    sensitivity = parseFloat(sens.value);
}

// Show a screen and hide others
function showScreen(screen) {
    menu.classList.add('hidden');
    settings.classList.add('hidden');
    credits.classList.add('hidden');
    game.classList.add('hidden');
    screen.classList.remove('hidden');
}

// Button click handlers
document.getElementById('playBtn').onclick = () => {
    pos.x = window.innerWidth / 2;
    pos.y = window.innerHeight / 2;
    showScreen(game);
};
document.getElementById('settingsBtn').onclick = () => showScreen(settings);
document.getElementById('creditsBtn').onclick = () => showScreen(credits);
document.getElementById('backSettings').onclick = () => { saveSettings(); showScreen(menu); };
document.getElementById('backCredits').onclick = () => showScreen(menu);
quitBtn.onclick = () => showScreen(menu);

// Mouse movement for target (smooth follow)
document.addEventListener('mousemove', e => {
    if (game.classList.contains('hidden')) return;

    let x = e.clientX - 20; // center the target
    let y = e.clientY - 20;

    // Smooth follow based on sensitivity
    pos.x += (x - pos.x) * sensitivity;
    pos.y += (y - pos.y) * sensitivity;

    target.style.left = pos.x + 'px';
    target.style.top = pos.y + 'px';
});

// Save settings when inputs change
sens.oninput = saveSettings;
theme.oninput = saveSettings;

// Initialize
loadSettings();
