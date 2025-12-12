function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("visible"));
    document.getElementById(id).classList.add("visible");
}

/* MENU BUTTONS */
playBtn.onclick = () => show("upload");
settingsBtn.onclick = () => show("settings");
creditsBtn.onclick = () => show("credits");

backUpload.onclick = () => show("menu");
backSettings.onclick = () => show("menu");
backCredits.onclick = () => show("menu");

chooseSongBtn.onclick = () => mp3input.click();

/* AUDIO LOAD */
let audioContext, audioBuffer, sourceNode, score;

mp3input.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    show("loading");
    audioContext = new AudioContext();

    try {
        const buf = await file.arrayBuffer();
        audioBuffer = await audioContext.decodeAudioData(buf);
    } catch {
        alert("Invalid MP3 file!");
        show("upload");
        return;
    }

    startGame();
});

/* GAME LOGIC */
function startGame() {
    score = 0;
    document.getElementById("score").innerText = "Score: 0";

    show("game");

    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(audioContext.destination);
    sourceNode.start(0);

    sourceNode.onended = endGame;

    const target = document.getElementById("target");

    target.onclick = () => {
        score++;
        document.getElementById("score").innerText = "Score: " + score;
        target.classList.add("active");
        setTimeout(() => target.classList.remove("active"), 150);
    };
}

function endGame() {
    finalScore.innerText = "Score: " + score;
    show("endPanel");
}

quit.onclick = endGame;
playAgain.onclick = () => show("upload");
backMenu.onclick = () => show("menu");
