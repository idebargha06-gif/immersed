// ══ CONSTANTS ═════════════════════════════════════════════
const CIRCUMFERENCE = 2 * Math.PI * 88;
const QUOTES = [
  '"Deep work is the ability to focus without distraction." — Cal Newport',
  '"The successful warrior is the average person with laser-like focus." — Bruce Lee',
  '"Concentrate all your thoughts upon the work at hand." — Alexander Graham Bell',
  '"You have to be burning with an idea, or a problem." — Steve Jobs',
  '"Either you run the day or the day runs you." — Jim Rohn',
  '"Focus is a matter of deciding what things you\'re not going to do." — John Carmack',
  '"Lost time is never found again." — Benjamin Franklin',
  '"Do the hard jobs first. The easy jobs will take care of themselves." — Dale Carnegie',
];
const BADGES_DEF = [
  { id:"first",    label:"🎯 First Session",   check: s => s.totalSessions >= 1 },
  { id:"ten",      label:"💪 10 Sessions",      check: s => s.totalSessions >= 10 },
  { id:"nodistract",label:"🧘 Clean Session",   check: s => s.lastDistractions === 0 },
  { id:"streak7",  label:"🔥 7 Day Streak",     check: s => s.streak >= 7 },
  { id:"hour",     label:"⏰ 1 Hour Focus",     check: s => s.totalMinutes >= 60 },
  { id:"legend",   label:"👑 Legend",            check: s => s.totalMinutes >= 600 },
];
const LEVELS = [
  { name:"Beginner",     min:0   },
  { name:"Deep Worker",  min:60  },
  { name:"Flow State",   min:300 },
  { name:"Legend",       min:600 },
];
const SOUND_URLS = {
  lofi:   "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  rain:   "https://assets.mixkit.co/sfx/preview/mixkit-rain-and-thunder-ambience-1246.mp3",
  cafe:   "https://assets.mixkit.co/sfx/preview/mixkit-restaurant-crowd-talking-ambience-444.mp3",
  forest: "https://assets.mixkit.co/sfx/preview/mixkit-forest-birds-ambience-1210.mp3",
  white:  "https://assets.mixkit.co/sfx/preview/mixkit-static-white-noise-ambience-2618.mp3",
};
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// ══ STATE ═════════════════════════════════════════════════
let timeLeft = 0, totalTime = 0, distractedCount = 0;
let running = false, intervalId = null;
let mode = "solo", currentRoom = null;
let roomUnsubscribe = null, globalUnsubscribe = null;
let leaderboardVisible = true;
let pomodoroMode = false, pomoPhase = "work", pomoCycle = 0;
let activeAudio = null, activeSound = null;
let distractionLog = [];
let blurTime = null;
let idleTimer = null;
let stats = { totalSessions:0, totalMinutes:0, streak:0, lastSessionDate:null, badges:[], weekData:[0,0,0,0,0,0,0], lastDistractions:0 };

// ══ INIT ══════════════════════════════════════════════════
window.initApp = async () => {
  showQuote();
  checkRoomFromURL();
  loadTheme();
  await loadStats();
  renderStats();
  renderHistory();
  displayGlobalLeaderboard();
  startIdleTracking();
  updateLandingStats();
};

// ══ LANDING LIVE STATS ════════════════════════════════════
async function updateLandingStats() {
  if (!window.firebaseFns) return;
  const { collection, query, getDocs, orderBy } = window.firebaseFns;
  try {
    const usersSnap = await getDocs(collection(window.db,"users"));
    document.getElementById("statUsers").innerText = usersSnap.size;
    let totalMins = 0, totalSess = 0;
    usersSnap.forEach(d => {
      const data = d.data();
      totalMins += data.totalMinutes || 0;
      totalSess += data.totalSessions || 0;
    });
    document.getElementById("statMinutes").innerText = totalMins;
    document.getElementById("statSessions").innerText = totalSess;
    document.getElementById("liveMinutes").innerText = totalMins;
    document.getElementById("statMinutes").innerText = totalMins;
  } catch(e) {}

  // landing leaderboard
  const { onSnapshot, limit } = window.firebaseFns;
  const q = (window.firebaseFns.query)(
    collection(window.db,"users"),
    orderBy("total","desc"),
    limit(5)
  );
  onSnapshot(q, snap => {
    const list = document.getElementById("landingLeaderboard");
    if (!list) return;
    list.innerHTML = "";
    let i = 1;
    snap.forEach(d => {
      const li = document.createElement("li");
      li.innerHTML = `<span>${["🥇","🥈","🥉","4️⃣","5️⃣"][i-1]}</span> ${d.id} <span style="margin-left:auto;color:var(--accent)">${d.data().total} pts</span>`;
      list.appendChild(li);
      i++;
    });
    if (i===1) list.innerHTML = "<li style='color:var(--muted);justify-content:center'>Be the first on the board!</li>";
  });
}

