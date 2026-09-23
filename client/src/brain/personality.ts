
import type { ChatAction } from "../chat/interpreter";
import type { NubiState } from "./nubiState";

export type NubiMood =
  | "happy"
  | "excited"
  | "sleepy"
  | "hungry"
  | "thirsty"
  | "affectionate"
  | "mischievous"
  | "grumpy"
  | "curious"
  | "normal";

export type PersonalityReaction = {
  mood: NubiMood;
  response: string;
  animation: string;
};

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

export function getNubiMood(state: NubiState): NubiMood {
  if (state.energy <= 15) {
    return "sleepy";
  }

  if (state.hunger <= 20) {
    return "hungry";
  }

  if (state.thirst <= 20) {
    return "thirsty";
  }

  if (state.happiness <= 20) {
    return "grumpy";
  }

  if (state.personality.mischievous >= 80) {
    return "mischievous";
  }

  if (state.personality.affectionate >= 85 && state.love >= 20) {
    return "affectionate";
  }

  if (state.personality.curiosity >= 80) {
    return "curious";
  }

  if (state.happiness >= 85) {
    return "excited";
  }

  return "normal";
}

export function createReaction(
  state: NubiState,
  action: ChatAction,
): PersonalityReaction {
  const mood = getNubiMood(state);

  if (action === "kiss") {
    if (state.personality.affectionate >= 85) {
      return {
        mood: "affectionate",
        response: randomItem([
          "Nubi recibe el besito y se pone feliz 🥰💕",
          "Nubi se queda todo tímido después del besito 🫣💕",
          "Nubi devuelve el besito 😘",
        ]),
        animation: "kiss",
      };
    }

    if (state.personality.mischievous >= 75) {
      return {
        mood: "mischievous",
        response: "Nubi esquiva el beso y sale corriendo 😂💨",
        animation: "dodge",
      };
    }

    return {
      mood,
      response: "Nubi se pone tímido 🫣",
      animation: "shy",
    };
  }

  if (action === "hug") {
    return {
      mood: "affectionate",
      response: randomItem([
        "Nubi da un abrazote 🥰",
        "Nubi se queda abrazadito 💕",
        "Nubi abraza al chat entero 🤗",
      ]),
      animation: "hug",
    };
  }

  if (action === "pet") {
    if (state.personality.affectionate >= 80) {
      return {
        mood: "affectionate",
        response: "Nubi está disfrutando las caricias 🥰",
        animation: "happy",
      };
    }

    return {
      mood,
      response: "Nubi mueve la cabecita mientras lo acarician 😊",
      animation: "pet",
    };
  }

  if (action === "play") {
    if (state.energy <= 25) {
      return {
        mood: "sleepy",
        response: "Nubi quiere jugar... pero se está cayendo de sueño 🥱",
        animation: "sleepy",
      };
    }

    return {
      mood: "excited",
      response: randomItem([
        "¡Nubi quiere jugar! 🎮",
        "Nubi sale corriendo a jugar 😂",
        "¡SÍÍÍ! ¡A jugar! 🎉",
      ]),
      animation: "play",
    };
  }

  if (action === "feed") {
    if (state.hunger >= 90) {
      return {
        mood: "happy",
        response: "Nubi mira la comida... pero está llenísimo 😵‍💫",
        animation: "full",
      };
    }

    return {
      mood: "happy",
      response: randomItem([
        "¡ÑAM ÑAM! Nubi está comiendo 🍎",
        "Nubi corre hacia la comida 🏃🍎",
        "Nubi se pone feliz porque hay comida 😋",
      ]),
      animation: "eat",
    };
  }

  if (action === "drink") {
    return {
      mood: "happy",
      response: randomItem([
        "¡Glup glup! Nubi está bebiendo agua 💧",
        "Nubi tenía sed 😳💧",
        "Nubi se toma el agua de un tirón 💧",
      ]),
      animation: "drink",
    };
  }

  if (action === "bath") {
    if (state.personality.mischievous >= 75) {
      return {
        mood: "mischievous",
        response: "Nubi intenta escapar del baño 😂🚿",
        animation: "escape",
      };
    }

    return {
      mood: "happy",
      response: "Nubi se está bañando 🛁✨",
      animation: "bath",
    };
  }

  if (action === "toilet") {
    return {
      mood: "normal",
      response: randomItem([
        "Nubi va corriendo al baño 💨🚽",
        "Nubi desaparece un momentito... 🚽😂",
        "Nubi dice que necesita privacidad 😳🚽",
      ]),
      animation: "toilet",
    };
  }

  if (action === "sleep") {
    return {
      mood: "sleepy",
      response: "Nubi se acurruca y se queda dormido 😴💤",
      animation: "sleep",
    };
  }

  if (action === "greet") {
    return {
      mood: "happy",
      response: randomItem([
        "¡Hola, chat! 👋💕",
        "Nubi saluda a todos 👋",
        "¡Nubiii está aquí! 😄",
      ]),
      animation: "wave",
    };
  }

  if (action === "dance") {
    return {
      mood: "excited",
      response: "¡Nubi se puso a bailar! 💃😂",
      animation: "dance",
    };
  }

  if (action === "laugh") {
    return {
      mood: "happy",
      response: "Nubi se está riendo 😂",
      animation: "laugh",
    };
  }

  if (action === "comfort") {
    return {
      mood: "affectionate",
      response: "Nubi se acerca y da un abracito 🥺💕",
      animation: "comfort",
    };
  }

  return {
    mood,
    response: "Nubi te está mirando 👀",
    animation: "idle",
  };
}
