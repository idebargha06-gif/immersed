import {
  APP_TITLE,
  DEFAULT_TITLE,
  CIRCLE_LENGTH,
  DAILY_GOAL_MINUTES,
  DAY_LABELS,
  FEEDBACK_POOLS,
  SESSION_MODES,
  OWNER_UID,
  REAL_DISTRACTION_PENALTY,
  CONTEXT_SWITCH_PENALTY,
  CONTEXT_SWITCH_FREE_LIMIT,
  IDLE_PENALTY
} from "../utils/constants.js";
import { createAvatarMarkup, hydrateAvatarImages, mountAvatar } from "../utils/avatar.js";
import { formatMonthLabel, getMonthGrid, getMonthKey, getTodayIsoDay } from "../utils/date.js";
import { escapeHtml, formatClock, formatClockWithHours, formatCompactMinutes, formatHoursFromMinutes, formatTimeAgo, getFirstName, pluralize } from "../utils/format.js";
import { getFeedbackBucket, getLevelInfo } from "../utils/scoring.js";

function getScoringDescription(sessionMode) {
  // Base penalties from new scoring system
  const distractionPenalty = REAL_DISTRACTION_PENALTY;
  const idlePenalty = IDLE_PENALTY;
  
  // Mode-specific multiplier
  switch (sessionMode) {
    case "deep":
      return `Strict penalties: -${distractionPenalty * 2} per distraction, -${idlePenalty * 2} idle. Context switches: first ${CONTEXT_SWITCH_FREE_LIMIT} free, then -${CONTEXT_SWITCH_PENALTY * 2} each.`;
    case "sprint":
      return `Light penalties: -${Math.floor(distractionPenalty / 2)} per distraction, -${Math.floor(idlePenalty / 2)} idle. Context switches: first ${CONTEXT_SWITCH_FREE_LIMIT} free, then -${CONTEXT_SWITCH_PENALTY} each.`;
    case "normal":
    default:
      return `Standard penalties: -${distractionPenalty} per distraction, -${idlePenalty} idle. Context switches: first ${CONTEXT_SWITCH_FREE_LIMIT} free, then -${CONTEXT_SWITCH_PENALTY} each.`;
  }
}

function renderToasts(toasts, refs) {
  refs.toastStack.innerHTML = toasts.map((toast) => `
    <article class="toast toast--${toast.type}">
      <div>
        <strong>${escapeHtml(toast.title)}</strong>
        <p>${escapeHtml(toast.message)}</p>
      </div>
      <button class="text-button" data-action="dismiss-toast" data-toast-id="${toast.id}" type="button">Dismiss</button>
    </article>
  `).join("");
}

