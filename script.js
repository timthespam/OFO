const screens = {
    menu: menu,
    upload: upload,
    settings: settings,
    credits: credits,
    loading: loading,
    game: game,
    end: endPanel
  };
  
  let sensitivity = 1;
  let score = 0;
  let audio, ctx, analyser, data;
  let pos = { x: innerWidth/2, y: innerHeight/2 };
  
  function show(screen) {
    Object.values(screens).forEach(s => s.classList.add("hidden"));
    screen.classList.remove("hidden");
  }
  
  playBtn.onclick = () => show(upload);
  settingsBtn.onclick = () => show(settings);
  creditsBtn.onclick = () => show(credits);
  backUpload.onclick = () => show(menu);
  backSettings.onclick = () => show(menu);
  backCredits.onclick = () => show(menu);
  backMenu.onclick = () => show(menu);
  playAgain.onclick = () => show(upload);
  
  chooseSongBtn.onclick = () => mp3input.click();
  
  mp3input.onchange = e => {
    const file = e.target.files[0];
    if (!file || !file.name.endsWith(".mp3")) {
      alert("MP3 only");
      return;
    }
    startGame(file);
  };
  
  function startGame(file) {
    show(loading);
    audio = new Audio(URL.createObjectURL(file));
    ctx = new AudioContext();
    analyser = ctx.createAnalyser();
    data = new Uint8Array(analyser.frequencyBinCount);
    const src = ctx.createMediaElementSource(audio);
    src.connect(analyser);
    analyser.connect(ctx.destination);
  
    score = 0;
    scoreEl.textContent = "Score: 0";
    audio.play();
    show(game);
    tick();
  }
  
  function tick() {
    if (audio.ended) {
      finalScore.textContent = "Score: " + score;
      show(endPanel);
      return;
    }
    analyser.getByteFrequencyData(data);
    if (Math.max(...data) > 200) spawnCircle();
    requestAnimationFrame(tick);
  }
  
  function spawnCircle() {
    const c = document.createElement("div");
    c.className = "beatCircle";
    c.style.left = Math.random()*(innerWidth-80)+"px";
    c.style.top = Math.random()*(innerHeight-80)+"px";
    c.style.background = "rgba(0,200,255,0.6)";
    c.onclick = () => {
      score += 100;
      scoreEl.textContent = "Score: " + score;
      c.remove();
    };
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 1500);
  }
  
  document.addEventListener("mousemove", e => {
    if (game.classList.contains("hidden")) return;
    pos.x += (e.clientX - pos.x) * sensitivity;
    pos.y += (e.clientY - pos.y) * sensitivity;
    target.style.left = pos.x+"px";
    target.style.top = pos.y+"px";
  });
  