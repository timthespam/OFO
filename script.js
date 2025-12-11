// Elements
const menu = document.getElementById('menu');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const game = document.getElementById('game');
const sens = document.getElementById('sens');
const theme = document.getElementById('theme');
const hideCursorCheckbox = document.getElementById('hideCursor');
const target = document.getElementById('target');
const quitBtn = document.getElementById('quit');

// Settings
let sensitivity = 1;
let hideCursor = false;

// Target position
let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

// Load saved settings
function loadSettings() {
    sensitivity = parseFloat(localStorage.getItem('sens') || '1');
    sens.value = sensitivity;

    let t = localStorage.getItem('theme') || 'light';
    theme.value = t;
    document.body.className = t;

    hideCursor = localStorage.getItem('hideCursor') === 'true';
    hideCursorCheckbox.checked = hideCursor;

    updateCursorVisibility();
}

// Save settings
function saveSettings() {
    localStorage.setItem('sens', sens.value);
    localStorage.setItem('theme', theme.value);
    localStorage.setItem('hideCursor', hideCursorCheckbox.checked);

    sensitivity = parseFloat(sens.value);
    hideCursor = hideCursorCheckbox.checked;

    document.body.className = theme.value;
    updateCursorVisibility();
}

// Update cursor visibility in-game
function updateCursorVisibility() {
    if (!game.classList.contains('hidden') && hideCursor) document.body.classList.add('hide-cursor');
    else document.body.classList.remove('hide-cursor');
}

// Show only one screen
function showScreen(screen) {
    menu.classList.add('hidden');
    settings.classList.add('hidden');
    credits.classList.add('hidden');
    game.classList.add('hidden');
    screen.classList.remove('hidden');
    updateCursorVisibility();
}

// Button handlers
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

// Mouse follow: fixed sensitivity
document.addEventListener('mousemove', e => {
    if (game.classList.contains('hidden')) return;

    // Desired position is mouse position centered
    let targetX = e.clientX - 20;
    let targetY = e.clientY - 20;

    // Move target toward cursor by fraction = sensitivity / maxSens
    // Clamp sensitivity so 1 = normal, >1 = faster but never overshoot
    const maxMove = Math.min(Math.abs(targetX - pos.x), Math.abs(targetY - pos.y)) * (sensitivity - 1);
    
    pos.x += (targetX - pos.x) * (sensitivity / 2);
    pos.y += (targetY - pos.y) * (sensitivity / 2);

    // Clamp inside viewport
    pos.x = Math.max(0, Math.min(window.innerWidth - 40, pos.x));
    pos.y = Math.max(0, Math.min(window.innerHeight - 40, pos.y));

    target.style.left = pos.x + 'px';
    target.style.top = pos.y + 'px';
});

// Save when inputs change
sens.oninput = saveSettings;
theme.oninput = saveSettings;
hideCursorCheckbox.oninput = saveSettings;

// Initialize
loadSettings();
