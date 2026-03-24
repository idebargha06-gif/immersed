// ══════════════════════════════════════════════════════════
//  FIREBASE IMPORTS
// ══════════════════════════════════════════════════════════
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  onAuthStateChanged, signOut as fbSignOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, getDocs,
  query, orderBy, limit, doc, getDoc, setDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// ══════════════════════════════════════════════════════════
//  FIREBASE INIT
// ══════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey:            "AIzaSyB9wLp_Z2PzCQgtdTjwoQZGw2tSC8tgNNY",
  authDomain:        "focus-app-3c749.firebaseapp.com",
  projectId:         "focus-app-3c749",
  storageBucket:     "focus-app-3c749.appspot.com",
  messagingSenderId: "583246239661",
  appId:             "1:583246239661:web:7117c22d10842171ff7324"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth        = getAuth(firebaseApp);
const db          = getFirestore(firebaseApp);
const provider    = new GoogleAuthProvider();

window.db   = db;
window.auth = auth;


// ══════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════
const CIRCUMFERENCE = 2 * Math.PI * 88;

const QUOTES = [
  '"Deep work is the ability to focus without distraction." — Cal Newport',
  '"The successful warrior is the average person with laser-like focus." — Bruce Lee',
  '"Concentrate all your thoughts upon the work at hand." — Alexander Graham Bell',
  '"Either you run the day or the day runs you." — Jim Rohn',
  '"Focus is a matter of deciding what things you\'re not going to do." — John Carmack',
  '"Lost time is never found again." — Benjamin Franklin',
  '"Do the hard jobs first. The easy jobs will take care of themselves." — Dale Carnegie',
  '"You have to be burning with an idea, or a problem." — Steve Jobs',
];

const BADGES_DEF = [
  { id:"first",      label:"🎯 First Session",  check: s => s.totalSessions >= 1 },
  { id:"ten",        label:"💪 10 Sessions",     check: s => s.totalSessions >= 10 },
  { id:"nodistract", label:"🧘 Clean Session",   check: s => s.lastDistractions === 0 && s.totalSessions >= 1 },
  { id:"streak7",    label:"🔥 7 Day Streak",    check: s => s.streak >= 7 },
  { id:"hour",       label:"⏰ 1 Hour Focus",    check: s => s.totalMinutes >= 60 },
  { id:"legend",     label:"👑 Legend",           check: s => s.totalMinutes >= 600 },
];

const LEVELS = [
  { name:"Beginner",    min:0   },
  { name:"Deep Worker", min:60  },
  { name:"Flow State",  min:300 },
  { name:"Legend",      min:600 },
];

// FIX: Replaced all broken/unreliable audio URLs with stable Pixabay CDN links
const SOUND_URLS = {
  lofi:   "https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3",
  rain:   "https://cdn.pixabay.com/audio/2022/03/10/audio_9419a9f7c5.mp3",
  cafe:   "https://cdn.pixabay.com/audio/2021/09/06/audio_3da8018a5d.mp3",
  forest: "https://cdn.pixabay.com/audio/2022/03/15/audio_16c4b21c07.mp3",
  white:  "https://cdn.pixabay.com/audio/2022/03/12/audio_4a0b1bd2c3.mp3",
};

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];


// ══════════════════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════════════════
let timeLeft = 0, totalTime = 0, distractedCount = 0;
let running = false, intervalId = null;
let mode = "solo";
let roomUnsubscribe = null, globalUnsubscribe = null;
let pomodoroMode = false, pomoPhase = "work", pomoCycle = 0;
let activeAudio = null, activeSound = null;
let distractionLog = [];
let blurTime = null;
let lastActivity = Date.now();
let appInitialized = false;  // prevents double init on auth re-fires
let stats = {
  totalSessions: 0, totalMinutes: 0, streak: 0,
  lastSessionDate: null, badges: [],
  weekData: [0,0,0,0,0,0,0], lastDistractions: 0
};

// ── Distraction frequency tracking
let distractionTimes = [];  // timestamps of each distraction event


// ══════════════════════════════════════════════════════════
//  AUTH — FIX: show loader while Firebase resolves auth state
//  This prevents the flash of landing page on refresh
// ══════════════════════════════════════════════════════════
const loader = document.getElementById("authLoader");

// FIX: Landing stats load immediately — independent of auth
loadLandingStats();

