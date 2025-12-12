let sensitivity = 1;
let score = 0;
let moving = false;

function loadData() {
    let s = localStorage.getItem("sens");
    let t = localStorage.getItem("theme");
    if (s) sensitivity = parseFloat(s);
    if (t === "light") document.body.classList.add("light-theme");
    sens.value = sensitivity;
    theme.value = t || "dark";
}

function saveData() {
    localStorage.setItem("sens", sensitivity);
    localStorage.setItem("theme", theme.value);
}

function openSettings() {
    menu.style.display = "none";
    settings.style.display = "flex";
}

function closeSettings() {
    settings.style.display = "none";
    menu.style.display = "flex";
}

function openCredits() {
    menu.style.display = "none";
    credits.style.display = "flex";
}

function closeCredits() {
    credits.style.display = "none";
    menu.style.display = "flex";
}

function openHow() {
    menu.style.display = "none";
    how.style.display = "flex";
}

function closeHow() {
    how.style.display = "none";
    menu.style.display = "flex";
}

theme.onchange = () => {
    if (theme.value === "light") document.body.classList.add("light-theme");
    else document.body.classList.remove("light-theme");
    saveData();
};

sens.oninput = () => {
    sensitivity = parseFloat(sens.value);
    saveData();
};

function openPlay() {
    score = 0;
    scoreDisplay.innerHTML = "Score: 0";
    menu.style.display = "none";
    game.style.display = "block";
    moveTarget();
}

function exitGame() {
    game.style.display = "none";
    menu.style.display = "flex";
}

target.onclick = () => {
    score++;
    scoreDisplay.innerHTML = "Score: " + score;
    moveTarget();
};

function moveTarget() {
    let w = window.innerWidth;
    let h = window.innerHeight;
    let x = Math.random() * w;
    let y = Math.random() * h;
    target.style.left = x + "px";
    target.style.top = y + "px";
}

window.onload = loadData;
