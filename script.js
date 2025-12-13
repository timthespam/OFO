const menu = document.getElementById('menu');
const upload = document.getElementById('upload');
const loading = document.getElementById('loading');
const game = document.getElementById('game');
const end = document.getElementById('end');
const scoreEl = document.getElementById('score');
const finalScore = document.getElementById('finalScore');

const playBtn = document.getElementById('playBtn');
const backBtn = document.getElementById('backBtn');
const fileBtn = document.getElementById('fileBtn');
const fileInput = document.getElementById('fileInput');

let audioCtx, analyser, audio, data;
let score = 0;
let lastEnergy = 0;
let lastSpawn = 0;
let lastPos = { x: innerWidth/2, y: innerHeight/2 };

// UI
function show(el){
    [menu,upload,loading,game,end].forEach(e=>e.classList.add('hidden'));
    el.classList.remove('hidden');
}

playBtn.onclick = ()=>show(upload);
backBtn.onclick = ()=>show(menu);
fileBtn.onclick = ()=>fileInput.click();

// File handling
fileInput.onchange = async ()=>{
    const file = fileInput.files[0];
    if(!file) return;

    if(!file.name.toLowerCase().endsWith('.mp3')){
        alert('⚠️ Only MP3 files supported');
        fileInput.value='';
        return;
    }

    show(loading);
    await startAudio(file);
};

async function startAudio(file){
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    data = new Uint8Array(analyser.frequencyBinCount);

    audio = new Audio(URL.createObjectURL(file));
    const src = audioCtx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(audioCtx.destination);

    await audio.play();
    score = 0;
    scoreEl.textContent = 'Score: 0';
    show(game);
    loop();
}

// Beat detection loop
function loop(){
    if(audio.ended){
        finalScore.textContent = `Score: ${score}`;
        show(end);
        return;
    }

    analyser.getByteFrequencyData(data);

    let energy = 0;
    for(let i=0;i<data.length;i++) energy += data[i];
    energy /= data.length;

    const delta = energy - lastEnergy;
    const now = performance.now();

    if(delta > 25 && now-lastSpawn > 350){
        spawnCircle();
        lastSpawn = now;
    }

    lastEnergy = energy;
    requestAnimationFrame(loop);
}

// osu-style circle spawning
function spawnCircle(){
    const c = document.createElement('div');
    c.className = 'hitCircle';

    let x,y;
    do {
        x = Math.random()*(innerWidth-100);
        y = Math.random()*(innerHeight-100);
    } while(Math.hypot(x-lastPos.x,y-lastPos.y) < 180);

    lastPos = {x,y};

    c.style.left = x+'px';
    c.style.top = y+'px';

    game.appendChild(c);

    let hit=false;

    c.onclick = ()=>{
        if(hit) return;
        hit=true;
        score+=100;
        scoreEl.textContent = `Score: ${score}`;
        c.classList.add('hit');
        setTimeout(()=>c.remove(),200);
    };

    setTimeout(()=>{
        if(!hit) c.remove();
    },700);
}
