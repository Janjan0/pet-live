
import type { ChatInterpretation, ChatAction } from "../chat/interpreter";
import { applyChatAction, changeStat } from "../game/actions";
import {
  canPerformAction,
  getCooldownUntil,
} from "./priorities";
import {
  createReaction,
  type PersonalityReaction,
} from "./personality";
import type { NubiState } from "./nubiState";

export type BrainResult = {
  state: NubiState;
  accepted: boolean;
  response: string;
  action: ChatAction;
  reason?: string;
  reaction?: PersonalityReaction;
};

function applyDelta(
  state: NubiState,
  delta: ReturnType<typeof applyChatAction>,
): NubiState {
  return {
    ...state,

    hunger:
      delta.hunger !== undefined
        ? changeStat(state.hunger, delta.hunger)
        : state.hunger,

    thirst:
      delta.thirst !== undefined
        ? changeStat(state.thirst, delta.thirst)
        : state.thirst,

    happiness:
      delta.happiness !== undefined
        ? changeStat(state.happiness, delta.happiness)
        : state.happiness,

    energy:
      delta.energy !== undefined
        ? changeStat(state.energy, delta.energy)
        : state.energy,

    health:
      delta.health !== undefined
        ? changeStat(state.health, delta.health)
        : state.health,

    love:
      delta.love !== undefined
        ? changeStat(state.love, delta.love)
        : state.love,

    social:
      delta.social !== undefined
        ? changeStat(state.social, delta.social)
        : state.social,

    hygiene:
      delta.hygiene !== undefined
        ? changeStat(state.hygiene, delta.hygiene)
        : state.hygiene,

    bathroom:
      delta.bathroom !== undefined
        ? changeStat(state.bathroom, delta.bathroom)
        : state.bathroom,

    experience:
      delta.experience !== undefined
        ? state.experience + delta.experience
        : state.experience,
  };
}

function rejectedResponse(action: ChatAction, reason: string): string {
  if (action === "feed") {
    return "Nubi está lleno 😵‍💫";
  }

  if (action === "drink") {
    return "Nubi no tiene sed ahora mismo 💧";
  }

  if (action === "play" || action === "dance") {
    return "Nubi está demasiado cansado 🥱";
  }

  if (action === "sleep") {
    return "Nubi todavía no tiene sueño 👀";
  }

  return `Nubi no puede hacer eso ahora. ${reason}`;
}

export type BrainActionSource =
  | "viewer"
  | "autonomous";

export function processComment(
  state: NubiState,
  interpretation: ChatInterpretation,
  user = "Anónimo",
  now = Date.now(),
  source: BrainActionSource = "viewer",
): BrainResult {
  const { action } = interpretation;

  if (action === "none") {
    const sentiment =
      interpretation.sentiment ?? "neutral";

    const addressedToNubi =
      interpretation.addressedToNubi ?? false;

    if (addressedToNubi) {
      let response = "Nubi te está escuchando 👀🐾";

      if (sentiment === "positive") {
        response =
          state.personality.affectionate >= 85
            ? "Nubi se derrite de amor 🥹❤️"
            : "Nubi se puso feliz de escucharte ❤️🐾";
      } else if (sentiment === "playful") {
        response =
          state.personality.mischievous >= 75
            ? "Nubi te está mirando con cara de travesura 😏🐾"
            : "Nubi se ríe contigo 😂🐾";
      } else if (sentiment === "negative") {
        response =
          state.personality.affectionate >= 80
            ? "Nubi se acerca a ti con cariño 🥺🐾"
            : "Nubi se quedó mirando con curiosidad 👀🐾";
      }

      return {
        state: {
          ...state,
          currentAction: null,
          ...(source === "viewer"
            ? {
                lastInteraction: {
                  user,
                  action: "none",
                  timestamp: now,
                },
              }
            : {}),
        },
        accepted: true,
        response,
        action,
        reaction: {
          mood:
            sentiment === "playful"
              ? "mischievous"
              : sentiment === "positive"
                ? "affectionate"
                : "curious",
          response,
          animation:
            sentiment === "playful"
              ? "bounce"
              : "happy",
        },
      };
    }

    return {
      state,
      accepted: false,
      response: "",
      action,
      reason: "unknown",
    };
  }

  const permission = canPerformAction(state, action, now);

  if (!permission.allowed) {
    return {
      state,
      accepted: false,
      response: rejectedResponse(
        action,
        permission.reason ?? "Nubi no puede hacerlo ahora.",
      ),
      action,
      reason: permission.reason,
    };
  }

  const delta = applyChatAction(action);
  const nextState = applyDelta(state, delta);

  const updatedState: NubiState = {
    ...nextState,
    currentAction: action,
    ...(source === "viewer"
      ? {
          lastInteraction: {
            user,
            action,
            timestamp: now,
          },
        }
      : {}),
    cooldowns: {
      ...nextState.cooldowns,
      [action]: getCooldownUntil(action, now),
    },
  };

  const reaction = createReaction(updatedState, action);

  return {
    state: updatedState,
    accepted: true,
    response: reaction.response,
    action,
    reaction,
  };
}
