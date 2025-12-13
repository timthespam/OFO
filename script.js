const screens = ['menu','upload','settings','credits','loading','game','endPanel']
    .reduce((o,id)=> (o[id]=document.getElementById(id),o),{});

const scoreEl = document.getElementById('score');
const target = document.getElementById('target');
const fileInput = document.getElementById('mp3input');

let audioCtx, analyser, audio, data;
let score = 0;
let sensitivity = 1;
let pos = { x: innerWidth/2, y: innerHeight/2 };
let lastBeat = 0;

// -------- UI --------
function show(name){
    Object.values(screens).forEach(s=>s.classList.add('hidden'));
    screens[name].classList.remove('hidden');
}

document.getElementById('playBtn').onclick = ()=>show('upload');
document.getElementById('settingsBtn').onclick = ()=>show('settings');
document.getElementById('creditsBtn').onclick = ()=>show('credits');
document.getElementById('backUpload').onclick = ()=>show('menu');
document.getElementById('backCredits').onclick = ()=>show('menu');
document.getElementById('backSettings').onclick = ()=>show('menu');
document.getElementById('backMenu').onclick = ()=>show('menu');
document.getElementById('playAgain').onclick = ()=>show('upload');
document.getElementById('chooseSongBtn').onclick = ()=>fileInput.click();

document.getElementById('quit').onclick = ()=>{
    audio?.pause();
    show('menu');
};

// -------- Mouse --------
document.addEventListener('mousemove', e=>{
    if(screens.game.classList.contains('hidden')) return;
    pos.x += (e.clientX-20-pos.x)*0.4*sensitivity;
    pos.y += (e.clientY-20-pos.y)*0.4*sensitivity;
    target.style.left = pos.x+'px';
    target.style.top = pos.y+'px';
});

// -------- File handling --------
fileInput.onchange = ()=>{
    const file = fileInput.files[0];
    if(!file) return;

    if(!file.name.toLowerCase().endsWith('.mp3')){
        alert('⚠️ Please select an MP3 file.');
        fileInput.value = '';
        return;
    }

    startGame(file);
};

async function startGame(file){
    show('loading');

    audioCtx ??= new AudioContext();
    audio = new Audio(URL.createObjectURL(file));
    await audio.play();

    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    data = new Uint8Array(analyser.frequencyBinCount);

    const src = audioCtx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(audioCtx.destination);

    score = 0;
    scoreEl.textContent = 'Score: 0';
    show('game');
    loop();
}

// -------- Beat detection --------
function loop(){
    if(!audio || audio.ended){
        document.getElementById('finalScore').textContent = `Score: ${score}`;
        show('endPanel');
        return;
    }

    analyser.getByteFrequencyData(data);

    let bass = 0;
    for(let i=0;i<data.length*0.15;i++) bass += data[i];
    bass /= data.length*0.15;

    const now = performance.now();
    if(bass > 160 && now-lastBeat > 350){
        lastBeat = now;
        spawnCircle();
    }

    requestAnimationFrame(loop);
}

// -------- Circles --------
function spawnCircle(){
    const c = document.createElement('div');
    c.className = 'beatCircle';

    let x,y;
    do {
        x = Math.random()*(innerWidth-80);
        y = Math.random()*(innerHeight-80);
    } while(Math.hypot(x-pos.x,y-pos.y)<120);

    c.style.left = x+'px';
    c.style.top = y+'px';
    document.body.appendChild(c);

    let hit=false;
    c.onclick=()=>{
        if(hit) return;
        hit=true;
        score+=100;
        scoreEl.textContent = `Score: ${score}`;
        c.remove();
    };

    setTimeout(()=>{ if(!hit) c.remove(); },800);
}