onAuthStateChanged(auth, user => {
  // Hide loader — auth state is now known
  loader.classList.add("hidden");
  setTimeout(() => { loader.style.display = "none"; }, 350);

  if (user) {
    window.currentUser = user;
    showApp(user);
    if (!appInitialized) {
      appInitialized = true;
      initApp();
    }
  } else {
    window.currentUser = null;
    appInitialized = false;
    showLanding();
  }
});

function showApp(user) {
  document.getElementById("landingPage").style.display = "none";
  document.getElementById("mainApp").style.display     = "block";
  const avatar = document.getElementById("userAvatar");
  if (avatar) avatar.src = user.photoURL || "";
  const nameEl = document.getElementById("userName");
  if (nameEl) nameEl.innerText = user.displayName ? user.displayName.split(" ")[0] : "You";
  // Profile menu
  const ma = document.getElementById("menuAvatar"); if(ma) ma.src = user.photoURL || "";
  const mn = document.getElementById("menuName");   if(mn) mn.innerText = user.displayName || "User";
  const me = document.getElementById("menuEmail");  if(me) me.innerText = user.email || "";
}

function showLanding() {
  document.getElementById("landingPage").style.display = "block";
  document.getElementById("mainApp").style.display     = "none";
}

window.signInWithGoogle = async function () {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === "auth/popup-closed-by-user" ||
        e.code === "auth/cancelled-popup-request") return;
    console.error("Sign-in error:", e.code, e.message);
    alert("Sign-in failed: " + e.message);
  }
};

window.doSignOut = async function () {
  try {
    if (roomUnsubscribe)   { roomUnsubscribe();   roomUnsubscribe   = null; }
    if (globalUnsubscribe) { globalUnsubscribe(); globalUnsubscribe = null; }
    appInitialized = false;
    await fbSignOut(auth);
    toggleProfileMenu(true); // force close menu
  } catch (e) { console.error("Sign-out error:", e); }
};


// ══════════════════════════════════════════════════════════
//  WIRE BUTTONS (synchronous — module scripts run after DOM parse)
// ══════════════════════════════════════════════════════════
["btnSignIn","btnHeroCTA","btnLbCTA","btnFinalCTA"].forEach(id => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", () => window.signInWithGoogle());
});

document.getElementById("roomInput")?.addEventListener("input", () => {
  if (mode === "room" && getRoom()) displayLeaderboard();
});

// Close profile menu on outside click
document.addEventListener("click", e => {
  const menu = document.getElementById("profileMenu");
  const pill = document.querySelector(".user-pill");
  if (menu && pill && !pill.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = "none";
  }
  if (typeof Notification !== "undefined" && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }
}, { once: false });


// ══════════════════════════════════════════════════════════
//  APP INIT
// ══════════════════════════════════════════════════════════
async function initApp() {
  showQuote();
  loadTheme();
  checkRoomFromURL();
  await loadStats();
  renderStats();
  renderHistory();
  displayGlobalLeaderboard();
  startIdleTracking();
  startVisibilityTracking();
}
window.initApp = initApp;