function renderLanding(state, refs) {
  const isSignedIn = Boolean(state.auth.user);
  refs.landingLoggedOut.hidden = isSignedIn;
  refs.landingLoggedIn.hidden = !isSignedIn;
  refs.landingAccountToolbar.hidden = !isSignedIn;
  refs.landingStreakBadge.hidden = !isSignedIn;
  refs.landingStreakValue.textContent = String(state.stats.streak);
  refs.landingStreakBadge.dataset.active = state.stats.streak > 0 ? "true" : "false";

  refs.publicMinutesMetric.textContent = formatCompactMinutes(state.publicStats.totalMinutes);
  refs.publicSessionMetric.textContent = String(state.publicStats.totalSessions);
  refs.publicUserMetric.textContent = String(state.publicStats.totalUsers);
  if (refs.topAuthButton) {
    refs.topAuthButton.hidden = isSignedIn;
    refs.topAuthButton.textContent = "Sign in";
  }
  if (refs.landingSignedMinutesMetric) {
    refs.landingSignedMinutesMetric.textContent = String(state.publicStats.totalMinutes);
  }
  if (refs.landingSignedSessionMetric) {
    refs.landingSignedSessionMetric.textContent = String(state.publicStats.totalSessions);
  }
  if (refs.landingSignedLiveMetric) {
    refs.landingSignedLiveMetric.textContent = String(state.publicStats.totalUsers);
  }

  refs.landingLeaderboard.innerHTML = state.leaderboards.landing.length
    ? state.leaderboards.landing.map((entry) => `
      <li>
        <span>#${entry.rank}</span>
        <span>${escapeHtml(entry.name)}</span>
        <strong>${entry.score} pts</strong>
      </li>
    `).join("")
    : `<li class="board-list__empty">No public scores yet.</li>`;

  if (!isSignedIn) {
    refs.profilePanel.hidden = true;
    return;
  }

  const firstName = getFirstName(state.auth.user.displayName || state.auth.user.email || "Workspace");
  mountAvatar(refs.landingUserAvatar, state.auth.user, { sizeClass: "avatar--small" });
  mountAvatar(refs.profilePanelAvatar, state.auth.user);

  // refs.landingUserName.textContent = firstName; // This element was removed from template
  refs.landingHeroTitle.textContent = `${firstName}, your next clean session is one click away.`;
  refs.profilePanelName.textContent = state.auth.user.displayName || "Immersed";
  refs.profilePanelEmail.textContent = state.auth.user.email || "";
  refs.profilePanel.hidden = !state.ui.profileOpen;

  const level = getLevelInfo(state.stats.totalMinutes);
  const goalPercent = Math.min(100, Math.round((state.stats.todayMinutes / DAILY_GOAL_MINUTES) * 100));
  refs.landingGoalProgress.textContent = `${state.stats.todayMinutes} / ${DAILY_GOAL_MINUTES} min`;
  refs.landingGoalFill.style.width = `${goalPercent}%`;
  refs.landingTodayMinutes.textContent = String(state.stats.todayMinutes);
  refs.landingSessionCount.textContent = String(state.stats.totalSessions);
  refs.landingLevelName.textContent = level.name;
  refs.landingTotalScore.textContent = String(state.stats.totalScore);
  refs.landingMemberMessage.textContent = "Your recent progress is ready. Step back in and make the next session count.";
}

function renderWorkspace(state, refs) {
  const showApp = state.route.view === "app" && Boolean(state.auth.user);
  refs.mainApp.hidden = !showApp;
  refs.landingPage.hidden = showApp;
  if (refs.workspacePresencePanel) {
    refs.workspacePresencePanel.hidden = !showApp || refs.workspacePresencePanel.hidden;
  }

  if (refs.ownerDashButton) {
    refs.ownerDashButton.hidden = !showApp || state.auth.user?.uid !== OWNER_UID;
  }

  if (!showApp) {
    return;
  }

  mountAvatar(refs.profileAvatar, state.auth.user, { sizeClass: "avatar--small" });
  mountAvatar(refs.profilePanelAvatar, state.auth.user);
  // refs.profileButtonName.textContent = getFirstName(state.auth.user.displayName || state.auth.user.email || "Workspace"); // Element removed from template
  // refs.profilePanelName.textContent = state.auth.user.displayName || "Immersed"; // Element removed from template
  // refs.profilePanelEmail.textContent = state.auth.user.email || ""; // Element removed from template
  refs.profilePanel.hidden = !state.ui.profileOpen;
  refs.workspaceStreakValue.textContent = String(state.stats.streak);
  refs.workspaceStreakBadge.hidden = false;
  refs.workspaceStreakBadge.dataset.active = state.stats.streak > 0 ? "true" : "false";
  refs.roomModeCountBadge.hidden = state.room.mode !== "room" || state.room.activeCount <= 0;
  refs.roomModeCountBadge.textContent = String(state.room.activeCount);

}

