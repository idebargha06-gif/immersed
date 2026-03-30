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
  return "Live";
}

function statusClass(status) {
  if (status === "distracted") {
    return "status-dot--distracted";
  }
  if (status === "idle") {
    return "status-dot--idle";
  }
  return "status-dot--live";
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
  let userStatus = "live";
  let hasRecordedIdle = false;
  let lastDistractionAt = 0;
  const participants = [
    { id: "you", name: "You", status: "live", distractions: 0, isYou: true },
    { id: "a", name: "Aria", status: "live", distractions: 0, isYou: false },
    { id: "b", name: "Noah", status: "live", distractions: 0, isYou: false },
    { id: "c", name: "Mila", status: "live", distractions: 0, isYou: false }
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
    if (!refs.landingPreviewStartButton || !refs.landingPreviewStopButton || !refs.landingPreviewResetButton) {
      return;
    }

    refs.landingPreviewStartButton.disabled = running || remainingSeconds <= 0;
    refs.landingPreviewStopButton.disabled = !running;
    refs.landingPreviewResetButton.disabled = running && remainingSeconds === durationSeconds;
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
    }

    if (refs.landingPreviewDistractions) {
      refs.landingPreviewDistractions.textContent = String(distractions);
    }
    if (refs.landingPreviewSessionCount) {
      refs.landingPreviewSessionCount.textContent = String(sessionCount);
    }
    if (refs.landingPreviewFocusedMinutes) {
      refs.landingPreviewFocusedMinutes.textContent = String(minutesFocused);
    }
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
    setUserStatus("live");
    hasRecordedIdle = false;

    stopTicker();
    tickId = window.setInterval(() => {
      if (!running) {
        return;
      }

      remainingSeconds = Math.max(0, remainingSeconds - 1);
      if (remainingSeconds <= 0) {
        running = false;
        activeStartedAt = 0;
        stopTicker();
        sessionCount += 1;
        minutesFocused += Math.floor(durationSeconds / 60);
        setUserStatus("live");
      }

      render();
    }, 1000);

    render();
  }

  function finalizeSessionFromCurrentTimer() {
    const elapsedSeconds = Math.max(0, durationSeconds - remainingSeconds);
    if (elapsedSeconds <= 0) {
      return;
    }

    sessionCount += 1;
    minutesFocused += Math.max(1, Math.floor(elapsedSeconds / 60));
  }

  function stopSession() {
    if (!running) {
      return;
    }

    finalizeSessionFromCurrentTimer();
    running = false;
    stopTicker();
    setUserStatus("live");
    render();
  }

  function resetSession() {
    running = false;
    stopTicker();
    remainingSeconds = durationSeconds;
    setUserStatus("live");
    render();
  }

  function markActive() {
    lastActivityAt = Date.now();
    if (running && (userStatus === "idle" || userStatus === "distracted")) {
      setUserStatus("live");
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
      setUserStatus("live");
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
        participant.status = "live";
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
    refs.landingPreviewResetButton?.addEventListener("click", resetSession);
    refs.landingHostToggle?.addEventListener("change", render);

    ["mousemove", "keydown", "touchstart", "pointerdown"].forEach((eventName) => {
      window.addEventListener(eventName, markActive, { passive: true });
    });

    window.addEventListener("blur", () => {
      markDistracted("window-blur");
    });

    window.addEventListener("focus", () => {
      if (running) {
        setUserStatus("live");
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