// ══════════════════════════════════════════════════════════
//  LANDING STATS — loads independently of auth
// ══════════════════════════════════════════════════════════
async function loadLandingStats() {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    let totalMins = 0, totalSess = 0;
    usersSnap.forEach(d => {
      totalMins += d.data().totalMinutes  || 0;
      totalSess += d.data().totalSessions || 0;
    });
    const fmt = n => n >= 1000 ? (n/1000).toFixed(1)+"k" : String(n);
    const elS = document.getElementById("statSessions"); if(elS) elS.innerText = fmt(totalSess);
    const elU = document.getElementById("statUsers");    if(elU) elU.innerText = fmt(usersSnap.size);
    const elM = document.getElementById("statMinutes");  if(elM) elM.innerText = fmt(totalMins);
    const elL = document.getElementById("liveMinutes");  if(elL) elL.innerText = fmt(totalMins);
  } catch(e) { console.warn("loadLandingStats:", e); }

  // Real-time landing leaderboard — no auth needed
  try {
    const q = query(collection(db,"users"), orderBy("total","desc"), limit(5));
    onSnapshot(q, snap => {
      const list = document.getElementById("landingLeaderboard");
      if (!list) return;
      list.innerHTML = "";
      const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
      let i = 0;
      snap.forEach(d => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${medals[i]}</span><span style="flex:1">${d.data().name || d.id}</span><span style="color:var(--accent);font-weight:600">${d.data().total} pts</span>`;
        list.appendChild(li); i++;
      });
      if (i === 0) list.innerHTML = "<li style='color:var(--muted);justify-content:center'>Be the first!</li>";
    });
  } catch(e) { console.warn("landing board:", e); }
}


// ══════════════════════════════════════════════════════════
//  PROFILE MENU
// ══════════════════════════════════════════════════════════
function toggleProfileMenu(forceClose = false) {
  const menu = document.getElementById("profileMenu");
  if (!menu) return;
  menu.style.display = (forceClose || menu.style.display !== "none") ? "none" : "block";
}
window.toggleProfileMenu = toggleProfileMenu;


// ══════════════════════════════════════════════════════════
//  QUOTE
// ══════════════════════════════════════════════════════════
function showQuote() {
  const el = document.getElementById("quoteBar");
  if (el) el.innerText = QUOTES[Math.floor(Math.random() * QUOTES.length)];
}


// ══════════════════════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════════════════════
function loadTheme() {
  if (localStorage.getItem("ff_theme") === "light") {
    document.body.classList.add("light");
    const b = document.querySelector(".theme-toggle");
    if (b) b.textContent = "☀️";
  }
}
function toggleTheme() {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("ff_theme", isLight ? "light" : "dark");
  document.querySelectorAll(".theme-toggle").forEach(b => b.textContent = isLight ? "☀️" : "🌙");
}
window.toggleTheme = toggleTheme;


// ══════════════════════════════════════════════════════════
//  MODE
// ══════════════════════════════════════════════════════════
function setMode(selected, btn) {
  if (running) { alert("Stop session first"); return; }
  mode = selected;
  if (roomUnsubscribe)   { roomUnsubscribe();   roomUnsubscribe   = null; }
  if (globalUnsubscribe) { globalUnsubscribe(); globalUnsubscribe = null; }

  const rs = document.getElementById("roomSection");
  if (mode === "solo") {
    rs.style.display = "none";
    document.getElementById("leaderboard").innerHTML = "";
    switchBoard("global", document.querySelector(".leaderboard-tabs button[data-tab='global']"));
    displayGlobalLeaderboard();
  } else {
    rs.style.display = "block";
    switchBoard("room", document.querySelector(".leaderboard-tabs button[data-tab='room']"));
  }
  document.querySelectorAll(".mode-select button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  resetUI();
}
window.setMode = setMode;


// ══════════════════════════════════════════════════════════
//  SECTION TOGGLE
// ══════════════════════════════════════════════════════════
function toggleSection(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const hidden = el.style.display === "none";
  el.style.display = hidden ? "block" : "none";
  btn.textContent  = hidden ? "Hide" : "Show";
}
window.toggleSection = toggleSection;


// ══════════════════════════════════════════════════════════
//  TAB SWITCH
// ══════════════════════════════════════════════════════════
function switchBoard(type, btn) {
  document.querySelectorAll(".leaderboard-tabs button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.getElementById("roomBoard").style.display   = type === "room"   ? "block" : "none";
  document.getElementById("globalBoard").style.display = type === "global" ? "block" : "none";
}
window.switchBoard = switchBoard;


// ══════════════════════════════════════════════════════════
//  TIMER
// ══════════════════════════════════════════════════════════
function setTime(seconds, btn) {
  if (running) return;
  timeLeft = seconds; totalTime = seconds;
  updateTimerDisplay(); resetRing();
  document.getElementById("timer").classList.remove("distracted");
  document.querySelectorAll(".time-select button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.getElementById("customTimeRow").style.display = "none";
  pomodoroMode = false;
  document.getElementById("pomodoroBtn").classList.remove("active");
  document.getElementById("pomoStatus").innerText = "";
}
window.setTime = setTime;

function openCustomTime() {
  const row = document.getElementById("customTimeRow");
  row.style.display = row.style.display === "none" ? "flex" : "none";
}
window.openCustomTime = openCustomTime;

function applyCustomTime() {
  const mins = parseInt(document.getElementById("customMinutes").value);
  if (!mins || mins < 1) return;
  timeLeft = mins * 60; totalTime = mins * 60;
  updateTimerDisplay(); resetRing();
  document.querySelectorAll(".time-select button").forEach(b => b.classList.remove("active"));
  document.getElementById("btnCustom").classList.add("active");
  document.getElementById("customTimeRow").style.display = "none";
}
window.applyCustomTime = applyCustomTime;

function updateTimerDisplay() {
  const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
  document.getElementById("timer").innerText =
    String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
  const pct = totalTime > 0 ? Math.round((timeLeft / totalTime) * 100) : 0;
  document.getElementById("timerPct").innerText = running ? pct + "%" : "—";
  updateRing();
  document.title = running
    ? `🎯 ${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} — FocusFlow`
    : "FocusFlow — Deep Work Sessions";
}


// ══════════════════════════════════════════════════════════
//  POMODORO
// ══════════════════════════════════════════════════════════
function togglePomodoro() {
  if (running) return;
  pomodoroMode = !pomodoroMode;
  document.getElementById("pomodoroBtn").classList.toggle("active", pomodoroMode);
  if (pomodoroMode) {
    pomoPhase = "work"; pomoCycle = 0;
    timeLeft = 25 * 60; totalTime = 25 * 60;
    updateTimerDisplay(); resetRing();
    document.getElementById("pomoStatus").innerText = "🍅 Work phase — 25m";
    document.querySelectorAll(".time-select button").forEach(b => b.classList.remove("active"));
  } else {
    document.getElementById("pomoStatus").innerText = "";
  }
}
window.togglePomodoro = togglePomodoro;

function nextPomoPhase() {
  if (pomoPhase === "work") {
    pomoCycle++;
    pomoPhase = "break";
    timeLeft = 5 * 60; totalTime = 5 * 60;
    document.getElementById("pomoStatus").innerText = `☕ Break — 5m (Cycle ${pomoCycle})`;
    setStatus("Break time! ☕");
  } else {
    pomoPhase = "work";
    timeLeft = 25 * 60; totalTime = 25 * 60;
    document.getElementById("pomoStatus").innerText = `🍅 Work — 25m (Cycle ${pomoCycle})`;
    setStatus("Back to work! 🎯");
  }
  updateTimerDisplay(); resetRing();
  running = true;
  intervalId = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(intervalId);
      playBell();
      if (pomodoroMode) nextPomoPhase();
    }
  }, 1000);
}


// ══════════════════════════════════════════════════════════
//  SESSION
// ══════════════════════════════════════════════════════════
function startSession() {
  if (running || !window.currentUser) return;
  if (timeLeft === 0) { setStatus("⚠️ Select a time first!"); return; }
  if (mode === "room" && !getRoom()) { setStatus("⚠️ Enter a room name!"); return; }

  document.querySelector(".btn-start").disabled = true;
  running = true;
  distractedCount = 0;
  distractionLog  = [];
  distractionTimes = [];
  document.getElementById("shareBtn").style.display = "none";
  clearSummary();
  setStatus("Focused 🎯");
  document.getElementById("timer").classList.remove("distracted");

  intervalId = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      clearInterval(intervalId);
      if (pomodoroMode) { nextPomoPhase(); return; }
      stopSession();
    }
  }, 1000);
}
window.startSession = startSession;

function stopSession() {
  if (!running) return;
  running = false;
  clearInterval(intervalId);
  document.title = "FocusFlow — Deep Work Sessions";

  const timeSpent = totalTime - timeLeft;
  const score     = Math.max(0, timeSpent - distractedCount * 20);

  document.querySelector(".btn-start").disabled = false;
  document.getElementById("timer").classList.remove("distracted");
  setStatus("Session Ended ✅");

  const m = Math.floor(timeSpent / 60), s = timeSpent % 60;
  document.getElementById("statTime").innerText         = String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0");
  document.getElementById("statDistractions").innerText = distractedCount;
  document.getElementById("statScore").innerText        = score;

  const logEl = document.getElementById("distractionLog");
  logEl.innerHTML = "";
  distractionLog.forEach(d => {
    const div = document.createElement("div");
    div.innerHTML = `<span>⚠️</span> ${d.time} — away ${d.duration}s`;
    logEl.appendChild(div);
  });

  timeLeft = 0;
  document.getElementById("timer").innerText    = "00:00";
  document.getElementById("timerPct").innerText = "—";
  resetRing(); resetTimeButtons();
  playBell();

  if (distractedCount === 0 && timeSpent >= 60) launchConfetti();
  document.getElementById("shareBtn").style.display = "block";

  try {
    if (Notification.permission === "granted") {
      new Notification("FocusFlow — Session Complete! 🎉", {
        body: `Score: ${score} pts · Time: ${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
      });
    }
  } catch(e) {}

  if (window.currentUser) saveSession(score, timeSpent);
}
window.stopSession = stopSession;

