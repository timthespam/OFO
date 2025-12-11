
let menu=document.getElementById("menu");
let settings=document.getElementById("settings");
let credits=document.getElementById("credits");
let playBtn=document.getElementById("playBtn");
let settingsBtn=document.getElementById("settingsBtn");
let creditsBtn=document.getElementById("creditsBtn");
let backSettings=document.getElementById("backSettings");
let backCredits=document.getElementById("backCredits");

let gameArea=document.getElementById("gameArea");
let canvas=document.getElementById("game");
let ctx=canvas.getContext("2d");

let sensInput=document.getElementById("sens");
let themeInput=document.getElementById("theme");

let sensitivity=1;
let aimX=0, aimY=0;

function resize(){
    canvas.width=window.innerWidth*0.7;
    canvas.height=window.innerHeight*0.8;
}
resize();
window.onresize=resize;

function load(){
    sensitivity=parseFloat(localStorage.getItem("sens")||"1");
    sensInput.value=sensitivity;

    let theme=localStorage.getItem("theme")||"light";
    document.body.className=theme;
    themeInput.value=theme;
}
load();

sensInput.oninput=()=>{ sensitivity=parseFloat(sensInput.value); localStorage.setItem("sens",sensitivity); }
themeInput.oninput=()=>{ document.body.className=themeInput.value; localStorage.setItem("theme",themeInput.value); }

function show(screen){
    menu.classList.add("hidden");
    settings.classList.add("hidden");
    credits.classList.add("hidden");
    screen.classList.remove("hidden");
}

playBtn.onclick=()=>{
    show(menu); 
    menu.classList.add("hidden");
    gameArea.classList.remove("hidden");
    aimX=canvas.width/2; aimY=canvas.height/2;
    canvas.requestPointerLock();
    loop();
};

settingsBtn.onclick=()=>show(settings);
creditsBtn.onclick=()=>show(credits);

backSettings.onclick=()=>show(menu);
backCredits.onclick=()=>show(menu);

document.addEventListener("mousemove",e=>{
    if(document.pointerLockElement===canvas){
        aimX+=e.movementX*sensitivity;
        aimY+=e.movementY*sensitivity;
        aimX=Math.max(0,Math.min(canvas.width,aimX));
        aimY=Math.max(0,Math.min(canvas.height,aimY));
    }
});

function loop(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.beginPath();
    ctx.arc(aimX,aimY,10,0,Math.PI*2);
    ctx.fillStyle="red";
    ctx.fill();
    requestAnimationFrame(loop);
}
