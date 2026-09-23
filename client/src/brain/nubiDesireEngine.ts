import type { NubiDesire, NubiDesireType } from "./nubiDesires";
import type { NubiState } from "./nubiState";

export type NubiDesireDecision = {
  desire: NubiDesireType;
  strength: number;
  reason: string;
};

/**
 * Contexto que puede modificar qué deseo termina imponiéndose.
 */
export type NubiDesireContext = {
  recentChatActivity: number;
};

/**
 * Decide cuál de los deseos internos de Nubi tiene más fuerza
 * en el contexto actual.
 *
 * Este motor:
 * - NO ejecuta acciones.
 * - NO modifica el estado.
 * - NO llama a Gemini.
 *
 * Solamente resuelve el conflicto entre deseos.
 */
export function chooseDominantDesire(
  state: NubiState,
  desires: NubiDesire[],
  context: NubiDesireContext,
): NubiDesireDecision | null {
  if (desires.length === 0) {
    return null;
  }

  const scored = desires.map((desire) => {
    let score = desire.strength;

    /*
     * =====================================================
     * NECESIDADES CRÍTICAS
     * =====================================================
     *
     * Cuando una necesidad física llega a niveles extremos,
     * deja de competir en igualdad de condiciones.
     */

    if (
      desire.type === "thirst" &&
      state.thirst <= 15
    ) {
      score += 100;
    }

    if (
      desire.type === "hunger" &&
      state.hunger <= 15
    ) {
      score += 100;
    }

    if (
      desire.type === "rest" &&
      state.energy <= 15
    ) {
      score += 100;
    }

    if (
      desire.type === "bathroom" &&
      state.bathroom >= 90
    ) {
      score += 100;
    }

    if (
      desire.type === "cleanliness" &&
      state.hygiene <= 15
    ) {
      score += 100;
    }

    if (
      desire.type === "recovery" &&
      state.illness === "sick"
    ) {
      score += 150;
    }

    /*
     * =====================================================
     * CONTEXTO SOCIAL
     * =====================================================
     *
     * Cuando el chat está activo, los deseos sociales,
     * curiosidad y travesura reciben un pequeño empujón.
     */

    if (context.recentChatActivity > 0) {
      if (
        desire.type === "curiosity" ||
        desire.type === "social" ||
        desire.type === "comfort" ||
        desire.type === "mischief"
      ) {
        score += context.recentChatActivity * 8;
      }
    }

    /*
     * =====================================================
     * PERSONALIDAD
     * =====================================================
     *
     * La misma intensidad de deseo no significa lo mismo
     * para todas las Nubis.
     */

    if (desire.type === "play") {
      score += state.personality.playful * 0.08;
    }

    if (desire.type === "comfort") {
      score += state.personality.affectionate * 0.08;
    }

    if (desire.type === "curiosity") {
      score += state.personality.curiosity * 0.08;
    }

    if (desire.type === "mischief") {
      score += state.personality.mischievous * 0.08;
    }

    return {
      desire,
      score: Math.max(0, Math.min(200, score)),
    };
  });

  const maxScore = Math.max(
    ...scored.map((item) => item.score),
  );

  /*
   * No queremos que una diferencia minúscula haga que Nubi
   * sea completamente determinista.
   *
   * Los deseos cercanos pueden competir entre sí.
   */
  const finalists = scored.filter(
    (item) => item.score >= maxScore - 8,
  );

  const selected =
    finalists[
      Math.floor(
        Math.random() * finalists.length,
      )
    ];

  return {
    desire: selected.desire.type,
    strength: selected.score,
    reason: selected.desire.reason,
  };
}