function resetUI() {
  clearSummary();
  setStatus("Ready");
  document.getElementById("timer").innerText    = "00:00";
  document.getElementById("timerPct").innerText = "—";
  document.getElementById("timer").classList.remove("distracted");
  timeLeft = 0; totalTime = 0; distractedCount = 0;
  distractionLog = []; distractionTimes = [];
  resetRing(); resetTimeButtons();
  document.getElementById("distractionLog").innerHTML = "";
  document.getElementById("shareBtn").style.display   = "none";
  document.title = "FocusFlow — Deep Work Sessions";
}
window.resetUI = resetUI;

function clearSummary() {
  document.getElementById("statTime").innerText         = "--";
  document.getElementById("statDistractions").innerText = "--";
  document.getElementById("statScore").innerText        = "--";
}
function resetTimeButtons() { document.querySelectorAll(".time-select button").forEach(b => b.classList.remove("active")); }
function setStatus(msg)     { document.getElementById("status").innerText = msg; }


// ══════════════════════════════════════════════════════════
//  DISTRACTION DETECTION — IMPROVED
//
//  Browser security limits:
//  ✅ Can detect: tab switch (blur/visibilitychange), mouse idle
//  ❌ Cannot detect: what other sites/apps are open
//  ❌ Cannot detect: content inside other tabs
//
//  Strategy:
//  1. window.onblur + visibilitychange = catches tab/window switch
//  2. Idle mouse > 5min = distraction
//  3. Track frequency: rapid repeated switching gets extra penalty
//  4. Log exact away time per distraction
// ══════════════════════════════════════════════════════════
function recordDistraction(away = 0) {
  distractedCount++;
  distractionTimes.push(Date.now());

  // Rapid switching penalty: if >3 distractions in last 60s, add extra
  const recentCutoff = Date.now() - 60000;
  const recentCount  = distractionTimes.filter(t => t > recentCutoff).length;
  if (recentCount > 3) {
    distractedCount++; // double penalty for rapid switching
    setStatus(`⚠️ Rapid switching detected! (${distractedCount} distractions)`);
  } else {
    setStatus(`Distracted ❌ (${distractedCount}${recentCount > 2 ? " — slow down!" : ""})`);
  }
  document.getElementById("timer").classList.add("distracted");
}

