import type { NubiState } from "./nubiState";

export type NubiDesireType =
  | "hunger"
  | "thirst"
  | "rest"
  | "comfort"
  | "play"
  | "curiosity"
  | "mischief"
  | "social"
  | "cleanliness"
  | "bathroom"
  | "recovery"
  | "idle";

export type NubiDesire = {
  type: NubiDesireType;
  strength: number;
  reason: string;
};

/**
 * Convierte el estado actual de Nubi en deseos internos.
 *
 * Este módulo NO ejecuta acciones.
 * NO modifica el estado.
 * NO llama a Gemini.
 *
 * Solamente responde:
 *
 * "¿Qué quiere Nubi ahora mismo?"
 */
export function calculateNubiDesires(
  state: NubiState,
  recentChatActivity = 0,
): NubiDesire[] {
  const desires: NubiDesire[] = [];

  /*
   * NECESIDADES FÍSICAS
   */

  desires.push({
    type: "hunger",
    strength: Math.max(0, 100 - state.hunger),
    reason:
      state.hunger < 40
        ? "Nubi empieza a sentir hambre."
        : "Nubi no necesita comer todavía.",
  });

  desires.push({
    type: "thirst",
    strength: Math.max(0, 100 - state.thirst),
    reason:
      state.thirst < 40
        ? "Nubi empieza a sentir sed."
        : "Nubi no necesita beber todavía.",
  });

  desires.push({
    type: "rest",
    strength: Math.max(0, 100 - state.energy),
    reason:
      state.energy < 40
        ? "Nubi empieza a sentirse cansada."
        : "Nubi todavía tiene energía.",
  });

  desires.push({
    type: "cleanliness",
    strength: Math.max(0, 100 - state.hygiene),
    reason:
      state.hygiene < 40
        ? "Nubi empieza a sentirse sucia."
        : "Nubi está bastante limpia.",
  });

  desires.push({
    type: "bathroom",
    strength: state.bathroom,
    reason:
      state.bathroom > 60
        ? "Nubi necesita ir al baño."
        : "Nubi no necesita ir al baño todavía.",
  });

  /*
   * SALUD
   */

  if (state.illness === "sick") {
    desires.push({
      type: "recovery",
      strength: 100,
      reason:
        "Nubi está enferma y necesita sentirse cuidada.",
    });
  } else if (state.health < 50) {
    desires.push({
      type: "recovery",
      strength: 70,
      reason:
        "Nubi no se siente completamente bien.",
    });
  }

  /*
   * CARIÑO Y COMPAÑÍA
   *
   * Aquí la personalidad empieza a cambiar
   * lo que Nubi desea.
   */

  const comfortDesire =
    state.personality.affectionate * 0.65 +
    (100 - state.love) * 0.25 +
    (100 - state.social) * 0.1 +
    recentChatActivity * 8;

  desires.push({
    type: "comfort",
    strength: Math.min(100, Math.max(0, comfortDesire)),
    reason:
      "Nubi quiere sentirse querida y acompañada.",
  });

  /*
   * JUGAR
   */

  const playDesire =
    state.personality.playful * 0.55 +
    state.happiness * 0.2 +
    state.social * 0.15 +
    state.energy * 0.1 -
    (100 - state.hunger) * 0.15 -
    (100 - state.thirst) * 0.15;

  desires.push({
    type: "play",
    strength: Math.min(100, Math.max(0, playDesire)),
    reason:
      "Nubi siente ganas de jugar y divertirse.",
  });

  /*
   * CURIOSIDAD
   *
   * La actividad del chat puede despertar
   * curiosidad aunque nadie esté hablando
   * directamente con Nubi.
   */

  const curiosityDesire =
    state.personality.curiosity * 0.75 +
    recentChatActivity * 20;

  desires.push({
    type: "curiosity",
    strength: Math.min(
      100,
      Math.max(0, curiosityDesire),
    ),
    reason:
      "Algo podría llamar la atención de Nubi.",
  });

  /*
   * TRAVESURA
   */

  const mischiefDesire =
    state.personality.mischievous * 0.7 +
    state.happiness * 0.15 +
    recentChatActivity * 15 -
    (100 - state.energy) * 0.15;

  desires.push({
    type: "mischief",
    strength: Math.min(
      100,
      Math.max(0, mischiefDesire),
    ),
    reason:
      "Nubi siente ganas de hacer alguna travesura.",
  });

  /*
   * SOCIAL
   */

  const socialDesire =
    (100 - state.social) * 0.6 +
    state.personality.affectionate * 0.25 +
    recentChatActivity * 15;

  desires.push({
    type: "social",
    strength: Math.min(
      100,
      Math.max(0, socialDesire),
    ),
    reason:
      "Nubi quiere interactuar con alguien.",
  });

  /*
   * IDLE
   *
   * Este deseo es deliberadamente bajo.
   * Sirve para que Nubi pueda simplemente existir.
   */

  desires.push({
    type: "idle",
    strength:
      state.happiness >= 60 &&
      state.energy >= 50
        ? 15
        : 5,
    reason:
      "Nubi está tranquila y no necesita nada urgente.",
  });

  return desires.sort(
    (a, b) => b.strength - a.strength,
  );
}
