const screens = document.querySelectorAll('.screen');
const ui = document.getElementById('ui');
const game = document.getElementById('game');

const scoreEl = document.getElementById('score');
const finalScore = document.getElementById('finalScore');
const fileInput = document.getElementById('fileInput');
const themeSelect = document.getElementById('theme');

let audioCtx, analyser, audio;
let data;
let score = 0;
let lastSpawn = 0;
let lastPos = { x: innerWidth/2, y: innerHeight/2 };

function show(el){
    screens.forEach(s=>s.classList.add('hidden'));
    if(el) el.classList.remove('hidden');
}

// Buttons
playBtn.onclick = ()=>show(upload);
settingsBtn.onclick = ()=>show(settings);
creditsBtn.onclick = ()=>show(credits);
document.querySelectorAll('.back').forEach(b=>b.onclick=()=>show(menu));
menuBtn.onclick = ()=>show(menu);

fileBtn.onclick = ()=>fileInput.click();

themeSelect.onchange = ()=>{
    document.body.className = themeSelect.value;
};

fileInput.onchange = ()=>{
    const file = fileInput.files[0];
    if(!file) return;

    if(!file.name.toLowerCase().endsWith('.mp3')){
        alert('Only MP3 files are supported.');
        fileInput.value='';
        return;
    }

    show(loading);
    startGame(file);
};

async function startGame(file){
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    data = new Uint8Array(analyser.fftSize);

    audio = new Audio(URL.createObjectURL(file));
    const src = audioCtx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(audioCtx.destination);

    score = 0;
    scoreEl.textContent = 'Score: 0';

    await audio.play();
    show(null); // hide UI
    loop();
}

function loop(){
    if(audio.ended){
        finalScore.textContent = `Score: ${score}`;
        show(end);
        return;
    }

    analyser.getByteTimeDomainData(data);

    let energy = 0;
    for(let i=0;i<data.length;i++){
        energy += Math.abs(data[i]-128);
    }

    const now = performance.now();
    if(energy > 20 && now - lastSpawn > 350){
        spawnNote();
        lastSpawn = now;
    }

    requestAnimationFrame(loop);
}

function spawnNote(){
    const n = document.createElement('div');
    n.className = 'beat';

    let x,y;
    do {
        x = Math.random()*(innerWidth-100);
        y = Math.random()*(innerHeight-100);
    } while(Math.hypot(x-lastPos.x,y-lastPos.y) < 200);

    lastPos = {x,y};
    n.style.left = x+'px';
    n.style.top = y+'px';

    let hit=false;
    n.onclick = ()=>{
        if(hit) return;
        hit=true;
        score+=100;
        scoreEl.textContent = `Score: ${score}`;
        n.classList.add('hit');
        setTimeout(()=>n.remove(),200);
    };

    game.appendChild(n);
    setTimeout(()=>{ if(!hit) n.remove(); },900);
}
