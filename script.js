const main = document.getElementById('mainMenu');
const settings = document.getElementById('settings');
const credits = document.getElementById('credits');
const game = document.getElementById('game');
const sens = document.getElementById('sens');
const theme = document.getElementById('theme');
const target = document.getElementById('target');

let sensitivity = 1;

// Load saved settings
function load() {
    sensitivity = localStorage.sens ? parseFloat(localStorage.sens) : 1;
    sens.value = sensitivity;
    let t = localStorage.theme || "light";
    theme.value = t;
    document.body.className = t;
}

// Save settings
function save() {
    localStorage.sens = sens.value;
    localStorage.theme = theme.value;
    document.body.className = theme.value;
}

// Button events
document.getElementById('playBtn').onclick = () => {
    main.classList.add('hidden');
    game.classList.remove('hidden');
};

document.getElementById('settingsBtn').onclick = () => {
    main.classList.add('hidden');
    settings.classList.remove('hidden');
};

document.getElementById('creditsBtn').onclick = () => {
    main.classList.add('hidden');
    credits.classList.remove('hidden');
};

document.getElementById('backSettings').onclick = () => {
    save();
    settings.classList.add('hidden');
    main.classList.remove('hidden');
};

document.getElementById('backCredits').onclick = () => {
    credits.classList.add('hidden');
    main.classList.remove('hidden');
};

document.getElementById('quit').onclick = () => {
    game.classList.add('hidden');
    main.classList.remove('hidden');
};

// Move target with mouse
document.addEventListener('mousemove', e => {
    if(game.classList.contains('hidden')) return;
    let x = e.clientX - 20;
    let y = e.clientY - 20;
    target.style.left = x + 'px';
    target.style.top = y + 'px';
});

// Save settings when changed
sens.oninput = save;
theme.oninput = save;

load();