// ══ QUOTE ═════════════════════════════════════════════════
function showQuote() {
  const el = document.getElementById("quoteBar");
  if (el) el.innerText = QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// ══ THEME ═════════════════════════════════════════════════
function loadTheme() {
  if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("light");
    const btn = document.querySelector(".theme-toggle");
    if (btn) btn.textContent = "☀️";
  }
}
function toggleTheme() {
  document.body.classList.toggle("light");
  const isLight = document.body.classList.contains("light");
  localStorage.setItem("theme", isLight ? "light" : "dark");
  const btn = document.querySelector(".theme-toggle");
  if (btn) btn.textContent = isLight ? "☀️" : "🌙";
}

// ══ MODE ══════════════════════════════════════════════════
function setMode(selected, btn) {
  if (running) { alert("Stop session first"); return; }
  mode = selected;
  if (roomUnsubscribe)   { roomUnsubscribe();   roomUnsubscribe   = null; }
  if (globalUnsubscribe) { globalUnsubscribe(); globalUnsubscribe = null; }
  currentRoom = null;

  const roomSection = document.getElementById("roomSection");
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
  resetUI();
}

// ══ LEADERBOARD TOGGLE ════════════════════════════════════
function toggleSection(id, btn) {
  const el = document.getElementById(id);
  if (!el) return;
  const hidden = el.style.display === "none";
  el.style.display = hidden ? "block" : "none";
  btn.textContent = hidden ? "Hide" : "Show";
}
function toggleLeaderboard() { toggleSection("leaderboardSection", document.getElementById("toggleBtn")); }

