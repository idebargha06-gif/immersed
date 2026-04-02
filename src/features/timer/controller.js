import {
  IDLE_THRESHOLD_MS,
  IDLE_NUDGE_MS,
  SESSION_MODES,
  TIMER_TICK_MS,
  REAL_DISTRACTION_PENALTY,
  CONTEXT_SWITCH_PENALTY,
  CONTEXT_SWITCH_FREE_LIMIT,
  IDLE_PENALTY,
  PANIC_SWITCH_PENALTY_SINGLE,
  PANIC_SWITCH_PENALTY_MULTI,
  DEEP_FOCUS_THRESHOLD_MINUTES
} from "../../utils/constants.js";
import { calculateContextSwitchPenalty } from "../../utils/scoring.js";
import { getNextPomodoroPhase, getPomodoroPhaseConfig, getPreciseTimeLeft } from "../../utils/timer.js";

export function createTimerController({ store, feedback }) {
  let tickId = null;
  let idleId = null;
  let awayPenaltyId = null;
  let idleNudgeShown = false;
  const handlers = {
    onToggleSession: null,
    onEscape: null,
    onSessionFinished: null,
    onDistraction: null,
    onDistractionCleared: null,
    onContextSwitch: null,
    onIdleNudge: null
  };

  function setHandlers(nextHandlers) {
    Object.assign(handlers, nextHandlers);
  }

  function stopIntervals() {
    if (tickId) {
      window.clearInterval(tickId);
      tickId = null;
    }
    if (idleId) {
      window.clearInterval(idleId);
      idleId = null;
    }
    if (awayPenaltyId) {
      window.clearInterval(awayPenaltyId);
      awayPenaltyId = null;
    }
  }

  function stopAwayPenaltyTimer() {
    if (awayPenaltyId) {
      window.clearInterval(awayPenaltyId);
      awayPenaltyId = null;
    }
  }

  function startAwayPenaltyTimer(blurStartedAt) {
    stopAwayPenaltyTimer();
    const state = store.getState();
    const isSingleTabMode = state.ui?.tabMode === "singletab";
    
    // Only run penalty accumulation in single-tab mode
    if (!isSingleTabMode) {
      return;
    }

    // Track accumulated penalty while away (logged once when user returns)
    let accumulatedPenalty = 0;
    let lastPenaltyAt = 0;

    awayPenaltyId = window.setInterval(() => {
      const currentState = store.getState();
      if (!currentState.timer.running || !currentState.timer.blurStartedAt) {
        stopAwayPenaltyTimer();
        return;
      }

      const awaySeconds = Math.floor((Date.now() - blurStartedAt) / 1000);
      const penalty = 3; // -3 points every 30 seconds while away
      accumulatedPenalty += penalty;
      lastPenaltyAt = awaySeconds;

      // Accumulate penalty in state (single consolidated entry will be logged on return)
      store.setState((current) => ({
        ...current,
        timer: {
          ...current.timer,
          awayPenaltyAccumulated: accumulatedPenalty,
          awayPenaltyDuration: awaySeconds
        }
      }));
    }, 30000); // Every 30 seconds
  }

  function beginTicker() {
    stopIntervals();

    tickId = window.setInterval(() => {
      const state = store.getState();
      if (!state.timer.running) {
        return;
      }

      const nextTimeLeft = getPreciseTimeLeft(state.timer.phaseStartedAt, state.timer.phaseInitialTime);
      store.setState((current) => ({
        ...current,
        timer: {
          ...current.timer,
          timeLeft: nextTimeLeft
        }
      }));

      if (nextTimeLeft <= 0) {
        if (state.timer.pomodoroEnabled) {
          const nextPhase = getNextPomodoroPhase(state.timer.pomodoroPhase, state.timer.pomodoroCycle);
          const focusCarry = state.timer.pomodoroPhase === "work"
            ? state.timer.cumulativeFocusSeconds + state.timer.phaseInitialTime
            : state.timer.cumulativeFocusSeconds;

          store.setState((current) => ({
            ...current,
            timer: {
              ...current.timer,
              cumulativeFocusSeconds: focusCarry,
              pomodoroPhase: nextPhase.phase,
              pomodoroCycle: nextPhase.cycle,
              totalTime: nextPhase.totalTime,
              timeLeft: nextPhase.totalTime,
              phaseStartedAt: Date.now(),
              phaseInitialTime: nextPhase.totalTime
            }
          }));
          return;
        }

        stopRuntime();
        handlers.onSessionFinished?.(true);
      }
    }, TIMER_TICK_MS);

    idleId = window.setInterval(() => {
      const state = store.getState();
      if (!state.timer.running) {
        return;
      }

      const idleDuration = Date.now() - state.timer.lastActivityAt;
      const isTabActive = document.visibilityState === "visible";

      // Only check idle if tab is active and threshold reached
      if (isTabActive && idleDuration > IDLE_THRESHOLD_MS) {
        if (!idleNudgeShown && !state.timer.idleNudgeAt) {
          // Show gentle nudge first
          idleNudgeShown = true;
          store.setState((current) => ({
            ...current,
            timer: {
              ...current.timer,
              idleNudgeAt: Date.now()
            }
          }));
          feedback.setBanner("🤔 Still there? Tap anywhere to confirm you're focused");
          handlers.onIdleNudge?.();
        } else if (state.timer.idleNudgeAt && Date.now() - state.timer.idleNudgeAt > IDLE_NUDGE_MS) {
          // 60 seconds passed since nudge, record idle event
          recordIdleEvent(Math.floor(idleDuration / 1000));
          idleNudgeShown = false;
          store.setState((current) => ({
            ...current,
            timer: {
              ...current.timer,
              lastActivityAt: Date.now(),
              idleNudgeAt: null
            }
          }));
          feedback.setBanner("");
        }
      } else if (idleDuration < IDLE_THRESHOLD_MS && state.timer.idleNudgeAt) {
        // User became active again, clear nudge
        idleNudgeShown = false;
        store.setState((current) => ({
          ...current,
          timer: {
            ...current.timer,
            idleNudgeAt: null
          }
        }));
        feedback.setBanner("");
      }
    }, 30000);
  }

  function setDuration(seconds) {
    const state = store.getState();
    if (state.timer.running) {
      return;
    }

    store.setState((current) => ({
      ...current,
      timer: {
        ...current.timer,
        selectedDuration: seconds,
        totalTime: seconds,
        timeLeft: seconds,
        phaseStartedAt: null,
        phaseInitialTime: seconds,
        pomodoroEnabled: false,
        pomodoroPhase: "work",
        pomodoroCycle: 0,
        cumulativeFocusSeconds: 0
      }
    }));
  }

  function applyCustomMinutes(minutes) {
    const safeMinutes = Number(minutes);
    if (!safeMinutes || safeMinutes < 1) {
      return false;
    }

    setDuration(safeMinutes * 60);
    return true;
  }

  function togglePomodoro() {
    const state = store.getState();
    if (state.timer.running) {
      return;
    }

    if (state.timer.pomodoroEnabled) {
      setDuration(state.timer.selectedDuration);
      return;
    }

    const workConfig = getPomodoroPhaseConfig("work");
    store.setState((current) => ({
      ...current,
      timer: {
        ...current.timer,
        pomodoroEnabled: true,
        pomodoroPhase: workConfig.phase,
        pomodoroCycle: 0,
        cumulativeFocusSeconds: 0,
        totalTime: workConfig.totalTime,
        timeLeft: workConfig.totalTime,
        phaseInitialTime: workConfig.totalTime,
        phaseStartedAt: null
      }
    }));
  }

  function start() {
    const state = store.getState();
    if (state.timer.running) {
      return null;
    }

    const initialTime = state.timer.timeLeft > 0 ? state.timer.timeLeft : state.timer.selectedDuration;
    const now = Date.now();

    store.setState((current) => ({
      ...current,
      timer: {
        ...current.timer,
        running: true,
        phaseStartedAt: now,
        sessionStartedAt: now,
        totalTime: initialTime,
        timeLeft: initialTime,
        phaseInitialTime: initialTime,
        distractionCount: 0,
        realDistractionCount: 0,
        contextSwitchCount: 0,
        idleEventCount: 0,
        distractionPenaltyTotal: 0,
        idlePenaltyTotal: 0,
        contextSwitchPenaltyTotal: 0,
        distractionLog: [],
        contextSwitchLog: [],
        idleLog: [],
        blurStartedAt: null,
        lastActivityAt: now,
        cumulativeFocusSeconds: current.timer.pomodoroEnabled ? 0 : current.timer.cumulativeFocusSeconds,
        distractionHandled: false,
        idleNudgeAt: null,
        basePoints: 0,
        bonusPoints: 0,
        bonuses: {
          cleanSession: false,
          deepFocus: false,
          consistency: false,
          recovery: false
        },
        deepFocusStartTime: null,
        lastSwitchTime: null,
        recoveryDetected: false
      }
    }));
    idleNudgeShown = false;
    beginTicker();
    return now;
  }

  function stopRuntime() {
    stopIntervals();
    store.setState((state) => ({
      ...state,
      timer: {
        ...state.timer,
        running: false,
        blurStartedAt: null,
        distractionHandled: false
      }
    }));
  }

  function syncRemoteTimer(control) {
    if (!control?.startedAt) {
      return;
    }

    // Calculate time left, accounting for potential network delay on initial sync
    // If timer just started (within 5 seconds) or isInitialSync flag is set, 
    // use full initial time to avoid network delay causing timer to start at 25:01 instead of 25:00
    const elapsed = Math.floor((Date.now() - control.startedAt) / 1000);
    let nextTimeLeft;
    if (control.isInitialSync || elapsed <= 5) {
      // Timer just started - use full time to sync all participants exactly
      nextTimeLeft = control.totalTime;
    } else {
      // Timer running for a while - calculate precise time left
      nextTimeLeft = getPreciseTimeLeft(control.startedAt, control.totalTime);
    }

    stopIntervals();

    store.setState((state) => ({
      ...state,
      timer: {
        ...state.timer,
        running: control.status === "running",
        selectedDuration: control.selectedDuration || state.timer.selectedDuration,
        totalTime: control.totalTime,
        timeLeft: nextTimeLeft,
        sessionMode: control.sessionMode || state.timer.sessionMode,
        pomodoroEnabled: Boolean(control.pomodoroEnabled),
        pomodoroPhase: control.pomodoroPhase || "work",
        pomodoroCycle: control.pomodoroCycle || 0,
        cumulativeFocusSeconds: control.cumulativeFocusSeconds || 0,
        phaseStartedAt: control.startedAt,
        phaseInitialTime: control.totalTime,
        distractionCount: 0,
        distractionPenaltyTotal: 0,
        distractionLog: [],
        blurStartedAt: null,
        lastActivityAt: Date.now(),
        distractionHandled: false
      }
    }));

    if (control.status === "running") {
      beginTicker();
    }
  }

  function reset() {
    stopIntervals();
    store.setState((state) => ({
      ...state,
      timer: {
        ...state.timer,
        running: false,
        totalTime: state.timer.selectedDuration,
        timeLeft: state.timer.selectedDuration,
        phaseStartedAt: null,
        phaseInitialTime: state.timer.selectedDuration,
        distractionCount: 0,
        realDistractionCount: 0,
        contextSwitchCount: 0,
        idleEventCount: 0,
        distractionPenaltyTotal: 0,
        idlePenaltyTotal: 0,
        contextSwitchPenaltyTotal: 0,
        distractionLog: [],
        contextSwitchLog: [],
        idleLog: [],
        blurStartedAt: null,
        pomodoroEnabled: false,
        pomodoroPhase: "work",
        pomodoroCycle: 0,
        cumulativeFocusSeconds: 0,
        distractionHandled: false,
        sessionStartedAt: null,
        idleNudgeAt: null,
        basePoints: 0,
        bonusPoints: 0,
        bonuses: {
          cleanSession: false,
          deepFocus: false,
          consistency: false,
          recovery: false
        },
        deepFocusStartTime: null,
        lastSwitchTime: null,
        recoveryDetected: false
      }
    }));
  }

  function clearAfterSession() {
    stopIntervals();
    store.setState((state) => ({
      ...state,
      timer: {
        ...state.timer,
        running: false,
        totalTime: state.timer.selectedDuration,
        timeLeft: 0,
        phaseStartedAt: null,
        phaseInitialTime: state.timer.selectedDuration,
        distractionCount: 0,
        realDistractionCount: 0,
        contextSwitchCount: 0,
        idleEventCount: 0,
        distractionPenaltyTotal: 0,
        idlePenaltyTotal: 0,
        contextSwitchPenaltyTotal: 0,
        distractionLog: [],
        contextSwitchLog: [],
        idleLog: [],
        blurStartedAt: null,
        pomodoroEnabled: false,
        pomodoroPhase: "work",
        pomodoroCycle: 0,
        cumulativeFocusSeconds: 0,
        distractionHandled: false,
        sessionStartedAt: null,
        idleNudgeAt: null,
        basePoints: 0,
        bonusPoints: 0,
        bonuses: {
          cleanSession: false,
          deepFocus: false,
          consistency: false,
          recovery: false
        },
        deepFocusStartTime: null,
        lastSwitchTime: null,
        recoveryDetected: false
      }
    }));
  }

  function recordIdleEvent(awaySeconds = 0) {
    const state = store.getState();
    if (!state.timer.running) {
      return;
    }

    const penalty = IDLE_PENALTY;
    const nextCount = state.timer.idleEventCount + 1;

    store.setState((current) => ({
      ...current,
      timer: {
        ...current.timer,
        idleEventCount: nextCount,
        idlePenaltyTotal: current.timer.idlePenaltyTotal + penalty,
        idleLog: [
          ...current.timer.idleLog,
          {
            reason: "Idle detection",
            duration: awaySeconds,
            penalty,
            recordedAt: Date.now()
          }
        ]
      }
    }));
  }

  function recordContextSwitch(reason, awaySeconds = 0) {
    const state = store.getState();
    if (!state.timer.running) {
      return;
    }

    const nextCount = state.timer.contextSwitchCount + 1;
    const penalty = nextCount > CONTEXT_SWITCH_FREE_LIMIT ? CONTEXT_SWITCH_PENALTY : 0;

    store.setState((current) => ({
      ...current,
      timer: {
        ...current.timer,
        contextSwitchCount: nextCount,
        contextSwitchPenaltyTotal: current.timer.contextSwitchPenaltyTotal + penalty,
        contextSwitchLog: [
          ...current.timer.contextSwitchLog,
          {
            reason,
            duration: awaySeconds,
            penalty,
            recordedAt: Date.now()
          }
        ],
        lastSwitchTime: Date.now()
      }
    }));

    // Check for recovery bonus - user had distraction but continued
    if (state.timer.realDistractionCount > 0 && !state.timer.recoveryDetected) {
      store.setState((current) => ({
        ...current,
        timer: {
          ...current.timer,
          recoveryDetected: true,
          bonuses: {
            ...current.timer.bonuses,
            recovery: true
          }
        }
      }));
    }

    handlers.onContextSwitch?.({ awaySeconds, contextSwitchCount: nextCount });
  }

  function recordDistraction(reason, awaySeconds = 0, isPanicSwitch = false, isSingleTabMode = false) {
    const state = store.getState();
    if (!state.timer.running) {
      return;
    }

    // Calculate penalty based on panic switch and mode
    let penalty = REAL_DISTRACTION_PENALTY; // -15 for real distractions in single-tab mode
    
    // Panic switch (within first 30 seconds) has different penalties
    if (isPanicSwitch) {
      penalty = isSingleTabMode ? PANIC_SWITCH_PENALTY_SINGLE : PANIC_SWITCH_PENALTY_MULTI; // -5 for single, 0 for multi
    }

    const nextCount = state.timer.realDistractionCount + 1;

    store.setState((current) => ({
      ...current,
      timer: {
        ...current.timer,
        distractionCount: current.timer.distractionCount + 1,
        realDistractionCount: nextCount,
        distractionPenaltyTotal: current.timer.distractionPenaltyTotal + penalty,
        distractionLog: [
          ...current.timer.distractionLog,
          {
            reason,
            duration: awaySeconds,
            penalty,
            recordedAt: Date.now(),
            type: "real",
            isPanicSwitch
          }
        ]
      }
    }));

    handlers.onDistraction?.({ awaySeconds, distractionCount: nextCount, isPanicSwitch });
  }

  function clearDistractionTracking(awaySeconds = 0) {
    store.setState((current) => ({
      ...current,
      timer: {
        ...current.timer,
        blurStartedAt: null,
        distractionHandled: false
      }
    }));

    const state = store.getState();
    // Multi-tab mode is default (anything other than "singletab")
    const isMultiTabMode = state.ui?.tabMode !== "singletab";
    
    if (awaySeconds >= 10) {
      // In multi-tab mode, only show modal after 5 context switches
      if (isMultiTabMode && (state.timer?.contextSwitchCount || 0) < 5) {
        // Don't show modal - first 5 switches are free in multi-tab mode
        return;
      }
      feedback.showDistractionModal(`You were away for ${awaySeconds} seconds.`);
    }

    handlers.onDistractionCleared?.({ awaySeconds });
  }

  function bindAttentionTracking() {
    const markActive = () => {
      store.setState((state) => ({
        ...state,
        timer: {
          ...state.timer,
          lastActivityAt: Date.now()
        }
      }));
    };

    ["mousemove", "keydown", "touchstart", "pointerdown"].forEach((eventName) => {
      window.addEventListener(eventName, markActive);
    });

    const handleBlur = () => {
      const state = store.getState();
      if (!state.timer.running || state.timer.distractionHandled) {
        return;
      }

      const sessionDuration = Date.now() - (state.timer.sessionStartedAt || Date.now());
      const isPanicSwitch = sessionDuration < 30000; // Less than 30 seconds
      const isSingleTabMode = state.ui.tabMode === "singletab";

      // Real distraction: single-tab mode only
      // Context switch: multi-tab mode (with free limit)
      if (isSingleTabMode) {
        recordDistraction(
          isPanicSwitch ? "Early switch detected" : "Tab switch (single-tab)",
          0,
          isPanicSwitch,
          true
        );
      } else {
        // Context switch: multi-tab mode
        recordContextSwitch("Context switch", 0);
      }

      store.setState((current) => ({
        ...current,
        timer: {
          ...current.timer,
          blurStartedAt: Date.now(),
          distractionHandled: true
        }
      }));

      // Start away penalty timer for single-tab mode
      if (isSingleTabMode) {
        startAwayPenaltyTimer(Date.now());
      }
    };

    window.addEventListener("blur", handleBlur);

    window.addEventListener("focus", () => {
      const state = store.getState();
      if (!state.timer.running || !state.timer.blurStartedAt) {
        return;
      }

      // Stop the away penalty timer
      stopAwayPenaltyTimer();

      const awaySeconds = Math.round((Date.now() - state.timer.blurStartedAt) / 1000);
      
      // Log consolidated away penalty if accumulated
      const awayPenalty = state.timer.awayPenaltyAccumulated || 0;
      if (awayPenalty > 0) {
        store.setState((current) => ({
          ...current,
          timer: {
            ...current.timer,
            distractionPenaltyTotal: current.timer.distractionPenaltyTotal + awayPenalty,
            distractionLog: [
              ...current.timer.distractionLog,
              {
                reason: "Away penalty",
                duration: awaySeconds,
                penalty: awayPenalty,
                recordedAt: Date.now(),
                type: "away",
                isAwayPenalty: true
              }
            ],
            awayPenaltyAccumulated: 0,
            awayPenaltyDuration: 0
          }
        }));
      }
      
      clearDistractionTracking(awaySeconds);
    });

    document.addEventListener("visibilitychange", () => {
      const state = store.getState();
      if (!state.timer.running) {
        return;
      }

      if (document.hidden) {
        if (!state.timer.distractionHandled) {
          const sessionDuration = Date.now() - (state.timer.sessionStartedAt || Date.now());
          const isPanicSwitch = sessionDuration < 30000; // Less than 30 seconds
          const isSingleTabMode = state.ui.tabMode === "singletab";

          // Real distraction: single-tab mode only
          if (isSingleTabMode) {
            recordDistraction(
              isPanicSwitch ? "Early switch detected" : "Tab hidden (single-tab)",
              0,
              isPanicSwitch,
              true
            );
          } else {
            // Context switch: multi-tab mode
            recordContextSwitch("Context switch", 0);
          }

          store.setState((current) => ({
            ...current,
            timer: {
              ...current.timer,
              blurStartedAt: Date.now(),
              distractionHandled: true
            }
          }));

          // Start away penalty timer for single-tab mode
          if (isSingleTabMode) {
            startAwayPenaltyTimer(Date.now());
          }
        }
        return;
      }

      if (state.timer.blurStartedAt) {
        // Stop the away penalty timer
        stopAwayPenaltyTimer();

        const awaySeconds = Math.round((Date.now() - state.timer.blurStartedAt) / 1000);
        
        // Log consolidated away penalty if accumulated
        const awayPenalty = state.timer.awayPenaltyAccumulated || 0;
        if (awayPenalty > 0) {
          store.setState((current) => ({
            ...current,
            timer: {
              ...current.timer,
              distractionPenaltyTotal: current.timer.distractionPenaltyTotal + awayPenalty,
              distractionLog: [
                ...current.timer.distractionLog,
                {
                  reason: "Away penalty",
                  duration: awaySeconds,
                  penalty: awayPenalty,
                  recordedAt: Date.now(),
                  type: "away",
                  isAwayPenalty: true
                }
              ],
              awayPenaltyAccumulated: 0,
              awayPenaltyDuration: 0
            }
          }));
        }
        
        clearDistractionTracking(awaySeconds);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(event.target.tagName)) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        handlers.onToggleSession?.();
      }

      if (event.code === "Escape") {
        handlers.onEscape?.();
      }

      if (event.code === "KeyR" && !store.getState().timer.running) {
        reset();
      }
    });
  }

  function setSessionMode(mode) {
    if (!SESSION_MODES[mode] || store.getState().timer.running) {
      return;
    }

    store.setState((state) => ({
      ...state,
      timer: {
        ...state.timer,
        sessionMode: mode
      }
    }));
  }

  function getFocusedSeconds() {
    const state = store.getState();
    const liveTimeLeft = state.timer.phaseStartedAt
      ? getPreciseTimeLeft(state.timer.phaseStartedAt, state.timer.phaseInitialTime)
      : state.timer.timeLeft;
    const liveFocused = state.timer.phaseStartedAt && (!state.timer.pomodoroEnabled || state.timer.pomodoroPhase === "work")
      ? state.timer.phaseInitialTime - liveTimeLeft
      : 0;
    return Math.max(0, state.timer.cumulativeFocusSeconds + liveFocused);
  }

  function getSessionDiagnostics() {
    const state = store.getState();
    const now = Date.now();
    const sessionDuration = state.timer.sessionStartedAt 
      ? Math.floor((now - state.timer.sessionStartedAt) / 1000)
      : 0;
    const focusedSeconds = getFocusedSeconds();
    
    // Calculate bonuses
    const bonuses = { ...state.timer.bonuses };
    
    // Clean session bonus: no real distractions
    if (state.timer.realDistractionCount === 0) {
      bonuses.cleanSession = true;
    }
    
    // Consistency bonus: no idle events
    if (state.timer.idleEventCount === 0) {
      bonuses.consistency = true;
    }
    
    // Deep focus bonus: no switching for 5+ minutes
    // This is tracked if user hasn't switched in first 5 minutes
    const fiveMinutes = 5 * 60;
    if (focusedSeconds >= fiveMinutes && state.timer.contextSwitchCount === 0 && state.timer.realDistractionCount === 0) {
      bonuses.deepFocus = true;
    }
    
    return {
      timeSpent: focusedSeconds,
      totalSessionTime: sessionDuration,
      distractions: state.timer.distractionCount,
      realDistractions: state.timer.realDistractionCount,
      contextSwitches: state.timer.contextSwitchCount,
      idleEvents: state.timer.idleEventCount,
      penaltyTotal: state.timer.distractionPenaltyTotal,
      idlePenaltyTotal: state.timer.idlePenaltyTotal,
      contextSwitchPenaltyTotal: state.timer.contextSwitchPenaltyTotal,
      distractionLog: state.timer.distractionLog.map((entry) => ({ ...entry })),
      contextSwitchLog: state.timer.contextSwitchLog.map((entry) => ({ ...entry })),
      idleLog: state.timer.idleLog.map((entry) => ({ ...entry })),
      sessionMode: state.timer.sessionMode,
      tabMode: state.ui.tabMode,
      bonuses,
      recoveryDetected: state.timer.recoveryDetected
    };
  }

  return {
    setHandlers,
    bindAttentionTracking,
    setDuration,
    applyCustomMinutes,
    togglePomodoro,
    start,
    stopRuntime,
    syncRemoteTimer,
    reset,
    clearAfterSession,
    setSessionMode,
    getSessionDiagnostics
  };
}
