const screens = document.querySelectorAll('.screen');
const game = document.getElementById('game');
const scoreEl = document.getElementById('score');

const fileInput = document.getElementById('fileInput');
let audioCtx, analyser, audio, data;
let score = 0;
let lastSpawn = 0;

function show(id){
    screens.forEach(s=>s.classList.add('hidden'));
    if(id) document.getElementById(id).classList.remove('hidden');
}

play.onclick = ()=>show('upload');
back.onclick = ()=>show('menu');
back2.onclick = ()=>show('menu');
settingsBtn.onclick = ()=>show('settings');
fileBtn.onclick = ()=>fileInput.click();

fileInput.onchange = ()=>{
    const file = fileInput.files[0];
    if(!file) return;

    if(!file.name.toLowerCase().endsWith('.mp3')){
        alert('Not an MP3 file');
        fileInput.value='';
        return;
    }

    show('loading');
    start(file);
};

async function start(file){
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    data = new Uint8Array(analyser.frequencyBinCount);

    audio = new Audio(URL.createObjectURL(file));
    const src = audioCtx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(audioCtx.destination);

    score = 0;
    scoreEl.textContent = 'Score: 0';

    await audio.play();
    show(null);
    loop();
}

function loop(){
    if(audio.ended) return;

    analyser.getByteFrequencyData(data);

    let energy = data.reduce((a,b)=>a+b)/data.length;
    const now = performance.now();

    if(energy > 120 && now-lastSpawn > 400){
        spawn();
        lastSpawn = now;
    }

    requestAnimationFrame(loop);
}

function spawn(){
    const n = document.createElement('div');
    n.className = 'note';

    const x = Math.random()*(innerWidth-80);
    const y = Math.random()*(innerHeight-80);

    n.style.left = x+'px';
    n.style.top = y+'px';

    n.onclick = ()=>{
        score+=100;
        scoreEl.textContent = 'Score: '+score;
        n.remove();
    };

    game.appendChild(n);
    setTimeout(()=>n.remove(),1000);
}