function renderTimer(state, refs) {
  const progress = state.timer.totalTime > 0 ? state.timer.timeLeft / state.timer.totalTime : 0;
  refs.timerValue.textContent = formatClock(state.timer.timeLeft);
  refs.timerPercentLabel.textContent = state.timer.running ? `${Math.round(progress * 100)}%` : "Ready";
  refs.timerPhaseLabel.textContent = state.timer.pomodoroEnabled
    ? `${state.timer.pomodoroPhase === "work" ? "Work" : "Break"} phase`
    : state.timer.running
      ? "In progress"
      : "Ready";
  refs.timerProgress.style.strokeDasharray = `${CIRCLE_LENGTH}`;
  refs.timerProgress.style.strokeDashoffset = `${CIRCLE_LENGTH * (1 - progress)}`;
  refs.timerProgress.classList.toggle("timer-ring__progress--danger", state.timer.running && progress < 0.1);
  refs.timerRing.classList.toggle("session-starting", state.ui.focusPulse);
  refs.timerRing.classList.toggle("is-running", state.timer.running);
  const roomLocked = state.room.mode === "room"
    && Boolean(state.room.currentRoomId)
    && Boolean(state.auth.user?.uid)
    && Boolean(state.room.ownerUid)
    && state.room.ownerUid !== state.auth.user.uid;
  refs.startButton.disabled = state.timer.running || roomLocked;
  refs.stopButton.disabled = !state.timer.running || roomLocked;
  refs.startButton.textContent = roomLocked ? "Owner starts session" : "Start session";

  refs.sessionModeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sessionMode === state.timer.sessionMode);
  });
  refs.modeButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === state.room.mode);
  });
  refs.durationButtons.forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.duration) === state.timer.selectedDuration);
  });
  refs.pomodoroButton.classList.toggle("is-active", state.timer.pomodoroEnabled);
  refs.scorePenaltyLabel.textContent = getScoringDescription(state.timer.sessionMode);
  refs.sessionModeDescription.textContent = SESSION_MODES[state.timer.sessionMode].description;
}

function renderRoom(state, refs) {
  refs.roomPanel.hidden = state.room.mode !== "room";
  refs.roomCodeInput.value = state.room.draftRoomName;
  refs.roomJoinInput.value = state.room.joinCode;
  refs.activeRoomLabel.textContent = state.room.currentRoomName || state.room.currentRoomId || "None";
  refs.activeRoomCodeLabel.textContent = state.room.currentRoomId || "--------";
  refs.roomPresenceCount.textContent = pluralize(state.room.activeCount, "person");
  refs.roomOwnerLabel.textContent = state.room.ownerName || "Waiting";
  refs.roomSyncLabel.textContent = state.room.sessionControl?.status
    ? `${state.room.sessionControl.status[0].toUpperCase()}${state.room.sessionControl.status.slice(1)}`
    : "Idle";
  const currentUid = state.auth.user?.uid;
  refs.roomPresenceList.innerHTML = state.room.participants.length
    ? state.room.participants.map((participant) => `
      <div class="participant-pill${participant.uid === currentUid ? " is-self" : ""}">
        ${createAvatarMarkup(participant, { sizeClass: "avatar--tiny" })}
        <span>${escapeHtml(participant.name)}${participant.uid === currentUid ? " (you)" : ""}</span>
      </div>
    `).join("")
    : `<p class="empty-copy">Nobody else is in this room yet.</p>`;
}

function getPresenceState(participant) {
  if (participant?.distractedAt) {
    return { className: "status-dot--distracted", label: "Distracted" };
  }
  if (participant?.focusing) {
    return { className: "status-dot--focused", label: "Focused" };
  }
  return { className: "status-dot--idle", label: "Idle" };
}

