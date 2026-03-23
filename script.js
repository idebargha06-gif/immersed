let timeLeft = 0;
let totalTime = 0;
let distractedCount = 0;
let running = false;
let intervalId = null;

let mode = "solo";
let currentRoom = null;
let roomUnsubscribe = null;
let globalUnsubscribe = null;
let leaderboardVisible = true;   // start visible
let currentTab = "global";       // track active tab

// ─────────────────────────────────────────────
//  MODE
// ─────────────────────────────────────────────
function setMode(selected, btn) {
    if (running) { alert("Stop session first"); return; }

    mode = selected;

    // kill listeners
    if (roomUnsubscribe)   { roomUnsubscribe();   roomUnsubscribe   = null; }
    if (globalUnsubscribe) { globalUnsubscribe(); globalUnsubscribe = null; }
    currentRoom = null;

    let roomSection = document.getElementById("roomSection");

    if (mode === "solo") {
        roomSection.style.display = "none";
        document.getElementById("leaderboard").innerHTML = "";
        switchBoard("global", document.querySelector(".leaderboard-tabs button[data-tab='global']"));
        displayGlobalLeaderboard();
    } else {
        roomSection.style.display = "block";
        switchBoard("room", document.querySelector(".leaderboard-tabs button[data-tab='room']"));
    }

    document.querySelectorAll(".mode-select button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // make sure leaderboard is visible when switching modes
    setLeaderboardVisible(true);

    resetUI();
}

// ─────────────────────────────────────────────
//  LEADERBOARD TOGGLE  (FIX #1 + #5)
// ─────────────────────────────────────────────
function setLeaderboardVisible(show) {
    leaderboardVisible = show;
    let section = document.getElementById("leaderboardSection");
    section.style.display = leaderboardVisible ? "block" : "none";

    let btn = document.getElementById("toggleBtn");
    btn.textContent = leaderboardVisible ? "Hide Leaderboard" : "Show Leaderboard";
}

function toggleLeaderboard() {
    setLeaderboardVisible(!leaderboardVisible);
}

// ─────────────────────────────────────────────
//  TAB SWITCH  (FIX #2 – centering handled in CSS)
// ─────────────────────────────────────────────
function switchBoard(type, btn) {
    currentTab = type;

    document.querySelectorAll(".leaderboard-tabs button").forEach(b => b.classList.remove("active"));
    if (btn) btn.classList.add("active");

    document.getElementById("roomBoard").style.display   = type === "room"   ? "block" : "none";
    document.getElementById("globalBoard").style.display = type === "global" ? "block" : "none";
}

// ─────────────────────────────────────────────
//  TIMER
// ─────────────────────────────────────────────
function setTime(seconds, btn) {
    timeLeft = seconds;
    totalTime = seconds;
    updateTimerDisplay();
    document.getElementById("timer").style.color = "#22c55e";
    document.querySelectorAll(".time-select button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}

function updateTimerDisplay() {
    let m = Math.floor(timeLeft / 60);
    let s = timeLeft % 60;
    document.getElementById("timer").innerText =
        String(m).padStart(2, '0') + ":" + String(s).padStart(2, '0');
}

// ─────────────────────────────────────────────
//  SESSION
// ─────────────────────────────────────────────
function startSession() {
    if (running) return;

    let name = getUsername();
    let room = getRoom();

    if (!name) { document.getElementById("status").innerText = "⚠️ Enter your name!"; return; }
    if (mode === "room" && !room) { document.getElementById("status").innerText = "⚠️ Enter room name!"; return; }
    if (timeLeft === 0) { document.getElementById("status").innerText = "⚠️ Please select a time!"; return; }

    document.querySelector(".start").disabled = true;
    running = true;
    distractedCount = 0;

    document.getElementById("summary").innerText = "";
    document.getElementById("status").innerText = "Status: Focused 🎯";
    document.getElementById("timer").style.color = "#22c55e";

    intervalId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        if (timeLeft <= 0) stopSession();
    }, 1000);
}

function stopSession() {
    if (!running) return;

    running = false;
    clearInterval(intervalId);

    let timeSpent = totalTime - timeLeft;
    let score = Math.max(0, timeSpent - (distractedCount * 20));

    document.querySelector(".start").disabled = false;
    document.getElementById("timer").style.color = "#22c55e";
    document.getElementById("status").innerText = "Session Ended ✅";

    let m = Math.floor(timeSpent / 60);
    let s = timeSpent % 60;
    let formatted = String(m).padStart(2, '0') + ":" + String(s).padStart(2, '0');
    document.getElementById("summary").innerText =
        "Time: " + formatted + " | Distractions: " + distractedCount + " | Score: " + score;

    timeLeft = 0;
    document.getElementById("timer").innerText = "00:00";
    resetTimeButtons();

    let username = getUsername();
    if (username) updateLeaderboard(score);
}

function resetUI() {
    document.getElementById("summary").innerText = "";
    document.getElementById("status").innerText = "Status: Not started";
    document.getElementById("timer").innerText = "00:00";
    document.getElementById("timer").style.color = "#22c55e";
    timeLeft = 0;
    totalTime = 0;
    distractedCount = 0;
    resetTimeButtons();
}

function resetTimeButtons() {
    document.querySelectorAll(".time-select button").forEach(b => b.classList.remove("active"));
}

// ─────────────────────────────────────────────
//  DISTRACTION TRACKING
// ─────────────────────────────────────────────
window.onblur = function () {
    if (running) {
        distractedCount++;
        document.getElementById("status").innerText = "Status: Distracted ❌ (" + distractedCount + ")";
        document.getElementById("timer").style.color = "#ef4444";
    }
};

window.onfocus = function () {
    if (running) {
        document.getElementById("status").innerText = "Status: Focused 🎯 | Distractions: " + distractedCount;
        document.getElementById("timer").style.color = "#22c55e";
    }
};

// ─────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────
function getUsername() { return document.getElementById("username").value.trim(); }
function getRoom()     { return document.getElementById("roomInput").value.trim(); }

// ─────────────────────────────────────────────
//  FIREBASE – SAVE SCORE
// ─────────────────────────────────────────────
async function updateLeaderboard(score) {
    if (score <= 0) return;
    const { collection, addDoc, doc, getDoc, setDoc } = window.firebaseFns;

    let room     = getRoom();
    let username = getUsername();

    if (mode === "room" && room) {
        await addDoc(collection(window.db, "rooms", room, "scores"), {
            value: score, name: username, timestamp: Date.now()
        });
    }

    let userRef  = doc(window.db, "users", username);
    let userSnap = await getDoc(userRef);
    let current  = userSnap.exists() ? (userSnap.data().total || 0) : 0;
    await setDoc(userRef, { total: current + score });

    // refresh both boards
    displayLeaderboard();
    displayGlobalLeaderboard();
}

// ─────────────────────────────────────────────
//  FIREBASE – ROOM LEADERBOARD
// ─────────────────────────────────────────────
async function displayLeaderboard() {
    if (!window.firebaseFns) return;

    let room = getRoom();
    if (!room) {
        document.getElementById("leaderboard").innerHTML = "<li style='color:#94a3b8'>Enter a room name</li>";
        return;
    }

    const { collection, query, orderBy, limit, onSnapshot } = window.firebaseFns;

    if (roomUnsubscribe) { roomUnsubscribe(); roomUnsubscribe = null; }

    const q = query(
        collection(window.db, "rooms", room, "scores"),
        orderBy("value", "desc"),
        limit(5)
    );

    roomUnsubscribe = onSnapshot(q, (snapshot) => {
        let list = document.getElementById("leaderboard");
        list.innerHTML = "";
        let index = 1;
        snapshot.forEach((docItem) => {
            let data = docItem.data();
            if (!data.name) return;
            let li = document.createElement("li");
            li.innerText = `#${index} → ${data.name} — ${data.value} pts`;
            list.appendChild(li);
            index++;
        });
        if (index === 1) list.innerHTML = "<li style='color:#94a3b8'>No scores yet</li>";
    });
}

// ─────────────────────────────────────────────
//  FIREBASE – GLOBAL LEADERBOARD
// ─────────────────────────────────────────────
async function displayGlobalLeaderboard() {
    if (!window.firebaseFns) return;
    const { collection, query, orderBy, limit, onSnapshot } = window.firebaseFns;

    if (globalUnsubscribe) { globalUnsubscribe(); globalUnsubscribe = null; }

    const q = query(
        collection(window.db, "users"),
        orderBy("total", "desc"),
        limit(5)
    );

    globalUnsubscribe = onSnapshot(q, (snapshot) => {
        let list = document.getElementById("globalLeaderboard");
        list.innerHTML = "";
        let index = 1;
        snapshot.forEach((docItem) => {
            let data = docItem.data();
            let li = document.createElement("li");
            li.innerText = `#${index} → ${docItem.id} — ${data.total} pts`;
            list.appendChild(li);
            index++;
        });
        if (index === 1) list.innerHTML = "<li style='color:#94a3b8'>No scores yet</li>";
    });
}

// ─────────────────────────────────────────────
//  INIT  (FIX #4 – room input triggers listener)
// ─────────────────────────────────────────────
window.addEventListener("load", () => {
    // hide room section by default
    document.getElementById("roomSection").style.display = "none";

    // leaderboard visible by default, toggle button shows correct label
    setLeaderboardVisible(true);

    // global board loads immediately
    displayGlobalLeaderboard();
});

// FIX #4: trigger room leaderboard on every keystroke, not just "change"
document.getElementById("roomInput").addEventListener("input", () => {
    if (mode === "room" && getRoom()) {
        displayLeaderboard();
    }
});
