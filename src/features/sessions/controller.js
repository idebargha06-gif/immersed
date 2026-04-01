import { getRandomQuote } from "../../utils/constants.js";
import {
  calculateEfficiency,
  calculateSessionScore,
  getFocusRating,
  calculateMomentum,
  shouldResetStreak
} from "../../utils/scoring.js";

export function createSessionsController({
  store,
  repository,
  timer,
  stats,
  rooms,
  leaderboards,
  audio,
  feedback
}) {
  function resetSummaryState() {
    store.setState((state) => ({
      ...state,
      session: {
        ...state.session,
        lastResult: null,
        saveState: "idle"
      },
      ui: {
        ...state.ui,
        highlightedBadgeId: ""
      }
    }));
  }

  function rotateQuote() {
    store.setState((state) => ({
      ...state,
      ui: {
        ...state.ui,
        quote: getRandomQuote(state.ui.quote)
      }
    }));
  }

  function pulseTimerRing() {
    store.setState((state) => ({
      ...state,
      ui: {
        ...state.ui,
        focusPulse: true
      }
    }));

    window.setTimeout(() => {
      store.setState((state) => ({
        ...state,
        ui: {
          ...state.ui,
          focusPulse: false
        }
      }));
    }, 700);
  }

  function setSummaryState(result, saveState = "saving") {
    store.setState((current) => ({
      ...current,
      session: {
        ...current.session,
        lastResult: result,
        saveState
      }
    }));
  }

  async function startSession(options = {}) {
    const state = store.getState();
    const isRemote = Boolean(options.remoteControl);

    if (!state.auth.user) {
      feedback.notify({
        type: "warning",
        title: "Sign in required",
        message: "Use Google sign-in before starting a tracked session."
      });
      return;
    }

    if (!isRemote && (!state.timer.selectedDuration || state.timer.selectedDuration <= 0)) {
      feedback.notify({
        type: "warning",
        title: "Choose a duration",
        message: "Select a duration or custom minute count before starting."
      });
      return;
    }

    if (state.room.mode === "room" && state.room.currentRoomId && state.room.ownerUid && state.room.ownerUid !== state.auth.user.uid && !isRemote) {
      feedback.notify({
        type: "warning",
        title: "Room owner controls this timer",
        message: `${state.room.ownerName || "The room owner"} starts and stops shared room sessions.`
      });
      return;
    }

    if (state.room.mode === "room" && !state.room.currentRoomId) {
      feedback.notify({
        type: "warning",
        title: "Room missing",
        message: "Join or create a room before starting a room session."
      });
      return;
    }

    if (options.remoteControl) {
      store.setState((current) => ({
        ...current,
        session: {
          ...current.session,
          focusGoal: options.remoteControl.focusGoal || current.session.focusGoal
        }
      }));
      timer.syncRemoteTimer(options.remoteControl);
    } else {
      timer.start();
    }

    const liveTimer = store.getState().timer;
    const startedAt = options.remoteControl?.startedAt || liveTimer.phaseStartedAt || Date.now();

    if (state.room.mode === "room" && state.room.currentRoomId && !options.remoteControl) {
      await rooms.publishTimerStart({
        startedAt,
        totalTime: liveTimer.totalTime,
        selectedDuration: liveTimer.selectedDuration,
        sessionMode: liveTimer.sessionMode,
        pomodoroEnabled: liveTimer.pomodoroEnabled,
        pomodoroPhase: liveTimer.pomodoroPhase,
        pomodoroCycle: liveTimer.pomodoroCycle,
        cumulativeFocusSeconds: liveTimer.cumulativeFocusSeconds,
        focusGoal: store.getState().session.focusGoal
      });
    }

    resetSummaryState();
    pulseTimerRing();
    audio.handleSessionStart();
    feedback.setBanner("Session in progress. Stay with the work.", "neutral");
    await rooms.startPresence();
    rooms.updatePresence({ focusing: true, sessionStarted: startedAt, distractedAt: 0, awayDuration: 0, distractionCount: 0, leftAt: 0, active: true }).catch(() => {});
  }

  async function finalizeSession(completed = false, options = {}) {
    const state = store.getState();
    if (!state.timer.running && !completed) {
      return;
    }

    const diagnostics = timer.getSessionDiagnostics();
    timer.stopRuntime();
    timer.clearAfterSession();
    audio.handleSessionStop();
    feedback.setBanner("");
    rooms.updatePresence({ focusing: false, distractedAt: 0, awayDuration: 0 }).catch(() => {});

    // Calculate bonuses - strict requirements
    const bonuses = { ...diagnostics.bonuses };
    
    // Clean Session bonus: NO real distractions (strict)
    if (diagnostics.realDistractions === 0 && diagnostics.idleEventCount === 0) {
      bonuses.cleanSession = true;
    } else {
      bonuses.cleanSession = false;
    }
    
    // Consistency bonus: NO idle events AND no real distractions
    if (diagnostics.idleEventCount === 0 && diagnostics.realDistractions === 0) {
      bonuses.consistency = true;
    } else {
      bonuses.consistency = false;
    }
    
    // Deep focus bonus: 5+ minutes focused with NO distractions at all
    const fiveMinutes = 5 * 60;
    if (diagnostics.timeSpent >= fiveMinutes && 
        diagnostics.realDistractions === 0 && 
        diagnostics.idleEventCount === 0 &&
        diagnostics.contextSwitches <= 2) {
      bonuses.deepFocus = true;
    } else {
      bonuses.deepFocus = false;
    }
    
    // Recovery bonus: had distraction but continued (session > 2 min after distraction)
    if (diagnostics.recoveryDetected && diagnostics.realDistractions > 0) {
      bonuses.recovery = true;
    } else {
      bonuses.recovery = false;
    }

    // Calculate penalties
    const penalties = {
      distraction: diagnostics.realDistractions * 15,
      contextSwitch: Math.max(0, diagnostics.contextSwitches - 5) * 2,
      idle: diagnostics.idleEvents * 20,
      total: 0
    };
    penalties.total = penalties.distraction + penalties.contextSwitch + penalties.idle;

    // Calculate score with bonuses
    const scoreData = calculateSessionScore(diagnostics.timeSpent, bonuses, penalties);
    
    // Calculate efficiency based on focused time minus penalty impact
    // Efficiency = (actual_focus_quality / total_time) * 100
    // Where focus quality = focusedSeconds - (penalty impact on perceived focus)
    const totalPenalties = penalties.total;
    const penaltyImpact = totalPenalties * 2; // Each penalty point reduces efficiency more
    const effectiveFocusTime = Math.max(0, diagnostics.timeSpent - penaltyImpact);
    const efficiency = calculateEfficiency(effectiveFocusTime, diagnostics.totalSessionTime);
    
    // Only get focus rating if efficiency is meaningful
    const focusRating = efficiency >= 50 ? getFocusRating(efficiency) : null;
    
    // Calculate momentum (compare with previous session)
    const previousResult = state.session.lastResult;
    const momentum = calculateMomentum(scoreData.total, previousResult?.score);
    
    // Update streak
    const sessionMinutes = Math.floor(diagnostics.timeSpent / 60);
    const shouldReset = shouldResetStreak(sessionMinutes, diagnostics.realDistractions);
    let streak = state.stats?.streak || 0;
    if (shouldReset) {
      streak = 0;
    } else if (completed || sessionMinutes >= 2) {
      streak += 1;
    }

    // Generate smart feedback messages
    const smartFeedback = generateSmartFeedback(diagnostics, efficiency, scoreData.bonusBreakdown);

    const result = {
      ...diagnostics,
      completed,
      goal: state.session.focusGoal || "Untitled session",
      score: scoreData.total,
      basePoints: scoreData.basePoints,
      bonusPoints: scoreData.bonusPoints,
      bonusBreakdown: scoreData.bonusBreakdown,
      penaltyBreakdown: penalties,
      efficiency,
      focusRating,
      momentum,
      streak,
      feedback: smartFeedback,
      nextActionSuggestion: generateNextAction(diagnostics, efficiency)
    };

    if (!result.timeSpent) {
      setSummaryState(null, "idle");
      return;
    }

    rotateQuote();

    if (state.ui.notificationsEnabled && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Immersed session ready", {
          body: `${result.score} points earned in ${Math.floor(result.timeSpent / 60)}m ${result.timeSpent % 60}s.`
        });
      } catch (error) {
        // Ignore notification issues.
      }
    }

    setSummaryState(result, "saving");

    if (!state.auth.user) {
      setSummaryState(result, "idle");
      return;
    }

    if (state.room.mode === "room" && state.room.currentRoomId && state.room.ownerUid === state.auth.user.uid && !options.skipRoomSync) {
      await rooms.publishTimerStop({ completed, focusGoal: result.goal });
    }

    const previousBadges = new Set(state.stats.badges);

    try {
      const workspace = await repository.saveSession({
        user: state.auth.user,
        roomId: state.room.mode === "room" ? state.room.currentRoomId : "",
        sessionResult: result
      });

      store.setState((current) => ({
        ...current,
        stats: {
          ...current.stats,
          ...workspace.stats,
          streak: result.streak
        },
        history: workspace.history,
        session: {
          ...current.session,
          saveState: "saved",
          lastResult: result
        }
      }));

      // Check badges
      const { checkBadges } = await import("../../utils/scoring.js");
      const nextBadges = checkBadges(workspace.stats);
      const unlocked = nextBadges.find((badge) => !previousBadges.has(badge));
      if (unlocked) {
        store.setState((current) => ({
          ...current,
          ui: {
            ...current.ui,
            highlightedBadgeId: unlocked
          }
        }));
        window.setTimeout(() => {
          store.setState((current) => ({
            ...current,
            ui: {
              ...current.ui,
              highlightedBadgeId: current.ui.highlightedBadgeId === unlocked ? "" : current.ui.highlightedBadgeId
            }
          }));
        }, 2200);
        feedback.showBadgeModal("New badge", `You unlocked ${unlocked.replaceAll("_", " ")}.`);
      }

      await leaderboards.refreshPublicStats();
      if (state.room.currentRoomId) {
        leaderboards.startRoom(state.room.currentRoomId);
      }

      feedback.notify({
        type: "success",
        title: "Session saved",
        message: `Focus result stored with ${result.score} points.`
      });
    } catch (error) {
      store.setState((current) => ({
        ...current,
        session: {
          ...current.session,
          saveState: "error",
          lastResult: result
        }
      }));

      feedback.notify({
        type: "error",
        title: "Save failed",
        message: "The session summary is still visible, but the backend write did not complete."
      });
    }
  }

  function generateSmartFeedback(diagnostics, efficiency, bonusBreakdown) {
    const messages = [];
    
    // Check for early switch
    const hasEarlySwitch = diagnostics.distractionLog?.some(d => d.isPanicSwitch);
    if (hasEarlySwitch) {
      messages.push("⚠️ Early switch detected");
    }
    
    // Recovery feedback
    if (diagnostics.recoveryDetected) {
      messages.push("🔄 Great recovery after distraction");
    }
    
    // Deep focus feedback
    if (bonusBreakdown?.deepFocus) {
      messages.push("🔥 Strong deep focus session");
    }
    
    // Clean session
    if (bonusBreakdown?.cleanSession) {
      messages.push("✨ Perfect focus - no distractions!");
    }
    
    // Too many switches
    if (diagnostics.contextSwitches > 8) {
      messages.push("📊 Many switches - try single-tab mode for deep work");
    }
    
    // Low efficiency warning
    if (efficiency < 50) {
      messages.push("💡 Consider shorter sessions to build focus");
    }
    
    return messages.length > 0 ? messages : ["Good focus session!"];
  }

  function generateNextAction(diagnostics, efficiency) {
    if (diagnostics.realDistractions > 3) {
      return "Try single-tab mode to minimize distractions";
    }
    if (diagnostics.contextSwitches > 5) {
      return "Reduce switching frequency - batch your tasks";
    }
    if (efficiency > 90 && diagnostics.timeSpent > 600) {
      return "Excellent! Try a longer session next time";
    }
    if (diagnostics.timeSpent < 120) {
      return "Aim for at least 5 minutes of focused time";
    }
    return "Try 10 minutes without switching";
  }

  async function stopSession() {
    await finalizeSession(false);
  }

  async function handleTimerCompletion() {
    audio.playBell();
    await finalizeSession(true);
  }

  async function startRemoteSession(control) {
    await startSession({ remoteControl: control });
  }

  async function stopRemoteSession({ completed = false } = {}) {
    await finalizeSession(completed, { skipRoomSync: true });
  }

  async function shareLastSession() {
    const result = store.getState().session.lastResult;
    if (!result) {
      return;
    }

    const appUrl = window.location.origin;
    const realDistractions = result.realDistractions ?? result.distractions ?? 0;
    const contextSwitches = result.contextSwitches ?? 0;
    const idleEvents = result.idleEvents ?? 0;
    
    const text = [
      "Immersed",
      `Goal: ${store.getState().session.focusGoal || "Deep work"}`,
      `Time: ${Math.floor(result.timeSpent / 60)}m ${result.timeSpent % 60}s`,
      `Real distractions: ${realDistractions}`,
      `Context switches: ${contextSwitches} (tracked, no penalty)`,
      `Idle events: ${idleEvents}`,
      `Score: ${result.score} pts`,
      "",
      "Join me on Immersed and start your next clean focus session:",
      appUrl
    ].join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Immersed session",
          text,
          url: appUrl
        });
      } else {
        await navigator.clipboard.writeText(text);
        feedback.notify({
          type: "success",
          title: "Summary copied",
          message: "The session summary and app invite were copied to your clipboard."
        });
      }
    } catch (error) {
      feedback.notify({ type: "warning", title: "Share cancelled", message: "No summary was shared." });
    }
  }

  function toggleStartStop() {
    if (store.getState().timer.running) {
      stopSession();
      return;
    }

    startSession();
  }

  return {
    startSession,
    stopSession,
    handleTimerCompletion,
    startRemoteSession,
    stopRemoteSession,
    shareLastSession,
    toggleStartStop
  };
}


