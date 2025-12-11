// Elements
const menu = document.getElementById('menu');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const game = document.getElementById('game');
const sens = document.getElementById('sens');
const theme = document.getElementById('theme');
const hideCursor = document.getElementById('hideCursor');
const target = document.getElementById('target');
const quitBtn = document.getElementById('quit');

// Settings
let sensitivity = 1;
let hideRealCursor = false;

// Position for smooth follow
let pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

// Load saved settings
function loadSettings() {
    sensitivity = localStorage.getItem('sens') ? parseFloat(localStorage.getItem('sens')) : 1;
    sens.value = sensitivity;

    let t = localStorage.getItem('theme') || 'light';
    theme.value = t;
    document.body.className = t;

    hideRealCursor = localStorage.getItem('hideCursor') === 'true';
    hideCursor.checked = hideRealCursor;

    if(hideRealCursor && !game.classList.contains('hidden')) document.body.classList.add('hide-cursor');
}

// Save settings
function saveSettings() {
    localStorage.setItem('sens', sens.value);
    localStorage.setItem('theme', theme.value);
    localStorage.setItem('hideCursor', hideCursor.checked);

    document.body.className = theme.value;
    sensitivity = parseFloat(sens.value);
    hideRealCursor = hideCursor.checked;

    if(hideRealCursor && !game.classList.contains('hidden')) {
        document.body.classList.add('hide-cursor');
    } else {
        document.body.classList.remove('hide-cursor');
    }
}

// Show a screen and hide others
function showScreen(screen) {
    menu.classList.add('hidden');
    settings.classList.add('hidden');
    credits.classList.add('hidden');
    game.classList.add('hidden');
    screen.classList.remove('hidden');

    // Update cursor when switching screens
    if(hideRealCursor && screen === game) document.body.classList.add('hide-cursor');
    else document.body.classList.remove('hide-cursor');
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

    let x = e.clientX - 20; // center target
    let y = e.clientY - 20;

    // Clamp to viewport
    x = Math.max(0, Math.min(window.innerWidth - 40, x));
    y = Math.max(0, Math.min(window.innerHeight - 40, y));

    // Smooth follow
    pos.x += (x - pos.x) * sensitivity;
    pos.y += (y - pos.y) * sensitivity;

    target.style.left = pos.x + 'px';
    target.style.top = pos.y + 'px';
});

// Save settings when inputs change
sens.oninput = saveSettings;
theme.oninput = saveSettings;
hideCursor.oninput = saveSettings;

// Initialize
loadSettings();