function renderPresenceDashboard(state, refs) {
  const showApp = state.route.view === "app" && Boolean(state.auth.user);
  if (!refs.workspacePresencePanel || !refs.workspacePresenceList) {
    return;
  }

  if (!showApp) {
    refs.workspacePresencePanel.hidden = true;
    refs.workspacePresenceButton?.setAttribute("aria-expanded", "false");
    return;
  }

  const isRoomMode = state.room.mode === "room";
  const participants = isRoomMode ? state.room.participants : [];
  const currentUserId = state.auth.user?.uid || "";
  const me = participants.find((participant) => participant.uid === currentUserId);

  if (refs.workspacePresenceDot) {
    if (!isRoomMode) {
      // Solo mode: determine status from timer state
      const isRunning = state.timer.running;
      const isDistracted = state.timer.blurStartedAt || state.timer.distractionReason;
      
      if (!isRunning) {
        refs.workspacePresenceDot.className = "status-dot status-dot--idle";
      } else if (isDistracted) {
        refs.workspacePresenceDot.className = "status-dot status-dot--distracted";
      } else {
        refs.workspacePresenceDot.className = "status-dot status-dot--focused";
      }
    } else if (me) {
      const presence = getPresenceState(me);
      refs.workspacePresenceDot.className = `status-dot ${presence.className}`;
    } else {
      refs.workspacePresenceDot.className = "status-dot status-dot--focused";
    }
  }

  refs.workspacePresenceList.innerHTML = participants.length
    ? participants.map((participant) => {
      const presence = getPresenceState(participant);
      const name = participant.uid === currentUserId ? `${escapeHtml(participant.name)} (you)` : escapeHtml(participant.name);
      return `
        <li class="presence-item presence-item--detailed">
          <div class="presence-item__primary">
            <span class="status-dot ${presence.className}" aria-hidden="true"></span>
            <span>${name}</span>
            <strong>${presence.label}</strong>
          </div>
        </li>
      `;
    }).join("")
    : '<li class="presence-item presence-item--detailed"><div class="presence-item__primary"><span class="status-dot status-dot--idle" aria-hidden="true"></span><span>No one in room yet</span><strong>Idle</strong></div><small class="presence-item__meta">Switch to room mode to go live.</small></li>';

  const isHost = isRoomMode && Boolean(state.auth.user?.uid) && state.room.ownerUid === state.auth.user.uid;
  if (refs.workspaceHostToggleWrap) {
    refs.workspaceHostToggleWrap.hidden = !isHost;
  }
  if (!isHost && refs.workspaceHostToggle) {
    refs.workspaceHostToggle.checked = false;
  }

  if (refs.workspaceHostPanel) {
    refs.workspaceHostPanel.hidden = !isHost || !refs.workspaceHostToggle?.checked;
  }

  if (refs.workspaceHostList) {
    refs.workspaceHostList.innerHTML = isHost
      ? participants.map((participant) => `
        <li class="host-row">
          <span>${escapeHtml(participant.name)}</span>
          <strong>${participant.distractionCount || 0}</strong>
        </li>
      `).join("")
      : "";
  }

  refs.workspacePresenceButton?.setAttribute("aria-expanded", String(!refs.workspacePresencePanel.hidden));
}
function renderAudio(state, refs) {
  refs.ambientTrackLabel.textContent = state.audio.trackLabel || "No track selected";
  refs.volumeInput.value = String(state.audio.volume);
  refs.soundButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.sound === state.audio.selectedCategory);
  });
}

