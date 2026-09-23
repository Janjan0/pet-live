import type { ChatAction } from "../chat/interpreter";
import type { NubiState } from "./nubiState";

export type PriorityResult = {
  allowed: boolean;
  reason?: string;
};

const cooldowns: Record<ChatAction, number> = {
  feed: 8,
  drink: 5,
  pet: 2,
  hug: 3,
  kiss: 3,
  play: 6,
  dance: 6,
  sleep: 10,
  wake: 4,
  bath: 15,
  toilet: 8,
  greet: 2,
  laugh: 2,
  comfort: 3,
  tease: 4,
  none: 0,
};

export function canPerformAction(
  state: NubiState,
  action: ChatAction,
  now = Date.now(),
): PriorityResult {
  if (action === "none") {
    return {
      allowed: false,
      reason: "Nubi no entendió la intención.",
    };
  }

  const cooldownUntil = state.cooldowns[action] ?? 0;

  if (cooldownUntil > now) {
    return {
      allowed: false,
      reason: "Nubi acaba de hacer eso.",
    };
  }

  switch (action) {
    case "feed":
      if (state.hunger >= 95) {
        return {
          allowed: false,
          reason: "Nubi está lleno.",
        };
      }
      break;

    case "drink":
      if (state.thirst >= 95) {
        return {
          allowed: false,
          reason: "Nubi no tiene sed.",
        };
      }
      break;

    case "play":
    case "dance":
      if (state.energy <= 10) {
        return {
          allowed: false,
          reason: "Nubi está demasiado cansado.",
        };
      }
      break;

    case "sleep":
      if (state.energy >= 90) {
        return {
          allowed: false,
          reason: "Nubi no tiene sueño.",
        };
      }
      break;

    default:
      break;
  }

  return { allowed: true };
}

export function getCooldownUntil(
  action: ChatAction,
  now = Date.now(),
): number {
  return now + cooldowns[action] * 1000;
}
