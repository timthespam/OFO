// Elements
const menu = document.getElementById('menu');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const game = document.getElementById('game');
const sens = document.getElementById('sens');
const theme = document.getElementById('theme');
const target = document.getElementById('target');

// Settings
let sensitivity = 1;

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
document.getElementById('quit').onclick = () => showScreen(menu);

// Move target with mouse
document.addEventListener('mousemove', e => {
    if(game.classList.contains('hidden')) return;
    let x = e.clientX - 20;
    let y = e.clientY - 20;
    target.style.left = (x * sensitivity) + 'px';
    target.style.top = (y * sensitivity) + 'px';
});

// Save settings when changed
sens.oninput = saveSettings;
theme.oninput = saveSettings;

// Load on start
loadSettings();
