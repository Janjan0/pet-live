import type { ChatAction } from "../chat/interpreter";

export type PersonalityHistory = {
  affection: number;
  care: number;
  play: number;
  mischief: number;
  curiosity: number;
  gifts: number;

  totalInteractions: number;

  recentActions: ChatAction[];
};

const MAX_RECENT_ACTIONS = 40;

export function createPersonalityHistory(): PersonalityHistory {
  return {
    affection: 0,
    care: 0,
    play: 0,
    mischief: 0,
    curiosity: 0,
    gifts: 0,

    totalInteractions: 0,

    recentActions: [],
  };
}

function isAffectionAction(
  action: ChatAction,
): boolean {
  return (
    action === "pet" ||
    action === "hug" ||
    action === "kiss" ||
    action === "comfort"
  );
}

function isCareAction(
  action: ChatAction,
): boolean {
  return (
    action === "feed" ||
    action === "drink" ||
    action === "bath" ||
    action === "toilet" ||
    action === "sleep"
  );
}

function isPlayAction(
  action: ChatAction,
): boolean {
  return (
    action === "play" ||
    action === "dance"
  );
}

function isMischiefAction(
  action: ChatAction,
): boolean {
  return action === "tease";
}

function isCuriosityAction(
  action: ChatAction,
): boolean {
  return (
    action === "greet" ||
    action === "wake"
  );
}

export function recordPersonalityInteraction(
  history: PersonalityHistory,
  action: ChatAction,
  gift = false,
): PersonalityHistory {
  if (action === "none") {
    return history;
  }

  return {
    ...history,

    affection:
      history.affection +
      (isAffectionAction(action) ? 1 : 0),

    care:
      history.care +
      (isCareAction(action) ? 1 : 0),

    play:
      history.play +
      (isPlayAction(action) ? 1 : 0),

    mischief:
      history.mischief +
      (isMischiefAction(action) ? 1 : 0),

    curiosity:
      history.curiosity +
      (isCuriosityAction(action) ? 1 : 0),

    gifts:
      history.gifts +
      (gift ? 1 : 0),

    totalInteractions:
      history.totalInteractions + 1,

    recentActions: [
      ...history.recentActions,
      action,
    ].slice(-MAX_RECENT_ACTIONS),
  };
}

export type PersonalityTrend = {
  affection: number;
  care: number;
  play: number;
  mischief: number;
  curiosity: number;
};

export function calculatePersonalityTrend(
  history: PersonalityHistory,
): PersonalityTrend {
  const total =
    history.affection +
    history.care +
    history.play +
    history.mischief +
    history.curiosity;

  if (total <= 0) {
    return {
      affection: 0,
      care: 0,
      play: 0,
      mischief: 0,
      curiosity: 0,
    };
  }

  return {
    affection:
      history.affection / total,

    care:
      history.care / total,

    play:
      history.play / total,

    mischief:
      history.mischief / total,

    curiosity:
      history.curiosity / total,
  };
}