window.onblur = () => {
  if (!running) return;
  blurTime = Date.now();
  recordDistraction();
};

window.onfocus = () => {
  if (!running || !blurTime) return;
  const away = Math.round((Date.now() - blurTime) / 1000);
  const now  = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
  distractionLog.push({ time: now, duration: away });
  blurTime = null;
  document.getElementById("timer").classList.remove("distracted");
  setStatus(`Focused 🎯 · ${distractedCount} slip${distractedCount !== 1 ? "s" : ""}`);
  if (away > 10) {
    document.getElementById("modalMsg").innerText =
      `You were away for ${away} seconds. Stay on task!`;
    document.getElementById("distractionModal").style.display = "flex";
  }
};

// visibilitychange catches mobile tab switch and most browser tab switches
// even when window.onblur doesn't fire
function startVisibilityTracking() {
  document.addEventListener("visibilitychange", () => {
    if (!running) return;
    if (document.hidden) {
      if (!blurTime) { // only if onblur hasn't already fired
        blurTime = Date.now();
        recordDistraction();
      }
    } else {
      if (blurTime) {
        const away = Math.round((Date.now() - blurTime) / 1000);
        const now  = new Date().toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" });
        distractionLog.push({ time: now, duration: away });
        blurTime = null;
        document.getElementById("timer").classList.remove("distracted");
        setStatus(`Focused 🎯 · ${distractedCount} slip${distractedCount !== 1 ? "s" : ""}`);
      }
    }
  });
}

function closeDistractionModal() {
  document.getElementById("distractionModal").style.display = "none";
}
window.closeDistractionModal = closeDistractionModal;

// Idle detection: mouse + keyboard inactivity > 5 minutes
function startIdleTracking() {
  const reset = () => { lastActivity = Date.now(); };
  document.addEventListener("mousemove", reset);
  document.addEventListener("keydown",   reset);
  document.addEventListener("touchstart",reset);
  setInterval(() => {
    if (!running) return;
    if (Date.now() - lastActivity > 5 * 60 * 1000) {
      recordDistraction(0);
      setStatus(`Idle detected 😴 (${distractedCount} distractions)`);
      lastActivity = Date.now(); // reset so it fires again after next 5min
    }
  }, 30000);
}


