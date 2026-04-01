import {
  BADGES,
  LEVELS,
  POINTS_PER_MINUTE,
  REAL_DISTRACTION_PENALTY,
  CONTEXT_SWITCH_FREE_LIMIT,
  CONTEXT_SWITCH_PENALTY,
  IDLE_PENALTY,
  PANIC_SWITCH_PENALTY_SINGLE,
  PANIC_SWITCH_PENALTY_MULTI,
  BONUS_CLEAN_SESSION,
  BONUS_DEEP_FOCUS,
  BONUS_CONSISTENCY,
  BONUS_RECOVERY,
  DEEP_FOCUS_THRESHOLD_MINUTES,
  STREAK_MIN_SESSION_MINUTES,
  SESSION_MODES
} from "./constants.js";

export function calculateBasePoints(focusedSeconds) {
  return (POINTS_PER_MINUTE / 60) * focusedSeconds;
}

export function calculateContextSwitchPenalty(switchCount) {
  if (switchCount <= CONTEXT_SWITCH_FREE_LIMIT) {
    return 0;
  }
  return (switchCount - CONTEXT_SWITCH_FREE_LIMIT) * CONTEXT_SWITCH_PENALTY;
}

export function calculateTotalPenalties(realDistractions, contextSwitches, idleEvents) {
  const distractionPenalty = realDistractions * REAL_DISTRACTION_PENALTY;
  const contextPenalty = calculateContextSwitchPenalty(contextSwitches);
  const idlePenalty = idleEvents * IDLE_PENALTY;
  return {
    distraction: distractionPenalty,
    contextSwitch: contextPenalty,
    idle: idlePenalty,
    total: distractionPenalty + contextPenalty + idlePenalty
  };
}

export function calculateBonuses(bonuses) {
  let total = 0;
  const breakdown = {};
  
  if (bonuses.cleanSession) {
    total += BONUS_CLEAN_SESSION;
    breakdown.cleanSession = BONUS_CLEAN_SESSION;
  }
  if (bonuses.deepFocus) {
    total += BONUS_DEEP_FOCUS;
    breakdown.deepFocus = BONUS_DEEP_FOCUS;
  }
  if (bonuses.consistency) {
    total += BONUS_CONSISTENCY;
    breakdown.consistency = BONUS_CONSISTENCY;
  }
  if (bonuses.recovery) {
    total += BONUS_RECOVERY;
    breakdown.recovery = BONUS_RECOVERY;
  }
  
  return { total, breakdown };
}

export function calculateEfficiency(focusedSeconds, totalSessionSeconds) {
  if (totalSessionSeconds <= 0) return 100;
  return Math.round((focusedSeconds / totalSessionSeconds) * 100);
}

export function getFocusRating(efficiency) {
  if (efficiency >= 90) return { label: "Deep Focus", icon: "🔥", class: "excellent" };
  if (efficiency >= 70) return { label: "Good Focus", icon: "👍", class: "good" };
  if (efficiency >= 50) return { label: "Distracted", icon: "⚠️", class: "warning" };
  return { label: "Lost Focus", icon: "❌", class: "poor" };
}

export function calculateSessionScore(focusedSeconds, bonuses, penalties) {
  const basePoints = calculateBasePoints(focusedSeconds);
  const bonusData = calculateBonuses(bonuses);
  const totalScore = Math.max(0, basePoints - penalties.total + bonusData.total);
  
  return {
    basePoints,
    bonusPoints: bonusData.total,
    bonusBreakdown: bonusData.breakdown,
    penaltyTotal: penalties.total,
    penaltyBreakdown: penalties,
    total: Math.round(totalScore)
  };
}

export function calculateMomentum(currentScore, previousScore) {
  return currentScore - (previousScore || 0);
}

export function shouldResetStreak(sessionMinutes, distractionCount) {
  return sessionMinutes < STREAK_MIN_SESSION_MINUTES || distractionCount > 5;
}

export function getLevelInfo(totalMinutes) {
  return [...LEVELS].reverse().find((level) => totalMinutes >= level.min) || LEVELS[0];
}

export function checkBadges(stats) {
  return BADGES.filter((badge) => badge.check(stats)).map((badge) => badge.id);
}

export function getFeedbackBucket(distractionCount) {
  if (distractionCount === 0) {
    return "clean";
  }

  if (distractionCount <= 3) {
    return "steady";
  }

  return "rough";
}
