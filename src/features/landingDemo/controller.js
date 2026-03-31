function formatClock(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
  const seconds = Math.floor(safe % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function statusLabel(status) {
  if (status === "distracted") {
    return "Distracted";
  }
  if (status === "idle") {
    return "Idle";
  }
  return "Focused";
}

function statusClass(status) {
  if (status === "distracted") {
    return "status-dot--distracted";
  }
  if (status === "idle") {
    return "status-dot--idle";
  }
  return "status-dot--focused";
}

export function createLandingPreviewController({ refs }) {
  const circleLength = 553;
  const durationSeconds = 25 * 60;
  let running = false;
  let remainingSeconds = durationSeconds;
  let distractions = 0;
  let sessionCount = 0;
  let minutesFocused = 0;
  let lastActivityAt = Date.now();
  let userStatus = "focused";
  let hasRecordedIdle = false;
  let lastDistractionAt = 0;

  const participants = [
    { id: "you", name: "You", status: "focused", distractions: 0, isYou: true },
    { id: "a", name: "Aria", status: "focused", distractions: 0, isYou: false },
    { id: "b", name: "Noah", status: "focused", distractions: 0, isYou: false },
    { id: "c", name: "Mila", status: "focused", distractions: 0, isYou: false }
  ];

  let tickId = null;
  let idleId = null;
  let botId = null;

  function setUserStatus(nextStatus) {
    userStatus = nextStatus;
    const you = participants.find((participant) => participant.id === "you");
    if (you) {
      you.status = nextStatus;
    }
  }

  function addDistraction(reason) {
    const now = Date.now();
    if (now - lastDistractionAt < 1800) {
      return;
    }

    lastDistractionAt = now;
    distractions += 1;
    const you = participants.find((participant) => participant.id === "you");
    if (you) {
      you.distractions += 1;
      you.lastReason = reason;
    }
  }

  function updateButtons() {
    refs.landingPreviewStartButton && (refs.landingPreviewStartButton.disabled = running || remainingSeconds <= 0);
    refs.landingPreviewStopButton && (refs.landingPreviewStopButton.disabled = !running);
  }

  function renderParticipantList() {
    if (!refs.landingPresenceList) {
      return;
    }

    refs.landingPresenceList.innerHTML = participants.map((participant) => `
      <li class="presence-item">
        <span class="status-dot ${statusClass(participant.status)}" aria-hidden="true"></span>
        <span>${participant.name}${participant.isYou ? " (you)" : ""}</span>
        <strong>${statusLabel(participant.status)}</strong>
      </li>
    `).join("");
  }

  function renderHostList() {
    if (!refs.landingHostList) {
      return;
    }

    refs.landingHostList.innerHTML = participants.map((participant) => `
      <li class="host-row">
        <span>${participant.name}</span>
        <strong>${participant.distractions}</strong>
      </li>
    `).join("");
  }

  function render() {
    if (refs.landingPreviewTimer) {
      refs.landingPreviewTimer.textContent = formatClock(remainingSeconds);
    }

    if (refs.landingPreviewProgress) {
      const progress = remainingSeconds / durationSeconds;
      refs.landingPreviewProgress.style.strokeDasharray = `${circleLength}`;
      refs.landingPreviewProgress.style.strokeDashoffset = `${circleLength * (1 - progress)}`;
      refs.landingPreviewProgress.classList.toggle("preview__ring-progress--running", running);
    }

    if (refs.landingPreviewRing) {
      refs.landingPreviewRing.classList.toggle("is-running", running);
    }

    if (refs.landingPreviewPhase) {
      refs.landingPreviewPhase.textContent = running ? "IN PROGRESS" : "Ready";
    }

    if (refs.landingPreviewPercent) {
      const percent = Math.round((remainingSeconds / durationSeconds) * 100);
      refs.landingPreviewPercent.textContent = running ? `${percent}%` : "100%";
    }

    refs.landingPreviewDistractions && (refs.landingPreviewDistractions.textContent = String(distractions));
    refs.landingPreviewSessionCount && (refs.landingPreviewSessionCount.textContent = String(sessionCount));
    refs.landingPreviewFocusedMinutes && (refs.landingPreviewFocusedMinutes.textContent = String(minutesFocused));

    if (refs.landingPreviewStatusLabel) {
      refs.landingPreviewStatusLabel.textContent = statusLabel(userStatus);
    }
    if (refs.landingPreviewStatusDot) {
      refs.landingPreviewStatusDot.className = `status-dot ${statusClass(userStatus)}`;
    }

    if (refs.landingHostPanel && refs.landingHostToggle) {
      refs.landingHostPanel.hidden = !refs.landingHostToggle.checked;
    }

    renderParticipantList();
    renderHostList();
    updateButtons();
  }

  function stopTicker() {
    if (tickId) {
      window.clearInterval(tickId);
      tickId = null;
    }
  }

  function startSession() {
    if (running || remainingSeconds <= 0) {
      return;
    }

    running = true;
    lastActivityAt = Date.now();
    hasRecordedIdle = false;
    setUserStatus("focused");

    // Trigger green pulse animation
    if (refs.landingPreviewRing) {
      refs.landingPreviewRing.classList.add("session-starting");
      setTimeout(() => {
        refs.landingPreviewRing?.classList.remove("session-starting");
      }, 600);
    }

    stopTicker();
    tickId = window.setInterval(() => {
      if (!running) {
        return;
      }

      remainingSeconds = Math.max(0, remainingSeconds - 1);
      if (remainingSeconds <= 0) {
        running = false;
        stopTicker();
        sessionCount += 1;
        minutesFocused += Math.floor(durationSeconds / 60);
        setUserStatus("focused");
      }

      render();
    }, 1000);

    render();
  }

  function stopSession() {
    if (!running) {
      return;
    }

    const elapsedSeconds = Math.max(0, durationSeconds - remainingSeconds);
    if (elapsedSeconds > 0) {
      sessionCount += 1;
      minutesFocused += Math.max(1, Math.floor(elapsedSeconds / 60));
    }

    running = false;
    stopTicker();
    remainingSeconds = 0;
    setUserStatus("focused");
    render();
  }

  function markActive() {
    lastActivityAt = Date.now();
    if (running && (userStatus === "idle" || userStatus === "distracted")) {
      setUserStatus("focused");
    }
    render();
  }

  function markDistracted(reason) {
    if (!running) {
      return;
    }

    setUserStatus("distracted");
    addDistraction(reason);
    hasRecordedIdle = false;
    render();
  }

  function handleVisibility() {
    if (document.hidden) {
      markDistracted("tab-hidden");
      return;
    }

    if (running) {
      setUserStatus("focused");
      render();
    }
  }

  function simulateParticipants() {
    participants.forEach((participant) => {
      if (participant.isYou) {
        return;
      }

      const roll = Math.random();
      if (roll < 0.65) {
        participant.status = "focused";
      } else if (roll < 0.85) {
        participant.status = "idle";
      } else {
        participant.status = "distracted";
        participant.distractions += 1;
      }
    });

    render();
  }

  function bindEvents() {
    refs.landingPreviewStartButton?.addEventListener("click", startSession);
    refs.landingPreviewStopButton?.addEventListener("click", stopSession);
    refs.landingHostToggle?.addEventListener("change", render);

    ["mousemove", "keydown", "touchstart", "pointerdown"].forEach((eventName) => {
      window.addEventListener(eventName, markActive, { passive: true });
    });

    window.addEventListener("blur", () => {
      markDistracted("window-blur");
    });

    window.addEventListener("focus", () => {
      if (running) {
        setUserStatus("focused");
        render();
      }
    });

    document.addEventListener("visibilitychange", handleVisibility);

    idleId = window.setInterval(() => {
      if (!running) {
        return;
      }

      const idleForMs = Date.now() - lastActivityAt;
      if (idleForMs >= 20000) {
        setUserStatus("idle");
        if (!hasRecordedIdle) {
          addDistraction("idle");
          hasRecordedIdle = true;
        }
        render();
      }
    }, 3000);

    botId = window.setInterval(simulateParticipants, 7000);
  }

  function init() {
    bindEvents();
    render();
  }

  return {
    init
  };
}