// ══════════════════════════════════════════════════════════
//  AMBIENT SOUNDS
// ══════════════════════════════════════════════════════════
function toggleSound(btn) {
  const sound = btn.dataset.sound;
  if (activeSound === sound) {
    if (activeAudio) { activeAudio.pause(); activeAudio = null; }
    activeSound = null;
    btn.classList.remove("active");
    return;
  }
  if (activeAudio) { activeAudio.pause(); }
  document.querySelectorAll(".sound-btn").forEach(b => b.classList.remove("active"));
  const audio  = new Audio(SOUND_URLS[sound]);
  audio.loop   = true;
  audio.volume = document.getElementById("volumeSlider").value / 100;
  audio.play().catch(e => console.warn("Audio play failed:", e));
  activeAudio = audio; activeSound = sound;
  btn.classList.add("active");
}
window.toggleSound = toggleSound;

function setVolume(val) {
  if (activeAudio) activeAudio.volume = val / 100;
}
window.setVolume = setVolume;

function playBell() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  } catch(e) {}
}


// ══════════════════════════════════════════════════════════
//  RING
// ══════════════════════════════════════════════════════════
function updateRing() {
  const ring = document.getElementById("ringProgress");
  if (!ring) return;
  const progress = totalTime > 0 ? timeLeft / totalTime : 0;
  ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
}
function resetRing() {
  const ring = document.getElementById("ringProgress");
  if (ring) ring.style.strokeDashoffset = CIRCUMFERENCE;
}


