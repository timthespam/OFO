function show(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById(id).classList.remove("hidden");
}

document.getElementById("playBtn").onclick = () => show("upload");
document.getElementById("settingsBtn").onclick = () => show("settings");
document.getElementById("creditsBtn").onclick = () => show("credits");

document.getElementById("backUpload").onclick = () => show("menu");
document.getElementById("backSettings").onclick = () => show("menu");
document.getElementById("backCredits").onclick = () => show("menu");

document.getElementById("chooseSongBtn").onclick = () =>
    document.getElementById("mp3input").click();


let audioContext;
let audioBuffer;
let sourceNode;
let score = 0;

document.getElementById("mp3input").addEventListener("change", async (evt) => {
    const file = evt.target.files[0];
    if (!file) return;

    show("loading");

    audioContext = new AudioContext();
    const arrayBuffer = await file.arrayBuffer();

    try {
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    } catch (e) {
        alert("Unsupported or corrupted MP3.");
        show("upload");
        return;
    }

    startGame();
});

function startGame() {
    show("game");
    score = 0;

    // Create audio playback
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
        setTimeout(() => target.classList.remove("active"), 120);
    };
}

function endGame() {
    document.getElementById("finalScore").innerText = "Score: " + score;
    show("endPanel");
}

document.getElementById("quit").onclick = endGame;
document.getElementById("playAgain").onclick = () => show("upload");
document.getElementById("backMenu").onclick = () => show("menu");