function renderCalendar(state, refs) {
  const level = getLevelInfo(state.stats.totalMinutes);
  const goalPercent = Math.min(100, Math.round((state.stats.todayMinutes / DAILY_GOAL_MINUTES) * 100));
  const activityDays = new Set(state.stats.activityDays);
  const todayIso = getTodayIsoDay();
  const viewedMonth = state.ui.calendarViewMonth;
  const todayMonth = getMonthKey();
  const monthGrid = getMonthGrid(viewedMonth);
  const firstSessionDay = state.stats.activityDays[0] || null;
  const monthActiveDays = monthGrid.filter((cell) => cell.type === "day" && activityDays.has(cell.iso)).length;

  refs.dailyGoalLabel.textContent = `${state.stats.todayMinutes} / ${DAILY_GOAL_MINUTES} min`;
  refs.dailyGoalFill.style.width = `${goalPercent}%`;
  refs.statsStreakValue.textContent = String(state.stats.streak);
  refs.statsSessionValue.textContent = String(state.stats.totalSessions);
  refs.statsHoursValue.textContent = formatHoursFromMinutes(state.stats.totalMinutes);
  refs.statsLevelValue.textContent = level.name;
  refs.xpCurrentLabel.textContent = `${state.stats.totalMinutes} min`;
  refs.xpNextLabel.textContent = Number.isFinite(level.next) ? `Next: ${level.next} min` : "Top tier reached";
  const xpRange = Number.isFinite(level.next) ? level.next - level.min : 1;
  const xpValue = Number.isFinite(level.next)
    ? Math.min(100, Math.round(((state.stats.totalMinutes - level.min) / xpRange) * 100))
    : 100;
  refs.xpFill.style.width = `${xpValue}%`;
  refs.badgeCountLabel.textContent = `${state.stats.badges.length} / 13`;
  refs.badgeList.innerHTML = state.stats.badges.length
    ? state.stats.badges.map((badge) => `<span class="badge${state.ui.highlightedBadgeId === badge ? " just-unlocked" : ""}">${escapeHtml(badge.replaceAll("_", " "))}</span>`).join("")
    : `<span class="badge badge--muted">No badges yet</span>`;

  refs.calendarToggleLabel.textContent = formatMonthLabel(viewedMonth);
  refs.calendarMetaLabel.textContent = `Best ${state.stats.longestStreak} days`;
  refs.calendarMonthLabel.textContent = formatMonthLabel(viewedMonth);
  refs.calendarNextButton.disabled = viewedMonth >= todayMonth;
  refs.calendarLongestLabel.textContent = `Longest: ${state.stats.longestStreak}d`;
  refs.calendarMonthDaysLabel.textContent = `This month: ${monthActiveDays} days`;

  refs.calendarGrid.innerHTML = monthGrid.map((cell) => {
    if (cell.type === "empty") {
      return `<div class="calendar-day calendar-day--empty" aria-hidden="true"></div>`;
    }

    const isToday = cell.iso === todayIso;
    const isDone = activityDays.has(cell.iso);
    const isFuture = cell.iso > todayIso;
    const isBeforeStart = firstSessionDay ? cell.iso < firstSessionDay : true;
    const isMissed = !isDone && !isFuture && !isBeforeStart;

    return `
      <div class="calendar-day${isDone ? " is-done" : ""}${isMissed ? " is-missed" : ""}${isToday ? " is-today" : ""}${(isFuture || isBeforeStart) ? " is-muted" : ""}">
        <span>${cell.dayNumber}</span>
        ${isDone ? '<strong>&check;</strong>' : '<strong></strong>'}
      </div>
    `;
  }).join("");

  const weekMax = Math.max(...state.stats.weekData, 1);
  refs.weekChart.innerHTML = state.stats.weekData.map((value, index) => `
    <div class="week-chart__bar-wrap">
      <div class="week-chart__bar${index === new Date().getDay() ? " is-today" : ""}" style="height:${Math.max(8, (value / weekMax) * 92)}px"></div>
      <span>${DAY_LABELS[index]}</span>
    </div>
  `).join("");
  const activeWeekDays = state.stats.weekData.filter((value) => value > 0).length;
  refs.weekConsistencyLabel.textContent = `${Math.round((activeWeekDays / 7) * 100)}% consistency`;

  // Profile panel stats elements removed from template - commenting out to prevent errors
  // refs.profilePanelLevel.textContent = level.name;
  // refs.profilePanelStreak.textContent = String(state.stats.streak);
  // refs.profilePanelSessions.textContent = String(state.stats.totalSessions);
  // refs.profilePanelHours.textContent = formatHoursFromMinutes(state.stats.totalMinutes);
  // refs.profilePanelScore.textContent = String(state.stats.totalScore);
}

function renderHistory(state, refs) {
  const expandedIds = new Set(state.ui.expandedHistoryIds);
  refs.historyList.innerHTML = state.history.length
    ? state.history.map((session) => `
      <li class="history-item${expandedIds.has(session.id) ? " expanded" : ""}" data-action="toggle-history-item" data-history-id="${session.id}" tabindex="0">
        <strong class="history-item__goal">${escapeHtml(session.goal)}</strong>
        <span>${escapeHtml(session.dateLabel)} - ${formatClock(session.timeSpent)} - ${session.distractions} distractions - ${session.score} pts</span>
        <div class="history-item__details">
          <span>Mode: ${escapeHtml(session.sessionMode || "normal")}</span>
          <span>Distractions: ${session.distractions}</span>
          <span>Score: ${session.score} pts</span>
          <span>Penalty: -${session.penaltyTotal || 0}</span>
        </div>
      </li>
    `).join("")
    : `<li class="history-item history-item--empty">No sessions yet. Start one to build history.</li>`;
}