// ══════════════════════════════════════════════════════════
//  INVITE LINK
// ══════════════════════════════════════════════════════════
function copyInviteLink() {
  const room = getRoom();
  if (!room) return;
  const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(room)}`;
  navigator.clipboard.writeText(url)
    .then(() => {
      const toast = document.getElementById("inviteToast");
      toast.classList.add("show");
      setTimeout(() => toast.classList.remove("show"), 2500);
    })
    .catch(() => prompt("Copy this link:", url));
}
window.copyInviteLink = copyInviteLink;

function checkRoomFromURL() {
  const params = new URLSearchParams(location.search);
  const room   = params.get("room");
  if (room) {
    setTimeout(() => {
      const input = document.getElementById("roomInput");
      if (input) input.value = room;
      const roomBtn = document.querySelector(".mode-select button:last-child");
      if (roomBtn) setMode("room", roomBtn);
    }, 600);
  }
}


// ══════════════════════════════════════════════════════════
//  FIREBASE — SAVE SESSION
// ══════════════════════════════════════════════════════════
async function saveSession(score, timeSpent) {
  if (!window.currentUser) return;
  const uid      = window.currentUser.uid;
  const username = window.currentUser.displayName || window.currentUser.email || "Anonymous";
  const room     = getRoom();
  const goal     = document.getElementById("focusGoal")?.value.trim() || "—";

  if (mode === "room" && room) {
    await addDoc(collection(db, "rooms", room, "scores"), {
      value: score, name: username, uid, timestamp: Date.now()
    }).catch(e => console.warn("room save:", e));
  }

  await addDoc(collection(db, "users", uid, "sessions"), {
    score, timeSpent, distractions: distractedCount,
    goal, timestamp: Date.now(), date: new Date().toLocaleDateString()
  }).catch(e => console.warn("session save:", e));

  const userRef  = doc(db, "users", uid);
  const userSnap = await getDoc(userRef).catch(() => null);
  const prev     = userSnap && userSnap.exists() ? userSnap.data() : {};

  const today     = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  const lastDate  = prev.lastSessionDate || "";
  const newStreak = lastDate === today     ? (prev.streak || 0)
                  : lastDate === yesterday  ? (prev.streak || 0) + 1 : 1;

  const weekData = [...(prev.weekData || [0,0,0,0,0,0,0])];
  weekData[new Date().getDay()] += Math.floor(timeSpent / 60);

  const newTotalSessions = (prev.totalSessions || 0) + 1;
  const newTotalMinutes  = (prev.totalMinutes  || 0) + Math.floor(timeSpent / 60);
  const newTotal         = (prev.total         || 0) + score;

  await setDoc(userRef, {
    total: newTotal, totalSessions: newTotalSessions,
    totalMinutes: newTotalMinutes, streak: newStreak,
    lastSessionDate: today, weekData,
    lastDistractions: distractedCount, name: username
  }).catch(e => console.warn("user save:", e));

  stats = {
    totalSessions: newTotalSessions, totalMinutes: newTotalMinutes,
    streak: newStreak, weekData, lastDistractions: distractedCount,
    badges: checkBadges({ totalSessions: newTotalSessions, totalMinutes: newTotalMinutes, streak: newStreak, lastDistractions: distractedCount })
  };

  // Update profile menu stats too
  updateProfileMenuStats();
  renderStats();
  renderHistory();
  displayGlobalLeaderboard();
  if (mode === "room") displayLeaderboard();
}


// ══════════════════════════════════════════════════════════
//  LOAD STATS
// ══════════════════════════════════════════════════════════
async function loadStats() {
  if (!window.currentUser) return;
  try {
    const snap = await getDoc(doc(db, "users", window.currentUser.uid));
    if (snap.exists()) {
      const d = snap.data();
      stats = {
        totalSessions: d.totalSessions || 0, totalMinutes: d.totalMinutes || 0,
        streak: d.streak || 0, weekData: d.weekData || [0,0,0,0,0,0,0],
        lastDistractions: d.lastDistractions || 0, badges: checkBadges(d)
      };
      updateProfileMenuStats();
    }
  } catch(e) { console.warn("loadStats:", e); }
}

function checkBadges(d) {
  return BADGES_DEF.filter(b => b.check(d)).map(b => b.id);
}

function updateProfileMenuStats() {
  const level = [...LEVELS].reverse().find(l => stats.totalMinutes >= l.min);
  const ms  = document.getElementById("menuStreak");   if(ms) ms.innerText   = stats.streak + "🔥";
  const ml  = document.getElementById("menuLevel");    if(ml) ml.innerText   = level ? level.name : "Beginner";
  const mse = document.getElementById("menuSessions"); if(mse) mse.innerText = stats.totalSessions;
}


// ══════════════════════════════════════════════════════════
//  RENDER STATS
// ══════════════════════════════════════════════════════════
function renderStats() {
  document.getElementById("dashStreak").innerText = stats.streak + "🔥";
  document.getElementById("dashTotal").innerText  = stats.totalSessions;
  document.getElementById("dashHours").innerText  = (stats.totalMinutes / 60).toFixed(1) + "h";
  const level = [...LEVELS].reverse().find(l => stats.totalMinutes >= l.min);
  document.getElementById("dashLevel").innerText  = level ? level.name : "Beginner";

  const row = document.getElementById("badgesRow");
  row.innerHTML = "";
  BADGES_DEF.forEach(b => {
    const el = document.createElement("div");
    el.className   = "badge" + (stats.badges.includes(b.id) ? " earned" : "");
    el.textContent = b.label;
    row.appendChild(el);
  });

  // FIX: chart renders correctly with labels below bars
  const chart  = document.getElementById("weekChart");
  chart.innerHTML = "";
  const wd     = stats.weekData || [0,0,0,0,0,0,0];
  const maxVal = Math.max(...wd, 1);
  const today  = new Date().getDay();
  wd.forEach((val, i) => {
    const wrap = document.createElement("div"); wrap.className = "bar-day";
    const bar  = document.createElement("div");
    bar.className  = "bar" + (i === today ? " today" : "");
    // height is % of the bar area (chart height minus label space = 54px usable)
    bar.style.height = Math.max(3, (val / maxVal) * 50) + "px";
    const lbl  = document.createElement("div"); lbl.className = "bar-lbl"; lbl.textContent = DAYS[i];
    wrap.appendChild(bar); wrap.appendChild(lbl);
    chart.appendChild(wrap);
  });
}


// ══════════════════════════════════════════════════════════
//  RENDER HISTORY
// ══════════════════════════════════════════════════════════
async function renderHistory() {
  if (!window.currentUser) return;
  try {
    const q    = query(collection(db,"users",window.currentUser.uid,"sessions"), orderBy("timestamp","desc"), limit(10));
    const snap = await getDocs(q);
    const list = document.getElementById("historyList");
    list.innerHTML = "";
    if (snap.empty) {
      list.innerHTML = "<li style='color:var(--muted)'>No sessions yet. Start your first!</li>";
      return;
    }
    snap.forEach(d => {
      const data = d.data();
      const m    = Math.floor(data.timeSpent / 60), s = data.timeSpent % 60;
      const li   = document.createElement("li");
      li.innerHTML = `<span class="h-goal">${data.goal}</span><span class="h-meta">${data.date} · ${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} · ${data.distractions} distractions · ${data.score} pts</span>`;
      list.appendChild(li);
    });
  } catch(e) { console.warn("renderHistory:", e); }
}


// ══════════════════════════════════════════════════════════
//  LEADERBOARDS — real-time via onSnapshot
// ══════════════════════════════════════════════════════════
async function displayLeaderboard() {
  const room = getRoom();
  if (!room) {
    document.getElementById("leaderboard").innerHTML = "<li style='color:var(--muted)'>Enter a room name</li>";
    return;
  }
  if (roomUnsubscribe) { roomUnsubscribe(); roomUnsubscribe = null; }
  const q = query(collection(db,"rooms",room,"scores"), orderBy("value","desc"), limit(5));
  roomUnsubscribe = onSnapshot(q, snap => {
    const list = document.getElementById("leaderboard");
    list.innerHTML = "";
    let i = 1;
    snap.forEach(d => {
      const data = d.data(); if (!data.name) return;
      const li   = document.createElement("li");
      const isMe = window.currentUser && data.uid === window.currentUser.uid;
      if (isMe) li.classList.add("mine");
      li.innerText = `#${i}  ${data.name}${isMe ? " (you)" : ""} — ${data.value} pts`;
      list.appendChild(li); i++;
    });
    if (i === 1) list.innerHTML = "<li style='color:var(--muted)'>No scores yet</li>";
  });
}

