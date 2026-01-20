const menu = document.getElementById("menu");
const upload = document.getElementById("upload");
const settings = document.getElementById("settings");
const game = document.getElementById("game");

const playBtn = document.getElementById("playBtn");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");

const cursor = document.getElementById("cursor");
const scoreEl = document.getElementById("score");

const sensInput = document.getElementById("sens");
const themeSelect = document.getElementById("theme");

let audioCtx, analyser, data, audio;
let score = 0;
let sens = 1;
let running = false;

let pos = { x: innerWidth / 2, y: innerHeight / 2 };

function show(el) {
  [menu, upload, settings, game].forEach(e => e.classList.add("hidden"));
  el.classList.remove("hidden");
}

playBtn.onclick = () => show(upload);
document.getElementById("settingsBtn").onclick = () => show(settings);

uploadBtn.onclick = () => fileInput.click();

fileInput.onchange = () => {
  const file = fileInput.files[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".mp3")) {
    alert("Only MP3 files can be played.");
    return;
  }

  startGame(file);
};

sensInput.oninput = () => {
  sens = parseFloat(sensInput.value);
  localStorage.setItem("sens", sens);
};

themeSelect.onchange = () => {
  document.body.classList.remove("dark", "light");
  document.body.classList.add(themeSelect.value);
  localStorage.setItem("theme", themeSelect.value);
};

document.addEventListener("mousemove", e => {
  if (!running) return;
  pos.x += (e.clientX - pos.x) * sens;
  pos.y += (e.clientY - pos.y) * sens;
  cursor.style.left = pos.x - 20 + "px";
  cursor.style.top = pos.y - 20 + "px";
});

function startGame(file) {
  show(game);
  score = 0;
  scoreEl.textContent = "Score: 0";
  running = true;

  audioCtx = new AudioContext();
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 256;
  data = new Uint8Array(analyser.frequencyBinCount);

  audio = new Audio(URL.createObjectURL(file));
  const src = audioCtx.createMediaElementSource(audio);
  src.connect(analyser);
  analyser.connect(audioCtx.destination);

  audio.onended = () => running = false;

  audio.play().then(() => {
    audioCtx.resume();
    loop();
  }).catch(() => alert("Audio failed to play"));
}

let lastSpawn = 0;
function loop() {
  if (!running) return;

  analyser.getByteFrequencyData(data);
  const avg = data.reduce((a,b)=>a+b) / data.length;

  if (avg > 130 && Date.now() - lastSpawn > 300) {
    spawnCircle();
    lastSpawn = Date.now();
  }

  requestAnimationFrame(loop);
}

function spawnCircle() {
  const c = document.createElement("div");
  c.className = "circle";

  const size = 80;
  c.style.left = Math.random() * (innerWidth - size) + "px";
  c.style.top = Math.random() * (innerHeight - size) + "px";

  c.onclick = () => {
    score += 100;
    scoreEl.textContent = "Score: " + score;
    c.remove();
  };

  document.body.appendChild(c);
  setTimeout(() => c.remove(), 1200);
}

/* LOAD SETTINGS */
sens = parseFloat(localStorage.getItem("sens") || "1");
sensInput.value = sens;

const savedTheme = localStorage.getItem("theme") || "dark";
document.body.classList.add(savedTheme);
themeSelect.value = savedTheme;