function renderLeaderboards(state, refs) {
  refs.boardButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.board === state.ui.roomBoard);
  });
  refs.globalLeaderboard.hidden = state.ui.roomBoard !== "global";
  refs.roomLeaderboard.hidden = state.ui.roomBoard !== "room";

  refs.globalLeaderboard.innerHTML = state.leaderboards.global.length
    ? state.leaderboards.global.map((entry) => `
      <li class="${entry.id === state.auth.user?.uid ? "is-mine" : ""}">
        <span>#${entry.rank}</span>
        <span>${escapeHtml(entry.name)}</span>
        <strong>${entry.score} pts</strong>
      </li>
    `).join("")
    : `<li class="board-list__empty">No global entries yet.</li>`;

  refs.roomLeaderboard.innerHTML = state.room.currentRoomId
    ? (state.leaderboards.room.length
      ? state.leaderboards.room.map((entry) => `
        <li class="${entry.uid === state.auth.user?.uid ? "is-mine" : ""}">
          <span>#${entry.rank}</span>
          <span>${escapeHtml(entry.name)}</span>
          <strong>${entry.score} pts</strong>
        </li>
      `).join("")
      : `<li class="board-list__empty">No room scores yet.</li>`)
    : `<li class="board-list__empty">Join or create a room to see room standings.</li>`;
}

function renderSummary(state, refs) {
  const result = state.session.lastResult;
  refs.sessionSummary.hidden = !result;

  if (!result) {
    return;
  }

  refs.summaryHeadline.textContent = result.completed ? "Session complete" : "Session stopped";
  refs.summaryTimeValue.textContent = formatClock(result.timeSpent);
  refs.summaryScoreValue.textContent = String(result.score);
  refs.saveStateBadge.textContent = state.session.saveState;
  refs.saveStateBadge.className = `status-badge status-badge--${state.session.saveState}`;

  const sessionSeconds = result.timeSpent || 0;
  
  // Calculate distraction count - in multi-tab mode, context switches after 5 count as distractions
  const isMultiTabMode = result.tabMode === "multitab";
  const baseDistractions = result.realDistractions ?? result.distractions ?? 0;
  const contextSwitches = result.contextSwitches ?? 0;
  let distractionCount = baseDistractions;
  
  if (isMultiTabMode && contextSwitches > 5) {
    distractionCount = baseDistractions + (contextSwitches - 5);
  }
  
  // Handle short session vs normal session display
  if (sessionSeconds < 60) {
    // Short session: hide distractions and focus cards, show notice
    if (refs.summaryDistractionsCard) refs.summaryDistractionsCard.hidden = true;
    if (refs.summaryFocusCard) refs.summaryFocusCard.hidden = true;
    if (refs.shortSessionNotice) refs.shortSessionNotice.hidden = false;
    
    // Simple feedback for short sessions
    refs.sessionFeedback.textContent = "Short session. Try focusing for at least 1 minute.";
    
    // Hide distraction log for short sessions
    refs.distractionLog.hidden = true;
  } else {
    // Normal session: show all metrics, hide notice
    if (refs.summaryDistractionsCard) {
      refs.summaryDistractionsCard.hidden = false;
      refs.summaryDistractionValue.textContent = String(distractionCount);
    }
    if (refs.summaryFocusCard) {
      refs.summaryFocusCard.hidden = false;
      const efficiency = result.efficiency ?? result.focusPercentage ?? 0;
      refs.summaryFocusValue.textContent = `${efficiency}%`;
      refs.summaryFocusValue.style.color = "";
    }
    if (refs.shortSessionNotice) refs.shortSessionNotice.hidden = true;
    refs.distractionLog.hidden = false;
    
    // Time-based feedback for sessions >= 60 seconds
    if (sessionSeconds < 300) {
      // 1-5 minutes
      refs.sessionFeedback.textContent = "Good start. Build longer focus sessions.";
    } else {
      // 5+ minutes
      if (distractionCount === 0) {
        refs.sessionFeedback.textContent = "Strong focus. Keep it consistent.";
      } else if (distractionCount === 1) {
        refs.sessionFeedback.textContent = "Strong session. One distraction, but you stayed with the work.";
      } else if (distractionCount <= 3) {
        refs.sessionFeedback.textContent = "Good effort. A few distractions, but you kept going.";
      } else {
        refs.sessionFeedback.textContent = "Tough session. Consider trying single-tab mode for deeper focus.";
      }
    }
    
    // Dynamic distraction log based on tab mode
    const hasDistractions = result.distractionLog?.length > 0;
    const hasContextSwitches = result.contextSwitchLog?.length > 0;
    
    if (hasDistractions) {
      // Show real distractions
      refs.distractionLog.innerHTML = result.distractionLog.map((item) => `
        <div class="log-row">
          <span>${escapeHtml(item.reason)}</span>
          <strong>${item.duration}s / -${item.penalty}</strong>
        </div>
      `).join("");
    } else if (isMultiTabMode && hasContextSwitches) {
      // Multi-tab mode: show context switches
      refs.distractionLog.innerHTML = result.contextSwitchLog.map((item, index) => `
        <div class="log-row${index < 5 ? '' : ' log-row--penalty'}">
          <span>${escapeHtml(item.reason)} ${index < 5 ? '(free)' : '(counts as distraction)'}</span>
          <strong>${item.duration}s / -${item.penalty}</strong>
        </div>
      `).join("");
    } else {
      // No distractions recorded
      refs.distractionLog.innerHTML = `<div class="log-row log-row--empty">${isMultiTabMode ? 'No distractions recorded. First 5 tab switches are free.' : 'No distractions recorded.'}</div>`;
    }
  }
}