async function displayGlobalLeaderboard() {
  if (globalUnsubscribe) { globalUnsubscribe(); globalUnsubscribe = null; }
  const q = query(collection(db,"users"), orderBy("total","desc"), limit(10));
  globalUnsubscribe = onSnapshot(q, snap => {
    const list = document.getElementById("globalLeaderboard");
    list.innerHTML = "";
    let i = 1;
    snap.forEach(d => {
      const isMe = window.currentUser && d.id === window.currentUser.uid;
      const li   = document.createElement("li");
      if (isMe) li.classList.add("mine");
      li.innerText = `#${i}  ${d.data().name || d.id}${isMe ? " (you)" : ""} — ${d.data().total} pts`;
      list.appendChild(li); i++;
    });
    if (i === 1) list.innerHTML = "<li style='color:var(--muted)'>No scores yet</li>";
  });
}


// ══════════════════════════════════════════════════════════
//  SHARE
// ══════════════════════════════════════════════════════════
function shareScore() {
  const time  = document.getElementById("statTime").innerText;
  const dist  = document.getElementById("statDistractions").innerText;
  const score = document.getElementById("statScore").innerText;
  const goal  = document.getElementById("focusGoal")?.value.trim() || "Deep work";
  const text  = `⚡ FocusFlow Session\n🎯 ${goal}\n⏱️ ${time} · 🚫 ${dist} distractions · 🏆 ${score} pts\n\nfocus-app-six-hazel.vercel.app`;
  if (navigator.share) {
    navigator.share({ title:"FocusFlow Score", text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text)
      .then(() => alert("Score copied! Paste anywhere 🎉"))
      .catch(() => {});
  }
}
window.shareScore = shareScore;


// ══════════════════════════════════════════════════════════
//  CONFETTI
// ══════════════════════════════════════════════════════════
function launchConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const pieces = Array.from({length:100}, () => ({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height - canvas.height,
    w: Math.random()*9+4, h: Math.random()*5+3,
    color: ["#22d47a","#38bdf8","#f87171","#fbbf24","#818cf8"][Math.floor(Math.random()*5)],
    speed: Math.random()*3.5+1.5, angle: Math.random()*Math.PI*2, spin: (Math.random()-0.5)*0.18
  }));
  let frames = 0;
  const draw = () => {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p => {
      p.y += p.speed; p.angle += p.spin;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    });
    frames++;
    if (frames < 200) requestAnimationFrame(draw);
    else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display="none"; }
  };
  draw();
}


// ══════════════════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════════════════
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
  if (e.code === "Space") { e.preventDefault(); running ? stopSession() : startSession(); }
  if (e.code === "KeyR" && !running) resetUI();
  if (e.code === "Escape") {
    document.getElementById("profileMenu").style.display = "none";
    document.getElementById("distractionModal").style.display = "none";
  }
});


// ══════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════
function getRoom() {
  return document.getElementById("roomInput")?.value.trim() || "";
}