const SAVE_KEY='fractured_clicker_v1';
let state={cookies:0,cps:0,items:[]};
const CATALOG=[{id:'cursor',name:'Cursor',baseCost:15,cps:0.1,desc:'Auto-clicks slowly.'},{id:'grandma',name:'Grandma',baseCost:100,cps:1,desc:'Makes cookies.'},{id:'farm',name:'Farm',baseCost:1100,cps:8,desc:'Produces more cookies.'},{id:'mine',name:'Mine',baseCost:12000,cps:47,desc:'Industrial production.'}];
const cookieBtn=document.getElementById('cookie');
const cookieCount=document.getElementById('cookie-count');
const cpsText=document.getElementById('cps');
const itemsDiv=document.getElementById('items');

function ensureState(){if(!state.items||state.items.length===0){state.items=CATALOG.map(i=>({id:i.id,bought:0}));}}
function save(){localStorage.setItem(SAVE_KEY,JSON.stringify(state));}
function load(){const raw=localStorage.getItem(SAVE_KEY);if(raw){try{state=JSON.parse(raw);}catch(e){}}}
function fmt(n){if(n>=1e9)return(n/1e9).toFixed(2)+'b';if(n>=1e6)return(n/1e6).toFixed(2)+'m';if(n>=1e3)return(n/1e3).toFixed(2)+'k';return Math.round(n*100)/100;}
function recalcCPS(){let cps=0;for(const it of state.items){const info=CATALOG.find(c=>c.id===it.id);cps+=it.bought*info.cps;}state.cps=cps;}
function buildShop(){itemsDiv.innerHTML='';for(const info of CATALOG){const owned=state.items.find(i=>i.id===info.id).bought;const cost=Math.floor(info.baseCost*Math.pow(1.15,owned));const el=document.createElement('div');el.className='item';el.innerHTML=`<div><div><strong>${info.name}</strong> <span class="desc">(${owned})</span></div><div class="desc">${info.desc}</div></div><div><div style="text-align:right">${fmt(cost)}</div><button data-id="${info.id}" data-cost="${cost}">Buy</button></div>`;itemsDiv.appendChild(el);}}
function buy(id){const info=CATALOG.find(c=>c.id===id);const it=state.items.find(i=>i.id===id);const cost=Math.floor(info.baseCost*Math.pow(1.15,it.bought));if(state.cookies>=cost){state.cookies-=cost;it.bought++;recalcCPS();updateUI();save();}}
cookieBtn.addEventListener('click',()=>{state.cookies++;updateUI();save();});
itemsDiv.addEventListener('click',e=>{if(e.target.tagName==='BUTTON'){buy(e.target.dataset.id);}});
setInterval(()=>{state.cookies+=state.cps/10;updateUI();},100);
setInterval(()=>save(),5000);
function updateUI(){cookieCount.textContent=fmt(state.cookies);cpsText.textContent=`${fmt(state.cps)} cps`;buildShop();}
function resetGame(){state={cookies:0,cps:0,items:CATALOG.map(i=>({id:i.id,bought:0}))};save();recalcCPS();updateUI();}
load();ensureState();recalcCPS();updateUI();
window.resetGame=resetGame;