function renderPanels(state, refs) {
  refs.progressSection.hidden = !state.ui.sections.progress;
  refs.historySection.hidden = !state.ui.sections.history;
  refs.leaderboardSection.hidden = !state.ui.sections.leaderboard;
  refs.calendarSection.hidden = !state.ui.sections.calendar;
}

function renderFeedbackState(state, refs) {
  refs.workspaceBanner.hidden = !state.ui.banner;
  refs.workspaceBanner.textContent = state.ui.banner?.message || "";
  refs.workspaceBanner.className = `workspace-banner${state.ui.banner ? ` workspace-banner--${state.ui.banner.type}` : ""}`;

  refs.distractionModal.hidden = !state.ui.distractionModal;
  refs.distractionModalText.textContent = state.ui.distractionModal?.message || "";

  refs.badgeModal.hidden = !state.ui.badgeModal;
  refs.badgeModalTitle.textContent = state.ui.badgeModal?.title || "Badge unlocked";
  refs.badgeModalText.textContent = state.ui.badgeModal?.message || "";
}

function renderOwnerDashboard(state, refs) {
  refs.ownerDashboard.hidden = !state.ui.ownerDashboardOpen;
  refs.ownerRoomSelect.innerHTML = state.owner.rooms.length
    ? state.owner.rooms.map((room) => `<option value="${escapeHtml(room.id)}"${room.id === state.owner.selectedRoomId ? " selected" : ""}>${escapeHtml(room.name)}</option>`).join("")
    : '<option value="">No active rooms</option>';
  refs.odTotalParticipants.textContent = String(state.owner.summary.total);
  refs.odFocusingCount.textContent = String(state.owner.summary.focusing);
  refs.odDistractedCount.textContent = String(state.owner.summary.distracted);
  refs.odLeftCount.textContent = String(state.owner.summary.left);
  refs.odParticipants.innerHTML = state.owner.participants.length
    ? state.owner.participants.map((participant) => {
      const status = participant.leftAt
        ? { label: "Left", className: "is-left" }
        : participant.distractedAt
          ? { label: "Distracted", className: "is-distracted" }
          : participant.focusing
            ? { label: "Focusing", className: "is-focusing" }
            : { label: "Waiting", className: "is-waiting" };
      const elapsedSeconds = participant.sessionStarted && participant.focusing
        ? Math.max(0, Math.floor((state.ui.ownerNow - participant.sessionStarted) / 1000))
        : 0;

      return `
        <article class="owner-card ${status.className}">
          <div class="meta-grid">
            <article class="meta-card">
              <span class="meta-card__label">Scoring</span>
              <strong id="scoreRuleLabel">+10 points per minute</strong>
              <p id="scorePenaltyLabel" class="meta-card__body"></p>
            </article>
          </div>
          <div class="owner-card__meta">
            <span class="owner-card__badge${participant.distractionCount > 0 ? ' owner-card__badge--alert' : ''}">${participant.distractionCount} distractions</span>
            <strong>${elapsedSeconds ? formatClockWithHours(elapsedSeconds) : "00:00"}</strong>
          </div>
          <div class="owner-card__header">
            ${createAvatarMarkup(participant)}
            <div>
              <strong>${escapeHtml(participant.name)}</strong>
              <span class="owner-status-pill ${status.className}">${status.label}</span>
            </div>
          </div>
          <p class="owner-card__subtext">${participant.leftAt ? `Left ${formatTimeAgo(participant.leftAt, state.ui.ownerNow)}` : participant.awayDuration ? `Away ${participant.awayDuration}s` : "Listening for movement"}</p>
        </article>
      `;
    }).join("")
    : '<p class="empty-copy">Select an active room to monitor presence.</p>';

  refs.odEventLog.innerHTML = state.owner.eventLog.length
    ? state.owner.eventLog.map((entry) => `
      <div class="owner-log-row owner-log-row--${entry.type}">
        <strong>${new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</strong>
        <span>${escapeHtml(entry.message)}</span>
      </div>
    `).join("")
    : '<div class="owner-log-row"><span>Events will appear here.</span></div>';
}

