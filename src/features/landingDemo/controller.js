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
  const panels = [
    {
      progress: refs.landingPreviewProgress,
      timer: refs.landingPreviewTimer,
      start: refs.landingPreviewStartButton,
      stop: refs.landingPreviewStopButton,
      reset: refs.landingPreviewResetButton,
      statusDot: refs.landingPreviewStatusDot,
      statusLabel: refs.landingPreviewStatusLabel,
      distractions: refs.landingPreviewDistractions,
      sessions: refs.landingPreviewSessionCount,
      minutes: refs.landingPreviewFocusedMinutes,
      presenceList: refs.landingPresenceList,
      hostToggle: refs.landingHostToggle,
      hostPanel: refs.landingHostPanel,
      hostList: refs.landingHostList
    },
    {
      progress: refs.workspacePreviewProgress,
      timer: refs.workspacePreviewTimer,
      start: refs.workspacePreviewStartButton,
      stop: refs.workspacePreviewStopButton,
      reset: refs.workspacePreviewResetButton,
      statusDot: refs.workspacePreviewStatusDot,
      statusLabel: refs.workspacePreviewStatusLabel,
      distractions: refs.workspacePreviewDistractions,
      sessions: refs.workspacePreviewSessionCount,
      minutes: refs.workspacePreviewFocusedMinutes,
      presenceList: refs.workspacePresenceList,
      hostToggle: refs.workspaceHostToggle,
      hostPanel: refs.workspaceHostPanel,
      hostList: refs.workspaceHostList
    }
  ];

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

  function getYou() {
    return participants.find((participant) => participant.id === "you");
  }

  function setUserStatus(nextStatus) {
    userStatus = nextStatus;
    const you = getYou();
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
    const you = getYou();
    if (you) {
      you.distractions += 1;
      you.lastReason = reason;
    }
  }

  function setButtons(panel) {
    panel.start && (panel.start.disabled = running || remainingSeconds <= 0);
    panel.stop && (panel.stop.disabled = !running);
    panel.reset && (panel.reset.disabled = running && remainingSeconds === durationSeconds);
  }

  function renderPresenceList(panel) {
    if (!panel.presenceList) {
      return;
    }

    panel.presenceList.innerHTML = participants.map((participant) => `
      <li class="presence-item">
        <span class="status-dot ${statusClass(participant.status)}" aria-hidden="true"></span>
        <span>${participant.name}${participant.isYou ? " (you)" : ""}</span>
        <strong>${statusLabel(participant.status)}</strong>
      </li>
    `).join("");
  }

  function renderHostList(panel) {
    if (!panel.hostList) {
      return;
    }

    panel.hostList.innerHTML = participants.map((participant) => `
      <li class="host-row">
        <span>${participant.name}</span>
        <strong>${participant.distractions}</strong>
      </li>
    `).join("");
  }

  function renderPanel(panel) {
    if (!panel.progress) {
      return;
    }

    const progress = remainingSeconds / durationSeconds;
    panel.timer && (panel.timer.textContent = formatClock(remainingSeconds));
    panel.progress.style.strokeDasharray = `${circleLength}`;
    panel.progress.style.strokeDashoffset = `${circleLength * (1 - progress)}`;
    panel.progress.classList.toggle("preview__ring-progress--running", running);

    const ring = panel.progress.closest(".preview__ring");
    ring?.classList.toggle("is-running", running);

    panel.distractions && (panel.distractions.textContent = String(distractions));
    panel.sessions && (panel.sessions.textContent = String(sessionCount));
    panel.minutes && (panel.minutes.textContent = String(minutesFocused));
    if (panel.statusLabel) {
      panel.statusLabel.textContent = statusLabel(userStatus);
    }
    if (panel.statusDot) {
      panel.statusDot.className = `status-dot ${statusClass(userStatus)}`;
    }

    if (panel.hostPanel && panel.hostToggle) {
      panel.hostPanel.hidden = !panel.hostToggle.checked;
    }

    renderPresenceList(panel);
    renderHostList(panel);
    setButtons(panel);
  }

  function render() {
    panels.forEach(renderPanel);
  }

  function stopTicker() {
    if (tickId) {
      window.clearInterval(tickId);
      tickId = null;
    }
  }

  function finalizeSessionFromCurrentTimer() {
    const elapsedSeconds = Math.max(0, durationSeconds - remainingSeconds);
    if (elapsedSeconds <= 0) {
      return;
    }

    sessionCount += 1;
    minutesFocused += Math.max(1, Math.floor(elapsedSeconds / 60));
  }

  function startSession() {
    if (running || remainingSeconds <= 0) {
      return;
    }

    running = true;
    lastActivityAt = Date.now();
    hasRecordedIdle = false;
    setUserStatus("live");

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
        setUserStatus("live");
      }

      render();
    }, 1000);

    render();
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
    panels.forEach((panel) => {
      panel.start?.addEventListener("click", startSession);
      panel.stop?.addEventListener("click", stopSession);
      panel.reset?.addEventListener("click", resetSession);
      panel.hostToggle?.addEventListener("change", render);
    });

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