// ══ TAB SWITCH ════════════════════════════════════════════
function switchBoard(type, btn) {
  document.querySelectorAll(".leaderboard-tabs button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  document.getElementById("roomBoard").style.display   = type==="room"   ? "block" : "none";
  document.getElementById("globalBoard").style.display = type==="global" ? "block" : "none";
}

// ══ TIMER ═════════════════════════════════════════════════
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

function openCustomTime() {
  const row = document.getElementById("customTimeRow");
  row.style.display = row.style.display === "none" ? "flex" : "none";
}
function applyCustomTime() {
  const mins = parseInt(document.getElementById("customMinutes").value);
  if (!mins || mins < 1) return;
  timeLeft = mins * 60; totalTime = mins * 60;
  updateTimerDisplay(); resetRing();
  document.querySelectorAll(".time-select button").forEach(b => b.classList.remove("active"));
  document.getElementById("btnCustom").classList.add("active");
  document.getElementById("customTimeRow").style.display = "none";
}

function updateTimerDisplay() {
  const m = Math.floor(timeLeft/60), s = timeLeft%60;
  document.getElementById("timer").innerText = String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
  const pct = totalTime > 0 ? Math.round((timeLeft/totalTime)*100) : 0;
  document.getElementById("timerPct").innerText = running ? pct+"%" : "—";
  updateRing();
  // Update page title
  if (running) document.title = `🎯 Focusing... ${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} — FocusFlow`;
  else document.title = "FocusFlow — Deep Work Sessions";
}

// ══ POMODORO ══════════════════════════════════════════════
function togglePomodoro() {
  if (running) return;
  pomodoroMode = !pomodoroMode;
  const btn = document.getElementById("pomodoroBtn");
  btn.classList.toggle("active", pomodoroMode);
  if (pomodoroMode) {
    pomoPhase = "work"; pomoCycle = 0;
    timeLeft = 25*60; totalTime = 25*60;
    updateTimerDisplay(); resetRing();
    document.getElementById("pomoStatus").innerText = "🍅 Work phase — 25m";
    document.querySelectorAll(".time-select button").forEach(b => b.classList.remove("active"));
  } else {
    document.getElementById("pomoStatus").innerText = "";
  }
}

function nextPomoPhase() {
  if (pomoPhase === "work") {
    pomoCycle++;
    pomoPhase = "break";
    timeLeft = 5*60; totalTime = 5*60;
    document.getElementById("pomoStatus").innerText = `☕ Break — 5m (Cycle ${pomoCycle})`;
    setStatus("Break time! ☕");
  } else {
    pomoPhase = "work";
    timeLeft = 25*60; totalTime = 25*60;
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

// ══ SESSION ═══════════════════════════════════════════════
function startSession() {
  if (running) return;
  if (!window.currentUser) return;
  if (timeLeft === 0) { setStatus("⚠️ Select a time first!"); return; }
  if (mode==="room" && !getRoom()) { setStatus("⚠️ Enter room name!"); return; }

  document.querySelector(".btn-start").disabled = true;
  running = true; distractedCount = 0; distractionLog = [];
  document.getElementById("shareBtn").style.display = "none";
  clearSummary(); setStatus("Focused 🎯");
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

function stopSession() {
  if (!running) return;
  running = false; clearInterval(intervalId);
  document.title = "FocusFlow — Deep Work Sessions";

  const timeSpent = totalTime - timeLeft;
  const score     = Math.max(0, timeSpent - distractedCount * 20);

  document.querySelector(".btn-start").disabled = false;
  document.getElementById("timer").classList.remove("distracted");
  setStatus("Session Ended ✅");

  // Stats
  const m = Math.floor(timeSpent/60), s = timeSpent%60;
  document.getElementById("statTime").innerText         = String(m).padStart(2,"0")+":"+String(s).padStart(2,"0");
  document.getElementById("statDistractions").innerText = distractedCount;
  document.getElementById("statScore").innerText        = score;

  // Distraction log
  const logEl = document.getElementById("distractionLog");
  logEl.innerHTML = "";
  distractionLog.forEach(d => {
    const span = document.createElement("div");
    span.innerHTML = `<span>⚠️</span> ${d.time} — away ${d.duration}s`;
    logEl.appendChild(span);
  });

  timeLeft = 0; document.getElementById("timer").innerText = "00:00";
  document.getElementById("timerPct").innerText = "—";
  resetRing(); resetTimeButtons();
  playBell();

  // Confetti if clean
  if (distractedCount === 0 && timeSpent >= 60) launchConfetti();

  // Show share button
  document.getElementById("shareBtn").style.display = "block";

  // Save
  if (window.currentUser) saveSession(score, timeSpent);

  // Browser notification
  if (Notification.permission === "granted") {
    new Notification("FocusFlow — Session Complete! 🎉", { body: `Score: ${score} pts · Time: ${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}

function resetUI() {
  clearSummary(); setStatus("Ready");
  document.getElementById("timer").innerText = "00:00";
  document.getElementById("timerPct").innerText = "—";
  document.getElementById("timer").classList.remove("distracted");
  timeLeft=0; totalTime=0; distractedCount=0; distractionLog=[];
  resetRing(); resetTimeButtons();
  document.getElementById("distractionLog").innerHTML = "";
  document.getElementById("shareBtn").style.display = "none";
  document.title = "FocusFlow — Deep Work Sessions";
}

function clearSummary() {
  document.getElementById("statTime").innerText = "--";
  document.getElementById("statDistractions").innerText = "--";
  document.getElementById("statScore").innerText = "--";
}
function resetTimeButtons() { document.querySelectorAll(".time-select button").forEach(b=>b.classList.remove("active")); }
function setStatus(msg) { document.getElementById("status").innerText = msg; }

// ══ DISTRACTION ═══════════════════════════════════════════
window.onblur = () => {
  if (!running) return;
  blurTime = Date.now();
  distractedCount++;
  setStatus(`Distracted ❌ (${distractedCount})`);
  document.getElementById("timer").classList.add("distracted");
};

window.onfocus = () => {
  if (!running || !blurTime) return;
  const away = Math.round((Date.now() - blurTime) / 1000);
  const now = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
  distractionLog.push({ time: now, duration: away });
  blurTime = null;
  document.getElementById("timer").classList.remove("distracted");
  setStatus(`Focused 🎯 · ${distractedCount} slip${distractedCount!==1?"s":""}`);
  // Show modal if away > 5s
  if (away > 5) {
    document.getElementById("modalMsg").innerText = `You were away for ${away} seconds. Stay focused!`;
    document.getElementById("distractionModal").style.display = "flex";
  }
};

function closeDistractionModal() {
  document.getElementById("distractionModal").style.display = "none";
}

// IDLE TRACKING
function startIdleTracking() {
  let lastMove = Date.now();
  const reset = () => { lastMove = Date.now(); };
  document.addEventListener("mousemove", reset);
  document.addEventListener("keydown", reset);
  idleTimer = setInterval(() => {
    if (!running) return;
    if (Date.now() - lastMove > 5 * 60 * 1000) {
      distractedCount++;
      setStatus(`Idle detected 😴 (${distractedCount} distractions)`);
      lastMove = Date.now(); // reset so it doesn't keep firing
    }
  }, 30000);
}

// ══ SOUNDS ════════════════════════════════════════════════
function toggleSound(btn) {
  const sound = btn.dataset.sound;
  if (activeSound === sound) {
    // Stop
    if (activeAudio) { activeAudio.pause(); activeAudio = null; }
    activeSound = null;
    btn.classList.remove("active");
    return;
  }
  if (activeAudio) { activeAudio.pause(); }
  document.querySelectorAll(".sound-btn").forEach(b => b.classList.remove("active"));
  const audio = new Audio(SOUND_URLS[sound]);
  audio.loop = true;
  audio.volume = document.getElementById("volumeSlider").value / 100;
  audio.play().catch(()=>{});
  activeAudio = audio; activeSound = sound;
  btn.classList.add("active");
}

function setVolume(val) {
  if (activeAudio) activeAudio.volume = val / 100;
}

function playBell() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.5);
  } catch(e) {}
}

// ══ RING ══════════════════════════════════════════════════
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

// ══ INVITE LINK ═══════════════════════════════════════════
function copyInviteLink() {
  const room = getRoom();
  if (!room) return;
  const url = `${location.origin}${location.pathname}?room=${encodeURIComponent(room)}`;
  navigator.clipboard.writeText(url).then(() => {
    const toast = document.getElementById("inviteToast");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  });
}

function checkRoomFromURL() {
  const params = new URLSearchParams(location.search);
  const room = params.get("room");
  if (room) {
    // Auto switch to room mode after app loads
    setTimeout(() => {
      document.getElementById("roomInput").value = room;
      const roomBtn = document.querySelector(".mode-select button:last-child");
      setMode("room", roomBtn);
    }, 500);
  }
}

// ══ FIREBASE — SAVE SESSION ═══════════════════════════════
async function saveSession(score, timeSpent) {
  if (!window.firebaseFns || !window.currentUser) return;
  const { collection, addDoc, doc, getDoc, setDoc } = window.firebaseFns;
  const uid      = window.currentUser.uid;
  const username = window.currentUser.displayName || window.currentUser.email;
  const room     = getRoom();
  const goal     = document.getElementById("focusGoal").value.trim();

  // Save to room if room mode
  if (mode==="room" && room) {
    await addDoc(collection(window.db,"rooms",room,"scores"), {
      value: score, name: username, uid, timestamp: Date.now()
    });
  }

  // Save session history
  await addDoc(collection(window.db,"users",uid,"sessions"), {
    score, timeSpent, distractions: distractedCount,
    goal: goal || "—", timestamp: Date.now(),
    date: new Date().toLocaleDateString()
  });

  // Update user stats
  const userRef  = doc(window.db,"users",uid);
  const userSnap = await getDoc(userRef);
  const prev     = userSnap.exists() ? userSnap.data() : {};
  const today    = new Date().toDateString();
  const lastDate = prev.lastSessionDate || "";
  const yesterday = new Date(Date.now()-86400000).toDateString();
  const newStreak = (lastDate === today) ? (prev.streak||0) :
                    (lastDate === yesterday) ? (prev.streak||0)+1 : 1;
  const newTotal   = (prev.total || 0) + score;
  const newSessions= (prev.totalSessions || 0) + 1;
  const newMinutes = (prev.totalMinutes || 0) + Math.floor(timeSpent/60);

  // Week data
  const weekData = prev.weekData || [0,0,0,0,0,0,0];
  const dayIdx   = new Date().getDay();
  weekData[dayIdx] = (weekData[dayIdx] || 0) + Math.floor(timeSpent/60);

  await setDoc(userRef, {
    total: newTotal, totalSessions: newSessions, totalMinutes: newMinutes,
    streak: newStreak, lastSessionDate: today, weekData,
    lastDistractions: distractedCount,
    name: username
  });

  stats = { totalSessions: newSessions, totalMinutes: newMinutes, streak: newStreak,
    lastSessionDate: today, weekData, lastDistractions: distractedCount,
    badges: checkBadges({ totalSessions: newSessions, totalMinutes: newMinutes, streak: newStreak, lastDistractions: distractedCount })
  };

  renderStats();
  renderHistory();
  displayGlobalLeaderboard();
  displayLeaderboard();
}

// ══ LOAD STATS ════════════════════════════════════════════
async function loadStats() {
  if (!window.firebaseFns || !window.currentUser) return;
  const { doc, getDoc } = window.firebaseFns;
  const uid = window.currentUser.uid;
  const snap = await getDoc(doc(window.db,"users",uid));
  if (snap.exists()) {
    const d = snap.data();
    stats = {
      totalSessions: d.totalSessions || 0,
      totalMinutes:  d.totalMinutes  || 0,
      streak:        d.streak        || 0,
      weekData:      d.weekData      || [0,0,0,0,0,0,0],
      lastDistractions: d.lastDistractions || 0,
      badges: checkBadges(d)
    };
  }
}

function checkBadges(d) {
  return BADGES_DEF.filter(b => b.check(d)).map(b => b.id);
}

// ══ RENDER STATS ══════════════════════════════════════════
function renderStats() {
  document.getElementById("dashStreak").innerText    = stats.streak + "🔥";
  document.getElementById("dashTotal").innerText     = stats.totalSessions;
  document.getElementById("dashHours").innerText     = (stats.totalMinutes/60).toFixed(1) + "h";
  const level = LEVELS.filter(l => stats.totalMinutes >= l.min).pop();
  document.getElementById("dashLevel").innerText     = level ? level.name : "Beginner";

  // Badges
  const row = document.getElementById("badgesRow");
  row.innerHTML = "";
  BADGES_DEF.forEach(b => {
    const el = document.createElement("div");
    el.className = "badge" + (stats.badges.includes(b.id) ? " earned" : "");
    el.textContent = b.label;
    row.appendChild(el);
  });

  // Week chart
  const chart = document.getElementById("weekChart");
  chart.innerHTML = "";
  const maxVal = Math.max(...(stats.weekData||[0,0,0,0,0,0,0]), 1);
  const today  = new Date().getDay();
  (stats.weekData||[0,0,0,0,0,0,0]).forEach((val,i) => {
    const wrap  = document.createElement("div"); wrap.className = "bar-day";
    const bar   = document.createElement("div"); bar.className  = "bar" + (i===today?" today":"");
    bar.style.height = Math.max(4, (val/maxVal)*56) + "px";
    const lbl   = document.createElement("div"); lbl.className  = "bar-lbl"; lbl.textContent = DAYS[i];
    wrap.appendChild(bar); wrap.appendChild(lbl);
    chart.appendChild(wrap);
  });
}

// ══ RENDER HISTORY ════════════════════════════════════════
async function renderHistory() {
  if (!window.firebaseFns || !window.currentUser) return;
  const { collection, query, orderBy, limit, getDocs } = window.firebaseFns;
  const uid = window.currentUser.uid;
  const q = query(collection(window.db,"users",uid,"sessions"), orderBy("timestamp","desc"), limit(10));
  const snap = await getDocs(q);
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  snap.forEach(d => {
    const data = d.data();
    const li   = document.createElement("li");
    const m    = Math.floor(data.timeSpent/60), s = data.timeSpent%60;
    li.innerHTML = `<span class="h-goal">${data.goal}</span><span class="h-meta">${data.date} · ${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} · ${data.distractions} distractions · ${data.score} pts</span>`;
    list.appendChild(li);
  });
  if (snap.empty) list.innerHTML = "<li style='color:var(--muted)'>No sessions yet. Start your first!</li>";
}

// ══ LEADERBOARDS ══════════════════════════════════════════
async function displayLeaderboard() {
  if (!window.firebaseFns) return;
  const room = getRoom();
  if (!room) {
    document.getElementById("leaderboard").innerHTML = "<li style='color:var(--muted)'>Enter a room name</li>";
    return;
  }
  const { collection, query, orderBy, limit, onSnapshot } = window.firebaseFns;
  if (roomUnsubscribe) { roomUnsubscribe(); roomUnsubscribe = null; }
  const q = query(collection(window.db,"rooms",room,"scores"), orderBy("value","desc"), limit(5));
  roomUnsubscribe = onSnapshot(q, snap => {
    const list = document.getElementById("leaderboard");
    list.innerHTML = "";
    let i = 1;
    snap.forEach(d => {
      const data = d.data(); if (!data.name) return;
      const li = document.createElement("li");
      const isMe = window.currentUser && data.uid === window.currentUser.uid;
      if (isMe) li.classList.add("mine");
      li.innerText = `#${i}  ${data.name}${isMe?" (you)":""} — ${data.value} pts`;
      list.appendChild(li); i++;
    });
    if (i===1) list.innerHTML = "<li style='color:var(--muted)'>No scores yet</li>";
  });
}

async function displayGlobalLeaderboard() {
  if (!window.firebaseFns) return;
  const { collection, query, orderBy, limit, onSnapshot } = window.firebaseFns;
  if (globalUnsubscribe) { globalUnsubscribe(); globalUnsubscribe = null; }
  const q = query(collection(window.db,"users"), orderBy("total","desc"), limit(10));
  globalUnsubscribe = onSnapshot(q, snap => {
    const list = document.getElementById("globalLeaderboard");
    list.innerHTML = "";
    let i = 1;
    snap.forEach(d => {
      const isMe = window.currentUser && d.id === window.currentUser.uid;
      const li   = document.createElement("li");
      if (isMe) li.classList.add("mine");
      li.innerText = `#${i}  ${d.data().name || d.id}${isMe?" (you)":""} — ${d.data().total} pts`;
      list.appendChild(li); i++;
    });
    if (i===1) list.innerHTML = "<li style='color:var(--muted)'>No scores yet</li>";
  });
}

// ══ SHARE SCORE ═══════════════════════════════════════════
function shareScore() {
  const time   = document.getElementById("statTime").innerText;
  const dist   = document.getElementById("statDistractions").innerText;
  const score  = document.getElementById("statScore").innerText;
  const goal   = document.getElementById("focusGoal").value.trim() || "Deep work";
  const text   = `⚡ FocusFlow Session\n🎯 Goal: ${goal}\n⏱️ Time: ${time}\n🚫 Distractions: ${dist}\n🏆 Score: ${score} pts\n\nfocus-app-six-hazel.vercel.app`;
  if (navigator.share) {
    navigator.share({ title:"FocusFlow Score", text });
  } else {
    navigator.clipboard.writeText(text);
    alert("Score copied to clipboard! Paste it anywhere 🎉");
  }
}

// ══ CONFETTI ══════════════════════════════════════════════
function launchConfetti() {
  const canvas = document.getElementById("confettiCanvas");
  canvas.style.display = "block";
  const ctx = canvas.getContext("2d");
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
  const pieces  = Array.from({length:120}, () => ({
    x: Math.random()*canvas.width, y: Math.random()*canvas.height-canvas.height,
    w: Math.random()*10+5, h: Math.random()*6+4,
    color: ["#00ff88","#00cfff","#ff4560","#ffb300","#7c3aff"][Math.floor(Math.random()*5)],
    speed: Math.random()*4+2, angle: Math.random()*Math.PI*2, spin: (Math.random()-0.5)*0.2
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
    if (frames < 180) requestAnimationFrame(draw);
    else { ctx.clearRect(0,0,canvas.width,canvas.height); canvas.style.display="none"; }
  };
  draw();
}

// ══ KEYBOARD SHORTCUTS ════════════════════════════════════
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  if (e.code === "Space") { e.preventDefault(); running ? stopSession() : startSession(); }
  if (e.code === "KeyR" && !running) resetUI();
});

// ══ HELPERS ═══════════════════════════════════════════════
function getRoom()     { return document.getElementById("roomInput")?.value.trim() || ""; }
function getUsername() { return window.currentUser?.displayName || ""; }

// ══ ROOM INPUT LIVE ═══════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("roomInput").addEventListener("input", () => {
    if (mode==="room" && getRoom()) displayLeaderboard();
  });

  // Request notification permission on first interact
  document.addEventListener("click", () => {
    if (Notification.permission === "default") Notification.requestPermission();
  }, { once: true });
});