function renderTheme(state, refs) {
  document.body.dataset.theme = state.ui.theme;
  
  // Update theme toggle buttons with new structure
  if (refs.themeToggleButton) {
    refs.themeToggleButton.dataset.theme = state.ui.theme;
  }
  if (refs.landingThemeToggleButton) {
    refs.landingThemeToggleButton.dataset.theme = state.ui.theme;
  }
  
  // Update old labels if they exist (for backward compatibility)
  if (refs.themeButtonLabel) {
    refs.themeButtonLabel.textContent = state.ui.theme === "dark" ? "Dark" : "Light";
  }
  if (refs.landingThemeButtonLabel) {
    refs.landingThemeButtonLabel.textContent = state.ui.theme === "dark" ? "Dark" : "Light";
  }
  if (refs.profileThemeLabel) {
    refs.profileThemeLabel.textContent = state.ui.theme === "dark" ? "Dark" : "Light";
  }
  if (refs.notificationLabel) {
    refs.notificationLabel.textContent = state.ui.notificationsEnabled ? "On" : "Off";
  }
  if (refs.tabModeLabel) {
    refs.tabModeLabel.textContent = state.ui.tabMode === "multitab" ? "Multi-tab" : "Single-tab";
  }
  if (refs.tabModeIndicatorText) {
    refs.tabModeIndicatorText.textContent = state.ui.tabMode === "multitab" ? "Multi-tab mode" : "Single-tab mode";
  }
}

function renderLoader(state, refs) {
  refs.loader.classList.toggle("is-hidden", !state.auth.loading);
}

function renderTabModePanel(state, refs) {
  if (refs.tabModePanel) {
    refs.tabModePanel.hidden = !state.ui.showTabModePanel;
  }
}

export function createRenderer(refs) {
  return function render(state) {
    renderLoader(state, refs);
    renderTheme(state, refs);
    renderTabModePanel(state, refs);
    renderToasts(state.ui.toasts, refs);
    renderLanding(state, refs);
    renderWorkspace(state, refs);
    renderTimer(state, refs);
    renderRoom(state, refs);
    renderPresenceDashboard(state, refs);
    renderAudio(state, refs);
    renderCalendar(state, refs);
    renderHistory(state, refs);
    renderLeaderboards(state, refs);
    renderSummary(state, refs);
    renderPanels(state, refs);
    renderFeedbackState(state, refs);
    renderOwnerDashboard(state, refs);
    refs.quoteBar.textContent = state.ui.quote;
    document.title = state.route.view === "app" && state.timer.running
      ? `${refs.timerValue.textContent} | ${APP_TITLE}`
      : DEFAULT_TITLE;
    hydrateAvatarImages(refs.root);
    return state;
  };
}













